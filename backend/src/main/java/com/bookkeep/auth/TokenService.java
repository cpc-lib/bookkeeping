package com.bookkeep.auth;

import com.bookkeep.common.BusinessException;
import com.bookkeep.common.ResultCode;
import com.bookkeep.dto.TokenResponse;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Set;
import java.util.concurrent.TimeUnit;

import javax.annotation.PostConstruct;
import javax.crypto.SecretKey;

/**
 * 双Token认证服务
 *
 * 设计说明:
 * 1. accessToken  短期有效(默认2小时), 用于业务接口鉴权
 * 2. refreshToken 长期有效(默认7天), 仅用于刷新accessToken
 * 3. 两种token签发后均写入Redis缓存:
 *      bk:auth:a:{token} -> userId   (accessToken 缓存)
 *      bk:auth:r:{token} -> userId   (refreshToken 缓存)
 *      bk:auth:u:{userId} -> Set<缓存key> (用户token索引, 用于改密后全局下线)
 * 4. 刷新token时旧refreshToken立即失效(轮换), 防止token被重复使用
 * 5. 修改密码后清除该用户全部token, 所有设备强制下线
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TokenService {

    private static final String ACCESS_PREFIX = "bk:auth:a:";
    private static final String REFRESH_PREFIX = "bk:auth:r:";
    private static final String USER_TOKEN_INDEX = "bk:auth:u:";

    private final StringRedisTemplate redis;

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.access-token-expire}")
    private long accessTokenExpire;

    @Value("${jwt.refresh-token-expire}")
    private long refreshTokenExpire;

    private SecretKey signKey;

    @PostConstruct
    public void init() {
        this.signKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * 签发双Token并写入Redis缓存
     */
    public TokenResponse createTokens(Long userId, String username) {
        String accessToken = buildJwt(userId, username, "a", accessTokenExpire);
        String refreshToken = buildJwt(userId, username, "r", refreshTokenExpire);

        // 缓存写入Redis, TTL与token有效期一致
        redis.opsForValue().set(ACCESS_PREFIX + accessToken, String.valueOf(userId),
                accessTokenExpire, TimeUnit.MILLISECONDS);
        redis.opsForValue().set(REFRESH_PREFIX + refreshToken, String.valueOf(userId),
                refreshTokenExpire, TimeUnit.MILLISECONDS);

        // 维护用户token索引
        redis.opsForSet().add(USER_TOKEN_INDEX + userId, ACCESS_PREFIX + accessToken, REFRESH_PREFIX + refreshToken);

        return TokenResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .accessExpire(accessTokenExpire / 1000)
                .refreshExpire(refreshTokenExpire / 1000)
                .build();
    }

    /**
     * 校验accessToken, 返回用户ID
     */
    public Long validateAccessToken(String accessToken) {
        Claims claims = parseToken(accessToken, "a");
        String userId = redis.opsForValue().get(ACCESS_PREFIX + accessToken);
        if (userId == null) {
            // JWT未过期但Redis缓存不存在: 已登出或服务端强制失效
            throw new BusinessException(ResultCode.UNAUTHORIZED);
        }
        return Long.valueOf(userId);
    }

    /**
     * 使用refreshToken换取新的双Token(轮换机制, 旧refreshToken立即失效)
     */
    public TokenResponse refreshTokens(String refreshToken) {
        Claims claims = parseToken(refreshToken, "r");
        Long userId = Long.valueOf(claims.get("uid", String.class));
        String username = claims.get("username", String.class);

        String oldKey = REFRESH_PREFIX + refreshToken;
        String cachedUserId = redis.opsForValue().get(oldKey);
        if (cachedUserId == null) {
            throw new BusinessException(ResultCode.UNAUTHORIZED, "refreshToken已失效, 请重新登录");
        }

        // 旧refreshToken立即失效(一次性使用)
        redis.delete(oldKey);
        redis.opsForSet().remove(USER_TOKEN_INDEX + userId, oldKey);

        return createTokens(userId, username);
    }

    /**
     * 登出: 删除当前设备的token缓存(accessToken已过期时也容错处理)
     */
    public void removeTokens(String accessToken, String refreshToken) {
        Long userId = null;
        // accessToken可能已过期(JWT解析失败), 此时也允许登出清理
        try {
            Claims claims = parseToken(accessToken, "a");
            userId = Long.valueOf(claims.get("uid", String.class));
            redis.delete(ACCESS_PREFIX + accessToken);
            redis.opsForSet().remove(USER_TOKEN_INDEX + userId, ACCESS_PREFIX + accessToken);
        } catch (Exception ignored) {
        }

        if (refreshToken != null && !refreshToken.isEmpty()) {
            redis.delete(REFRESH_PREFIX + refreshToken);
            if (userId == null) {
                try {
                    userId = Long.valueOf(parseToken(refreshToken, "r").get("uid", String.class));
                } catch (Exception ignored) {
                }
            }
            if (userId != null) {
                redis.opsForSet().remove(USER_TOKEN_INDEX + userId, REFRESH_PREFIX + refreshToken);
            }
        }
    }

    /**
     * 使某用户全部token失效(修改密码后调用)
     */
    public void removeAllUserTokens(Long userId) {
        String indexKey = USER_TOKEN_INDEX + userId;
        Set<String> keys = redis.opsForSet().members(indexKey);
        if (keys != null && !keys.isEmpty()) {
            redis.delete(keys);
        }
        redis.delete(indexKey);
        log.info("用户{}的全部登录态已失效", userId);
    }

    /**
     * 解析并校验JWT(签名/有效期/token类型)
     */
    private Claims parseToken(String token, String expectType) {
        Claims claims;
        try {
            claims = Jwts.parserBuilder()
                    .setSigningKey(signKey)
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
        } catch (ExpiredJwtException e) {
            throw new BusinessException(ResultCode.UNAUTHORIZED, "登录已过期, 请刷新或重新登录");
        } catch (Exception e) {
            throw new BusinessException(ResultCode.UNAUTHORIZED, "无效的凭证");
        }
        if (!expectType.equals(claims.get("type", String.class))) {
            throw new BusinessException(ResultCode.UNAUTHORIZED, "token类型错误");
        }
        return claims;
    }

    /**
     * 生成JWT: payload中附带uid/username/type
     */
    private String buildJwt(Long userId, String username, String type, long ttlMillis) {
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .claim("uid", String.valueOf(userId))
                .claim("username", username)
                .claim("type", type)
                .setIssuedAt(new Date(now))
                .setExpiration(new Date(now + ttlMillis))
                .signWith(signKey, SignatureAlgorithm.HS256)
                .compact();
    }
}

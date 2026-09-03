package com.bookkeep.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.bookkeep.auth.TokenService;
import com.bookkeep.common.BusinessException;
import com.bookkeep.common.ResultCode;
import com.bookkeep.dto.LoginRequest;
import com.bookkeep.dto.RegisterRequest;
import com.bookkeep.dto.TokenResponse;
import com.bookkeep.entity.Category;
import com.bookkeep.entity.User;
import com.bookkeep.mapper.CategoryMapper;
import com.bookkeep.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;

/**
 * 认证服务: 注册/登录/刷新token/登出
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserMapper userMapper;
    private final CategoryMapper categoryMapper;
    private final TokenService tokenService;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    /**
     * 注册: 写入用户 + 初始化默认收支分类
     */
    @Transactional(rollbackFor = Exception.class)
    public TokenResponse register(RegisterRequest req) {
        Long count = userMapper.selectCount(
                new LambdaQueryWrapper<User>().eq(User::getUsername, req.getUsername()));
        if (count > 0) {
            throw new BusinessException(ResultCode.USERNAME_EXISTS);
        }

        User user = new User();
        user.setUsername(req.getUsername());
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        user.setNickname(req.getNickname());
        userMapper.insert(user);

        seedDefaultCategories(user.getId());
        log.info("新用户注册成功: id={}, username={}", user.getId(), user.getUsername());

        TokenResponse token = tokenService.createTokens(user.getId(), user.getUsername());
        token.setUserInfo(buildUserInfo(user));
        return token;
    }

    /**
     * 登录: 校验密码并签发双Token
     */
    public TokenResponse login(LoginRequest req) {
        User user = userMapper.selectOne(
                new LambdaQueryWrapper<User>().eq(User::getUsername, req.getUsername()));
        if (user == null || !passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            throw new BusinessException(ResultCode.LOGIN_FAILED);
        }

        TokenResponse token = tokenService.createTokens(user.getId(), user.getUsername());
        token.setUserInfo(buildUserInfo(user));
        return token;
    }

    /**
     * 刷新accessToken
     */
    public TokenResponse refresh(String refreshToken) {
        return tokenService.refreshTokens(refreshToken);
    }

    /**
     * 登出
     */
    public void logout(String accessToken, String refreshToken) {
        tokenService.removeTokens(accessToken, refreshToken);
    }

    private TokenResponse.UserInfo buildUserInfo(User user) {
        return TokenResponse.UserInfo.builder()
                .id(user.getId())
                .username(user.getUsername())
                .nickname(user.getNickname())
                .avatar(user.getAvatar())
                .build();
    }

    /**
     * 新用户默认分类(卡通emoji图标)
     */
    private void seedDefaultCategories(Long userId) {
        List<Category> defaults = Arrays.asList(
                buildCategory(userId, "餐饮", 1, "🍜"),
                buildCategory(userId, "购物", 1, "🛍️"),
                buildCategory(userId, "交通", 1, "🚌"),
                buildCategory(userId, "日用", 1, "🧻"),
                buildCategory(userId, "水果", 1, "🍎"),
                buildCategory(userId, "娱乐", 1, "🎮"),
                buildCategory(userId, "医疗", 1, "💊"),
                buildCategory(userId, "通讯", 1, "📱"),
                buildCategory(userId, "居住", 1, "🏠"),
                buildCategory(userId, "其他支出", 1, "📌"),
                buildCategory(userId, "工资", 2, "💰"),
                buildCategory(userId, "奖金", 2, "🎁"),
                buildCategory(userId, "兼职", 2, "💼"),
                buildCategory(userId, "红包", 2, "🧧"),
                buildCategory(userId, "理财", 2, "📈"),
                buildCategory(userId, "其他收入", 2, "🪙")
        );
        defaults.forEach(categoryMapper::insert);
    }

    private Category buildCategory(Long userId, String name, int type, String icon) {
        Category c = new Category();
        c.setUserId(userId);
        c.setName(name);
        c.setType(type);
        c.setIcon(icon);
        return c;
    }
}

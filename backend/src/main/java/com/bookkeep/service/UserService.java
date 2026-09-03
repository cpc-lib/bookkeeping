package com.bookkeep.service;

import com.bookkeep.auth.TokenService;
import com.bookkeep.auth.UserContext;
import com.bookkeep.common.BusinessException;
import com.bookkeep.common.ResultCode;
import com.bookkeep.dto.ChangePasswordRequest;
import com.bookkeep.dto.TokenResponse;
import com.bookkeep.entity.User;
import com.bookkeep.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * 用户服务: 个人信息/修改密码
 */
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserMapper userMapper;
    private final TokenService tokenService;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    /**
     * 当前登录用户信息
     */
    public TokenResponse.UserInfo getUserInfo() {
        User user = getRequiredUser();
        return TokenResponse.UserInfo.builder()
                .id(user.getId())
                .username(user.getUsername())
                .nickname(user.getNickname())
                .avatar(user.getAvatar())
                .build();
    }

    /**
     * 修改密码: 校验原密码 -> 更新 -> 全设备下线
     */
    public void changePassword(ChangePasswordRequest req) {
        User user = getRequiredUser();
        if (!passwordEncoder.matches(req.getOldPassword(), user.getPassword())) {
            throw new BusinessException(ResultCode.OLD_PASSWORD_WRONG);
        }
        if (req.getOldPassword().equals(req.getNewPassword())) {
            throw new BusinessException(ResultCode.BAD_REQUEST, "新密码不能与原密码相同");
        }

        User update = new User();
        update.setId(user.getId());
        update.setPassword(passwordEncoder.encode(req.getNewPassword()));
        userMapper.updateById(update);

        // 修改密码后, 该用户所有token立即失效, 需重新登录
        tokenService.removeAllUserTokens(user.getId());
    }

    private User getRequiredUser() {
        Long userId = UserContext.getUserId();
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException(ResultCode.USER_NOT_FOUND);
        }
        return user;
    }
}

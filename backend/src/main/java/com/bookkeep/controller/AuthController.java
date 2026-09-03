package com.bookkeep.controller;

import com.bookkeep.dto.LoginRequest;
import com.bookkeep.dto.LogoutRequest;
import com.bookkeep.dto.RefreshRequest;
import com.bookkeep.dto.RegisterRequest;
import com.bookkeep.dto.TokenResponse;
import com.bookkeep.common.Result;
import com.bookkeep.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 认证接口(公开)
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * 注册(成功后直接返回双Token, 免二次登录)
     */
    @PostMapping("/register")
    public Result<TokenResponse> register(@Validated @RequestBody RegisterRequest req) {
        return Result.ok(authService.register(req));
    }

    /**
     * 登录
     */
    @PostMapping("/login")
    public Result<TokenResponse> login(@Validated @RequestBody LoginRequest req) {
        return Result.ok(authService.login(req));
    }

    /**
     * 刷新accessToken(refreshToken轮换)
     */
    @PostMapping("/refresh")
    public Result<TokenResponse> refresh(@Validated @RequestBody RefreshRequest req) {
        return Result.ok(authService.refresh(req.getRefreshToken()));
    }

    /**
     * 登出
     */
    @PostMapping("/logout")
    public Result<Void> logout(@Validated @RequestBody LogoutRequest req) {
        authService.logout(req.getAccessToken(), req.getRefreshToken());
        return Result.ok();
    }
}

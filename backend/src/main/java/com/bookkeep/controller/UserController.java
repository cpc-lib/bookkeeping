package com.bookkeep.controller;

import com.bookkeep.common.Result;
import com.bookkeep.dto.ChangePasswordRequest;
import com.bookkeep.dto.TokenResponse;
import com.bookkeep.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 用户接口(需登录)
 */
@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /**
     * 当前登录用户信息
     */
    @GetMapping("/info")
    public Result<TokenResponse.UserInfo> info() {
        return Result.ok(userService.getUserInfo());
    }

    /**
     * 修改密码(成功后所有设备需重新登录)
     */
    @PutMapping("/password")
    public Result<Void> changePassword(@Validated @RequestBody ChangePasswordRequest req) {
        userService.changePassword(req);
        return Result.ok();
    }
}

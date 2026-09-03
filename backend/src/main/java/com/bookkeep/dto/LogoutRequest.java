package com.bookkeep.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;

/**
 * 登出请求
 */
@Data
public class LogoutRequest {

    @NotBlank(message = "accessToken不能为空")
    private String accessToken;

    private String refreshToken;
}

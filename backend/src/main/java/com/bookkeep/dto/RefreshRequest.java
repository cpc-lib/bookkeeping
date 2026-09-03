package com.bookkeep.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;

/**
 * 刷新Token请求
 */
@Data
public class RefreshRequest {

    @NotBlank(message = "refreshToken不能为空")
    private String refreshToken;
}

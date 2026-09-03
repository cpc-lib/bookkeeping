package com.bookkeep.dto;

import lombok.Builder;
import lombok.Data;

/**
 * 双Token响应
 */
@Data
@Builder
public class TokenResponse {

    private String accessToken;

    private String refreshToken;

    /** accessToken 有效期(秒) */
    private long accessExpire;

    /** refreshToken 有效期(秒) */
    private long refreshExpire;

    private UserInfo userInfo;

    @Data
    @Builder
    public static class UserInfo {
        private Long id;
        private String username;
        private String nickname;
        private String avatar;
    }
}

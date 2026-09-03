package com.bookkeep.common;

import lombok.Getter;

/**
 * 响应码定义
 */
@Getter
public enum ResultCode {

    SUCCESS(0, "成功"),
    BAD_REQUEST(400, "请求参数错误"),
    UNAUTHORIZED(401, "登录已失效, 请重新登录"),
    FORBIDDEN(403, "无权访问"),
    NOT_FOUND(404, "资源不存在"),
    SERVER_ERROR(500, "服务器内部错误"),

    // 业务错误码
    USERNAME_EXISTS(1001, "用户名已被注册"),
    LOGIN_FAILED(1002, "用户名或密码错误"),
    USER_NOT_FOUND(1003, "用户不存在"),
    OLD_PASSWORD_WRONG(1004, "原密码错误"),
    CATEGORY_NAME_EXISTS(1005, "该分类名称已存在"),
    CATEGORY_NOT_FOUND(1006, "分类不存在"),
    RECORD_NOT_FOUND(1007, "记账记录不存在"),
    FILE_TYPE_INVALID(1008, "仅支持图片文件"),
    FILE_TOO_LARGE(1009, "文件大小超出限制"),
    UPLOAD_FAILED(1010, "文件上传失败");

    private final int code;
    private final String msg;

    ResultCode(int code, String msg) {
        this.code = code;
        this.msg = msg;
    }
}

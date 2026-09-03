package com.bookkeep.common;

import lombok.Data;

/**
 * 统一响应结果封装
 */
@Data
public class Result<T> {

    private int code;
    private String msg;
    private T data;

    public static <T> Result<T> ok() {
        return ok(null);
    }

    public static <T> Result<T> ok(T data) {
        Result<T> r = new Result<>();
        r.code = ResultCode.SUCCESS.getCode();
        r.msg = "success";
        r.data = data;
        return r;
    }

    public static <T> Result<T> error(ResultCode code) {
        return error(code, code.getMsg());
    }

    public static <T> Result<T> error(ResultCode code, String msg) {
        Result<T> r = new Result<>();
        r.code = code.getCode();
        r.msg = msg;
        return r;
    }
}

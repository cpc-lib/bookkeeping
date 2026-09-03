package com.bookkeep.common;

import lombok.Getter;

/**
 * 业务异常
 */
@Getter
public class BusinessException extends RuntimeException {

    private final ResultCode code;

    public BusinessException(ResultCode code) {
        super(code.getMsg());
        this.code = code;
    }

    public BusinessException(ResultCode code, String msg) {
        super(msg);
        this.code = code;
    }
}

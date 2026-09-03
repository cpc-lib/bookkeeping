-- 记账 App 数据库表结构(幂等脚本, 可重复执行)
CREATE TABLE IF NOT EXISTS `t_user` (
    `id`         BIGINT       NOT NULL AUTO_INCREMENT COMMENT '用户ID',
    `username`   VARCHAR(50)  NOT NULL COMMENT '登录账号',
    `password`   VARCHAR(100) NOT NULL COMMENT '密码(BCrypt加密)',
    `nickname`   VARCHAR(50)  NOT NULL COMMENT '昵称',
    `avatar`     VARCHAR(255)          DEFAULT NULL COMMENT '头像URL',
    `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_username` (`username`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT ='用户表';

CREATE TABLE IF NOT EXISTS `t_category` (
    `id`         BIGINT      NOT NULL AUTO_INCREMENT COMMENT '分类ID',
    `user_id`    BIGINT      NOT NULL COMMENT '所属用户ID',
    `name`       VARCHAR(50) NOT NULL COMMENT '分类名称',
    `type`       TINYINT     NOT NULL COMMENT '类型: 1-支出 2-收入',
    `icon`       VARCHAR(50) NOT NULL DEFAULT '' COMMENT '图标(前端emoji标识)',
    `created_at` DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_user_type_name` (`user_id`, `type`, `name`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT ='记账分类表(每用户独立维护)';

CREATE TABLE IF NOT EXISTS `t_record` (
    `id`            BIGINT        NOT NULL AUTO_INCREMENT COMMENT '记录ID',
    `user_id`       BIGINT        NOT NULL COMMENT '所属用户ID',
    `category_id`   BIGINT        NOT NULL COMMENT '分类ID',
    `category_name` VARCHAR(50)   NOT NULL COMMENT '分类名称快照',
    `category_icon` VARCHAR(50)   NOT NULL DEFAULT '' COMMENT '分类图标快照',
    `type`          TINYINT       NOT NULL COMMENT '类型: 1-支出 2-收入',
    `amount`        DECIMAL(12,2) NOT NULL COMMENT '金额',
    `remark`        VARCHAR(255)  NOT NULL DEFAULT '' COMMENT '备注',
    `voucher_url`   VARCHAR(255)           DEFAULT NULL COMMENT '凭证图片URL(MinIO)',
    `record_date`   DATE          NOT NULL COMMENT '记账日期',
    `created_at`    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at`    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_user_date` (`user_id`, `record_date`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT ='记账记录表';

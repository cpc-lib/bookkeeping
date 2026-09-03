package com.bookkeep.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 记账记录实体
 */
@Data
@TableName("t_record")
public class Record {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long userId;

    private Long categoryId;

    /** 分类名称快照(分类删除后仍可展示) */
    private String categoryName;

    /** 分类图标快照 */
    private String categoryIcon;

    /** 类型: 1-支出 2-收入 */
    private Integer type;

    /** 金额 */
    private BigDecimal amount;

    /** 备注 */
    private String remark;

    /** 凭证图片URL(MinIO) */
    private String voucherUrl;

    /** 记账日期 */
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate recordDate;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;
}

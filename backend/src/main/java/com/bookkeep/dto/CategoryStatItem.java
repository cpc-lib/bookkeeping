package com.bookkeep.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;

/**
 * 分类统计项
 */
@Data
@AllArgsConstructor
public class CategoryStatItem {

    private Long categoryId;

    private String categoryName;

    private String icon;

    private Integer type;

    /** 该分类合计金额 */
    private BigDecimal total;

    /** 占比(0-100, 保留1位小数) */
    private BigDecimal percent;
}

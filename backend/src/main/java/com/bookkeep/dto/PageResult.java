package com.bookkeep.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

/**
 * 分页结果(附带区间收支汇总)
 */
@Data
@AllArgsConstructor
public class PageResult<T> {

    private List<T> list;

    /** 总条数 */
    private long total;

    /** 当前页码 */
    private long page;

    /** 每页条数 */
    private long size;

    /** 区间内支出合计 */
    private BigDecimal totalExpense;

    /** 区间内收入合计 */
    private BigDecimal totalIncome;
}

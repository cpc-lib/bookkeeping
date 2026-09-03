package com.bookkeep.dto;

import lombok.Data;

import javax.validation.constraints.DecimalMin;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Pattern;
import javax.validation.constraints.Size;
import java.math.BigDecimal;

/**
 * 新增/编辑记账记录请求
 */
@Data
public class RecordRequest {

    /** 仅编辑时必传 */
    private Long id;

    @NotNull(message = "请选择分类")
    private Long categoryId;

    @NotNull(message = "金额不能为空")
    @DecimalMin(value = "0.01", message = "金额必须大于0")
    private BigDecimal amount;

    @Size(max = 255, message = "备注最长255个字符")
    private String remark;

    /** 凭证图片URL(MinIO), 可为空 */
    private String voucherUrl;

    @NotBlank(message = "请选择日期")
    @Pattern(regexp = "^\\d{4}-\\d{2}-\\d{2}$", message = "日期格式应为 yyyy-MM-dd")
    private String recordDate;
}

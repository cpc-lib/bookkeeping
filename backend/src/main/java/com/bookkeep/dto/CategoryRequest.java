package com.bookkeep.dto;

import lombok.Data;

import javax.validation.constraints.Max;
import javax.validation.constraints.Min;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;

/**
 * 新增/编辑分类请求
 */
@Data
public class CategoryRequest {

    /** 仅编辑时必传 */
    private Long id;

    /** 仅新增时必传: 1-支出 2-收入 */
    @Min(value = 1, message = "分类类型不合法")
    @Max(value = 2, message = "分类类型不合法")
    private Integer type;

    @NotBlank(message = "分类名称不能为空")
    @Size(max = 20, message = "分类名称最长20个字符")
    private String name;

    @Size(max = 50, message = "图标最长50个字符")
    private String icon;

    @NotNull(message = "缺少必要参数")
    private Boolean isEdit;
}

package com.bookkeep.controller;

import com.bookkeep.common.Result;
import com.bookkeep.dto.CategoryStatItem;
import com.bookkeep.dto.PageResult;
import com.bookkeep.dto.RecordRequest;
import com.bookkeep.entity.Record;
import com.bookkeep.service.RecordService;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 记账记录接口(需登录)
 */
@RestController
@RequestMapping("/api/record")
@RequiredArgsConstructor
public class RecordController {

    private final RecordService recordService;

    /**
     * 分页查询记账记录
     */
    @GetMapping("/page")
    public Result<PageResult<Record>> page(@RequestParam(defaultValue = "1") long page,
                                           @RequestParam(defaultValue = "10") long size,
                                           @RequestParam(required = false) Integer type,
                                           @RequestParam(required = false) Long categoryId,
                                           @RequestParam(required = false) String startDate,
                                           @RequestParam(required = false) String endDate) {
        return Result.ok(recordService.page(page, size, type, categoryId, startDate, endDate));
    }

    /**
     * 新增记账记录
     */
    @PostMapping("/add")
    public Result<Void> add(@Validated @RequestBody RecordRequest req) {
        recordService.add(req);
        return Result.ok();
    }

    /**
     * 编辑记账记录
     */
    @PutMapping("/update")
    public Result<Void> update(@Validated @RequestBody RecordRequest req) {
        recordService.update(req);
        return Result.ok();
    }

    /**
     * 删除记账记录
     */
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        recordService.delete(id);
        return Result.ok();
    }

    /**
     * 分类维度统计(饼图)
     * @param type 1-支出 2-收入
     */
    @GetMapping("/stat/category")
    public Result<List<CategoryStatItem>> statByCategory(@RequestParam(required = false) Integer type,
                                                         @RequestParam String startDate,
                                                         @RequestParam String endDate) {
        return Result.ok(recordService.statByCategory(type, startDate, endDate));
    }
}

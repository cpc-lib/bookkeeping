package com.bookkeep.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.bookkeep.auth.UserContext;
import com.bookkeep.common.BusinessException;
import com.bookkeep.common.ResultCode;
import com.bookkeep.dto.CategoryStatItem;
import com.bookkeep.dto.PageResult;
import com.bookkeep.dto.RecordRequest;
import com.bookkeep.entity.Category;
import com.bookkeep.entity.Record;
import com.bookkeep.mapper.RecordMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 记账服务: 记录的增删改查 + 收支汇总统计
 */
@Service
@RequiredArgsConstructor
public class RecordService {

    private final RecordMapper recordMapper;
    private final CategoryService categoryService;

    /**
     * 分页查询记账记录(附带筛选区间的收支汇总)
     */
    public PageResult<Record> page(long page, long size, Integer type, Long categoryId,
                                   String startDate, String endDate) {
        validateRange(startDate, endDate);
        LambdaQueryWrapper<Record> wrapper = buildQueryWrapper(type, categoryId, startDate, endDate);
        wrapper.orderByDesc(Record::getRecordDate)
                .orderByDesc(Record::getId);

        Page<Record> result = recordMapper.selectPage(new Page<>(page, size), wrapper);

        BigDecimal expense = sumByType(1, type, categoryId, startDate, endDate);
        BigDecimal income = sumByType(2, type, categoryId, startDate, endDate);
        return new PageResult<>(result.getRecords(), result.getTotal(), result.getCurrent(), result.getSize(), expense, income);
    }

    /**
     * 新增记账记录
     */
    public void add(RecordRequest req) {
        Category category = categoryService.getOwnedCategory(req.getCategoryId());
        Record r = new Record();
        copyFromRequest(r, req, category);
        recordMapper.insert(r);
    }

    /**
     * 编辑记账记录
     */
    public void update(RecordRequest req) {
        if (req.getId() == null) {
            throw new BusinessException(ResultCode.BAD_REQUEST, "记录ID不能为空");
        }
        Record db = getOwnedRecord(req.getId());
        Category category = categoryService.getOwnedCategory(req.getCategoryId());
        copyFromRequest(db, req, category);
        recordMapper.updateById(db);
    }

    /**
     * 删除记账记录
     */
    public void delete(Long id) {
        getOwnedRecord(id);
        recordMapper.deleteById(id);
    }

    /**
     * 分类维度统计(饼图数据)
     * @param type 1-支出 2-收入
     */
    public List<CategoryStatItem> statByCategory(Integer type, String startDate, String endDate) {
        validateRange(startDate, endDate);
        List<Record> records = recordMapper.selectList(
                buildQueryWrapper(type, null, startDate, endDate));

        if (records.isEmpty()) {
            return new ArrayList<>();
        }

        Map<Long, CategoryStatItem> grouped = new HashMap<>();
        for (Record r : records) {
            grouped.compute(r.getCategoryId(), (k, v) -> {
                if (v == null) {
                    return new CategoryStatItem(r.getCategoryId(), r.getCategoryName(),
                            r.getCategoryIcon(), r.getType(), r.getAmount(), BigDecimal.ZERO);
                }
                v.setTotal(v.getTotal().add(r.getAmount()));
                return v;
            });
        }

        BigDecimal sum = grouped.values().stream()
                .map(CategoryStatItem::getTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<CategoryStatItem> list = new ArrayList<>(grouped.values());
        list.forEach(i -> i.setPercent(
                sum.compareTo(BigDecimal.ZERO) == 0 ? BigDecimal.ZERO
                        : i.getTotal().multiply(new BigDecimal("100")).divide(sum, 1, RoundingMode.HALF_UP)));
        list.sort(Comparator.comparing(CategoryStatItem::getTotal).reversed());
        return list;
    }

    private LambdaQueryWrapper<Record> buildQueryWrapper(Integer type, Long categoryId,
                                                         String startDate, String endDate) {
        LambdaQueryWrapper<Record> wrapper = new LambdaQueryWrapper<Record>()
                .eq(Record::getUserId, UserContext.getUserId())
                .eq(type != null, Record::getType, type)
                .eq(categoryId != null, Record::getCategoryId, categoryId);
        // 日期条件需手动判断, 避免 parseDate 在条件不成立时仍被求值导致NPE/格式错误
        if (startDate != null && !startDate.isEmpty()) {
            wrapper.ge(Record::getRecordDate, parseDate(startDate));
        }
        if (endDate != null && !endDate.isEmpty()) {
            wrapper.le(Record::getRecordDate, parseDate(endDate));
        }
        return wrapper;
    }

    private BigDecimal sumByType(int type, Integer filterType, Long categoryId,
                                 String startDate, String endDate) {
        if (filterType != null && filterType != type) {
            return BigDecimal.ZERO;
        }
        List<Record> records = recordMapper.selectList(
                buildQueryWrapper(type, categoryId, startDate, endDate));
        return records.stream().map(Record::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private void copyFromRequest(Record r, RecordRequest req, Category category) {
        r.setUserId(UserContext.getUserId());
        r.setCategoryId(category.getId());
        r.setCategoryName(category.getName());
        r.setCategoryIcon(category.getIcon());
        r.setType(category.getType());
        r.setAmount(req.getAmount());
        r.setRemark(req.getRemark() == null ? "" : req.getRemark());
        r.setVoucherUrl(req.getVoucherUrl());
        r.setRecordDate(parseDate(req.getRecordDate()));
    }

    private void validateRange(String startDate, String endDate) {
        if (startDate != null && !startDate.isEmpty() && endDate != null && !endDate.isEmpty()
                && parseDate(startDate).isAfter(parseDate(endDate))) {
            throw new BusinessException(ResultCode.BAD_REQUEST, "开始日期不能晚于结束日期");
        }
    }

    private Record getOwnedRecord(Long id) {
        Record r = recordMapper.selectById(id);
        if (r == null || !r.getUserId().equals(UserContext.getUserId())) {
            throw new BusinessException(ResultCode.RECORD_NOT_FOUND);
        }
        return r;
    }

    private LocalDate parseDate(String date) {
        try {
            return LocalDate.parse(date);
        } catch (Exception e) {
            throw new BusinessException(ResultCode.BAD_REQUEST, "日期格式错误: " + date);
        }
    }
}

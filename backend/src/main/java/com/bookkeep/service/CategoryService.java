package com.bookkeep.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.bookkeep.auth.UserContext;
import com.bookkeep.common.BusinessException;
import com.bookkeep.common.ResultCode;
import com.bookkeep.dto.CategoryRequest;
import com.bookkeep.entity.Category;
import com.bookkeep.mapper.CategoryMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 分类服务: 每个用户独立维护自己的支出/收入分类
 */
@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryMapper categoryMapper;

    /**
     * 查询分类列表
     * @param type 1-支出 2-收入, 为空则查询全部
     */
    public List<Category> list(Integer type) {
        LambdaQueryWrapper<Category> wrapper = new LambdaQueryWrapper<Category>()
                .eq(Category::getUserId, UserContext.getUserId())
                .eq(type != null, Category::getType, type)
                .orderByAsc(Category::getType)
                .orderByAsc(Category::getId);
        return categoryMapper.selectList(wrapper);
    }

    /**
     * 新增或编辑分类
     */
    public void save(CategoryRequest req) {
        Long userId = UserContext.getUserId();

        // 同一用户同类型下分类名不可重复
        Long dup = categoryMapper.selectCount(new LambdaQueryWrapper<Category>()
                .eq(Category::getUserId, userId)
                .eq(Category::getType, req.getType() != null ? req.getType() : resolveType(req.getId(), userId))
                .eq(Category::getName, req.getName())
                .ne(req.getId() != null, Category::getId, req.getId()));
        if (dup > 0) {
            throw new BusinessException(ResultCode.CATEGORY_NAME_EXISTS);
        }

        if (Boolean.TRUE.equals(req.getIsEdit())) {
            Category db = getOwnedCategory(req.getId());
            db.setName(req.getName());
            db.setIcon(req.getIcon() == null ? "" : req.getIcon());
            categoryMapper.updateById(db);
        } else {
            if (req.getType() == null || (req.getType() != 1 && req.getType() != 2)) {
                throw new BusinessException(ResultCode.BAD_REQUEST, "分类类型不合法");
            }
            Category c = new Category();
            c.setUserId(userId);
            c.setName(req.getName());
            c.setType(req.getType());
            c.setIcon(req.getIcon() == null ? "📌" : req.getIcon());
            categoryMapper.insert(c);
        }
    }

    /**
     * 删除分类(历史记账记录保留分类快照, 不受影响)
     */
    public void delete(Long id) {
        getOwnedCategory(id);
        categoryMapper.deleteById(id);
    }

    /**
     * 校验分类归属当前用户
     */
    public Category getOwnedCategory(Long id) {
        Category c = categoryMapper.selectById(id);
        if (c == null || !c.getUserId().equals(UserContext.getUserId())) {
            throw new BusinessException(ResultCode.CATEGORY_NOT_FOUND);
        }
        return c;
    }

    private Integer resolveType(Long categoryId, Long userId) {
        if (categoryId == null) {
            return null;
        }
        Category c = categoryMapper.selectById(categoryId);
        return c == null ? null : c.getType();
    }
}

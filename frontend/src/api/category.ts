import { del, get, post } from './client';
import type { Category } from '../models/types';

/** 分类API: 每用户独立维护的收支分类 */
export const categoryApi = {
  /** type: 1-支出 2-收入, 不传查全部 */
  list: (type?: 1 | 2) => get<Category[]>('/category/list', type ? { type } : undefined),

  add: (name: string, type: 1 | 2, icon: string) =>
    post<void>('/category/save', { name, type, icon, isEdit: false }),

  update: (id: number, name: string, icon: string) =>
    post<void>('/category/save', { id, name, icon, isEdit: true }),

  /** 删除分类(历史记录保留快照不受影响) */
  remove: (id: number) => del<void>(`/category/${id}`),
};

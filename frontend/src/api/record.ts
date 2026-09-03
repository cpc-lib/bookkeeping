import { del, get, post, put } from './client';
import type { CategoryStat, RecordPage } from '../models/types';

/** 记账API: 记录增删改查 + 统计 */
export interface RecordQuery {
  page?: number;
  size?: number;
  type?: 1 | 2;
  categoryId?: number;
  startDate?: string;
  endDate?: string;
}

export const recordApi = {
  page: (query: RecordQuery) => get<RecordPage>('/record/page', query),

  add: (r: {
    categoryId: number;
    amount: number;
    remark: string;
    voucherUrl: string | null;
    recordDate: string;
  }) => post<void>('/record/add', r),

  update: (r: {
    id: number;
    categoryId: number;
    amount: number;
    remark: string;
    voucherUrl: string | null;
    recordDate: string;
  }) => put<void>('/record/update', r),

  remove: (id: number) => del<void>(`/record/${id}`),

  /** 分类维度统计(饼图) */
  statByCategory: (params: { type?: 1 | 2; startDate: string; endDate: string }) =>
    get<CategoryStat[]>('/record/stat/category', params),
};

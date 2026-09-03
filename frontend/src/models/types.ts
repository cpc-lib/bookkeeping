/** 用户信息 */
export interface UserInfo {
  id: number;
  username: string;
  nickname: string;
  avatar: string | null;
}

/** 双Token响应 */
export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  accessExpire: number;
  refreshExpire: number;
  userInfo?: UserInfo;
}

/** 记账分类 */
export interface Category {
  id: number;
  userId: number;
  name: string;
  type: 1 | 2; // 1-支出 2-收入
  icon: string;
}

/** 记账记录 */
export interface RecordItem {
  id: number;
  categoryId: number;
  categoryName: string;
  categoryIcon: string;
  type: 1 | 2;
  amount: number;
  remark: string;
  voucherUrl: string | null;
  recordDate: string; // yyyy-MM-dd
  createdAt: string;
}

/** 记录分页结果(附带区间收支汇总) */
export interface RecordPage {
  list: RecordItem[];
  total: number;
  page: number;
  size: number;
  totalExpense: number;
  totalIncome: number;
}

/** 分类统计项 */
export interface CategoryStat {
  categoryId: number;
  categoryName: string;
  icon: string;
  type: number;
  total: number;
  percent: number;
}

/** 记账类型常量 */
export const TYPE_EXPENSE = 1 as const;
export const TYPE_INCOME = 2 as const;

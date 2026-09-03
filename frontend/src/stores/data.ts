import { create } from 'zustand';

/** 记账数据版本号: 新增/编辑/删除后bump, 列表/统计页自动刷新 */
interface DataState {
  version: number;
  bump: () => void;
}

export const useDataStore = create<DataState>((set) => ({
  version: 0,
  bump: () => set((s) => ({ version: s.version + 1 })),
}));

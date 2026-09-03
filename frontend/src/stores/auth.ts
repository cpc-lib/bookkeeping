import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TokenResponse, UserInfo } from '../models/types';
import { post } from '../api/client';

/** 全局会话状态(zustand + localStorage持久化) */
interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: UserInfo | null;
  setSession: (t: TokenResponse) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (u: UserInfo | null) => void;
  clear: () => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      setSession: (t) =>
        set({
          accessToken: t.accessToken,
          refreshToken: t.refreshToken,
          user: t.userInfo ?? null,
        }),
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      setUser: (u) => set({ user: u }),
      clear: () => set({ accessToken: null, refreshToken: null, user: null }),
      logout: async () => {
        const { accessToken, refreshToken } = get();
        if (accessToken) {
          try {
            await post('/auth/logout', { accessToken, refreshToken });
          } catch {
            // 登出接口失败不影响本地清理
          }
        }
        set({ accessToken: null, refreshToken: null, user: null });
      },
    }),
    { name: 'bk-auth' },
  ),
);

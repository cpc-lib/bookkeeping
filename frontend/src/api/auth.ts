import { get, post, put } from './client';
import type { TokenResponse, UserInfo } from '../models/types';

/** 认证API: 登录/注册/登出/用户信息/修改密码 */
export const authApi = {
  login: (username: string, password: string) =>
    post<TokenResponse>('/auth/login', { username, password }),

  register: (username: string, password: string, nickname: string) =>
    post<TokenResponse>('/auth/register', { username, password, nickname }),

  info: () => get<UserInfo>('/user/info'),

  changePassword: (oldPassword: string, newPassword: string) =>
    put<void>('/user/password', { oldPassword, newPassword }),
};

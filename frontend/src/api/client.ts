import axios, { AxiosError } from 'axios';
import { useAuthStore } from '../stores/auth';

/** 后端统一响应结构 */
export interface Envelope<T> {
  code: number;
  msg: string;
  data: T | null;
}

/** 业务异常 */
export class ApiException extends Error {
  code: number;
  constructor(code: number, msg: string) {
    super(msg);
    this.code = code;
  }
}

declare module 'axios' {
  export interface AxiosRequestConfig {
    /** 已自动重试过一次(防死循环) */
    _retried?: boolean;
  }
}

export const client = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

// 请求拦截: 自动携带 accessToken
client.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/** 刷新状态锁: 并发401时只触发一次刷新 */
let refreshing: Promise<boolean> | null = null;

function ensureRefreshed(): Promise<boolean> {
  if (refreshing) return refreshing;
  const { refreshToken, setTokens, clear } = useAuthStore.getState();
  if (!refreshToken) return Promise.resolve(false);

  const task = (async () => {
    try {
      // 独立axios实例避免拦截器递归
      const resp = await axios.post<Envelope<{ accessToken: string; refreshToken: string }>>(
        '/api/auth/refresh',
        { refreshToken },
      );
      if (resp.data.code === 0 && resp.data.data) {
        setTokens(resp.data.data.accessToken, resp.data.data.refreshToken);
        return true;
      }
      clear();
      return false;
    } catch {
      clear();
      return false;
    }
  })();

  refreshing = task.finally(() => {
    refreshing = null;
  });
  return refreshing;
}

// 响应拦截: 处理业务码 + 401无感刷新
client.interceptors.response.use(
  async (resp) => {
    const body = resp.data as Envelope<unknown>;
    if (body && typeof body === 'object' && 'code' in body) {
      if (body.code === 401 && !resp.config._retried && !resp.config.url?.includes('/auth/refresh')) {
        const ok = await ensureRefreshed();
        if (ok) {
          resp.config._retried = true;
          const token = useAuthStore.getState().accessToken;
          return client.request({
            ...resp.config,
            headers: { ...resp.config.headers, Authorization: `Bearer ${token}` },
          });
        }
        useAuthStore.getState().clear();
        return Promise.reject(new ApiException(401, '登录已失效, 请重新登录'));
      }
      if (body.code !== 0) {
        return Promise.reject(new ApiException(body.code, body.msg || '请求失败'));
      }
    }
    return resp;
  },
  async (error: AxiosError<Envelope<unknown>>) => {
    const config = error.config;
    if (error.response?.status === 401 && config && !config._retried) {
      const ok = await ensureRefreshed();
      if (ok) {
        config._retried = true;
        const token = useAuthStore.getState().accessToken;
        return client.request({
          ...config,
          headers: { ...config.headers, Authorization: `Bearer ${token}` },
        });
      }
      useAuthStore.getState().clear();
      return Promise.reject(new ApiException(401, '登录已失效, 请重新登录'));
    }
    const body = error.response?.data as Envelope<unknown> | undefined;
    if (body && typeof body === 'object' && 'code' in body && body.code !== 0) {
      return Promise.reject(new ApiException(body.code, body.msg || '请求失败'));
    }
    return Promise.reject(new ApiException(-1, '网络异常, 请稍后重试'));
  },
);

// region 通用请求方法: 剥离Result壳, 直接返回data
export async function get<T>(url: string, params?: object): Promise<T | null> {
  const resp = await client.get<Envelope<T>>(url, { params });
  return (resp.data as Envelope<T>).data;
}

export async function post<T>(url: string, data?: unknown): Promise<T | null> {
  const resp = await client.post<Envelope<T>>(url, data);
  return (resp.data as Envelope<T>).data;
}

export async function put<T>(url: string, data?: unknown): Promise<T | null> {
  const resp = await client.put<Envelope<T>>(url, data);
  return (resp.data as Envelope<T>).data;
}

export async function del<T>(url: string, params?: object): Promise<T | null> {
  const resp = await client.delete<Envelope<T>>(url, { params });
  return (resp.data as Envelope<T>).data;
}
// endregion

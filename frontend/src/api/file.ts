import { client, type Envelope } from './client';

/** 文件API: 凭证图片上传(MinIO) */
export const fileApi = {
  async uploadVoucher(file: File): Promise<string> {
    const form = new FormData();
    form.append('file', file);
    const resp = await client.post<Envelope<{ url: string }>>('/file/upload', form);
    const body = resp.data as Envelope<{ url: string }>;
    if (body.code !== 0 || !body.data) {
      throw new Error(body.msg || '上传失败');
    }
    return body.data.url;
  },

  /** 后端返回的MinIO地址若为localhost, 替换为当前页面host */
  fixUrl: (url: string): string => url.replace('localhost', window.location.hostname),
};

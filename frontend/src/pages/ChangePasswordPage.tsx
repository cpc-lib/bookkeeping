import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, message } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { authApi } from '../api/auth';
import { ApiException } from '../api/client';
import { useAuthStore } from '../stores/auth';

/** 修改密码页(成功后所有设备需重新登录) */
export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const [form, setForm] = useState({ oldPassword: '', newPassword: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async () => {
    const { oldPassword, newPassword, confirm } = form;
    if (!oldPassword || !newPassword) {
      message.warning('请填写完整');
      return;
    }
    if (newPassword !== confirm) {
      message.warning('两次输入的新密码不一致');
      return;
    }
    if (newPassword.length < 6 || newPassword.length > 20) {
      message.warning('新密码长度需为6-20位');
      return;
    }
    setLoading(true);
    try {
      await authApi.changePassword(oldPassword, newPassword);
      message.success('密码修改成功, 请重新登录 🎉');
      await logout();
      navigate('/login', { replace: true });
    } catch (e) {
      message.error(e instanceof ApiException ? e.message : '网络异常, 请稍后重试');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-7 pb-8">
      <div className="flex flex-col items-center pt-10">
        <span className="text-5xl">🔐</span>
        <div className="mt-2 px-4 text-center text-[13px] leading-6 text-sub">
          为了你的小钱钱安全
          <br />
          修改密码后将自动退出所有设备
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-4">
        <Input.Password size="large" placeholder="原密码" prefix={<LockOutlined className="text-primary" />} value={form.oldPassword} onChange={set('oldPassword')} />
        <Input.Password size="large" placeholder="新密码 (6-20位)" prefix={<LockOutlined className="text-primary" />} value={form.newPassword} onChange={set('newPassword')} />
        <Input.Password size="large" placeholder="确认新密码" prefix={<LockOutlined className="text-primary" />} value={form.confirm} onChange={set('confirm')} onPressEnter={submit} />
        <Button type="primary" size="large" block loading={loading} onClick={submit} className="mt-2">
          确认修改
        </Button>
      </div>
    </div>
  );
}

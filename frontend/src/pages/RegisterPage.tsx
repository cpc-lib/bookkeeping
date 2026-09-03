import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Input, message } from 'antd';
import { LockOutlined, SmileOutlined, UserOutlined } from '@ant-design/icons';
import { authApi } from '../api/auth';
import { ApiException } from '../api/client';
import { useAuthStore } from '../stores/auth';

/** 注册页(卡通风格, 注册即登录) */
export default function RegisterPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [form, setForm] = useState({ username: '', nickname: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const register = async () => {
    const { username, nickname, password, confirm } = form;
    if (!username.trim() || !nickname.trim() || !password) {
      message.warning('请填写完整信息');
      return;
    }
    if (password !== confirm) {
      message.warning('两次输入的密码不一致');
      return;
    }
    setLoading(true);
    try {
      const token = await authApi.register(username.trim(), password, nickname.trim());
      if (token) {
        setSession(token);
        message.success('注册成功, 欢迎加入 🎉');
        navigate('/', { replace: true });
      }
    } catch (e) {
      message.error(e instanceof ApiException ? e.message : '网络异常, 请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-7 py-8">
      <div className="flex flex-col items-center pt-6">
        <span className="text-5xl">🐷</span>
        <div className="mt-2 text-lg font-bold text-main">欢迎加入小猪记账</div>
      </div>

      <div className="mt-8 flex flex-col gap-4">
        <Input size="large" placeholder="账号 (3-20位字母/数字/下划线)" prefix={<UserOutlined className="text-primary" />} value={form.username} onChange={set('username')} />
        <Input size="large" placeholder="昵称" prefix={<SmileOutlined className="text-primary" />} value={form.nickname} onChange={set('nickname')} />
        <Input.Password size="large" placeholder="密码 (6-20位)" prefix={<LockOutlined className="text-primary" />} value={form.password} onChange={set('password')} />
        <Input.Password size="large" placeholder="确认密码" prefix={<LockOutlined className="text-primary" />} value={form.confirm} onChange={set('confirm')} onPressEnter={register} />
        <Button type="primary" size="large" block loading={loading} onClick={register} className="mt-2">
          注 册
        </Button>
        <div className="text-center text-sm">
          <Link to="/login" className="font-bold text-primary">
            ← 返回登录
          </Link>
        </div>
      </div>
    </div>
  );
}

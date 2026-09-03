import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button, Input, message } from 'antd';
import { LockOutlined, UserOutlined, EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import { authApi } from '../api/auth';
import { ApiException } from '../api/client';
import { useAuthStore } from '../stores/auth';

/** 登录页(卡通风格) */
export default function LoginPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const login = async () => {
    if (!username.trim() || !password) {
      message.warning('请输入账号和密码');
      return;
    }
    setLoading(true);
    try {
      const token = await authApi.login(username.trim(), password);
      if (token) {
        setSession(token);
        message.success(`欢迎回来, ${token.userInfo?.nickname ?? ''} 🐷`);
        navigate('/', { replace: true });
      }
    } catch (e) {
      message.error(e instanceof ApiException ? e.message : '网络异常, 请检查后端服务');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col px-8" style={{ background: 'linear-gradient(#FFD79A, #FFF8EE 45%)' }}>
      <div className="flex flex-1 flex-col items-center justify-center gap-1 pb-10">
        <div className="flex h-28 w-28 items-center justify-center rounded-full bg-white shadow-card">
          <span className="text-6xl">🐷</span>
        </div>
        <div className="mt-3 text-3xl font-bold tracking-widest text-main">小猪记账</div>
        <div className="text-sm text-sub">记录每一笔小钱钱 ✨</div>
      </div>

      <div className="flex flex-col gap-4 pb-16">
        <Input
          size="large"
          placeholder="账号"
          prefix={<UserOutlined className="text-primary" />}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onPressEnter={login}
        />
        <Input.Password
          size="large"
          placeholder="密码"
          prefix={<LockOutlined className="text-primary" />}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onPressEnter={login}
          iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined className="text-sub" />)}
        />
        <Button type="primary" size="large" block loading={loading} onClick={login} className="mt-2">
          登 录
        </Button>
        <div className="text-center text-sm">
          <span className="text-sub">还没有账号? </span>
          <Link to="/register" className="font-bold text-primary">
            去注册 🎈
          </Link>
        </div>
      </div>
    </div>
  );
}

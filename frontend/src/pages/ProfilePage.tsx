import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Popconfirm } from 'antd';
import { RightOutlined } from '@ant-design/icons';
import { useAuthStore } from '../stores/auth';

/** 我的页: 用户卡片 + 修改密码/退出登录 */
export default function ProfilePage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [aboutOpen, setAboutOpen] = useState(false);

  const avatarText = user?.nickname ? user.nickname.charAt(0) : '🐷';

  return (
    <div className="min-h-screen px-4 pb-8">
      <div className="pt-6 text-center text-lg font-bold text-main">我的</div>

      {/* 用户卡片 */}
      <div className="cartoon-card mt-4 flex items-center gap-4 p-5">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-full text-3xl font-bold text-white"
          style={{ background: 'linear-gradient(#FFD79A, #FF9F43)' }}
        >
          {avatarText}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-lg font-bold text-main">{user?.nickname ?? '记账小达人'}</div>
          <div className="mt-0.5 text-[13px] text-sub">账号: {user?.username ?? '-'}</div>
        </div>
        <span className="text-2xl">🎉</span>
      </div>

      {/* 菜单 */}
      <div className="cartoon-card mt-4 py-1">
        <MenuItem emoji="🔒" title="修改密码" subtitle="修改后需重新登录" onClick={() => navigate('/profile/password')} />
        <div className="mx-4 border-b border-line" />
        <MenuItem emoji="🐷" title="关于小猪记账" subtitle="v1.0.0" onClick={() => setAboutOpen(true)} />
      </div>

      <div className="cartoon-card mt-4">
        <Popconfirm
          title="退出登录"
          description="确定要退出当前账号吗?"
          okText="退出"
          cancelText="取消"
          okButtonProps={{ danger: true }}
          onConfirm={async () => {
            await logout();
            navigate('/login', { replace: true });
          }}
        >
          <MenuItem emoji="🚪" title="退出登录" titleColor="#FF6B6B" />
        </Popconfirm>
      </div>

      <Modal
        open={aboutOpen}
        title="🐷 小猪记账"
        onCancel={() => setAboutOpen(false)}
        footer={null}
      >
        <div className="text-sm text-main">卡通风格记账App</div>
        <div className="mt-2 text-[13px] leading-6 text-sub">
          前端: React 18 + Ant Design + Zustand + TailwindCSS
          <br />
          后端: Spring Boot + MySQL + Redis + MinIO
          <br />
          支持双Token登录 / 收支分类 / 凭证图片
        </div>
      </Modal>
    </div>
  );
}

function MenuItem({
  emoji,
  title,
  subtitle,
  titleColor,
  onClick,
}: {
  emoji: string;
  title: string;
  subtitle?: string;
  titleColor?: string;
  onClick?: () => void;
}) {
  return (
    <button
      className="flex w-full items-center gap-3.5 px-4 py-3.5 text-left transition-colors active:bg-cream"
      onClick={onClick}
    >
      <span className="text-[22px]">{emoji}</span>
      <span className="flex-1 text-[15px] font-bold" style={{ color: titleColor ?? '#4A3B2A' }}>
        {title}
      </span>
      {subtitle && <span className="text-xs text-sub">{subtitle}</span>}
      <RightOutlined className="text-xs text-sub" />
    </button>
  );
}

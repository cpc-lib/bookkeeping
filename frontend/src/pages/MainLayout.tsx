import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { PlusOutlined } from '@ant-design/icons';

/** 底部导航tab */
const TABS = [
  { path: '/', label: '明细', icon: '📒' },
  { path: '/stats', label: '统计', icon: '📊' },
  { path: '/categories', label: '分类', icon: '🏷️' },
  { path: '/profile', label: '我的', icon: '🐷' },
];

/** 主页面骨架: 底部导航 + 中央"记一笔"按钮 */
export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const current = TABS.find((t) => t.path === location.pathname) ?? TABS[0];

  return (
    <div className="relative min-h-screen pb-24">
      <Outlet />

      {/* 中央记一笔按钮 */}
      <button
        className="absolute bottom-[52px] left-1/2 z-20 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full bg-gradient-to-b from-[#FFB84C] to-primary-deep text-2xl text-white shadow-fab transition-transform active:scale-90"
        onClick={() => navigate('/record/add')}
        aria-label="记一笔"
      >
        <PlusOutlined />
      </button>

      {/* 底部导航栏 */}
      <nav className="fixed bottom-0 left-1/2 z-10 flex h-[76px] w-full max-w-md -translate-x-1/2 items-center justify-around rounded-t-3xl border-t border-line bg-white px-2 shadow-[0_-4px_16px_rgba(255,159,67,0.08)]">
        {TABS.slice(0, 2).map((tab) => (
          <TabItem key={tab.path} tab={tab} active={current.path === tab.path} onClick={() => navigate(tab.path)} />
        ))}
        <div className="w-14" />
        {TABS.slice(2).map((tab) => (
          <TabItem key={tab.path} tab={tab} active={current.path === tab.path} onClick={() => navigate(tab.path)} />
        ))}
      </nav>
    </div>
  );
}

function TabItem({ tab, active, onClick }: { tab: (typeof TABS)[number]; active: boolean; onClick: () => void }) {
  return (
    <button
      className="flex w-16 flex-col items-center gap-0.5 py-2 transition-transform active:scale-90"
      onClick={onClick}
    >
      <span className="text-[22px] leading-none" style={{ filter: active ? 'none' : 'grayscale(0.7) opacity(0.6)' }}>
        {tab.icon}
      </span>
      <span className={`text-xs ${active ? 'font-bold text-primary' : 'text-sub'}`}>{tab.label}</span>
    </button>
  );
}

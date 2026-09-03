import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Button, message, Popconfirm } from 'antd';
import { LeftOutlined } from '@ant-design/icons';
import { recordApi } from '../api/record';
import { ApiException } from '../api/client';
import { fileApi } from '../api/file';
import type { RecordItem } from '../models/types';
import { useDataStore } from '../stores/data';

/** 记录详情: 查看/编辑/删除/凭证大图 */
export default function RecordDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const record = (location.state as { record?: RecordItem } | null)?.record ?? null;
  const bump = useDataStore((s) => s.bump);
  const [deleting, setDeleting] = useState(false);

  // 无数据(如刷新页面)时回到明细页
  if (!record) {
    return <Navigate to="/" replace />;
  }

  const isExpense = record.type === 1;
  const color = isExpense ? '#FF6B6B' : '#2ED573';

  const remove = async () => {
    setDeleting(true);
    try {
      await recordApi.remove(record.id);
      bump();
      message.success('已删除');
      navigate(-1);
    } catch (e) {
      message.error(e instanceof ApiException ? e.message : '删除失败');
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen px-4 pb-8">
      {/* 头部 */}
      <div className="flex items-center gap-2 py-4">
        <button className="text-xl text-main active:scale-90 transition-transform" onClick={() => navigate(-1)}>
          <LeftOutlined />
        </button>
        <div className="text-lg font-bold text-main">记录详情</div>
      </div>

      {/* 金额卡 */}
      <div className="cartoon-card flex flex-col items-center py-7">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-full text-4xl"
          style={{ background: `${color}1F` }}
        >
          {record.categoryIcon}
        </div>
        <div className="mt-2 text-4xl font-bold" style={{ color }}>
          {isExpense ? '-' : '+'}
          {record.amount.toFixed(2)}
        </div>
        <div
          className="mt-1.5 rounded-xl px-3 py-1 text-[13px] font-bold"
          style={{ background: `${color}1A`, color }}
        >
          {isExpense ? '支出' : '收入'} · {record.categoryName}
        </div>
      </div>

      {/* 信息卡 */}
      <div className="cartoon-card mt-3.5 py-1">
        <InfoRow emoji="📅" label="日期" value={record.recordDate} />
        <div className="border-b border-line" />
        <InfoRow emoji="📝" label="备注" value={record.remark || '-'} />
        <div className="border-b border-line" />
        <InfoRow emoji="🕐" label="记录时间" value={record.createdAt} />
      </div>

      {/* 凭证图 */}
      {record.voucherUrl && (
        <button
          className="cartoon-card mt-3.5 block w-full p-2.5 text-left"
          onClick={() => window.open(fileApi.fixUrl(record.voucherUrl!), '_blank')}
        >
          <div className="px-1 pt-1 text-[13px] text-sub">📷 凭证图片 (点击查看大图)</div>
          <img
            src={fileApi.fixUrl(record.voucherUrl)}
            alt="凭证"
            className="mt-2 h-44 w-full rounded-2xl object-cover"
          />
        </button>
      )}

      {/* 操作按钮 */}
      <div className="mt-6 flex gap-4">
        <Button size="large" block className="!h-12 !rounded-2xl !border-primary !text-primary !font-bold" onClick={() => navigate('/record/add', { state: { record } })}>
          ✏️ 编辑
        </Button>
        <Popconfirm title="删除记录" description="确定删除这条记账记录吗?" onConfirm={remove}>
          <Button size="large" danger block className="!h-12 !rounded-2xl !border-expense !text-expense !font-bold" loading={deleting}>
            🗑️ 删除
          </Button>
        </Popconfirm>
      </div>
    </div>
  );
}

function InfoRow({ emoji, label, value }: { emoji: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <span className="text-lg">{emoji}</span>
      <span className="text-sm text-sub">{label}</span>
      <div className="flex-1" />
      <span className="text-right text-sm font-bold text-main">{value}</span>
    </div>
  );
}

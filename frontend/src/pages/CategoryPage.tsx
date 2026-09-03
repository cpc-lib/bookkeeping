import { useCallback, useEffect, useState } from 'react';
import { Button, Input, message, Modal, Popconfirm, Spin } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { categoryApi } from '../api/category';
import { ApiException } from '../api/client';
import type { Category } from '../models/types';
import { CATEGORY_ICONS } from '../models/constants';
import EmptyView from '../components/EmptyView';

/** 分类管理页: 每个用户独立维护自己的支出/收入分类 */
export default function CategoryPage() {
  const [type, setType] = useState<1 | 2>(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  /** 编辑弹窗状态: null-关闭; {}-新增; {id,...}-编辑 */
  const [editing, setEditing] = useState<Category | 'new' | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setCategories((await categoryApi.list(type)) ?? []);
    } catch (e) {
      message.error(e instanceof ApiException ? e.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    load();
  }, [load]);

  const color = type === 1 ? '#FF6B6B' : '#2ED573';

  return (
    <div className="min-h-screen pb-6">
      <div className="pt-4 text-center text-lg font-bold text-main">我的分类</div>

      {/* 支出/收入切换 */}
      <div className="mt-3 flex gap-2.5 px-4">
        {(
          [
            { label: '💸 支出分类', value: 1 as const },
            { label: '💰 收入分类', value: 2 as const },
          ]
        ).map((it) => (
          <button
            key={it.value}
            className={`flex-1 rounded-full border-[1.5px] py-2.5 text-sm font-bold transition-all active:scale-95 ${
              type === it.value ? 'border-transparent text-white' : 'border-line bg-white text-sub'
            }`}
            style={type === it.value ? { background: it.value === 1 ? '#FF6B6B' : '#2ED573' } : undefined}
            onClick={() => setType(it.value)}
          >
            {it.label}
          </button>
        ))}
      </div>

      {/* 分类宫格 */}
      <div className="px-4 pt-3">
        {loading ? (
          <div className="flex justify-center py-20">
            <Spin size="large" />
          </div>
        ) : categories.length === 0 ? (
          <EmptyView emoji="🏷️" text="还没有分类, 点右下角添加~" />
        ) : (
          <div className="grid grid-cols-4 gap-2.5">
            {categories.map((c) => (
              <button
                key={c.id}
                className="cartoon-card relative flex aspect-square flex-col items-center justify-center gap-1.5 active:scale-95 transition-transform"
                onClick={() => setEditing(c)}
              >
                <span className="text-3xl">{c.icon}</span>
                <span className="max-w-full truncate px-1.5 text-[13px] font-bold text-main">{c.name}</span>
                <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-expense/10 text-[11px] text-expense">
                  ✕
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 新增按钮 */}
      <button
        className="fixed bottom-24 right-[max(1rem,calc(50%-14rem))] z-10 flex h-14 w-14 items-center justify-center rounded-full text-2xl text-white shadow-fab transition-transform active:scale-90"
        style={{ background: color }}
        onClick={() => setEditing('new')}
        aria-label="新增分类"
      >
        <PlusOutlined />
      </button>

      {editing && (
        <CategoryEditModal
          initial={editing === 'new' ? null : editing}
          type={type}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
    </div>
  );
}

/** 新增/编辑分类弹窗(含emoji图标选择与删除) */
function CategoryEditModal({
  initial,
  type,
  onClose,
  onSaved,
}: {
  initial: Category | null;
  type: 1 | 2;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [icon, setIcon] = useState(initial?.icon ?? '📌');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const save = async () => {
    if (!name.trim()) {
      message.warning('请输入分类名称');
      return;
    }
    setSaving(true);
    try {
      if (initial) {
        await categoryApi.update(initial.id, name.trim(), icon);
      } else {
        await categoryApi.add(name.trim(), type, icon);
      }
      onSaved();
    } catch (e) {
      message.error(e instanceof ApiException ? e.message : '保存失败');
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!initial) return;
    setDeleting(true);
    try {
      await categoryApi.remove(initial.id);
      message.success('已删除(历史记录不受影响)');
      onSaved();
    } catch (e) {
      message.error(e instanceof ApiException ? e.message : '删除失败');
      setDeleting(false);
    }
  };

  return (
    <Modal
      open
      title={<span className="text-main">{initial ? '编辑分类' : `新增${type === 1 ? '支出' : '收入'}分类`}</span>}
      onCancel={onClose}
      footer={[
        initial ? (
          <Popconfirm key="del" title="删除分类" description="历史记账记录不受影响, 确定删除?" onConfirm={remove}>
            <Button danger loading={deleting}>
              删除
            </Button>
          </Popconfirm>
        ) : null,
        <Button key="cancel" onClick={onClose}>
          取消
        </Button>,
        <Button key="ok" type="primary" loading={saving} onClick={save}>
          保存
        </Button>,
      ]}
    >
      <div className="flex items-center gap-2 py-1">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cream text-2xl">{icon}</div>
        <Input
          size="large"
          placeholder="分类名称"
          maxLength={20}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onPressEnter={save}
        />
      </div>
      <div className="mt-1 text-xs text-sub">点击选择图标</div>
      <div className="mt-1 grid max-h-44 grid-cols-8 gap-1 overflow-y-auto">
        {CATEGORY_ICONS.map((e) => (
          <button
            key={e}
            className={`flex h-10 items-center justify-center rounded-xl text-xl transition-all active:scale-90 ${
              e === icon ? 'border-2 border-primary bg-primary/10' : ''
            }`}
            onClick={() => setIcon(e)}
          >
            {e}
          </button>
        ))}
      </div>
    </Modal>
  );
}

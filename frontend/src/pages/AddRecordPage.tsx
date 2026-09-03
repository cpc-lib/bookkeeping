import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { DatePicker, Input, message } from 'antd';
import { CloseOutlined, LeftOutlined, PictureOutlined } from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import { categoryApi } from '../api/category';
import { recordApi } from '../api/record';
import { fileApi } from '../api/file';
import { ApiException } from '../api/client';
import type { Category, RecordItem } from '../models/types';
import { useDataStore } from '../stores/data';
import NumKeypad from '../components/NumKeypad';

/** 记一笔/编辑记账: 收支切换 + 分类 + 金额键盘 + 凭证图片 */
export default function AddRecordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const editRecord = (location.state as { record?: RecordItem } | null)?.record ?? null;
  const bump = useDataStore((s) => s.bump);

  const [type, setType] = useState<1 | 2>(editRecord?.type ?? 1);
  const [amount, setAmount] = useState(editRecord ? editRecord.amount.toFixed(2) : '');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selected, setSelected] = useState<Category | null>(null);
  const [date, setDate] = useState<Dayjs>(dayjs(editRecord?.recordDate ?? undefined));
  const [remark, setRemark] = useState(editRecord?.remark ?? '');
  const [voucherUrl, setVoucherUrl] = useState<string | null>(editRecord?.voucherUrl ?? null);
  const [voucherFile, setVoucherFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 加载分类
  useEffect(() => {
    let cancelled = false;
    categoryApi
      .list(type)
      .then((list) => {
        if (cancelled) return;
        const cats = list ?? [];
        setCategories(cats);
        const pre = editRecord ? cats.find((c) => c.id === editRecord.categoryId) : null;
        setSelected(pre ?? (cats.length > 0 ? cats[0] : null));
      })
      .catch((e) => message.error(e instanceof ApiException ? e.message : '分类加载失败'));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  // 本地文件预览(objectURL)
  useEffect(() => {
    if (voucherFile) {
      const url = URL.createObjectURL(voucherFile);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreview(null);
    return undefined;
  }, [voucherFile]);

  const switchType = (t: 1 | 2) => {
    if (type === t) return;
    setType(t);
    setSelected(null);
  };

  const onKey = (key: string) => {
    setAmount((prev) => {
      if (key === '.') {
        if (prev.includes('.')) return prev;
        return prev === '' ? '0.' : `${prev}.`;
      }
      let next = prev === '0' ? '' : prev;
      const dot = next.indexOf('.');
      if (dot >= 0 && next.length - dot > 2) return prev; // 小数最多2位
      if (dot < 0 && next.length >= 8) return prev; // 整数最多8位
      return next + key;
    });
  };

  const onBackspace = () => setAmount((prev) => (prev.length > 0 ? prev.slice(0, -1) : prev));

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVoucherFile(file);
      setVoucherUrl(null); // 以新文件为准
    }
    e.target.value = ''; // 允许重复选择同一文件
  };

  const save = async () => {
    const value = parseFloat(amount);
    if (!value || value <= 0) {
      message.warning('请输入金额');
      return;
    }
    if (!selected) {
      message.warning('请选择分类');
      return;
    }
    setSaving(true);
    try {
      // 有新凭证先上传MinIO
      let url = voucherUrl;
      if (voucherFile) {
        url = await fileApi.uploadVoucher(voucherFile);
      }
      const payload = {
        categoryId: selected.id,
        amount: value,
        remark: remark.trim(),
        voucherUrl: url,
        recordDate: date.format('YYYY-MM-DD'),
      };
      if (editRecord) {
        await recordApi.update({ id: editRecord.id, ...payload });
      } else {
        await recordApi.add(payload);
      }
      bump();
      message.success('保存成功 🎉');
      navigate(-1);
    } catch (e) {
      message.error(e instanceof ApiException || e instanceof Error ? e.message : '保存失败, 请稍后重试');
    } finally {
      setSaving(false);
    }
  };

  const typeColor = type === 1 ? '#FF6B6B' : '#2ED573';

  return (
    <div className="flex h-screen flex-col">
      {/* 头部 */}
      <div className="flex items-center gap-2 px-4 pb-2 pt-4">
        <button className="text-xl text-main active:scale-90 transition-transform" onClick={() => navigate(-1)}>
          <LeftOutlined />
        </button>
        <div className="text-lg font-bold text-main">{editRecord ? '编辑记录' : '记一笔'}</div>
      </div>

      {/* 可滚动内容区 */}
      <div className="flex-1 overflow-y-auto px-4 pb-3">
        {/* 支出/收入切换 */}
        <div className="flex gap-2 py-1">
          {(
            [
              { label: '💸 支出', value: 1 as const, color: '#FF6B6B' },
              { label: '💰 收入', value: 2 as const, color: '#2ED573' },
            ]
          ).map((it) => (
            <button
              key={it.value}
              className={`flex-1 rounded-full border-[1.5px] py-2.5 text-[15px] font-bold transition-all active:scale-95 ${
                type === it.value ? 'border-transparent text-white' : 'border-line bg-white text-sub'
              }`}
              style={type === it.value ? { background: it.color, boxShadow: `0 4px 10px ${it.color}59` } : undefined}
              onClick={() => switchType(it.value)}
            >
              {it.label}
            </button>
          ))}
        </div>

        {/* 金额显示 */}
        <div className="cartoon-card mt-2.5 flex items-end px-5 py-3.5">
          <span className="text-2xl font-bold" style={{ color: typeColor }}>
            ¥
          </span>
          <div
            className="flex-1 truncate text-right text-4xl font-bold"
            style={{ color: amount ? typeColor : '#B9A99A' }}
          >
            {amount || '0.00'}
          </div>
        </div>

        {/* 分类宫格 */}
        <div className="cartoon-card mt-2.5 p-3">
          {categories.length === 0 ? (
            <div className="py-6 text-center text-[13px] text-sub">暂无分类, 请先到「分类」页添加</div>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {categories.map((c) => {
                const active = selected?.id === c.id;
                return (
                  <button
                    key={c.id}
                    className={`flex flex-col items-center justify-center gap-1 rounded-2xl border-2 py-2.5 transition-all active:scale-95 ${
                      active ? '' : 'border-transparent bg-cream'
                    }`}
                    style={active ? { background: `${typeColor}1F`, borderColor: typeColor } : undefined}
                    onClick={() => setSelected(c)}
                  >
                    <span className="text-[26px] leading-none">{c.icon}</span>
                    <span
                      className="max-w-full truncate px-1 text-xs"
                      style={{ color: active ? typeColor : '#B9A99A', fontWeight: active ? 700 : 400 }}
                    >
                      {c.name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 日期/备注/凭证 */}
        <div className="cartoon-card mt-2.5 px-4 py-1">
          <div className="flex items-center gap-2.5 border-b border-line py-2.5">
            <span className="text-xl">📅</span>
            <span className="text-sm text-sub">日期</span>
            <div className="flex-1" />
            <DatePicker
              variant="borderless"
              value={date}
              allowClear={false}
              maxDate={dayjs().add(1, 'day')}
              onChange={(d) => d && setDate(d)}
            />
          </div>
          <div className="border-b border-line py-1">
            <Input
              variant="borderless"
              placeholder="📝 添加备注..."
              maxLength={255}
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2.5 py-2.5">
            <span className="text-xl">📷</span>
            <span className="text-sm text-sub">凭证</span>
            <div className="flex-1" />
            {preview || voucherUrl ? (
              <div className="relative">
                <img
                  src={preview ?? fileApi.fixUrl(voucherUrl!)}
                  alt="凭证"
                  className="h-14 w-14 rounded-xl object-cover"
                />
                <button
                  className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white"
                  onClick={() => {
                    setVoucherFile(null);
                    setVoucherUrl(null);
                  }}
                >
                  <CloseOutlined style={{ fontSize: 10 }} />
                </button>
                <button
                  className="absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <PictureOutlined style={{ fontSize: 10 }} />
                </button>
              </div>
            ) : (
              <button
                className="flex h-14 w-14 items-center justify-center rounded-xl border-[1.5px] border-primary/40 bg-primary/10 text-primary active:scale-90 transition-transform"
                onClick={() => fileInputRef.current?.click()}
              >
                <PictureOutlined style={{ fontSize: 24 }} />
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onPickFile} />
          </div>
        </div>
      </div>

      {/* 数字键盘 */}
      <NumKeypad onKey={onKey} onBackspace={onBackspace} onClear={() => setAmount('')} onSubmit={save} saving={saving} />
    </div>
  );
}

import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs, { type Dayjs } from 'dayjs';
import { message, Spin } from 'antd';
import { recordApi } from '../api/record';
import { ApiException } from '../api/client';
import type { RecordItem } from '../models/types';
import { useDataStore } from '../stores/data';
import MonthPicker from '../components/MonthPicker';
import EmptyView from '../components/EmptyView';

const PAGE_SIZE = 20;

/** 明细页: 按月查看收支记录 */
export default function RecordsPage() {
  const navigate = useNavigate();
  const version = useDataStore((s) => s.version);

  const [month, setMonth] = useState<Dayjs>(dayjs().startOf('month'));
  const [typeFilter, setTypeFilter] = useState<0 | 1 | 2>(0);
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totals, setTotals] = useState({ expense: 0, income: 0 });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false);

  /** 加载分页数据 */
  const load = useCallback(
    async (targetPage: number, replace: boolean) => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      setLoading(true);
      try {
        const result = await recordApi.page({
          page: targetPage,
          size: PAGE_SIZE,
          type: typeFilter === 0 ? undefined : (typeFilter as 1 | 2),
          startDate: month.startOf('month').format('YYYY-MM-DD'),
          endDate: month.endOf('month').format('YYYY-MM-DD'),
        });
        if (!result) return;
        if (replace) {
          setRecords(result.list);
          setTotals({ expense: result.totalExpense, income: result.totalIncome });
        } else {
          setRecords((prev) => [...prev, ...result.list]);
        }
        setTotal(result.total);
        setHasMore((replace ? result.list.length : records.length + result.list.length) < result.total);
        setPage(targetPage + 1);
      } catch (e) {
        message.error(e instanceof ApiException ? e.message : '加载失败, 请稍后重试');
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [month, typeFilter, records.length],
  );

  // 月份/类型/数据版本变化 -> 重新加载第一页
  useEffect(() => {
    load(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, typeFilter, version]);

  // 滚动到底部自动加载更多
  useEffect(() => {
    const onScroll = () => {
      if (
        hasMore &&
        !loadingRef.current &&
        window.innerHeight + window.scrollY >= document.body.scrollHeight - 120
      ) {
        load(page, false);
      }
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [hasMore, page, load]);

  /** 按日期分组 */
  const groups: { date: string; items: RecordItem[] }[] = [];
  records.forEach((r) => {
    const last = groups[groups.length - 1];
    if (last && last.date === r.recordDate) {
      last.items.push(r);
    } else {
      groups.push({ date: r.recordDate, items: [r] });
    }
  });

  const balance = totals.income - totals.expense;

  return (
    <div>
      <div className="px-4 pt-3">
        <MonthPicker month={month} onChange={setMonth} />
      </div>

      {/* 收支汇总卡 */}
      <div className="mx-4 mt-3 flex items-center rounded-3xl bg-gradient-to-r from-[#FFB84C] to-primary px-4 py-4 text-white shadow-card">
        <SummaryCol label="支出" emoji="💸" value={totals.expense} />
        <div className="h-9 w-px bg-white/40" />
        <SummaryCol label="收入" emoji="💰" value={totals.income} />
        <div className="h-9 w-px bg-white/40" />
        <SummaryCol label="结余" emoji="🪙" value={balance} />
      </div>

      {/* 类型筛选 */}
      <div className="mt-3 flex gap-2.5 px-4">
        {(
          [
            { label: '全部', value: 0 },
            { label: '支出', value: 1 },
            { label: '收入', value: 2 },
          ] as const
        ).map((chip) => (
          <button
            key={chip.value}
            className={`rounded-2xl border px-4 py-1.5 text-[13px] font-bold transition-all active:scale-95 ${
              typeFilter === chip.value
                ? 'border-primary bg-primary text-white'
                : 'border-line bg-white text-sub'
            }`}
            onClick={() => setTypeFilter(chip.value)}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* 记录列表 */}
      {records.length === 0 && !loading ? (
        <EmptyView text={'这个月还没有记账哦~\n点下方 + 记一笔吧 ✏️'} />
      ) : (
        <div className="mt-1 px-4 pb-2">
          {groups.map((g) => (
            <div key={g.date}>
              <div className="px-1 pb-1.5 pt-3 text-[13px] font-bold text-sub">{formatDayHeader(g.date)}</div>
              {g.items.map((r) => (
                <RecordRow key={r.id} record={r} onClick={() => navigate(`/record/${r.id}`, { state: { record: r } })} />
              ))}
            </div>
          ))}
          <div className="flex items-center justify-center py-3 text-xs text-sub">
            {loading ? (
              <Spin size="small" />
            ) : hasMore ? (
              `已显示 ${records.length}/${total} 条, 下拉加载更多`
            ) : (
              '— 到底啦, 去记一笔吧 —'
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCol({ label, emoji, value }: { label: string; emoji: string; value: number }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-1">
      <span className="text-[13px] text-white/90">
        {emoji} {label}
      </span>
      <span className="text-[17px] font-bold">{value.toFixed(2)}</span>
    </div>
  );
}

function RecordRow({ record, onClick }: { record: RecordItem; onClick: () => void }) {
  const isExpense = record.type === 1;
  return (
    <button
      className="cartoon-card mb-2 flex w-full items-center gap-3 !rounded-2xl p-3 text-left transition-transform active:scale-[0.98]"
      onClick={onClick}
    >
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-2xl"
        style={{ background: isExpense ? 'rgba(255,107,107,0.12)' : 'rgba(46,213,115,0.12)' }}
      >
        {record.categoryIcon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-[15px] font-bold text-main">
          {record.categoryName}
          {record.voucherUrl && <span className="text-[13px]">📷</span>}
        </div>
        {record.remark && (
          <div className="truncate text-xs text-sub">{record.remark}</div>
        )}
      </div>
      <div className={`shrink-0 text-[17px] font-bold ${isExpense ? 'text-expense' : 'text-income'}`}>
        {isExpense ? '-' : '+'}
        {record.amount.toFixed(2)}
      </div>
    </button>
  );
}

/** 日期头: 今天/昨天/x月x日 · 周x */
function formatDayHeader(date: string): string {
  const d = dayjs(date);
  const today = dayjs();
  const yesterday = today.subtract(1, 'day');
  if (d.isSame(today, 'day')) return `今天 · ${d.format('dd')}`;
  if (d.isSame(yesterday, 'day')) return `昨天 · ${d.format('dd')}`;
  return `${d.format('M月D日')} · ${d.format('dd')}`;
}

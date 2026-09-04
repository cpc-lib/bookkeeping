import { useEffect, useState } from 'react';
import { message, Spin } from 'antd';
import { recordApi } from '../api/record';
import { ApiException } from '../api/client';
import type { CategoryStat } from '../models/types';
import { PIE_COLORS } from '../models/constants';
import { useDataStore } from '../stores/data';
import DateRangePicker, { initialDateRange, resolveRange, type DateRangeState } from '../components/DateRangePicker';
import EmptyView from '../components/EmptyView';
import DonutChart from '../components/DonutChart';

/** 统计页: 区间收支环形图 + 分类排行 */
export default function StatsPage() {
  const version = useDataStore((s) => s.version);
  const [range, setRange] = useState<DateRangeState>(initialDateRange);
  const [type, setType] = useState<1 | 2>(1);
  const [stats, setStats] = useState<CategoryStat[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const { startDate, endDate } = resolveRange(range);
    recordApi
      .statByCategory({ type, startDate, endDate })
      .then((list) => {
        if (!cancelled) setStats(list ?? []);
      })
      .catch((e) => {
        message.error(e instanceof ApiException ? e.message : '统计加载失败');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [range, type, version]);

  const total = stats.reduce((s, i) => s + i.total, 0);
  const max = stats.reduce((m, i) => Math.max(m, i.total), 0);
  const typeColor = type === 1 ? '#FF6B6B' : '#2ED573';

  return (
    <div>
      <div className="px-4 pt-3">
        <DateRangePicker value={range} onChange={setRange} />
      </div>

      {/* 支出/收入切换 */}
      <div className="mt-3 flex gap-2.5 px-4">
        {(
          [
            { label: '💸 支出构成', value: 1 as const },
            { label: '💰 收入构成', value: 2 as const },
          ]
        ).map((it) => (
          <button
            key={it.value}
            className={`flex-1 rounded-2xl border py-2.5 text-sm font-bold transition-all active:scale-95 ${
              type === it.value ? 'border-transparent text-white' : 'border-line bg-white text-sub'
            }`}
            style={type === it.value ? { background: it.value === 1 ? '#FF6B6B' : '#2ED573' } : undefined}
            onClick={() => setType(it.value)}
          >
            {it.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Spin size="large" />
        </div>
      ) : stats.length === 0 ? (
        <EmptyView emoji="📊" text="该区间暂无数据~" />
      ) : (
        <div className="px-4 pb-6">
          {/* 环形图卡片 */}
          <div className="cartoon-card mt-3 flex flex-col items-center p-5">
            <div className="mb-1 self-start text-[13px] text-sub">
              {type === 1 ? '区间总支出' : '区间总收入'}
            </div>
            <DonutChart
              size={190}
              hole={116}
              segments={stats.map((s, i) => ({ value: s.total, color: PIE_COLORS[i % PIE_COLORS.length] }))}
              center={
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{ color: typeColor }}>
                    ¥{total.toFixed(2)}
                  </div>
                  <div className="mt-0.5 text-xs text-sub">
                    {stats.length} 个{type === 1 ? '支出' : '收入'}分类
                  </div>
                  <div className="mt-0.5 text-[11px] text-sub/70">
                    {resolveRange(range).label}
                  </div>
                </div>
              }
            />
          </div>

          {/* 分类排行 */}
          <div className="cartoon-card mt-4 p-4">
            <div className="mb-1 text-[15px] font-bold text-main">分类排行 🏆</div>
            {stats.map((s, i) => (
              <div key={s.categoryId} className="py-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">{s.icon}</span>
                  <span className="flex-1 truncate text-sm font-bold text-main">{s.categoryName}</span>
                  <span className="text-xs text-sub">{s.percent.toFixed(1)}%</span>
                  <span className="text-sm font-bold" style={{ color: typeColor }}>
                    ¥{s.total.toFixed(2)}
                  </span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-line">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${max > 0 ? (s.total / max) * 100 : 0}%`,
                      background: PIE_COLORS[i % PIE_COLORS.length],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

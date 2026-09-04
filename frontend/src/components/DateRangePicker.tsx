import { useState } from 'react';
import dayjs, { type Dayjs } from 'dayjs';
import { CaretLeftOutlined, CaretRightOutlined } from '@ant-design/icons';
import { DatePicker, Popover } from 'antd';

/** 日期筛选模式 */
export type DateRangeMode = 'month' | 'last7' | 'last30' | 'custom';

export interface DateRangeState {
  mode: DateRangeMode;
  /** 按月模式的月份 */
  month: Dayjs;
  /** 自定义模式的 [开始, 结束] */
  custom: [Dayjs, Dayjs] | null;
}

/** 默认: 当前月 */
export const initialDateRange = (): DateRangeState => ({
  mode: 'month',
  month: dayjs().startOf('month'),
  custom: null,
});

/** 解析为接口入参与展示标签 */
export function resolveRange(state: DateRangeState): { startDate: string; endDate: string; label: string } {
  const today = dayjs();
  switch (state.mode) {
    case 'last7': {
      const start = today.subtract(6, 'day');
      return {
        startDate: start.format('YYYY-MM-DD'),
        endDate: today.format('YYYY-MM-DD'),
        label: `近7天 (${start.format('M月D日')}-${today.format('M月D日')})`,
      };
    }
    case 'last30': {
      const start = today.subtract(1, 'month').add(1, 'day');
      return {
        startDate: start.format('YYYY-MM-DD'),
        endDate: today.format('YYYY-MM-DD'),
        label: `近一个月 (${start.format('M月D日')}-${today.format('M月D日')})`,
      };
    }
    case 'custom': {
      const [s, e] = state.custom ?? [today.subtract(6, 'day'), today];
      return {
        startDate: s.format('YYYY-MM-DD'),
        endDate: e.format('YYYY-MM-DD'),
        label: `${s.format('YYYY-MM-DD')} ~ ${e.format('YYYY-MM-DD')}`,
      };
    }
    default:
      return {
        startDate: state.month.startOf('month').format('YYYY-MM-DD'),
        endDate: state.month.endOf('month').format('YYYY-MM-DD'),
        label: state.month.format('YYYY年M月'),
      };
  }
}

const MODES: { key: DateRangeMode; label: string }[] = [
  { key: 'month', label: '按月' },
  { key: 'last7', label: '近7天' },
  { key: 'last30', label: '近一个月' },
  { key: 'custom', label: '自定义' },
];

interface Props {
  value: DateRangeState;
  onChange: (v: DateRangeState) => void;
}

/** 日期筛选条: 按月切换 / 近7天 / 近一个月 / 自定义区间 */
export default function DateRangePicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const { label } = resolveRange(value);
  const isMonth = value.mode === 'month';
  const isCurrentMonth = value.month.isSame(dayjs(), 'month');

  const pickMode = (mode: DateRangeMode) => {
    if (mode === 'custom' && !value.custom) {
      const today = dayjs();
      onChange({ ...value, mode, custom: [today.subtract(6, 'day'), today] });
    } else {
      onChange({ ...value, mode });
    }
  };

  const pickerBody = (
    <div className="w-[280px]">
      <div className="flex gap-2">
        {MODES.map((m) => (
          <button
            key={m.key}
            className={`flex-1 rounded-xl border px-2 py-1.5 text-xs font-bold transition-all active:scale-95 ${
              value.mode === m.key ? 'border-primary bg-primary text-white' : 'border-line bg-white text-sub'
            }`}
            onClick={() => pickMode(m.key)}
          >
            {m.label}
          </button>
        ))}
      </div>
      {value.mode === 'custom' && (
        <div className="mt-3">
          <DatePicker.RangePicker
            value={value.custom}
            allowClear={false}
            disabledDate={(d) => d.isAfter(dayjs().add(1, 'day'), 'day')}
            onChange={(v) => {
              if (v && v[0] && v[1]) {
                onChange({ ...value, custom: [v[0], v[1]] });
              }
            }}
            style={{ width: '100%' }}
          />
        </div>
      )}
    </div>
  );

  return (
    <div className="flex items-center gap-2">
      {isMonth && (
        <button
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-white text-primary active:scale-90 transition-transform"
          onClick={() => onChange({ ...value, month: value.month.subtract(1, 'month') })}
        >
          <CaretLeftOutlined />
        </button>
      )}

      <Popover content={pickerBody} trigger="click" open={open} onOpenChange={setOpen} placement="bottom">
        <button className="flex flex-1 items-center justify-center gap-1.5 text-[17px] font-bold text-main active:scale-[0.98] transition-transform">
          <span className="truncate">{label}</span>
          <span className="text-xs text-sub">▾</span>
        </button>
      </Popover>

      {isMonth && (
        <>
          <button
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-white text-primary active:scale-90 transition-transform"
            onClick={() => onChange({ ...value, month: value.month.add(1, 'month') })}
          >
            <CaretRightOutlined />
          </button>
          {!isCurrentMonth && (
            <button
              className="rounded-xl bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary active:scale-90 transition-transform"
              onClick={() => onChange({ ...value, month: dayjs().startOf('month') })}
            >
              本月
            </button>
          )}
        </>
      )}
    </div>
  );
}

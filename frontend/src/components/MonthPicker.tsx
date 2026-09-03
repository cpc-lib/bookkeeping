import type { Dayjs } from 'dayjs';
import { CaretLeftOutlined, CaretRightOutlined } from '@ant-design/icons';

interface Props {
  month: Dayjs;
  onChange: (m: Dayjs) => void;
}

/** 月份切换条: ◀ 2024年6月 ▶ + 本月快捷键 */
export default function MonthPicker({ month, onChange }: Props) {
  const isCurrent = month.isSame(new Date(), 'month');

  return (
    <div className="flex items-center gap-2">
      <button
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-white text-primary active:scale-90 transition-transform"
        onClick={() => onChange(month.subtract(1, 'month'))}
      >
        <CaretLeftOutlined />
      </button>
      <div
        className="flex-1 cursor-pointer text-center text-[17px] font-bold text-main"
        onClick={() => onChange(month)}
      >
        {month.format('YYYY年M月')}
      </div>
      <button
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-white text-primary active:scale-90 transition-transform"
        onClick={() => onChange(month.add(1, 'month'))}
      >
        <CaretRightOutlined />
      </button>
      {!isCurrent && (
        <button
          className="rounded-xl bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary active:scale-90 transition-transform"
          onClick={() => onChange(month)}
        >
          本月
        </button>
      )}
    </div>
  );
}

interface Props {
  onKey: (key: string) => void;
  onBackspace: () => void;
  onClear: () => void;
  onSubmit: () => void;
  saving?: boolean;
}

/** 记账金额数字键盘: 左侧4行x3列数字区 + 右侧退格/大保存键 */
export default function NumKeypad({ onKey, onBackspace, onClear, onSubmit, saving }: Props) {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '.'];

  const keyBtn = (k: string) => (
    <button
      key={k}
      className={
        k === 'C'
          ? 'flex items-center justify-center rounded-2xl bg-expense/10 text-sm font-bold text-expense active:scale-95 transition-transform'
          : 'flex items-center justify-center rounded-2xl bg-cream text-[22px] font-semibold text-main active:scale-95 transition-transform'
      }
      onClick={() => (k === 'C' ? onClear() : onKey(k))}
    >
      {k === 'C' ? '清零' : k}
    </button>
  );

  return (
    <div className="grid h-60 grid-cols-4 grid-rows-4 gap-1.5 border-t border-line bg-white p-2">
      {/* 第1行: 1 2 3 ⌫ */}
      {keys.slice(0, 3).map(keyBtn)}
      <button
        className="flex items-center justify-center rounded-2xl bg-cream text-xl text-sub active:scale-95 transition-transform"
        onClick={onBackspace}
      >
        ⌫
      </button>

      {/* 第2-4行: 数字区 + 右侧跨3行保存键 */}
      {keys.slice(3, 6).map(keyBtn)}
      <button
        className="row-span-3 flex items-center justify-center rounded-2xl bg-gradient-to-b from-[#FFB84C] to-primary-deep text-lg font-bold tracking-widest text-white shadow-fab active:scale-95 transition-transform disabled:opacity-60"
        onClick={onSubmit}
        disabled={saving}
      >
        {saving ? '保存中' : '保 存'}
      </button>
      {keys.slice(6, 9).map(keyBtn)}
      {keys.slice(9, 12).map(keyBtn)}
    </div>
  );
}

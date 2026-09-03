interface Props {
  emoji?: string;
  text?: string;
}

/** 空状态占位视图 */
export default function EmptyView({ emoji = '🐷', text = '还没有记录哦~' }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="text-5xl">{emoji}</div>
      <div className="mt-3 text-sm text-sub whitespace-pre-line text-center">{text}</div>
    </div>
  );
}

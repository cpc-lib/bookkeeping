interface Segment {
  value: number;
  color: string;
}

interface Props {
  segments: Segment[];
  size?: number;
  /** 中心镂空半径(px) */
  hole?: number;
  center?: React.ReactNode;
}

/** 纯CSS环形图(conic-gradient实现, 零依赖) */
export default function DonutChart({ segments, size = 180, hole = 110, center }: Props) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total <= 0) return null;

  let acc = 0;
  const stops = segments.map((seg) => {
    const start = (acc / total) * 360;
    acc += seg.value;
    const end = (acc / total) * 360;
    return `${seg.color} ${start}deg ${end}deg`;
  });

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        className="h-full w-full rounded-full"
        style={{ background: `conic-gradient(${stops.join(', ')})` }}
      />
      <div
        className="absolute flex items-center justify-center rounded-full bg-white"
        style={{ inset: (size - hole) / 2, width: hole, height: hole }}
      >
        {center}
      </div>
    </div>
  );
}

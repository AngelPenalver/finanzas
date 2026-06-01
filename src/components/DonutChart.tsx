"use client";

type Segment = {
  label: string;
  value: number;
  color: string;
};

type Props = {
  segments: Segment[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerSub?: string;
  centerLabelColor?: string;
};

export function DonutChart({
  segments,
  size = 180,
  thickness = 32,
  centerLabel,
  centerSub,
  centerLabelColor = "text-white",
}: Props) {
  const radius = (size - thickness) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;

  const total = segments.reduce((s, seg) => s + seg.value, 0);

  let cumulative = 0;
  const arcs = segments.map((seg) => {
    const pct = total > 0 ? seg.value / total : 0;
    const dash = pct * circumference;
    const gap = circumference - dash;
    // offset: negative = start later along the circle
    const offset = circumference - cumulative * circumference;
    cumulative += pct;
    return { ...seg, dash, gap, offset };
  });

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width={size}
        height={size}
        style={{ transform: "rotate(-90deg)" }}
        className="overflow-visible"
      >
        {/* Track */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={thickness}
        />
        {/* Segments */}
        {total === 0 ? (
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={thickness}
          />
        ) : (
          arcs.map((arc, i) => (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke={arc.color}
              strokeWidth={thickness}
              strokeDasharray={`${arc.dash} ${arc.gap}`}
              strokeDashoffset={arc.offset}
              strokeLinecap="butt"
              style={{ transition: "stroke-dasharray 0.5s ease" }}
            />
          ))
        )}
      </svg>
      {/* Center text */}
      {(centerLabel || centerSub) && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          {centerLabel && (
            <p className={`text-lg font-bold ${centerLabelColor} leading-tight`}>
              {centerLabel}
            </p>
          )}
          {centerSub && (
            <p className="text-[10px] text-zinc-500 mt-0.5">{centerSub}</p>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

type Point = { timestamp: number; price: number };

function buildPath(points: Point[], width: number, height: number, padding: number) {
  if (points.length === 0) return "";

  const minX = points[0].timestamp;
  const maxX = points[points.length - 1].timestamp;
  const prices = points.map((point) => point.price);
  const minY = Math.min(...prices);
  const maxY = Math.max(...prices);
  const xRange = Math.max(maxX - minX, 1);
  const yRange = Math.max(maxY - minY, 0.01);

  return points
    .map((point, index) => {
      const x = padding + ((point.timestamp - minX) / xRange) * (width - padding * 2);
      const y = height - padding - ((point.price - minY) / yRange) * (height - padding * 2);
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function buildAreaPath(linePath: string, points: Point[], width: number, height: number, padding: number) {
  if (!linePath || points.length === 0) return "";

  const minX = points[0].timestamp;
  const maxX = points[points.length - 1].timestamp;
  const xRange = Math.max(maxX - minX, 1);
  const firstX = padding;
  const lastX = padding + ((points[points.length - 1].timestamp - minX) / xRange) * (width - padding * 2);

  return `${linePath} L ${lastX.toFixed(2)} ${(height - padding).toFixed(2)} L ${firstX.toFixed(2)} ${(height - padding).toFixed(2)} Z`;
}

export function LineChart({
  points,
  positive = true,
  height = 260,
}: {
  points: Point[];
  positive?: boolean;
  height?: number;
}) {
  const width = 760;
  const padding = 28;
  const safePoints = points.length > 1 ? points : [
    { timestamp: 0, price: 0.5 },
    { timestamp: 1, price: 0.52 },
  ];
  const linePath = buildPath(safePoints, width, height, padding);
  const areaPath = buildAreaPath(linePath, safePoints, width, height, padding);
  const last = safePoints[safePoints.length - 1];
  const stroke = positive ? "#00E5FF" : "#FF6D7A";
  const glow = positive ? "rgba(0, 229, 255, 0.35)" : "rgba(255, 109, 122, 0.28)";

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-white/6 bg-[linear-gradient(180deg,rgba(8,13,23,0.96),rgba(4,8,17,0.92))]">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full">
        <defs>
          <linearGradient id="lineAreaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.3" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0.02" />
          </linearGradient>
          <filter id="lineGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="7" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {[0.2, 0.4, 0.6, 0.8].map((ratio) => (
          <line
            key={ratio}
            x1={padding}
            x2={width - padding}
            y1={height * ratio}
            y2={height * ratio}
            stroke="rgba(255,255,255,0.08)"
            strokeDasharray="4 10"
          />
        ))}

        <path d={areaPath} fill="url(#lineAreaFill)" />
        <path d={linePath} stroke={glow} strokeWidth="7" fill="none" opacity="0.6" filter="url(#lineGlow)" />
        <path d={linePath} stroke={stroke} strokeWidth="2.8" fill="none" />

        <circle
          cx={width - padding}
          cy={(() => {
            const prices = safePoints.map((point) => point.price);
            const minY = Math.min(...prices);
            const maxY = Math.max(...prices);
            const yRange = Math.max(maxY - minY, 0.01);
            return height - padding - ((last.price - minY) / yRange) * (height - padding * 2);
          })()}
          r="5"
          fill={stroke}
          stroke="white"
          strokeWidth="1.5"
        />
      </svg>
    </div>
  );
}

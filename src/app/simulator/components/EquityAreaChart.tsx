import { useId, useMemo, useState, type MouseEvent } from 'react';
import { formatMoney } from '../utils/formatters';

const VIEW_WIDTH = 600;
const VIEW_HEIGHT = 180;

export function EquityAreaChart({ values, title = 'Equity Progression' }: { values: number[]; title?: string }) {
  const chartUid = useId().replace(/:/g, '');
  const fillId = `eq-fill-${chartUid}`;
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 0;
  const range = Math.max(1, max - min);
  const baseValue = values.length > 0 ? values[0] : 0;
  const baseY = VIEW_HEIGHT - ((baseValue - min) / range) * VIEW_HEIGHT;
  const fillColorTop = 'rgba(212,168,67,0.2)';

  const pointsAndArea = useMemo(() => {
    if (values.length <= 1) return null;

    const maxPoints = 700;
    const step = Math.ceil(values.length / maxPoints);
    const sampledValues: Array<{ value: number; index: number }> = [];
    for (let i = 0; i < values.length; i += step) {
      sampledValues.push({ value: values[i], index: i });
    }
    if (sampledValues[sampledValues.length - 1].index !== values.length - 1) {
      sampledValues.push({ value: values[values.length - 1], index: values.length - 1 });
    }

    const coords = sampledValues.map((item) => {
      const x = (item.index / (values.length - 1)) * VIEW_WIDTH;
      const y = VIEW_HEIGHT - ((item.value - min) / range) * VIEW_HEIGHT;
      return { x, y, value: item.value };
    });

    const areaPath = `${coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x},${c.y}`).join(' ')} L ${VIEW_WIDTH},${VIEW_HEIGHT} L 0,${VIEW_HEIGHT} Z`;

    const segments: Array<{ key: string; path: string; stroke: string }> = [];
    for (let index = 0; index < coords.length - 1; index += 1) {
      const prev = coords[index];
      const curr = coords[index + 1];
      const prevAboveBase = prev.value >= baseValue;
      const currAboveBase = curr.value >= baseValue;

      if (prevAboveBase === currAboveBase || curr.value === prev.value) {
        segments.push({
          key: `${index}-${curr.x}-single`,
          path: `M ${prev.x},${prev.y} L ${curr.x},${curr.y}`,
          stroke: prevAboveBase ? '#34d399' : '#fb7185',
        });
        continue;
      }

      const ratioToCross = (baseValue - prev.value) / (curr.value - prev.value);
      const crossX = prev.x + (curr.x - prev.x) * ratioToCross;
      const crossY = VIEW_HEIGHT - ((baseValue - min) / range) * VIEW_HEIGHT;

      segments.push({
        key: `${index}-${crossX}-a`,
        path: `M ${prev.x},${prev.y} L ${crossX},${crossY}`,
        stroke: prevAboveBase ? '#34d399' : '#fb7185',
      });
      segments.push({
        key: `${index}-${crossX}-b`,
        path: `M ${crossX},${crossY} L ${curr.x},${curr.y}`,
        stroke: currAboveBase ? '#34d399' : '#fb7185',
      });
    }

    return { areaPath, segments };
  }, [baseValue, values, min, range]);

  const hoverPoint = useMemo(() => {
    if (hoverIndex === null || values.length === 0) return null;
    const clampedIndex = Math.max(0, Math.min(values.length - 1, hoverIndex));
    const value = values[clampedIndex];
    const x = values.length === 1 ? 0 : (clampedIndex / (values.length - 1)) * VIEW_WIDTH;
    const y = VIEW_HEIGHT - ((value - min) / range) * VIEW_HEIGHT;
    return { index: clampedIndex, value, x, y };
  }, [hoverIndex, min, range, values]);

  const hoverVsBaseUp = useMemo(() => {
    if (!hoverPoint || values.length === 0) return true;
    return hoverPoint.value >= baseValue;
  }, [baseValue, hoverPoint, values.length]);

  const hoverColor = hoverVsBaseUp ? '#34d399' : '#fb7185';

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    if (values.length === 0) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (bounds.width <= 0) return;
    const ratio = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
    const index = Math.round(ratio * Math.max(0, values.length - 1));
    setHoverIndex(index);
  };

  return (
    <div className="relative flex h-full min-h-48 flex-col rounded-2xl border border-[#d4a843]/20 bg-[linear-gradient(180deg,rgba(31,16,12,0.75)_0%,rgba(18,9,7,0.82)_100%)] p-3 shadow-[inset_0_1px_0_rgba(212,168,67,0.1)]">
      <div className="absolute left-3 top-3 z-10 flex w-[calc(100%-1.5rem)] items-center justify-between text-[10px] font-bold uppercase tracking-[0.16em] text-[#d4a843]/70">
        <span>{title}</span>
        <span>{formatMoney(min)} — {formatMoney(max)}</span>
      </div>
      <div
        className="relative mt-5 h-40 w-full flex-1"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverIndex(null)}
      >
        <svg viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`} className="absolute inset-0 h-full w-full drop-shadow-xl" preserveAspectRatio="none">
          <defs>
            <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={fillColorTop} />
              <stop offset="100%" stopColor="#120a08" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {pointsAndArea ? (
            <>
              <line
                x1={0}
                y1={baseY}
                x2={VIEW_WIDTH}
                y2={baseY}
                stroke="rgba(212,168,67,0.35)"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <path d={pointsAndArea.areaPath} fill={`url(#${fillId})`} />
              {pointsAndArea.segments.map((segment) => (
                <path
                  key={segment.key}
                  d={segment.path}
                  fill="none"
                  stroke={segment.stroke}
                  strokeWidth="3"
                  vectorEffect="non-scaling-stroke"
                  strokeLinecap="round"
                />
              ))}
              {hoverPoint ? (
                <>
                  <line
                    x1={hoverPoint.x}
                    y1={0}
                    x2={hoverPoint.x}
                    y2={VIEW_HEIGHT}
                    stroke={hoverColor}
                    strokeOpacity={0.55}
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />
                  <circle cx={hoverPoint.x} cy={hoverPoint.y} r="4" fill={hoverColor} stroke="#120a08" strokeWidth="1.5" />
                </>
              ) : null}
            </>
          ) : (
            <line x1="0" y1="90" x2="600" y2="90" stroke="rgba(212,168,67,0.25)" strokeWidth="2" strokeDasharray="5,5" />
          )}
        </svg>

        {hoverPoint ? (
          <div
            className="pointer-events-none absolute -top-1 z-20 rounded-md border border-[#d4a843]/28 bg-[#1b0f0b]/95 px-2 py-1 text-[10px] font-semibold text-[#f0e6d6] shadow-lg"
            style={{
              left: `${(hoverPoint.x / VIEW_WIDTH) * 100}%`,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <p>Hand {hoverPoint.index + 1}</p>
            <p className={hoverVsBaseUp ? 'text-emerald-300' : 'text-rose-300'}>{formatMoney(hoverPoint.value)}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

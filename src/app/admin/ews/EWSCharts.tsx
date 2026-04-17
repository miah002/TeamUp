"use client";

interface BarData { name: string; value: number }

function CalloutBar({ data }: { data: BarData[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-3 h-36">
      {data.map((d) => (
        <div key={d.name} className="flex-1 flex flex-col items-center gap-1 min-w-0">
          <span className="text-xs font-bold text-[#C8102E]">{d.value}</span>
          <div className="w-full rounded-t-md bg-[#C8102E] opacity-80" style={{ height: `${Math.max((d.value / max) * 96, 4)}px` }} />
          <span className="text-[10px] text-slate-500 truncate w-full text-center">{d.name}</span>
        </div>
      ))}
    </div>
  );
}

function CourseBar({ data }: { data: BarData[] }) {
  return (
    <div className="flex items-end gap-2 h-36">
      {data.map((d) => {
        const color = d.value >= 75 ? "#10b981" : d.value >= 50 ? "#f59e0b" : "#ef4444";
        return (
          <div key={d.name} className="flex-1 flex flex-col items-center gap-1 min-w-0">
            <span className="text-[10px] font-bold" style={{ color }}>{d.value}%</span>
            <div className="w-full rounded-t-md" style={{ height: `${Math.max((d.value / 100) * 96, 4)}px`, backgroundColor: color, opacity: 0.8 }} />
            <span className="text-[10px] text-slate-500 truncate w-full text-center">{d.name}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function EWSCharts({ type, data }: { type: "callouts" | "courses"; data: BarData[] }) {
  if (type === "callouts") return <CalloutBar data={data} />;
  return <CourseBar data={data} />;
}

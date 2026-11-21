import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

export function ReadinessRing({ value, size = 200 }: { value: number; size?: number }) {
  const data = [
    { name: "ready", value },
    { name: "rest", value: Math.max(0, 100 - value) },
  ];
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <defs>
            <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--primary)" />
              <stop offset="100%" stopColor="var(--accent)" />
            </linearGradient>
          </defs>
          <Pie data={data} dataKey="value" innerRadius="74%" outerRadius="100%" startAngle={90} endAngle={-270} stroke="none" cornerRadius={value > 0 && value < 100 ? 10 : 0} isAnimationActive>
            <Cell fill="url(#ring-grad)" />
            <Cell fill="var(--primary-soft)" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="font-display text-4xl font-bold">{value}%</div>
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Role ready</div>
        </div>
      </div>
    </div>
  );
}

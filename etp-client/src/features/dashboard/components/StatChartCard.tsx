// src/features/dashboard/components/StatChartCard.tsx

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ChartDataPoint = {
  date: string;
  value: number;
};

type Props = {
  title: string;
  data: ChartDataPoint[];
  color: string;
  value: string;
  valueFormatter?: (value: number) => string;
};

const chartDateFormatter = new Intl.DateTimeFormat(
  "en-US",
  {
    month: "short",
    day: "numeric",
  },
);

function formatChartDate(value: string): string {
  /*
   * Appending T00:00:00 prevents YYYY-MM-DD values
   * from shifting to the previous date in negative
   * UTC offsets.
   */
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return chartDateFormatter.format(date);
}

export function StatChartCard({
  title,
  data,
  color,
  value,
  valueFormatter = String,
}: Props) {
  return (
    <article className="dashboard-chart">
      <h3 className="dashboard-chart__title">
        {title}
      </h3>

      <div className="dashboard-chart__visual">
        {data.length === 0 ? (
          <div className="dashboard-chart__empty">
            No data is available for this period.
          </div>
        ) : (
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <LineChart
              data={data}
              margin={{
                top: 8,
                right: 8,
                bottom: 0,
                left: 0,
              }}
            >
              <CartesianGrid
                stroke="#dde4ed"
                strokeDasharray="4 4"
                vertical
              />

              <XAxis
                dataKey="date"
                tickFormatter={formatChartDate}
                axisLine={{
                  stroke: "#7b8798",
                }}
                tickLine={false}
                tick={{
                  fill: "#627087",
                  fontSize: 12,
                }}
                minTickGap={18}
              />

              <YAxis
                axisLine={{
                  stroke: "#7b8798",
                }}
                tickLine={false}
                tick={{
                  fill: "#627087",
                  fontSize: 12,
                }}
                width={64}
              />

              <Tooltip
                labelFormatter={(label) =>
                  formatChartDate(String(label))
                }
                formatter={(tooltipValue) => {
                  const numericValue =
                    typeof tooltipValue === "number"
                      ? tooltipValue
                      : Number(tooltipValue);

                  return [
                    valueFormatter(
                      Number.isFinite(numericValue)
                        ? numericValue
                        : 0,
                    ),
                    title,
                  ];
                }}
                contentStyle={{
                  border:
                    "1px solid #dbe1e8",
                  borderRadius: "8px",
                  boxShadow:
                    "0 4px 12px rgb(15 23 42 / 0.08)",
                }}
                labelStyle={{
                  color: "#071a36",
                  fontWeight: 600,
                }}
              />

              <Line
                type="monotone"
                dataKey="value"
                name={title}
                stroke={color}
                strokeWidth={2.5}
                dot={{
                  r: 4.5,
                  fill: "#ffffff",
                  stroke: color,
                  strokeWidth: 2.5,
                }}
                activeDot={{
                  r: 6,
                  fill: "#ffffff",
                  stroke: color,
                  strokeWidth: 3,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="dashboard-chart__value">
        {value}
      </div>
    </article>
  );
}
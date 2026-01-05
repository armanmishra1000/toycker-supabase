"use client"

import { useState, useTransition } from "react"
import {
    ComposedChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from "recharts"
import { ChartDataPoint, getChartData, TimePeriod } from "@/lib/data/chart"
import { convertToLocale } from "@/lib/util/money"

type Props = {
    initialData: ChartDataPoint[]
}

export default function ReportsChart({ initialData }: Props) {
    const [data, setData] = useState<ChartDataPoint[]>(initialData)
    const [period, setPeriod] = useState<TimePeriod>("1m")
    const [isPending, startTransition] = useTransition()

    const handlePeriodChange = (newPeriod: TimePeriod) => {
        setPeriod(newPeriod)
        startTransition(async () => {
            const newData = await getChartData(newPeriod)
            setData(newData)
        })
    }

    const tabs: { label: string; value: TimePeriod }[] = [
        { label: "1 Week", value: "1w" },
        { label: "2 Weeks", value: "2w" },
        { label: "Monthly", value: "1m" },
        { label: "Yearly", value: "1y" },
    ]

    // Optional: check if data is empty
    const isEmpty = data.length === 0 || data.every(d => d.sales === 0 && d.orders === 0)

    return (
        <div className="w-full space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <h3 className="text-sm font-medium text-gray-900">Sales & Orders Report</h3>
                <div className="flex bg-gray-100 rounded-lg p-1">
                    {tabs.map((tab) => (
                        <button
                            key={tab.value}
                            onClick={() => handlePeriodChange(tab.value)}
                            disabled={isPending}
                            className={`
                px-3 py-1 text-xs font-medium rounded-md transition-all
                ${period === tab.value
                                    ? "bg-white text-gray-900 shadow-sm"
                                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
                                }
                ${isPending ? "opacity-70 cursor-wait" : ""}
              `}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className={`h-80 w-full relative ${isPending ? "opacity-50 transition-opacity" : "opacity-100"}`}>
                {isEmpty && !isPending && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50/50 z-10 rounded-lg border border-dashed border-gray-200">
                        <p className="text-sm text-gray-500">No data for this period</p>
                    </div>
                )}
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#6B7280", fontSize: 11 }}
                            tickMargin={10}
                        />
                        {/* Left YAxis for Sales (Bar) */}
                        <YAxis
                            yAxisId="left"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#6B7280", fontSize: 11 }}
                            tickFormatter={(val) => `₹${val}`}
                        />
                        {/* Right YAxis for Orders (Line) - orientation right */}
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#9CA3AF", fontSize: 11 }}
                        />
                        <Tooltip
                            cursor={{ fill: "#F3F4F6", opacity: 0.5 }}
                            content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="bg-white p-3 border border-gray-100 shadow-lg rounded-lg min-w-[150px]">
                                            <p className="text-xs text-gray-500 mb-2 font-medium">{label}</p>

                                            {/* Sales - usually payload[0] if Bar is first */}
                                            {payload.map((entry: any) => (
                                                <div key={entry.name} className="flex justify-between items-center mb-1 last:mb-0 text-xs">
                                                    <span style={{ color: entry.color }} className="font-medium">
                                                        {entry.name === "sales" ? "Revenue" : "Orders"}
                                                    </span>
                                                    <span className="font-bold text-gray-900">
                                                        {entry.name === "sales"
                                                            ? convertToLocale({ amount: entry.value * 100, currency_code: 'inr' })
                                                            : entry.value}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )
                                }
                                return null
                            }}
                        />
                        <Legend
                            verticalAlign="top"
                            height={36}
                            iconType="circle"
                            formatter={(value) => <span className="text-xs font-medium text-gray-600 ml-1">{value === "sales" ? "Revenue" : "Orders"}</span>}
                        />
                        <Bar
                            yAxisId="left"
                            dataKey="sales"
                            fill="#4F46E5"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={40}
                            name="sales"
                        />
                        <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="orders"
                            stroke="#F59E0B"
                            strokeWidth={2}
                            dot={{ r: 3, fill: "#F59E0B", strokeWidth: 0 }}
                            activeDot={{ r: 5, strokeWidth: 0 }}
                            name="orders"
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}

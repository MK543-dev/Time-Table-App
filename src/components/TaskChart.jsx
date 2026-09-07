import React from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-sm">
      <p className="text-gray-400">{label}</p>
      <p className="text-brand-400 font-semibold">{payload[0].value}h logged</p>
    </div>
  )
}

export default function TaskChart({ data = [] }) {
  if (!data.length) {
    return <p className="text-gray-500 text-sm text-center py-8">No time data yet</p>
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
        <XAxis
          dataKey="date"
          tick={{ fill: '#6b7280', fontSize: 11 }}
          tickFormatter={(d) => {
            const [, m, day] = d.split('-')
            return `${parseInt(day)}/${m}`
          }}
        />
        <YAxis
          tick={{ fill: '#6b7280', fontSize: 11 }}
          tickFormatter={(v) => `${v}h`}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#1f2937' }} />
        <Bar dataKey="total_hours" radius={[6, 6, 0, 0]}>
          {data.map((entry, index) => (
            <Cell
              key={index}
              fill={entry.total_hours > 0 ? '#4d73ff' : '#374151'}
              fillOpacity={0.8}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

import React from 'react'

function getHeatColor(hours) {
  if (hours === 0) return '#1f2937'
  if (hours < 1) return '#1e3a5f'
  if (hours < 2) return '#1d4ed8'
  if (hours < 4) return '#2563eb'
  if (hours < 6) return '#3b82f6'
  if (hours < 8) return '#60a5fa'
  return '#93c5fd'
}

export default function DailyHeatmap({ data = [] }) {
  // Build a map of date → hours
  const map = {}
  data.forEach(d => { map[d.date] = d.total_hours })

  // Generate last 28 days (4 weeks) in groups of 7
  const weeks = []
  const today = new Date()
  for (let w = 3; w >= 0; w--) {
    const week = []
    for (let day = 0; day < 7; day++) {
      const d = new Date(today)
      d.setDate(d.getDate() - (w * 7 + (6 - day)))
      const key = d.toISOString().split('T')[0]
      week.push({ key, hours: map[key] || 0, label: d.toLocaleDateString('en', { weekday: 'short', day: 'numeric' }) })
    }
    weeks.push(week)
  }

  const maxHours = Math.max(...data.map(d => d.total_hours), 1)

  return (
    <div className="space-y-1">
      <div className="flex gap-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex-1 flex flex-col gap-1">
            {week.map((day) => (
              <div
                key={day.key}
                className="h-7 rounded-md flex items-center justify-center text-xs cursor-default transition-all hover:ring-1 hover:ring-gray-600"
                style={{ backgroundColor: getHeatColor(day.hours) }}
                title={`${day.label}: ${day.hours}h`}
              >
                {day.hours > 0 && (
                  <span className="text-white/80 font-medium">
                    {day.hours >= 8 ? '8+' : day.hours.toFixed(1)}
                  </span>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
      {/* Legend */}
      <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-500 justify-end">
        <span>Less</span>
        {[0, 0.5, 1.5, 3, 5, 7].map((h, i) => (
          <div
            key={i}
            className="w-5 h-5 rounded-sm"
            style={{ backgroundColor: getHeatColor(h) }}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  )
}

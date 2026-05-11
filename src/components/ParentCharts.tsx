'use client'

import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface ParentChartsProps {
  subjectData: { subject: string; accuracy: number }[]
}

export function ParentCharts({ subjectData }: ParentChartsProps) {
  // Map colors to subjects
  const COLORS: Record<string, string> = {
    Maths: '#4f46e5', // indigo-600
    English: '#8b5cf6', // violet-500
    'Verbal Reasoning': '#f59e0b', // amber-500
    'Non-Verbal Reasoning': '#10b981', // emerald-500
  }

  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={subjectData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            dataKey="subject" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }}
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            domain={[0, 100]}
            unit="%"
          />
          <Tooltip 
            cursor={{ fill: '#f8fafc' }}
            contentStyle={{ 
              borderRadius: '20px', 
              border: 'none', 
              boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
              padding: '16px',
              fontWeight: 'bold'
            }}
          />
          <Bar 
            dataKey="accuracy" 
            radius={[12, 12, 12, 12]} 
            barSize={60}
          >
            {subjectData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[entry.subject] || '#cbd5e1'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

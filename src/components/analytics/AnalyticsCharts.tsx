'use client'

import React from 'react'
import { Sparkles } from 'lucide-react'
import { 
  LineChart,
  Line,
  BarChart,
  Bar,
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from 'recharts'

interface AnalyticsChartsProps {
  trendData: { date: string; accuracy: number }[]
  subjectData: { subject: string; accuracy: number; fullMark: number }[]
  speedData: { subject: string; avgTime: number; targetTime: number }[]
}

export function AnalyticsCharts({ trendData, subjectData, speedData }: AnalyticsChartsProps) {
  return (
    <div className="space-y-12">
      {/* Accuracy Trend */}
      <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Performance Trend</h3>
            <p className="text-slate-500 text-sm">Accuracy percentage over your last sessions</p>
          </div>
          <div className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-xs">
            Last 30 Sessions
          </div>
        </div>

        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                domain={[0, 100]}
              />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '16px', 
                  border: 'none', 
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                  padding: '12px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="accuracy" 
                stroke="#4f46e5" 
                strokeWidth={4} 
                dot={{ r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Subject Radar */}
      <div className="grid md:grid-cols-2 gap-8">
        <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <h3 className="text-xl font-bold text-slate-900 mb-2">Subject Mastery</h3>
          <p className="text-slate-500 text-sm mb-8">Balance across the core 11+ pillars</p>
          
          <div className="h-[300px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={subjectData}>
                <PolarGrid stroke="#f1f5f9" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
                <Radar
                  name="Accuracy"
                  dataKey="accuracy"
                  stroke="#8b5cf6"
                  fill="#8b5cf6"
                  fillOpacity={0.5}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Stats Summary */}
        <section className="bg-indigo-600 p-8 rounded-[2.5rem] text-white flex flex-col justify-center relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-2xl font-black mb-2 italic tracking-tight underline decoration-indigo-400 decoration-4 underline-offset-4">Exam Readiness</h3>
            <p className="text-indigo-100 text-sm mb-8 opacity-80">Estimated based on current mastery levels and mock Consistency.</p>
            
            <div className="text-7xl font-black mb-4">
              {Math.round(subjectData.reduce((acc, curr) => acc + curr.accuracy, 0) / subjectData.length || 0)}%
            </div>
            
            <div className="flex items-center gap-4 text-sm font-bold text-indigo-100">
              <div className="px-3 py-1 bg-white/20 rounded-full">Strong: Maths</div>
              <div className="px-3 py-1 bg-white/20 rounded-full">Focus: English</div>
            </div>
          </div>
          <div className="absolute -right-10 -bottom-10 h-64 w-64 bg-white/10 rounded-full blur-3xl" />
        </section>
      </div>

      {/* Speed Analysis */}
      <section className="bg-slate-900 p-10 rounded-[2.5rem] text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h3 className="text-2xl font-black mb-2">Speed Analysis</h3>
            <p className="text-slate-400 text-sm">Average seconds per question vs. Exam Target (30s)</p>
          </div>
          <div className="px-4 py-2 bg-white/10 rounded-2xl border border-white/10 flex items-center gap-3">
             <div className="h-2 w-2 bg-indigo-400 rounded-full" />
             <span className="text-xs font-bold">Your Speed</span>
             <div className="h-2 w-2 bg-white/20 rounded-full ml-2" />
             <span className="text-xs font-bold text-slate-400">Target (30s)</span>
          </div>
        </div>

        <div className="h-[350px] w-full">
           <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
             <BarChart data={speedData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
               <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
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
                 unit="s"
               />
               <Tooltip 
                 cursor={{ fill: 'transparent' }}
                 contentStyle={{ 
                   backgroundColor: '#1e293b', 
                   borderRadius: '16px', 
                   border: '1px solid #ffffff10',
                   color: '#fff'
                 }}
               />
               <Bar 
                 dataKey="avgTime" 
                 radius={[10, 10, 10, 10]} 
                 barSize={40}
               >
                 {speedData.map((entry, index) => (
                   <Cell key={`cell-${index}`} fill={entry.avgTime > 35 ? '#fb7185' : '#818cf8'} />
                 ))}
               </Bar>
               <Bar 
                 dataKey="targetTime" 
                 fill="#ffffff10" 
                 radius={[10, 10, 10, 10]} 
                 barSize={40}
               />
             </BarChart>
           </ResponsiveContainer>
        </div>

        <div className="mt-8 p-6 bg-white/5 rounded-3xl border border-white/10 flex items-start gap-4">
           <div className="h-10 w-10 bg-indigo-500/20 rounded-2xl flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5 text-indigo-400" />
           </div>
           <div>
              <p className="font-bold text-indigo-200 text-sm mb-1">Strategy Insight</p>
              <p className="text-slate-400 text-xs leading-relaxed">
                {speedData.find(s => s.subject === 'Maths')?.avgTime ? (
                  <>
                    Your Math speed is currently <strong>{speedData.find(s => s.subject === 'Maths')?.avgTime}s</strong>. 
                    The 11+ benchmark is 30s. {speedData.find(s => s.subject === 'Maths')!.avgTime > 30 
                      ? "Focus on mental math shortcuts to shave off those extra seconds!" 
                      : "Excellent pacing! Keep maintaining this speed while focusing on accuracy."}
                  </>
                ) : (
                  "Complete your first Mathematics practice session to see how your speed compares to the 11+ benchmark!"
                )}
              </p>
           </div>
        </div>
      </section>
    </div>
  )
}

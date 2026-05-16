'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Lock, Star, ChevronRight, AlertCircle, Play } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PrerequisiteWarningModal } from './PrerequisiteWarningModal'

interface HubItem {
  label: string
  href: string
  locked: boolean
  mastered: boolean
  pro?: boolean
  prerequisite?: string | null
}

interface LearningJourneyMapProps {
  subject: string
  items: HubItem[]
  color: 'indigo' | 'violet' | 'amber'
  isPro: boolean
}

export function LearningJourneyMap({ subject, items, color, isPro }: LearningJourneyMapProps) {
  const router = useRouter()
  const [warningTarget, setWarningTarget] = useState<HubItem | null>(null)

  const themeColors = {
    indigo: {
      bg: 'bg-indigo-500',
      text: 'text-indigo-600',
      border: 'border-indigo-200',
      shadow: 'shadow-indigo-200',
      path: 'stroke-indigo-200',
    },
    violet: {
      bg: 'bg-violet-500',
      text: 'text-violet-600',
      border: 'border-violet-200',
      shadow: 'shadow-violet-200',
      path: 'stroke-violet-200',
    },
    amber: {
      bg: 'bg-amber-500',
      text: 'text-amber-600',
      border: 'border-amber-200',
      shadow: 'shadow-amber-200',
      path: 'stroke-amber-200',
    }
  }

  const theme = themeColors[color]

  const handleItemClick = (e: React.MouseEvent, item: HubItem) => {
    if (item.locked && !item.mastered) {
      e.preventDefault()
      setWarningTarget(item)
    }
  }

  // To create a winding path, we define offsets for the nodes
  // Sequence: 0 (center), 1 (right), 0 (center), -1 (left)
  const getOffset = (index: number) => {
    const cycle = index % 4
    if (cycle === 0) return 0
    if (cycle === 1) return 1
    if (cycle === 2) return 0
    if (cycle === 3) return -1
    return 0
  }

  return (
    <div className="relative py-12 px-4 max-w-md mx-auto">
      {/* Background Straight Line connecting the nodes */}
      <div className="absolute inset-0 flex justify-center pointer-events-none">
        <div className={cn("w-2 h-full absolute top-[60px]", theme.bg, "opacity-10")} style={{ width: '8px', borderRadius: '4px' }} />
        <svg width="200" height="100%" className="absolute" style={{ top: '40px' }}>
          {items.map((_, i) => {
            if (i === items.length - 1) return null;
            const startX = 100;
            const startY = i * 140;
            const endX = 100;
            const endY = (i + 1) * 140;
            
            return (
              <line
                key={i}
                x1={startX}
                y1={startY}
                x2={endX}
                y2={endY}
                strokeWidth="8"
                strokeLinecap="round"
                className={cn(theme.path, items[i].mastered ? 'opacity-100' : 'opacity-30')}
                strokeDasharray={items[i].mastered ? "0" : "12 12"}
              />
            );
          })}
        </svg>
      </div>

      <div className="space-y-[60px] relative z-10">
        {items.map((item, i) => {
          const isNext = !item.locked && !item.mastered && (i === 0 || items[i - 1]?.mastered);
          const xOffset = 0; // Centered nodes

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex justify-center"
              style={{ transform: `translateX(${xOffset}px)` }}
            >
              <Link
                href={item.href}
                onClick={(e) => handleItemClick(e, item)}
                className="group relative flex flex-col items-center outline-none"
              >
                {/* Tooltip Label */}
                <div className={cn(
                  "absolute -top-10 whitespace-nowrap px-4 py-2 rounded-xl font-bold text-xs shadow-lg transition-all duration-300 opacity-0 group-hover:opacity-100 group-hover:-translate-y-1 group-focus:opacity-100 group-focus:-translate-y-1 pointer-events-none",
                  item.locked ? "bg-slate-800 text-slate-200" : "bg-white text-slate-800"
                )}>
                  {item.label}
                  {item.locked && <AlertCircle className="inline h-3 w-3 ml-2 text-amber-500" />}
                  <div className={cn(
                    "absolute bottom-[-6px] left-1/2 -translate-x-1/2 border-[6px] border-transparent",
                    item.locked ? "border-t-slate-800" : "border-t-white"
                  )} />
                </div>

                {/* Node */}
                <div className={cn(
                  "relative w-20 h-20 rounded-full flex items-center justify-center transition-transform duration-300 shadow-xl",
                  !item.locked && "group-hover:scale-110",
                  item.mastered ? "bg-emerald-500 shadow-emerald-500/30" : 
                  isNext ? `${theme.bg} ring-8 ring-indigo-500/20 shadow-indigo-500/30 animate-pulse` : 
                  "bg-slate-200 shadow-slate-300"
                )}>
                  {/* Inner Ring */}
                  <div className={cn(
                    "w-16 h-16 rounded-full border-4 flex items-center justify-center bg-white/10",
                    item.mastered ? "border-emerald-400" : isNext ? "border-white/40" : "border-slate-300"
                  )}>
                    {item.mastered ? (
                      <Star className="h-8 w-8 text-white fill-current" />
                    ) : item.locked ? (
                      <Lock className="h-6 w-6 text-slate-400" />
                    ) : (
                      <Play className="h-8 w-8 text-white fill-current ml-1" />
                    )}
                  </div>
                  
                  {item.pro && !isPro && (
                    <div className="absolute -top-2 -right-2 bg-slate-900 rounded-full p-1 border-2 border-white">
                      <Lock className="h-3 w-3 text-amber-400" />
                    </div>
                  )}
                </div>
                
                {/* Floating Title below node (always visible for context) */}
                <span className={cn(
                  "mt-3 text-xs font-black uppercase tracking-wider text-center max-w-[120px]",
                  item.mastered ? "text-emerald-600" : isNext ? theme.text : "text-slate-400"
                )}>
                  {item.label.replace(' topic', '')}
                </span>
              </Link>
            </motion.div>
          )
        })}
      </div>

      <PrerequisiteWarningModal 
        isOpen={!!warningTarget}
        onClose={() => setWarningTarget(null)}
        onConfirm={() => {
          if (warningTarget) {
            router.push(warningTarget.href)
            setWarningTarget(null)
          }
        }}
        topic={warningTarget?.label.replace(' topic', '') || ''}
        prerequisite={warningTarget?.prerequisite || 'the fundamental topic'}
      />
    </div>
  )
}

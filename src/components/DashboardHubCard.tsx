'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Lock, ChevronRight, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PrerequisiteWarningModal } from './PrerequisiteWarningModal'
import { getRecommendedPrerequisiteHref } from '@/lib/mastery'

interface HubItem {
  label: string
  href: string
  locked: boolean
  mastered: boolean
  pro?: boolean
  prerequisite?: string | null
}

interface DashboardHubCardProps {
  title: string
  color: 'indigo' | 'violet' | 'amber'
  icon: React.ReactNode
  items: HubItem[]
  isPro: boolean
}

export function DashboardHubCard({ title, color, icon, items, isPro }: DashboardHubCardProps) {
  const router = useRouter()
  const [warningTarget, setWarningTarget] = useState<HubItem | null>(null)

  const colors = {
    indigo: 'bg-indigo-50 border-indigo-100 text-indigo-900',
    violet: 'bg-violet-50 border-violet-100 text-violet-900',
    amber: 'bg-amber-50 border-amber-100 text-amber-900'
  }

  const handleItemClick = (e: React.MouseEvent, item: HubItem) => {
    if (item.locked && !item.mastered) {
      e.preventDefault()
      setWarningTarget(item)
    }
  }

  return (
    <>
      <div className={cn("p-6 rounded-[2rem] border space-y-4 shadow-sm", colors[color])}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-xl shadow-sm">
            {icon}
          </div>
          <h3 className="font-bold text-lg">{title}</h3>
        </div>
        
        <div className="space-y-2">
          {items.map((item, i) => {
            const needsWarning = item.locked && !item.mastered;
            
            return (
              <div key={i} className="relative group">
                <Link 
                  href={item.href}
                  onClick={(e) => handleItemClick(e, item)}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-xl text-sm font-bold transition-all",
                    needsWarning 
                      ? "bg-amber-50/50 text-amber-900 border border-amber-100/50 hover:bg-white" 
                      : "bg-white/50 hover:bg-white text-inherit"
                  )}
                >
                  <div className="flex items-center gap-2">
                    {item.label}
                    {item.pro && !isPro && <Lock className="h-3 w-3 text-slate-400" />}
                    {needsWarning && <AlertCircle className="h-3 w-3 text-amber-500" />}
                  </div>
                  <ChevronRight className={cn(
                    "h-4 w-4 transition-transform group-hover:translate-x-1",
                    needsWarning ? "text-amber-300" : "text-slate-300"
                  )} />
                </Link>
              </div>
            )
          })}
        </div>
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
        onGoToPrerequisite={() => {
          if (warningTarget) {
            router.push(getRecommendedPrerequisiteHref(warningTarget.label))
            setWarningTarget(null)
          }
        }}
        topic={warningTarget?.label.replace(' topic', '') || ''}
        prerequisite={warningTarget?.prerequisite || 'the fundamental topic'}
      />
    </>
  )
}

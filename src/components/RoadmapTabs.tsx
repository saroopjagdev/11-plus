'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Target, BookOpen, Brain } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LearningJourneyMap } from './LearningJourneyMap'

interface RoadmapTabsProps {
  mastery: any[]
  curriculum: any[]
  threshold: number
  minQuestions: number
  isPro: boolean
}

export function RoadmapTabs({ mastery, curriculum, threshold, minQuestions, isPro }: RoadmapTabsProps) {
  const [activeTab, setActiveTab] = useState<'Maths' | 'English' | 'Verbal Reasoning'>('Maths')

  const tabs = [
    { id: 'Maths', label: 'Maths', icon: <Target className="h-4 w-4" />, color: 'indigo' },
    { id: 'English', label: 'English', icon: <BookOpen className="h-4 w-4" />, color: 'violet' },
    { id: 'Verbal Reasoning', label: 'Reasoning', icon: <Brain className="h-4 w-4" />, color: 'amber' },
  ]

  const activeTheme = activeTab === 'Maths' ? 'indigo' : activeTab === 'English' ? 'violet' : 'amber'

  return (
    <div className="space-y-8">
      {/* Tab Switcher */}
      <div className="flex p-1.5 bg-slate-100 rounded-2xl w-full max-w-sm mx-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300",
              activeTab === tab.id 
                ? "bg-white text-slate-900 shadow-sm" 
                : "text-slate-400 hover:text-slate-600"
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Map Container */}
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden min-h-[500px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <LearningJourneyMap 
              subject={activeTab}
              color={activeTheme as any}
              items={activeTab === 'Maths' 
                ? [
                    { label: 'Arithmetic', href: '/practice/topic/Arithmetic', locked: false, mastered: true },
                    ...curriculum
                      .filter(l => l.subject === 'Maths' && l.topic !== 'Arithmetic')
                      .map(l => {
                        const prereq = mastery.find(m => m.topic === l.prerequisite)
                        const isMastered = prereq && prereq.accuracy >= threshold && prereq.questions_answered >= minQuestions
                        return {
                          label: l.topic,
                          href: `/practice/topic/${l.topic}`,
                          locked: !!l.prerequisite && !isMastered,
                          mastered: !!(mastery.find(m => m.topic === l.topic && m.accuracy >= threshold)),
                          prerequisite: l.prerequisite
                        }
                      })
                  ]
                : curriculum
                    .filter(l => l.subject === activeTab)
                    .map(l => {
                      const prereq = l.prerequisite ? mastery.find(m => m.topic === l.prerequisite) : null
                      const isMastered = !l.prerequisite || (prereq && prereq.accuracy >= threshold && prereq.questions_answered >= minQuestions)
                      return {
                        label: l.topic,
                        href: `/practice/topic/${l.topic}`,
                        locked: !!l.prerequisite && !isMastered,
                        mastered: !!(mastery.find(m => m.topic === l.topic && m.accuracy >= threshold)),
                        prerequisite: l.prerequisite
                      }
                    })
              }
              isPro={isPro}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Calendar, 
  ChevronRight, 
  Brain, 
  Check,
} from 'lucide-react'
import { updateChildGoals } from '@/app/actions/children'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

interface ConversionOnboardingProps {
  childId: string
  childName: string
  isOpen: boolean
  onClose: () => void
}

export function ConversionOnboarding({ childId, childName, isOpen, onClose }: ConversionOnboardingProps) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [examDate, setExamDate] = useState('')
  const [painPoints, setPainPoints] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const togglePainPoint = (point: string) => {
    setPainPoints(prev => 
      prev.includes(point) ? prev.filter(p => p !== point) : [...prev, point]
    )
  }



  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      await updateChildGoals({
        childId,
        examDate
      })
      router.refresh()
      setStep(3)
    } catch (err) {
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden border border-white/20"
      >
        {/* Progress Bar */}
        <div className="flex h-2 bg-slate-100 overflow-hidden rounded-t-[3rem]">
           {[1, 2, 3].map((s) => (
             <div 
              key={s} 
              className={cn(
                "flex-1 transition-all duration-500",
                step >= s ? "bg-indigo-600" : "bg-transparent"
              )} 
             />
           ))}
        </div>

        <div className="p-8 sm:p-10">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <div className="h-12 w-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
                    <Calendar className="h-6 w-6 text-indigo-600" />
                  </div>
                  <h2 className="text-3xl font-black text-slate-900 leading-tight">Exam Countdown</h2>
                  <p className="text-slate-500 font-medium text-sm">We&apos;ll build a custom roadmap based on your remaining prep time.</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Primary Exam Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <input 
                        type="date" 
                        value={examDate}
                        onChange={(e) => setExamDate(e.target.value)}
                        className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-xl pl-12 pr-4 py-3 outline-none transition-all font-bold text-slate-900"
                      />
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setStep(2)}
                  disabled={!examDate}
                  className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                  <ChevronRight className="h-5 w-5" />
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                   <div className="h-12 w-12 bg-violet-50 rounded-2xl flex items-center justify-center mb-4">
                    <Brain className="h-6 w-6 text-violet-600" />
                  </div>
                  <h2 className="text-3xl font-black text-slate-900 leading-tight">Identify Weak Spots</h2>
                  <p className="text-slate-500 font-medium">Which areas should we focus on to maximize score growth?</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {['Maths', 'English', 'Verbal Reasoning', 'Time Management', 'Exam Technique', 'Vocabulary'].map(point => (
                    <button
                      key={point}
                      onClick={() => togglePainPoint(point)}
                      className={cn(
                        "p-4 rounded-2xl border-2 font-bold text-left transition-all flex items-center justify-between",
                        painPoints.includes(point)
                          ? "bg-violet-50 border-violet-500 text-violet-900 shadow-lg shadow-violet-100"
                          : "bg-white border-slate-100 text-slate-600 hover:border-violet-200"
                      )}
                    >
                      {point}
                      {painPoints.includes(point) && <Check className="h-4 w-4" />}
                    </button>
                  ))}
                </div>

                <button 
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? 'Saving setup...' : 'Save and continue'}
                  {!isSubmitting && <ChevronRight className="h-5 w-5" />}
                </button>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12 space-y-8"
              >
                <div className="flex justify-center">
                  <div className="h-24 w-24 bg-emerald-50 rounded-full flex items-center justify-center">
                    <Check className="h-12 w-12 text-emerald-500" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl font-black text-slate-900">You&apos;re all set!</h2>
                  <p className="text-slate-500 font-medium">{childName}&apos;s profile is ready and the dashboard has been tailored around the exam date you chose.</p>
                </div>
                <button 
                  onClick={onClose}
                  className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-lg hover:bg-slate-800 transition-all"
                >
                  Go to My Dashboard
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}

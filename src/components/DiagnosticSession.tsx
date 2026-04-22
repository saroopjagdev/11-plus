'use client'

import React, { useState } from 'react'
import { QuestionCard } from '@/components/QuestionCard'
import { motion, AnimatePresence } from 'framer-motion'
import { submitDiagnostic } from '@/app/actions/diagnostic'
import { Trophy, BarChart2, ArrowRight, Loader2, Target, Brain, Play } from 'lucide-react'
import { CelebrationModal } from '@/components/CelebrationModal'
import { cn } from '@/lib/utils'

interface Question {
  id: string
  question_text: string
  options: string[]
  correct_answer: string
  subject: string
  topic: string
}

interface DiagnosticSessionProps {
  questions: Question[]
  childId: string | null
}

export function DiagnosticSession({ questions, childId }: DiagnosticSessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [attempts, setAttempts] = useState<{ questionId: string; isCorrect: boolean; topic: string; subject: string }[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [results, setResults] = useState<{ score: number; breakdown: any[]; aiSummary?: string } | null>(null)
  const [levelUpData, setLevelUpData] = useState<{ level: number } | null>(null)

  const currentQuestion = questions[currentIndex]
  const progress = ((currentIndex + 1) / questions.length) * 100

  const handleSelect = (answer: string) => {
    if (showFeedback) return
    setSelectedAnswer(answer)
  }

  const handleCheck = () => {
    if (!selectedAnswer) return
    const isCorrect = selectedAnswer === currentQuestion.correct_answer
    
    setAttempts([...attempts, { 
      questionId: currentQuestion.id, 
      isCorrect, 
      topic: currentQuestion.topic, 
      subject: currentQuestion.subject 
    }])
    setShowFeedback(true)
  }

  const handleNext = async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setSelectedAnswer(null)
      setShowFeedback(false)
    } else {
      await finishDiagnostic()
    }
  }

  const finishDiagnostic = async () => {
    setIsSubmitting(true)
    try {
      const response = await submitDiagnostic(childId, attempts)
      if (response.success) {
        // Handle guest local storage
        if (!childId) {
          localStorage.setItem('ace_diagnostic_guest', JSON.stringify({
            score: response.score,
            breakdown: response.topicBreakdown,
            aiSummary: response.aiSummary,
            timestamp: new Date().toISOString()
          }))
        }

        setResults({
          score: response.score || attempts.filter(a => a.isCorrect).length,
          aiSummary: response.aiSummary,
          breakdown: response.topicBreakdown || []
        })

        if (response.isLevelUp) {
          setLevelUpData({ level: response.newLevel })
        }
      }
    } catch (error) {
      console.error('Submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (results) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-[3rem] p-10 shadow-2xl shadow-indigo-100 border-2 border-indigo-50"
        >
          <div className="text-center mb-10">
            <div className="h-20 w-20 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Trophy className="h-10 w-10 text-amber-600" />
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-2">Diagnostic Complete!</h2>
            <p className="text-slate-500">We've mapped out your current ability across all topics.</p>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-10">
            <div className="bg-indigo-50 rounded-3xl p-6 text-center">
              <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">Overall Score</p>
              <p className="text-4xl font-black text-indigo-600">{results.score} <span className="text-xl text-indigo-300">/ {questions.length}</span></p>
            </div>
            <div className="bg-emerald-50 rounded-3xl p-6 text-center">
              <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1">Accuracy</p>
              <p className="text-4xl font-black text-emerald-600">{Math.round((results.score / questions.length) * 100)}%</p>
            </div>
          </div>

          {results.aiSummary && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-indigo-600 text-white rounded-3xl p-8 mb-10 relative overflow-hidden shadow-xl shadow-indigo-100"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Brain className="h-20 w-20" />
              </div>
              <h4 className="text-sm font-black uppercase tracking-widest mb-4 text-indigo-200">AI Tutor Review</h4>
              <p className="text-lg font-medium leading-relaxed italic relative z-10">
                "{results.aiSummary}"
              </p>
            </motion.div>
          )}

          <div className="space-y-6 mb-12">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-indigo-500" />
              Topic Breakdown
            </h3>
            <div className="grid gap-4">
              {results.breakdown.map((item, idx) => (
                <div key={idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-slate-700">{item.topic}</span>
                    <span className={item.accuracy >= 70 ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>
                      {item.accuracy}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.accuracy}%` }}
                      className={`h-full ${item.accuracy >= 70 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Path - Conversion Section */}
          <section className="border-t-2 border-dashed border-slate-100 pt-10 mt-10">
            <div className="flex items-center gap-3 mb-6">
               <div className="bg-indigo-100 p-2 rounded-xl">
                  <Play className="h-5 w-5 text-indigo-600 fill-current" />
               </div>
               <h3 className="text-xl font-bold text-slate-900">Recommended Next Steps</h3>
            </div>
            
            <div className="relative group">
               {/* Blurred Mock Content for Guests */}
               <div className={cn("space-y-4", !childId && "blur-sm pointer-events-none select-none opacity-50")}>
                  <div className="p-5 rounded-2xl bg-white border-2 border-slate-100 flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
                           <Target className="h-5 w-5" />
                        </div>
                        <div>
                           <p className="font-bold text-slate-800">Advanced Fractions Drill</p>
                           <p className="text-xs text-slate-500">Focus on your weakest area identified by AI</p>
                        </div>
                     </div>
                     <ArrowRight className="h-5 w-5 text-slate-300" />
                  </div>
                  <div className="p-5 rounded-2xl bg-white border-2 border-slate-100 flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
                           <Brain className="h-5 w-5" />
                        </div>
                        <div>
                           <p className="font-bold text-slate-800">Reading Comprehension Mock</p>
                           <p className="text-xs text-slate-500">Timed exercise to boost exam speed</p>
                        </div>
                     </div>
                     <ArrowRight className="h-5 w-5 text-slate-300" />
                  </div>
               </div>

               {!childId && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/40 rounded-3xl backdrop-blur-[2px]">
                     <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border-2 border-indigo-100 text-center max-w-sm">
                        <p className="text-lg font-bold text-slate-900 mb-2">Ready to Start Practicing?</p>
                        <p className="text-sm text-slate-500 mb-8">Create a free account to unlock your personalized learning drills and Mock tests.</p>
                        <button 
                           onClick={() => window.location.href = '/signup'}
                           className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-slate-900 transition-all shadow-xl shadow-indigo-100"
                        >
                           Save My Results & Join Free
                        </button>
                     </div>
                  </div>
               )}
            </div>
          </section>

          {childId && (
            <button
               onClick={() => window.location.href = '/dashboard'}
               className="w-full mt-10 bg-slate-900 text-white py-4 rounded-2xl font-bold text-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-200"
            >
               Go to My Learning Dashboard
               <ArrowRight className="h-5 w-5" />
            </button>
          )}
        </motion.div>
      </div>
    )
  }

  if (isSubmitting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Loader2 className="h-12 w-12 text-indigo-600 animate-spin mb-6" />
        <h2 className="text-2xl font-bold text-slate-800">Generating your results...</h2>
        <p className="text-slate-500 mt-2">Our AI is analyzing your performance per topic.</p>
      </div>
    )
  }

  return (
    <div className="h-[100dvh] flex flex-col bg-slate-50 overflow-hidden">
      {/* Header & Progress - Fixed at Top */}
      <div className="max-w-4xl mx-auto w-full px-6 pt-6 pb-2 shrink-0">
        <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-100 flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
               <div className="bg-amber-100 p-1.5 rounded-lg">
                  <Target className="h-4 w-4 text-amber-600" />
               </div>
              <span className="text-sm font-bold text-slate-700">Diagnostic Assessment</span>
              <span className="h-1 w-1 bg-slate-300 rounded-full" />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Topic: {currentQuestion.topic}
              </span>
            </div>
            <div className="relative h-3 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner flex items-center px-0.5">
              <motion.div
                layoutId="diag-progress"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-2 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
              />
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5 leading-none">Question</div>
            <div className="text-3xl font-black text-slate-900 leading-none">
              {currentIndex + 1}<span className="text-slate-200">/</span>{questions.length}
            </div>
          </div>
        </div>
      </div>

      {/* Main Question Area - Scrollable internally if content is huge */}
      <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
         <div className="max-w-4xl mx-auto h-full flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: -10 }}
                className="w-full"
              >
                <QuestionCard
                  question={currentQuestion}
                  selectedAnswer={selectedAnswer}
                  onSelect={handleSelect}
                  disabled={showFeedback}
                  showFeedback={showFeedback}
                  correctAnswer={currentQuestion.correct_answer}
                />
              </motion.div>
            </AnimatePresence>
         </div>
      </div>

      {/* Footer & Actions - Fixed at Bottom */}
      <div className="max-w-4xl mx-auto w-full px-6 py-4 shrink-0 bg-slate-50/80 backdrop-blur-md border-t border-slate-100">
        <div className="flex flex-col items-center gap-4">
          {!showFeedback ? (
            <button
              onClick={handleCheck}
              disabled={!selectedAnswer}
              className={cn(
                "w-full max-w-sm py-5 rounded-2xl font-black text-lg shadow-xl shadow-amber-200/20 transition-all transform active:scale-95",
                selectedAnswer 
                  ? "bg-amber-500 text-white hover:bg-amber-600" 
                  : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
              )}
            >
              Check Answer
            </button>
          ) : (
            <div className="w-full max-w-sm flex flex-col gap-3">
               <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex gap-3 text-indigo-700 shadow-sm">
                  <Brain className="h-5 w-5 shrink-0" />
                  <p className="text-sm font-bold">Diagnostic mode doesn&apos;t allow redo&apos;s. Let&apos;s see the next challenge!</p>
               </div>
               <button
                onClick={handleNext}
                className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-lg hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-2"
              >
                {currentIndex < questions.length - 1 ? 'Next Challenge' : 'Finish & See Results'}
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      </div>
      </div>

      <CelebrationModal 
        isOpen={!!levelUpData}
        type="level-up"
        level={levelUpData?.level}
        onClose={() => setLevelUpData(null)}
      />
    </div>
  )
}


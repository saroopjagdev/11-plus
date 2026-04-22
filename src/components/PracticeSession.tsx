'use client'

import React, { useState, useEffect } from 'react'
import { QuestionCard } from '@/components/QuestionCard'
import { AiExplanation } from '@/components/AiExplanation'
import { CelebrationModal } from '@/components/CelebrationModal'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, XCircle, ArrowRight, Sparkles, BookOpen, Trophy } from 'lucide-react'
import { logPracticeSession } from '@/app/actions/session'
import { EXAM_TIPS } from '@/lib/constants/exam_tips'
import { cn } from '@/lib/utils'

interface Question {
  id: string
  question_text: string
  options: string[]
  correct_answer: string
  subject: string
  topic: string
}

interface PracticeSessionProps {
  questions: Question[]
  timeLimit?: number // in minutes
  childId?: string
}

export function PracticeSession({ questions, timeLimit, childId }: PracticeSessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [score, setScore] = useState(0)
  const [attempts, setAttempts] = useState<{ questionId: string; isCorrect: boolean; timeTakenSeconds: number }[]>([])
  const [isFinished, setIsFinished] = useState(false)
  const [showExplanation, setShowExplanation] = useState(false)
  const [timeLeft, setTimeLeft] = useState(timeLimit ? timeLimit * 60 : null)
  const [showTip, setShowTip] = useState(false)
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now())

  const currentQuestion = questions[currentIndex]
  const currentTip = EXAM_TIPS.find(t => t.subject === currentQuestion.subject) || EXAM_TIPS[0]

  const [newStreak, setNewStreak] = useState<number | null>(null)
  const [levelUpData, setLevelUpData] = useState<{ level: number } | null>(null)

  useEffect(() => {
    if (isFinished && childId) {
      logPracticeSession({
        childId,
        score,
        attempts: attempts.map(a => ({
          questionId: a.questionId,
          isCorrect: a.isCorrect,
          selectedAnswer: null, // Simplified for MVP
          timeTakenSeconds: a.timeTakenSeconds
        }))
      }).then(res => {
        if (res.success) {
          setNewStreak(res.newStreak)
          if (res.isLevelUp) {
            setLevelUpData({ level: res.newLevel })
          }
        }
      })
    }
  }, [isFinished, childId, score, attempts])

  useEffect(() => {
    if (timeLeft === null || isFinished) return
    if (timeLeft <= 0) {
      setIsFinished(true)
      return
    }
    const timer = setInterval(() => setTimeLeft(t => (t !== null ? t - 1 : null)), 1000)
    return () => clearInterval(timer)
  }, [timeLeft, isFinished])

  const progress = ((currentIndex + 1) / questions.length) * 100

  const handleSelect = (answer: string) => {
    if (showFeedback) return
    setSelectedAnswer(answer)
  }

  const handleCheck = () => {
    if (!selectedAnswer) return
    
    const isCorrect = selectedAnswer === currentQuestion.correct_answer
    if (isCorrect) setScore(s => s + 1)
    
    const timeTaken = Math.round((Date.now() - questionStartTime) / 1000)
    
    setAttempts([...attempts, { 
      questionId: currentQuestion.id, 
      isCorrect, 
      timeTakenSeconds: timeTaken 
    }])
    setShowFeedback(true)
  }

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setSelectedAnswer(null)
      setShowFeedback(false)
      setQuestionStartTime(Date.now())
    } else {
      setIsFinished(true)
    }
  }

  if (isFinished) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-12 rounded-[3rem] shadow-2xl shadow-indigo-100 border-2 border-indigo-50 max-w-lg w-full"
        >
          <div className="h-24 w-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg rotate-3">
            <Sparkles className="h-12 w-12 text-white" />
          </div>
          <h2 className="text-4xl font-black text-slate-800 mb-2">Session Complete!</h2>
          <p className="text-slate-500 mb-8 text-lg">Great effort! Here is how you did:</p>
          
          <div className="text-7xl font-black text-indigo-600 mb-8">
            {score} <span className="text-slate-300 text-4xl">/ {questions.length}</span>
          </div>

          {newStreak !== null && (
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="mb-8 p-4 bg-orange-50 border border-orange-100 rounded-2xl flex items-center justify-center gap-3"
            >
              <Trophy className="h-6 w-6 text-orange-500" />
              <span className="font-extrabold text-orange-700">{newStreak} DAY STREAK! 🔥</span>
            </motion.div>
          )}

          <button
            onClick={() => window.location.reload()}
            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold text-lg hover:bg-slate-800 transition-all transform active:scale-95"
          >
            Try Another Set
          </button>
          
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="w-full mt-4 bg-white text-slate-600 border-2 border-slate-100 py-4 rounded-2xl font-bold text-lg hover:bg-slate-50 transition-all"
          >
            Go to Dashboard
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="h-[100dvh] flex flex-col bg-slate-50 overflow-hidden">
      {/* Header & Progress - Fixed at Top */}
      <div className="max-w-4xl mx-auto w-full px-6 pt-6 pb-2 shrink-0">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-[10px] font-black rounded-full uppercase tracking-wider">
                {currentQuestion.subject}
              </span>
              <span className="text-slate-400 text-xs font-bold uppercase tracking-tight">
                {currentQuestion.topic}
              </span>
            </div>

            <button 
              onClick={() => setShowTip(true)}
              className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-600 rounded-xl font-bold text-xs hover:bg-amber-100 transition-all border border-amber-100 shadow-sm"
            >
              <Sparkles className="h-4 w-4 fill-current" />
              Strategy Tip
            </button>
          </div>

          <div className="flex items-center gap-6 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex-1">
               <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  <span>Progress</span>
                  <span>{currentIndex + 1} / {questions.length}</span>
               </div>
               <div className="h-3 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                 <motion.div
                   initial={{ width: 0 }}
                   animate={{ width: `${progress}%` }}
                   className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                 />
               </div>
            </div>

            {timeLeft !== null && (
              <div className="h-12 w-24 bg-slate-900 rounded-2xl flex flex-col items-center justify-center text-white shrink-0 shadow-lg">
                 <span className="text-[10px] font-black opacity-50 uppercase leading-none mb-1">Time</span>
                 <span className={cn(
                    "text-lg font-black tabular-nums leading-none",
                    timeLeft < 60 ? "text-rose-400 animate-pulse" : "text-white"
                 )}>
                    {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                 </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Question Area - Scrollable internally */}
      <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
        <div className="max-w-4xl mx-auto h-full flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -10 }}
              transition={{ duration: 0.3 }}
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
                "w-full max-w-sm py-5 rounded-2xl font-black text-lg shadow-xl transition-all transform active:scale-95 flex items-center justify-center gap-2",
                selectedAnswer 
                  ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200" 
                  : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
              )}
            >
              Check Answer
            </button>
          ) : (
            <div className="w-full max-w-sm flex flex-col gap-3">
              <div className={cn(
                "flex items-center gap-3 p-4 rounded-2xl border-2 font-black text-sm",
                selectedAnswer === currentQuestion.correct_answer 
                  ? "bg-emerald-50 border-emerald-100 text-emerald-700" 
                  : "bg-rose-50 border-rose-100 text-rose-700"
              )}>
                {selectedAnswer === currentQuestion.correct_answer ? (
                  <>
                    <CheckCircle2 className="h-6 w-6" />
                    <span>Correct! Spot on.</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-6 w-6" />
                    <span>Not quite! Try to review the topic.</span>
                  </>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setShowExplanation(true)}
                  className="flex items-center justify-center gap-2 py-4 px-4 bg-white border-2 border-slate-200 text-slate-600 font-black rounded-2xl hover:bg-slate-50 transition-all hover:border-indigo-100 hover:text-indigo-600 shadow-sm"
                >
                  <BookOpen className="h-5 w-5" />
                  Explain
                </button>
                <button
                  onClick={handleNext}
                  className="flex items-center justify-center gap-2 py-4 px-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                >
                  {currentIndex < questions.length - 1 ? 'Next Question' : 'Finish Session'}
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Strategy Tip Modal */}
      <AnimatePresence>
        {showTip && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
             <motion.div
               initial={{ opacity: 0, scale: 0.9, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 20 }}
               className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden border-2 border-amber-100"
             >
                <div className="bg-amber-500 px-6 py-4 flex items-center justify-between text-white shadow-lg">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 fill-current" />
                    <h3 className="font-bold">Strategy Tip</h3>
                  </div>
                  <button onClick={() => setShowTip(false)} className="hover:bg-white/20 p-1 rounded-full px-2 py-1">
                    Close
                  </button>
                </div>
                <div className="p-8">
                   <h4 className="font-extrabold text-slate-900 text-xl mb-2">{currentTip.title}</h4>
                   <p className="text-slate-600 leading-relaxed text-sm">{currentTip.content}</p>
                   <button 
                     onClick={() => setShowTip(false)}
                     className="mt-8 w-full py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition-all"
                   >
                     Got it!
                   </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showExplanation && (
          <AiExplanation 
            questionId={currentQuestion.id} 
            onClose={() => setShowExplanation(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  )
}


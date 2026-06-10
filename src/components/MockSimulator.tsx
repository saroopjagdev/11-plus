'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { QuestionCard } from '@/components/QuestionCard'
import { InputQuestion } from '@/components/InputQuestion'
import { evaluateWrittenAnswer } from '@/app/actions/ai-evaluator'
import { logPracticeSession } from '@/app/actions/session'
import { AiExplanation } from '@/components/AiExplanation'
import { ProUpsellModal } from '@/components/ProUpsellModal'
import { Clock, Flag, ChevronRight, ChevronLeft, AlertCircle, CheckCircle2, XCircle, Lock, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { ReportIssueButton } from '@/components/ReportIssueButton'

interface Question {
  id: string
  question_text: string
  options: string[]
  correct_answer: string
  subject: string
  topic: string
  type?: string
}

interface MockSimulatorProps {
  questions: Question[]
  timeLimit: number // in minutes
  childId?: string
  isPro?: boolean
}

export function MockSimulator({ questions, timeLimit, childId, isPro = false }: MockSimulatorProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [flagged, setFlagged] = useState<Record<string, boolean>>({})
  const [timeLeft, setTimeLeft] = useState(timeLimit * 60)
  const [isFinished, setIsFinished] = useState(false)
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [results, setResults] = useState<{
    score: number
    maxScore: number
    attempts: {
      questionId: string
      selectedAnswer: string | null
      isCorrect: boolean
      timeTakenSeconds: number
      question: Question
    }[]
  } | null>(null)
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false)
  const [explanationQuestionId, setExplanationQuestionId] = useState<string | null>(null)
  const [explanationAnswer, setExplanationAnswer] = useState<string | null>(null)
  const [showUpsell, setShowUpsell] = useState(false)
  const [upsellFeature, setUpsellFeature] = useState({ name: '', desc: '' })
  const [sessionStartedAt] = useState(() => new Date().toISOString())
  const questionViewStartedAtRef = useRef<number | null>(null)
  const questionTimeSpentRef = useRef<Record<string, number>>({})

  const currentQuestion = questions[currentIndex]

  const captureCurrentQuestionTime = useCallback(() => {
    const questionId = currentQuestion?.id
    if (!questionId) return
    if (questionViewStartedAtRef.current === null) {
      questionViewStartedAtRef.current = Date.now()
      return
    }

    const elapsedSeconds = Math.max(1, Math.round((Date.now() - questionViewStartedAtRef.current) / 1000))
    questionTimeSpentRef.current[questionId] = (questionTimeSpentRef.current[questionId] || 0) + elapsedSeconds
    questionViewStartedAtRef.current = Date.now()
  }, [currentQuestion?.id])

  const handleFinish = useCallback(async () => {
    setShowConfirmSubmit(false)
    setIsEvaluating(true)
    captureCurrentQuestionTime()

    let totalScore = 0
    let totalScoredQuestions = 0
    const finalAttempts = []

    // Evaluate all questions
    for (const q of questions) {
      const studentAnswer = answers[q.id]
      let isCorrect = false

      if (!studentAnswer) {
        // Unanswered
        isCorrect = false
      } else {
        const isWritten = q.type === 'written' || !q.options || q.options.length === 0
        if (isWritten) {
          const result = await evaluateWrittenAnswer(q.question_text, q.correct_answer, studentAnswer)
          isCorrect = result.score > 0
        } else {
          isCorrect = studentAnswer === q.correct_answer
        }
      }

      totalScoredQuestions += 1
      if (isCorrect) totalScore += 1

      finalAttempts.push({
        questionId: q.id,
        selectedAnswer: studentAnswer || null,
        isCorrect: isCorrect,
        timeTakenSeconds: questionTimeSpentRef.current[q.id] || 0,
        question: q,
      })
    }

    if (childId) {
      await logPracticeSession({
        childId,
        score: totalScore,
        attempts: finalAttempts,
        type: 'mock',
        startedAt: sessionStartedAt,
        completedAt: new Date().toISOString(),
      })
    }

    setResults({
      score: totalScore,
      maxScore: totalScoredQuestions,
      attempts: finalAttempts,
    })

    setIsEvaluating(false)
    setIsFinished(true)
  }, [answers, captureCurrentQuestionTime, childId, questions, sessionStartedAt])

  useEffect(() => {
    if (questionViewStartedAtRef.current === null) {
      questionViewStartedAtRef.current = Date.now()
    }
  }, [])

  // Timer logic
  useEffect(() => {
    if (isFinished || isEvaluating) return

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          void handleFinish()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [handleFinish, isFinished, isEvaluating, currentQuestion?.id])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const handleSelectAnswer = (answer: string) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: answer }))
  }

  const toggleFlag = () => {
    setFlagged(prev => ({ ...prev, [currentQuestion.id]: !prev[currentQuestion.id] }))
  }

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      captureCurrentQuestionTime()
      setCurrentIndex(prev => prev + 1)
    }
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      captureCurrentQuestionTime()
      setCurrentIndex(prev => prev - 1)
    }
  }

  if (isEvaluating) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-8 text-center space-y-6">
        <div className="h-24 w-24 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Analyzing Your Answers...</h2>
          <p className="text-slate-500 max-w-sm mx-auto">Please wait while the AI evaluator reviews your mock exam.</p>
        </div>
      </div>
    )
  }

  if (isFinished && results) {
    const incorrectAttempts = results.attempts.filter(a => !a.isCorrect)
    const percentage = results.maxScore > 0 ? Math.round((results.score / results.maxScore) * 100) : 0

    return (
      <div className="h-full overflow-y-auto bg-slate-50 p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
          <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 text-center">
             <h1 className="text-3xl font-black text-slate-900 mb-2">Mock Exam Complete</h1>
             <p className="text-slate-500 mb-8">Great effort! Here is your high-level performance summary.</p>
             
             <div className="inline-block relative">
               <svg className="w-48 h-48 transform -rotate-90">
                 <circle cx="96" cy="96" r="80" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100" />
                 <circle 
                   cx="96" cy="96" r="80" stroke="currentColor" strokeWidth="12" fill="transparent" 
                   strokeDasharray={80 * 2 * Math.PI} 
                   strokeDashoffset={80 * 2 * Math.PI - (percentage / 100) * 80 * 2 * Math.PI} 
                   className={percentage >= 80 ? 'text-emerald-500' : percentage >= 60 ? 'text-amber-500' : 'text-rose-500'} 
                 />
               </svg>
               <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                 <span className="text-4xl font-black text-slate-900">{percentage}%</span>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Score</p>
               </div>
             </div>

             <div className="flex justify-center gap-8 mt-8">
               <div>
                 <p className="text-sm font-bold text-slate-400 uppercase">Correct</p>
                 <p className="text-2xl font-black text-emerald-600">{results.score}</p>
               </div>
               <div>
                 <p className="text-sm font-bold text-slate-400 uppercase">Incorrect</p>
                 <p className="text-2xl font-black text-rose-600">{incorrectAttempts.length}</p>
               </div>
             </div>

             <div className="mt-6 flex justify-center">
               <ReportIssueButton
                 category="Tracking looks wrong"
                 childId={childId}
                 context={{
                   pageLabel: 'Mock Results',
                   score: results.score,
                   maxScore: results.maxScore,
                   incorrectCount: incorrectAttempts.length,
                   isPro,
                 }}
               />
             </div>
          </div>

          {incorrectAttempts.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-black text-slate-900 px-4">Incorrect Questions Review</h2>
              {incorrectAttempts.map((attempt, i) => (
                <div key={i} className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 shrink-0 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
                      <XCircle className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-900 mb-4">{attempt.question.question_text}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Your Answer</p>
                          <p className="font-medium text-rose-700">{attempt.selectedAnswer || 'Left blank'}</p>
                        </div>
                        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Correct Answer</p>
                          <p className="font-medium text-emerald-800">{attempt.question.correct_answer}</p>
                        </div>
                      </div>

                      <button 
                        onClick={() => {
                          if (isPro) {
                            setExplanationAnswer(attempt.selectedAnswer)
                            setExplanationQuestionId(attempt.questionId)
                          } else {
                            setUpsellFeature({ 
                              name: 'AI Tutor Explanations', 
                              desc: 'Unlock detailed, step-by-step guidance from our child-friendly AI tutor.' 
                            })
                            setShowUpsell(true)
                          }
                        }}
                        className="mt-2 text-sm font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-4 py-2 rounded-xl transition-colors flex items-center gap-2"
                      >
                        {isPro ? (
                          <Sparkles className="h-4 w-4" />
                        ) : (
                          <Lock className="h-4 w-4 text-indigo-400" />
                        )}
                        View AI Explanation
                      </button>
                      <div className="mt-3">
                        <ReportIssueButton
                          category="Tracking looks wrong"
                          childId={childId}
                          questionId={attempt.questionId}
                          context={{
                            pageLabel: 'Mock Incorrect Review',
                            learnerAnswer: attempt.selectedAnswer,
                            correctAnswer: attempt.question.correct_answer,
                            topic: attempt.question.topic,
                            subject: attempt.question.subject,
                            isPro,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {explanationQuestionId && (
            <AiExplanation 
              questionId={explanationQuestionId} 
              learnerAnswer={explanationAnswer}
              childId={childId}
              isPro={isPro}
              onClose={() => {
                setExplanationQuestionId(null)
                setExplanationAnswer(null)
              }} 
            />
          )}

          {showUpsell && (
            <ProUpsellModal 
              isOpen={showUpsell}
              onClose={() => setShowUpsell(false)}
              featureName={upsellFeature.name}
              featureDesc={upsellFeature.desc}
            />
          )}

          <div className="text-center pt-8">
            <Link href="/dashboard" className="inline-block bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-slate-800 transition-colors">
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const isWritten = currentQuestion.type === 'written' || !currentQuestion.options || currentQuestion.options.length === 0

  return (
    <div className="flex flex-col h-full lg:flex-row relative">
      {/* Top Bar / Header */}
      <div className="lg:hidden absolute top-0 w-full bg-white border-b border-slate-100 z-10 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2 font-bold text-slate-600 text-sm">
          <Clock className="h-4 w-4" /> {formatTime(timeLeft)}
        </div>
        <button onClick={() => setShowConfirmSubmit(true)} className="text-xs font-bold bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg">
          End Exam
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col pt-16 lg:pt-0 pb-20 lg:pb-0 h-full overflow-y-auto">
        <div className="flex-1 p-4 md:p-8 flex items-center justify-center">
          <div className="w-full max-w-3xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="w-full"
              >
                {isWritten ? (
                  <InputQuestion
                    question={currentQuestion}
                    selectedAnswer={answers[currentQuestion.id] || ''}
                    onSelect={handleSelectAnswer}
                    disabled={false}
                  />
                ) : (
                  <QuestionCard
                    question={currentQuestion}
                    selectedAnswer={answers[currentQuestion.id] || null}
                    onSelect={handleSelectAnswer}
                    disabled={false}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="bg-white border-t border-slate-100 p-4 shrink-0 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)]">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <button 
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-30 hover:bg-slate-50 text-slate-700"
            >
              <ChevronLeft className="h-5 w-5" /> Prev
            </button>
            
            <button
              onClick={toggleFlag}
              className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all border-2 ${
                flagged[currentQuestion.id] 
                  ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100' 
                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Flag className={`h-5 w-5 ${flagged[currentQuestion.id] ? 'fill-amber-600' : ''}`} /> 
              {flagged[currentQuestion.id] ? 'Flagged' : 'Flag'}
            </button>

            {currentIndex === questions.length - 1 ? (
              <button 
                onClick={() => setShowConfirmSubmit(true)}
                className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-md transition-all"
              >
                Submit <CheckCircle2 className="h-5 w-5" />
              </button>
            ) : (
              <button 
                onClick={handleNext}
                className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-md"
              >
                Next <ChevronRight className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Right Sidebar Navigator */}
      <div className="hidden lg:flex flex-col w-72 bg-white border-l border-slate-100 shadow-xl shrink-0 h-full relative z-20">
        <div className="p-6 border-b border-slate-100 text-center bg-slate-50">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Time Remaining</p>
          <div className={`text-4xl font-black ${timeLeft < 300 ? 'text-rose-600' : 'text-slate-900'}`}>
            {formatTime(timeLeft)}
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          <p className="font-bold text-slate-900 mb-4">Question Navigator</p>
          <div className="grid grid-cols-4 gap-2">
            {questions.map((q, i) => {
              const isAnswered = !!answers[q.id]
              const isFlagged = !!flagged[q.id]
              const isCurrent = i === currentIndex

              let bgColor = 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
              if (isCurrent) bgColor = 'bg-indigo-600 border-indigo-600 text-white'
              else if (isFlagged) bgColor = 'bg-amber-100 border-amber-300 text-amber-800'
              else if (isAnswered) bgColor = 'bg-emerald-50 border-emerald-200 text-emerald-700'

              return (
                <button
                  key={q.id}
                  onClick={() => {
                    captureCurrentQuestionTime()
                    setCurrentIndex(i)
                  }}
                  className={`h-10 rounded-lg border-2 flex items-center justify-center font-bold text-sm transition-all relative ${bgColor}`}
                >
                  {i + 1}
                  {isFlagged && !isCurrent && <div className="absolute -top-1 -right-1 h-3 w-3 bg-amber-500 rounded-full border-2 border-white" />}
                </button>
              )
            })}
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50">
          <button 
            onClick={() => setShowConfirmSubmit(true)}
            className="w-full py-4 bg-rose-50 text-rose-600 border border-rose-200 font-bold rounded-xl hover:bg-rose-100 transition-colors"
          >
            End Exam Early
          </button>
        </div>
      </div>

      {/* Mobile Navigator Overlay (optional, omitted for brevity, but could add a basic toggle) */}

      {/* Confirm Submit Modal */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center">
            <div className="h-16 w-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">Submit Exam?</h3>
            <p className="text-slate-500 mb-6">
              You have answered {Object.keys(answers).length} out of {questions.length} questions.
              {Object.keys(flagged).filter(k => flagged[k]).length > 0 && " You still have flagged questions."}
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => setShowConfirmSubmit(false)}
                className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
              >
                Resume
              </button>
              <button 
                onClick={handleFinish}
                className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import React, { useEffect, useRef, useState } from 'react'
import { QuestionCard } from '@/components/QuestionCard'
import { InputQuestion } from '@/components/InputQuestion'
import { evaluateWrittenAnswer } from '@/app/actions/ai-evaluator'
import { AiExplanation } from '@/components/AiExplanation'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, XCircle, ArrowRight, Trophy, Sparkles, BookOpen } from 'lucide-react'
import { logPracticeSession } from '@/app/actions/session'
import confetti from 'canvas-confetti'
import { ProUpsellModal } from '@/components/ProUpsellModal'
import { EXAM_TIPS } from '@/lib/constants/exam_tips'
import { cn } from '@/lib/utils'
import { Lock } from 'lucide-react'
import { ReportIssueButton } from '@/components/ReportIssueButton'
import { pickQuestion, nextTargetDifficulty, type Difficulty } from '@/lib/adaptive'

interface Question {
  id: string
  question_text: string
  options: string[]
  correct_answer: string
  subject: string
  topic: string
  type?: string
  difficulty?: 'Easy' | 'Medium' | 'Hard'
  explanation?: string
  passage_id?: string
  passage?: { title: string; content: string }
  max_marks?: number
}

interface PracticeSessionProps {
  questions: Question[]
  timeLimit?: number // in minutes
  childId?: string
  isPro?: boolean
  // Adaptive mode: when an adaptivePool is supplied, questions are chosen on
  // the fly to match the child's level instead of stepping through a fixed
  // list. `questions` is still used as the non-adaptive fallback so every
  // other caller keeps working unchanged.
  adaptivePool?: Question[]
  startingDifficulty?: Difficulty
  sessionLength?: number
  // Question IDs this child has answered before, in any past session — used
  // to softly deprioritise repeats in adaptive mode so a small topic pool
  // still feels fresh across many sessions rather than replaying recent
  // questions before genuinely new ones.
  historicIds?: string[]
}

export function PracticeSession({ questions, timeLimit, childId, isPro = false, adaptivePool, startingDifficulty = 'Medium', sessionLength, historicIds }: PracticeSessionProps) {
  const adaptive = !!(adaptivePool && adaptivePool.length > 0)
  const historicIdSet = useRef(new Set(historicIds ?? [])).current

  // In adaptive mode we build the served list one question at a time. We seed
  // it with a first question at the starting difficulty; subsequent questions
  // are appended by handleNext based on live performance. We derive the
  // "already used" set from `served` itself rather than a parallel ref, so the
  // two can never drift out of sync.
  const targetDifficultyRef = useRef<Difficulty>(startingDifficulty)

  const [served, setServed] = useState<Question[]>(() => {
    if (!adaptive) return questions
    const first = pickQuestion(adaptivePool!, new Set<string>(), startingDifficulty, historicIdSet) as Question | null
    return first ? [first] : []
  })

  const totalCount = adaptive
    ? Math.min(sessionLength ?? questions.length, adaptivePool!.length)
    : questions.length
  const activeQuestions = adaptive ? served : questions
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [score, setScore] = useState(0)
  const [attempts, setAttempts] = useState<
    { questionId: string; selectedAnswer: string | null; isCorrect: boolean; timeTakenSeconds: number }[]
  >([])
  const [isFinished, setIsFinished] = useState(false)
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [aiEvaluationResult, setAiEvaluationResult] = useState<{score: number, maxMarks: number, feedback: string} | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [showUpsell, setShowUpsell] = useState(false)
  const [upsellFeature, setUpsellFeature] = useState({ name: '', desc: '' })
  const [timeLeft, setTimeLeft] = useState(timeLimit ? timeLimit * 60 : null)
  const [showTip, setShowTip] = useState(false)
  const [sessionStreak] = useState(0)
  const [questionStartTime, setQuestionStartTime] = useState<number>(() => Date.now())
  const [totalPossibleMarks, setTotalPossibleMarks] = useState(0)
  const [sessionStartedAt] = useState(() => new Date().toISOString())
  const hasLoggedSessionRef = useRef(false)

  const currentQuestion = activeQuestions[currentIndex]
  const currentTip = EXAM_TIPS.find(t => t.subject === currentQuestion.subject) || EXAM_TIPS[0]

  const [newStreak, setNewStreak] = useState<number | null>(null)

  useEffect(() => {
    if (isFinished && childId && !hasLoggedSessionRef.current) {
      hasLoggedSessionRef.current = true

      // Confetti burst!
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#4f46e5', '#8b5cf6', '#10b981']
      })
      
      logPracticeSession({
        childId,
        score,
        attempts: attempts.map(a => ({
          questionId: a.questionId,
          isCorrect: a.isCorrect,
          selectedAnswer: a.selectedAnswer,
          timeTakenSeconds: a.timeTakenSeconds
        })),
        startedAt: sessionStartedAt,
        completedAt: new Date().toISOString(),
      }).then(res => {
        if (res.success) {
          setNewStreak(res.newStreak)
        }
      })
    }
  }, [attempts, childId, isFinished, score, sessionStartedAt])

  useEffect(() => {
    if (timeLeft === null || isFinished) return

    const timer = setInterval(() => {
      setTimeLeft((remainingTime) => {
        if (remainingTime === null) return null
        if (remainingTime <= 1) {
          clearInterval(timer)
          setIsFinished(true)
          return 0
        }
        return remainingTime - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft, isFinished])

  const progress = ((currentIndex + 1) / totalCount) * 100

  const handleSelect = (answer: string) => {
    if (showFeedback) return
    setSelectedAnswer(answer)
  }

  const handleCheck = async () => {
    if (!selectedAnswer) return
    
    let earnedMarks = 0
    let maxMarks = 1
    const isWritten = currentQuestion.type === 'written'
    
    if (isWritten) {
      if (!isPro) {
        setUpsellFeature({
          name: 'AI Written Marking',
          desc: 'Upgrade to Pro to unlock written-answer marking, step-by-step feedback, and explanations.',
        })
        setShowUpsell(true)
        return
      } else {
        setIsEvaluating(true)
        const result = await evaluateWrittenAnswer(currentQuestion.question_text, currentQuestion.correct_answer, selectedAnswer, currentQuestion.max_marks)
        earnedMarks = result.score
        maxMarks = result.maxMarks
        setAiEvaluationResult({ score: result.score, maxMarks: result.maxMarks, feedback: result.feedback })
        setIsEvaluating(false)
      }
    } else {
      earnedMarks = selectedAnswer === currentQuestion.correct_answer ? 1 : 0
      maxMarks = 1
    }
    
    setScore(s => s + earnedMarks)
    setTotalPossibleMarks(t => t + maxMarks)
    
    const timeTaken = Math.round((Date.now() - questionStartTime) / 1000)
    
    setAttempts([
      ...attempts,
      {
        questionId: currentQuestion.id,
        selectedAnswer,
        isCorrect: earnedMarks > 0,
        timeTakenSeconds: timeTaken,
      },
    ])
    setShowFeedback(true)
  }

  const advance = () => {
    setCurrentIndex(currentIndex + 1)
    setSelectedAnswer(null)
    setShowFeedback(false)
    setAiEvaluationResult(null)
    setQuestionStartTime(Date.now())
  }

  const handleNext = () => {
    if (adaptive) {
      // Session ends once we've served the requested number of questions
      // (or the pool runs dry).
      if (currentIndex + 1 >= totalCount) {
        setIsFinished(true)
        return
      }

      // `attempts` already includes the question just answered, so the rolling
      // window reflects current performance. Nudge difficulty, then draw the
      // next question to match.
      const recentResults = attempts.map((a) => a.isCorrect)
      const nextDifficulty = nextTargetDifficulty(targetDifficultyRef.current, recentResults)
      targetDifficultyRef.current = nextDifficulty

      // Derive used ids from what's already been served — always in sync.
      const usedIds = new Set(served.map((q) => q.id))
      const nextQuestion = pickQuestion(adaptivePool!, usedIds, nextDifficulty, historicIdSet) as Question | null
      if (!nextQuestion) {
        setIsFinished(true)
        return
      }

      setServed((prev) => [...prev, nextQuestion])
      advance()
      return
    }

    if (currentIndex < questions.length - 1) {
      advance()
    } else {
      setIsFinished(true)
    }
  }

  if (isFinished) {
    return (
      <div className="flex flex-col items-center justify-center h-[100dvh] bg-slate-50 text-center px-4">
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

          {!childId && (
            <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
              This session was not saved because no child profile is attached yet.
            </div>
          )}
          
          <div className="text-7xl font-black text-indigo-600 mb-8">
            {score} <span className="text-slate-300 text-4xl">/ {totalPossibleMarks || activeQuestions.length}</span>
            <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-2">Total Marks Earned</p>
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

          <div className="mt-5 flex justify-center">
            <ReportIssueButton
              category="Tracking looks wrong"
              childId={childId}
              context={{
                pageLabel: 'Practice Session Complete',
                score,
                totalPossibleMarks,
                questionCount: activeQuestions.length,
                isPro,
              }}
            />
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <>
    <div className="h-[100dvh] flex flex-col bg-slate-50 overflow-hidden relative">
      {/* Header & Progress - Fixed at Top */}
      <div className="bg-slate-50 border-b border-slate-100 px-6 pt-6 pb-2 shrink-0">
        <div className="max-w-7xl mx-auto w-full">
          <div className="flex flex-col gap-2">
            {!childId && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                Progress will not save until you add a child profile.
              </div>
            )}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-[10px] font-black rounded-full uppercase tracking-wider">
                  {currentQuestion.subject}
                </span>
                <span className="text-slate-400 text-xs font-bold uppercase tracking-tight">
                  {currentQuestion.topic}
                </span>
                {adaptive && currentQuestion.difficulty && (
                  <span
                    className={cn(
                      'px-2 py-0.5 text-[9px] font-bold rounded-md uppercase tracking-wide',
                      currentQuestion.difficulty === 'Easy' && 'bg-emerald-100 text-emerald-700',
                      currentQuestion.difficulty === 'Medium' && 'bg-amber-100 text-amber-700',
                      currentQuestion.difficulty === 'Hard' && 'bg-rose-100 text-rose-700'
                    )}
                  >
                    {currentQuestion.difficulty}
                  </span>
                )}
                {currentQuestion.type === 'written' && (
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-bold rounded-md uppercase tracking-wide">
                    3 Marks
                  </span>
                )}
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
                    <span>{currentIndex + 1} / {totalCount}</span>
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
      </div>

      {/* Main Question Area - Split scrollable panes */}
      <div className="flex-1 overflow-y-auto">
        <div className={cn(
          "min-h-full max-w-7xl mx-auto flex gap-10 p-6 pt-8 pb-12",
          currentQuestion.passage ? "flex-col lg:flex-row items-stretch" : "items-center justify-center"
        )}>
          {currentQuestion.passage && (
            <div className="lg:w-1/2 w-full bg-white p-8 rounded-3xl border border-slate-100 shadow-sm overflow-y-auto custom-scrollbar">
              <h3 className="text-xl font-black text-slate-900 mb-4 tracking-tight">{currentQuestion.passage.title}</h3>
              <div className="text-slate-600 leading-relaxed space-y-4">
                {currentQuestion.passage.content.split('\n').map((para, i) => (
                  <p key={i} className="text-sm font-medium">{para}</p>
                ))}
              </div>
            </div>
          )}

          <div className={cn(
            "w-full transition-all duration-500 flex flex-col gap-1",
            currentQuestion.passage ? "lg:w-1/2" : "max-w-4xl mx-auto items-center justify-center"
          )}>
            {sessionStreak >= 5 && !showFeedback && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 bg-indigo-600 text-white p-4 rounded-2xl shadow-lg border-2 border-indigo-400"
              >
                <Trophy className="h-6 w-6" />
                <div>
                  <p className="font-black text-sm uppercase leading-none mb-1">On Fire!</p>
                  <p className="text-xs font-bold opacity-90">{sessionStreak} Correct in a row!</p>
                </div>
              </motion.div>
            )}

            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ 
                  opacity: 1, 
                  scale: showFeedback ? 0.9 : 1, 
                  y: 0 
                }}
                exit={{ opacity: 0, scale: 0.98, y: -10 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="w-full origin-center"
              >
              {(currentQuestion.type === 'written' || !currentQuestion.options || currentQuestion.options.length === 0) ? (
                <InputQuestion
                  question={currentQuestion}
                  selectedAnswer={selectedAnswer}
                  onSelect={handleSelect}
                  disabled={showFeedback || isEvaluating}
                  showFeedback={showFeedback}
                  correctAnswer={currentQuestion.correct_answer}
                />
              ) : (
                <QuestionCard
                  question={currentQuestion}
                  selectedAnswer={selectedAnswer}
                  onSelect={handleSelect}
                  disabled={showFeedback}
                  showFeedback={showFeedback}
                  correctAnswer={currentQuestion.correct_answer}
                />
              )}
            </motion.div>
          </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Footer & Actions - Fixed at Bottom */}
      <div className="shrink-0 w-full px-6 py-6 bg-slate-50 border-t border-slate-100 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
        <div className="max-w-7xl mx-auto flex flex-col gap-6">
          {!showFeedback ? (
            <div className="flex justify-center">
              <button
                onClick={handleCheck}
                disabled={!selectedAnswer || isEvaluating}
                className={cn(
                  "w-full max-w-md py-5 rounded-2xl font-black text-xl shadow-xl transition-all transform active:scale-95 flex items-center justify-center gap-3",
                  selectedAnswer 
                    ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200" 
                    : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                )}
              >
                {isEvaluating ? (
                   <span className="flex items-center gap-3">
                     <span className="h-6 w-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                     Evaluating...
                   </span>
                ) : (
                  <>
                    <CheckCircle2 className="h-6 w-6" />
                    Check Answer
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Feedback Box - More prominent */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex items-start gap-4 p-5 rounded-3xl border-2 font-bold text-base w-full shadow-sm",
                  (aiEvaluationResult ? aiEvaluationResult.score > 0 : selectedAnswer === currentQuestion.correct_answer)
                    ? "bg-emerald-50 border-emerald-100 text-emerald-800" 
                    : "bg-rose-50 border-rose-100 text-rose-800"
                )}
              >
                {(aiEvaluationResult ? aiEvaluationResult.score > 0 : selectedAnswer === currentQuestion.correct_answer) ? (
                  <CheckCircle2 className="h-6 w-6 shrink-0 mt-0.5 text-emerald-600" />
                ) : (
                  <XCircle className="h-6 w-6 shrink-0 mt-0.5 text-rose-600" />
                )}
                <div className="flex-1">
                  <p className="text-lg font-black mb-1">
                    {aiEvaluationResult 
                      ? (aiEvaluationResult.score === aiEvaluationResult.maxMarks ? 'Perfect Score!' : (aiEvaluationResult.score > 0 ? 'Great Progress!' : 'Keep Practicing!')) 
                      : (selectedAnswer === currentQuestion.correct_answer ? 'Correct! Spot on.' : 'Not quite! Review the topic.')}
                  </p>
                  <p className="text-sm font-medium leading-relaxed opacity-90">
                    {aiEvaluationResult 
                      ? `You earned ${aiEvaluationResult.score} out of ${aiEvaluationResult.maxMarks} marks. ${aiEvaluationResult.feedback}` 
                      : (selectedAnswer === currentQuestion.correct_answer ? 'Great job! Move to the next challenge.' : 'The correct answer is shown above. Review and continue!')}
                  </p>
                </div>
              </motion.div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleNext}
                  className="w-full flex items-center justify-center gap-3 px-8 py-5 bg-indigo-600 text-white font-black rounded-[2rem] hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 group"
                >
                  {currentIndex + 1 < totalCount ? 'Next Question' : 'Finish Session'}
                  <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      if (isPro) {
                        setShowExplanation(true)
                      } else {
                        setUpsellFeature({
                          name: 'AI Tutor Explanations',
                          desc: 'Unlock detailed, step-by-step guidance from our child-friendly AI tutor.'
                        })
                        setShowUpsell(true)
                      }
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-4 bg-white border-2 border-slate-200 rounded-[2rem] font-black text-slate-600 hover:bg-slate-50 transition-all hover:border-slate-300 text-sm"
                  >
                    {isPro ? (
                      <BookOpen className="h-5 w-5 text-indigo-600 shrink-0" />
                    ) : (
                      <Lock className="h-5 w-5 text-slate-400 shrink-0" />
                    )}
                    Explain
                  </button>
                  <ReportIssueButton
                    category={aiEvaluationResult ? 'Tracking looks wrong' : 'Something failed'}
                    childId={childId}
                    questionId={currentQuestion.id}
                    context={{
                      pageLabel: 'Practice Session Feedback',
                      learnerAnswer: selectedAnswer,
                      isPro,
                      aiEvaluationResult,
                      currentIndex,
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
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
            learnerAnswer={selectedAnswer}
            childId={childId}
            isPro={isPro}
            presetExplanation={currentQuestion.explanation}
            onClose={() => setShowExplanation(false)}
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
      </AnimatePresence>
    </>
  )
}

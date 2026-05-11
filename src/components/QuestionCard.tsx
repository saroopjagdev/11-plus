'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'


interface QuestionCardProps {
  question: {
    question_text: string
    options: string[]
  }
  selectedAnswer: string | null
  onSelect: (answer: string) => void
  disabled?: boolean
  showFeedback?: boolean
  correctAnswer?: string
}

export function QuestionCard({
  question,
  selectedAnswer,
  onSelect,
  disabled,
  showFeedback,
  correctAnswer
}: QuestionCardProps) {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "bg-white rounded-[2rem] shadow-xl shadow-indigo-100 ring-1 ring-indigo-50 border-b-4 border-indigo-100 transition-all duration-300",
          showFeedback ? "p-4" : "p-5"
        )}
      >
        <h3 className={cn(
          "font-bold text-slate-800 leading-snug whitespace-pre-wrap transition-all",
          showFeedback ? "text-sm mb-3" : "text-lg sm:text-xl mb-4"
        )}>
          {question.question_text}
        </h3>

        <div className={cn("grid", showFeedback ? "gap-2" : "gap-3")}>
          {question.options.map((option, index) => {
            const isSelected = selectedAnswer === option
            const isCorrect = showFeedback && option === correctAnswer
            const isWrong = showFeedback && isSelected && option !== correctAnswer

            return (
              <motion.button
                key={option}
                whileHover={!disabled ? { scale: 1.01 } : {}}
                whileTap={!disabled ? { scale: 0.99 } : {}}
                onClick={() => !disabled && onSelect(option)}
                disabled={disabled}
                className={cn(
                  'relative flex items-center justify-between rounded-xl border-2 transition-all duration-200 text-left font-medium text-base',
                  'group overflow-hidden',
                  showFeedback ? "p-2" : "p-3",
                  !showFeedback && !isSelected && 'border-slate-100 bg-slate-50 hover:border-indigo-200 hover:bg-indigo-50/50 text-slate-600',
                  !showFeedback && isSelected && 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-4 ring-indigo-50',
                  showFeedback && isCorrect && 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-4 ring-emerald-50',
                  showFeedback && isWrong && 'border-rose-500 bg-rose-50 text-rose-700 ring-4 ring-rose-50',
                  disabled && !isSelected && !isCorrect && 'opacity-60 grayscale-[0.5]'
                )}
              >
                <div className="flex items-center gap-3">
                  <span className={cn(
                    'flex shrink-0 items-center justify-center rounded-lg font-bold text-sm transition-all duration-200',
                    showFeedback ? 'h-6 w-6' : 'h-8 w-8',
                   !showFeedback && !isSelected && 'bg-white text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600',
                   !showFeedback && isSelected && 'bg-indigo-600 text-white',
                   showFeedback && isCorrect && 'bg-emerald-600 text-white',
                   showFeedback && isWrong && 'bg-rose-600 text-white'
                  )}>
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className={cn("transition-all", showFeedback ? "text-sm" : "text-base")}>{option}</span>
                </div>
                
                {showFeedback && (isCorrect || isWrong) && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={cn(
                      "rounded-full flex items-center justify-center",
                      showFeedback ? "h-5 w-5" : "h-6 w-6",
                      isCorrect ? "bg-emerald-500" : "bg-rose-500"
                    )}
                  >
                    {isCorrect ? (
                      <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </motion.div>
                )}
              </motion.button>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}

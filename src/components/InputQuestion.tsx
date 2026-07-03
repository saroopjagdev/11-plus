'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface InputQuestionProps {
  question: {
    question_text: string
    type?: string
    max_marks?: number
  }
  selectedAnswer: string | null
  onSelect: (answer: string) => void
  disabled?: boolean
  showFeedback?: boolean
  correctAnswer?: string
}

export function InputQuestion({
  question,
  selectedAnswer,
  onSelect,
  disabled,
  showFeedback,
  correctAnswer
}: InputQuestionProps) {
  const [value, setValue] = useState(selectedAnswer || '')

  useEffect(() => {
    setValue(selectedAnswer || '')
  }, [selectedAnswer])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value)
    onSelect(e.target.value) // Pass the value up to the parent on every keystroke
  }

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
          {question.question_text} {question.type === 'written' && (
            <span className="text-slate-400 font-medium">({question.max_marks ?? 3} mark{(question.max_marks ?? 3) === 1 ? '' : 's'})</span>
          )}
        </h3>

        <div className="grid gap-3">
          <textarea
            value={value}
            onChange={handleChange}
            disabled={disabled}
            placeholder="Type your answer here..."
            rows={showFeedback ? 3 : 4}
            className={cn(
              "w-full rounded-xl border-2 transition-all font-medium text-base text-slate-800 resize-none",
              showFeedback ? "p-3" : "p-4",
              disabled ? "bg-slate-50 border-slate-200 opacity-80" : "bg-white border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none",
              showFeedback && "border-indigo-200 bg-indigo-50/30"
            )}
          />
        </div>
        
        {showFeedback && correctAnswer && (
           <div className="mt-6 p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
             <p className="text-xs font-bold text-emerald-600 uppercase mb-1">Expected Answer / Rubric</p>
             <p className="text-slate-700 font-medium">{correctAnswer}</p>
           </div>
        )}
      </motion.div>
    </div>
  )
}

'use client'

import React, { useState } from 'react'
import { addChild } from '@/app/actions/child'
import Link from 'next/link'
import { ArrowLeft, UserPlus, Loader2 } from 'lucide-react'

export default function AddStudentPage() {
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsPending(true)
    setError(null)

    const formData = new FormData(event.currentTarget)
    const result = await addChild(formData)

    if (result?.error) {
      setError(result.error)
      setIsPending(false)
    }
  }

  return (
    <div className="min-h-screen bg-indigo-50/50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link 
          href="/dashboard" 
          className="inline-flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors font-bold text-sm mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="bg-white rounded-[2.5rem] p-6 shadow-xl shadow-indigo-100/50 border border-indigo-50">
          <div className="mb-4 text-center">
            <div className="h-10 w-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-2 shadow-lg shadow-indigo-100">
              <UserPlus className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-black text-slate-900 mb-1">Add a Student</h1>
            <p className="text-slate-500 text-xs">Register your child to start practicing.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-bold text-slate-700 mb-1">
                Child's Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder="e.g. Charlie"
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 focus:bg-white focus:border-indigo-500 transition-all outline-none text-slate-900 font-medium text-sm"
              />
            </div>

            <div>
              <label htmlFor="age" className="block text-sm font-bold text-slate-700 mb-1">
                Child's Age
              </label>
              <input
                id="age"
                name="age"
                type="number"
                min="5"
                max="18"
                required
                placeholder="e.g. 9"
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 focus:bg-white focus:border-indigo-500 transition-all outline-none text-slate-900 font-medium text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">
                Target Exam Boards <span className="text-xs font-normal text-slate-500">(Select all that apply)</span>
              </label>
              <div className="grid grid-cols-1 gap-2">
                {['GL Assessment', 'CEM', 'CSSE / Written'].map((board) => (
                  <label 
                    key={board} 
                    className="flex items-center gap-3 py-2 px-3 bg-slate-50 border-2 border-slate-100 rounded-xl cursor-pointer hover:border-indigo-200 transition-all has-[:checked]:bg-indigo-50 has-[:checked]:border-indigo-500"
                  >
                    <input 
                      type="checkbox" 
                      name="targetExams" 
                      value={board} 
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                    />
                    <span className="font-bold text-slate-700 text-sm">{board}</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-indigo-600 text-white p-4 rounded-xl font-bold text-base hover:bg-slate-900 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Creating Profile...
                </>
              ) : (
                'Add Student'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

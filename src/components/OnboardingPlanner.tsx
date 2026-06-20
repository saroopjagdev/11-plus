'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { signUpAndCreateChild } from '@/app/actions/auth'
import { Sparkles, Target, ShieldCheck, Check, ArrowRight, User, Loader2 } from 'lucide-react'

export function OnboardingPlanner() {
  const [step, setStep] = useState(1)
  const [childName, setChildName] = useState('')
  const [childAge, setChildAge] = useState(10) // default Year 5 (10 y/o)
  const [targetExams, setTargetExams] = useState<string[]>(['GL Assessment'])
  const [primaryGoal, setPrimaryGoal] = useState('Build foundational math & english')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleToggleExam = (exam: string) => {
    if (targetExams.includes(exam)) {
      if (targetExams.length > 1) {
        setTargetExams(targetExams.filter(e => e !== exam))
      }
    } else {
      setTargetExams([...targetExams, exam])
    }
  }

  const nextStep = () => {
    if (step === 1 && !childName.trim()) return
    setStep(step + 1)
  }

  const prevStep = () => {
    setStep(step - 1)
  }

  return (
    <div className="relative z-10 w-full max-w-lg bg-white p-2 rounded-[3rem] border border-slate-200 shadow-[0_32px_64px_-16px_rgba(79,70,229,0.15)] overflow-hidden">
      <div className="bg-slate-50 p-8 rounded-[2.5rem]">
        {/* Step indicators */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex gap-1.5">
            {[1, 2, 3, 4].map(s => (
              <div 
                key={s} 
                className={`h-2 rounded-full transition-all duration-300 ${
                  s === step ? 'w-10 bg-indigo-600' : s < step ? 'w-4 bg-indigo-300' : 'w-2 bg-slate-200'
                }`}
              />
            ))}
          </div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Step {step} of 4
          </span>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Let&apos;s Personalize</span>
                <h3 className="text-3xl font-black text-slate-900 mt-2 mb-2 leading-none">Who is preparing?</h3>
                <p className="text-sm text-slate-500 font-medium">We tailor the curriculum precisely to your child&apos;s age and targets.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Child&apos;s First Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                    <input 
                      type="text" 
                      value={childName}
                      onChange={e => setChildName(e.target.value)}
                      placeholder="e.g. Charlie"
                      className="w-full pl-12 pr-5 py-4 rounded-2xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-800 placeholder:text-slate-300 transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Current School Year</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { age: 9, label: 'Year 4 (Age 8-9)' },
                      { age: 10, label: 'Year 5 (Age 9-10)' },
                      { age: 8, label: 'Year 3 (Age 7-8)' },
                      { age: 11, label: 'Year 6 (Age 10-11)' }
                    ].map(y => (
                      <button
                        key={y.age}
                        type="button"
                        onClick={() => setChildAge(y.age)}
                        className={`p-4 rounded-2xl border font-bold text-sm text-center transition-all ${
                          childAge === y.age 
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' 
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        {y.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={nextStep}
                disabled={!childName.trim()}
                className={`w-full py-4.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
                  childName.trim() 
                    ? 'bg-slate-900 text-white hover:bg-slate-800' 
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                }`}
              >
                Continue
                <ArrowRight className="h-4 w-4" />
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
              <div>
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Select target</span>
                <h3 className="text-3xl font-black text-slate-900 mt-2 mb-2 leading-none">Which exam board?</h3>
                <p className="text-sm text-slate-500 font-medium">Select all that apply. We support custom formats for GL, CEM and private schools.</p>
              </div>

              <div className="space-y-3">
                {[
                  { id: 'GL Assessment', label: 'GL Assessment', desc: 'Standard board for most grammar regions' },
                  { id: 'CEM', label: 'CEM', desc: 'Common board focusing on strong vocabulary' },
                  { id: 'CSSE / Written', label: 'Independent / Written', desc: 'For private schools and selective grammar schools' }
                ].map(exam => {
                  const selected = targetExams.includes(exam.id)
                  return (
                    <button
                      key={exam.id}
                      type="button"
                      onClick={() => handleToggleExam(exam.id)}
                      className={`w-full p-5 rounded-2xl border text-left flex items-start gap-4 transition-all ${
                        selected 
                          ? 'bg-white border-indigo-600 shadow-md ring-2 ring-indigo-500/20' 
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className={`mt-1 h-5 w-5 rounded flex items-center justify-center shrink-0 border transition-all ${
                        selected ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-50 border-slate-300'
                      }`}>
                        {selected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm leading-none mb-1">{exam.label}</p>
                        <p className="text-xs text-slate-400 font-medium">{exam.desc}</p>
                      </div>
                    </button>
                  )
                })}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={prevStep}
                  className="w-1/3 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold text-sm hover:border-slate-300"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  className="w-2/3 py-4.5 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Almost ready</span>
                <h3 className="text-3xl font-black text-slate-900 mt-2 mb-2 leading-none">Primary focus?</h3>
                <p className="text-sm text-slate-500 font-medium">What is your primary preparation goal for {childName}?</p>
              </div>

              <div className="space-y-3">
                {[
                  'Build foundational math & english',
                  'Master high-difficulty exam questions',
                  'Form a steady daily study habit',
                  'Boost exam speed & verbal reasoning'
                ].map(goal => {
                  const selected = primaryGoal === goal
                  return (
                    <button
                      key={goal}
                      type="button"
                      onClick={() => setPrimaryGoal(goal)}
                      className={`w-full p-5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                        selected 
                          ? 'bg-white border-indigo-600 shadow-md ring-2 ring-indigo-500/20' 
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <span className="font-bold text-slate-800 text-sm">{goal}</span>
                      <div className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                        selected ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-50 border-slate-300'
                      }`}>
                        {selected && <div className="h-2 w-2 bg-white rounded-full" />}
                      </div>
                    </button>
                  )
                })}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={prevStep}
                  className="w-1/3 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold text-sm hover:border-slate-300"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  className="w-2/3 py-4.5 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                >
                  Generate Plan
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="text-center">
                <div className="h-14 w-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-bounce">
                  <Sparkles className="h-7 w-7" />
                </div>
                <h3 className="text-2xl font-black text-slate-900">Custom Plan Generated!</h3>
                <p className="text-xs text-slate-500 font-semibold mt-1">Study roadmap generated for {childName}</p>
              </div>

              {/* Dynamic Roadmap Preview */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 shrink-0">
                    <Target className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Target Syllabus</div>
                    <div className="font-bold text-xs text-slate-800 leading-none">
                      {targetExams.join(' + ')} Preparation Ladder
                    </div>
                  </div>
                </div>

                <div className="h-px bg-slate-100" />

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-600">Daily Goal Active</span>
                    <span className="text-indigo-600 font-extrabold">20 XP / Day</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-600">Starting Point</span>
                    <span className="text-slate-800 font-bold">11+ Baseline Level</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-600">Personalized Ladder</span>
                    <span className="text-emerald-600 font-extrabold flex items-center gap-1">
                      Ready
                      <Check className="h-3.5 w-3.5 stroke-[3]" />
                    </span>
                  </div>
                </div>
              </div>

              {/* Save Plan Registration Form */}
              <form 
                action={signUpAndCreateChild}
                onSubmit={() => setIsSubmitting(true)}
                className="space-y-4"
              >
                {/* Hidden values representing onboarding state */}
                <input type="hidden" name="childName" value={childName} />
                <input type="hidden" name="childAge" value={childAge} />
                <input type="hidden" name="targetExams" value={targetExams.join(',')} />

                <div>
                  <label htmlFor="email" className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                    Parent Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="parent@email.com"
                    className="w-full px-5 py-4 rounded-2xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-800 placeholder:text-slate-300 transition-all text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                    Choose Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    placeholder="••••••••"
                    className="w-full px-5 py-4 rounded-2xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-800 placeholder:text-slate-300 transition-all text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4.5 bg-indigo-600 text-white rounded-2xl font-black text-lg hover:bg-slate-900 transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-100"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Save Plan & Create Free Account
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>
              </form>

              <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center mt-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                No Card Needed At Signup
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

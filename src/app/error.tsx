'use client'

import { useEffect } from 'react'
import { AlertCircle, RotateCcw, Home } from 'lucide-react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Global Error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-white p-10 rounded-[3rem] shadow-2xl shadow-indigo-100 border border-slate-100">
        <div className="h-20 w-20 bg-rose-50 rounded-3xl flex items-center justify-center mx-auto mb-8">
          <AlertCircle className="h-10 w-10 text-rose-500" />
        </div>
        
        <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Something went wrong</h2>
        <p className="text-slate-500 font-medium mb-10 leading-relaxed">
          We encountered an unexpected error. Don&apos;t worry, your progress is safe!
        </p>
        
        <div className="flex flex-col gap-4">
          <button
            onClick={() => reset()}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
          >
            <RotateCcw className="h-5 w-5" />
            Try Again
          </button>
          
          <Link
            href="/"
            className="w-full py-4 bg-white border-2 border-slate-100 text-slate-600 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-all"
          >
            <Home className="h-5 w-5" />
            Return Home
          </Link>
        </div>
        
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-10 p-4 bg-slate-50 rounded-2xl text-left overflow-hidden">
             <p className="text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Error Trace</p>
             <p className="text-xs font-mono text-slate-500 break-all">{error.message}</p>
          </div>
        )}
      </div>
    </div>
  )
}

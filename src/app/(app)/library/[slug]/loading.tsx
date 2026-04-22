import { Loader2, BookOpen } from 'lucide-react'

export default function LibraryLoading() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="relative mb-8">
        <div className="h-24 w-24 bg-white rounded-3xl shadow-xl flex items-center justify-center animate-pulse">
           <BookOpen className="h-10 w-10 text-indigo-100" />
        </div>
        <div className="absolute -top-2 -right-2">
           <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
        </div>
      </div>
      
      <h2 className="text-2xl font-black text-slate-900 mb-2">Preparing Your Study Guide</h2>
      <p className="text-slate-400 font-medium">Our AI tutor is collecting the best 11+ tips for you...</p>
      
      {/* Skeleton Content */}
      <div className="mt-12 w-full max-w-2xl space-y-4 opacity-20">
         <div className="h-8 bg-slate-200 rounded-full w-3/4 mx-auto" />
         <div className="h-4 bg-slate-200 rounded-full w-full" />
         <div className="h-4 bg-slate-200 rounded-full w-5/6 mx-auto" />
         <div className="h-4 bg-slate-200 rounded-full w-full" />
      </div>
    </div>
  )
}

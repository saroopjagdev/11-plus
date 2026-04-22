import { generateTopicGuide } from '@/app/actions/library'
import { TopicGuide } from '@/components/TopicGuide'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'

export default async function LibraryTopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  
  if (!slug) redirect('/library')

  const result = await generateTopicGuide(slug)

  if (!result.success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
         <div className="max-w-md space-y-4">
            <h2 className="text-2xl font-black text-slate-900">Oops! High Traffic</h2>
            <p className="text-slate-500">{result.error}</p>
            <Link href="/library" className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold">
               Back to Library
            </Link>
         </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
       <div className="max-w-4xl mx-auto px-6 py-12">
          <Link 
            href="/library" 
            className="inline-flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-bold mb-12 transition-colors group"
          >
             <ArrowLeft className="h-4 w-4 transform group-hover:-translate-x-1 transition-transform" />
             Back to Library
          </Link>

          <TopicGuide 
            title={result.topicName} 
            content={result.content} 
          />
       </div>
    </div>
  )
}

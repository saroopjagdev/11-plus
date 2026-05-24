import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, BookOpen, ChevronRight, Sparkles, Target } from 'lucide-react'
import { guideCategories, getGuidesByCategory, seoGuides } from '@/lib/seo-guides'

const siteUrl = 'https://www.ace11plus.org'

export const metadata: Metadata = {
  title: '11+ Guides for Parents | Ace 11+',
  description:
    'Browse practical 11+ guides for schools, exam boards, Year 4 and Year 5 preparation, verbal reasoning, comprehension, vocabulary, mocks and more.',
  alternates: {
    canonical: `${siteUrl}/guides`,
  },
  openGraph: {
    title: '11+ Guides for Parents | Ace 11+',
    description:
      'Practical parent guides for 11+ schools, exam styles, Year 4 and Year 5 planning, subject skills and mock test preparation.',
    url: `${siteUrl}/guides`,
    type: 'website',
  },
}

export default function GuidesIndexPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-white border-b border-slate-100">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:py-24">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-4 py-2">
            <BookOpen className="h-4 w-4 text-indigo-600" />
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-700">
              Public 11+ guide library
            </span>
          </div>
          <div className="mt-6 grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <h1 className="max-w-4xl text-5xl font-black tracking-tight text-slate-900 sm:text-6xl">
                Helpful 11+ guides for parents planning the next step well.
              </h1>
              <p className="mt-6 max-w-3xl text-lg leading-relaxed text-slate-500">
                These guides are designed to help families understand common school routes, exam styles,
                Year 4 and Year 5 priorities, and the skills that usually need the most attention first.
              </p>
            </div>
            <div className="rounded-[2rem] border border-indigo-100 bg-indigo-50 p-6">
              <p className="text-sm font-bold uppercase tracking-widest text-indigo-500">
                Best place to start
              </p>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                If you are not sure which guide matters most yet, take the free diagnostic first and use the result
                to decide whether the immediate need is maths, English, vocabulary, reasoning or a broader plan.
              </p>
              <Link
                href="/diagnostic"
                className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 font-bold text-white transition-all hover:bg-slate-800"
              >
                Take the free diagnostic
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-6 py-14 lg:py-16">
        <div className="grid gap-10">
          {Object.entries(guideCategories).map(([categoryKey, category]) => {
            const guides = getGuidesByCategory(categoryKey as keyof typeof guideCategories)

            return (
              <section
                key={categoryKey}
                className="rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-sm lg:p-10"
              >
                <div className="mb-8 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <h2 className="text-3xl font-black tracking-tight text-slate-900">{category.title}</h2>
                    <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-500">
                      {category.description}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500">
                    {guides.length} guides
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {guides.map((guide) => (
                    <Link
                      key={guide.slug}
                      href={`/guides/${guide.slug}`}
                      className="group rounded-[2rem] border border-slate-100 bg-slate-50 p-6 transition-all hover:border-indigo-100 hover:bg-white hover:shadow-lg"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-xl font-black tracking-tight text-slate-900 transition-colors group-hover:text-indigo-600">
                            {guide.h1}
                          </h3>
                          <p className="mt-3 text-sm leading-relaxed text-slate-500">
                            {guide.description}
                          </p>
                        </div>
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-400 transition-all group-hover:bg-indigo-600 group-hover:text-white">
                          <ChevronRight className="h-5 w-5" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )
          })}
        </div>

        <section className="mt-12 rounded-[3rem] bg-slate-900 p-10 text-white lg:p-12">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2">
                <Sparkles className="h-4 w-4 text-indigo-300" />
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200">
                  Free starting point
                </span>
              </div>
              <h2 className="text-3xl font-black tracking-tight lg:text-4xl">
                Use the guides with a realistic baseline, not guesswork.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-300">
                The guides are most useful when you know whether your child currently needs stronger arithmetic,
                richer vocabulary, calmer timing, or a broader Year 5 reset. A baseline makes that easier to judge.
              </p>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center lg:justify-end">
              <Link
                href="/diagnostic"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-8 py-4 font-bold text-white transition-all hover:bg-indigo-500"
              >
                Take the free diagnostic
                <Target className="h-4 w-4" />
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-8 py-4 font-bold text-white transition-all hover:bg-white/10"
              >
                Create an account
              </Link>
            </div>
          </div>
        </section>
      </main>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: '11+ Guides for Parents',
            description:
              'Public 11+ guides for schools, exam boards, Year 4 and Year 5 preparation, subject skills and mock tests.',
            url: `${siteUrl}/guides`,
            hasPart: seoGuides.map((guide) => ({
              '@type': 'Article',
              headline: guide.h1,
              url: `${siteUrl}/guides/${guide.slug}`,
            })),
          }),
        }}
      />
    </div>
  )
}

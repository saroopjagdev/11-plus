import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowRight, ChevronRight, HelpCircle, Sparkles, Target } from 'lucide-react'
import { getGuideBySlug, getRelatedGuides, seoGuides } from '@/lib/seo-guides'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ace11plus.org'

type GuidePageProps = {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return seoGuides.map((guide) => ({ slug: guide.slug }))
}

export async function generateMetadata({ params }: GuidePageProps): Promise<Metadata> {
  const { slug } = await params
  const guide = getGuideBySlug(slug)

  if (!guide) {
    return {
      title: 'Guide Not Found | Ace 11+',
    }
  }

  const canonical = `${siteUrl}/guides/${guide.slug}`

  return {
    title: guide.title,
    description: guide.description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: guide.title,
      description: guide.description,
      url: canonical,
      type: 'article',
    },
  }
}

export default async function GuidePage({ params }: GuidePageProps) {
  const { slug } = await params
  const guide = getGuideBySlug(slug)

  if (!guide) {
    notFound()
  }

  const relatedGuides = getRelatedGuides(guide)
  const canonical = `${siteUrl}/guides/${guide.slug}`

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: guide.h1,
    description: guide.description,
    url: canonical,
    mainEntityOfPage: canonical,
    author: {
      '@type': 'Organization',
      name: 'Ace 11+',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Ace 11+',
      url: siteUrl,
    },
  }

  const faqSchema = guide.faqs.length
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: guide.faqs.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
      }
    : null

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-slate-900 px-6 pb-24 pt-16 text-white lg:pb-28 lg:pt-20">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/guides"
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-300 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to guides
          </Link>

          <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2">
            <Sparkles className="h-4 w-4 text-indigo-300" />
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200">
              Parent guide
            </span>
          </div>

          <h1 className="mt-6 max-w-4xl text-5xl font-black tracking-tight text-white sm:text-6xl">
            {guide.h1}
          </h1>
          {guide.subtitle && (
            <p className="mt-5 max-w-3xl text-lg leading-relaxed text-slate-300">
              {guide.subtitle}
            </p>
          )}
        </div>
      </section>

      <main className="mx-auto -mt-14 max-w-6xl px-6 pb-16">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <article className="rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-xl shadow-slate-200/40 lg:p-10">
            <div className="space-y-5">
              {guide.intro.map((paragraph) => (
                <p key={paragraph} className="text-lg leading-relaxed text-slate-600">
                  {paragraph}
                </p>
              ))}
            </div>

            {guide.disclaimer && (
              <div className="mt-8 rounded-2xl border border-amber-100 bg-amber-50 px-5 py-4 text-sm font-medium text-amber-900">
                {guide.disclaimer}
              </div>
            )}

            <div className="mt-12 space-y-10">
              {guide.sections.map((section) => (
                <section key={section.title} className="rounded-[2rem] border border-slate-100 bg-slate-50 p-6 lg:p-8">
                  <h2 className="text-2xl font-black tracking-tight text-slate-900">{section.title}</h2>
                  <div className="mt-4 space-y-4">
                    {section.paragraphs.map((paragraph) => (
                      <p key={paragraph} className="leading-relaxed text-slate-600">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                  {section.bullets && (
                    <ul className="mt-5 space-y-3">
                      {section.bullets.map((bullet) => (
                        <li key={bullet} className="flex items-start gap-3 text-slate-600">
                          <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-indigo-500" />
                          <span className="leading-relaxed">{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {section.callout && (
                    <div className="mt-5 rounded-2xl bg-white px-5 py-4 text-sm font-semibold text-slate-700">
                      {section.callout}
                    </div>
                  )}
                </section>
              ))}
            </div>

            {guide.faqs.length > 0 && (
              <section className="mt-12 rounded-[2rem] border border-slate-100 bg-white">
                <div className="border-b border-slate-100 px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                      <HelpCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black tracking-tight text-slate-900">Frequently asked questions</h2>
                      <p className="mt-1 text-sm text-slate-500">Short answers to the questions parents usually ask first.</p>
                    </div>
                  </div>
                </div>
                <div className="divide-y divide-slate-100">
                  {guide.faqs.map((faq) => (
                    <div key={faq.question} className="px-6 py-5">
                      <h3 className="text-lg font-bold text-slate-900">{faq.question}</h3>
                      <p className="mt-2 leading-relaxed text-slate-600">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </article>

          <aside className="space-y-8">
            <section className="rounded-[2.5rem] border border-indigo-100 bg-indigo-50 p-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-sm">
                <Target className="h-6 w-6" />
              </div>
              <h2 className="mt-5 text-2xl font-black tracking-tight text-slate-900">
                Find the right next step faster
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-slate-600">
                Use this guide alongside a realistic baseline. That makes it much easier to decide whether the main need is vocabulary, comprehension, reasoning, maths timing or a broader Year 5 reset.
              </p>
              <div className="mt-6 flex flex-col gap-3">
                <Link
                  href="/diagnostic"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 py-4 font-bold text-white transition-all hover:bg-slate-800"
                >
                  {guide.primaryCtaLabel || 'Take the free diagnostic'}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                {guide.secondaryCta && (
                  <Link
                    href={guide.secondaryCta.href}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-indigo-100 bg-white px-6 py-4 font-bold text-indigo-700 transition-all hover:bg-indigo-50"
                  >
                    {guide.secondaryCta.label}
                  </Link>
                )}
              </div>
            </section>

            {relatedGuides.length > 0 && (
              <section className="rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-sm">
                <h2 className="text-2xl font-black tracking-tight text-slate-900">Related guides</h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-500">
                  Useful follow-on reading if you want to compare nearby routes or focus in on the next likely weak spot.
                </p>
                <div className="mt-6 space-y-4">
                  {relatedGuides.map((relatedGuide) => (
                    <Link
                      key={relatedGuide.slug}
                      href={`/guides/${relatedGuide.slug}`}
                      className="group block rounded-[1.75rem] border border-slate-100 bg-slate-50 p-5 transition-all hover:border-indigo-100 hover:bg-white hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-black tracking-tight text-slate-900 transition-colors group-hover:text-indigo-600">
                            {relatedGuide.h1}
                          </h3>
                          <p className="mt-2 text-sm leading-relaxed text-slate-500">
                            {relatedGuide.description}
                          </p>
                        </div>
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-400 transition-all group-hover:bg-indigo-600 group-hover:text-white">
                          <ChevronRight className="h-4 w-4" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </aside>
        </div>
      </main>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
    </div>
  )
}

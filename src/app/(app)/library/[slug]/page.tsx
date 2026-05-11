import { redirect } from 'next/navigation'

export default async function LibraryTopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  
  if (!slug) redirect('/library')

  // Convert 'fractions-and-decimals' to 'Fractions and Decimals'
  const name = slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

  redirect(`/library/topic/${encodeURIComponent(name)}`)
}

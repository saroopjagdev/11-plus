'use server'

import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function getTopicGuide(topicName: string) {
  const supabase = await createClient()

  // 1. Check if guide exists
  const { data: existing } = await supabase
    .from('topic_guides')
    .select('*')
    .eq('topic_name', topicName)
    .maybeSingle()

  if (existing) return existing

  // 2. Generate if not exists
  const prompt = `
    You are an elite 11+ tutor for top grammar schools. 
    Write a comprehensive, professional study guide for the topic: "${topicName}".
    
    IMPORTANT: Return the response as a JSON object with this structure:
    {
      "overview": "A 2-3 sentence engaging overview of the topic.",
      "key_concepts": [
        {"title": "Concept Name", "text": "Explanation..."},
        {"title": "Concept Name", "text": "Explanation..."}
      ],
      "pro_tip": "A short, punchy secret trick for exam success."
    }
    
    Tone: Encouraging, premium, and expert.
  `

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    })

    const guideData = JSON.parse(response.choices[0].message.content || '{}')
    
    const newGuide = {
      topic_name: topicName,
      overview: guideData.overview,
      key_concepts: guideData.key_concepts,
      pro_tip: guideData.pro_tip,
      created_at: new Date().toISOString()
    }

    // 3. Save to DB (Fire and forget, or handle error)
    await supabase.from('topic_guides').insert(newGuide)

    return newGuide
  } catch (error) {
    console.error('Topic Guide AI Error:', error)
    return null
  }
}

export async function generateTopicGuide(topicSlug: string) {
  // Legacy function support
  const topicName = topicSlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  return getTopicGuide(topicName)
}

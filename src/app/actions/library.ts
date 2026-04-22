'use server'

import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function generateTopicGuide(topicSlug: string) {
  const topicName = topicSlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')

  const prompt = `
    You are an elite 11+ tutor. Write a comprehensive, child-friendly study guide for the topic: "${topicName}".
    
    Structure the guide exactly like this:
    1. **Introduction**: What is this topic and why is it important for the 11+?
    2. **Core Concepts**: Explain 2-3 key rules or methods. Use simple language and clear examples.
    3. **The 11+ Secret**: A "pro-tip" or mental shortcut that elite students use.
    4. **Common Traps**: What do students usually get wrong? How to avoid them.
    5. **Sample Question**: Write 1 high-quality 11+ style multiple-choice question with the correct answer explained.
    
    Tone: Encouraging, exciting, and professional.
    Format: Use clean Markdown. Avoid technical jargon.
  `

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    })

    return {
      success: true,
      topicName,
      content: response.choices[0].message.content || 'Guide content unavailable.'
    }
  } catch (error) {
    console.error('AI Generation Error:', error)
    return {
      success: false,
      error: 'The AI tutor is busy right now. Please try again in a few minutes!'
    }
  }
}

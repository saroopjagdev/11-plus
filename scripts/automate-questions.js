const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

// 1. Load Environment Variables
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    env[key.trim()] = valueParts.join('=').trim();
  }
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

/**
 * Main function to generate questions
 * @param {Object} options 
 * @param {string} options.subject - 'English' | 'Maths' | 'Verbal Reasoning' | 'Non-Verbal Reasoning'
 * @param {string} options.topic - e.g., 'Fractions', 'Comprehension', 'Vocabulary'
 * @param {string} options.difficulty - 'Easy' | 'Medium' | 'Hard'
 * @param {number} options.count - How many questions to generate
 * @param {string} options.mode - 'mcq' | 'written'
 */
async function automate(options) {
  // OPTIMIZATION: Use gpt-4o-mini for 90% of tasks to save 20x on costs.
  // Use gpt-4o only for high-complexity Comprehension passages.
  const isComplex = options.topic.toLowerCase() === 'comprehension';
  const model = isComplex ? "gpt-4o" : "gpt-4o-mini";

  console.log(`🚀 [${model}] Generating ${options.count} questions for ${options.topic}...`);

  try {
    let passageId = null;

    // A. Handle Comprehension Passages
    if (options.topic.toLowerCase() === 'comprehension') {
      console.log('📖 Generating reading passage...');
      const passagePrompt = `
        Create an original, engaging reading passage for a UK 11+ English exam (suitable for ages 10-11).
        The theme should be ${options.difficulty === 'Hard' ? 'a classic Victorian mystery' : 'a modern adventure'}.
        Length: 300-400 words.
        Respond in JSON format: { "title": "...", "content": "..." }
      `;

      const pResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: passagePrompt }],
        response_format: { type: "json_object" }
      });

      const passageData = JSON.parse(pResponse.choices[0].message.content);
      
      const { data: pInsert, error: pError } = await supabase
        .from('passages')
        .insert({
          title: passageData.title,
          content: passageData.content
          // 'subject' column doesn't exist in the passages table
        })
        .select()
        .single();

      if (pError) throw pError;
      passageId = pInsert.id;
      console.log(`✅ Passage created: "${passageData.title}" (ID: ${passageId})`);
    }

    // B. Generate Questions
    console.log(`🧠 Generating ${options.count} questions...`);
    const questionPrompt = `
      You are a strict, expert 11+ exam content creator for the GL Assessment and CEM exam boards. 
      Generate ${options.count} high-quality ${options.mode} questions for the topic: ${options.topic}.
      
      Subject: ${options.subject}
      Difficulty: ${options.difficulty} (Ensure the complexity matches this level exactly for a 10-11 year old).
      ${passageId ? `Base these questions on the reading passage provided.` : ''}

      CRITICAL REQUIREMENTS:
      1. SINGLE CORRECT ANSWER: For MCQs, exactly one option must be unequivocally correct. The other 4 options (distractors) must be plausible but definitively wrong. Use common 11+ pitfalls (e.g., partial answers, miscalculations, similar-sounding words).
      2. EXAM ALIGNMENT: Ensure the style, tone, and logical rigor match GL Assessment and CEM standards.
      3. CLARITY: Questions must be concise and free of ambiguity.
      4. RUBRICS: For written questions, the correct_answer must be a detailed "Award X marks if..." rubric.

      JSON Format:
      {
        "questions": [
          {
            "question_text": "...",
            "options": ${options.mode === 'mcq' ? '["Option A", "Option B", "Option C", "Option D", "Option E"]' : '[]'},
            "correct_answer": "Exact string of the correct option for MCQ, or rubric for written",
            "type": "${options.mode === 'mcq' ? 'mcq' : 'written'}"
          }
        ]
      }
    `;

    const qResponse = await openai.chat.completions.create({
      model: model,
      messages: [
        { role: "system", content: "You are a professional 11+ exam content creator. Return only valid JSON." },
        { role: "user", content: questionPrompt }
      ],
      response_format: { type: "json_object" }
    });

    const generatedData = JSON.parse(qResponse.choices[0].message.content);
    
    // C. Insert into Supabase
    const questionsToInsert = generatedData.questions.map(q => ({
      ...q,
      subject: options.subject,
      topic: options.topic,
      difficulty: options.difficulty,
      passage_id: passageId,
      // Force correct type to avoid DB constraint violations
      type: options.mode === 'mcq' ? 'mcq' : 'written'
    }));

    const { data: qInsert, error: qError } = await supabase
      .from('questions')
      .insert(questionsToInsert)
      .select();

    if (qError) throw qError;

    console.log(`🎉 Success! Inserted ${qInsert.length} questions into the database.`);
    return qInsert;

  } catch (err) {
    console.error('❌ Automation failed:', err.message);
  }
}

// Example usage:
// automate({
//   subject: 'English',
//   topic: 'Comprehension',
//   difficulty: 'Medium',
//   count: 5,
//   mode: 'written'
// });

module.exports = { automate };

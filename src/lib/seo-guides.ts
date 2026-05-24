export const GUIDE_DISCLAIMER =
  'Exam formats can change, so always check the school or consortium website.'

export type GuideCategoryKey =
  | 'schools-and-consortia'
  | 'exam-boards-and-formats'
  | 'year-group-planning'
  | 'subject-and-skills'
  | 'practice-and-mocks'

export interface GuideSection {
  title: string
  paragraphs: string[]
  bullets?: string[]
  callout?: string
}

export interface GuideFaq {
  question: string
  answer: string
}

export interface SeoGuide {
  slug: string
  title: string
  description: string
  h1: string
  subtitle?: string
  category: GuideCategoryKey
  intro: string[]
  sections: GuideSection[]
  relatedSlugs: string[]
  faqs: GuideFaq[]
  disclaimer?: string
  primaryCtaLabel?: string
  secondaryCta?: {
    label: string
    href: string
  }
}

export const guideCategories: Record<
  GuideCategoryKey,
  { title: string; description: string }
> = {
  'schools-and-consortia': {
    title: 'Schools and Consortia',
    description:
      'Parent-friendly overviews of competitive schools, regional grammar routes, and consortium-style 11+ tests.',
  },
  'exam-boards-and-formats': {
    title: 'Exam Boards and Formats',
    description:
      'Clear explanations of common 11+ assessment styles, including GL, CEM, Quest and region-specific test structures.',
  },
  'year-group-planning': {
    title: 'Year-Group Planning',
    description:
      'Planning guides for Year 4 and Year 5 so families know what to focus on, and when to raise the pace.',
  },
  'subject-and-skills': {
    title: 'Subject and Skills',
    description:
      'Practical guides for comprehension, vocabulary, maths timing, verbal reasoning and non-verbal reasoning.',
  },
  'practice-and-mocks': {
    title: 'Practice and Mocks',
    description:
      'Advice on mock tests, platform comparisons and what to look for when choosing 11+ preparation support.',
  },
}

function schoolGuide(config: {
  slug: string
  title: string
  description: string
  h1: string
  focus: string
  pressure: string
  prepAdvice: string
  mistakes: string[]
  nextSteps: string[]
  relatedSlugs: string[]
  faqs: GuideFaq[]
}) {
  return {
    slug: config.slug,
    title: config.title,
    description: config.description,
    h1: config.h1,
    subtitle:
      'A practical parent guide to what this route typically asks of pupils, how to prepare sensibly, and where families often lose marks.',
    category: 'schools-and-consortia' as const,
    disclaimer: GUIDE_DISCLAIMER,
    intro: [
      `${config.h1} is usually best approached as a competitive academic process rather than a general confidence test. Parents who do well here tend to combine steady skill-building with a realistic understanding of timing and standard.`,
      `The aim is not to chase every rumour about the format. It is to make sure your child can cope with the level of reading, mathematics and exam pressure that schools in this group commonly expect.`,
    ],
    sections: [
      {
        title: 'What this route typically focuses on',
        paragraphs: [
          config.focus,
          config.pressure,
        ],
        callout:
          'Treat published or historical details as a guide, not a guarantee. The underlying skills matter more than a guessed paper pattern.',
      },
      {
        title: 'How to prepare well',
        paragraphs: [
          config.prepAdvice,
          'A sensible plan usually blends untimed skill-building, short bursts of timed work, and regular review of errors. Parents often get better results from a steady weekly routine than from sudden cramming close to the test.',
        ],
      },
      {
        title: 'Common mistakes parents make',
        paragraphs: [
          'Most avoidable problems come from preparing the wrong things at the wrong time, or from assuming a bright child will automatically adapt under pressure.',
        ],
        bullets: config.mistakes,
      },
      {
        title: 'Suggested next steps',
        paragraphs: [
          'If you want a realistic starting point, begin with a baseline rather than with a full timetable. That gives you a clearer picture of whether reading, arithmetic, vocabulary or reasoning needs the most attention first.',
        ],
        bullets: config.nextSteps,
      },
    ],
    relatedSlugs: config.relatedSlugs,
    faqs: config.faqs,
    primaryCtaLabel: 'Take the free diagnostic',
  } satisfies SeoGuide
}

function examGuide(config: {
  slug: string
  title: string
  description: string
  h1: string
  focus: string
  sectionTips: string[]
  relatedSlugs: string[]
  faqs: GuideFaq[]
}) {
  return {
    slug: config.slug,
    title: config.title,
    description: config.description,
    h1: config.h1,
    subtitle:
      'A parent-facing breakdown of what this assessment style commonly rewards, and how to prepare without overcomplicating things.',
    category: 'exam-boards-and-formats' as const,
    disclaimer: GUIDE_DISCLAIMER,
    intro: [
      `${config.h1} should be thought of as a format guide, not a promise of exact paper design. Families usually benefit most when they prepare the broad skill pattern behind the assessment rather than trying to memorise old anecdotes.`,
      'The strongest preparation plans build secure core maths and English first, then add timing, mixed practice and selective mock work once accuracy is more stable.',
    ],
    sections: [
      {
        title: 'What this assessment style usually rewards',
        paragraphs: [config.focus],
      },
      {
        title: 'Preparation priorities',
        paragraphs: [
          'The right order is usually: build the underlying skill, check retention, then add speed. Children who are timed too early often become rushed guessers rather than accurate candidates.',
        ],
        bullets: config.sectionTips,
      },
      {
        title: 'Common mistakes to avoid',
        paragraphs: [
          'A common trap is treating every exam board the same. Another is doing endless papers without reviewing why marks are being lost.',
        ],
        bullets: [
          'Overusing mocks before the basics are secure',
          'Ignoring vocabulary and reading stamina because maths feels more urgent',
          'Assuming format familiarity can compensate for weak arithmetic or weak inference',
          'Letting timing dominate before accuracy is dependable',
        ],
      },
      {
        title: 'Suggested next steps',
        paragraphs: [
          'Start with a baseline that shows how your child handles mixed content. Then organise practice around the weakest areas rather than around whichever book or worksheet happens to be closest to hand.',
        ],
      },
    ],
    relatedSlugs: config.relatedSlugs,
    faqs: config.faqs,
    primaryCtaLabel: 'Take the free diagnostic',
  } satisfies SeoGuide
}

function yearGuide(config: {
  slug: string
  title: string
  description: string
  h1: string
  priorities: string[]
  timingAdvice: string
  relatedSlugs: string[]
}) {
  return {
    slug: config.slug,
    title: config.title,
    description: config.description,
    h1: config.h1,
    subtitle:
      'A realistic guide for parents who want to know what matters most this year, what can wait, and how to keep preparation calm and productive.',
    category: 'year-group-planning' as const,
    intro: [
      `${config.h1} works best when you match the plan to the child's stage. Some families over-accelerate far too early; others leave timing and exam exposure too late.`,
      'A strong plan should build confidence and coverage without making the whole household feel like an exam centre.',
    ],
    sections: [
      {
        title: 'Main priorities for this stage',
        paragraphs: [
          'This stage is less about ticking every topic box and more about building the habits that make later preparation smoother and less stressful.',
        ],
        bullets: config.priorities,
      },
      {
        title: 'What parents often get wrong',
        paragraphs: [
          config.timingAdvice,
          'Another common mistake is measuring progress only by how many papers have been completed. For most children, long-term gains come from review, reading and secure core skills.',
        ],
      },
      {
        title: 'A sensible weekly rhythm',
        paragraphs: [
          'A balanced week usually includes some arithmetic fluency, some reading or vocabulary, one reasoning slot if relevant, and one lighter review session. The exact mix matters less than the consistency.',
          'If your child is becoming anxious or resistant, reduce volume before you abandon preparation altogether. A calmer routine is often more sustainable and more productive.',
        ],
      },
      {
        title: 'Suggested next steps',
        paragraphs: [
          'Use a baseline to understand where you truly are now, then decide whether the main need is catch-up, consolidation or stretch work.',
        ],
      },
    ],
    relatedSlugs: config.relatedSlugs,
    faqs: [
      {
        question: `How much 11+ prep is sensible during ${config.h1.includes('Year 4') ? 'Year 4' : 'Year 5'}?`,
        answer:
          'Enough to build momentum, but not so much that every session feels high stakes. A steady weekly routine is usually better than bursts of heavy practice.',
      },
      {
        question: 'Should we use full mocks straight away?',
        answer:
          'Usually not. Full mocks are more useful once core topics are reasonably secure and your child can learn from the feedback rather than just survive the experience.',
      },
    ],
    primaryCtaLabel: 'Take the free diagnostic',
    secondaryCta: {
      label: 'Create an account',
      href: '/signup',
    },
  } satisfies SeoGuide
}

function skillGuide(config: {
  slug: string
  title: string
  description: string
  h1: string
  whatItMeans: string
  prepBullets: string[]
  mistakes: string[]
  relatedSlugs: string[]
  faqs: GuideFaq[]
}) {
  return {
    slug: config.slug,
    title: config.title,
    description: config.description,
    h1: config.h1,
    subtitle:
      'A clear guide to what this skill really involves in 11+ preparation, and how parents can help without making practice feel chaotic.',
    category: 'subject-and-skills' as const,
    intro: [
      `${config.h1} is often discussed loosely, but children do better when parents understand the exact sub-skills involved. That makes practice more targeted and reduces the temptation to rely on random worksheets.`,
      'The goal is to identify which part is causing the problem: understanding, technique, speed, stamina, or careless errors.',
    ],
    sections: [
      {
        title: 'What this skill really involves',
        paragraphs: [config.whatItMeans],
      },
      {
        title: 'Preparation that usually helps',
        paragraphs: [
          'Short, frequent practice often beats occasional marathons. Children usually improve faster when the task is specific and reviewed properly afterwards.',
        ],
        bullets: config.prepBullets,
      },
      {
        title: 'Common mistakes',
        paragraphs: [
          'Many children look weaker than they really are because the practice method is mismatched to the skill being tested.',
        ],
        bullets: config.mistakes,
      },
      {
        title: 'Suggested next steps',
        paragraphs: [
          'Use a diagnostic to see whether this is genuinely a priority right now. That prevents you from over-focusing on one area while a bigger gap elsewhere keeps dragging the score down.',
        ],
      },
    ],
    relatedSlugs: config.relatedSlugs,
    faqs: config.faqs,
    primaryCtaLabel: 'Take the free diagnostic',
  } satisfies SeoGuide
}

const guides: SeoGuide[] = [
  schoolGuide({
    slug: 'tiffin-girls-11-plus-guide',
    title: 'Tiffin Girls 11+ Guide | Ace 11+',
    description:
      'A practical guide for parents preparing for Tiffin Girls: what the route typically focuses on, where marks are often lost, and how to prepare sensibly.',
    h1: 'Tiffin Girls 11+ guide',
    focus:
      'For Tiffin Girls, parents should usually expect a very strong academic field, with English and maths carrying significant weight. The standard tends to reward pupils who can read carefully, work accurately and stay composed under pressure, rather than those who have only practised obvious question types.',
    pressure:
      'The real challenge is often not one isolated topic but the combination of difficulty, pace and competition. A child who is “good at school” can still underperform if vocabulary depth, inference, arithmetic fluency or time control are not strong enough.',
    prepAdvice:
      'Prioritise secure arithmetic, rich reading, vocabulary building and calm timed practice. It is usually better to develop dependable accuracy in Year 4 and early Year 5 before relying heavily on full papers.',
    mistakes: [
      'Focusing only on maths because it feels easier to measure than English quality',
      'Leaving inference, vocabulary and reading stamina too late',
      'Using hard papers before core accuracy is stable',
      'Assuming mock volume alone will produce improvement',
    ],
    nextSteps: [
      'Take a mixed diagnostic to spot whether the immediate priority is English, maths or both',
      'Build a weekly plan that includes reading, vocabulary and arithmetic every week',
      'Add timed sections gradually rather than turning everything into a race too early',
    ],
    relatedSlugs: [
      'tiffin-boys-11-plus-guide',
      'year-5-11-plus-preparation-guide',
      '11-plus-comprehension-guide',
      '11-plus-maths-timing-guide',
    ],
    faqs: [
      {
        question: 'Is Tiffin Girls preparation mostly about doing harder papers?',
        answer:
          'Not usually. Hard papers only help if the underlying reading, maths and timing skills are already strong enough to benefit from them.',
      },
      {
        question: 'When should families start preparing for Tiffin Girls?',
        answer:
          'Many families begin light skill-building in Year 4 and then increase structure in Year 5, but the right start point depends on current reading, arithmetic and reasoning strength.',
      },
    ],
  }),
  schoolGuide({
    slug: 'tiffin-boys-11-plus-guide',
    title: 'Tiffin Boys 11+ Guide | Ace 11+',
    description:
      'A parent-friendly Tiffin Boys 11+ guide covering typical focus areas, practical preparation, and common mistakes to avoid.',
    h1: 'Tiffin Boys 11+ guide',
    focus:
      'Tiffin Boys preparation typically rewards secure maths, strong reading comprehension and the ability to keep accuracy under competitive time pressure. Parents usually do best when they prepare broadly rather than assuming one “signature” paper pattern will decide the result.',
    pressure:
      'Children often need both strong fundamentals and calm execution. A candidate can know the method but still drop marks through rushed arithmetic, misread wording or weak stamina across a paper.',
    prepAdvice:
      'Keep preparation balanced. Arithmetic fluency, comprehension, vocabulary and problem-solving should all feature regularly, with later timed practice used to sharpen decisions rather than replace proper learning.',
    mistakes: [
      'Over-practising one favourite subject while another remains fragile',
      'Skipping review of incorrect answers',
      'Introducing full mocks before shorter timed sets are manageable',
      'Treating verbal skill as optional when comprehension and vocabulary still need work',
    ],
    nextSteps: [
      'Use a baseline to see whether the main drag on score is speed, accuracy or reading quality',
      'Schedule regular review sessions where your child explains why an answer was wrong',
      'Introduce exam-style timing only once untimed understanding is sound',
    ],
    relatedSlugs: [
      'tiffin-girls-11-plus-guide',
      'year-5-11-plus-preparation-guide',
      '11-plus-vocabulary-guide',
      '11-plus-mock-tests-guide',
    ],
    faqs: [
      {
        question: 'Do bright boys always cope well with Tiffin-style pressure?',
        answer:
          'Not automatically. Bright children can still lose marks through pacing, rushed checking and inconsistent reading under time pressure.',
      },
      {
        question: 'Should we prioritise speed or accuracy first?',
        answer:
          'Accuracy first. Speed becomes more useful once the child is reliably choosing the right method and reading questions properly.',
      },
    ],
  }),
  schoolGuide({
    slug: 'henrietta-barnett-school-11-plus-guide',
    title: 'Henrietta Barnett School 11+ Guide | Ace 11+',
    description:
      'A clear parent guide to Henrietta Barnett School 11+ preparation, including likely strengths tested, mistakes to avoid, and practical next steps.',
    h1: 'Henrietta Barnett School 11+ guide',
    focus:
      'Henrietta Barnett School preparation is usually associated with an exceptionally high standard, especially in careful reading, strong literacy habits and mature mathematical thinking. Parents should assume that surface familiarity is not enough: precision and depth matter.',
    pressure:
      'The competitive challenge is often about maintaining quality all the way through the process. Pupils who can read closely, infer well and handle multi-step maths calmly are generally better placed than those who rely on quick but shallow methods.',
    prepAdvice:
      'Invest heavily in reading quality, vocabulary, written reasoning and secure maths foundations. If your child is very quick but careless, slow them down in practice first and rebuild checking habits before piling on more papers.',
    mistakes: [
      'Assuming a strong school report is enough evidence of 11+ readiness',
      'Neglecting written explanation, inference and vocabulary depth',
      'Rushing advanced material before the basics are stable',
      'Ignoring fatigue and concentration over longer sessions',
    ],
    nextSteps: [
      'Baseline both maths and English rather than trusting one area to compensate for the other',
      'Track careless-error patterns, not just total score',
      'Use high-quality reading and discussion alongside formal practice',
    ],
    relatedSlugs: [
      '11-plus-comprehension-guide',
      '11-plus-vocabulary-guide',
      'year-5-11-plus-preparation-guide',
      'gl-assessment-11-plus-guide',
    ],
    faqs: [
      {
        question: 'Is Henrietta Barnett preparation mainly an English job?',
        answer:
          'English often feels especially important, but children still need strong maths, concentration and exam control across the whole process.',
      },
      {
        question: 'What should we do if our child reads well but scores unevenly?',
        answer:
          'Look closely at timing, inference quality, arithmetic slips and consistency. Uneven scores usually point to a small number of repeatable issues.',
      },
    ],
  }),
  schoolGuide({
    slug: 'sutton-set-11-plus-guide',
    title: 'Sutton SET 11+ Guide | Ace 11+',
    description:
      'A straightforward guide to the Sutton SET: what it commonly tests, how to prepare sensibly, and how to avoid wasting time on the wrong things.',
    h1: 'Sutton SET 11+ guide',
    focus:
      'The Sutton SET is typically used as an initial shared eligibility test for the area, so it often rewards broad readiness rather than narrow specialism. Families usually need a child who can switch between core English and maths demands without losing confidence or pace.',
    pressure:
      'Because this kind of test is commonly used as an early screening stage, children can struggle if they are prepared for only one subject or one paper style. A broad, mixed foundation is usually more useful than over-preparing one niche question type, especially where individual schools may have later stages of their own.',
    prepAdvice:
      'Build confidence in core maths and English first, then use mixed timed sets to improve switching between question styles. Keep error review practical and avoid turning every session into a mock.',
    mistakes: [
      'Preparing only for one perceived paper format',
      'Ignoring vocabulary and reading quality while drilling arithmetic only',
      'Moving to full mocks before mixed-topic practice feels manageable',
      'Assuming early-stage tests are "easier" and require less structure',
    ],
    nextSteps: [
      'Use a mixed diagnostic to see how well your child copes across subjects',
      'Prioritise the weakest strand before increasing overall workload',
      'Add short timed sets that train switching and recovery under pressure',
    ],
    relatedSlugs: [
      'gl-assessment-11-plus-guide',
      '11-plus-verbal-reasoning-guide',
      '11-plus-maths-timing-guide',
      'year-4-11-plus-preparation-guide',
    ],
    faqs: [
      {
        question: 'Should Sutton SET prep begin with full papers?',
        answer:
          'Usually no. Short mixed sets and secure fundamentals are a better base before full-paper practice becomes worthwhile.',
      },
      {
        question: 'What is the main risk with Sutton SET preparation?',
        answer:
          'Preparing too narrowly. Children often need broad readiness more than a single polished trick.',
      },
    ],
  }),
  schoolGuide({
    slug: 'kent-test-11-plus-guide',
    title: 'Kent Test 11+ Guide | Ace 11+',
    description:
      'A practical Kent Test guide for parents covering the skills usually needed, common preparation mistakes, and sensible next steps.',
    h1: 'Kent Test 11+ guide',
    focus:
      'The Kent Test is commonly built around a broad selective profile, with English and maths alongside reasoning-based demands. The children who cope best usually have strong all-round habits rather than one standout area carrying the rest.',
    pressure:
      'Pressure often shows up when a child has an obvious strength but a hidden weakness. A confident mathematician can still be dragged down by weak reading accuracy, shaky reasoning pattern recognition or avoidable timing errors.',
    prepAdvice:
      'Aim for balanced preparation. That usually means arithmetic fluency, careful reading, vocabulary growth and regular reasoning exposure, followed by measured mock work later in the cycle. A writing task may appear in some years, but it is sensible to treat reading, maths and reasoning readiness as the core preparation priority.',
    mistakes: [
      'Assuming one strong score area will outweigh a serious weakness elsewhere',
      'Treating reasoning as an afterthought',
      'Skipping review because the paper "felt fine"',
      'Using too much volume and not enough reflection',
    ],
    nextSteps: [
      'Use a baseline to identify the weakest strand before choosing books or mocks',
      'Keep an eye on stamina as well as raw score',
      'Review wrong answers by cause: knowledge gap, misread question, or time pressure',
    ],
    relatedSlugs: [
      'gl-assessment-11-plus-guide',
      '11-plus-non-verbal-reasoning-guide',
      '11-plus-verbal-reasoning-guide',
      '11-plus-mock-tests-guide',
    ],
    faqs: [
      {
        question: 'Is the Kent Test mainly about reasoning?',
        answer:
          'Reasoning matters, but children usually still need dependable English and maths habits to produce a strong all-round result.',
      },
      {
        question: 'How should we decide whether to increase practice volume?',
        answer:
          'Increase only when your child can review mistakes properly and maintain quality. More work is not always better work.',
      },
    ],
  }),
  schoolGuide({
    slug: 'csse-11-plus-guide',
    title: 'CSSE 11+ Guide | Ace 11+',
    description:
      'A parent guide to CSSE 11+ preparation, with practical advice on likely focus areas, timing pressure, and the next steps that usually help most.',
    h1: 'CSSE 11+ guide',
    focus:
      'CSSE routes often require strong literacy and maths control, with a premium on careful reading and disciplined execution. Children usually do better when they can sustain concentration and recover quickly from a difficult question rather than panicking mid-paper.',
    pressure:
      'Parents sometimes underestimate how much pace and emotional control matter. Even when the underlying skill is there, some pupils lose ground through rushed choices, weak checking or fading concentration.',
    prepAdvice:
      'Mix reading, vocabulary, arithmetic and exam-style review into a consistent weekly plan. Timed work should train decision-making, not encourage blind speed.',
    mistakes: [
      'Neglecting comprehension quality while drilling technique',
      'Treating mocks as the main learning tool instead of a checkpoint',
      'Failing to analyse why careless mistakes keep recurring',
      'Assuming a strong early score means no further structure is needed',
    ],
    nextSteps: [
      'Use a baseline to see whether English or maths is currently limiting performance',
      'Keep timed work short until the child is making better decisions consistently',
      'Practise recovery: skip, move on, return later',
    ],
    relatedSlugs: [
      '11-plus-comprehension-guide',
      '11-plus-maths-timing-guide',
      '11-plus-mock-tests-guide',
      'year-5-11-plus-preparation-guide',
    ],
    faqs: [
      {
        question: 'What is the biggest CSSE preparation mistake?',
        answer:
          'Letting speed take over before the child has dependable accuracy and calm question-reading habits.',
      },
      {
        question: 'Should we focus on one weak subject first?',
        answer:
          'Usually yes, but without abandoning the rest completely. The best plans strengthen the biggest weakness while keeping the broader skill base ticking over.',
      },
    ],
  }),
  schoolGuide({
    slug: 'bucks-11-plus-guide',
    title: 'Bucks 11+ Guide | Ace 11+',
    description:
      'A clear Bucks 11+ guide for parents: what the test style often demands, how to prepare effectively, and where children commonly come unstuck.',
    h1: 'Bucks 11+ guide',
    focus:
      'The Bucks 11+ is typically associated with a GL-style selective profile, commonly combining verbal, non-verbal and mathematical thinking. Families often benefit from seeing it as a mixed-profile challenge rather than a single-subject race.',
    pressure:
      'Children can struggle if they are secure in classwork but not yet used to moving briskly between different kinds of question. Switching, checking and concentration are often just as important as content knowledge.',
    prepAdvice:
      'Prepare for breadth as well as score. Build reliable maths and English habits, then bring in reasoning and mock-style pacing once the core is in place.',
    mistakes: [
      'Practising only familiar question types',
      'Ignoring stamina and concentration',
      'Assuming that lots of papers automatically means good preparation',
      'Reviewing marks but not reviewing decision-making',
    ],
    nextSteps: [
      'Take a baseline to identify whether the bigger issue is coverage, timing or accuracy',
      'Use shorter mixed papers before pushing full mocks',
      'Track repeated error patterns by topic and by habit',
    ],
    relatedSlugs: [
      'gl-assessment-11-plus-guide',
      '11-plus-non-verbal-reasoning-guide',
      '11-plus-mock-tests-guide',
      'year-4-11-plus-preparation-guide',
    ],
    faqs: [
      {
        question: 'Is Bucks preparation mainly about getting faster?',
        answer:
          'Speed matters, but it is only useful once the child has secure methods and can keep accuracy under pressure.',
      },
      {
        question: 'How early should Bucks-style prep become structured?',
        answer:
          "That depends on the child's current level, but many families benefit from building core habits in Year 4 before increasing intensity in Year 5.",
      },
    ],
  }),
  schoolGuide({
    slug: 'birmingham-west-midlands-grammar-11-plus-guide',
    title: 'Birmingham and West Midlands Grammar 11+ Guide | Ace 11+',
    description:
      'A practical Birmingham and West Midlands grammar guide for parents, with advice on broad preparation, timing pressure and avoiding common traps.',
    h1: 'Birmingham / West Midlands grammar 11+ guide',
    focus:
      'Birmingham and West Midlands grammar routes commonly reward broad readiness, especially strong literacy, secure maths and the ability to work accurately under tight timing. Parents generally do best when they plan for a mixed challenge rather than preparing one subject in isolation.',
    pressure:
      'Vocabulary depth, reading stamina and time control are often decisive. Children may know enough to answer correctly in untimed conditions but still struggle to convert that into a competitive score across mixed sections.',
    prepAdvice:
      'Build up reading, arithmetic and mixed aptitude-style practice steadily, with explicit work on timing only once the child is making good decisions more consistently. Mixed practice is usually more realistic than topic silos alone.',
    mistakes: [
      'Leaving vocabulary and comprehension too late',
      'Assuming maths strength will cover broader weaknesses',
      'Using very long sessions that reduce quality and morale',
      'Doing timed practice without enough review',
    ],
    nextSteps: [
      'Use a diagnostic to identify the main bottleneck before selecting mocks',
      'Add vocabulary work to the weekly routine even if maths feels more urgent',
      'Use retakes later as checkpoints, not as daily practice',
    ],
    relatedSlugs: [
      'cem-11-plus-guide',
      '11-plus-vocabulary-guide',
      '11-plus-comprehension-guide',
      '11-plus-mock-tests-guide',
    ],
    faqs: [
      {
        question: 'What often catches children out in West Midlands grammar preparation?',
        answer:
          'Usually the combination of pace, reading load and mixed content rather than one obviously impossible topic.',
      },
      {
        question: 'Should we do lots of full papers early?',
        answer:
          'Usually no. Shorter mixed sets and careful review tend to build better foundations before full-paper work becomes useful.',
      },
    ],
  }),
  examGuide({
    slug: 'gl-assessment-11-plus-guide',
    title: 'GL Assessment 11+ Guide | Ace 11+',
    description:
      'A useful GL Assessment 11+ guide for parents covering the skills GL-style papers commonly reward and how to prepare with a sensible sequence.',
    h1: 'GL Assessment 11+ guide',
    focus:
      'GL-style 11+ preparation usually rewards familiarity with multiple-choice formats, solid arithmetic, careful English, and whichever combination of verbal reasoning, non-verbal reasoning or broader English and maths the school has chosen. The most successful candidates tend to be all-round accurate rather than just quick.',
    sectionTips: [
      'Build arithmetic fluency so simple marks are not dropped under time pressure',
      'Practise comprehension by answering from evidence, not by guessing from general knowledge',
      'Use verbal and non-verbal reasoning practice to train pattern recognition, not just memorise answer types',
      'Review why options were tempting, especially in multiple-choice papers',
    ],
    relatedSlugs: [
      'kent-test-11-plus-guide',
      'bucks-11-plus-guide',
      '11-plus-verbal-reasoning-guide',
      '11-plus-non-verbal-reasoning-guide',
    ],
    faqs: [
      {
        question: 'What is the main advantage of preparing specifically for GL-style papers?',
        answer:
          'It helps children become comfortable with multiple-choice decision-making and mixed reasoning demands, while still keeping the core maths and English work central.',
      },
      {
        question: 'Should GL preparation be mostly about paper familiarity?',
        answer:
          'No. Format familiarity helps, but secure maths, reading and reasoning are still what drive the score.',
      },
    ],
  }),
  examGuide({
    slug: 'cem-11-plus-guide',
    title: 'CEM 11+ Guide | Ace 11+',
    description:
      'A parent guide to CEM 11+ preparation, including vocabulary, mixed paper pressure, and how to prepare without turning everything into a speed contest.',
    h1: 'CEM 11+ guide',
    focus:
      'CEM-style preparation is often associated with demanding timing, mixed question sequences and a heavy premium on vocabulary, reading agility and fast mental control. Children usually need strong underlying habits before the speed element starts to work in their favour, especially where schools still use this label for a mixed, fast-paced paper style.',
    sectionTips: [
      'Prioritise vocabulary and reading exposure throughout the year, not only near the exam',
      'Build mental arithmetic and number sense so simple calculations do not steal time',
      'Use short timed bursts to improve switching between question styles',
      'Practise staying calm after a difficult section rather than mentally "giving up" on the paper',
    ],
    relatedSlugs: [
      'birmingham-west-midlands-grammar-11-plus-guide',
      '11-plus-vocabulary-guide',
      '11-plus-maths-timing-guide',
      '11-plus-mock-tests-guide',
    ],
    faqs: [
      {
        question: 'Why does CEM preparation often feel harder to manage?',
        answer:
          'Because it usually combines vocabulary depth, mixed content and time pressure, so weak habits show up quickly.',
      },
      {
        question: 'What should we fix first for CEM-style tests?',
        answer:
          'Usually vocabulary, arithmetic fluency and calm switching between tasks. Those foundations make later timed work far more productive.',
      },
    ],
  }),
  examGuide({
    slug: 'quest-assessment-11-plus-guide',
    title: 'Quest Assessment 11+ Guide | Ace 11+',
    description:
      'A straightforward Quest Assessment 11+ guide for parents: what this style of assessment commonly values and how to prepare without overfitting.',
    h1: 'Quest Assessment 11+ guide',
    focus:
      'Quest-style 11+ routes are best treated as school-specific assessments rather than one fixed national format. The key preparation principle is usually flexibility: children need to adapt to whatever blend of English, maths or broader reasoning the school uses while relying on solid fundamentals.',
    sectionTips: [
      'Treat school-specific tests as broad academic filters, not as puzzles to decode',
      'Make sure maths methods are secure enough to hold up when the question style changes',
      'Keep comprehension, vocabulary and reasoning active in the weekly mix',
      'Use diagnostics and short mocks to test adaptability rather than chasing rumours about exact formats',
    ],
    relatedSlugs: [
      'sutton-set-11-plus-guide',
      '11-plus-comprehension-guide',
      '11-plus-verbal-reasoning-guide',
      '11-plus-mock-tests-guide',
    ],
    faqs: [
      {
        question: 'How should parents prepare for a school-specific Quest-style paper?',
        answer:
          'Focus on broad academic readiness, mixed practice and calm exam habits rather than trying to over-engineer around guessed paper details.',
      },
      {
        question: 'Is adaptability more important than drilling one paper pattern?',
        answer:
          'Usually yes. Children with secure fundamentals and good decision-making tend to adapt better than those trained too narrowly.',
      },
    ],
  }),
  {
    slug: 'atom-learning-alternative-guide',
    title: 'Atom Learning Alternative Guide | Ace 11+',
    description:
      'What parents should look for in an Atom Learning alternative, including diagnostics, progress tracking, question quality and practical day-to-day usability.',
    h1: 'Atom Learning alternative guide',
    subtitle:
      'A calm, parent-facing guide for families comparing 11+ platforms and trying to decide what actually matters in practice.',
    category: 'practice-and-mocks',
    intro: [
      'When parents look for an Atom Learning alternative, they are usually not looking for "more features" in the abstract. They are looking for something that helps them understand where their child stands, what to practise next, and whether progress is actually happening.',
      'A good platform should reduce noise. It should help you see weaknesses early, keep practice targeted, and make it easier to decide when to move from skill-building into timed work and mocks.',
    ],
    sections: [
      {
        title: 'What to compare properly',
        paragraphs: [
          'The most useful comparison points are usually diagnostic clarity, question quality, coverage, reporting, and whether the platform helps you act on mistakes rather than simply logging them.',
        ],
        bullets: [
          'Does it give a clear baseline before pushing lots of practice?',
          'Can you see topic-level weaknesses rather than just total score?',
          'Is the practice broad enough for mixed 11+ demands?',
          'Does the platform support both building skills and testing them under pressure?',
        ],
      },
      {
        title: 'What many parents overlook',
        paragraphs: [
          'A slick interface is not enough if you still cannot tell why scores are stalling. Likewise, a huge question bank is less useful if the child is repeatedly practising the wrong level or the wrong skill mix.',
          'For many families, the most valuable feature is not “more questions” but a better sense of direction.',
        ],
      },
      {
        title: 'A practical way to judge fit',
        paragraphs: [
          'Start with a baseline and see whether the platform points you towards a sensible next step. If the advice feels generic, or you still cannot tell what to prioritise, it may not be reducing the real workload for the parent.',
        ],
      },
      {
        title: 'Suggested next steps',
        paragraphs: [
          'Before paying for another platform, get a clear picture of your child’s current level and the biggest score bottleneck. That makes later comparisons far more grounded.',
        ],
      },
    ],
    relatedSlugs: [
      'year-4-11-plus-preparation-guide',
      'year-5-11-plus-preparation-guide',
      '11-plus-mock-tests-guide',
      'gl-assessment-11-plus-guide',
    ],
    faqs: [
      {
        question: 'What is the most important feature in an 11+ platform alternative?',
        answer:
          'For most parents, it is clarity: a reliable baseline, topic-level insight, and sensible next-step guidance.',
      },
      {
        question: 'Should we compare platforms by question volume alone?',
        answer:
          'No. Quality, coverage, diagnosis and practical usability matter more than headline quantity on its own.',
      },
    ],
    primaryCtaLabel: 'Take the free diagnostic',
    secondaryCta: {
      label: 'Create an account',
      href: '/signup',
    },
  },
  yearGuide({
    slug: 'year-4-11-plus-preparation-guide',
    title: 'Year 4 11+ Preparation Guide | Ace 11+',
    description:
      'A realistic Year 4 11+ preparation guide for parents who want to build strong foundations without burning their child out too early.',
    h1: 'Year 4 11+ preparation guide',
    priorities: [
      'Secure arithmetic fluency and number confidence',
      'Daily or near-daily reading with discussion',
      'Vocabulary growth through books, conversation and light targeted practice',
      'Steady concentration and homework habits',
      'Low-pressure exposure to reasoning where relevant',
    ],
    timingAdvice:
      'The biggest Year 4 mistake is behaving as if the exam is next month. Most children need strong habits and confidence more than heavy timed-paper volume at this stage.',
    relatedSlugs: [
      'year-5-11-plus-preparation-guide',
      '11-plus-vocabulary-guide',
      '11-plus-comprehension-guide',
      '11-plus-verbal-reasoning-guide',
    ],
  }),
  yearGuide({
    slug: 'year-5-11-plus-preparation-guide',
    title: 'Year 5 11+ Preparation Guide | Ace 11+',
    description:
      'A practical Year 5 11+ preparation guide for parents who need a clearer plan for timing, mocks, consolidation and avoiding panic.',
    h1: 'Year 5 11+ preparation guide',
    priorities: [
      'Consolidate weaker maths and English topics quickly and honestly',
      'Build timed-section stamina in a controlled way',
      'Use mixed practice so children can switch between question types',
      'Review mistakes by cause, not just by score',
      'Introduce mocks as checkpoints once the basics are ready',
    ],
    timingAdvice:
      'The biggest Year 5 mistake is either panicking into endless papers or spending too long in purely untimed comfort. Most families need a middle ground: secure the core, then raise pace steadily.',
    relatedSlugs: [
      'year-4-11-plus-preparation-guide',
      '11-plus-mock-tests-guide',
      '11-plus-maths-timing-guide',
      '11-plus-comprehension-guide',
    ],
  }),
  skillGuide({
    slug: '11-plus-comprehension-guide',
    title: '11+ Comprehension Guide | Ace 11+',
    description:
      'A helpful 11+ comprehension guide for parents, including what strong comprehension really looks like, how to prepare, and common answer-choice traps.',
    h1: '11+ comprehension guide',
    whatItMeans:
      '11+ comprehension is not just “can they read the passage”. It usually includes locating evidence, understanding vocabulary in context, making sensible inferences, tracking tone, and staying accurate while time is running.',
    prepBullets: [
      'Ask your child to prove answers from the text rather than from instinct',
      'Build reading stamina with short regular sessions, not last-minute marathons',
      'Discuss why distractor answers feel tempting',
      'Use vocabulary review to support comprehension rather than treating it as separate work',
    ],
    mistakes: [
      'Answering from prior knowledge rather than the passage',
      'Rushing the question stem and missing key wording',
      'Skipping inference practice because literal questions feel easier',
      'Reading plenty, but never discussing answer evidence explicitly',
    ],
    relatedSlugs: [
      '11-plus-vocabulary-guide',
      'year-5-11-plus-preparation-guide',
      'henrietta-barnett-school-11-plus-guide',
      'csse-11-plus-guide',
    ],
    faqs: [
      {
        question: 'Why do children who read a lot still struggle with 11+ comprehension?',
        answer:
          'Because exam comprehension also tests evidence use, inference, attention to wording and time control, not just reading enjoyment.',
      },
      {
        question: 'How often should we practise comprehension?',
        answer:
          'Little and often usually works best, especially when answers are reviewed properly rather than just marked right or wrong.',
      },
    ],
  }),
  skillGuide({
    slug: '11-plus-vocabulary-guide',
    title: '11+ Vocabulary Guide | Ace 11+',
    description:
      'A practical 11+ vocabulary guide covering what to learn, how to build word knowledge steadily, and how to avoid shallow memorisation.',
    h1: '11+ vocabulary guide',
    whatItMeans:
      '11+ vocabulary is usually about more than matching one word to another. Children often need broad word knowledge, understanding of tone and usage, and enough reading exposure to recognise unfamiliar vocabulary in context.',
    prepBullets: [
      'Read widely and talk about new words in context',
      'Group words by meaning families, not just one-off lists',
      'Revisit new vocabulary repeatedly over time',
      'Use the words in speech or writing so they become active knowledge',
    ],
    mistakes: [
      'Memorising long word lists without context',
      'Never revisiting old vocabulary after one session',
      'Ignoring roots, prefixes and suffixes',
      'Separating vocabulary practice completely from reading',
    ],
    relatedSlugs: [
      '11-plus-comprehension-guide',
      'cem-11-plus-guide',
      'year-4-11-plus-preparation-guide',
      'tiffin-girls-11-plus-guide',
    ],
    faqs: [
      {
        question: 'Is vocabulary practice just about synonym lists?',
        answer:
          'No. Synonyms help, but children also need context, tone, and repeated exposure through reading and discussion.',
      },
      {
        question: 'How quickly do vocabulary scores improve?',
        answer:
          'Usually gradually. Vocabulary grows best through steady exposure and review rather than quick cramming.',
      },
    ],
  }),
  skillGuide({
    slug: '11-plus-maths-timing-guide',
    title: '11+ Maths Timing Guide | Ace 11+',
    description:
      'A useful 11+ maths timing guide for parents who want to improve pace without encouraging panic, shortcuts or careless arithmetic.',
    h1: '11+ maths timing guide',
    whatItMeans:
      'Maths timing in the 11+ is usually about efficient decision-making, not frantic speed. Children need to recognise the method quickly, avoid avoidable arithmetic slips, and know when to move on from a sticky question.',
    prepBullets: [
      'Strengthen arithmetic fluency before pushing hard timed work',
      'Practise quick method selection on short mixed sets',
      'Teach skip-and-return as a normal strategy, not as a sign of failure',
      'Review where time is being lost: reading, method choice, arithmetic, or checking',
    ],
    mistakes: [
      'Turning every maths session into a race',
      'Ignoring working accuracy while chasing faster finishes',
      'Using full papers before children can manage short timed blocks well',
      'Failing to separate “slow because unsure” from “slow because too careful”',
    ],
    relatedSlugs: [
      'year-5-11-plus-preparation-guide',
      '11-plus-mock-tests-guide',
      'kent-test-11-plus-guide',
      '11-plus-verbal-reasoning-guide',
    ],
    faqs: [
      {
        question: 'Should timing practice begin as soon as possible?',
        answer:
          'Usually no. Start timing once the method is reasonably secure, otherwise children rehearse panic rather than improvement.',
      },
      {
        question: 'What is the fastest safe way to improve maths timing?',
        answer:
          'Secure arithmetic, short mixed timed sets, and consistent review of where time is actually being lost.',
      },
    ],
  }),
  skillGuide({
    slug: '11-plus-verbal-reasoning-guide',
    title: '11+ Verbal Reasoning Guide | Ace 11+',
    description:
      'A parent-friendly 11+ verbal reasoning guide explaining what verbal reasoning really tests, how to practise it, and where children usually get stuck.',
    h1: '11+ verbal reasoning guide',
    whatItMeans:
      'Verbal reasoning usually tests how well a child can recognise language and number patterns, manipulate letter or word information, and stay methodical under time pressure. It is not simply a vocabulary test, though vocabulary often helps.',
    prepBullets: [
      'Teach one question family at a time before mixing them together',
      'Use worked explanations so your child understands the rule, not just the answer',
      'Keep arithmetic sharp because many verbal reasoning formats use number logic too',
      'Add timed mixed sets after the child can explain the pattern types clearly',
    ],
    mistakes: [
      'Mixing too many verbal reasoning types too early',
      'Treating it as memory work rather than pattern recognition',
      'Ignoring the language component in favour of shortcuts only',
      'Timing children before they know how to approach each family of question',
    ],
    relatedSlugs: [
      '11-plus-vocabulary-guide',
      '11-plus-non-verbal-reasoning-guide',
      'gl-assessment-11-plus-guide',
      'kent-test-11-plus-guide',
    ],
    faqs: [
      {
        question: 'Is verbal reasoning mostly about learning tricks?',
        answer:
          'No. Tricks can help, but the core is pattern recognition, language awareness and calm method selection.',
      },
      {
        question: 'How do we know if verbal reasoning is a real weakness?',
        answer:
          'A baseline helps. If scores fall mainly on reasoning-style questions, that is a sign to focus there more deliberately.',
      },
    ],
  }),
  skillGuide({
    slug: '11-plus-non-verbal-reasoning-guide',
    title: '11+ Non-Verbal Reasoning Guide | Ace 11+',
    description:
      'A clear 11+ non-verbal reasoning guide for parents, covering what the questions test, how to practise patterns, and common errors under time pressure.',
    h1: '11+ non-verbal reasoning guide',
    whatItMeans:
      'Non-verbal reasoning typically tests visual pattern recognition, transformations, symmetry, sequences and spatial logic. Children often need to slow down enough to see the governing rule before they can answer quickly.',
    prepBullets: [
      'Teach common visual rules such as rotation, reflection, counting and progression one by one',
      'Encourage children to describe the pattern aloud before choosing an answer',
      'Use sketching or finger-tracing when learning, then reduce support later',
      'Mix familiar and unfamiliar pattern families once confidence improves',
    ],
    mistakes: [
      'Guessing from appearance instead of identifying the rule',
      'Moving to timed sets before the child can explain why an answer is correct',
      'Ignoring small changes in count, shading or position',
      'Assuming non-verbal reasoning needs no explicit teaching',
    ],
    relatedSlugs: [
      'gl-assessment-11-plus-guide',
      'bucks-11-plus-guide',
      '11-plus-verbal-reasoning-guide',
      '11-plus-mock-tests-guide',
    ],
    faqs: [
      {
        question: 'Why do some children find non-verbal reasoning unexpectedly hard?',
        answer:
          'Because it tests visual rule recognition under pressure, and many children have not been taught how to analyse those patterns systematically.',
      },
      {
        question: 'Should we time non-verbal reasoning straight away?',
        answer:
          'Usually not. It helps more to build rule recognition first, then add time pressure once the method is clearer.',
      },
    ],
  }),
  {
    slug: '11-plus-mock-tests-guide',
    title: '11+ Mock Tests Guide | Ace 11+',
    description:
      'A practical 11+ mock tests guide explaining when mocks help, when they are premature, and how parents can use them without creating noise.',
    h1: '11+ mock tests guide',
    subtitle:
      'How to use mock exams as checkpoints rather than as a substitute for proper preparation.',
    category: 'practice-and-mocks',
    intro: [
      'Mock tests are useful when they answer a clear question: can my child hold their method, concentration and pacing together under realistic pressure?',
      'Mocks are much less useful when they become the main form of learning. Most score gains come from what you do with the feedback afterwards, not from the mock itself.',
    ],
    sections: [
      {
        title: 'When mocks are genuinely helpful',
        paragraphs: [
          'Mocks are usually most useful once your child has reasonable familiarity with the main content areas and can benefit from exam-style feedback. At that point, a mock can reveal timing, stamina, nerves and switching problems that do not show up in untimed work.',
        ],
        bullets: [
          'To test pacing under realistic conditions',
          'To expose weak transitions between question types',
          'To build confidence in routine and recovery',
          'To guide the next block of targeted practice',
        ],
      },
      {
        title: 'When mocks are too early',
        paragraphs: [
          'If your child is still insecure on core arithmetic, basic comprehension or key reasoning methods, full mocks often create noise rather than clarity. The result may look “bad”, but the real problem is simply that the foundations were not ready.',
        ],
      },
      {
        title: 'How to review a mock properly',
        paragraphs: [
          'Review by cause, not just by topic. Was the mark lost through weak knowledge, a misread question, poor time allocation, or anxiety? Parents usually get much more value from a short calm review than from immediately starting another full paper.',
        ],
      },
      {
        title: 'Suggested next steps',
        paragraphs: [
          'Take a baseline first, then use mocks later to test whether practice is transferring under pressure. That sequence is usually more informative than jumping straight into repeated papers.',
        ],
      },
    ],
    relatedSlugs: [
      'year-5-11-plus-preparation-guide',
      '11-plus-maths-timing-guide',
      'cem-11-plus-guide',
      'atom-learning-alternative-guide',
    ],
    faqs: [
      {
        question: 'How often should children do full 11+ mocks?',
        answer:
          'Usually occasionally rather than constantly. They work best as checkpoints with real review in between.',
      },
      {
        question: 'What should we do after a disappointing mock score?',
        answer:
          'Look at why the marks were lost, then target the biggest weakness. A low mock is more useful as information than as a verdict.',
      },
    ],
    primaryCtaLabel: 'Take the free diagnostic',
    secondaryCta: {
      label: 'Create an account',
      href: '/signup',
    },
  },
]

export const seoGuides = guides

export function getGuideBySlug(slug: string) {
  return seoGuides.find((guide) => guide.slug === slug)
}

export function getRelatedGuides(guide: SeoGuide) {
  return guide.relatedSlugs
    .map((slug) => getGuideBySlug(slug))
    .filter((item): item is SeoGuide => Boolean(item))
}

export function getGuidesByCategory(category: GuideCategoryKey) {
  return seoGuides.filter((guide) => guide.category === category)
}

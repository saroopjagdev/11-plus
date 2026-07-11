export const GUIDE_DISCLAIMER =
  'Exam formats can change, so always check the school or consortium website.'

export type GuideCategoryKey =
  | 'schools-and-consortia'
  | 'exam-boards-and-formats'
  | 'year-group-planning'
  | 'scores-and-readiness'
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
  'scores-and-readiness': {
    title: 'Scores and Readiness',
    description:
      'Plain-English answers on 11+ pass marks and standardised scores, when to start preparing, and how to judge whether your child is genuinely ready.',
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
    secondaryCta: {
      label: 'Create an account',
      href: '/signup',
    },
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
    secondaryCta: {
      label: 'Create an account',
      href: '/signup',
    },
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
    secondaryCta: {
      label: 'Create an account',
      href: '/signup',
    },
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
      'queen-elizabeths-school-barnet-11-plus-guide',
      'st-olaves-grammar-school-11-plus-guide',
      '11-plus-comprehension-guide',
      '11-plus-vocabulary-guide',
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
      'wilsons-wallington-sutton-grammar-11-plus-guide',
      'gl-assessment-11-plus-guide',
      '11-plus-verbal-reasoning-guide',
      '11-plus-maths-timing-guide',
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
      'CSSE routes often require strong literacy and maths control, with a premium on careful reading and disciplined execution. One distinctive feature of the CSSE English paper is a dedicated Continuous Writing section, typically two short, tightly timed prompts worth around a quarter of the English marks — so unlike many other 11+ formats, writing is a real, separately marked part of the test rather than an occasional extra. Children usually do better when they can sustain concentration and recover quickly from a difficult question rather than panicking mid-paper.',
    pressure:
      'Parents sometimes underestimate how much pace and emotional control matter. Even when the underlying skill is there, some pupils lose ground through rushed choices, weak checking or fading concentration. The tight time limit on the writing section in particular catches families out who have only practised longer, untimed stories.',
    prepAdvice:
      'Mix reading, vocabulary, arithmetic and exam-style review into a consistent weekly plan, and make sure short, timed creative writing is a regular part of that rotation given its real weighting in the English paper. Timed work should train decision-making, not encourage blind speed.',
    mistakes: [
      'Neglecting comprehension quality while drilling technique',
      'Treating mocks as the main learning tool instead of a checkpoint',
      'Failing to analyse why careless mistakes keep recurring',
      'Practising only long-form creative writing when the actual format needs short, tightly timed responses',
    ],
    nextSteps: [
      'Use a baseline to see whether English or maths is currently limiting performance',
      'Keep timed work short until the child is making better decisions consistently',
      'Practise recovery: skip, move on, return later',
    ],
    relatedSlugs: [
      '11-plus-creative-writing-guide',
      '11-plus-comprehension-guide',
      '11-plus-maths-timing-guide',
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
      'what-is-the-11-plus-guide',
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
      'best-11-plus-online-platforms-guide',
      'year-5-11-plus-preparation-guide',
      '11-plus-mock-tests-guide',
      'is-my-child-ready-for-11-plus',
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
      'what-is-the-11-plus-guide',
      'year-5-11-plus-preparation-guide',
      '11-plus-vocabulary-guide',
      '11-plus-comprehension-guide',
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
      'is-my-child-ready-for-11-plus',
      '11-plus-pass-mark-guide',
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
  {
    slug: 'is-my-child-ready-for-11-plus',
    title: 'Is My Child Ready for the 11+? | Ace 11+',
    description:
      'A practical way to judge whether your child is ready for the 11+, covering reading age, arithmetic, working habits and emotional resilience — not just school reports.',
    h1: 'Is my child ready for the 11+?',
    subtitle:
      'A calm, honest way to judge 11+ readiness using real signals rather than a school report or a gut feeling.',
    category: 'scores-and-readiness',
    disclaimer: GUIDE_DISCLAIMER,
    intro: [
      'This is one of the most important questions a parent can ask, and it is often answered too optimistically or too anxiously. Readiness for the 11+ is not the same as “doing well at school”. The national curriculum standard and the selective 11+ standard are different things, and a glowing school report does not always translate into a competitive exam score.',
      'The useful version of this question is specific: is your child reading well above their age, secure with arithmetic, able to concentrate for a sustained period, and calm enough to cope with getting things wrong under time pressure? Those are the signals that actually predict how the next twelve months will go.',
    ],
    sections: [
      {
        title: 'The four parts of real readiness',
        paragraphs: [
          'It helps to separate readiness into four strands, because a child can be strong in one and fragile in another. Most children who struggle later were strong on paper in one area but quietly weak in another that nobody checked.',
        ],
        bullets: [
          'Reading: ideally a reading age comfortably above their actual age, with good understanding, not just fluent decoding',
          'Maths: secure number bonds, times tables and mental arithmetic, so harder problems are not derailed by slow basics',
          'Concentration and stamina: the ability to work carefully for 30–45 minutes without drifting',
          'Emotional resilience: staying calm after a hard question rather than giving up on the rest of the paper',
        ],
        callout:
          'A child who is strong academically but fragile under pressure is still “ready to start” — they simply need timing and resilience built deliberately, not assumed.',
      },
      {
        title: 'Why a school report is not enough',
        paragraphs: [
          'School assessments measure progress against the national expectation, which most selective candidates have already exceeded. A child described as “working at greater depth” may still be a long way from a competitive standardised score, because the 11+ tests speed, inference, vocabulary depth and reasoning that classroom work rarely stretches.',
          'This is not a criticism of schools. It simply means a report tells you your child is doing well for their year group, not how they compare to the specific, self-selecting group of children sitting the same grammar or independent exam.',
        ],
      },
      {
        title: 'How to check readiness objectively',
        paragraphs: [
          'The fastest way to replace guesswork with evidence is a baseline: a short, mixed assessment across maths, English and reasoning that shows where your child actually sits today. What you are looking for is not a single score but a pattern — is the gap mainly in vocabulary, in arithmetic speed, in inference, or in timing?',
          'It is also worth comparing untimed and timed performance. A child who scores well untimed but drops sharply under time pressure is ready to begin, but needs pacing work. A child who struggles even untimed usually needs more foundation-building before formal 11+ practice becomes productive.',
        ],
        bullets: [
          'Use a mixed diagnostic rather than one subject in isolation',
          'Note the difference between untimed accuracy and timed accuracy',
          'Look for the biggest single bottleneck first, not every small gap',
        ],
      },
      {
        title: 'Signs your child may need more time',
        paragraphs: [
          'Readiness is not all-or-nothing, and starting a little later is far better than starting anxious. If several of the signals below are present, it usually means foundations need attention before heavy exam practice, not that the 11+ is off the table.',
        ],
        bullets: [
          'Reading is fluent out loud but understanding and recall are weak',
          'Simple arithmetic is still effortful or finger-counted',
          'Concentration collapses after ten or fifteen minutes',
          'A single wrong answer causes real distress or shutdown',
        ],
      },
    ],
    relatedSlugs: [
      '11-plus-pass-mark-guide',
      'when-to-start-11-plus-preparation',
      'year-4-11-plus-preparation-guide',
      '11-plus-mock-tests-guide',
    ],
    faqs: [
      {
        question: 'How do I know if my child is capable of passing the 11+?',
        answer:
          'Look at reading age, arithmetic security, concentration and resilience together, then confirm with a baseline assessment. A school report alone is not a reliable predictor of a competitive 11+ score.',
      },
      {
        question: 'What reading age should a child have for the 11+?',
        answer:
          'Many successful candidates read comfortably above their chronological age, with strong understanding rather than just fluent decoding. Reading depth underpins comprehension, vocabulary and even reasoning.',
      },
      {
        question: 'Is it too late to start if my child is not ready yet?',
        answer:
          'Usually not. Most gaps are foundations that can be built with a steady plan. Starting slightly later with secure basics often beats starting early but anxious.',
      },
    ],
    primaryCtaLabel: 'Check readiness with the free diagnostic',
    secondaryCta: {
      label: 'Create an account',
      href: '/signup',
    },
  },
  {
    slug: '11-plus-pass-mark-guide',
    title: '11+ Pass Mark 2026: What Score Do You Need? | Ace 11+',
    description:
      'A clear explanation of 11+ pass marks and standardised scores: why there is no fixed national pass mark, what a “good” score looks like, and how superselective thresholds differ.',
    h1: '11+ pass mark: what score does your child need?',
    subtitle:
      'How standardised scores really work, why the “pass mark” changes, and what a genuinely competitive score looks like.',
    category: 'scores-and-readiness',
    disclaimer: GUIDE_DISCLAIMER,
    intro: [
      'Parents often search for “the 11+ pass mark” expecting a single number, but there isn’t one. There is no fixed national pass mark, because grammar and independent schools set their own thresholds, and those thresholds move each year depending on how the whole cohort performs and how difficult the paper was.',
      'What matters instead is the standardised score, and understanding how it is built makes the whole results process far less mysterious. Once you understand standardisation, you can judge a practice score realistically rather than panicking or relaxing about the wrong number.',
    ],
    sections: [
      {
        title: 'How standardised scores work',
        paragraphs: [
          'Raw marks are converted into a standardised score so children can be compared fairly. The conversion adjusts for the difficulty of the paper and, importantly, for the child’s exact age on the test day — some boards adjust by month of birth, others to the precise day — so a summer-born child is not compared directly against classmates who can be up to a year older.',
          'On the common GL scale, standardised scores typically run from around 69 to 141, with 100 as the average. That means a score above 100 is above the national average for that test — but the average child does not pass a selective exam, so “above average” and “competitive” are not the same thing.',
        ],
        callout:
          'A standardised score already accounts for age. That is why two children with the same raw marks can receive different standardised scores.',
      },
      {
        title: 'What counts as a “good” score',
        paragraphs: [
          'As a rough guide, a score of around 121 places a child in roughly the top 10% nationally, and many competitive grammar schools look for something around that level or above. A score of around 130 represents roughly the top 5%.',
          'Fully selective areas do not all measure this the same way. Kent, for example, sets a minimum standardised score in each of its three tests (recently around 106–108 per subject) plus an aggregate total across all three, so the effective bar can look close to “111 on average” once you divide it out — but a child could still miss out with one weak subject even if their average looks fine. Always check how your specific test or area combines its scores, rather than assuming one single number applies everywhere.',
          'At the most oversubscribed superselective schools — where the most competitive, like Queen Elizabeth’s Barnet or Henrietta Barnett, can see over ten applicants per place — there is often no fixed qualifying score at all. Places simply go to the highest-ranked scorers until they run out, and successful applicants in recent years have commonly scored in the 128–140 range. At that level, a qualifying score is only the starting point.',
          'These numbers are indicative, not promises. The genuine threshold at any given school depends on the number of applicants, the strength of that year’s cohort, and how places are ranked, so treat published figures as orientation rather than a target you can rely on, and always check the current year’s figures for your specific school or area.',
        ],
        bullets: [
          'Around 100: the national average — not enough on its own for a selective place',
          'Around 106–111: typical per-subject or aggregate-average minimum in some fully selective areas',
          'Around 121+: roughly the national top 10%, and typically competitive for many grammar schools',
          'Around 128–140: the range successful applicants commonly reach at the most oversubscribed superselective schools',
        ],
      },
      {
        title: 'Why the “pass mark” changes every year',
        paragraphs: [
          'Because thresholds are set relative to the cohort, a score that secured a place last year might not this year, and vice versa. A harder paper does not make it harder to pass, because standardisation adjusts for difficulty — what changes the bar is how many strong children apply and how the school ranks them.',
          'This is also why chasing a specific magic number can be misleading. The more reliable aim is to be comfortably clear of the likely threshold across every section, so that one weaker paper on the day does not sink the overall result.',
        ],
      },
      {
        title: 'Turning scores into a plan',
        paragraphs: [
          'A single practice score tells you very little on its own. What helps is seeing the score broken down by topic, so you can tell whether marks are being lost to vocabulary, arithmetic slips, weak inference or simply running out of time. That breakdown is what turns “we need a higher score” into a specific weekly focus.',
          'A baseline that reports at topic level, rather than just a total, is the quickest way to see how far your child currently is from a competitive standard and which gap to close first.',
        ],
      },
    ],
    relatedSlugs: [
      'is-my-child-ready-for-11-plus',
      'gl-assessment-11-plus-guide',
      'when-to-start-11-plus-preparation',
      '11-plus-mock-tests-guide',
    ],
    faqs: [
      {
        question: 'What is the pass mark for the 11+?',
        answer:
          'There is no fixed national pass mark. Schools set their own standardised-score thresholds each year, based on cohort performance and the number of applicants for each place.',
      },
      {
        question: 'What is a good standardised score in the 11+?',
        answer:
          'Around 121 puts a child in roughly the national top 10% and is often competitive for grammar schools. Fully selective areas set their own thresholds (commonly a per-subject minimum around 106–111 plus an aggregate total), while the most oversubscribed superselective schools have no fixed score at all — successful applicants there commonly reach 128–140.',
      },
      {
        question: 'Does the 11+ score adjust for my child’s age?',
        answer:
          'Yes. Standardisation includes an age allowance in months, so younger children in the year group are not disadvantaged compared with older classmates.',
      },
    ],
    primaryCtaLabel: 'See your child’s baseline score',
    secondaryCta: {
      label: 'Create an account',
      href: '/signup',
    },
  },
  {
    slug: 'when-to-start-11-plus-preparation',
    title: 'When to Start 11+ Preparation | Ace 11+',
    description:
      'A realistic guide to when to start 11+ preparation, how long it usually takes, and how to build a steady plan without cramming or burning your child out.',
    h1: 'When should you start 11+ preparation?',
    subtitle:
      'A sensible answer to the timing question, covering how far ahead to begin and how to pace it without panic.',
    category: 'scores-and-readiness',
    disclaimer: GUIDE_DISCLAIMER,
    intro: [
      'The most common answer among experienced families and tutors is to begin structured preparation around the end of Year 4 or the start of Year 5, giving roughly twelve to eighteen months before the tests that usually fall early in Year 6. That window is long enough to build skills steadily and short enough to keep momentum.',
      'But the honest answer is that the right start point depends on the child, the target schools and the current standard, not on a fixed date. Two children the same age can need very different timelines, and forcing an early start on a child who is not ready can do more harm than good.',
    ],
    sections: [
      {
        title: 'The typical timeline',
        paragraphs: [
          'For most families aiming at grammar or independent places, a one-year plan starting in Year 5 is the standard route, and a two-year plan starting in Year 4 is increasingly common for more competitive targets. The extra year is not about doing exam papers earlier; it is about building reading, vocabulary and arithmetic so that later practice actually pays off.',
          'For the most oversubscribed superselective schools, some families begin light, low-pressure enrichment in Year 3 — wide reading, number confidence and puzzles — long before any formal 11+ material appears. The emphasis at that stage should be curiosity and habit, not exam drilling.',
        ],
        bullets: [
          'End of Year 4 / start of Year 5: typical structured start, ~12–18 months out',
          'Year 4 (two-year plan): common for competitive or superselective targets',
          'Year 3: only light, enjoyable foundation work — reading, number sense, puzzles',
        ],
      },
      {
        title: 'What “starting” should actually look like',
        paragraphs: [
          'Starting preparation does not mean sitting full papers from day one. Early on, the priority is untimed skill-building: secure arithmetic, rich reading, growing vocabulary and an understanding of each reasoning question type. Timed work and mocks come later, once accuracy is dependable.',
          'A “little and often” rhythm consistently beats occasional long sessions. Short, focused work several times a week builds retention and keeps the whole thing sustainable, which matters enormously over a twelve-month campaign.',
        ],
        callout:
          'Introduce timing to sharpen decisions once accuracy is stable — not to rehearse panic before the basics are secure.',
      },
      {
        title: 'The two most common timing mistakes',
        paragraphs: [
          'The first mistake is starting too late and then cramming, which turns the final months into a stressful sprint that rewards guessing over understanding. The second is starting early but with the wrong intensity — piling on papers in Year 4 and burning a child out long before the exam that matters.',
          'Both are avoidable with the same fix: match the plan to the child’s current level, then increase pace gradually. A calm, consistent routine almost always outperforms a dramatic one.',
        ],
      },
      {
        title: 'How to choose your own start point',
        paragraphs: [
          'Rather than copy a generic date, start from where your child actually is. A baseline shows whether the immediate need is catch-up, consolidation or stretch, which in turn tells you how much runway you need before the tests.',
          'If the baseline shows secure foundations, a focused one-year plan may be plenty. If it reveals significant gaps, an earlier and gentler start lets you build those foundations without pressure.',
        ],
      },
    ],
    relatedSlugs: [
      'year-4-11-plus-preparation-guide',
      'year-5-11-plus-preparation-guide',
      'is-my-child-ready-for-11-plus',
      '11-plus-pass-mark-guide',
    ],
    faqs: [
      {
        question: 'When should we start preparing for the 11+?',
        answer:
          'Most families begin structured preparation at the end of Year 4 or start of Year 5, roughly 12–18 months before the tests. Competitive targets often warrant a two-year plan from Year 4.',
      },
      {
        question: 'Is Year 5 too late to start 11+ preparation?',
        answer:
          'Usually no. A focused one-year plan from Year 5 is the standard route for many families, provided foundations in reading and arithmetic are already reasonably secure.',
      },
      {
        question: 'How much should we do each week?',
        answer:
          'Little and often works best — several short, focused sessions a week, with timed practice introduced only once accuracy is dependable.',
      },
    ],
    primaryCtaLabel: 'Take the free diagnostic',
    secondaryCta: {
      label: 'Create an account',
      href: '/signup',
    },
  },
  {
    slug: 'best-11-plus-online-platforms-guide',
    title: 'Best 11+ Online Preparation Platforms 2026 | Ace 11+',
    description:
      'How to choose the best 11+ online platform for your child: what to compare, the main types of platform, and how to avoid paying for the wrong one.',
    h1: 'How to choose the best 11+ online platform',
    subtitle:
      'A practical framework for comparing 11+ platforms, so you pay for the one that fits your child rather than the loudest brand.',
    category: 'practice-and-mocks',
    disclaimer: GUIDE_DISCLAIMER,
    intro: [
      'There is no single “best” 11+ platform, and any page that claims otherwise is usually selling one. The right choice depends on your child’s current level, your target schools, how long you have until the exam, and how much of the planning you want the platform to do for you.',
      'The good news is that platforms fall into a few recognisable types, and once you can tell them apart, choosing becomes much easier. This guide gives you the comparison framework rather than a ranked league table, because the same platform can be ideal for one family and wrong for another.',
    ],
    sections: [
      {
        title: 'What to actually compare',
        paragraphs: [
          'Most families over-index on question volume, which is one of the least useful comparison points once a bank is “big enough”. The features that genuinely change outcomes are the ones that help you direct practice and act on mistakes.',
        ],
        bullets: [
          'Diagnostic clarity: does it establish a real baseline before pushing practice?',
          'Adaptivity: does it adjust to your child, or just serve a fixed bank?',
          'Coverage: does it match your exam board and region (GL, CEM, CSSE, independent)?',
          'Reporting: can you see topic-level weaknesses, not just a total score?',
          'Mock capability: can it test performance under realistic timed conditions?',
          'Answer quality and explanations: are wrong answers explained clearly and correctly?',
        ],
      },
      {
        title: 'The main types of platform',
        paragraphs: [
          'Broadly, 11+ platforms sit in a few categories, and each suits a different family. Knowing which type you are looking at tells you far more than a star rating.',
        ],
        bullets: [
          'Year-round adaptive all-rounders: build knowledge and habits over a long runway, and decide what to practise next for you',
          'Exam-focused test–teach–retest tools: pace preparation towards a target date and drill gaps close to the exam',
          'Large question banks and paper libraries: plenty of material, but you or a tutor decide the direction',
          'Tutor-led or mock-heavy services: human guidance and realistic exam days, usually at higher cost',
        ],
        callout:
          'A huge question bank is only valuable if something tells your child what to work on next. Direction usually matters more than volume.',
      },
      {
        title: 'Matching the platform to your child',
        paragraphs: [
          'If your child is early in the journey with a long runway, a year-round adaptive platform that builds habits may suit best. If the exam is close and you already know the weak areas, an exam-focused tool that drills those gaps under time pressure can be more efficient. If you have a tutor guiding strategy, a strong question bank may be all you need to supply the practice.',
          'The mistake is buying on brand recognition before you know what your child needs. A platform that is excellent for consolidation can be frustrating for a child who actually needs foundational catch-up, and vice versa.',
        ],
      },
      {
        title: 'Start with the need, not the subscription',
        paragraphs: [
          'Before paying for anything, get a clear picture of where your child currently stands and what the biggest bottleneck is. That single piece of information makes every platform comparison sharper, because you can judge each option against a real need rather than a feature list.',
          'A free baseline diagnostic is the cheapest way to do this. Even if you ultimately choose a different tool, knowing your child’s starting point means you will not overpay for features you do not need or miss the one capability that matters most.',
        ],
      },
    ],
    relatedSlugs: [
      'atom-learning-alternative-guide',
      '11-plus-mock-tests-guide',
      'is-my-child-ready-for-11-plus',
      'gl-assessment-11-plus-guide',
    ],
    faqs: [
      {
        question: 'What is the best 11+ online platform?',
        answer:
          'There is no single best platform — it depends on your child’s level, your target schools and your timeline. Compare diagnostic clarity, adaptivity, coverage and reporting rather than question volume alone.',
      },
      {
        question: 'Are adaptive platforms better than question banks?',
        answer:
          'Adaptive platforms help by directing practice and adjusting difficulty, which suits families wanting the tool to guide next steps. A question bank can be ideal if a tutor or parent is already setting the direction.',
      },
      {
        question: 'How do I choose without wasting money?',
        answer:
          'Establish your child’s baseline and biggest weakness first, then judge each platform against that specific need rather than against brand recognition or headline question counts.',
      },
    ],
    primaryCtaLabel: 'Start with a free diagnostic',
    secondaryCta: {
      label: 'Create an account',
      href: '/signup',
    },
  },
  schoolGuide({
    slug: 'queen-elizabeths-school-barnet-11-plus-guide',
    title: "Queen Elizabeth's School Barnet (QE Boys) 11+ Guide | Ace 11+",
    description:
      "A practical guide to Queen Elizabeth's School Barnet (QE Boys) 11+: the two-paper GL Assessment format, why the published qualifying score is not the real bar, and how to prepare sensibly.",
    h1: "Queen Elizabeth's School Barnet (QE Boys) 11+ guide",
    focus:
      "QE Barnet's entrance test is a single-stage exam: two GL Assessment papers sat on the same day with a break in between, and nothing else. Paper One is English, with a strong focus on inference-based comprehension and careful spelling, punctuation and grammar. Paper Two is Maths, built around curriculum-based problem solving rather than separate reasoning papers. There is no verbal or non-verbal reasoning test at QE Barnet, which surprises some families who assume every grammar school tests all four areas.",
    pressure:
      "The school publishes a qualifying standard in its admissions policy, but that number is only the minimum needed to be considered, not the score needed for a place. QE Barnet is consistently one of the most oversubscribed boys' grammar schools in the country, with thousands of boys competing each year for around 180 Year 7 places, and the standardised score actually required for admission has been considerably higher than the published qualifying standard in recent years. Families who prepare to just clear the published minimum are usually preparing for the wrong target.",
    prepAdvice:
      "Because the whole test is English and Maths with no reasoning paper, preparation should concentrate entirely on those two subjects rather than splitting time across verbal or non-verbal reasoning. Within English, prioritise inference practice and precise SPaG over general reading enjoyment alone; within Maths, prioritise accurate curriculum-based problem solving over reasoning-style puzzle questions, since that is what the paper actually tests.",
    mistakes: [
      'Practising verbal or non-verbal reasoning material that QE Barnet does not test at all',
      'Treating the published qualifying standard as the real target, rather than a minimum floor',
      'Under-preparing spelling, punctuation and grammar because comprehension feels like the "main" part of English',
      'Leaving inference practice until late, when it is a significant part of how Paper One discriminates between candidates',
    ],
    nextSteps: [
      'Use a diagnostic that covers English and Maths in depth, since those two subjects decide the whole result',
      'Track SPaG accuracy specifically, not just overall English comprehension score',
      'Treat any published qualifying-standard figure as a floor, and prepare for a meaningfully higher standard',
    ],
    relatedSlugs: [
      'gl-assessment-11-plus-guide',
      'henrietta-barnett-school-11-plus-guide',
      '11-plus-comprehension-guide',
      '11-plus-pass-mark-guide',
    ],
    faqs: [
      {
        question: 'Does QE Barnet test verbal or non-verbal reasoning?',
        answer:
          'No. The entrance test is only two GL Assessment papers — English and Maths — sat on the same day. There is no separate verbal or non-verbal reasoning paper.',
      },
      {
        question: 'What score do you need to get into QE Barnet?',
        answer:
          "The school's admissions policy states a qualifying standard, but that is only the minimum needed to be considered. Because thousands of boys apply for around 180 places, the standardised score actually required for a place has been notably higher than the published qualifying figure in recent years. Always check the current year's admissions guidance on the school's own website for the latest position.",
      },
    ],
  }),
  schoolGuide({
    slug: 'st-olaves-grammar-school-11-plus-guide',
    title: "St Olave's Grammar School 11+ Guide | Ace 11+",
    description:
      "A clear guide to St Olave's Grammar School 11+ admissions: the two-stage SET and Stage 2 process, how many boys progress at each stage, and how to prepare for both.",
    h1: "St Olave's Grammar School 11+ guide",
    focus:
      "St Olave's uses a two-stage process rather than a single exam day. Stage 1 is a Selective Eligibility Test (SET): a one-hour, roughly 60-question multiple-choice paper split across four sections — English, Maths, Verbal Reasoning and Non-Verbal Reasoning. Only the highest-scoring boys from the SET are invited back for Stage 2, which consists of two further one-hour papers on the same day (English, covering reading and writing, and Maths), with a short break between them. Final places are decided by standardising and combining the SET and Stage 2 marks together.",
    pressure:
      "St Olave's has no designated or catchment area, so any boy who meets the qualifying standard can apply regardless of where the family lives. That widens the applicant pool considerably compared with schools that prioritise local postcodes, and recent years have seen well over a thousand applicants competing for a much smaller number of final places, making both stages genuinely competitive rather than a formality before Stage 2.",
    prepAdvice:
      "Because Stage 1 tests all four areas but Stage 2 drops reasoning in favour of deeper English and Maths, the sensible sequence is to prepare broadly across all four areas first so the SET is not a bottleneck, then narrow the focus onto extended English (reading and writing) and Maths once through to Stage 2. Boys who only prepare for Stage 2-style content risk being filtered out at Stage 1 before that preparation is ever used.",
    mistakes: [
      'Skipping verbal or non-verbal reasoning practice because Stage 2 does not test it — Stage 1 still does',
      'Assuming Stage 2 is "more of the same" multiple-choice practice, when it moves to reading and writing plus a full maths paper',
      'Underestimating the applicant pool because there is no catchment area to naturally limit numbers',
      'Leaving writing practice until very late, since Stage 2 English specifically assesses writing, not just comprehension',
    ],
    nextSteps: [
      'Use a mixed diagnostic across English, Maths, Verbal Reasoning and Non-Verbal Reasoning to prepare for Stage 1 first',
      'Once Stage 1 style questions feel manageable, shift practice toward extended writing and full maths working for Stage 2',
      'Keep timing practice realistic to the one-hour-per-paper format used at both stages',
    ],
    relatedSlugs: [
      'henrietta-barnett-school-11-plus-guide',
      '11-plus-creative-writing-guide',
      '11-plus-verbal-reasoning-guide',
      '11-plus-comprehension-guide',
    ],
    faqs: [
      {
        question: "How many boys make it through St Olave's Stage 1 to Stage 2?",
        answer:
          "Only the highest-scoring boys from the SET are invited to Stage 2; the rest of the applicant pool is filtered out at that point. Final Year 7 places are awarded after Stage 2 marks are standardised and combined with the SET result, so both stages matter.",
      },
      {
        question: "Is there a catchment area for St Olave's?",
        answer:
          "No. St Olave's has no designated area, so boys can apply regardless of where they live, provided they meet the qualifying standard. This means the applicant pool is not limited by postcode the way it is at some other grammar schools.",
      },
    ],
  }),
  {
    slug: 'what-is-the-11-plus-guide',
    title: 'What Is the 11+? A Complete Guide for Parents | Ace 11+',
    description:
      'A clear explanation of what the 11+ is, the four subjects it can cover, who sits it and why, and how the different boards and school-specific tests relate to each other.',
    h1: 'What is the 11+?',
    subtitle:
      'The foundational explainer for parents just starting out, covering the subjects, the boards, and how the whole process fits together.',
    category: 'exam-boards-and-formats',
    disclaimer: GUIDE_DISCLAIMER,
    intro: [
      'The 11+ is a selective assessment sat by children in the final year of primary school (Year 6, usually aged 10–11) to determine entry into grammar schools and some independent schools. It exists because those schools have more applicants than places, so the test is used to rank and select candidates rather than to check whether a child has met a basic standard.',
      'For families new to the process, the confusing part is usually not the exam itself but the sheer number of different versions of it. There is no single "the 11+" — the subjects tested, the exam board used, and whether a school runs one stage or two all vary by area and by school. This guide is the starting point for making sense of that variety before diving into the detail.',
    ],
    sections: [
      {
        title: 'The four subjects it can cover',
        paragraphs: [
          'Most 11+ tests draw from up to four subjects, though not every school or area uses all four. English and Maths are built on the Key Stage 2 curriculum, so they overlap with normal schoolwork. Verbal Reasoning and Non-Verbal Reasoning are not taught as part of the national curriculum, which is why they usually need dedicated practice rather than just "more schoolwork".',
        ],
        bullets: [
          'English: comprehension, vocabulary, grammar, punctuation and spelling, sometimes with a writing task',
          'Maths: KS2 curriculum content with an emphasis on problem-solving and mental arithmetic',
          'Verbal Reasoning: word-based logic and pattern questions, not covered in normal school lessons',
          'Non-Verbal Reasoning: shape and pattern-based visual reasoning, also outside the school curriculum',
        ],
        callout:
          'Some schools, such as Queen Elizabeth\'s School Barnet, test only English and Maths with no reasoning papers at all. Always check what your specific target school actually tests.',
      },
      {
        title: 'Who sits the 11+, and why it varies so much by area',
        paragraphs: [
          'In fully selective areas — counties such as Kent, Buckinghamshire and Lincolnshire, and cities including Birmingham — most or all state secondary schools are grammar schools, so a large share of the local Year 6 cohort sits the test as standard practice. In partially selective areas, such as much of London, only specific grammar schools are selective, so families choose to enter individual schools or consortium tests rather than sitting one area-wide exam.',
          'Independent schools add a further layer: many run their own entrance exams that resemble the 11+ in structure, sometimes alongside interviews, but are set and marked entirely by the individual school rather than a shared regional board.',
        ],
      },
      {
        title: 'Exam boards and school-specific tests',
        paragraphs: [
          'Where a shared test is used, it is normally set by an external exam board or provider, which standardises papers and scoring across many schools. GL Assessment is the most widely used, but several areas and consortia use their own systems, and some schools run entirely bespoke tests. This is exactly why "the 11+" cannot be prepared for as one fixed format — the right preparation depends on knowing which version your target schools actually use.',
        ],
        bullets: [
          'GL Assessment: used widely across many grammar school areas',
          'CSSE: the Essex-area consortium test, with its own distinct paper structure',
          'Sutton SET and similar consortium tests: a shared first stage feeding into school-specific later stages',
          'Bespoke, school-set tests: used by some superselective and independent schools instead of a shared board',
        ],
      },
      {
        title: 'One stage or two',
        paragraphs: [
          'Some schools make their decision from a single exam day. Others use a two-stage process: an initial eligibility test that most local candidates sit, followed by a second-stage test only for those who progress, sometimes run directly by the individual school. Two-stage processes usually mean the real competition happens at the second stage, even though the first stage understandably feels high-pressure at the time.',
        ],
      },
      {
        title: 'Suggested next steps',
        paragraphs: [
          'Once you understand the shape of the process, the next useful steps are finding out exactly what your target schools test, checking whether your child is genuinely ready to start, and understanding how the scoring actually works so a practice score means something concrete.',
        ],
      },
    ],
    relatedSlugs: [
      'is-my-child-ready-for-11-plus',
      'when-to-start-11-plus-preparation',
      '11-plus-pass-mark-guide',
      'gl-assessment-11-plus-guide',
    ],
    faqs: [
      {
        question: 'Is the 11+ the same everywhere in England?',
        answer:
          'No. Fully selective areas use the 11+ for most state secondary admissions, while other areas only use it for specific grammar schools. The subjects tested, the exam board, and the number of stages all vary by area and by school.',
      },
      {
        question: 'What age do children sit the 11+?',
        answer:
          'Most children sit the 11+ in Year 6, usually at age 10 turning 11, with tests typically held in September of that school year for entry the following September.',
      },
      {
        question: 'Do all grammar schools test the same four subjects?',
        answer:
          'No. Some schools test all four (English, Maths, Verbal Reasoning and Non-Verbal Reasoning), while others, such as Queen Elizabeth\'s School Barnet, test only English and Maths. Always check the specific requirements for each school you are considering.',
      },
    ],
    primaryCtaLabel: 'Take the free diagnostic',
    secondaryCta: {
      label: 'Create an account',
      href: '/signup',
    },
  },
  skillGuide({
    slug: '11-plus-creative-writing-guide',
    title: '11+ Creative Writing Guide | Ace 11+',
    description:
      'A practical 11+ creative writing guide covering which schools actually test it, what examiners look for, and how to prepare without wasting time on the wrong format.',
    h1: '11+ creative writing guide',
    whatItMeans:
      'Creative writing is not part of every 11+ test — most of the core boards used for general grammar-school selection, including GL Assessment and similar consortium-style tests, do not include it. But it is a genuine component of several specific tests: the Essex CSSE exam includes a dedicated Continuous Writing section worth roughly a quarter of the English paper, several school-specific Stage 2 tests include a writing element alongside comprehension, and many independent school entrance exams weight writing heavily. The first job is finding out whether your target schools test it at all, rather than assuming either way.',
    prepBullets: [
      'Check your specific target schools\' formats before investing time — some, like CSSE, give only a short, tightly timed slot (as little as ten minutes per prompt) rather than a long story',
      'Teach a simple, repeatable structure: a clear opening, a developed middle and a satisfying ending, rather than relying on inspiration on the day',
      'Practise both narrative prompts and "writing for a purpose" prompts, since some exams (again, CSSE is a clear example) test both in the same paper',
      'Build ambitious but controlled vocabulary through wide reading, so better word choices appear naturally under time pressure rather than being forced in',
    ],
    mistakes: [
      'Writing a long, sprawling story when the format only allows a handful of tightly timed sentences',
      'Treating spelling, punctuation and grammar as secondary to "creativity", when technical accuracy is usually marked separately and substantially',
      'Preparing generic creative writing without checking whether the target school tests it, or in what format',
      'Using the same style for grammar-school and independent-school prompts — grammar-school markers typically reward precision, structure and staying on-task, while independent schools reward literary flair and originality more generously',
    ],
    relatedSlugs: [
      'csse-11-plus-guide',
      'st-olaves-grammar-school-11-plus-guide',
      '11-plus-comprehension-guide',
      '11-plus-vocabulary-guide',
    ],
    faqs: [
      {
        question: 'Does every 11+ exam include creative writing?',
        answer:
          'No. Most core boards used for general grammar-school entry do not include a creative writing task, but several school-specific and consortium tests do — the Essex CSSE exam being a clear example, with a dedicated Continuous Writing section. Always check what your target schools actually test.',
      },
      {
        question: 'How is 11+ creative writing marked differently at grammar and independent schools?',
        answer:
          'Grammar school markers generally reward technical precision, clear structure and staying closely on-task. Independent schools tend to expect more mature vocabulary and reward originality and literary flair more generously, often from more open-ended prompts.',
      },
    ],
  }),
  schoolGuide({
    slug: 'wilsons-wallington-sutton-grammar-11-plus-guide',
    title: "Wilson's, Wallington County Grammar & Sutton Grammar 11+ Guide | Ace 11+",
    description:
      "A parent guide to the shared Stage 2 process for Wilson's School, Wallington County Grammar and Sutton Grammar School, including how it differs from the Sutton SET and what each school adds on top.",
    h1: "Wilson's, Wallington County Grammar & Sutton Grammar 11+ guide",
    focus:
      "These three boys' schools sit within the wider Sutton consortium and share the same Stage 1 Selective Eligibility Test (SET) used across the group, typically with only around the top quarter to third of candidates progressing beyond it. Where they differ from some other Sutton schools is Stage 2: Wilson's, Wallington County Grammar and Sutton Grammar School share a common second-stage test that is written rather than multiple-choice, covering a maths paper and an English writing task, each around 45 minutes to an hour. Each school then sets its own threshold on top of that shared test, based on its own applicant numbers and places available.",
    pressure:
      "The shift from Stage 1 to Stage 2 catches some families out, because the SET is entirely multiple-choice while Stage 2 for this trio is full written response — a genuinely different skill. Wilson's adds a further layer on top: an additional Aptitude Test Day for boys who have been shortlisted after the SET and Stage 2, which is unique to Wilson's among the three. Wilson's also reserves a small number of places for boys resident in specific Sutton postcodes, with ties broken first by Sutton residence and then by distance, while Wallington County Grammar does not use a catchment area at all.",
    prepAdvice:
      "Treat the two stages as genuinely different tasks rather than more of the same. For Stage 1, standard mixed SET-style multiple-choice practice across English, Maths, Verbal Reasoning and Non-Verbal Reasoning is right. Once through to Stage 2, practice should pivot toward full written maths workings (not just picking an option) and a timed writing task, since neither of those skills is built by more multiple-choice drilling.",
    mistakes: [
      'Continuing to drill multiple-choice questions for Stage 2, when it is a written maths and writing test',
      'Not practising a timed, planned piece of writing under exam conditions before Stage 2',
      'Applying to Wilson\'s without separately preparing for its additional Aptitude Test Day',
      'Assuming a strong SET score guarantees a place, when each school still applies its own Stage 2 threshold',
    ],
    nextSteps: [
      'Prepare broadly for the Sutton SET first, since it is the shared gateway for all three schools',
      'Once comfortable with SET-style questions, add regular timed writing practice and full-working maths questions ahead of Stage 2',
      'If applying to Wilson\'s specifically, check its Aptitude Test Day format separately rather than assuming it mirrors Stage 2',
    ],
    relatedSlugs: [
      'sutton-set-11-plus-guide',
      '11-plus-verbal-reasoning-guide',
      '11-plus-maths-timing-guide',
      '11-plus-comprehension-guide',
    ],
    faqs: [
      {
        question: 'Is Stage 2 for Wilson\'s, Wallington and Sutton Grammar multiple-choice like the SET?',
        answer:
          'No. Stage 1 (the SET) is multiple-choice, but the shared Stage 2 for these three schools is written: a maths paper requiring full working and an English writing task, each roughly 45 minutes to an hour.',
      },
      {
        question: 'Does Wilson\'s School have any extra requirements beyond Stage 2?',
        answer:
          'Yes. Wilson\'s holds an additional Aptitude Test Day for boys shortlisted after the SET and Stage 2, which is unique to Wilson\'s among this group of schools. It also reserves a small number of places for boys living in specific Sutton postcodes.',
      },
    ],
  }),
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

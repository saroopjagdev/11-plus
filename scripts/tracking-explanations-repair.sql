begin;

-- Remove clearly duplicated diagnostic saves while keeping the newest copy.
with duplicate_diagnostics as (
  select
    id,
    row_number() over (
      partition by child_id, score, coalesce(ai_summary, ''), topic_breakdown::text
      order by created_at desc, id desc
    ) as duplicate_rank
  from public.diagnostic_results
)
delete from public.diagnostic_results
where id in (
  select id
  from duplicate_diagnostics
  where duplicate_rank > 1
);

-- Normalize existing topic_mastery subject labels to the canonical taxonomy.
update public.topic_mastery
set subject = case
  when lower(trim(topic)) in ('synonyms', 'antonyms', 'coding', 'number series', 'word completion', 'analogies')
    then 'Verbal Reasoning'
  when lower(trim(topic)) in ('vocabulary', 'grammar', 'spelling', 'punctuation', 'comprehension')
    then 'English'
  when lower(trim(topic)) in (
    'arithmetic',
    'fractions',
    'decimals',
    'percentages',
    'ratio & proportion',
    'algebra',
    'geometry',
    'data interpretation',
    'word problems',
    'time'
  )
    then 'Maths'
  else subject
end
where topic is not null;

-- Rebuild topic_mastery from historical attempts using canonical question taxonomy.
with normalized_attempt_rows as (
  select
    qa.child_id,
    case
      when lower(trim(q.topic)) in ('synonyms', 'antonyms', 'coding', 'number series', 'word completion', 'analogies')
        then 'Verbal Reasoning'
      when lower(trim(q.topic)) in ('vocabulary', 'grammar', 'spelling', 'punctuation', 'comprehension')
        then 'English'
      when lower(trim(q.topic)) in (
        'arithmetic',
        'fractions',
        'decimals',
        'percentages',
        'ratio & proportion',
        'algebra',
        'geometry',
        'data interpretation',
        'word problems',
        'time'
      )
        then 'Maths'
      else q.subject
    end as subject,
    trim(q.topic) as topic,
    qa.is_correct,
    coalesce(s.completed_at, qa.created_at) as activity_at
  from public.question_attempts qa
  join public.questions q
    on q.id = qa.question_id
  left join public.sessions s
    on s.id = qa.session_id
),
canonical_attempts as (
  select
    child_id,
    subject,
    topic,
    count(*) as questions_answered,
    sum(case when is_correct then 1 else 0 end) as correct_answers,
    round(
      (
        sum(case when is_correct then 1 else 0 end)::numeric
        / nullif(count(*), 0)
      ) * 100
    )::int as accuracy,
    max(activity_at) as last_updated
  from normalized_attempt_rows
  group by child_id, subject, topic
)
insert into public.topic_mastery (
  child_id,
  subject,
  topic,
  accuracy,
  questions_answered,
  has_ever_mastered,
  last_updated
)
select
  child_id,
  subject,
  topic,
  accuracy,
  questions_answered,
  accuracy >= 80 and questions_answered >= 20,
  last_updated
from canonical_attempts
on conflict (child_id, topic)
do update set
  subject = excluded.subject,
  accuracy = excluded.accuracy,
  questions_answered = excluded.questions_answered,
  has_ever_mastered = public.topic_mastery.has_ever_mastered or excluded.has_ever_mastered,
  last_updated = greatest(public.topic_mastery.last_updated, excluded.last_updated);

-- Enforce the intended explanation cache model: one canonical explanation per question.
create unique index if not exists explanations_question_id_uidx
  on public.explanations (question_id);

commit;

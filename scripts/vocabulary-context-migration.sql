-- Adds sentence context to Vocabulary questions.
--
-- Root cause: Vocabulary questions test pure definitional recall ("What does
-- X mean?") in total isolation, unlike real GL Assessment vocabulary items
-- which show the word in a sentence and test contextual understanding. There
-- is no field anywhere in the schema to store an example sentence.
--
-- Fix: add a nullable column so generators can produce sentence-context
-- question stems and explanations that quote the sentence. Nullable and
-- additive — every other topic's rows are unaffected.
alter table public.questions
  add column if not exists example_sentence text;

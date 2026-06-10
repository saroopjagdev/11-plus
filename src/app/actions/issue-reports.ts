'use server'

import { createClient } from '@/lib/supabase/server'
import { IssueReportCategory, IssueReportContext, ISSUE_REPORT_CATEGORIES } from '@/lib/issue-reporting'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

interface SubmitIssueReportInput {
  category: string
  message: string
  reporterEmail?: string | null
  childId?: string | null
  sessionId?: string | null
  questionId?: string | null
  diagnosticId?: string | null
  pagePath?: string | null
  context?: IssueReportContext
}

interface SubmitIssueReportResult {
  success: boolean
  error?: string
}

function isValidCategory(category: string): category is IssueReportCategory {
  return ISSUE_REPORT_CATEGORIES.includes(category as IssueReportCategory)
}

export async function submitIssueReport(input: SubmitIssueReportInput): Promise<SubmitIssueReportResult> {
  const supabase = await createClient()
  const admin = createAdminClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const message = input.message.trim()
  const reporterEmail = input.reporterEmail?.trim().toLowerCase() || null

  if (!isValidCategory(input.category)) {
    return { success: false, error: 'Please choose a report category.' }
  }

  if (!message) {
    return { success: false, error: 'Please describe the issue.' }
  }

  if (!user && !reporterEmail) {
    return { success: false, error: 'Email is required so we can follow up.' }
  }

  let accountEmail: string | null = null

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .maybeSingle()

    accountEmail = profile?.email || user.email || null
  }

  const contextJson: IssueReportContext = {
    ...(input.context || {}),
    diagnosticId: input.diagnosticId || input.context?.diagnosticId || undefined,
    pagePath: input.pagePath || input.context?.pagePath || undefined,
    browserTimestamp: input.context?.browserTimestamp || new Date().toISOString(),
    isPro: input.context?.isPro ?? undefined,
  }

  const { error } = await admin.from('issue_reports').insert({
    status: 'new',
    category: input.category,
    message,
    reporter_email: user ? accountEmail : reporterEmail,
    user_id: user?.id || null,
    child_id: input.childId || null,
    session_id: input.sessionId || null,
    question_id: input.questionId || null,
    page_path: input.pagePath || null,
    context_json: contextJson,
  })

  if (error) {
    console.error('Issue report submission failed:', error)
    return { success: false, error: 'We could not submit your report right now. Please try again.' }
  }

  return { success: true }
}

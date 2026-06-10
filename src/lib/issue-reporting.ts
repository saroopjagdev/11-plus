export const ISSUE_REPORT_CATEGORIES = [
  'Tracking looks wrong',
  'Explanation not helpful',
  'Something failed',
  'Diagnostic result issue',
  'Other',
] as const

export type IssueReportCategory = (typeof ISSUE_REPORT_CATEGORIES)[number]

export interface IssueReportContext {
  pageLabel?: string
  pagePath?: string
  questionId?: string | null
  sessionId?: string | null
  childId?: string | null
  diagnosticId?: string | null
  learnerAnswer?: string | null
  isPro?: boolean
  browserTimestamp?: string
  [key: string]: unknown
}

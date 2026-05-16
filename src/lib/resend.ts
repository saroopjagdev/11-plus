import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmail({
  to,
  subject,
  html,
  text
}: {
  to: string | string[]
  subject: string
  html: string
  text?: string
}) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY is not set. Email not sent.')
    return { success: false, error: 'Missing API Key' }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'Ace 11+ <support@ace11plus.org>',
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, '') // Basic fallback text
    })

    if (error) {
      console.error('Resend Error:', error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Email Send Exception:', error)
    return { success: false, error }
  }
}

/**
 * OAuth callback for the TikTok Content Posting API sandbox demo, recorded
 * for TikTok's app review. This is a one-off proof-of-integration page, not
 * ongoing product infrastructure -- delete it once the audit is complete and
 * the real cron-driven posting script (mirroring scripts/social_instagram.py)
 * is built with proper credential storage.
 *
 * TikTok's authorization redirect_uri must match exactly what's registered
 * in the developer app -- this is registered as
 * https://www.ace11plus.org/tiktok-callback, so this route's path is fixed.
 *
 * Runs the whole flow server-side in one request (token exchange -> video
 * upload -> publish -> status poll) rather than a client-polled multi-step
 * UI: the access token never needs to leave the server this way, which
 * matters more here than a live-updating progress bar would for a one-time
 * demo recording. The full step-by-step result renders once everything
 * finishes (or fails) -- expect roughly 15-30s of loading before that,
 * which is normal to show in a recording (that's genuinely how long a real
 * upload+publish takes).
 *
 * FILE_UPLOAD, not PULL_FROM_URL: PULL_FROM_URL requires TikTok to verify
 * ownership of the video's *own* domain (same tiktok-developers-site-
 * verification mechanism used for ace11plus.org itself), and the sample
 * video lives on R2's shared cloudflarestorage.com domain, which can't be
 * verified that way. FILE_UPLOAD sidesteps this entirely -- this server
 * downloads the video from R2 itself and re-uploads the bytes directly to
 * TikTok, so no external domain is ever involved from TikTok's side.
 */

export const dynamic = 'force-dynamic'

// Must match the `state` param in the authorization URL exactly -- basic
// CSRF protection on an endpoint that would otherwise perform a real
// TikTok token exchange and post for anyone who hits it with a valid code.
const EXPECTED_STATE = 'ace11plus-tiktok-demo'

const TOKEN_ENDPOINT = 'https://open.tiktokapis.com/v2/oauth/token/'
const INIT_ENDPOINT = 'https://open.tiktokapis.com/v2/post/publish/video/init/'
const STATUS_ENDPOINT = 'https://open.tiktokapis.com/v2/post/publish/status/fetch/'
const REDIRECT_URI = 'https://www.ace11plus.org/tiktok-callback'

const STATUS_POLL_ATTEMPTS = 10
const STATUS_POLL_DELAY_MS = 3000

interface StepResult {
  label: string
  ok: boolean
  detail: string
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function exchangeCodeForToken(code: string): Promise<{ accessToken: string } | { error: string }> {
  const clientKey = process.env.TIKTOK_CLIENT_KEY
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET
  if (!clientKey || !clientSecret) {
    return { error: 'TIKTOK_CLIENT_KEY / TIKTOK_CLIENT_SECRET are not set in this environment.' }
  }

  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: REDIRECT_URI,
    }),
    cache: 'no-store',
  })

  const data = await response.json()
  if (!response.ok || !data.access_token) {
    return { error: `Token exchange failed: ${JSON.stringify(data)}` }
  }
  return { accessToken: data.access_token as string }
}

async function initFileUpload(
  accessToken: string,
  videoBuffer: Buffer
): Promise<{ publishId: string; uploadUrl: string } | { error: string }> {
  const response = await fetch(INIT_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8',
    },
    body: JSON.stringify({
      post_info: {
        title: 'Ace 11+ sandbox test post (Content Posting API demo)',
        // Required for an unaudited API client -- TikTok restricts every
        // unaudited post to SELF_ONLY visibility regardless of what's
        // requested; setting it explicitly here rather than relying on
        // that server-side restriction to silently downgrade a different
        // value.
        privacy_level: 'SELF_ONLY',
        disable_duet: true,
        disable_stitch: true,
        disable_comment: true,
      },
      source_info: {
        source: 'FILE_UPLOAD',
        video_size: videoBuffer.length,
        chunk_size: videoBuffer.length,
        total_chunk_count: 1,
      },
    }),
    cache: 'no-store',
  })

  const data = await response.json()
  if (!response.ok || !data.data?.publish_id || !data.data?.upload_url) {
    return { error: `Init failed: ${JSON.stringify(data)}` }
  }
  return { publishId: data.data.publish_id as string, uploadUrl: data.data.upload_url as string }
}

async function uploadVideoBytes(uploadUrl: string, videoBuffer: Buffer): Promise<{ error: string } | null> {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'video/mp4',
      'Content-Length': String(videoBuffer.length),
      'Content-Range': `bytes 0-${videoBuffer.length - 1}/${videoBuffer.length}`,
    },
    // fetch's BodyInit type doesn't accept Node's Buffer directly (despite
    // Buffer being a Uint8Array at runtime) -- an explicit Uint8Array view
    // satisfies it without copying the underlying bytes.
    body: new Uint8Array(videoBuffer),
  })

  if (!response.ok) {
    const text = await response.text()
    return { error: `Upload PUT failed (${response.status}): ${text}` }
  }
  return null
}

async function pollPublishStatus(accessToken: string, publishId: string): Promise<StepResult> {
  for (let attempt = 1; attempt <= STATUS_POLL_ATTEMPTS; attempt++) {
    const response = await fetch(STATUS_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify({ publish_id: publishId }),
      cache: 'no-store',
    })
    const data = await response.json()
    const status = data.data?.status

    if (status === 'PUBLISH_COMPLETE') {
      return { label: 'Publish complete', ok: true, detail: `publish_id=${publishId}, status=${status} (attempt ${attempt}/${STATUS_POLL_ATTEMPTS})` }
    }
    if (status === 'FAILED') {
      return { label: 'Publish failed', ok: false, detail: `publish_id=${publishId}, fail_reason=${data.data?.fail_reason ?? 'unknown'}` }
    }
    if (attempt < STATUS_POLL_ATTEMPTS) {
      await sleep(STATUS_POLL_DELAY_MS)
    } else {
      return {
        label: 'Publish status: still processing',
        ok: false,
        detail: `publish_id=${publishId}, last status=${status ?? 'unknown'} after ${STATUS_POLL_ATTEMPTS} polls -- this is not necessarily a failure, TikTok may still be processing`,
      }
    }
  }
  return { label: 'Publish status: unknown', ok: false, detail: 'Polling loop exited unexpectedly.' }
}

async function runDemoFlow(code: string): Promise<StepResult[]> {
  const steps: StepResult[] = []

  const tokenResult = await exchangeCodeForToken(code)
  if ('error' in tokenResult) {
    steps.push({ label: 'Authorization', ok: false, detail: tokenResult.error })
    return steps
  }
  steps.push({ label: 'Authorization successful', ok: true, detail: 'Received a valid TikTok access token.' })

  const videoUrl = process.env.TIKTOK_DEMO_VIDEO_URL
  if (!videoUrl) {
    steps.push({ label: 'Video fetch', ok: false, detail: 'TIKTOK_DEMO_VIDEO_URL is not set in this environment.' })
    return steps
  }

  let videoBuffer: Buffer
  try {
    const videoResponse = await fetch(videoUrl, { cache: 'no-store' })
    if (!videoResponse.ok) {
      throw new Error(`R2 fetch returned ${videoResponse.status}`)
    }
    videoBuffer = Buffer.from(await videoResponse.arrayBuffer())
  } catch (err) {
    steps.push({ label: 'Video fetch failed', ok: false, detail: err instanceof Error ? err.message : String(err) })
    return steps
  }
  steps.push({ label: 'Sample video fetched', ok: true, detail: `${(videoBuffer.length / 1024 / 1024).toFixed(2)} MB from R2` })

  const initResult = await initFileUpload(tokenResult.accessToken, videoBuffer)
  if ('error' in initResult) {
    steps.push({ label: 'Upload init failed', ok: false, detail: initResult.error })
    return steps
  }
  steps.push({ label: 'Upload initialized', ok: true, detail: `publish_id=${initResult.publishId}` })

  const uploadError = await uploadVideoBytes(initResult.uploadUrl, videoBuffer)
  if (uploadError) {
    steps.push({ label: 'Upload failed', ok: false, detail: uploadError.error })
    return steps
  }
  steps.push({ label: 'Upload successful', ok: true, detail: `${videoBuffer.length} bytes sent to TikTok` })

  const publishStep = await pollPublishStatus(tokenResult.accessToken, initResult.publishId)
  steps.push(publishStep)

  return steps
}

export default async function TikTokCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; state?: string; error?: string; error_description?: string }>
}) {
  const { code, state, error, error_description: errorDescription } = await searchParams

  let steps: StepResult[] = []

  if (error) {
    steps = [{ label: 'TikTok returned an error', ok: false, detail: `${error}: ${errorDescription ?? '(no description)'}` }]
  } else if (!code) {
    steps = [{ label: 'No authorization code received', ok: false, detail: 'This page is only meaningful as a TikTok OAuth redirect target.' }]
  } else if (state !== EXPECTED_STATE) {
    steps = [{ label: 'State mismatch', ok: false, detail: `Expected state=${EXPECTED_STATE}, got ${state ?? '(none)'}. Refusing to proceed.` }]
  } else {
    steps = await runDemoFlow(code)
  }

  const allOk = steps.length > 0 && steps.every((s) => s.ok)

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#e2e8f0', padding: '48px 24px', fontFamily: 'ui-monospace, monospace' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 8, color: '#f8fafc' }}>
          Ace 11+ &mdash; TikTok Content Posting API Demo
        </h1>
        <p style={{ color: '#94a3b8', marginBottom: 32, fontSize: 14 }}>
          Sandbox integration test: OAuth authorization &rarr; video upload &rarr; publish, using the Content Posting API.
        </p>

        {steps.map((step, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              padding: '16px 20px',
              marginBottom: 12,
              borderRadius: 16,
              background: step.ok ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)',
              border: `1px solid ${step.ok ? 'rgba(16,185,129,0.4)' : 'rgba(244,63,94,0.4)'}`,
            }}
          >
            <span style={{ fontSize: 20, lineHeight: '24px' }}>{step.ok ? '✅' : '❌'}</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: step.ok ? '#6ee7b7' : '#fda4af' }}>
                Step {i + 1}: {step.label}
              </div>
              <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4, wordBreak: 'break-all' }}>{step.detail}</div>
            </div>
          </div>
        ))}

        {steps.length > 0 && (
          <div style={{ marginTop: 32, fontSize: 18, fontWeight: 900, color: allOk ? '#6ee7b7' : '#fda4af' }}>
            {allOk ? 'All steps completed successfully.' : 'Flow stopped before completing all steps.'}
          </div>
        )}
      </div>
    </div>
  )
}

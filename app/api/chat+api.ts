import { createVertex } from '@ai-sdk/google-vertex'
import { convertToModelMessages, streamText, UIMessage } from 'ai'

interface ChatRequestBody {
  messages: UIMessage[]
}

export async function POST(request: Request): Promise<Response> {
  const project = process.env.GOOGLE_VERTEX_PROJECT
  const location = process.env.GOOGLE_VERTEX_LOCATION
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL
  const privateKey = process.env.GOOGLE_PRIVATE_KEY

  if (!project || !location || !clientEmail || !privateKey) {
    console.error('[API] Missing required environment variables')
    return new Response('Server configuration error', { status: 500 })
  }

  try {
    const { messages } = (await request.json()) as ChatRequestBody
    console.log('[API] hit — messages:', messages.length)

    const vertex = createVertex({
      project,
      location,
      googleAuthOptions: {
        credentials: {
          client_email: clientEmail,
          private_key: privateKey,
        },
      },
    })

    const result = streamText({
      model: vertex('gemini-2.0-flash'),
      messages: await convertToModelMessages(messages),
      onError: ({ error }) => {
        console.error('[API] streamText error:', error)
      },
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error('[API] caught error:', error)
    return new Response(String(error), { status: 500 })
  }
}

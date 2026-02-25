import { createVertex } from '@ai-sdk/google-vertex'
import { convertToModelMessages, streamText, UIMessage } from 'ai'

interface ChatRequestBody {
  messages: UIMessage[]
}

export async function POST(request: Request): Promise<Response> {
  try {
    const { messages } = (await request.json()) as ChatRequestBody
    console.log('[API] hit — messages:', messages.length)

    const vertex = createVertex({
      project: process.env.GOOGLE_VERTEX_PROJECT,
      location: process.env.GOOGLE_VERTEX_LOCATION,
      googleAuthOptions: {
        credentials: {
          client_email: process.env.GOOGLE_CLIENT_EMAIL,
          private_key: process.env.GOOGLE_PRIVATE_KEY,
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

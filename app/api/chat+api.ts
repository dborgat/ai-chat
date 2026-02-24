import { createVertex } from '@ai-sdk/google-vertex/edge'
import { streamText } from 'ai'

const vertex = createVertex({
  project: process.env.GOOGLE_VERTEX_PROJECT,
  location: process.env.GOOGLE_VERTEX_LOCATION,
  googleCredentials: {
    clientEmail: process.env.GOOGLE_CLIENT_EMAIL,
    privateKey: process.env.GOOGLE_PRIVATE_KEY,
  },
})

export async function POST(request: Request) {
  const { messages } = await request.json()

  const result = streamText({
    model: vertex('gemini-2.0-flash'),
    messages,
  })

  return result.toUIMessageStreamResponse()
}

import { apiFetch } from './authService'

export interface ConversationResponse {
  id: string
  created_at: string
  greeting: string | null
}

export async function createConversation(
  analiseId?: number,
  clientHour?: number,
): Promise<ConversationResponse> {
  const payload: Record<string, unknown> = {}
  if (analiseId !== undefined) payload.analise_id = analiseId
  if (clientHour !== undefined) payload.client_hour = clientHour
  const res = await apiFetch('/api/v1/chat/conversations/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw { status: res.status }
  return res.json()
}

export async function streamMessage(
  conversationId: string,
  message: string,
  onChunk: (content: string) => void,
  onDone: () => void,
): Promise<void> {
  const res = await apiFetch('/api/v1/chat/stream/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conversation_id: conversationId, message }),
  })

  if (!res.ok) throw { status: res.status }
  if (!res.body) throw { status: 0 }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const payload = line.slice(6).trim()
      if (payload === '[DONE]') {
        onDone()
        return
      }
      try {
        const { content } = JSON.parse(payload)
        if (content) onChunk(content)
      } catch { }
    }
  }
  onDone()
}

export type ProativoMessage = {
  id: string
  role: 'human' | 'ai'
  content: string
  created_at: string
  is_proativa: boolean
  lida_em: string | null
  tipo_alerta: string | null
  solicitacao: number | null
}

export async function getProativoNaoLidas(): Promise<{ nao_lidas: number }> {
  const res = await apiFetch('/api/v1/chat/proativo/nao-lidas/', {
    method: 'GET',
  })
  if (!res.ok) throw { status: res.status }
  return res.json()
}

export async function getProativoConversa(): Promise<{
  conversation_id: string
  messages: ProativoMessage[]
}> {
  const res = await apiFetch('/api/v1/chat/proativo/', { method: 'GET' })
  if (!res.ok) throw { status: res.status }
  return res.json()
}

export async function marcarProativoLidas(): Promise<{ marcadas: number }> {
  const res = await apiFetch('/api/v1/chat/proativo/marcar-lidas/', {
    method: 'POST',
  })
  if (!res.ok) throw { status: res.status }
  return res.json()
}

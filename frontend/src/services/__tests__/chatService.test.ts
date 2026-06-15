import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createConversation } from '../chatService'

vi.mock('../authService', () => ({
  apiFetch: vi.fn(),
}))

import { apiFetch } from '../authService'
const mockApiFetch = vi.mocked(apiFetch)

const makeOkResponse = (body: unknown): Response =>
  ({ ok: true, json: async () => body }) as Response

describe('createConversation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('envia body vazio quando sem analiseId e clientHour', async () => {
    mockApiFetch.mockResolvedValue(
      makeOkResponse({ id: 'uuid-1', created_at: '2026-01-01T00:00:00', greeting: null })
    )
    await createConversation()
    expect(mockApiFetch).toHaveBeenCalledWith(
      '/api/v1/chat/conversations/',
      expect.objectContaining({ body: JSON.stringify({}) })
    )
  })

  it('envia analise_id quando fornecido', async () => {
    mockApiFetch.mockResolvedValue(
      makeOkResponse({ id: 'uuid-2', created_at: '2026-01-01T00:00:00', greeting: null })
    )
    await createConversation(59)
    expect(mockApiFetch).toHaveBeenCalledWith(
      '/api/v1/chat/conversations/',
      expect.objectContaining({ body: JSON.stringify({ analise_id: 59 }) })
    )
  })

  it('envia analise_id e client_hour quando ambos fornecidos', async () => {
    mockApiFetch.mockResolvedValue(
      makeOkResponse({ id: 'uuid-3', created_at: '2026-01-01T00:00:00', greeting: 'Bom-dia!' })
    )
    await createConversation(59, 9)
    expect(mockApiFetch).toHaveBeenCalledWith(
      '/api/v1/chat/conversations/',
      expect.objectContaining({
        body: JSON.stringify({ analise_id: 59, client_hour: 9 }),
      })
    )
  })

  it('retorna greeting da resposta da API', async () => {
    mockApiFetch.mockResolvedValue(
      makeOkResponse({ id: 'uuid-4', created_at: '2026-01-01T00:00:00', greeting: 'Boa tarde, Joao!' })
    )
    const result = await createConversation(59, 14)
    expect(result.greeting).toBe('Boa tarde, Joao!')
  })

  it('retorna greeting null quando API retorna null', async () => {
    mockApiFetch.mockResolvedValue(
      makeOkResponse({ id: 'uuid-5', created_at: '2026-01-01T00:00:00', greeting: null })
    )
    const result = await createConversation()
    expect(result.greeting).toBeNull()
  })

  it('lanca erro com status quando resposta nao ok', async () => {
    mockApiFetch.mockResolvedValue({ ok: false, status: 404 } as Response)
    await expect(createConversation(99999)).rejects.toEqual({ status: 404 })
  })

  it('nao envia client_hour quando apenas analiseId fornecido', async () => {
    mockApiFetch.mockResolvedValue(
      makeOkResponse({ id: 'uuid-6', created_at: '2026-01-01T00:00:00', greeting: null })
    )
    await createConversation(42)
    const body = JSON.parse(
      (mockApiFetch.mock.calls[0][1] as RequestInit).body as string
    )
    expect(body).not.toHaveProperty('client_hour')
    expect(body).toHaveProperty('analise_id', 42)
  })
})

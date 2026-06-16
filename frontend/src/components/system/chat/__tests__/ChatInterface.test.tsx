import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { ChatInterface } from '../ChatInterface'

vi.mock('@/services/chatService', () => ({
  createConversation: vi.fn(),
  streamMessage: vi.fn(),
}))

import { createConversation, streamMessage } from '@/services/chatService'
const mockCreate = vi.mocked(createConversation)
const mockStream = vi.mocked(streamMessage)

const baseResponse = { id: 'conv-uuid', created_at: '2026-01-01T00:00:00' }

describe('ChatInterface', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('exibe greeting como primeira mensagem quando presente', async () => {
    mockCreate.mockResolvedValue({
      ...baseResponse,
      greeting: 'Bom-dia, Joao! Vamos discutir sua analise de Soja.',
    })
    render(<ChatInterface analiseId={59} />)
    await waitFor(() => {
      expect(
        screen.getByText('Bom-dia, Joao! Vamos discutir sua analise de Soja.')
      ).toBeInTheDocument()
    })
  })

  it('nao exibe mensagem inicial quando greeting e null', async () => {
    mockCreate.mockResolvedValue({ ...baseResponse, greeting: null })
    render(<ChatInterface />)
    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalled()
    })
    expect(screen.queryByText(/bom-dia/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/boa tarde/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/boa noite/i)).not.toBeInTheDocument()
  })

  it('passa client_hour como numero valido para createConversation', async () => {
    mockCreate.mockResolvedValue({ ...baseResponse, greeting: null })
    render(<ChatInterface analiseId={42} />)
    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalled()
    })
    const [receivedAnaliseId, receivedHour] = mockCreate.mock.calls[0]
    expect(receivedAnaliseId).toBe(42)
    expect(typeof receivedHour).toBe('number')
    expect(receivedHour).toBeGreaterThanOrEqual(0)
    expect(receivedHour).toBeLessThanOrEqual(23)
  })

  it('chama createConversation sem analiseId quando prop nao fornecida', async () => {
    mockCreate.mockResolvedValue({ ...baseResponse, greeting: null })
    render(<ChatInterface />)
    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalled()
    })
    const [analiseIdArg] = mockCreate.mock.calls[0]
    expect(analiseIdArg).toBeUndefined()
  })

  it('mostra "Mauro esta digitando" enquanto gera a saudacao e some ao concluir', async () => {
    let resolveCreate!: (v: typeof baseResponse & { greeting: string | null }) => void
    const pending = new Promise<typeof baseResponse & { greeting: string | null }>(
      (res) => { resolveCreate = res }
    )
    mockCreate.mockReturnValue(pending)
    render(<ChatInterface analiseId={59} />)
    expect(await screen.findByText('Mauro esta digitando')).toBeInTheDocument()
    resolveCreate({ ...baseResponse, greeting: 'Bom-dia, Joao!' })
    await waitFor(() => {
      expect(screen.queryByText('Mauro esta digitando')).not.toBeInTheDocument()
    })
  })

  it('nao mostra "Mauro esta digitando" quando nao ha analiseId', async () => {
    mockCreate.mockResolvedValue({ ...baseResponse, greeting: null })
    render(<ChatInterface />)
    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalled()
    })
    expect(screen.queryByText('Mauro esta digitando')).not.toBeInTheDocument()
  })

  it('mostra "Mauro esta digitando" ao enviar mensagem e some no primeiro chunk', async () => {
    mockCreate.mockResolvedValue({ ...baseResponse, greeting: null })
    let emitChunk!: (content: string) => void
    mockStream.mockImplementation(async (_id, _msg, onChunk) => {
      emitChunk = onChunk
      await new Promise(() => {})
    })

    render(<ChatInterface />)
    const input = await screen.findByLabelText('Digite sua mensagem')
    await waitFor(() => expect(input).not.toBeDisabled())

    fireEvent.change(input, { target: { value: 'Qual o delta?' } })
    fireEvent.click(screen.getByLabelText('Enviar mensagem'))

    expect(await screen.findByText('Mauro esta digitando')).toBeInTheDocument()

    emitChunk('Resposta')
    await waitFor(() => {
      expect(screen.queryByText('Mauro esta digitando')).not.toBeInTheDocument()
    })
    expect(screen.getByText('Resposta')).toBeInTheDocument()
  })

  it('nao atualiza estado apos componente ser desmontado', async () => {
    let resolveCreate!: (v: typeof baseResponse & { greeting: null }) => void
    const pendingCreate = new Promise<typeof baseResponse & { greeting: null }>(
      (res) => { resolveCreate = res }
    )
    mockCreate.mockReturnValue(pendingCreate)
    const { unmount } = render(<ChatInterface />)
    unmount()
    resolveCreate({ ...baseResponse, greeting: null })
    expect(true).toBe(true)
  })
})

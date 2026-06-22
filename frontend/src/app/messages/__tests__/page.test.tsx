import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import MessagesPage from '../page'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}))
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: true, isLoading: false, logout: vi.fn() }),
}))
vi.mock('@/components/system/layout/TopMenu', () => ({
  TopMenu: () => <nav data-testid="topmenu">menu</nav>,
}))
vi.mock('@/services/chatService', () => ({
  getProativoConversa: vi.fn(),
  marcarProativoLidas: vi.fn(),
  getProativoNaoLidas: vi.fn(),
  getProativoAbertura: vi.fn(),
  streamMessage: vi.fn(),
}))

import {
  getProativoConversa,
  marcarProativoLidas,
  getProativoAbertura,
  streamMessage,
} from '@/services/chatService'

const mockConversa = vi.mocked(getProativoConversa)
const mockAbertura = vi.mocked(getProativoAbertura)
const mockLidas = vi.mocked(marcarProativoLidas)
const mockStream = vi.mocked(streamMessage)

describe('MessagesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
    mockLidas.mockResolvedValue({ marcadas: 0 })
    mockAbertura.mockResolvedValue({ created: false, message: null })
    mockConversa.mockResolvedValue({ conversation_id: 'c1', messages: [] })
  })

  it('renderiza o TopMenu', async () => {
    render(<MessagesPage />)
    expect(await screen.findByTestId('topmenu')).toBeInTheDocument()
  })

  it('dispara getProativoAbertura no mount', async () => {
    render(<MessagesPage />)
    await waitFor(() => expect(mockAbertura).toHaveBeenCalled())
  })

  it('exibe a mensagem de abertura quando carregada na conversa', async () => {
    mockConversa.mockResolvedValue({
      conversation_id: 'c1',
      messages: [
        { id: 'm1', role: 'ai', content: 'Bom-dia, Joao! Nada novo por aqui.', created_at: '', is_proativa: true, lida_em: null, tipo_alerta: 'abertura', solicitacao: null },
      ],
    })
    render(<MessagesPage />)
    expect(await screen.findByText(/Bom-dia, Joao/)).toBeInTheDocument()
  })

  it('inicia o debate ao clicar num card de analise (envia mensagem com o analise_id)', async () => {
    // Primeira chamada emite os cards de selecao; chamadas seguintes apenas finalizam.
    mockStream.mockImplementation(async (_cid, _msg, _onChunk, onDone, opts) => {
      if (opts?.onCards) {
        opts.onCards([
          { id: 7, commodity_nome: 'Soja', tipo_derivativo_nome: 'Put', status: 'pendente' },
        ])
      }
      onDone()
    })

    render(<MessagesPage />)

    // Dispara uma mensagem do usuario para que os cards sejam renderizados.
    const input = await screen.findByPlaceholderText(/Fale com o Mauro/)
    fireEvent.change(input, { target: { value: 'minhas analises de soja' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    const card = await screen.findByText('Soja')
    mockStream.mockClear()
    fireEvent.click(card)

    await waitFor(() => {
      expect(mockStream).toHaveBeenCalled()
      const opts = mockStream.mock.calls[0][4]
      expect(opts?.analiseId).toBe(7)
    })
  })
})

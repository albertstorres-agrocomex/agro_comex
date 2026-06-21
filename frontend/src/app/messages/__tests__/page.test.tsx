import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
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
} from '@/services/chatService'

const mockConversa = vi.mocked(getProativoConversa)
const mockAbertura = vi.mocked(getProativoAbertura)
const mockLidas = vi.mocked(marcarProativoLidas)

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
})

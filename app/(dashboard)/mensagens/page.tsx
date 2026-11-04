'use client'

// app/(dashboard)/mensagens/page.tsx — Chat interno e com clientes
import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import {
  Search,
  Send,
  MessageCircle,
  Plus,
  CheckCheck,
  Clock,
  ArrowLeft,
  AlertCircle,
} from 'lucide-react'
import type { Conversa, Mensagem, Cliente } from '@/lib/types'

// ─── Tipos locais ─────────────────────────────────────────────────────────────

type MsgResumo = {
  id: string
  conteudo: string
  criado_em: string
  lida_por: string[] | null
  autor_id: string
}

type ConversaComExtra = Conversa & {
  mensagens_nao_lidas: number
  ultima_mensagem_texto: string
  ultima_mensagem_em: string | null
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatHora(d: string) {
  const dt = new Date(d)
  const hoje = new Date()
  if (dt.toDateString() === hoje.toDateString()) {
    return dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }
  const ontem = new Date(hoje)
  ontem.setDate(hoje.getDate() - 1)
  if (dt.toDateString() === ontem.toDateString()) return 'Ontem'
  return dt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function inicialNome(nome: string) {
  return nome.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase() || '?'
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ nome, url, size = 36 }: { nome: string; url?: string | null; size?: number }) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={nome}
        className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size }}
      />
    )
  }
  return (
    <div
      className="rounded-full bg-[#FF6A00] text-white flex items-center justify-center font-semibold shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {inicialNome(nome)}
    </div>
  )
}

// ─── Modal nova conversa ──────────────────────────────────────────────────────

function ModalNovaConversa({
  clientes,
  onCriar,
  onFechar,
}: {
  clientes: Cliente[]
  onCriar: (clienteId: string) => Promise<void>
  onFechar: () => void
}) {
  const [clienteId, setClienteId] = useState('')
  const [salvando, setSalvando] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!clienteId) return
    setSalvando(true)
    await onCriar(clienteId)
    setSalvando(false)
  }

  return (
    <div className="mf-overlay" onClick={e => e.target === e.currentTarget && onFechar()}>
      <div className="mf-modal" style={{ maxWidth: 400, padding: '1.5rem' }}>
        <h2 className="text-lg font-bold text-gray-800 mb-4">Nova conversa</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mf-label">Cliente</label>
            <select
              className="mf-input"
              value={clienteId}
              onChange={e => setClienteId(e.target.value)}
              required
            >
              <option value="">Selecione...</option>
              {clientes.map(c => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
            {clientes.length === 0 && (
              <p className="text-xs text-gray-400 mt-1">Nenhum cliente ativo cadastrado.</p>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="mf-btn-secondary" onClick={onFechar}>
              Cancelar
            </button>
            <button type="submit" className="mf-btn-primary" disabled={salvando || !clienteId}>
              {salvando ? 'Criando...' : 'Criar conversa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Item da lista de conversas ───────────────────────────────────────────────

function ItemConversa({
  conversa,
  ativa,
  onClick,
}: {
  conversa: ConversaComExtra
  ativa: boolean
  onClick: () => void
}) {
  const nome = conversa.cliente?.nome ?? conversa.nome ?? 'Conversa'

  return (
    <button
      onClick={onClick}
      className={`w-full text-left flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${
        ativa ? 'bg-[#FF6A00]/10' : 'hover:bg-gray-100'
      }`}
      style={{ border: 'none', cursor: 'pointer', background: ativa ? undefined : 'transparent' }}
    >
      <Avatar nome={nome} size={40} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <span className={`text-sm font-medium truncate ${ativa ? 'text-[#FF6A00]' : 'text-gray-800'}`}>
            {nome}
          </span>
          {conversa.ultima_mensagem_em && (
            <span className="text-xs text-gray-400 shrink-0">
              {formatHora(conversa.ultima_mensagem_em)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-1 mt-0.5">
          <span className="text-xs text-gray-400 truncate">
            {conversa.ultima_mensagem_texto || 'Sem mensagens'}
          </span>
          {conversa.mensagens_nao_lidas > 0 && (
            <span className="shrink-0 w-4 h-4 rounded-full bg-[#FF6A00] text-white text-[10px] font-bold flex items-center justify-center">
              {conversa.mensagens_nao_lidas > 9 ? '9+' : conversa.mensagens_nao_lidas}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

// ─── Bolha de mensagem ────────────────────────────────────────────────────────

function BolhaMensagem({ mensagem, minha }: { mensagem: Mensagem; minha: boolean }) {
  return (
    <div className={`flex items-end gap-2 ${minha ? 'flex-row-reverse' : 'flex-row'}`}>
      {!minha && (
        <Avatar nome={mensagem.autor?.nome ?? '?'} url={mensagem.autor?.avatar_url} size={28} />
      )}
      <div className={`max-w-[70%] ${minha ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        {!minha && mensagem.autor && (
          <span className="text-xs text-gray-400 ml-1">{mensagem.autor.nome}</span>
        )}
        <div
          className={`px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
            minha
              ? 'bg-[#FF6A00] text-white rounded-br-sm'
              : 'bg-white border border-[#E9E9EC] text-gray-800 rounded-bl-sm'
          }`}
        >
          {mensagem.conteudo}
        </div>
        <span className={`text-[10px] text-gray-400 flex items-center gap-1 ${minha ? 'flex-row-reverse' : ''}`}>
          {new Date(mensagem.criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          {minha && <CheckCheck size={10} className="text-gray-300" />}
        </span>
      </div>
    </div>
  )
}

// ─── Painel de chat ───────────────────────────────────────────────────────────

function PainelChat({
  conversa,
  usuarioId,
  onAtualizar,
  onVoltar,
}: {
  conversa: Conversa
  usuarioId: string
  onAtualizar: () => void
  onVoltar: () => void
}) {
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const qtdAnterior = useRef(0)
  const nome = conversa.cliente?.nome ?? conversa.nome ?? 'Conversa'

  const carregarMensagens = useCallback(async () => {
    const { data, error } = await supabase
      .from('mensagens')
      .select('*, autor:usuarios(id,nome,avatar_url)')
      .eq('conversa_id', conversa.id)
      .order('criado_em', { ascending: true })

    setCarregando(false)

    if (error) {
      setErro('Não foi possível carregar as mensagens.')
      console.error('[mensagens] erro ao carregar:', error)
      return
    }
    setErro('')

    const lista = (data as Mensagem[]) ?? []
    setMensagens(lista)

    // Marcar como lidas
    const naoLidas = lista.filter(m => !(m.lida_por ?? []).includes(usuarioId))
    for (const m of naoLidas) {
      await supabase
        .from('mensagens')
        .update({ lida_por: [...(m.lida_por ?? []), usuarioId] })
        .eq('id', m.id)
    }
    if (naoLidas.length > 0) onAtualizar()
  }, [conversa.id, usuarioId, onAtualizar])

  useEffect(() => {
    carregarMensagens()
    const intervalo = setInterval(carregarMensagens, 5000)
    return () => clearInterval(intervalo)
  }, [carregarMensagens])

  // Rolar para o fim só quando chegar mensagem nova
  useEffect(() => {
    if (mensagens.length !== qtdAnterior.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      qtdAnterior.current = mensagens.length
    }
  }, [mensagens])

  async function enviarMensagem() {
    const conteudo = texto.trim()
    if (!conteudo || enviando) return
    setEnviando(true)
    setTexto('')

    const { error } = await supabase.from('mensagens').insert({
      conversa_id: conversa.id,
      autor_id: usuarioId,
      conteudo,
      tipo: 'texto',
      lida_por: [usuarioId],
    })

    if (error) {
      setErro('Não foi possível enviar a mensagem.')
      setTexto(conteudo)
      console.error('[mensagens] erro ao enviar:', error)
    } else {
      // Atualiza a data da conversa para ela subir na lista
      await supabase.from('conversas').update({ nome: conversa.nome }).eq('id', conversa.id)
      await carregarMensagens()
      onAtualizar()
    }
    setEnviando(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      enviarMensagem()
    }
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#E9E9EC] bg-white">
        <button
          onClick={onVoltar}
          className="md:hidden p-1 -ml-1 text-gray-500"
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          aria-label="Voltar para conversas"
        >
          <ArrowLeft size={18} />
        </button>
        <Avatar nome={nome} size={36} />
        <div className="min-w-0">
          <p className="font-semibold text-gray-800 text-sm truncate">{nome}</p>
          <p className="text-xs text-gray-400">
            {conversa.tipo === 'cliente' ? 'Canal do cliente' : 'Conversa interna'}
          </p>
        </div>
      </div>

      {/* Mensagens */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4 bg-[#F7F7F8]">
        {carregando ? (
          <div className="flex justify-center py-8">
            <div className="mf-spinner" />
          </div>
        ) : mensagens.length === 0 ? (
          <div className="mf-empty">
            <div className="flex justify-center mb-2 text-gray-300"><MessageCircle size={28} /></div>
            <div className="mf-empty-title">Nenhuma mensagem ainda</div>
            <p className="text-sm text-gray-400 mt-1">Envie a primeira mensagem!</p>
          </div>
        ) : (
          mensagens.map(m => (
            <BolhaMensagem key={m.id} mensagem={m} minha={m.autor_id === usuarioId} />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {erro && (
        <div className="px-4 py-2 text-xs text-red-600 bg-red-50 border-t border-red-100 flex items-center gap-1.5">
          <AlertCircle size={13} /> {erro}
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3 border-t border-[#E9E9EC] bg-white">
        <div className="flex items-end gap-2">
          <textarea
            value={texto}
            onChange={e => setTexto(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite uma mensagem... (Enter para enviar)"
            rows={1}
            className="flex-1 mf-input resize-none max-h-32"
            style={{ overflowY: 'auto' }}
          />
          <button
            onClick={enviarMensagem}
            disabled={!texto.trim() || enviando}
            className="mf-btn-primary self-end shrink-0"
            style={{ padding: '0.625rem 0.75rem' }}
            aria-label="Enviar"
          >
            {enviando ? <Clock size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function MensagensPage() {
  const [conversas, setConversas] = useState<ConversaComExtra[]>([])
  const [conversaSelecionada, setConversaSelecionada] = useState<Conversa | null>(null)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [usuarioId, setUsuarioId] = useState<string>('')
  const [busca, setBusca] = useState('')
  const [modalNova, setModalNova] = useState(false)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  const carregarConversas = useCallback(async () => {
    if (!usuarioId) return

    const select = `
      *,
      cliente:clientes(id, nome),
      mensagens(id, conteudo, criado_em, lida_por, autor_id)
    `

    // Tenta ordenar por atualizado_em; se a coluna não existir, usa criado_em
    let resp = await supabase.from('conversas').select(select).order('atualizado_em', { ascending: false })
    if (resp.error) {
      console.warn('[mensagens] fallback para criado_em:', resp.error.message)
      resp = await supabase.from('conversas').select(select).order('criado_em', { ascending: false })
    }

    setCarregando(false)

    if (resp.error) {
      console.error('[mensagens] erro ao carregar conversas:', resp.error)
      setErro('Não foi possível carregar as conversas. Verifique se a etapa 8 do banco foi aplicada.')
      return
    }
    setErro('')

    const lista = (resp.data ?? []) as (Conversa & { mensagens: MsgResumo[] | null })[]

    const comExtra: ConversaComExtra[] = lista.map(c => {
      const msgs = [...(c.mensagens ?? [])]
      const naoLidas = msgs.filter(
        m => !(m.lida_por ?? []).includes(usuarioId) && m.autor_id !== usuarioId
      ).length
      const ultima = msgs.sort((a, b) => b.criado_em.localeCompare(a.criado_em))[0]
      return {
        ...c,
        mensagens_nao_lidas: naoLidas,
        ultima_mensagem_texto: ultima?.conteudo ?? '',
        ultima_mensagem_em: ultima?.criado_em ?? null,
      }
    })

    // Conversa com mensagem mais recente primeiro
    comExtra.sort((a, b) =>
      (b.ultima_mensagem_em ?? b.criado_em ?? '').localeCompare(a.ultima_mensagem_em ?? a.criado_em ?? '')
    )

    setConversas(comExtra)
  }, [usuarioId])

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setCarregando(false)
        setErro('Sessão expirada. Faça login novamente.')
        return
      }
      setUsuarioId(user.id)

      const { data: clis } = await supabase
        .from('clientes')
        .select('id, nome')
        .eq('status', 'ativo')
        .order('nome')

      setClientes((clis as Cliente[]) ?? [])
    }
    init()
  }, [])

  useEffect(() => {
    carregarConversas()
  }, [carregarConversas])

  async function criarConversa(clienteId: string) {
    const existente = conversas.find(c => c.cliente_id === clienteId)
    if (existente) {
      setConversaSelecionada(existente)
      setModalNova(false)
      return
    }

    const cliente = clientes.find(c => c.id === clienteId)
    const { data, error } = await supabase
      .from('conversas')
      .insert({
        tipo: 'cliente',
        nome: cliente?.nome ?? 'Nova conversa',
        cliente_id: clienteId,
      })
      .select('*, cliente:clientes(id, nome)')
      .single()

    if (error) {
      console.error('[mensagens] erro ao criar conversa:', error)
      setErro('Não foi possível criar a conversa.')
    } else if (data) {
      await carregarConversas()
      setConversaSelecionada(data as Conversa)
    }
    setModalNova(false)
  }

  const conversasFiltradas = conversas.filter(c => {
    const nome = c.cliente?.nome ?? c.nome ?? ''
    return nome.toLowerCase().includes(busca.toLowerCase())
  })

  return (
    <div
      className="flex overflow-hidden bg-white border border-[#E9E9EC] rounded-2xl"
      style={{ height: 'calc(100vh - 60px - 3rem)', minHeight: 420 }}
    >
      {/* Lista de conversas */}
      <div
        className={`w-full md:w-72 border-r border-[#E9E9EC] flex-col bg-white shrink-0 min-h-0 ${
          conversaSelecionada ? 'hidden md:flex' : 'flex'
        }`}
      >
        <div className="p-4 border-b border-[#E9E9EC]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-800 m-0 text-base">Conversas</h2>
            <button
              onClick={() => setModalNova(true)}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-[#FF6A00] transition-colors"
              style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
              title="Nova conversa"
              aria-label="Nova conversa"
            >
              <Plus size={18} />
            </button>
          </div>
          <div className="relative">
            <Search
              size={14}
              className="absolute top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              style={{ left: 12 }}
            />
            <input
              className="mf-input text-sm"
              style={{ paddingLeft: 34 }}
              placeholder="Buscar conversa..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-0.5">
          {carregando ? (
            <div className="flex justify-center py-6">
              <div className="mf-spinner" />
            </div>
          ) : erro ? (
            <div className="m-2 p-3 rounded-lg bg-red-50 border border-red-100 text-xs text-red-600 flex gap-1.5">
              <AlertCircle size={14} className="shrink-0 mt-px" />
              <span>{erro}</span>
            </div>
          ) : conversasFiltradas.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle size={28} className="text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">{busca ? 'Sem resultados' : 'Nenhuma conversa'}</p>
              {!busca && (
                <button
                  onClick={() => setModalNova(true)}
                  className="mt-2 text-sm text-[#FF6A00] hover:underline"
                  style={{ border: 'none', background: 'none', cursor: 'pointer' }}
                >
                  Criar primeira conversa
                </button>
              )}
            </div>
          ) : (
            conversasFiltradas.map(c => (
              <ItemConversa
                key={c.id}
                conversa={c}
                ativa={conversaSelecionada?.id === c.id}
                onClick={() => setConversaSelecionada(c)}
              />
            ))
          )}
        </div>
      </div>

      {/* Área de chat */}
      <div className={`flex-1 flex-col overflow-hidden min-h-0 ${conversaSelecionada ? 'flex' : 'hidden md:flex'}`}>
        {conversaSelecionada && usuarioId ? (
          <PainelChat
            key={conversaSelecionada.id}
            conversa={conversaSelecionada}
            usuarioId={usuarioId}
            onAtualizar={carregarConversas}
            onVoltar={() => setConversaSelecionada(null)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-[#F7F7F8]">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-white border border-[#E9E9EC] flex items-center justify-center mx-auto mb-3 shadow-sm">
                <MessageCircle size={28} className="text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium">Selecione uma conversa</p>
              <p className="text-sm text-gray-400 mt-1">ou crie uma nova com o botão +</p>
            </div>
          </div>
        )}
      </div>

      {modalNova && (
        <ModalNovaConversa
          clientes={clientes}
          onCriar={criarConversa}
          onFechar={() => setModalNova(false)}
        />
      )}
    </div>
  )
}

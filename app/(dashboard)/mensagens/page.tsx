'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from "@/lib/supabase";
import {
  Search,
  Send,
  MessageCircle,
  Plus,
  User,
  CheckCheck,
  Clock,
} from 'lucide-react'
import type { Conversa, Mensagem, Cliente, Usuario } from '@/lib/types'

// ─── Tipos locais ─────────────────────────────────────────────────────────────

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
  return nome.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase()
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ nome, url, size = 36 }: { nome: string; url?: string | null; size?: number }) {
  if (url) {
    return (
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
    <div className="mf-overlay">
      <div className="mf-modal max-w-sm w-full">
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

function BolhaMensagem({
  mensagem,
  minha,
}: {
  mensagem: Mensagem
  minha: boolean
}) {
  return (
    <div className={`flex items-end gap-2 ${minha ? 'flex-row-reverse' : 'flex-row'}`}>
      {!minha && (
        <Avatar
          nome={mensagem.autor?.nome ?? '?'}
          url={mensagem.autor?.avatar_url}
          size={28}
        />
      )}
      <div className={`max-w-[70%] ${minha ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        {!minha && mensagem.autor && (
          <span className="text-xs text-gray-400 ml-1">{mensagem.autor.nome}</span>
        )}
        <div
          className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
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
}: {
  conversa: Conversa
  usuarioId: string
  onAtualizar: () => void
}) {
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [carregando, setCarregando] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const nome = conversa.cliente?.nome ?? conversa.nome ?? 'Conversa'

  const carregarMensagens = useCallback(async () => {
    const { data } = await supabase
      .from('mensagens')
      .select('*, autor:usuarios(id,nome,avatar_url)')
      .eq('conversa_id', conversa.id)
      .order('criado_em', { ascending: true })

    setMensagens((data as Mensagem[]) ?? [])
    setCarregando(false)

    // Marcar como lida
    if (data && data.length > 0) {
      const naoLidas = (data as Mensagem[]).filter(m => !m.lida_por.includes(usuarioId))
      for (const m of naoLidas) {
        await supabase
          .from('mensagens')
          .update({ lida_por: [...m.lida_por, usuarioId] })
          .eq('id', m.id)
      }
      if (naoLidas.length > 0) onAtualizar()
    }
  }, [supabase, conversa.id, usuarioId, onAtualizar])

  useEffect(() => {
    carregarMensagens()

    // Polling a cada 5s
    const intervalo = setInterval(carregarMensagens, 5000)
    return () => clearInterval(intervalo)
  }, [carregarMensagens])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensagens])

  async function enviarMensagem() {
    const conteudo = texto.trim()
    if (!conteudo || enviando) return
    setEnviando(true)
    setTexto('')

    await supabase.from('mensagens').insert({
      conversa_id: conversa.id,
      autor_id: usuarioId,
      conteudo,
      tipo: 'texto',
      lida_por: [usuarioId],
    })

    await carregarMensagens()
    onAtualizar()
    setEnviando(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      enviarMensagem()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#E9E9EC] bg-white">
        <Avatar nome={nome} size={36} />
        <div>
          <p className="font-semibold text-gray-800 text-sm">{nome}</p>
          <p className="text-xs text-gray-400">
            {conversa.tipo === 'cliente' ? 'Canal do cliente' : 'Conversa interna'}
          </p>
        </div>
      </div>

      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-[#F7F7F8]">
        {carregando ? (
          <div className="flex justify-center py-8">
            <div className="mf-spinner" />
          </div>
        ) : mensagens.length === 0 ? (
          <div className="mf-empty">
            <div className="mf-empty-icon"><MessageCircle size={28} /></div>
            <div className="mf-empty-title">Nenhuma mensagem ainda</div>
            <p className="text-sm text-gray-400 mt-1">Seja o primeiro a enviar!</p>
          </div>
        ) : (
          mensagens.map(m => (
            <BolhaMensagem
              key={m.id}
              mensagem={m}
              minha={m.autor_id === usuarioId}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

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
            className="mf-btn-primary px-3 py-2.5 self-end shrink-0 disabled:opacity-40"
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

  const carregarConversas = useCallback(async () => {
    const { data } = await supabase
      .from('conversas')
      .select(`
        *,
        cliente:clientes(id, nome),
        mensagens(id, conteudo, criado_em, lida_por, autor_id)
      `)
      .order('atualizado_em', { ascending: false })

    if (!data) return

    const uid = usuarioId || (await supabase.auth.getUser()).data.user?.id || ''

    const comExtra: ConversaComExtra[] = (data as (Conversa & {
      mensagens: Array<{ id: string; conteudo: string; criado_em: string; lida_por: string[]; autor_id: string }>
    })[]).map(c => {
      const msgs = c.mensagens ?? []
      const naoLidas = msgs.filter(m => !m.lida_por.includes(uid) && m.autor_id !== uid).length
      const ultima = msgs.sort((a, b) => b.criado_em.localeCompare(a.criado_em))[0]
      return {
        ...c,
        mensagens_nao_lidas: naoLidas,
        ultima_mensagem_texto: ultima?.conteudo ?? '',
        ultima_mensagem_em: ultima?.criado_em ?? null,
      }
    })

    setConversas(comExtra)
    setCarregando(false)
  }, [supabase, usuarioId])

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUsuarioId(user.id)

      const { data: clis } = await supabase
        .from('clientes')
        .select('id, nome')
        .eq('status', 'ativo')
        .order('nome')

      setClientes((clis as Cliente[]) ?? [])
    }
    init()
  }, [supabase])

  useEffect(() => {
    if (usuarioId) carregarConversas()
  }, [usuarioId, carregarConversas])

  async function criarConversa(clienteId: string) {
    // Verifica se já existe
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

    if (!error && data) {
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
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* Sidebar de conversas */}
      <div className="w-72 border-r border-[#E9E9EC] flex flex-col bg-white shrink-0">
        {/* Header sidebar */}
        <div className="p-4 border-b border-[#E9E9EC]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-800">Mensagens</h2>
            <button
              onClick={() => setModalNova(true)}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-[#FF6A00] transition-colors"
              title="Nova conversa"
            >
              <Plus size={18} />
            </button>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="mf-input pl-8 py-2 text-sm"
              placeholder="Buscar..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
            />
          </div>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {carregando ? (
            <div className="flex justify-center py-6">
              <div className="mf-spinner" />
            </div>
          ) : conversasFiltradas.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle size={28} className="text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">
                {busca ? 'Sem resultados' : 'Nenhuma conversa'}
              </p>
              {!busca && (
                <button
                  onClick={() => setModalNova(true)}
                  className="mt-2 text-sm text-[#FF6A00] hover:underline"
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
      <div className="flex-1 flex flex-col overflow-hidden">
        {conversaSelecionada ? (
          <PainelChat
            key={conversaSelecionada.id}
            conversa={conversaSelecionada}
            usuarioId={usuarioId}
            onAtualizar={carregarConversas}
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

      {/* Modal nova conversa */}
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

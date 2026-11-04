'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from "@/lib/supabase";
import {
  Bell,
  BellOff,
  CheckCheck,
  Info,
  AlertTriangle,
  CheckCircle,
  XCircle,
  CheckSquare,
  DollarSign,
  Trash2,
} from 'lucide-react'
import type { Notificacao } from '@/lib/types'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTempo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'agora'
  if (min < 60) return `${min}min atrás`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}h atrás`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d atrás`
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

const TIPO_CONFIG: Record<string, { cor: string; icone: React.ReactNode; badge: string }> = {
  info:       { cor: '#3B82F6', icone: <Info size={16} />,          badge: 'mf-badge mf-badge-azul' },
  alerta:     { cor: '#F59E0B', icone: <AlertTriangle size={16} />, badge: 'mf-badge mf-badge-amarelo' },
  sucesso:    { cor: '#10B981', icone: <CheckCircle size={16} />,   badge: 'mf-badge mf-badge-verde' },
  erro:       { cor: '#EF4444', icone: <XCircle size={16} />,       badge: 'mf-badge mf-badge-vermelho' },
  tarefa:     { cor: '#8B5CF6', icone: <CheckSquare size={16} />,   badge: 'mf-badge mf-badge-roxo' },
  financeiro: { cor: '#10B981', icone: <DollarSign size={16} />,    badge: 'mf-badge mf-badge-verde' },
}

// ─── Item de notificação ──────────────────────────────────────────────────────

function ItemNotificacao({
  notif,
  onLer,
  onDeletar,
}: {
  notif: Notificacao
  onLer: (id: string) => void
  onDeletar: (id: string) => void
}) {
  const cfg = TIPO_CONFIG[notif.tipo] ?? TIPO_CONFIG.info

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-xl border transition-colors ${
        notif.lida
          ? 'bg-white border-[#E9E9EC]'
          : 'bg-blue-50/40 border-blue-100'
      }`}
    >
      {/* Ícone */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
        style={{ backgroundColor: cfg.cor + '18', color: cfg.cor }}
      >
        {cfg.icone}
      </div>

      {/* Conteúdo */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm font-medium ${notif.lida ? 'text-gray-700' : 'text-gray-900'}`}>
            {notif.titulo}
          </p>
          <span className="text-xs text-gray-400 shrink-0">{formatTempo(notif.criado_em)}</span>
        </div>
        <p className="text-sm text-gray-500 mt-0.5">{notif.mensagem}</p>
        {notif.url && (
          <a
            href={notif.url}
            className="text-xs text-[#FF6A00] hover:underline mt-1 inline-block"
          >
            Ver detalhes →
          </a>
        )}
      </div>

      {/* Ações */}
      <div className="flex items-center gap-1 shrink-0">
        {!notif.lida && (
          <button
            onClick={() => onLer(notif.id)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-500 transition-colors"
            title="Marcar como lida"
          >
            <CheckCheck size={15} />
          </button>
        )}
        <button
          onClick={() => onDeletar(notif.id)}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-300 hover:text-red-400 transition-colors"
          title="Deletar"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  )
}

// ─── Push Notifications ───────────────────────────────────────────────────────

function SecaoPush({ usuarioId }: { usuarioId: string }) {
  const supabase = createBrowserClient()
  const [status, setStatus] = useState<'desconhecido' | 'suportado' | 'nao_suportado' | 'ativo' | 'negado'>('desconhecido')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setStatus('nao_suportado')
      return
    }
    if (Notification.permission === 'denied') { setStatus('negado'); return }
    if (Notification.permission === 'granted') { setStatus('ativo'); return }
    setStatus('suportado')
  }, [])

  async function ativarPush() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return
    setSalvando(true)
    try {
      const perm = await Notification.requestPermission()
      if (perm !== 'granted') { setStatus('negado'); setSalvando(false); return }

      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      })

      await supabase.from('push_subscriptions').upsert({
        usuario_id: usuarioId,
        subscription: sub.toJSON(),
      })
      setStatus('ativo')
    } catch (err) {
      console.error('Erro ao ativar push:', err)
    }
    setSalvando(false)
  }

  if (status === 'nao_suportado') return null

  return (
    <div className="mf-card flex items-start gap-4">
      <div className="w-10 h-10 rounded-xl bg-[#FF6A00]/10 flex items-center justify-center shrink-0">
        <Bell size={18} className="text-[#FF6A00]" />
      </div>
      <div className="flex-1">
        <p className="font-semibold text-gray-800 text-sm">Notificações push</p>
        {status === 'ativo' && (
          <p className="text-sm text-green-600 mt-0.5 flex items-center gap-1">
            <CheckCircle size={13} /> Ativo — você receberá alertas neste dispositivo
          </p>
        )}
        {status === 'negado' && (
          <p className="text-sm text-red-500 mt-0.5">
            Permissão negada. Habilite nas configurações do navegador.
          </p>
        )}
        {status === 'suportado' && (
          <>
            <p className="text-sm text-gray-500 mt-0.5">
              Receba alertas de tarefas, cobranças e mensagens mesmo com o MarketForge fechado.
            </p>
            <button
              onClick={ativarPush}
              disabled={salvando}
              className="mf-btn-primary mt-3 text-sm py-1.5"
            >
              {salvando ? 'Ativando...' : 'Ativar notificações'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

type Filtro = 'todas' | 'nao_lidas' | 'info' | 'alerta' | 'tarefa' | 'financeiro'

export default function NotificacoesPage() {
  const supabase = createBrowserClient()
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([])
  const [filtro, setFiltro] = useState<Filtro>('todas')
  const [carregando, setCarregando] = useState(true)
  const [usuarioId, setUsuarioId] = useState('')

  const carregar = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUsuarioId(user.id)

    const { data } = await supabase
      .from('notificacoes')
      .select('*')
      .eq('usuario_id', user.id)
      .order('criado_em', { ascending: false })
      .limit(100)

    setNotificacoes((data as Notificacao[]) ?? [])
    setCarregando(false)
  }, [supabase])

  useEffect(() => { carregar() }, [carregar])

  async function marcarLida(id: string) {
    await supabase.from('notificacoes').update({ lida: true }).eq('id', id)
    setNotificacoes(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n))
  }

  async function deletar(id: string) {
    await supabase.from('notificacoes').delete().eq('id', id)
    setNotificacoes(prev => prev.filter(n => n.id !== id))
  }

  async function marcarTodasLidas() {
    await supabase.from('notificacoes').update({ lida: true }).eq('usuario_id', usuarioId).eq('lida', false)
    setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })))
  }

  const filtradas = notificacoes.filter(n => {
    if (filtro === 'nao_lidas') return !n.lida
    if (filtro === 'todas') return true
    return n.tipo === filtro
  })

  const naoLidas = notificacoes.filter(n => !n.lida).length

  const FILTROS: { key: Filtro; label: string }[] = [
    { key: 'todas', label: 'Todas' },
    { key: 'nao_lidas', label: `Não lidas (${naoLidas})` },
    { key: 'alerta', label: 'Alertas' },
    { key: 'tarefa', label: 'Tarefas' },
    { key: 'financeiro', label: 'Financeiro' },
    { key: 'info', label: 'Info' },
  ]

  return (
    <div className="p-6 space-y-5">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="mf-page-title">Notificações</h1>
          <p className="mf-page-subtitle">
            {naoLidas > 0 ? `${naoLidas} não lida${naoLidas > 1 ? 's' : ''}` : 'Tudo em dia'}
          </p>
        </div>
        {naoLidas > 0 && (
          <button onClick={marcarTodasLidas} className="mf-btn-secondary flex items-center gap-2">
            <CheckCheck size={15} /> Marcar todas como lidas
          </button>
        )}
      </div>

      {/* Push */}
      {usuarioId && <SecaoPush usuarioId={usuarioId} />}

      {/* Filtros */}
      <div className="flex gap-1 border-b border-[#E9E9EC] overflow-x-auto">
        {FILTROS.map(f => (
          <button
            key={f.key}
            onClick={() => setFiltro(f.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              filtro === f.key
                ? 'border-[#FF6A00] text-[#FF6A00]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {carregando ? (
        <div className="flex justify-center py-8">
          <div className="mf-spinner" />
        </div>
      ) : filtradas.length === 0 ? (
        <div className="mf-card">
          <div className="mf-empty">
            <div className="mf-empty-icon"><BellOff size={28} /></div>
            <div className="mf-empty-title">Nenhuma notificação</div>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {filtradas.map(n => (
            <ItemNotificacao
              key={n.id}
              notif={n}
              onLer={marcarLida}
              onDeletar={deletar}
            />
          ))}
        </div>
      )}
    </div>
  )
}

'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from "@/lib/supabase";
import {
  FileText,
  DollarSign,
  CheckSquare,
  Calendar,
  MessageCircle,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle,
  ChevronRight,
} from 'lucide-react'
import type { Cliente, Cobranca, Tarefa, Conteudo, EventoAgenda } from '@/lib/types'

// ─── Tipos ───────────────────────────────────────────────────────────────────

type DadosPortal = {
  cliente: Cliente | null
  cobrancas: Cobranca[]
  tarefas: Tarefa[]
  conteudos: Conteudo[]
  eventos: EventoAgenda[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatMoeda(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatData(d: string) {
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function hoje() {
  return new Date().toISOString().slice(0, 10)
}

const STATUS_COBRANCA_COR: Record<string, string> = {
  pendente: 'mf-badge mf-badge-amarelo',
  pago: 'mf-badge mf-badge-verde',
  atrasado: 'mf-badge mf-badge-vermelho',
  cancelado: 'mf-badge mf-badge-cinza',
}
const STATUS_COBRANCA_LABEL: Record<string, string> = {
  pendente: 'Pendente', pago: 'Pago', atrasado: 'Atrasado', cancelado: 'Cancelado',
}

const STATUS_TAREFA_COR: Record<string, string> = {
  pendente: 'mf-badge mf-badge-cinza',
  em_andamento: 'mf-badge mf-badge-azul',
  em_revisao: 'mf-badge mf-badge-amarelo',
  concluida: 'mf-badge mf-badge-verde',
  cancelada: 'mf-badge mf-badge-vermelho',
}
const STATUS_TAREFA_LABEL: Record<string, string> = {
  pendente: 'Pendente', em_andamento: 'Em andamento', em_revisao: 'Em revisão',
  concluida: 'Concluída', cancelada: 'Cancelada',
}

const STATUS_CONTEUDO_COR: Record<string, string> = {
  rascunho: 'mf-badge mf-badge-cinza',
  aprovado: 'mf-badge mf-badge-azul',
  agendado: 'mf-badge mf-badge-amarelo',
  publicado: 'mf-badge mf-badge-verde',
  cancelado: 'mf-badge mf-badge-vermelho',
}
const STATUS_CONTEUDO_LABEL: Record<string, string> = {
  rascunho: 'Rascunho', aprovado: 'Aprovado', agendado: 'Agendado',
  publicado: 'Publicado', cancelado: 'Cancelado',
}

// ─── Abas ─────────────────────────────────────────────────────────────────────

type Aba = 'resumo' | 'financeiro' | 'tarefas' | 'conteudos' | 'agenda'

const ABAS: { key: Aba; label: string; icon: React.ReactNode }[] = [
  { key: 'resumo',     label: 'Resumo',     icon: <TrendingUp size={16} /> },
  { key: 'financeiro', label: 'Financeiro', icon: <DollarSign size={16} /> },
  { key: 'tarefas',    label: 'Tarefas',    icon: <CheckSquare size={16} /> },
  { key: 'conteudos',  label: 'Conteúdos',  icon: <FileText size={16} /> },
  { key: 'agenda',     label: 'Agenda',     icon: <Calendar size={16} /> },
]

// ─── Aba Resumo ───────────────────────────────────────────────────────────────

function AbaResumo({ dados }: { dados: DadosPortal }) {
  const { cobrancas, tarefas, conteudos, eventos } = dados
  const hj = hoje()

  const cobrancasAtrasadas = cobrancas.filter(c => c.status === 'atrasado')
  const cobrancasPendentes = cobrancas.filter(c => c.status === 'pendente')
  const tarefasAndamento = tarefas.filter(t => ['em_andamento','em_revisao'].includes(t.status))
  const conteudosAprovados = conteudos.filter(c => c.status === 'aprovado')
  const proximosEventos = eventos
    .filter(e => e.data_inicio >= hj + 'T00:00:00')
    .slice(0, 3)

  return (
    <div className="space-y-5">
      {/* Alertas */}
      {cobrancasAtrasadas.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle size={18} className="text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-red-700 text-sm">
              {cobrancasAtrasadas.length} {cobrancasAtrasadas.length === 1 ? 'cobrança atrasada' : 'cobranças atrasadas'}
            </p>
            <p className="text-red-500 text-sm">
              Total: {formatMoeda(cobrancasAtrasadas.reduce((s, c) => s + c.valor, 0))}
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="mf-stat-card">
          <div className="mf-stat-label">A pagar</div>
          <div className="mf-stat-value text-red-500">
            {formatMoeda(cobrancasPendentes.reduce((s, c) => s + c.valor, 0))}
          </div>
        </div>
        <div className="mf-stat-card">
          <div className="mf-stat-label">Tarefas em andamento</div>
          <div className="mf-stat-value text-blue-600">{tarefasAndamento.length}</div>
        </div>
        <div className="mf-stat-card">
          <div className="mf-stat-label">Conteúdos para aprovar</div>
          <div className="mf-stat-value text-[#FF6A00]">{conteudosAprovados.length}</div>
        </div>
        <div className="mf-stat-card">
          <div className="mf-stat-label">Próximos eventos</div>
          <div className="mf-stat-value">{proximosEventos.length}</div>
        </div>
      </div>

      {/* Próximos eventos */}
      {proximosEventos.length > 0 && (
        <div className="mf-card">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Calendar size={16} className="text-[#FF6A00]" /> Próximos eventos
          </h3>
          <div className="space-y-2">
            {proximosEventos.map(ev => (
              <div key={ev.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: ev.cor ?? '#FF6A00' }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{ev.titulo}</p>
                  <p className="text-xs text-gray-400">
                    {formatData(ev.data_inicio)}
                    {!ev.dia_todo && ` às ${new Date(ev.data_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tarefas em andamento */}
      {tarefasAndamento.length > 0 && (
        <div className="mf-card">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <CheckSquare size={16} className="text-blue-500" /> Tarefas em andamento
          </h3>
          <div className="space-y-2">
            {tarefasAndamento.slice(0, 5).map(t => (
              <div key={t.id} className="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-gray-50">
                <span className="text-sm text-gray-700 flex-1 truncate">{t.titulo}</span>
                <span className={STATUS_TAREFA_COR[t.status]}>{STATUS_TAREFA_LABEL[t.status]}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Aba Financeiro ───────────────────────────────────────────────────────────

function AbaFinanceiro({ cobrancas }: { cobrancas: Cobranca[] }) {
  const ordenadas = [...cobrancas].sort((a, b) => b.vencimento.localeCompare(a.vencimento))

  return (
    <div className="mf-card">
      <h3 className="font-semibold text-gray-800 mb-4">Histórico de cobranças</h3>
      {ordenadas.length === 0 ? (
        <div className="mf-empty">
          <div className="mf-empty-icon"><DollarSign size={28} /></div>
          <div className="mf-empty-title">Sem cobranças</div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="mf-table">
            <thead>
              <tr>
                <th>Descrição</th>
                <th>Vencimento</th>
                <th>Valor</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {ordenadas.map(c => (
                <tr key={c.id}>
                  <td className="font-medium">{c.descricao}</td>
                  <td className="text-gray-500">{formatData(c.vencimento)}</td>
                  <td className="font-semibold">{formatMoeda(c.valor)}</td>
                  <td><span className={STATUS_COBRANCA_COR[c.status]}>{STATUS_COBRANCA_LABEL[c.status]}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Aba Tarefas ──────────────────────────────────────────────────────────────

function AbaTarefas({ tarefas }: { tarefas: Tarefa[] }) {
  return (
    <div className="mf-card">
      <h3 className="font-semibold text-gray-800 mb-4">Suas tarefas</h3>
      {tarefas.length === 0 ? (
        <div className="mf-empty">
          <div className="mf-empty-icon"><CheckSquare size={28} /></div>
          <div className="mf-empty-title">Sem tarefas</div>
        </div>
      ) : (
        <div className="space-y-2">
          {tarefas.map(t => (
            <div key={t.id} className="flex items-start gap-3 p-3 rounded-xl border border-[#E9E9EC] hover:bg-gray-50">
              <div className="mt-0.5">
                {t.status === 'concluida'
                  ? <CheckCircle size={16} className="text-green-500" />
                  : <Clock size={16} className="text-gray-300" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${t.status === 'concluida' ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                  {t.titulo}
                </p>
                {t.descricao && <p className="text-xs text-gray-400 mt-0.5 truncate">{t.descricao}</p>}
                <div className="flex items-center gap-2 mt-1">
                  <span className={STATUS_TAREFA_COR[t.status]}>{STATUS_TAREFA_LABEL[t.status]}</span>
                  {t.prazo && (
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock size={10} /> {formatData(t.prazo)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Aba Conteúdos ────────────────────────────────────────────────────────────

function AbaConteudos({ conteudos }: { conteudos: Conteudo[] }) {
  const porStatus = (s: string) => conteudos.filter(c => c.status === s)

  return (
    <div className="space-y-4">
      {['aprovado', 'agendado', 'publicado', 'rascunho', 'cancelado'].map(status => {
        const lista = porStatus(status)
        if (lista.length === 0) return null
        return (
          <div key={status} className="mf-card">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span className={STATUS_CONTEUDO_COR[status]}>{STATUS_CONTEUDO_LABEL[status]}</span>
              <span className="text-gray-400 font-normal text-sm">({lista.length})</span>
            </h3>
            <div className="space-y-2">
              {lista.map(c => (
                <div key={c.id} className="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-gray-50">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{c.titulo}</p>
                    <p className="text-xs text-gray-400">
                      {c.plataforma} · {c.formato}
                      {c.data_publicacao && ` · ${formatData(c.data_publicacao)}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
      {conteudos.length === 0 && (
        <div className="mf-card">
          <div className="mf-empty">
            <div className="mf-empty-icon"><FileText size={28} /></div>
            <div className="mf-empty-title">Sem conteúdos</div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Aba Agenda ───────────────────────────────────────────────────────────────

function AbaAgenda({ eventos }: { eventos: EventoAgenda[] }) {
  const hj = hoje()
  const futuros = eventos.filter(e => e.data_inicio >= hj + 'T00:00:00')
  const passados = eventos.filter(e => e.data_inicio < hj + 'T00:00:00')

  function RenderEvento({ ev }: { ev: EventoAgenda }) {
    return (
      <div className="flex items-start gap-3 p-3 rounded-xl border border-[#E9E9EC]">
        <div
          className="w-3 h-3 rounded-full mt-1 shrink-0"
          style={{ backgroundColor: ev.cor ?? '#FF6A00' }}
        />
        <div>
          <p className="text-sm font-medium text-gray-800">{ev.titulo}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {formatData(ev.data_inicio)}
            {!ev.dia_todo && ` · ${new Date(ev.data_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
            {ev.local && ` · ${ev.local}`}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {futuros.length > 0 && (
        <div className="mf-card">
          <h3 className="font-semibold text-gray-800 mb-3">Próximos eventos</h3>
          <div className="space-y-2">
            {futuros.map(ev => <RenderEvento key={ev.id} ev={ev} />)}
          </div>
        </div>
      )}
      {passados.length > 0 && (
        <div className="mf-card">
          <h3 className="font-semibold text-gray-500 text-sm mb-3">Eventos anteriores</h3>
          <div className="space-y-2 opacity-60">
            {passados.slice(0, 5).map(ev => <RenderEvento key={ev.id} ev={ev} />)}
          </div>
        </div>
      )}
      {eventos.length === 0 && (
        <div className="mf-card">
          <div className="mf-empty">
            <div className="mf-empty-icon"><Calendar size={28} /></div>
            <div className="mf-empty-title">Sem eventos</div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function PortalClientePage() {
  const supabase = createBrowserClient()
  const [dados, setDados] = useState<DadosPortal>({
    cliente: null, cobrancas: [], tarefas: [], conteudos: [], eventos: [],
  })
  const [carregando, setCarregando] = useState(true)
  const [aba, setAba] = useState<Aba>('resumo')

  const carregar = useCallback(async () => {
    setCarregando(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setCarregando(false); return }

    // Pegar cliente_id do usuário logado
    const { data: usuarioData } = await supabase
      .from('usuarios')
      .select('cliente_id')
      .eq('id', user.id)
      .single()

    const clienteId = usuarioData?.cliente_id
    if (!clienteId) { setCarregando(false); return }

    const hj = new Date()
    const anoAtual = hj.getFullYear()
    const mesAtual = hj.getMonth()
    const inicioAno = new Date(anoAtual, mesAtual - 2, 1).toISOString().slice(0, 10)
    const fimAno = new Date(anoAtual, mesAtual + 3, 0).toISOString().slice(0, 10)

    const [cliRes, cobRes, tarRes, conRes, evRes] = await Promise.all([
      supabase.from('clientes').select('*').eq('id', clienteId).single(),
      supabase.from('cobrancas').select('*').eq('cliente_id', clienteId)
        .gte('vencimento', inicioAno).lte('vencimento', fimAno)
        .order('vencimento', { ascending: false }),
      supabase.from('tarefas').select('*').eq('cliente_id', clienteId)
        .not('status', 'eq', 'cancelada').order('criado_em', { ascending: false }),
      supabase
        .from('planejamentos')
        .select('conteudos(*)')
        .eq('cliente_id', clienteId),
      supabase.from('eventos_agenda').select('*').eq('cliente_id', clienteId)
        .order('data_inicio', { ascending: false }),
    ])

    // Flatten conteúdos de todos os planejamentos
    const todosConteudos: Conteudo[] = []
    if (conRes.data) {
      for (const p of conRes.data as { conteudos: Conteudo[] }[]) {
        if (p.conteudos) todosConteudos.push(...p.conteudos)
      }
    }

    setDados({
      cliente: cliRes.data as Cliente ?? null,
      cobrancas: (cobRes.data as Cobranca[]) ?? [],
      tarefas: (tarRes.data as Tarefa[]) ?? [],
      conteudos: todosConteudos,
      eventos: (evRes.data as EventoAgenda[]) ?? [],
    })
    setCarregando(false)
  }, [supabase])

  useEffect(() => { carregar() }, [carregar])

  if (carregando) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="mf-spinner" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-5">
      {/* Cabeçalho */}
      <div>
        <h1 className="mf-page-title">
          {dados.cliente ? `Olá, ${dados.cliente.nome}!` : 'Meu Portal'}
        </h1>
        <p className="mf-page-subtitle">Acompanhe seus projetos, cobranças e comunicados</p>
      </div>

      {/* Abas */}
      <div className="flex gap-1 border-b border-[#E9E9EC] overflow-x-auto">
        {ABAS.map(a => (
          <button
            key={a.key}
            onClick={() => setAba(a.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              aba === a.key
                ? 'border-[#FF6A00] text-[#FF6A00]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {a.icon} {a.label}
          </button>
        ))}
      </div>

      {/* Conteúdo */}
      {aba === 'resumo'     && <AbaResumo dados={dados} />}
      {aba === 'financeiro' && <AbaFinanceiro cobrancas={dados.cobrancas} />}
      {aba === 'tarefas'    && <AbaTarefas tarefas={dados.tarefas} />}
      {aba === 'conteudos'  && <AbaConteudos conteudos={dados.conteudos} />}
      {aba === 'agenda'     && <AbaAgenda eventos={dados.eventos} />}
    </div>
  )
}

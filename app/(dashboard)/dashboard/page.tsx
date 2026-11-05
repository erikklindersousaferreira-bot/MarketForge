'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from "@/lib/supabase";
import {
  Users,
  DollarSign,
  TrendingUp,
  CheckSquare,
  AlertCircle,
  Clock,
  MessageCircle,
  Target,
  ArrowUp,
  ArrowDown,
  Calendar,
  Star,
} from 'lucide-react'
import type { Usuario } from '@/lib/types'

// ─── Tipos ────────────────────────────────────────────────────────────────────

type KPIs = {
  clientes_ativos: number
  clientes_inativos: number
  receita_mes: number
  receita_mes_anterior: number
  receita_pendente: number
  receita_atrasada: number
  tarefas_pendentes: number
  tarefas_em_andamento: number
  tarefas_concluidas_mes: number
  leads_ativos: number
  pipeline_valor: number
  mensagens_nao_lidas: number
  eventos_hoje: number
}

type CobrancaMes = {
  mes: string
  receita_paga: number
  receita_pendente: number
  receita_atrasada: number
}

type LeadFunil = {
  estagio: string
  total: number
  valor_total: number
}

type AtividadeRecente = {
  tipo: 'tarefa' | 'cobranca' | 'lead' | 'mensagem'
  titulo: string
  subtitulo: string
  tempo: string
  cor: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatMoeda(v: number) {
  if (v >= 1000) return `R$ ${(v / 1000).toFixed(1)}k`
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatMoedaCompleto(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function variacao(atual: number, anterior: number) {
  if (anterior === 0) return null
  return ((atual - anterior) / anterior) * 100
}

function mesLabel(isoDate: string) {
  const d = new Date(isoDate + 'T00:00:00')
  return d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
}

// ─── Componentes visuais ──────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  cor,
  delta,
  sub,
}: {
  label: string
  value: string | number
  icon: React.ReactNode
  cor: string
  delta?: number | null
  sub?: string
}) {
  return (
    <div className="mf-card flex items-start gap-4">
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: cor + '18', color: cor }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="mf-stat-label">{label}</p>
        <p className="mf-stat-value">{value}</p>
        {delta !== undefined && delta !== null && (
          <p className={`text-xs flex items-center gap-0.5 mt-0.5 ${delta >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {delta >= 0 ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
            {Math.abs(delta).toFixed(1)}% vs mês anterior
          </p>
        )}
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

// ─── Gráfico de barras simples ────────────────────────────────────────────────

function GraficoBarras({ dados }: { dados: CobrancaMes[] }) {
  const ultimos = dados.slice(0, 6).reverse()
  const max = Math.max(...ultimos.map(d => d.receita_paga + d.receita_pendente + d.receita_atrasada), 1)

  return (
    <div className="mf-card">
      <h3 className="font-semibold text-gray-800 mb-4">Receita mensal (últimos 6 meses)</h3>
      <div className="flex items-end gap-3 h-36">
        {ultimos.map((d, i) => {
          const total = d.receita_paga + d.receita_pendente + d.receita_atrasada
          const altPaga = (d.receita_paga / max) * 100
          const altPend = (d.receita_pendente / max) * 100
          const altAtras = (d.receita_atrasada / max) * 100

          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex flex-col-reverse rounded overflow-hidden" style={{ height: '100px' }}>
                <div
                  className="w-full bg-green-400 transition-all"
                  style={{ height: `${altPaga}%` }}
                  title={`Pago: ${formatMoedaCompleto(d.receita_paga)}`}
                />
                <div
                  className="w-full bg-yellow-300 transition-all"
                  style={{ height: `${altPend}%` }}
                  title={`Pendente: ${formatMoedaCompleto(d.receita_pendente)}`}
                />
                <div
                  className="w-full bg-red-400 transition-all"
                  style={{ height: `${altAtras}%` }}
                  title={`Atrasado: ${formatMoedaCompleto(d.receita_atrasada)}`}
                />
              </div>
              <span className="text-[10px] text-gray-400 text-center">{mesLabel(d.mes)}</span>
            </div>
          )
        })}
      </div>
      <div className="flex gap-4 mt-3">
        <span className="flex items-center gap-1 text-xs text-gray-500"><span className="w-2.5 h-2.5 rounded-sm bg-green-400 inline-block" /> Pago</span>
        <span className="flex items-center gap-1 text-xs text-gray-500"><span className="w-2.5 h-2.5 rounded-sm bg-yellow-300 inline-block" /> Pendente</span>
        <span className="flex items-center gap-1 text-xs text-gray-500"><span className="w-2.5 h-2.5 rounded-sm bg-red-400 inline-block" /> Atrasado</span>
      </div>
    </div>
  )
}

// ─── Funil de leads ───────────────────────────────────────────────────────────

const COR_ESTAGIO: Record<string, string> = {
  novo: '#6B7280', contato: '#3B82F6', proposta: '#F59E0B',
  negociacao: '#8B5CF6', ganho: '#10B981', perdido: '#EF4444',
}
const LABEL_ESTAGIO: Record<string, string> = {
  novo: 'Novo', contato: 'Contato', proposta: 'Proposta',
  negociacao: 'Negociação', ganho: 'Ganho', perdido: 'Perdido',
}

function FunilLeads({ dados }: { dados: LeadFunil[] }) {
  const ativos = dados.filter(d => d.estagio !== 'perdido')
  const max = Math.max(...ativos.map(d => d.total), 1)

  return (
    <div className="mf-card">
      <h3 className="font-semibold text-gray-800 mb-4">Funil de prospecção</h3>
      <div className="space-y-2">
        {ativos.map(d => (
          <div key={d.estagio} className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-20 shrink-0">{LABEL_ESTAGIO[d.estagio] ?? d.estagio}</span>
            <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all flex items-center justify-end pr-2"
                style={{
                  width: `${Math.max((d.total / max) * 100, 8)}%`,
                  backgroundColor: COR_ESTAGIO[d.estagio] ?? '#6B7280',
                }}
              >
                <span className="text-[10px] text-white font-bold">{d.total}</span>
              </div>
            </div>
            <span className="text-xs text-gray-400 w-16 text-right shrink-0">
              {d.valor_total > 0 ? formatMoeda(d.valor_total) : '—'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Atividade recente ────────────────────────────────────────────────────────

const COR_TIPO: Record<string, string> = {
  tarefa: '#3B82F6', cobranca: '#10B981', lead: '#8B5CF6', mensagem: '#FF6A00',
}

function AtividadeItem({ item }: { item: AtividadeRecente }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-[#E9E9EC] last:border-0">
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
        style={{ backgroundColor: COR_TIPO[item.tipo] + '18', color: COR_TIPO[item.tipo] }}
      >
        {item.tipo === 'tarefa' && <CheckSquare size={13} />}
        {item.tipo === 'cobranca' && <DollarSign size={13} />}
        {item.tipo === 'lead' && <Target size={13} />}
        {item.tipo === 'mensagem' && <MessageCircle size={13} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{item.titulo}</p>
        <p className="text-xs text-gray-400 truncate">{item.subtitulo}</p>
      </div>
      <span className="text-xs text-gray-300 shrink-0">{item.tempo}</span>
    </div>
  )
}

// ─── Clientes com atenção ────────────────────────────────────────────────────

type ClienteAlerta = {
  id: string
  nome: string
  cobrancas_atrasadas: number
  tarefas_atrasadas: number
}

function ClientesAlerta({ lista }: { lista: ClienteAlerta[] }) {
  if (lista.length === 0) return null
  return (
    <div className="mf-card border-l-4 border-red-400">
      <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
        <AlertCircle size={16} className="text-red-500" /> Clientes que precisam de atenção
      </h3>
      <div className="space-y-2">
        {lista.map(c => (
          <div key={c.id} className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-gray-700">{c.nome}</span>
            <div className="flex gap-2">
              {c.cobrancas_atrasadas > 0 && (
                <span className="mf-badge mf-badge-vermelho">
                  {c.cobrancas_atrasadas} cobr. atrasada{c.cobrancas_atrasadas > 1 ? 's' : ''}
                </span>
              )}
              {c.tarefas_atrasadas > 0 && (
                <span className="mf-badge mf-badge-amarelo">
                  {c.tarefas_atrasadas} tarefa{c.tarefas_atrasadas > 1 ? 's' : ''} atrasada{c.tarefas_atrasadas > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [kpis, setKpis] = useState<KPIs | null>(null)
  const [grafico, setGrafico] = useState<CobrancaMes[]>([])
  const [funil, setFunil] = useState<LeadFunil[]>([])
  const [atividades, setAtividades] = useState<AtividadeRecente[]>([])
  const [alertas, setAlertas] = useState<ClienteAlerta[]>([])
  const [carregando, setCarregando] = useState(true)

  const carregar = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: us } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', user.id)
      .single()
    setUsuario(us as Usuario)

    const agora = new Date()
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1).toISOString().slice(0, 10)
    const fimMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 0).toISOString().slice(0, 10)
    const inicioMesAnt = new Date(agora.getFullYear(), agora.getMonth() - 1, 1).toISOString().slice(0, 10)
    const fimMesAnt = new Date(agora.getFullYear(), agora.getMonth(), 0).toISOString().slice(0, 10)
    const hoje = agora.toISOString().slice(0, 10)

    // Dados em paralelo
    const [
      cliRes, cobMesRes, cobMesAntRes, cobPendRes, cobAtrasRes,
      tarPendRes, tarAndRes, tarConclRes, leadsRes,
      msgRes, evRes, cobHistRes, funilRes, tarAtrasRes
    ] = await Promise.all([
      supabase.from('clientes').select('id, status'),
      supabase.from('cobrancas').select('valor').eq('status', 'pago').gte('vencimento', inicioMes).lte('vencimento', fimMes),
      supabase.from('cobrancas').select('valor').eq('status', 'pago').gte('vencimento', inicioMesAnt).lte('vencimento', fimMesAnt),
      supabase.from('cobrancas').select('valor').eq('status', 'pendente'),
      supabase.from('cobrancas').select('valor, cliente_id, clientes(id, nome)').eq('status', 'atrasado'),
      supabase.from('tarefas').select('id').eq('status', 'pendente'),
      supabase.from('tarefas').select('id').in('status', ['em_andamento', 'em_revisao']),
      supabase.from('tarefas').select('id').eq('status', 'concluida').gte('concluida_em', inicioMes),
      supabase.from('leads').select('id, valor_estimado').not('estagio', 'in', '("ganho","perdido")'),
      supabase.from('mensagens').select('id, lida_por, autor_id').filter('lida_por', 'not.cs', `{${user.id}}`),
      supabase.from('eventos_agenda').select('id').gte('data_inicio', hoje + 'T00:00:00').lte('data_inicio', hoje + 'T23:59:59'),
      supabase.from('cobrancas').select('vencimento, valor, status').gte('vencimento', new Date(agora.getFullYear(), agora.getMonth() - 5, 1).toISOString().slice(0, 10)).order('vencimento'),
      supabase.from('leads').select('estagio, valor_estimado'),
      supabase.from('tarefas').select('id, cliente_id, prazo').lt('prazo', hoje).not('status', 'in', '("concluida","cancelada")').not('cliente_id', 'is', null),
    ])

    // KPIs
    const clientes = cliRes.data ?? []
    const recMes = (cobMesRes.data ?? []).reduce((s: number, c: { valor: number }) => s + c.valor, 0)
    const recMesAnt = (cobMesAntRes.data ?? []).reduce((s: number, c: { valor: number }) => s + c.valor, 0)
    const recPend = (cobPendRes.data ?? []).reduce((s: number, c: { valor: number }) => s + c.valor, 0)
    const recAtras = (cobAtrasRes.data ?? []).reduce((s: number, c: { valor: number }) => s + c.valor, 0)
    const pipeline = (leadsRes.data ?? []).reduce((s: number, l: { valor_estimado: number | null }) => s + (l.valor_estimado ?? 0), 0)
    const msgNaoLidas = (msgRes.data ?? []).filter((m: { autor_id: string }) => m.autor_id !== user.id).length

    setKpis({
      clientes_ativos: clientes.filter((c: { status: string }) => c.status === 'ativo').length,
      clientes_inativos: clientes.filter((c: { status: string }) => c.status === 'inativo').length,
      receita_mes: recMes,
      receita_mes_anterior: recMesAnt,
      receita_pendente: recPend,
      receita_atrasada: recAtras,
      tarefas_pendentes: tarPendRes.data?.length ?? 0,
      tarefas_em_andamento: tarAndRes.data?.length ?? 0,
      tarefas_concluidas_mes: tarConclRes.data?.length ?? 0,
      leads_ativos: leadsRes.data?.length ?? 0,
      pipeline_valor: pipeline,
      mensagens_nao_lidas: msgNaoLidas,
      eventos_hoje: evRes.data?.length ?? 0,
    })

    // Gráfico mensal
    const porMes: Record<string, CobrancaMes> = {}
    for (const c of cobHistRes.data ?? []) {
      const mes = (c.vencimento as string).slice(0, 7) + '-01'
      if (!porMes[mes]) porMes[mes] = { mes, receita_paga: 0, receita_pendente: 0, receita_atrasada: 0 }
      if (c.status === 'pago') porMes[mes].receita_paga += c.valor
      else if (c.status === 'pendente') porMes[mes].receita_pendente += c.valor
      else if (c.status === 'atrasado') porMes[mes].receita_atrasada += c.valor
    }
    setGrafico(Object.values(porMes).sort((a, b) => b.mes.localeCompare(a.mes)))

    // Funil
    const porEstagio: Record<string, LeadFunil> = {}
    for (const l of funilRes.data ?? []) {
      const e = l.estagio as string
      if (!porEstagio[e]) porEstagio[e] = { estagio: e, total: 0, valor_total: 0 }
      porEstagio[e].total++
      porEstagio[e].valor_total += (l.valor_estimado as number) ?? 0
    }
    setFunil(Object.values(porEstagio))

    // Alertas de clientes
    const cobAtrasadas = cobAtrasRes.data ?? []
    const tarAtrasadas = tarAtrasRes.data ?? []
    const clienteMap: Record<string, ClienteAlerta> = {}

    for (const c of cobAtrasadas as Array<{ cliente_id: string; clientes: { id: string; nome: string } | null }>) {
      if (!c.cliente_id) continue
      const nome = c.clientes?.nome ?? c.cliente_id
      if (!clienteMap[c.cliente_id]) clienteMap[c.cliente_id] = { id: c.cliente_id, nome, cobrancas_atrasadas: 0, tarefas_atrasadas: 0 }
      clienteMap[c.cliente_id].cobrancas_atrasadas++
    }
    for (const t of tarAtrasadas as Array<{ cliente_id: string }>) {
      if (!t.cliente_id || !clienteMap[t.cliente_id]) continue
      clienteMap[t.cliente_id].tarefas_atrasadas++
    }
    setAlertas(Object.values(clienteMap).slice(0, 5))

    // Atividades recentes (últimas tarefas e cobranças)
    const [tarRecRes, cobRecRes] = await Promise.all([
      supabase.from('tarefas').select('titulo, status, atualizado_em, cliente:clientes(nome)').order('atualizado_em', { ascending: false }).limit(4),
      supabase.from('cobrancas').select('descricao, status, atualizado_em, cliente:clientes(nome)').order('atualizado_em', { ascending: false }).limit(3),
    ])

    const ativs: AtividadeRecente[] = []
    for (const t of tarRecRes.data ?? []) {
      ativs.push({
        tipo: 'tarefa',
        titulo: t.titulo as string,
        subtitulo: (t.cliente as { nome: string } | null)?.nome ?? 'Sem cliente',
        tempo: formatTempo(t.atualizado_em as string),
        cor: '#3B82F6',
      })
    }
    for (const c of cobRecRes.data ?? []) {
      ativs.push({
        tipo: 'cobranca',
        titulo: c.descricao as string,
        subtitulo: (c.cliente as { nome: string } | null)?.nome ?? '',
        tempo: formatTempo(c.atualizado_em as string),
        cor: '#10B981',
      })
    }
    ativs.sort((a, b) => b.tempo.localeCompare(a.tempo))
    setAtividades(ativs.slice(0, 7))

    setCarregando(false)
  }, [supabase])

  function formatTempo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime()
    const min = Math.floor(diff / 60000)
    if (min < 60) return `${min}m`
    const h = Math.floor(min / 60)
    if (h < 24) return `${h}h`
    return `${Math.floor(h / 24)}d`
  }

  useEffect(() => { carregar() }, [carregar])

  const saudacao = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Bom dia'
    if (h < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  if (carregando) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="mf-spinner" />
      </div>
    )
  }

  const deltaReceita = variacao(kpis?.receita_mes ?? 0, kpis?.receita_mes_anterior ?? 0)

  return (
    <div className="p-6 space-y-6">
      {/* Saudação */}
      <div>
        <h1 className="mf-page-title">
          {saudacao()}, {usuario?.nome?.split(' ')[0]}
        </h1>
        <p className="mf-page-subtitle">
          Aqui está o resumo de hoje —{' '}
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Alertas */}
      {kpis && kpis.receita_atrasada > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle size={18} className="text-red-500 shrink-0" />
          <p className="text-sm text-red-700">
            <strong>{formatMoedaCompleto(kpis.receita_atrasada)}</strong> em cobranças atrasadas.
            {' '}<a href="/financeiro" className="underline hover:no-underline">Ver financeiro →</a>
          </p>
        </div>
      )}

      {/* KPIs principais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Receita do mês"
          value={formatMoedaCompleto(kpis?.receita_mes ?? 0)}
          icon={<DollarSign size={20} />}
          cor="#10B981"
          delta={deltaReceita}
        />
        <StatCard
          label="Clientes ativos"
          value={kpis?.clientes_ativos ?? 0}
          icon={<Users size={20} />}
          cor="#3B82F6"
          sub={`${kpis?.clientes_inativos ?? 0} inativos`}
        />
        <StatCard
          label="Tarefas abertas"
          value={(kpis?.tarefas_pendentes ?? 0) + (kpis?.tarefas_em_andamento ?? 0)}
          icon={<CheckSquare size={20} />}
          cor="#F59E0B"
          sub={`${kpis?.tarefas_em_andamento ?? 0} em andamento`}
        />
        <StatCard
          label="Pipeline"
          value={formatMoeda(kpis?.pipeline_valor ?? 0)}
          icon={<Target size={20} />}
          cor="#8B5CF6"
          sub={`${kpis?.leads_ativos ?? 0} leads ativos`}
        />
      </div>

      {/* KPIs secundários */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="A receber (pendente)"
          value={formatMoeda(kpis?.receita_pendente ?? 0)}
          icon={<Clock size={18} />}
          cor="#6B7280"
        />
        <StatCard
          label="Tarefas concluídas"
          value={kpis?.tarefas_concluidas_mes ?? 0}
          icon={<Star size={18} />}
          cor="#10B981"
          sub="neste mês"
        />
        <StatCard
          label="Eventos hoje"
          value={kpis?.eventos_hoje ?? 0}
          icon={<Calendar size={18} />}
          cor="#FF6A00"
        />
        <StatCard
          label="Mensagens não lidas"
          value={kpis?.mensagens_nao_lidas ?? 0}
          icon={<MessageCircle size={18} />}
          cor="#EC4899"
        />
      </div>

      {/* Alertas de clientes */}
      <ClientesAlerta lista={alertas} />

      {/* Gráfico + Funil */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <GraficoBarras dados={grafico} />
        <FunilLeads dados={funil} />
      </div>

      {/* Atividades recentes */}
      {atividades.length > 0 && (
        <div className="mf-card">
          <h3 className="font-semibold text-gray-800 mb-2">Atividade recente</h3>
          <div>
            {atividades.map((a, i) => (
              <AtividadeItem key={i} item={a} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

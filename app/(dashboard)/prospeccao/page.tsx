'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createBrowserClient } from '@/lib/supabase'
import {
  Plus,
  X,
  Search,
  ChevronRight,
  Phone,
  Mail,
  MessageCircle,
  Video,
  FileText,
  StickyNote,
  User,
  Building2,
  DollarSign,
  Calendar,
  Tag,
  Edit2,
  Trash2,
  AlertTriangle,
  TrendingUp,
  Trophy,
  XCircle,
  Send,
} from 'lucide-react'
import type { Lead, Usuario } from '@/lib/types'

// ─── Tipos ───────────────────────────────────────────────────────────────────

type Interacao = {
  id: string
  lead_id: string
  usuario_id: string | null
  tipo: string
  descricao: string
  criado_em: string
  usuario?: { nome: string } | null
}

// ─── Constantes ──────────────────────────────────────────────────────────────

const ESTAGIOS: { key: string; label: string; cor: string; bg: string }[] = [
  { key: 'novo',        label: 'Novo',        cor: '#6B7280', bg: '#F3F4F6' },
  { key: 'contato',     label: 'Contato',     cor: '#3B82F6', bg: '#EFF6FF' },
  { key: 'proposta',    label: 'Proposta',    cor: '#F59E0B', bg: '#FFFBEB' },
  { key: 'negociacao',  label: 'Negociação',  cor: '#8B5CF6', bg: '#F5F3FF' },
  { key: 'ganho',       label: 'Ganho',       cor: '#10B981', bg: '#ECFDF5' },
  { key: 'perdido',     label: 'Perdido',     cor: '#EF4444', bg: '#FEF2F2' },
]

const ORIGENS: Record<string, string> = {
  indicacao:    'Indicação',
  instagram:    'Instagram',
  facebook:     'Facebook',
  google:       'Google',
  site:         'Site',
  evento:       'Evento',
  cold_outreach:'Cold Outreach',
  outro:        'Outro',
}

const TIPO_INTERACAO: { key: string; label: string; icon: React.ReactNode }[] = [
  { key: 'nota',     label: 'Nota',     icon: <StickyNote size={13} /> },
  { key: 'ligacao',  label: 'Ligação',  icon: <Phone size={13} /> },
  { key: 'email',    label: 'E-mail',   icon: <Mail size={13} /> },
  { key: 'whatsapp', label: 'WhatsApp', icon: <MessageCircle size={13} /> },
  { key: 'reuniao',  label: 'Reunião',  icon: <Video size={13} /> },
  { key: 'proposta', label: 'Proposta', icon: <FileText size={13} /> },
]

function formatMoeda(v: number | null | undefined) {
  if (!v) return '—'
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatData(d: string) {
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatDataHora(d: string) {
  return new Date(d).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ─── Form ────────────────────────────────────────────────────────────────────

type FormLead = {
  nome: string
  empresa: string
  segmento: string
  telefone: string
  email: string
  origem: string
  estagio: string
  valor_estimado: string
  responsavel_id: string
  observacoes: string
  motivo_perda: string
  data_fechamento: string
}

const FORM_VAZIO: FormLead = {
  nome: '', empresa: '', segmento: '', telefone: '', email: '',
  origem: 'indicacao', estagio: 'novo', valor_estimado: '',
  responsavel_id: '', observacoes: '', motivo_perda: '', data_fechamento: '',
}

// ─── Modal Lead ───────────────────────────────────────────────────────────────

function ModalLead({
  lead,
  responsaveis,
  onClose,
  onSalvo,
}: {
  lead: Partial<Lead> | null
  responsaveis: Usuario[]
  onClose: () => void
  onSalvo: (id: string) => void
}) {
  const supabase = createBrowserClient()
  const [form, setForm] = useState<FormLead>(FORM_VAZIO)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (lead) {
      setForm({
        nome: lead.nome ?? '',
        empresa: lead.empresa ?? '',
        segmento: lead.segmento ?? '',
        telefone: lead.telefone ?? '',
        email: lead.email ?? '',
        origem: lead.origem ?? 'indicacao',
        estagio: lead.estagio ?? 'novo',
        valor_estimado: lead.valor_estimado != null ? String(lead.valor_estimado) : '',
        responsavel_id: lead.responsavel_id ?? '',
        observacoes: lead.observacoes ?? '',
        motivo_perda: lead.motivo_perda ?? '',
        data_fechamento: lead.data_fechamento ? (lead.data_fechamento as string).slice(0, 10) : '',
      })
    } else {
      setForm(FORM_VAZIO)
    }
  }, [lead])

  const set = (k: keyof FormLead, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function salvar() {
    if (!form.nome.trim()) return setErro('Nome obrigatório.')
    setSalvando(true); setErro('')

    const payload = {
      nome: form.nome.trim(),
      empresa: form.empresa || null,
      segmento: form.segmento || null,
      telefone: form.telefone || null,
      email: form.email || null,
      origem: form.origem,
      estagio: form.estagio,
      valor_estimado: form.valor_estimado ? parseFloat(form.valor_estimado.replace(',', '.')) : null,
      responsavel_id: form.responsavel_id || null,
      observacoes: form.observacoes || null,
      motivo_perda: form.estagio === 'perdido' ? (form.motivo_perda || null) : null,
      data_fechamento: form.data_fechamento || null,
    }

    if (lead?.id) {
      const { error } = await supabase.from('leads').update(payload).eq('id', lead.id)
      if (error) { setErro(error.message); setSalvando(false); return }
      onSalvo(lead.id)
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('leads')
        .insert({ ...payload, criado_por: user?.id ?? null })
        .select('id')
        .single()
      if (error) { setErro(error.message); setSalvando(false); return }
      onSalvo(data.id)
    }
    setSalvando(false)
  }

  return (
    <div className="mf-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="mf-modal" style={{ maxWidth: 580 }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            {lead?.id ? 'Editar Lead' : 'Novo Lead'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div className="space-y-4">
          {/* Nome + Empresa */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mf-label">Nome *</label>
              <input className="mf-input" value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Nome do contato" />
            </div>
            <div>
              <label className="mf-label">Empresa</label>
              <input className="mf-input" value={form.empresa} onChange={e => set('empresa', e.target.value)} placeholder="Nome da empresa" />
            </div>
          </div>

          {/* Segmento + Origem */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mf-label">Segmento</label>
              <input className="mf-input" value={form.segmento} onChange={e => set('segmento', e.target.value)} placeholder="Ex: Restaurante, Clínica..." />
            </div>
            <div>
              <label className="mf-label">Origem</label>
              <select className="mf-input" value={form.origem} onChange={e => set('origem', e.target.value)}>
                {Object.entries(ORIGENS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>

          {/* Telefone + Email */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mf-label">Telefone / WhatsApp</label>
              <input className="mf-input" value={form.telefone} onChange={e => set('telefone', e.target.value)} placeholder="(94) 9xxxx-xxxx" />
            </div>
            <div>
              <label className="mf-label">E-mail</label>
              <input className="mf-input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="contato@empresa.com" />
            </div>
          </div>

          {/* Estágio + Valor */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mf-label">Estágio</label>
              <select className="mf-input" value={form.estagio} onChange={e => set('estagio', e.target.value)}>
                {ESTAGIOS.map(e => <option key={e.key} value={e.key}>{e.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mf-label">Valor estimado (R$)</label>
              <input className="mf-input" value={form.valor_estimado} onChange={e => set('valor_estimado', e.target.value)} placeholder="0,00" />
            </div>
          </div>

          {/* Responsável + Data fechamento */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mf-label">Responsável</label>
              <select className="mf-input" value={form.responsavel_id} onChange={e => set('responsavel_id', e.target.value)}>
                <option value="">Sem responsável</option>
                {responsaveis.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="mf-label">Previsão de fechamento</label>
              <input className="mf-input" type="date" value={form.data_fechamento} onChange={e => set('data_fechamento', e.target.value)} />
            </div>
          </div>

          {/* Motivo da perda (só quando perdido) */}
          {form.estagio === 'perdido' && (
            <div>
              <label className="mf-label">Motivo da perda</label>
              <input className="mf-input" value={form.motivo_perda} onChange={e => set('motivo_perda', e.target.value)} placeholder="Ex: Preço, concorrente, sem orçamento..." />
            </div>
          )}

          <div>
            <label className="mf-label">Observações</label>
            <textarea className="mf-input" rows={3} value={form.observacoes} onChange={e => set('observacoes', e.target.value)} placeholder="Notas sobre o lead..." />
          </div>

          {erro && (
            <p className="text-red-500 text-sm flex items-center gap-1">
              <AlertTriangle size={14} /> {erro}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button className="mf-btn-secondary" onClick={onClose}>Cancelar</button>
            <button className="mf-btn-primary" onClick={salvar} disabled={salvando}>
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Painel lateral do lead ───────────────────────────────────────────────────

function PainelLead({
  lead,
  responsaveis,
  interacoes,
  carregandoInt,
  onFechar,
  onEditar,
  onExcluir,
  onMoverEstagio,
  onNovaInteracao,
}: {
  lead: Lead
  responsaveis: Usuario[]
  interacoes: Interacao[]
  carregandoInt: boolean
  onFechar: () => void
  onEditar: () => void
  onExcluir: () => void
  onMoverEstagio: (estagio: string) => void
  onNovaInteracao: (tipo: string, descricao: string) => void
}) {
  const [tipoInt, setTipoInt] = useState('nota')
  const [textoInt, setTextoInt] = useState('')
  const [enviando, setEnviando] = useState(false)

  const estagio = ESTAGIOS.find(e => e.key === lead.estagio)
  const responsavel = responsaveis.find(u => u.id === lead.responsavel_id)
  const idxAtual = ESTAGIOS.findIndex(e => e.key === lead.estagio)
  const proximos = ESTAGIOS.filter((_, i) => i > idxAtual && !['ganho','perdido'].includes(ESTAGIOS[idxAtual]?.key ?? ''))

  async function enviarInteracao() {
    if (!textoInt.trim()) return
    setEnviando(true)
    await onNovaInteracao(tipoInt, textoInt.trim())
    setTextoInt('')
    setEnviando(false)
  }

  return (
    <div className="fixed inset-y-0 right-0 w-[420px] bg-white shadow-2xl flex flex-col z-40 border-l border-[#E9E9EC]">
      {/* Header */}
      <div className="p-5 border-b border-[#E9E9EC] flex-shrink-0">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: estagio?.bg, color: estagio?.cor }}
              >
                {estagio?.label}
              </span>
              {lead.origem && (
                <span className="text-xs text-gray-400">{ORIGENS[lead.origem] ?? lead.origem}</span>
              )}
            </div>
            <h2 className="text-lg font-bold text-gray-900 truncate">{lead.nome}</h2>
            {lead.empresa && <p className="text-sm text-gray-500">{lead.empresa}</p>}
          </div>
          <button onClick={onFechar} className="text-gray-400 hover:text-gray-600 ml-2 flex-shrink-0">
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Conteúdo scrollável */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Infos */}
        <div className="space-y-2 text-sm">
          {lead.telefone && (
            <div className="flex items-center gap-2 text-gray-700">
              <Phone size={14} className="text-gray-400" />
              <a href={`tel:${lead.telefone}`} className="hover:text-[#FF6A00]">{lead.telefone}</a>
            </div>
          )}
          {lead.email && (
            <div className="flex items-center gap-2 text-gray-700">
              <Mail size={14} className="text-gray-400" />
              <a href={`mailto:${lead.email}`} className="hover:text-[#FF6A00]">{lead.email}</a>
            </div>
          )}
          {lead.segmento && (
            <div className="flex items-center gap-2 text-gray-500">
              <Tag size={14} className="text-gray-400" /> {lead.segmento}
            </div>
          )}
          {responsavel && (
            <div className="flex items-center gap-2 text-gray-500">
              <User size={14} className="text-gray-400" /> {responsavel.nome}
            </div>
          )}
          {lead.valor_estimado != null && (
            <div className="flex items-center gap-2 font-semibold text-green-700">
              <DollarSign size={14} className="text-green-500" /> {formatMoeda(lead.valor_estimado)}
            </div>
          )}
          {lead.data_fechamento && (
            <div className="flex items-center gap-2 text-gray-500">
              <Calendar size={14} className="text-gray-400" /> Previsão: {formatData(lead.data_fechamento as string)}
            </div>
          )}
          {lead.motivo_perda && (
            <div className="flex items-center gap-2 text-red-500">
              <XCircle size={14} /> Motivo: {lead.motivo_perda}
            </div>
          )}
        </div>

        {/* Avançar estágio */}
        {!['ganho','perdido'].includes(lead.estagio) && (
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase mb-2">Mover para</p>
            <div className="flex flex-wrap gap-2">
              {ESTAGIOS.filter(e => e.key !== lead.estagio && e.key !== 'novo').map(e => (
                <button
                  key={e.key}
                  onClick={() => onMoverEstagio(e.key)}
                  className="text-xs px-3 py-1.5 rounded-lg font-medium border transition-colors"
                  style={{ borderColor: e.cor + '44', color: e.cor, backgroundColor: e.bg }}
                >
                  {e.key === 'ganho' && <Trophy size={11} className="inline mr-1" />}
                  {e.key === 'perdido' && <XCircle size={11} className="inline mr-1" />}
                  {e.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Observações */}
        {lead.observacoes && (
          <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-600">
            {lead.observacoes}
          </div>
        )}

        {/* Histórico de interações */}
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase mb-3">Histórico</p>
          {carregandoInt ? (
            <div className="flex justify-center py-4"><div className="mf-spinner" /></div>
          ) : interacoes.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Nenhuma interação registrada.</p>
          ) : (
            <div className="space-y-3">
              {interacoes.map(int => {
                const tipoInfo = TIPO_INTERACAO.find(t => t.key === int.tipo)
                return (
                  <div key={int.id} className="flex gap-3">
                    <div className="mt-0.5 text-gray-400 flex-shrink-0">{tipoInfo?.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-medium text-gray-600">{tipoInfo?.label}</span>
                        <span className="text-xs text-gray-400">{formatDataHora(int.criado_em)}</span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">{int.descricao}</p>
                      {int.usuario?.nome && (
                        <p className="text-xs text-gray-400 mt-0.5">{int.usuario.nome}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer: nova interação */}
      <div className="p-4 border-t border-[#E9E9EC] flex-shrink-0 space-y-2">
        <div className="flex gap-1 flex-wrap">
          {TIPO_INTERACAO.map(t => (
            <button
              key={t.key}
              onClick={() => setTipoInt(t.key)}
              className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg border transition-colors ${
                tipoInt === t.key
                  ? 'bg-[#FF6A00] text-white border-[#FF6A00]'
                  : 'text-gray-500 border-[#E9E9EC] hover:border-gray-300'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            className="mf-input flex-1"
            value={textoInt}
            onChange={e => setTextoInt(e.target.value)}
            placeholder="Registrar interação..."
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && enviarInteracao()}
          />
          <button
            onClick={enviarInteracao}
            disabled={enviando || !textoInt.trim()}
            className="mf-btn-primary px-3 py-2 disabled:opacity-50"
          >
            <Send size={15} />
          </button>
        </div>
      </div>

      {/* Ações */}
      <div className="px-5 pb-4 flex justify-between items-center border-t border-[#E9E9EC] pt-3 flex-shrink-0">
        <button
          onClick={onExcluir}
          className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1"
        >
          <Trash2 size={14} /> Excluir
        </button>
        <button className="mf-btn-secondary text-sm flex items-center gap-1" onClick={onEditar}>
          <Edit2 size={14} /> Editar
        </button>
      </div>
    </div>
  )
}

// ─── Card Kanban ──────────────────────────────────────────────────────────────

function CardLead({
  lead,
  responsaveis,
  onClick,
}: {
  lead: Lead
  responsaveis: Usuario[]
  onClick: () => void
}) {
  const responsavel = responsaveis.find(u => u.id === lead.responsavel_id)
  const estagio = ESTAGIOS.find(e => e.key === lead.estagio)

  return (
    <button
      onClick={onClick}
      className="w-full text-left mf-card p-3 hover:shadow-md transition-shadow space-y-2"
    >
      <div className="font-semibold text-gray-900 text-sm leading-tight">{lead.nome}</div>

      {lead.empresa && (
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Building2 size={11} /> {lead.empresa}
        </div>
      )}

      {lead.segmento && (
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Tag size={11} /> {lead.segmento}
        </div>
      )}

      <div className="flex items-center justify-between pt-1">
        {lead.valor_estimado != null ? (
          <span className="text-xs font-semibold text-green-700">
            {formatMoeda(lead.valor_estimado)}
          </span>
        ) : (
          <span />
        )}

        {responsavel && (
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <User size={10} /> {responsavel.nome.split(' ')[0]}
          </span>
        )}
      </div>

      {lead.data_fechamento && (
        <div className="text-xs text-gray-400 flex items-center gap-1">
          <Calendar size={10} /> {formatData(lead.data_fechamento as string)}
        </div>
      )}

      {lead.origem && (
        <span
          className="inline-block text-xs px-1.5 py-0.5 rounded"
          style={{ backgroundColor: estagio?.bg, color: estagio?.cor }}
        >
          {ORIGENS[lead.origem] ?? lead.origem}
        </span>
      )}
    </button>
  )
}

// ─── Coluna Kanban ────────────────────────────────────────────────────────────

function ColunaKanban({
  estagio,
  leads,
  responsaveis,
  onLeadClick,
  onNovoClick,
}: {
  estagio: typeof ESTAGIOS[0]
  leads: Lead[]
  responsaveis: Usuario[]
  onLeadClick: (l: Lead) => void
  onNovoClick: () => void
}) {
  const totalValor = leads.reduce((acc, l) => acc + (l.valor_estimado ?? 0), 0)

  return (
    <div className="flex flex-col min-w-[240px] max-w-[260px]">
      {/* Header da coluna */}
      <div
        className="rounded-t-xl px-3 py-2.5 flex items-center justify-between"
        style={{ backgroundColor: estagio.bg, borderBottom: `2px solid ${estagio.cor}` }}
      >
        <div>
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: estagio.cor }}
            />
            <span className="font-semibold text-sm" style={{ color: estagio.cor }}>
              {estagio.label}
            </span>
            <span
              className="text-xs font-bold px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: estagio.cor + '22', color: estagio.cor }}
            >
              {leads.length}
            </span>
          </div>
          {totalValor > 0 && (
            <div className="text-xs mt-0.5 pl-4" style={{ color: estagio.cor + 'aa' }}>
              {formatMoeda(totalValor)}
            </div>
          )}
        </div>
        {!['ganho','perdido'].includes(estagio.key) && (
          <button
            onClick={onNovoClick}
            className="p-1 rounded hover:bg-white/60 transition-colors"
            title="Novo lead"
          >
            <Plus size={14} style={{ color: estagio.cor }} />
          </button>
        )}
      </div>

      {/* Cards */}
      <div className="flex-1 bg-gray-50 rounded-b-xl p-2 space-y-2 min-h-[200px]">
        {leads.length === 0 ? (
          <div className="text-center text-xs text-gray-300 py-8">Sem leads</div>
        ) : (
          leads.map(l => (
            <CardLead
              key={l.id}
              lead={l}
              responsaveis={responsaveis}
              onClick={() => onLeadClick(l)}
            />
          ))
        )}
      </div>
    </div>
  )
}

// ─── Resumo stats ─────────────────────────────────────────────────────────────

function StatsBar({ leads }: { leads: Lead[] }) {
  const ganhos = leads.filter(l => l.estagio === 'ganho')
  const ativos = leads.filter(l => !['ganho','perdido'].includes(l.estagio))
  const valorPipeline = ativos.reduce((s, l) => s + (l.valor_estimado ?? 0), 0)
  const valorGanho = ganhos.reduce((s, l) => s + (l.valor_estimado ?? 0), 0)
  const taxaConversao = leads.length > 0 ? Math.round((ganhos.length / leads.length) * 100) : 0

  return (
    <div className="grid grid-cols-4 gap-4">
      <div className="mf-stat-card">
        <div className="mf-stat-label">Total de Leads</div>
        <div className="mf-stat-value">{leads.length}</div>
      </div>
      <div className="mf-stat-card">
        <div className="mf-stat-label">Pipeline Ativo</div>
        <div className="mf-stat-value text-blue-600">{formatMoeda(valorPipeline)}</div>
      </div>
      <div className="mf-stat-card">
        <div className="mf-stat-label">Valor Ganho</div>
        <div className="mf-stat-value text-green-600">{formatMoeda(valorGanho)}</div>
      </div>
      <div className="mf-stat-card">
        <div className="mf-stat-label flex items-center gap-1"><TrendingUp size={12} /> Conversão</div>
        <div className="mf-stat-value text-[#FF6A00]">{taxaConversao}%</div>
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function ProspeccaoPage() {
  const supabase = createBrowserClient()

  const [leads, setLeads] = useState<Lead[]>([])
  const [responsaveis, setResponsaveis] = useState<Usuario[]>([])
  const [carregando, setCarregando] = useState(true)

  const [modalLead, setModalLead] = useState(false)
  const [leadEditando, setLeadEditando] = useState<Partial<Lead> | null>(null)
  const [leadSelecionado, setLeadSelecionado] = useState<Lead | null>(null)

  const [interacoes, setInteracoes] = useState<Interacao[]>([])
  const [carregandoInt, setCarregandoInt] = useState(false)

  const [busca, setBusca] = useState('')
  const [filtroResp, setFiltroResp] = useState('')
  const [filtroOrigem, setFiltroOrigem] = useState('')

  const carregar = useCallback(async () => {
    setCarregando(true)
    const [leadsRes, respRes] = await Promise.all([
      supabase
        .from('leads')
        .select('*')
        .order('criado_em', { ascending: false }),
      supabase
        .from('usuarios')
        .select('id, nome')
        .in('papel', ['admin', 'equipe'])
        .eq('ativo', true)
        .order('nome'),
    ])
    setLeads((leadsRes.data as Lead[]) ?? [])
    setResponsaveis((respRes.data as Usuario[]) ?? [])
    setCarregando(false)
  }, [supabase])

  useEffect(() => { carregar() }, [carregar])

  const carregarInteracoes = useCallback(async (leadId: string) => {
    setCarregandoInt(true)
    const { data } = await supabase
      .from('interacoes_lead')
      .select('*, usuario:usuario_id(nome)')
      .eq('lead_id', leadId)
      .order('criado_em', { ascending: false })
    setInteracoes((data as Interacao[]) ?? [])
    setCarregandoInt(false)
  }, [supabase])

  useEffect(() => {
    if (leadSelecionado) carregarInteracoes(leadSelecionado.id)
    else setInteracoes([])
  }, [leadSelecionado, carregarInteracoes])

  const leadsFiltrados = useMemo(() => {
    return leads.filter(l => {
      if (busca) {
        const q = busca.toLowerCase()
        if (!l.nome.toLowerCase().includes(q) &&
            !(l.empresa ?? '').toLowerCase().includes(q) &&
            !(l.segmento ?? '').toLowerCase().includes(q)) return false
      }
      if (filtroResp && l.responsavel_id !== filtroResp) return false
      if (filtroOrigem && l.origem !== filtroOrigem) return false
      return true
    })
  }, [leads, busca, filtroResp, filtroOrigem])

  async function excluirLead(id: string) {
    if (!confirm('Excluir este lead?')) return
    await supabase.from('leads').delete().eq('id', id)
    setLeadSelecionado(null)
    carregar()
  }

  async function moverEstagio(leadId: string, estagio: string) {
    await supabase.from('leads').update({ estagio }).eq('id', leadId)
    setLeadSelecionado(prev => prev ? { ...prev, estagio } : null)
    carregar()
  }

  async function novaInteracao(tipo: string, descricao: string) {
    if (!leadSelecionado) return
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('interacoes_lead').insert({
      lead_id: leadSelecionado.id,
      usuario_id: user?.id ?? null,
      tipo,
      descricao,
    })
    carregarInteracoes(leadSelecionado.id)
  }

  function abrirNovoComEstagio(estagio: string) {
    setLeadEditando({ estagio })
    setModalLead(true)
  }

  function aoSalvarLead(id: string) {
    setModalLead(false)
    setLeadEditando(null)
    carregar()
  }

  return (
    <div className="p-6 space-y-5">
      {/* Cabeçalho */}
      <div className="mf-page-header">
        <div>
          <h1 className="mf-page-title">Prospecção</h1>
          <p className="mf-page-subtitle">Funil de vendas e acompanhamento de leads</p>
        </div>
        <button
          className="mf-btn-primary flex items-center gap-2"
          onClick={() => { setLeadEditando(null); setModalLead(true) }}
        >
          <Plus size={16} /> Novo Lead
        </button>
      </div>

      {/* Stats */}
      {!carregando && <StatsBar leads={leads} />}

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-[200px] max-w-[300px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="mf-input pl-9"
            placeholder="Buscar lead, empresa, segmento..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
        </div>

        <select className="mf-input max-w-[180px]" value={filtroResp} onChange={e => setFiltroResp(e.target.value)}>
          <option value="">Todos responsáveis</option>
          {responsaveis.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
        </select>

        <select className="mf-input max-w-[160px]" value={filtroOrigem} onChange={e => setFiltroOrigem(e.target.value)}>
          <option value="">Todas as origens</option>
          {Object.entries(ORIGENS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {/* Kanban */}
      {carregando ? (
        <div className="flex items-center justify-center py-20">
          <div className="mf-spinner" />
        </div>
      ) : (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-3 min-w-max">
            {ESTAGIOS.map(estagio => (
              <ColunaKanban
                key={estagio.key}
                estagio={estagio}
                leads={leadsFiltrados.filter(l => l.estagio === estagio.key)}
                responsaveis={responsaveis}
                onLeadClick={l => setLeadSelecionado(l)}
                onNovoClick={() => abrirNovoComEstagio(estagio.key)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Modal novo/editar lead */}
      {modalLead && (
        <ModalLead
          lead={leadEditando}
          responsaveis={responsaveis}
          onClose={() => { setModalLead(false); setLeadEditando(null) }}
          onSalvo={aoSalvarLead}
        />
      )}

      {/* Painel lateral do lead selecionado */}
      {leadSelecionado && (
        <>
          <div className="fixed inset-0 bg-black/20 z-30" onClick={() => setLeadSelecionado(null)} />
          <PainelLead
            lead={leadSelecionado}
            responsaveis={responsaveis}
            interacoes={interacoes}
            carregandoInt={carregandoInt}
            onFechar={() => setLeadSelecionado(null)}
            onEditar={() => { setLeadEditando(leadSelecionado); setLeadSelecionado(null); setModalLead(true) }}
            onExcluir={() => excluirLead(leadSelecionado.id)}
            onMoverEstagio={e => moverEstagio(leadSelecionado.id, e)}
            onNovaInteracao={novaInteracao}
          />
        </>
      )}
    </div>
  )
}

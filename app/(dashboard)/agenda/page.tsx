'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from "@/lib/supabase";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Calendar,
  Clock,
  MapPin,
  User,
  Users,
  RefreshCw,
  Briefcase,
  Layers,
  Edit2,
  Trash2,
  AlertTriangle,
} from 'lucide-react'
import type { EventoAgenda, Cliente, Usuario } from '@/lib/types'

// ─── Helpers ────────────────────────────────────────────────────────────────

function hoje() {
  return new Date().toISOString().slice(0, 10)
}

function inicioSemana(ref: Date): Date {
  const d = new Date(ref)
  d.setDate(d.getDate() - d.getDay()) // domingo
  d.setHours(0, 0, 0, 0)
  return d
}

function diasDaSemana(ref: Date): Date[] {
  const start = inicioSemana(ref)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
}

function inicioMes(ref: Date): Date {
  return new Date(ref.getFullYear(), ref.getMonth(), 1)
}

function diasDoMes(ref: Date): (Date | null)[] {
  const primeiroDia = inicioMes(ref)
  const ultimoDia = new Date(ref.getFullYear(), ref.getMonth() + 1, 0)
  const offset = primeiroDia.getDay() // 0=dom
  const days: (Date | null)[] = []
  for (let i = 0; i < offset; i++) days.push(null)
  for (let d = 1; d <= ultimoDia.getDate(); d++) {
    days.push(new Date(ref.getFullYear(), ref.getMonth(), d))
  }
  return days
}

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10)
}

function isoLocal(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function formatHour(d: Date) {
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(d: Date) {
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const DIAS_SEMANA_CURTO = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const COR_TIPO: Record<string, string> = {
  reuniao: '#3B82F6',
  tarefa: '#F59E0B',
  entrega: '#10B981',
  gravacao: '#FF6A00',
  outro: '#8B5CF6',
}

const LABEL_TIPO: Record<string, string> = {
  reuniao: 'Reunião',
  tarefa: 'Tarefa',
  entrega: 'Entrega',
  gravacao: 'Gravação',
  outro: 'Outro',
}

const LABEL_RECORRENCIA: Record<string, string> = {
  diario: 'Diário',
  semanal: 'Semanal',
  mensal: 'Mensal',
  anual: 'Anual',
}

// ─── Form state ──────────────────────────────────────────────────────────────

type FormState = {
  titulo: string
  descricao: string
  tipo: string
  cliente_id: string
  responsavel_id: string
  data_inicio: string
  data_fim: string
  dia_todo: boolean
  local: string
  recorrente: boolean
  recorrencia_tipo: string
  recorrencia_fim: string
  cor: string
}

const FORM_VAZIO: FormState = {
  titulo: '',
  descricao: '',
  tipo: 'reuniao',
  cliente_id: '',
  responsavel_id: '',
  data_inicio: '',
  data_fim: '',
  dia_todo: false,
  local: '',
  recorrente: false,
  recorrencia_tipo: 'semanal',
  recorrencia_fim: '',
  cor: '#FF6A00',
}

// ─── Modal de evento ─────────────────────────────────────────────────────────

function ModalEvento({
  evento,
  clientes,
  responsaveis,
  onClose,
  onSalvo,
}: {
  evento: Partial<EventoAgenda> | null
  clientes: Cliente[]
  responsaveis: Usuario[]
  onClose: () => void
  onSalvo: () => void
}) {
  const [form, setForm] = useState<FormState>(FORM_VAZIO)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (evento) {
      const di = new Date(evento.data_inicio ?? '')
      const df = new Date(evento.data_fim ?? '')
      setForm({
        titulo: evento.titulo ?? '',
        descricao: evento.descricao ?? '',
        tipo: evento.tipo ?? 'reuniao',
        cliente_id: evento.cliente_id ?? '',
        responsavel_id: evento.responsavel_id ?? '',
        data_inicio: evento.data_inicio ? isoLocal(di) : '',
        data_fim: evento.data_fim ? isoLocal(df) : '',
        dia_todo: evento.dia_todo ?? false,
        local: evento.local ?? '',
        recorrente: evento.recorrente ?? false,
        recorrencia_tipo: evento.recorrencia_tipo ?? 'semanal',
        recorrencia_fim: evento.recorrencia_fim
          ? (evento.recorrencia_fim as string).slice(0, 10)
          : '',
        cor: evento.cor ?? '#FF6A00',
      })
    } else {
      setForm(FORM_VAZIO)
    }
  }, [evento])

  const set = (k: keyof FormState, v: string | boolean) =>
    setForm(f => ({ ...f, [k]: v }))

  async function salvar() {
    if (!form.titulo.trim()) return setErro('Título obrigatório.')
    if (!form.data_inicio) return setErro('Data/hora de início obrigatória.')
    if (!form.data_fim) return setErro('Data/hora de término obrigatória.')
    if (form.data_fim < form.data_inicio) return setErro('Término deve ser após o início.')
    setSalvando(true)
    setErro('')

    const payload = {
      titulo: form.titulo.trim(),
      descricao: form.descricao || null,
      tipo: form.tipo,
      cliente_id: form.cliente_id || null,
      responsavel_id: form.responsavel_id || null,
      data_inicio: new Date(form.data_inicio).toISOString(),
      data_fim: new Date(form.data_fim).toISOString(),
      dia_todo: form.dia_todo,
      local: form.local || null,
      recorrente: form.recorrente,
      recorrencia_tipo: form.recorrente ? form.recorrencia_tipo : null,
      recorrencia_fim: form.recorrente && form.recorrencia_fim ? form.recorrencia_fim : null,
      cor: form.cor || '#FF6A00',
    }

    if (evento?.id) {
      const { error } = await supabase
        .from('eventos_agenda')
        .update(payload)
        .eq('id', evento.id)
      if (error) { setErro(error.message); setSalvando(false); return }
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase.from('eventos_agenda').insert({
        ...payload,
        criado_por: user?.id ?? null,
      })
      if (error) { setErro(error.message); setSalvando(false); return }
    }
    setSalvando(false)
    onSalvo()
  }

  return (
    <div className="mf-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="mf-modal" style={{ maxWidth: 560 }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            {evento?.id ? 'Editar Evento' : 'Novo Evento'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Título + cor */}
          <div className="flex gap-3 items-start">
            <div className="flex-1">
              <label className="mf-label">Título *</label>
              <input
                className="mf-input"
                value={form.titulo}
                onChange={e => set('titulo', e.target.value)}
                placeholder="Ex: Reunião de briefing"
              />
            </div>
            <div>
              <label className="mf-label">Cor</label>
              <input
                type="color"
                value={form.cor}
                onChange={e => set('cor', e.target.value)}
                className="h-10 w-12 cursor-pointer rounded-lg border border-[#E9E9EC] p-1"
              />
            </div>
          </div>

          {/* Tipo */}
          <div>
            <label className="mf-label">Tipo</label>
            <select
              className="mf-input"
              value={form.tipo}
              onChange={e => set('tipo', e.target.value)}
            >
              <option value="reuniao">Reunião</option>
              <option value="tarefa">Tarefa</option>
              <option value="entrega">Entrega</option>
              <option value="gravacao">Gravação</option>
              <option value="outro">Outro</option>
            </select>
          </div>

          {/* Dia todo */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.dia_todo}
              onChange={e => set('dia_todo', e.target.checked)}
              className="w-4 h-4 accent-[#FF6A00]"
            />
            <span className="text-sm text-gray-700">Dia todo</span>
          </label>

          {/* Datas */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mf-label">Início *</label>
              <input
                className="mf-input"
                type={form.dia_todo ? 'date' : 'datetime-local'}
                value={form.data_inicio}
                onChange={e => set('data_inicio', e.target.value)}
              />
            </div>
            <div>
              <label className="mf-label">Término *</label>
              <input
                className="mf-input"
                type={form.dia_todo ? 'date' : 'datetime-local'}
                value={form.data_fim}
                onChange={e => set('data_fim', e.target.value)}
              />
            </div>
          </div>

          {/* Cliente + Responsável */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mf-label">Cliente</label>
              <select
                className="mf-input"
                value={form.cliente_id}
                onChange={e => set('cliente_id', e.target.value)}
              >
                <option value="">Todos / sem cliente</option>
                {clientes.map(c => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mf-label">Responsável</label>
              <select
                className="mf-input"
                value={form.responsavel_id}
                onChange={e => set('responsavel_id', e.target.value)}
              >
                <option value="">Sem responsável</option>
                {responsaveis.map(u => (
                  <option key={u.id} value={u.id}>{u.nome}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Local + Descrição */}
          <div>
            <label className="mf-label">Local / Link</label>
            <input
              className="mf-input"
              value={form.local}
              onChange={e => set('local', e.target.value)}
              placeholder="Ex: Escritório, Meet, Zoom..."
            />
          </div>

          <div>
            <label className="mf-label">Descrição</label>
            <textarea
              className="mf-input"
              rows={2}
              value={form.descricao}
              onChange={e => set('descricao', e.target.value)}
              placeholder="Detalhes do evento..."
            />
          </div>

          {/* Recorrência */}
          <div className="border border-[#E9E9EC] rounded-xl p-4 space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.recorrente}
                onChange={e => set('recorrente', e.target.checked)}
                className="w-4 h-4 accent-[#FF6A00]"
              />
              <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <RefreshCw size={14} />
                Evento recorrente
              </span>
            </label>

            {form.recorrente && (
              <div className="grid grid-cols-2 gap-3 pl-6">
                <div>
                  <label className="mf-label">Frequência</label>
                  <select
                    className="mf-input"
                    value={form.recorrencia_tipo}
                    onChange={e => set('recorrencia_tipo', e.target.value)}
                  >
                    <option value="diario">Diário</option>
                    <option value="semanal">Semanal</option>
                    <option value="mensal">Mensal</option>
                    <option value="anual">Anual</option>
                  </select>
                </div>
                <div>
                  <label className="mf-label">Repetir até</label>
                  <input
                    className="mf-input"
                    type="date"
                    value={form.recorrencia_fim}
                    onChange={e => set('recorrencia_fim', e.target.value)}
                  />
                </div>
              </div>
            )}
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

// ─── Modal de detalhe do evento ──────────────────────────────────────────────

function ModalDetalhe({
  evento,
  clientes,
  responsaveis,
  onClose,
  onEditar,
  onExcluir,
}: {
  evento: EventoAgenda
  clientes: Cliente[]
  responsaveis: Usuario[]
  onClose: () => void
  onEditar: () => void
  onExcluir: () => void
}) {
  const cliente = clientes.find(c => c.id === evento.cliente_id)
  const responsavel = responsaveis.find(u => u.id === evento.responsavel_id)
  const di = new Date(evento.data_inicio)
  const df = new Date(evento.data_fim)

  return (
    <div className="mf-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="mf-modal" style={{ maxWidth: 480 }}>
        {/* header colorido */}
        <div
          className="rounded-xl p-4 mb-4 flex items-start justify-between"
          style={{ backgroundColor: (evento.cor ?? '#FF6A00') + '22' }}
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className="inline-block w-3 h-3 rounded-full"
                style={{ backgroundColor: evento.cor ?? '#FF6A00' }}
              />
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {LABEL_TIPO[evento.tipo] ?? evento.tipo}
              </span>
              {evento.recorrente && (
                <span className="text-xs text-gray-400 flex items-center gap-0.5">
                  <RefreshCw size={10} /> {LABEL_RECORRENCIA[evento.recorrencia_tipo ?? ''] ?? evento.recorrencia_tipo}
                </span>
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{evento.titulo}</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 ml-2">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3 text-sm">
          {/* Data / hora */}
          <div className="flex items-start gap-2 text-gray-700">
            <Clock size={15} className="mt-0.5 text-gray-400 shrink-0" />
            <div>
              {evento.dia_todo ? (
                <span>
                  {formatDate(di)}
                  {isoDate(di) !== isoDate(df) && ` → ${formatDate(df)}`}
                  {' '}· Dia todo
                </span>
              ) : (
                <span>
                  {formatDate(di)}, {formatHour(di)} → {formatHour(df)}
                  {isoDate(di) !== isoDate(df) && ` (${formatDate(df)})`}
                </span>
              )}
            </div>
          </div>

          {/* Local */}
          {evento.local && (
            <div className="flex items-center gap-2 text-gray-700">
              <MapPin size={15} className="text-gray-400 shrink-0" />
              <span>{evento.local}</span>
            </div>
          )}

          {/* Cliente */}
          {cliente && (
            <div className="flex items-center gap-2 text-gray-700">
              <Briefcase size={15} className="text-gray-400 shrink-0" />
              <span>{cliente.nome}</span>
            </div>
          )}

          {/* Responsável */}
          {responsavel && (
            <div className="flex items-center gap-2 text-gray-700">
              <User size={15} className="text-gray-400 shrink-0" />
              <span>{responsavel.nome}</span>
            </div>
          )}

          {/* Recorrência */}
          {evento.recorrente && evento.recorrencia_fim && (
            <div className="flex items-center gap-2 text-gray-500">
              <RefreshCw size={15} className="text-gray-400 shrink-0" />
              <span>
                {LABEL_RECORRENCIA[evento.recorrencia_tipo ?? ''] ?? evento.recorrencia_tipo}
                {' '}até {formatDate(new Date(evento.recorrencia_fim as string))}
              </span>
            </div>
          )}

          {/* Descrição */}
          {evento.descricao && (
            <p className="text-gray-600 leading-relaxed border-t border-[#E9E9EC] pt-3">
              {evento.descricao}
            </p>
          )}
        </div>

        <div className="flex justify-between items-center mt-6 pt-4 border-t border-[#E9E9EC]">
          <button
            onClick={onExcluir}
            className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1"
          >
            <Trash2 size={14} /> Excluir
          </button>
          <div className="flex gap-2">
            <button className="mf-btn-secondary" onClick={onClose}>Fechar</button>
            <button className="mf-btn-primary" onClick={onEditar}>
              <Edit2 size={14} /> Editar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Chip de evento no calendário ────────────────────────────────────────────

function ChipEvento({ evento, onClick }: { evento: EventoAgenda; onClick: () => void }) {
  const cor = evento.cor ?? COR_TIPO[evento.tipo] ?? '#FF6A00'
  return (
    <button
      onClick={onClick}
      className="w-full text-left text-xs rounded px-1.5 py-0.5 truncate font-medium leading-5"
      style={{ backgroundColor: cor + '22', color: cor, border: `1px solid ${cor}44` }}
      title={evento.titulo}
    >
      {!evento.dia_todo && (
        <span className="opacity-70 mr-1">
          {formatHour(new Date(evento.data_inicio))}
        </span>
      )}
      {evento.titulo}
    </button>
  )
}

// ─── Visão Semana ─────────────────────────────────────────────────────────────

function ViewSemana({
  dias,
  eventos,
  onDiaClick,
  onEventoClick,
}: {
  dias: Date[]
  eventos: EventoAgenda[]
  onDiaClick: (d: Date) => void
  onEventoClick: (e: EventoAgenda) => void
}) {
  const hj = hoje()

  return (
    <div className="grid grid-cols-7 gap-px bg-[#E9E9EC] rounded-xl overflow-hidden">
      {/* Cabeçalho */}
      {dias.map((d, i) => (
        <div
          key={i}
          className={`bg-white px-2 py-2 text-center ${isoDate(d) === hj ? 'bg-orange-50' : ''}`}
        >
          <div className="text-xs text-gray-400 font-medium uppercase">{DIAS_SEMANA_CURTO[i]}</div>
          <div
            className={`text-lg font-bold mt-0.5 w-8 h-8 mx-auto flex items-center justify-center rounded-full cursor-pointer ${
              isoDate(d) === hj
                ? 'bg-[#FF6A00] text-white'
                : 'text-gray-800 hover:bg-gray-100'
            }`}
            onClick={() => onDiaClick(d)}
          >
            {d.getDate()}
          </div>
        </div>
      ))}

      {/* Células com eventos */}
      {dias.map((d, i) => {
        const dStr = isoDate(d)
        const evs = eventos.filter(ev => {
          const start = isoDate(new Date(ev.data_inicio))
          const end = isoDate(new Date(ev.data_fim))
          return start <= dStr && end >= dStr
        })
        return (
          <div
            key={i}
            className={`bg-white min-h-[120px] p-1.5 space-y-1 cursor-pointer hover:bg-gray-50 ${
              isoDate(d) === hj ? 'bg-orange-50 hover:bg-orange-50' : ''
            }`}
            onClick={() => onDiaClick(d)}
          >
            {evs.map(ev => (
              <ChipEvento
                key={ev.id}
                evento={ev}
                onClick={e => { e.stopPropagation(); onEventoClick(ev) }}
              />
            ))}
          </div>
        )
      })}
    </div>
  )
}

// ─── Visão Mês ───────────────────────────────────────────────────────────────

function ViewMes({
  ref: refDate,
  eventos,
  onDiaClick,
  onEventoClick,
}: {
  ref: Date
  eventos: EventoAgenda[]
  onDiaClick: (d: Date) => void
  onEventoClick: (e: EventoAgenda) => void
}) {
  const hj = hoje()
  const dias = diasDoMes(refDate)

  return (
    <div className="rounded-xl overflow-hidden border border-[#E9E9EC]">
      {/* Cabeçalho semana */}
      <div className="grid grid-cols-7 bg-gray-50 border-b border-[#E9E9EC]">
        {DIAS_SEMANA_CURTO.map(d => (
          <div key={d} className="text-center text-xs font-medium text-gray-400 uppercase py-2">
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7">
        {dias.map((d, i) => {
          if (!d) {
            return <div key={`null-${i}`} className="bg-gray-50 min-h-[90px] border-b border-r border-[#E9E9EC]" />
          }
          const dStr = isoDate(d)
          const evs = eventos
            .filter(ev => {
              const start = isoDate(new Date(ev.data_inicio))
              const end = isoDate(new Date(ev.data_fim))
              return start <= dStr && end >= dStr
            })
            .slice(0, 3)

          return (
            <div
              key={dStr}
              onClick={() => onDiaClick(d)}
              className={`min-h-[90px] p-1.5 border-b border-r border-[#E9E9EC] cursor-pointer hover:bg-gray-50 ${
                dStr === hj ? 'bg-orange-50' : 'bg-white'
              }`}
            >
              <div
                className={`text-sm font-semibold w-6 h-6 flex items-center justify-center rounded-full mb-1 ${
                  dStr === hj ? 'bg-[#FF6A00] text-white' : 'text-gray-700'
                }`}
              >
                {d.getDate()}
              </div>
              <div className="space-y-0.5">
                {evs.map(ev => (
                  <ChipEvento
                    key={ev.id}
                    evento={ev}
                    onClick={e => { e.stopPropagation(); onEventoClick(ev) }}
                  />
                ))}
                {eventos.filter(ev => {
                  const start = isoDate(new Date(ev.data_inicio))
                  const end = isoDate(new Date(ev.data_fim))
                  return start <= dStr && end >= dStr
                }).length > 3 && (
                  <div className="text-xs text-gray-400 pl-1">
                    +{eventos.filter(ev => {
                      const start = isoDate(new Date(ev.data_inicio))
                      const end = isoDate(new Date(ev.data_fim))
                      return start <= dStr && end >= dStr
                    }).length - 3} mais
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Painel lateral de agenda do dia ─────────────────────────────────────────

function PainelDia({
  dia,
  eventos,
  onEventoClick,
  onNovoClick,
}: {
  dia: Date
  eventos: EventoAgenda[]
  onEventoClick: (e: EventoAgenda) => void
  onNovoClick: () => void
}) {
  const dStr = isoDate(dia)
  const evDia = eventos
    .filter(ev => {
      const start = isoDate(new Date(ev.data_inicio))
      const end = isoDate(new Date(ev.data_fim))
      return start <= dStr && end >= dStr
    })
    .sort((a, b) => a.data_inicio.localeCompare(b.data_inicio))

  return (
    <div className="mf-card h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-xs text-gray-400 uppercase font-medium">
            {DIAS_SEMANA_CURTO[dia.getDay()]}
          </div>
          <div className="text-2xl font-bold text-gray-900">{dia.getDate()}</div>
          <div className="text-sm text-gray-500">{MESES[dia.getMonth()]} {dia.getFullYear()}</div>
        </div>
        <button
          onClick={onNovoClick}
          className="mf-btn-primary py-1.5 px-3 text-sm flex items-center gap-1"
        >
          <Plus size={14} /> Novo
        </button>
      </div>

      {evDia.length === 0 ? (
        <div className="mf-empty flex-1">
          <div className="mf-empty-icon"><Calendar size={28} /></div>
          <div className="mf-empty-title">Sem eventos neste dia</div>
          <p className="text-sm text-gray-400">Clique em "Novo" para adicionar.</p>
        </div>
      ) : (
        <div className="space-y-2 overflow-y-auto flex-1">
          {evDia.map(ev => {
            const cor = ev.cor ?? COR_TIPO[ev.tipo] ?? '#FF6A00'
            return (
              <button
                key={ev.id}
                onClick={() => onEventoClick(ev)}
                className="w-full text-left rounded-xl p-3 hover:shadow-sm transition-shadow"
                style={{ backgroundColor: cor + '12', borderLeft: `3px solid ${cor}` }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs font-medium px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: cor + '22', color: cor }}
                  >
                    {LABEL_TIPO[ev.tipo] ?? ev.tipo}
                  </span>
                  {ev.recorrente && <RefreshCw size={11} className="text-gray-400" />}
                </div>
                <div className="font-medium text-gray-900 mt-1 text-sm">{ev.titulo}</div>
                {!ev.dia_todo && (
                  <div className="text-xs text-gray-500 mt-0.5">
                    {formatHour(new Date(ev.data_inicio))} – {formatHour(new Date(ev.data_fim))}
                  </div>
                )}
                {ev.local && (
                  <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                    <MapPin size={10} /> {ev.local}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function AgendaPage() {

  const [visao, setVisao] = useState<'semana' | 'mes'>('semana')
  const [refDate, setRefDate] = useState(new Date())
  const [diaSelecionado, setDiaSelecionado] = useState(new Date())

  const [eventos, setEventos] = useState<EventoAgenda[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [responsaveis, setResponsaveis] = useState<Usuario[]>([])

  const [carregando, setCarregando] = useState(true)
  const [modalNovo, setModalNovo] = useState(false)
  const [eventoEditando, setEventoEditando] = useState<Partial<EventoAgenda> | null>(null)
  const [eventoDetalhe, setEventoDetalhe] = useState<EventoAgenda | null>(null)

  // Filtros
  const [filtroCliente, setFiltroCliente] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroResp, setFiltroResp] = useState('')

  // Intervalo do calendário visível
  const intervalo = useMemo(() => {
    if (visao === 'semana') {
      const dias = diasDaSemana(refDate)
      return { inicio: isoDate(dias[0]), fim: isoDate(dias[6]) }
    } else {
      const prim = inicioMes(refDate)
      const ult = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 0)
      return { inicio: isoDate(prim), fim: isoDate(ult) }
    }
  }, [visao, refDate])

  const carregar = useCallback(async () => {
    setCarregando(true)
    const [evRes, clRes, usRes] = await Promise.all([
      supabase
        .from('eventos_agenda')
        .select('*')
        .gte('data_inicio', intervalo.inicio + 'T00:00:00')
        .lte('data_inicio', intervalo.fim + 'T23:59:59')
        .order('data_inicio'),
      supabase.from('clientes').select('id, nome').eq('ativo', true).order('nome'),
      supabase
        .from('usuarios')
        .select('id, nome')
        .in('papel', ['admin', 'equipe'])
        .eq('ativo', true)
        .order('nome'),
    ])
    setEventos((evRes.data as EventoAgenda[]) ?? [])
    setClientes((clRes.data as Cliente[]) ?? [])
    setResponsaveis((usRes.data as Usuario[]) ?? [])
    setCarregando(false)
  }, [supabase, intervalo])

  useEffect(() => { carregar() }, [carregar])

  const eventosFiltrados = useMemo(() => {
    return eventos.filter(ev => {
      if (filtroCliente && ev.cliente_id !== filtroCliente) return false
      if (filtroTipo && ev.tipo !== filtroTipo) return false
      if (filtroResp && ev.responsavel_id !== filtroResp) return false
      return true
    })
  }, [eventos, filtroCliente, filtroTipo, filtroResp])

  const diasSemana = useMemo(() => diasDaSemana(refDate), [refDate])

  function navAnterior() {
    const d = new Date(refDate)
    visao === 'semana' ? d.setDate(d.getDate() - 7) : d.setMonth(d.getMonth() - 1)
    setRefDate(d)
  }

  function navProximo() {
    const d = new Date(refDate)
    visao === 'semana' ? d.setDate(d.getDate() + 7) : d.setMonth(d.getMonth() + 1)
    setRefDate(d)
  }

  function irHoje() {
    setRefDate(new Date())
    setDiaSelecionado(new Date())
  }

  function abrirNovoComDia(d: Date) {
    setDiaSelecionado(d)
    const baseDate = isoDate(d)
    setEventoEditando({
      data_inicio: `${baseDate}T09:00:00`,
      data_fim: `${baseDate}T10:00:00`,
    })
    setModalNovo(true)
  }

  async function excluirEvento(id: string) {
    if (!confirm('Excluir este evento?')) return
    await supabase.from('eventos_agenda').delete().eq('id', id)
    setEventoDetalhe(null)
    carregar()
  }

  const tituloNav = visao === 'semana'
    ? `${diasSemana[0].getDate()} – ${diasSemana[6].getDate()} de ${MESES[diasSemana[6].getMonth()]} ${diasSemana[6].getFullYear()}`
    : `${MESES[refDate.getMonth()]} ${refDate.getFullYear()}`

  return (
    <div className="p-6 space-y-5">
      {/* Cabeçalho */}
      <div className="mf-page-header">
        <div>
          <h1 className="mf-page-title">Agenda</h1>
          <p className="mf-page-subtitle">Calendário de eventos, reuniões e entregas</p>
        </div>
        <button
          className="mf-btn-primary flex items-center gap-2"
          onClick={() => { setEventoEditando({}); setModalNovo(true) }}
        >
          <Plus size={16} /> Novo Evento
        </button>
      </div>

      {/* Barra de controles */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        {/* Navegação */}
        <div className="flex items-center gap-2">
          <button
            onClick={irHoje}
            className="mf-btn-secondary text-sm py-1.5 px-3"
          >
            Hoje
          </button>
          <button onClick={navAnterior} className="p-2 rounded-lg border border-[#E9E9EC] hover:bg-gray-50">
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-semibold text-gray-700 min-w-[200px] text-center">
            {tituloNav}
          </span>
          <button onClick={navProximo} className="p-2 rounded-lg border border-[#E9E9EC] hover:bg-gray-50">
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Visão + filtros */}
        <div className="flex gap-2 flex-wrap">
          {/* Toggle visão */}
          <div className="flex border border-[#E9E9EC] rounded-lg overflow-hidden">
            <button
              onClick={() => setVisao('semana')}
              className={`px-3 py-1.5 text-sm font-medium flex items-center gap-1 ${
                visao === 'semana' ? 'bg-[#FF6A00] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Layers size={14} /> Semana
            </button>
            <button
              onClick={() => setVisao('mes')}
              className={`px-3 py-1.5 text-sm font-medium flex items-center gap-1 ${
                visao === 'mes' ? 'bg-[#FF6A00] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Calendar size={14} /> Mês
            </button>
          </div>

          <select
            className="mf-input py-1.5 text-sm max-w-[160px]"
            value={filtroCliente}
            onChange={e => setFiltroCliente(e.target.value)}
          >
            <option value="">Todos os clientes</option>
            {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>

          <select
            className="mf-input py-1.5 text-sm max-w-[140px]"
            value={filtroTipo}
            onChange={e => setFiltroTipo(e.target.value)}
          >
            <option value="">Todos os tipos</option>
            <option value="reuniao">Reunião</option>
            <option value="tarefa">Tarefa</option>
            <option value="entrega">Entrega</option>
            <option value="outro">Outro</option>
          </select>

          <select
            className="mf-input py-1.5 text-sm max-w-[160px]"
            value={filtroResp}
            onChange={e => setFiltroResp(e.target.value)}
          >
            <option value="">Todos responsáveis</option>
            {responsaveis.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
          </select>
        </div>
      </div>

      {/* Legenda de cores */}
      <div className="flex gap-4 flex-wrap">
        {Object.entries(COR_TIPO).map(([tipo, cor]) => (
          <div key={tipo} className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cor }} />
            {LABEL_TIPO[tipo]}
          </div>
        ))}
      </div>

      {/* Conteúdo principal */}
      {carregando ? (
        <div className="flex items-center justify-center py-20">
          <div className="mf-spinner" />
        </div>
      ) : (
        <div className="flex gap-5">
          {/* Calendário */}
          <div className="flex-1 min-w-0">
            {visao === 'semana' ? (
              <ViewSemana
                dias={diasSemana}
                eventos={eventosFiltrados}
                onDiaClick={d => setDiaSelecionado(d)}
                onEventoClick={ev => setEventoDetalhe(ev)}
              />
            ) : (
              <ViewMes
                ref={refDate}
                eventos={eventosFiltrados}
                onDiaClick={d => { setDiaSelecionado(d); setVisao('semana'); setRefDate(d) }}
                onEventoClick={ev => setEventoDetalhe(ev)}
              />
            )}
          </div>

          {/* Painel do dia selecionado */}
          <div className="w-72 shrink-0">
            <PainelDia
              dia={diaSelecionado}
              eventos={eventosFiltrados}
              onEventoClick={ev => setEventoDetalhe(ev)}
              onNovoClick={() => abrirNovoComDia(diaSelecionado)}
            />
          </div>
        </div>
      )}

      {/* Modal novo/editar */}
      {modalNovo && (
        <ModalEvento
          evento={eventoEditando}
          clientes={clientes}
          responsaveis={responsaveis}
          onClose={() => { setModalNovo(false); setEventoEditando(null) }}
          onSalvo={() => { setModalNovo(false); setEventoEditando(null); carregar() }}
        />
      )}

      {/* Modal detalhe */}
      {eventoDetalhe && (
        <ModalDetalhe
          evento={eventoDetalhe}
          clientes={clientes}
          responsaveis={responsaveis}
          onClose={() => setEventoDetalhe(null)}
          onEditar={() => {
            setEventoEditando(eventoDetalhe)
            setEventoDetalhe(null)
            setModalNovo(true)
          }}
          onExcluir={() => excluirEvento(eventoDetalhe.id)}
        />
      )}
    </div>
  )
}

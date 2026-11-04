'use client'

import { useState, useEffect, useCallback } from 'react'
import { createBrowserClient } from '@/lib/supabase'
import {
  Settings,
  Building2,
  Key,
  Bell,
  Save,
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle,
  Globe,
  Mail,
  Phone,
  MapPin,
  Palette,
  Shield,
  Trash2,
  RefreshCw,
} from 'lucide-react'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface ConfigSistema {
  id?: string
  nome_empresa: string
  email_contato: string
  telefone: string
  cidade: string
  site: string
  openai_key: string
  vapid_public_key: string
  vapid_private_key: string
  notif_cobranca_dias: number
  notif_tarefa_atraso: boolean
  notif_nova_mensagem: boolean
  atualizado_em?: string
}

const CONFIG_PADRAO: ConfigSistema = {
  nome_empresa: 'MarketForge',
  email_contato: '',
  telefone: '',
  cidade: '',
  site: '',
  openai_key: '',
  vapid_public_key: '',
  vapid_private_key: '',
  notif_cobranca_dias: 3,
  notif_tarefa_atraso: true,
  notif_nova_mensagem: true,
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ msg, tipo }: { msg: string; tipo: 'sucesso' | 'erro' }) {
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-sm font-semibold transition-all ${
        tipo === 'sucesso'
          ? 'bg-green-50 border border-green-200 text-green-800'
          : 'bg-red-50 border border-red-200 text-red-700'
      }`}
    >
      {tipo === 'sucesso' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
      {msg}
    </div>
  )
}

// ─── Campo de texto ───────────────────────────────────────────────────────────

function Campo({
  label,
  value,
  onChange,
  placeholder = '',
  type = 'text',
  icon,
  hint,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  icon?: React.ReactNode
  hint?: string
}) {
  const [show, setShow] = useState(false)
  const isSenha = type === 'password'

  return (
    <div>
      <label className="mf-label">{label}</label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</div>
        )}
        <input
          type={isSenha && !show ? 'password' : 'text'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className={`mf-input w-full ${icon ? 'pl-9' : ''} ${isSenha ? 'pr-10' : ''}`}
        />
        {isSenha && (
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {show ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  )
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({
  label,
  descricao,
  value,
  onChange,
}: {
  label: string
  descricao?: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div>
        <p className="text-sm font-medium text-gray-800">{label}</p>
        {descricao && <p className="text-xs text-gray-500 mt-0.5">{descricao}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative shrink-0 w-10 h-5 rounded-full transition-colors ${
          value ? 'bg-[#FF6A00]' : 'bg-gray-200'
        }`}
      >
        <span
          className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
            value ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  )
}

// ─── Seção ────────────────────────────────────────────────────────────────────

function Secao({
  titulo,
  icone,
  children,
}: {
  titulo: string
  icone: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="mf-card space-y-4">
      <div className="flex items-center gap-2 pb-3 border-b border-[#E9E9EC]">
        <div className="w-8 h-8 rounded-lg bg-[#FF6A00]/10 flex items-center justify-center text-[#FF6A00]">
          {icone}
        </div>
        <h2 className="text-base font-bold text-gray-800">{titulo}</h2>
      </div>
      {children}
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function ConfiguracoesPage() {
  const supabase = createBrowserClient()
  const [config, setConfig] = useState<ConfigSistema>(CONFIG_PADRAO)
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [toast, setToast] = useState<{ msg: string; tipo: 'sucesso' | 'erro' } | null>(null)
  const [papel, setPapel] = useState<string>('')

  const mostrarToast = (msg: string, tipo: 'sucesso' | 'erro') => {
    setToast({ msg, tipo })
    setTimeout(() => setToast(null), 3500)
  }

  const carregar = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: usuario } = await supabase
      .from('usuarios')
      .select('papel')
      .eq('id', user.id)
      .single()

    setPapel(usuario?.papel ?? '')

    const { data } = await supabase
      .from('configuracoes')
      .select('*')
      .single()

    if (data) setConfig(data as ConfigSistema)
    setCarregando(false)
  }, [supabase])

  useEffect(() => { carregar() }, [carregar])

  const set = (campo: keyof ConfigSistema, valor: unknown) =>
    setConfig(prev => ({ ...prev, [campo]: valor }))

  async function salvar() {
    setSalvando(true)
    try {
      const payload = { ...config }

      if (config.id) {
        const { error } = await supabase
          .from('configuracoes')
          .update(payload)
          .eq('id', config.id)
        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from('configuracoes')
          .insert([payload])
          .select()
          .single()
        if (error) throw error
        if (data) setConfig(data as ConfigSistema)
      }

      mostrarToast('Configurações salvas com sucesso!', 'sucesso')
    } catch (err) {
      console.error(err)
      mostrarToast('Erro ao salvar configurações.', 'erro')
    }
    setSalvando(false)
  }

  if (carregando) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="mf-spinner" />
      </div>
    )
  }

  if (papel !== 'admin') {
    return (
      <div className="p-6">
        <div className="mf-card mf-empty">
          <div className="mf-empty-icon"><Shield size={28} /></div>
          <div className="mf-empty-title">Acesso restrito</div>
          <p className="text-sm text-gray-500 mt-1">
            Apenas administradores podem acessar as configurações do sistema.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="mf-page-title">Configurações</h1>
          <p className="mf-page-subtitle">Personalize o sistema para a sua agência</p>
        </div>
        <button
          onClick={salvar}
          disabled={salvando}
          className="mf-btn-primary flex items-center gap-2"
        >
          {salvando ? <RefreshCw size={15} className="animate-spin" /> : <Save size={15} />}
          {salvando ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </div>

      {/* Dados da empresa */}
      <Secao titulo="Dados da empresa" icone={<Building2 size={16} />}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Campo
            label="Nome da agência"
            value={config.nome_empresa}
            onChange={v => set('nome_empresa', v)}
            placeholder="MarketForge"
            icon={<Building2 size={15} />}
          />
          <Campo
            label="E-mail de contato"
            value={config.email_contato}
            onChange={v => set('email_contato', v)}
            placeholder="contato@suaagencia.com"
            icon={<Mail size={15} />}
          />
          <Campo
            label="Telefone / WhatsApp"
            value={config.telefone}
            onChange={v => set('telefone', v)}
            placeholder="(94) 99999-9999"
            icon={<Phone size={15} />}
          />
          <Campo
            label="Cidade"
            value={config.cidade}
            onChange={v => set('cidade', v)}
            placeholder="Marabá"
            icon={<MapPin size={15} />}
          />
        </div>
        <Campo
          label="Site"
          value={config.site}
          onChange={v => set('site', v)}
          placeholder="https://suaagencia.com.br"
          icon={<Globe size={15} />}
        />
      </Secao>

      {/* Integração com IA */}
      <Secao titulo="Inteligência Artificial (OpenAI)" icone={<Key size={16} />}>
        <Campo
          label="Chave de API OpenAI"
          value={config.openai_key}
          onChange={v => set('openai_key', v)}
          type="password"
          placeholder="sk-..."
          hint="Usada para geração de textos, abordagens comerciais e relatórios automáticos."
        />
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 flex items-start gap-2">
          <AlertTriangle size={13} className="shrink-0 mt-0.5" />
          A chave é armazenada de forma segura e nunca exposta no front-end. Obtenha a sua em{' '}
          <a
            href="https://platform.openai.com/api-keys"
            target="_blank"
            rel="noreferrer"
            className="underline font-semibold"
          >
            platform.openai.com
          </a>
          .
        </div>
      </Secao>

      {/* Push notifications (VAPID) */}
      <Secao titulo="Notificações Push (VAPID)" icone={<Bell size={16} />}>
        <p className="text-sm text-gray-500 -mt-1">
          Necessário para enviar notificações push nos dispositivos dos usuários.
          Gere as chaves em{' '}
          <a
            href="https://vapidkeys.com"
            target="_blank"
            rel="noreferrer"
            className="text-[#FF6A00] hover:underline font-medium"
          >
            vapidkeys.com
          </a>
          .
        </p>
        <div className="grid grid-cols-1 gap-4">
          <Campo
            label="Chave pública VAPID"
            value={config.vapid_public_key}
            onChange={v => set('vapid_public_key', v)}
            placeholder="BH..."
            hint="Coloque também em NEXT_PUBLIC_VAPID_PUBLIC_KEY no .env"
          />
          <Campo
            label="Chave privada VAPID"
            value={config.vapid_private_key}
            onChange={v => set('vapid_private_key', v)}
            type="password"
            placeholder="Chave privada VAPID"
            hint="Coloque também em VAPID_PRIVATE_KEY no .env"
          />
        </div>
      </Secao>

      {/* Preferências de notificação */}
      <Secao titulo="Preferências de notificação" icone={<Bell size={16} />}>
        <div className="divide-y divide-[#E9E9EC]">
          <div className="pb-3">
            <label className="mf-label mb-1">
              Alertar sobre cobranças com quantos dias de antecedência?
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={1}
                max={30}
                value={config.notif_cobranca_dias}
                onChange={e => set('notif_cobranca_dias', Number(e.target.value))}
                className="mf-input w-24 text-center"
              />
              <span className="text-sm text-gray-500">dias antes do vencimento</span>
            </div>
          </div>
          <Toggle
            label="Notificar tarefas atrasadas"
            descricao="Envia alerta quando uma tarefa passou da data de entrega"
            value={config.notif_tarefa_atraso}
            onChange={v => set('notif_tarefa_atraso', v)}
          />
          <Toggle
            label="Notificar novas mensagens"
            descricao="Envia alerta quando chega uma nova mensagem no chat"
            value={config.notif_nova_mensagem}
            onChange={v => set('notif_nova_mensagem', v)}
          />
        </div>
      </Secao>

      {/* Aparência */}
      <Secao titulo="Aparência" icone={<Palette size={16} />}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#FF6A00]" />
            <div>
              <p className="text-sm font-semibold text-gray-800">Laranja MarketForge</p>
              <p className="text-xs text-gray-500">#FF6A00 — cor principal</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#121212]" />
            <div>
              <p className="text-sm font-semibold text-gray-800">Preto sidebar</p>
              <p className="text-xs text-gray-500">#121212</p>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-400">
          Personalizações avançadas de tema disponíveis em versões futuras.
        </p>
      </Secao>

      {/* Zona de perigo */}
      <Secao titulo="Zona de perigo" icone={<Trash2 size={16} />}>
        <p className="text-sm text-gray-600">
          Ações irreversíveis que afetam todos os dados do sistema. Use com cautela.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors"
            onClick={() => {
              if (confirm('Tem certeza? Esta ação não pode ser desfeita.')) {
                mostrarToast('Funcionalidade disponível apenas via suporte.', 'erro')
              }
            }}
          >
            <Trash2 size={14} /> Limpar dados de demonstração
          </button>
        </div>
      </Secao>

      {/* Toast */}
      {toast && <Toast msg={toast.msg} tipo={toast.tipo} />}
    </div>
  )
}

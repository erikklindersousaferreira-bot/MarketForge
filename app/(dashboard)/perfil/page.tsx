'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from "@/lib/supabase";
import {
  User,
  Lock,
  Camera,
  Save,
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Mail,
  Badge,
} from 'lucide-react'

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

// ─── Campo ────────────────────────────────────────────────────────────────────

function Campo({
  label,
  value,
  onChange,
  placeholder = '',
  type = 'text',
  disabled = false,
  hint,
}: {
  label: string
  value: string
  onChange?: (v: string) => void
  placeholder?: string
  type?: string
  disabled?: boolean
  hint?: string
}) {
  const [show, setShow] = useState(false)
  const isSenha = type === 'password'

  return (
    <div>
      <label className="mf-label">{label}</label>
      <div className="relative">
        <input
          type={isSenha && !show ? 'password' : 'text'}
          value={value}
          onChange={e => onChange?.(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={`mf-input w-full ${disabled ? 'opacity-60 cursor-not-allowed bg-gray-50' : ''} ${isSenha ? 'pr-10' : ''}`}
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

// ─── Regras de senha ──────────────────────────────────────────────────────────

function RegrasSenha({ senha }: { senha: string }) {
  const regras = [
    { label: 'Mínimo 8 caracteres', ok: senha.length >= 8 },
    { label: 'Letra maiúscula', ok: /[A-Z]/.test(senha) },
    { label: 'Letra minúscula', ok: /[a-z]/.test(senha) },
    { label: 'Número', ok: /[0-9]/.test(senha) },
  ]

  if (!senha) return null

  return (
    <div className="grid grid-cols-2 gap-1 mt-2">
      {regras.map(r => (
        <div key={r.label} className={`flex items-center gap-1.5 text-xs ${r.ok ? 'text-green-600' : 'text-gray-400'}`}>
          <CheckCircle size={11} className={r.ok ? 'text-green-500' : 'text-gray-300'} />
          {r.label}
        </div>
      ))}
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function PerfilPage() {
  const supabase = createBrowserClient()
  const fileRef = useRef<HTMLInputElement>(null)

  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [papel, setPapel] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [userId, setUserId] = useState('')

  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')

  const [salvandoPerfil, setSalvandoPerfil] = useState(false)
  const [salvandoSenha, setSalvandoSenha] = useState(false)
  const [uploadandoAvatar, setUploadandoAvatar] = useState(false)
  const [carregando, setCarregando] = useState(true)

  const [toast, setToast] = useState<{ msg: string; tipo: 'sucesso' | 'erro' } | null>(null)

  const mostrarToast = (msg: string, tipo: 'sucesso' | 'erro') => {
    setToast({ msg, tipo })
    setTimeout(() => setToast(null), 3500)
  }

  const carregar = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)
    setEmail(user.email ?? '')

    const { data } = await supabase
      .from('usuarios')
      .select('nome, papel, avatar_url')
      .eq('id', user.id)
      .single()

    if (data) {
      setNome(data.nome ?? '')
      setPapel(data.papel ?? '')
      setAvatarUrl(data.avatar_url ?? '')
    }
    setCarregando(false)
  }, [supabase])

  useEffect(() => { carregar() }, [carregar])

  // ── Salvar dados pessoais ──────────────────────────────────────────────────

  async function salvarPerfil() {
    if (!nome.trim()) {
      mostrarToast('O nome não pode ser vazio.', 'erro')
      return
    }
    setSalvandoPerfil(true)
    const { error } = await supabase
      .from('usuarios')
      .update({ nome })
      .eq('id', userId)

    if (error) {
      mostrarToast('Erro ao salvar perfil.', 'erro')
    } else {
      mostrarToast('Perfil atualizado!', 'sucesso')
    }
    setSalvandoPerfil(false)
  }

  // ── Trocar senha ───────────────────────────────────────────────────────────

  async function trocarSenha() {
    if (!senhaAtual || !novaSenha || !confirmarSenha) {
      mostrarToast('Preencha todos os campos de senha.', 'erro')
      return
    }
    if (novaSenha !== confirmarSenha) {
      mostrarToast('A nova senha e a confirmação não coincidem.', 'erro')
      return
    }
    if (novaSenha.length < 8) {
      mostrarToast('A nova senha deve ter pelo menos 8 caracteres.', 'erro')
      return
    }

    setSalvandoSenha(true)

    // Verifica senha atual fazendo re-autenticação
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email,
      password: senhaAtual,
    })

    if (signInErr) {
      mostrarToast('Senha atual incorreta.', 'erro')
      setSalvandoSenha(false)
      return
    }

    const { error } = await supabase.auth.updateUser({ password: novaSenha })

    if (error) {
      mostrarToast('Erro ao trocar senha: ' + error.message, 'erro')
    } else {
      mostrarToast('Senha alterada com sucesso!', 'sucesso')
      setSenhaAtual('')
      setNovaSenha('')
      setConfirmarSenha('')
    }
    setSalvandoSenha(false)
  }

  // ── Upload de avatar ───────────────────────────────────────────────────────

  async function handleAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      mostrarToast('Imagem muito grande. Máximo 2 MB.', 'erro')
      return
    }

    setUploadandoAvatar(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `avatars/${userId}.${ext}`

      const { error: upErr } = await supabase.storage
        .from('marketforge')
        .upload(path, file, { upsert: true })

      if (upErr) throw upErr

      const { data: urlData } = supabase.storage
        .from('marketforge')
        .getPublicUrl(path)

      const publicUrl = urlData.publicUrl + '?v=' + Date.now()

      await supabase.from('usuarios').update({ avatar_url: publicUrl }).eq('id', userId)
      setAvatarUrl(publicUrl)
      mostrarToast('Avatar atualizado!', 'sucesso')
    } catch (err) {
      console.error(err)
      mostrarToast('Erro ao enviar imagem.', 'erro')
    }
    setUploadandoAvatar(false)
  }

  const papelLabel: Record<string, string> = {
    admin: 'Administrador',
    equipe: 'Equipe',
    cliente: 'Cliente',
  }

  if (carregando) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="mf-spinner" />
      </div>
    )
  }

  const iniciais = nome
    .split(' ')
    .slice(0, 2)
    .map(p => p[0])
    .join('')
    .toUpperCase()

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="mf-page-title">Meu Perfil</h1>
        <p className="mf-page-subtitle">Gerencie seus dados pessoais e senha de acesso</p>
      </div>

      {/* Avatar + Info */}
      <Secao titulo="Foto e informações" icone={<User size={16} />}>
        {/* Avatar */}
        <div className="flex items-center gap-5">
          <div className="relative">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={nome}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-[#E9E9EC]"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#FF6A00] to-[#E85E00] flex items-center justify-center text-white text-2xl font-bold border-2 border-[#E9E9EC]">
                {iniciais || <User size={28} />}
              </div>
            )}
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploadandoAvatar}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white border border-[#E9E9EC] shadow flex items-center justify-center hover:bg-gray-50 transition-colors"
              title="Trocar foto"
            >
              {uploadandoAvatar ? (
                <RefreshCw size={12} className="animate-spin text-gray-400" />
              ) : (
                <Camera size={12} className="text-gray-500" />
              )}
            </button>
          </div>
          <div>
            <p className="font-bold text-gray-900 text-lg">{nome || '—'}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`mf-badge ${
                papel === 'admin' ? 'mf-badge-laranja' :
                papel === 'equipe' ? 'mf-badge-azul' : 'mf-badge-cinza'
              }`}>
                {papelLabel[papel] ?? papel}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
              <Mail size={12} /> {email}
            </p>
          </div>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleAvatar}
          className="hidden"
        />
        <p className="text-xs text-gray-400 -mt-1">
          Formatos aceitos: JPG, PNG, WebP. Tamanho máximo: 2 MB.
        </p>

        {/* Nome */}
        <Campo
          label="Nome completo"
          value={nome}
          onChange={setNome}
          placeholder="Seu nome"
        />

        <Campo
          label="E-mail"
          value={email}
          disabled
          hint="O e-mail não pode ser alterado por aqui."
        />

        <button
          onClick={salvarPerfil}
          disabled={salvandoPerfil}
          className="mf-btn-primary flex items-center gap-2"
        >
          {salvandoPerfil ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
          {salvandoPerfil ? 'Salvando...' : 'Salvar dados'}
        </button>
      </Secao>

      {/* Trocar senha */}
      <Secao titulo="Alterar senha" icone={<Lock size={16} />}>
        <Campo
          label="Senha atual"
          value={senhaAtual}
          onChange={setSenhaAtual}
          type="password"
          placeholder="Sua senha atual"
        />
        <Campo
          label="Nova senha"
          value={novaSenha}
          onChange={setNovaSenha}
          type="password"
          placeholder="Mínimo 8 caracteres"
        />
        <RegrasSenha senha={novaSenha} />
        <Campo
          label="Confirmar nova senha"
          value={confirmarSenha}
          onChange={setConfirmarSenha}
          type="password"
          placeholder="Repita a nova senha"
        />

        {confirmarSenha && novaSenha !== confirmarSenha && (
          <p className="text-xs text-red-500 flex items-center gap-1">
            <AlertTriangle size={12} /> As senhas não coincidem
          </p>
        )}

        <button
          onClick={trocarSenha}
          disabled={salvandoSenha}
          className="mf-btn-primary flex items-center gap-2"
        >
          {salvandoSenha ? <RefreshCw size={14} className="animate-spin" /> : <Lock size={14} />}
          {salvandoSenha ? 'Alterando...' : 'Alterar senha'}
        </button>
      </Secao>

      {toast && <Toast msg={toast.msg} tipo={toast.tipo} />}
    </div>
  )
}

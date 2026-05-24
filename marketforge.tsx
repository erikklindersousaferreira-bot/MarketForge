'use client'
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://jadhnzbuxgnjibymtcmn.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphZGhuemJ1eGduamlieW10Y21uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MDYwNjUsImV4cCI6MjA5NDM4MjA2NX0.OQSiDO3OiPcGDt28I12D8dbJz4a4tp5DVHZw0bGgFMQ";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── SEED DATA (usado quando Supabase está vazio) ──────────────────────────────
const SEED_CLIENTS = [
  { name:"Churrascaria Pantanal", nicho:"Alimentação", valor:1800, vencimento:10, status:"ativo", responsavel:"João Silva", whatsapp:"94991234567", logo_url:"", cidade:"Marabá", plano:"Premium" },
  { name:"Clínica Beleza & Saúde", nicho:"Saúde/Estética", valor:2200, vencimento:5, status:"ativo", responsavel:"Ana Costa", whatsapp:"94992345678", logo_url:"", cidade:"Marabá", plano:"Full" },
  { name:"Auto Peças Motorista", nicho:"Automotivo", valor:1200, vencimento:15, status:"inadimplente", responsavel:"Pedro Lima", whatsapp:"94993456789", logo_url:"", cidade:"Marabá", plano:"Básico" },
  { name:"Moda Feminina Estilo", nicho:"Moda", valor:1600, vencimento:20, status:"ativo", responsavel:"Carla Souza", whatsapp:"94994567890", logo_url:"", cidade:"Marabá", plano:"Essencial" },
  { name:"Academia FitBody", nicho:"Fitness", valor:2800, vencimento:1, status:"ativo", responsavel:"Marcos Ferro", whatsapp:"94995678901", logo_url:"", cidade:"Marabá", plano:"Full" },
  { name:"Farmácia BemViver", nicho:"Farmácia", valor:1400, vencimento:25, status:"pausado", responsavel:"Sandra Reis", whatsapp:"94996789012", logo_url:"", cidade:"Marabá", plano:"Básico" },
];
const SEED_COBR = [
  { cliente:"Churrascaria Pantanal", valor:1800, vencimento:"2025-05-10", status:"pago", pagamento:"Pix" },
  { cliente:"Clínica Beleza & Saúde", valor:2200, vencimento:"2025-05-05", status:"pago", pagamento:"Transferência" },
  { cliente:"Auto Peças Motorista", valor:1200, vencimento:"2025-04-15", status:"atrasado", pagamento:"" },
  { cliente:"Moda Feminina Estilo", valor:1600, vencimento:"2025-05-20", status:"pendente", pagamento:"" },
  { cliente:"Academia FitBody", valor:2800, vencimento:"2025-05-01", status:"pago", pagamento:"Pix" },
  { cliente:"Farmácia BemViver", valor:1400, vencimento:"2025-05-25", status:"pendente", pagamento:"" },
];
const SEED_TASKS = [
  { titulo:"Arte Dia dos Namorados", cliente:"Moda Feminina Estilo", responsavel:"Juliana", prioridade:"alta", status:"em_producao", tipo:"Design", entrega:"2025-06-08" },
  { titulo:"Vídeo institucional", cliente:"Clínica Beleza & Saúde", responsavel:"Carlos", prioridade:"media", status:"aguardando", tipo:"Vídeo", entrega:"2025-06-12" },
  { titulo:"Subir campanha Meta Ads", cliente:"Academia FitBody", responsavel:"Rafael", prioridade:"urgente", status:"a_fazer", tipo:"Tráfego pago", entrega:"2025-06-05" },
  { titulo:"Relatório mensal maio", cliente:"Churrascaria Pantanal", responsavel:"Juliana", prioridade:"media", status:"finalizado", tipo:"Relatório", entrega:"2025-06-01" },
  { titulo:"Posts semana 2", cliente:"Farmácia BemViver", responsavel:"Carlos", prioridade:"baixa", status:"a_fazer", tipo:"Design", entrega:"2025-06-10" },
  { titulo:"Aprovação do feed", cliente:"Churrascaria Pantanal", responsavel:"Juliana", prioridade:"alta", status:"atrasado", tipo:"Aprovação", entrega:"2025-05-01" },
];
const SEED_DESPESAS = [
  { nome:"Adobe Creative Cloud", categoria:"Ferramentas", valor:349, vencimento:"2025-05-15", status:"pago" },
  { nome:"Meta Business Suite", categoria:"Assinaturas", valor:99, vencimento:"2025-05-20", status:"pendente" },
  { nome:"Salário - Juliana (Design)", categoria:"Colaboradores", valor:2800, vencimento:"2025-06-05", status:"pendente" },
  { nome:"Salário - Carlos (Vídeo)", categoria:"Colaboradores", valor:2400, vencimento:"2025-06-05", status:"pendente" },
  { nome:"Internet fibra", categoria:"Internet", valor:199, vencimento:"2025-05-10", status:"pago" },
  { nome:"Conta de Luz escritório", categoria:"Outros", valor:320, vencimento:"2025-05-12", status:"pago" },
];
const SEED_EQUIPE = [
  { nome:"Juliana Ferreira", funcao:"Designer", tipo:"fixo", status:"ativo", whatsapp:"94997001122" },
  { nome:"Carlos Mendes", funcao:"Editor de Vídeo", tipo:"fixo", status:"ativo", whatsapp:"94997002233" },
  { nome:"Felipe Costa", funcao:"Gestor de Tráfego", tipo:"freelancer", status:"ativo", whatsapp:"94997003344" },
];

// ── SVG ICONS ─────────────────────────────────────────────────────────────────
const IC = {
  sun:<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  chart:<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>,
  users:<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  money:<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  list:<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  check:<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
  cal:<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  user:<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  signal:<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>,
  msg:<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  logout:<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  bell:<svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  alert:<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  eye:<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  eyeOff:<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
  lock:<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  clock:<svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  trending:<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  edit:<svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  trash:<svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
  image:<svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
};

// ── HELPERS ───────────────────────────────────────────────────────────────────
const fmtDate = (d) => { if(!d) return "—"; try { return new Date(d).toLocaleDateString("pt-BR"); } catch { return d; } };
const genId = () => Date.now();

const StatusBadge = ({status}) => {
  const m = {ativo:["#DCFCE7","#166534","Ativo"],pausado:["#FEF9C3","#854D0E","Pausado"],cancelado:["#FEE2E2","#991B1B","Cancelado"],inadimplente:["#FEE2E2","#991B1B","Inadimplente"],pago:["#DCFCE7","#166534","Pago"],pendente:["#FEF9C3","#92400E","Pendente"],atrasado:["#FEE2E2","#991B1B","Atrasado"],a_fazer:["#EFF6FF","#1D4ED8","A Fazer"],em_producao:["#FFF7ED","#C2410C","Em Produção"],aguardando:["#F5F3FF","#7C3AED","Aguardando"],finalizado:["#DCFCE7","#166534","Finalizado"],urgente:["#FEE2E2","#991B1B","Urgente"],ok:["#DCFCE7","#166534","OK"],baixo:["#FEF9C3","#92400E","Baixo"],zerado:["#FEE2E2","#991B1B","Zerado"],planejar:["#EFF6FF","#1D4ED8","Planejar"],futuro:["#F3F4F6","#6B7280","Futuro"],ajustes:["#FEF9C3","#92400E","Ajustes"]};
  const [bg,color,label] = m[status]||["#F3F4F6","#6B7280",status];
  return <span style={{background:bg,color,fontSize:11,fontWeight:700,padding:"2px 10px",borderRadius:20}}>{label}</span>;
};

const PBadge = ({p}) => {
  const m = {baixa:["#EFF6FF","#1D4ED8"],media:["#F5F3FF","#7C3AED"],alta:["#FFF7ED","#C2410C"],urgente:["#FEE2E2","#991B1B"]};
  const [bg,c] = m[p]||["#F3F4F6","#6B7280"];
  return <span style={{background:bg,color:c,fontSize:11,fontWeight:700,padding:"2px 9px",borderRadius:20}}>{p.charAt(0).toUpperCase()+p.slice(1)}</span>;
};

const Card = ({children,style={},onClick}) => <div onClick={onClick} style={{background:"#fff",borderRadius:14,boxShadow:"0 1px 4px rgba(0,0,0,0.07),0 0 0 1px #DDE5EF",padding:22,...style,cursor:onClick?"pointer":undefined}}>{children}</div>;

const MC = ({label,value,sub,icon,bg="#FFF7F3"}) => (
  <Card style={{display:"flex",alignItems:"flex-start",gap:14,minWidth:160}}>
    <div style={{background:bg,borderRadius:12,width:46,height:46,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,color:"#FF6200"}}>{icon}</div>
    <div><div style={{fontSize:11,color:"#64748B",fontWeight:600,letterSpacing:0.4,textTransform:"uppercase"}}>{label}</div><div style={{fontSize:22,fontWeight:800,color:"#111827",lineHeight:1.2,marginTop:2}}>{value}</div>{sub&&<div style={{fontSize:12,color:"#64748B",marginTop:2}}>{sub}</div>}</div>
  </Card>
);

const Btn = ({children,onClick,variant="primary",size="md",style={},disabled}) => {
  const sz = {sm:{padding:"5px 12px",fontSize:12},md:{padding:"9px 18px",fontSize:13},lg:{padding:"12px 26px",fontSize:15}};
  const vr = {primary:{background:"#FF6200",color:"#fff"},secondary:{background:"#1F2F46",color:"#fff"},ghost:{background:"transparent",color:"#64748B",boxShadow:"0 0 0 1px #DDE5EF"},danger:{background:"#EF4444",color:"#fff"},success:{background:"#10B981",color:"#fff"},warn:{background:"#F59E0B",color:"#fff"}};
  return <button onClick={onClick} disabled={disabled} style={{borderRadius:8,fontWeight:700,cursor:disabled?"not-allowed":"pointer",border:"none",letterSpacing:0.2,fontFamily:"inherit",...sz[size],...vr[variant],opacity:disabled?0.5:1,...style}}>{children}</button>;
};

const FInput = ({label,value,onChange,type="text",placeholder="",icon,extra}) => (
  <div style={{marginBottom:14}}>
    {label&&<label style={{display:"block",fontSize:12,fontWeight:700,color:"#374151",marginBottom:5}}>{label}</label>}
    <div style={{position:"relative"}}>
      {icon&&<div style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",color:"#94A3B8"}}>{icon}</div>}
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        style={{width:"100%",padding:icon?"9px 40px 9px 36px":"9px 13px",borderRadius:8,border:"1.5px solid #DDE5EF",fontSize:13,color:"#111827",outline:"none",fontFamily:"inherit",boxSizing:"border-box",background:"#FAFBFD"}}/>
      {extra&&<div style={{position:"absolute",right:11,top:"50%",transform:"translateY(-50%)"}}>{extra}</div>}
    </div>
  </div>
);

const FSel = ({label,value,onChange,options}) => (
  <div style={{marginBottom:14}}>
    {label&&<label style={{display:"block",fontSize:12,fontWeight:700,color:"#374151",marginBottom:5}}>{label}</label>}
    <select value={value} onChange={e=>onChange(e.target.value)} style={{width:"100%",padding:"9px 13px",borderRadius:8,border:"1.5px solid #DDE5EF",fontSize:13,color:"#111827",outline:"none",fontFamily:"inherit",boxSizing:"border-box",background:"#FAFBFD"}}>
      {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

const Modal = ({title,onClose,children,width=520}) => (
  <div style={{position:"fixed",inset:0,background:"rgba(17,24,39,0.5)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
    <div style={{background:"#fff",borderRadius:16,width:"100%",maxWidth:width,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,0.25)"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"18px 24px",borderBottom:"1px solid #EEF3F8"}}>
        <div style={{fontSize:17,fontWeight:800,color:"#111827"}}>{title}</div>
        <button onClick={onClose} style={{background:"none",border:"none",fontSize:22,cursor:"pointer",color:"#64748B"}}>×</button>
      </div>
      <div style={{padding:24}}>{children}</div>
    </div>
  </div>
);

const ConfirmModal = ({msg,onConfirm,onCancel}) => (
  <div style={{position:"fixed",inset:0,background:"rgba(17,24,39,0.5)",zIndex:1100,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
    <div style={{background:"#fff",borderRadius:16,maxWidth:380,width:"100%",padding:28,boxShadow:"0 20px 60px rgba(0,0,0,0.25)",textAlign:"center"}}>
      <div style={{fontSize:32,marginBottom:12}}>🗑️</div>
      <div style={{fontSize:16,fontWeight:700,color:"#111827",marginBottom:8}}>Confirmar exclusão</div>
      <div style={{fontSize:13,color:"#64748B",marginBottom:24}}>{msg}</div>
      <div style={{display:"flex",gap:10,justifyContent:"center"}}>
        <Btn variant="ghost" onClick={onCancel}>Cancelar</Btn>
        <Btn variant="danger" onClick={onConfirm}>Excluir</Btn>
      </div>
    </div>
  </div>
);

const ST = ({children,action}) => (
  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
    <h2 style={{margin:0,fontSize:18,fontWeight:800,color:"#111827"}}>{children}</h2>
    {action}
  </div>
);

const Tbl = ({cols,rows}) => (
  <div style={{overflowX:"auto"}}>
    <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
      <thead><tr style={{background:"#F8FAFC"}}>{cols.map(c=><th key={c} style={{padding:"10px 14px",textAlign:"left",fontWeight:700,color:"#64748B",fontSize:11,letterSpacing:0.5,textTransform:"uppercase",borderBottom:"1px solid #EEF3F8"}}>{c}</th>)}</tr></thead>
      <tbody>{rows.length===0?<tr><td colSpan={cols.length} style={{padding:"32px 14px",textAlign:"center",color:"#64748B"}}>Nenhum registro.</td></tr>:rows.map((r,i)=><tr key={i} style={{borderBottom:"1px solid #EEF3F8",background:i%2===0?"#fff":"#FAFBFD"}}>{r.map((cell,j)=><td key={j} style={{padding:"11px 14px",color:"#374151",verticalAlign:"middle"}}>{cell}</td>)}</tr>)}</tbody>
    </table>
  </div>
);

const Loading = () => <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:200,color:"#64748B",fontSize:14}}>Carregando...</div>;

// ── LOGO AVATAR ───────────────────────────────────────────────────────────────
const ClientLogo = ({url,name,size=50}) => {
  if(url) return <img src={url} alt={name} style={{width:size,height:size,borderRadius:12,objectFit:"cover",flexShrink:0}} onError={e=>{e.target.style.display="none"}}/>;
  return <div style={{width:size,height:size,background:"linear-gradient(135deg,#1F2F46,#2D4A6A)",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:size*0.35,fontWeight:800,flexShrink:0}}>{name?.charAt(0)||"?"}</div>;
};

// ── LOGIN ─────────────────────────────────────────────────────────────────────
const LoginPage = ({onLogin}) => {
  const [email,setEmail]=useState("");
  const [senha,setSenha]=useState("");
  const [show,setShow]=useState(false);
  const [err,setErr]=useState("");
  const [loading,setLoading]=useState(false);

  const handle = async () => {
    if(!email||!senha){setErr("Preencha todos os campos.");return;}
    setLoading(true);setErr("");
    const {data,error} = await supabase.auth.signInWithPassword({email,password:senha});
    if(error){setErr("Email ou senha incorretos.");setLoading(false);return;}
    const {data:u} = await supabase.from("usuarios").select("perfil,nome").eq("id",data.user.id).single();
    onLogin(u?.perfil||"operacional", u?.nome||email);
    setLoading(false);
  };

  return (
    <div style={{minHeight:"100vh",background:"#1F2F46",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Sora','Segoe UI',sans-serif",padding:20}}>
      <div style={{position:"fixed",inset:0,backgroundImage:"radial-gradient(circle at 20% 50%,rgba(255,98,0,0.1) 0%,transparent 50%),radial-gradient(circle at 80% 20%,rgba(255,98,0,0.06) 0%,transparent 40%)",pointerEvents:"none"}}/>
      <div style={{background:"#fff",borderRadius:24,boxShadow:"0 32px 80px rgba(0,0,0,0.4)",padding:"52px 48px",width:"100%",maxWidth:440,textAlign:"center",position:"relative",zIndex:1}}>
        <div style={{marginBottom:36}}>
          <img src="https://i.postimg.cc/02xYt6Qp/logo-vertical-nomepreta.png" alt="MarketForge" style={{height:80,objectFit:"contain",display:"block",margin:"0 auto 20px"}} onError={e=>{e.target.style.display="none"}}/>
          <div style={{fontSize:20,fontWeight:800,color:"#111827",marginBottom:6}}>Acesso ao Painel</div>
          <div style={{fontSize:13,color:"#64748B"}}>Gestão financeira, clientes e produção da agência</div>
        </div>
        <div style={{textAlign:"left"}}>
          <FInput label="Email" value={email} onChange={setEmail} placeholder="seu@email.com" icon={IC.user}/>
          <FInput label="Senha" value={senha} onChange={setSenha} type={show?"text":"password"} placeholder="Sua senha" icon={IC.lock}
            extra={<button onClick={()=>setShow(!show)} style={{background:"none",border:"none",cursor:"pointer",color:"#94A3B8",display:"flex"}}>{show?IC.eyeOff:IC.eye}</button>}/>
        </div>
        {err&&<div style={{background:"#FEF2F2",border:"1px solid #FECACA",color:"#991B1B",borderRadius:8,padding:"10px 14px",fontSize:13,marginBottom:16,textAlign:"left",display:"flex",alignItems:"center",gap:8}}><span style={{color:"#EF4444",flexShrink:0}}>{IC.alert}</span>{err}</div>}
        <Btn onClick={handle} size="lg" style={{width:"100%",background:"linear-gradient(135deg,#FF6200,#FF8C00)",fontSize:15,marginBottom:14}} disabled={loading}>
          {loading?"Entrando...":"Entrar no sistema"}
        </Btn>
        <div style={{marginTop:28,paddingTop:20,borderTop:"1px solid #EEF3F8",fontSize:11,color:"#94A3B8"}}>© 2025 MarketForge — @marketforge_</div>
      </div>
    </div>
  );
};

// ── SIDEBAR ───────────────────────────────────────────────────────────────────
const NAV_ADMIN=[{id:"hoje",label:"Hoje",icon:IC.sun},{id:"dashboard",label:"Dashboard",icon:IC.chart},{id:"clientes",label:"Clientes",icon:IC.users},{id:"financeiro",label:"Financeiro",icon:IC.money},{id:"cobr",label:"Cobranças",icon:IC.list},{id:"despesas",label:"Despesas",icon:IC.money},{id:"tarefas",label:"Tarefas",icon:IC.check},{id:"calendario",label:"Calendário",icon:IC.cal},{id:"equipe",label:"Equipe",icon:IC.user},{id:"trafego",label:"Tráfego",icon:IC.signal},{id:"mensagens",label:"Modelos",icon:IC.msg}];

const NAV_OP=[{id:"hoje",label:"Hoje",icon:IC.sun},{id:"tarefas",label:"Tarefas",icon:IC.check},{id:"calendario",label:"Calendário",icon:IC.cal},{id:"trafego",label:"Tráfego",icon:IC.signal},{id:"equipe",label:"Equipe",icon:IC.user},{id:"mensagens",label:"Modelos",icon:IC.msg}];
const LABELS={hoje:"Hoje",dashboard:"Dashboard",clientes:"Clientes",financeiro:"Financeiro",cobr:"Cobranças",despesas:"Despesas",tarefas:"Tarefas",calendario:"Calendário Estratégico",equipe:"Equipe",trafego:"Saldo de Tráfego",mensagens:"Modelos de Mensagem"};

const Sidebar=({page,setPage,onLogout,cobrPend,perfil})=>{
const NAV = perfil==="admin" ? NAV_ADMIN : NAV_OP;
return ((
  <div style={{width:230,background:"#1F2F46",minHeight:"100vh",display:"flex",flexDirection:"column",position:"fixed",top:0,left:0,zIndex:100}}>
    <div style={{padding:"20px 18px 16px",borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
      <img src="https://i.postimg.cc/jdB530mK/mkt.png" alt="MarketForge" style={{height:38,objectFit:"contain"}} onError={e=>{e.target.style.display="none"}}/>
    </div>
    <nav style={{flex:1,padding:"14px 10px",overflowY:"auto"}}>
      {NAV.map(n=>(
        <div key={n.id} onClick={()=>setPage(n.id)} style={{display:"flex",alignItems:"center",gap:11,padding:"9px 12px",borderRadius:10,marginBottom:2,cursor:"pointer",background:page===n.id?"rgba(255,98,0,0.18)":"transparent",color:page===n.id?"#FF6200":"rgba(255,255,255,0.65)",fontWeight:page===n.id?700:500,fontSize:13}}>
          <span style={{opacity:page===n.id?1:0.7}}>{n.icon}</span>{n.label}
          {n.id==="cobr"&&cobrPend>0&&<span style={{marginLeft:"auto",background:"#EF4444",color:"#fff",fontSize:10,fontWeight:700,borderRadius:10,padding:"1px 7px"}}>{cobrPend}</span>}
        </div>
      ))}
    </nav>
    <div style={{padding:"14px 10px",borderTop:"1px solid rgba(255,255,255,0.08)"}}>
      <div onClick={onLogout} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:10,cursor:"pointer",color:"rgba(255,255,255,0.5)",fontSize:13}}>
        {IC.logout} Sair
      </div>
    </div>
  </div>
);};

const Topbar=({page})=>(
  <div style={{position:"fixed",top:0,left:230,right:0,height:62,background:"#fff",borderBottom:"1px solid #DDE5EF",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 28px",zIndex:99}}>
    <div style={{fontSize:18,fontWeight:800,color:"#111827"}}>{LABELS[page]||page}</div>
    <div style={{display:"flex",alignItems:"center",gap:16}}>
      <div style={{position:"relative",cursor:"pointer",color:"#64748B"}}>{IC.bell}</div>
      <div style={{display:"flex",alignItems:"center",gap:9}}>
        <div style={{width:34,height:34,background:"linear-gradient(135deg,#FF6200,#FF8C00)",borderRadius:99,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:14,fontWeight:700}}>E</div>
        <div><div style={{fontSize:13,fontWeight:700,color:"#111827"}}>erikklinder</div><div style={{fontSize:11,color:"#64748B"}}>Admin</div></div>
      </div>
    </div>
  </div>
);

// ── HOJE ──────────────────────────────────────────────────────────────────────
const HojePage=({setPage,clients,cobr,tasks})=>{
  const atrasadas=tasks.filter(t=>t.status==="atrasado");
  const cobHoje=cobr.filter(c=>c.status==="pendente"||c.status==="atrasado").slice(0,4);
  return (
    <div>
      <div style={{marginBottom:22,display:"flex",alignItems:"center",gap:12}}>
        <div style={{width:48,height:48,background:"linear-gradient(135deg,#FF6200,#FF8C00)",borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff"}}>{IC.sun}</div>
        <div>
          <div style={{fontSize:22,fontWeight:800,color:"#111827"}}>Bom dia, erikklinder!</div>
          <div style={{fontSize:13,color:"#64748B"}}>Aqui está o que precisa de atenção hoje</div>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:14,marginBottom:28}}>
        <MC label="Cobranças pendentes" value={cobr.filter(c=>c.status==="pendente").length} icon={IC.money} bg="#FFF7F3"/>
        <MC label="Tarefas atrasadas" value={atrasadas.length} icon={IC.alert} bg="#FEF2F2"/>
        <MC label="Clientes ativos" value={clients.filter(c=>c.status==="ativo").length} icon={IC.users} bg="#ECFDF5"/>
        <MC label="Inadimplentes" value={clients.filter(c=>c.status==="inadimplente").length} icon={IC.users} bg="#FEF2F2"/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
        <Card>
          <ST action={<Btn size="sm" variant="ghost" onClick={()=>setPage("cobr")}>Ver todas</Btn>}>Cobranças pendentes</ST>
          {cobHoje.length===0?<div style={{color:"#10B981",textAlign:"center",padding:"20px 0",fontSize:13}}>Nenhuma pendência!</div>:cobHoje.map(c=>(
            <div key={c.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 12px",background:"#F8FAFC",borderRadius:10,marginBottom:8}}>
              <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:"#111827"}}>{c.cliente}</div><div style={{fontSize:12,color:"#64748B",display:"flex",alignItems:"center",gap:4}}>{IC.clock} Venc: {fmtDate(c.vencimento)}</div></div>
              <div style={{textAlign:"right"}}><div style={{fontSize:14,fontWeight:800}}>R$ {c.valor?.toLocaleString()}</div><StatusBadge status={c.status}/></div>
            </div>
          ))}
        </Card>
        <Card>
          <ST action={<Btn size="sm" variant="ghost" onClick={()=>setPage("tarefas")}>Ver todas</Btn>}>Tarefas atrasadas</ST>
          {atrasadas.length===0?<div style={{color:"#10B981",textAlign:"center",padding:"20px 0",fontSize:13}}>Nenhuma atrasada!</div>:atrasadas.map(t=>(
            <div key={t.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 12px",background:"#FEF2F2",borderRadius:10,border:"1px solid #FECACA",marginBottom:8}}>
              <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:"#111827"}}>{t.titulo}</div><div style={{fontSize:12,color:"#64748B"}}>{t.cliente} · {t.responsavel}</div></div>
              <div style={{textAlign:"right"}}><div style={{fontSize:11,color:"#EF4444",fontWeight:700}}>Atrasada</div><div style={{fontSize:11,color:"#64748B"}}>{fmtDate(t.entrega)}</div></div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
};

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
const DashboardPage=({clients,cobr,despesas})=>{
  const recR=cobr.filter(c=>c.status==="pago").reduce((a,c)=>a+Number(c.valor),0);
  const recP=cobr.filter(c=>c.status==="pendente").reduce((a,c)=>a+Number(c.valor),0);
  const recA=cobr.filter(c=>c.status==="atrasado").reduce((a,c)=>a+Number(c.valor),0);
  const despT=despesas.reduce((a,d)=>a+Number(d.valor),0);
  const atv=clients.filter(c=>c.status==="ativo").length;
  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))",gap:14,marginBottom:24}}>
        <MC label="Receita recebida" value={`R$ ${recR.toLocaleString()}`} icon={IC.check} bg="#ECFDF5"/>
        <MC label="Em aberto" value={`R$ ${recP.toLocaleString()}`} icon={IC.clock} bg="#FFFBEB"/>
        <MC label="Atrasado" value={`R$ ${recA.toLocaleString()}`} icon={IC.alert} bg="#FEF2F2"/>
        <MC label="Despesas" value={`R$ ${despT.toLocaleString()}`} icon={IC.money} bg="#F8FAFC"/>
        <MC label="Lucro estimado" value={`R$ ${(recR-despT).toLocaleString()}`} icon={IC.trending} bg="#ECFDF5"/>
        <MC label="Clientes ativos" value={atv} icon={IC.users} bg="#F5F3FF"/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
        <Card>
          <ST>Status de cobranças</ST>
          {[{label:"Pagas",count:cobr.filter(c=>c.status==="pago").length,color:"#10B981"},{label:"Pendentes",count:cobr.filter(c=>c.status==="pendente").length,color:"#F59E0B"},{label:"Atrasadas",count:cobr.filter(c=>c.status==="atrasado").length,color:"#EF4444"}].map(s=>(
            <div key={s.label} style={{marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:13,color:"#374151",fontWeight:600}}>{s.label}</span><span style={{fontSize:13,fontWeight:800,color:s.color}}>{s.count}</span></div>
              <div style={{background:"#EEF3F8",borderRadius:99,height:7,overflow:"hidden"}}><div style={{background:s.color,height:"100%",width:cobr.length?`${(s.count/cobr.length)*100}%`:"0%",borderRadius:99}}/></div>
            </div>
          ))}
        </Card>
        <Card>
          <ST>Clientes por status</ST>
          {[{label:"Ativos",color:"#10B981",key:"ativo"},{label:"Pausados",color:"#F59E0B",key:"pausado"},{label:"Inadimplentes",color:"#EF4444",key:"inadimplente"}].map(s=>(
            <div key={s.key} style={{marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:13,color:"#374151",fontWeight:600}}>{s.label}</span><span style={{fontSize:13,fontWeight:800,color:s.color}}>{clients.filter(c=>c.status===s.key).length}</span></div>
              <div style={{background:"#EEF3F8",borderRadius:99,height:7,overflow:"hidden"}}><div style={{background:s.color,height:"100%",width:clients.length?`${(clients.filter(c=>c.status===s.key).length/clients.length)*100}%`:"0%",borderRadius:99}}/></div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
};

// ── CLIENTES ──────────────────────────────────────────────────────────────────
const BLANK_CLIENT = {name:"",nicho:"",valor:"",vencimento:"",status:"ativo",responsavel:"",whatsapp:"",logo_url:"",cidade:"Marabá",plano:"Básico"};

const ClientesPage=({clients,setClients,loading})=>{
  const [search,setSearch]=useState("");
  const [filter,setFilter]=useState("todos");
  const [modal,setModal]=useState(false);
  const [form,setForm]=useState(BLANK_CLIENT);
  const [editing,setEditing]=useState(null);
  const [confirm,setConfirm]=useState(null);
  const [saving,setSaving]=useState(false);

  const fl=clients.filter(c=>(c.name?.toLowerCase().includes(search.toLowerCase())||c.nicho?.toLowerCase().includes(search.toLowerCase()))&&(filter==="todos"||c.status===filter));

  const openNew=()=>{setForm(BLANK_CLIENT);setEditing(null);setModal(true);};
  const openEdit=(c)=>{setForm({...c});setEditing(c.id);setModal(true);};

  const save=async()=>{
    if(!form.name){return;}
    setSaving(true);
    const data={name:form.name,nicho:form.nicho,valor:Number(form.valor),vencimento:Number(form.vencimento),status:form.status,responsavel:form.responsavel,whatsapp:form.whatsapp,logo_url:form.logo_url,cidade:form.cidade,plano:form.plano};
    if(editing){
      const {error}=await supabase.from("clientes").update(data).eq("id",editing);
      if(!error) setClients(prev=>prev.map(c=>c.id===editing?{...c,...data}:c));
    } else {
      const {data:inserted,error}=await supabase.from("clientes").insert([data]).select();
      if(!error&&inserted) setClients(prev=>[...prev,...inserted]);
    }
    setSaving(false);setModal(false);
  };

  const remove=async(id)=>{
    await supabase.from("clientes").delete().eq("id",id);
    setClients(prev=>prev.filter(c=>c.id!==id));
    setConfirm(null);
  };

  const f=(k,v)=>setForm(p=>({...p,[k]:v}));

  if(loading) return <Loading/>;
  return (
    <div>
      <div style={{display:"flex",gap:12,marginBottom:20,alignItems:"center",flexWrap:"wrap"}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar cliente..." style={{flex:1,minWidth:200,padding:"9px 14px",borderRadius:9,border:"1.5px solid #DDE5EF",fontSize:13,color:"#111827",outline:"none",fontFamily:"inherit"}}/>
        {["todos","ativo","pausado","inadimplente"].map(fi=><Btn key={fi} size="sm" variant={filter===fi?"secondary":"ghost"} onClick={()=>setFilter(fi)}>{fi.charAt(0).toUpperCase()+fi.slice(1)}</Btn>)}
        <Btn onClick={openNew}>+ Novo Cliente</Btn>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:16}}>
        {fl.map(c=>(
          <Card key={c.id}>
            <div style={{display:"flex",alignItems:"flex-start",gap:14,marginBottom:14}}>
              <ClientLogo url={c.logo_url} name={c.name}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
                  <div style={{fontSize:15,fontWeight:800,color:"#111827",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.name}</div>
                  <StatusBadge status={c.status}/>
                </div>
                <div style={{fontSize:12,color:"#64748B",marginTop:3}}>{c.nicho} · {c.cidade}</div>
                <div style={{fontSize:12,color:"#64748B",marginTop:2}}>{c.responsavel}</div>
              </div>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",paddingTop:12,borderTop:"1px solid #EEF3F8",marginBottom:12}}>
              <div><div style={{fontSize:10,color:"#64748B",fontWeight:600}}>MENSALIDADE</div><div style={{fontSize:17,fontWeight:800,color:"#111827"}}>R$ {Number(c.valor).toLocaleString()}</div></div>
              <div style={{textAlign:"center"}}><div style={{fontSize:10,color:"#64748B",fontWeight:600}}>VENCIMENTO</div><div style={{fontSize:14,fontWeight:700,color:"#1F2F46"}}>Dia {c.vencimento}</div></div>
              <div style={{textAlign:"right"}}><div style={{fontSize:10,color:"#64748B",fontWeight:600}}>PLANO</div><div style={{fontSize:13,fontWeight:700,color:"#FF6200"}}>{c.plano}</div></div>
            </div>
            <div style={{display:"flex",gap:8}}>
              <Btn size="sm" variant="ghost" style={{flex:1}} onClick={()=>openEdit(c)}>{IC.edit} Editar</Btn>
              <Btn size="sm" variant="danger" style={{flex:1}} onClick={()=>setConfirm(c)}>{IC.trash} Remover</Btn>
            </div>
          </Card>
        ))}
      </div>

      {modal&&<Modal title={editing?"Editar Cliente":"Novo Cliente"} onClose={()=>setModal(false)}>
        <div style={{marginBottom:14,textAlign:"center"}}>
          <ClientLogo url={form.logo_url} name={form.name} size={64}/>
        </div>
        <FInput label="URL da Logo (opcional)" value={form.logo_url} onChange={v=>f("logo_url",v)} placeholder="https://exemplo.com/logo.png" icon={IC.image}/>
        <FInput label="Nome da empresa *" value={form.name} onChange={v=>f("name",v)} placeholder="Churrascaria Pantanal"/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          <FInput label="Nicho" value={form.nicho} onChange={v=>f("nicho",v)} placeholder="Alimentação"/>
          <FInput label="Cidade" value={form.cidade} onChange={v=>f("cidade",v)} placeholder="Marabá"/>
        </div>
        <FInput label="Responsável" value={form.responsavel} onChange={v=>f("responsavel",v)} placeholder="João Silva"/>
        <FInput label="WhatsApp" value={form.whatsapp} onChange={v=>f("whatsapp",v)} placeholder="94991234567"/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          <FInput label="Valor mensal (R$)" value={form.valor} onChange={v=>f("valor",v)} placeholder="1800"/>
          <FInput label="Dia de vencimento" value={form.vencimento} onChange={v=>f("vencimento",v)} placeholder="10"/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          <FSel label="Status" value={form.status} onChange={v=>f("status",v)} options={[{value:"ativo",label:"Ativo"},{value:"pausado",label:"Pausado"},{value:"inadimplente",label:"Inadimplente"},{value:"cancelado",label:"Cancelado"}]}/>
          <FSel label="Plano" value={form.plano} onChange={v=>f("plano",v)} options={["Básico","Essencial","Premium","Full"].map(p=>({value:p,label:p}))}/>
        </div>
        <div style={{display:"flex",gap:10,marginTop:4}}>
          <Btn style={{flex:1}} onClick={save} disabled={saving}>{saving?"Salvando...":"Salvar Cliente"}</Btn>
          <Btn variant="ghost" onClick={()=>setModal(false)} style={{flex:1}}>Cancelar</Btn>
        </div>
      </Modal>}

      {confirm&&<ConfirmModal msg={`Remover "${confirm.name}"? Esta ação não pode ser desfeita.`} onConfirm={()=>remove(confirm.id)} onCancel={()=>setConfirm(null)}/>}
    </div>
  );
};

// ── FINANCEIRO ────────────────────────────────────────────────────────────────
const FinanceiroPage=({clients,cobr,despesas})=>{
  const recR=cobr.filter(c=>c.status==="pago").reduce((a,c)=>a+Number(c.valor),0);
  const recP=cobr.filter(c=>c.status==="pendente").reduce((a,c)=>a+Number(c.valor),0);
  const recA=cobr.filter(c=>c.status==="atrasado").reduce((a,c)=>a+Number(c.valor),0);
  const despT=despesas.reduce((a,d)=>a+Number(d.valor),0);
  const despPago=despesas.filter(d=>d.status==="pago").reduce((a,d)=>a+Number(d.valor),0);
  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:14,marginBottom:24}}>
        <MC label="Receita recebida" value={`R$ ${recR.toLocaleString()}`} icon={IC.check} bg="#ECFDF5"/>
        <MC label="Em aberto" value={`R$ ${recP.toLocaleString()}`} icon={IC.clock} bg="#FFFBEB"/>
        <MC label="Atrasado" value={`R$ ${recA.toLocaleString()}`} icon={IC.alert} bg="#FEF2F2"/>
        <MC label="Despesas do mês" value={`R$ ${despT.toLocaleString()}`} icon={IC.money} bg="#F8FAFC"/>
        <MC label="Lucro líquido" value={`R$ ${(recR-despPago).toLocaleString()}`} icon={IC.trending} bg="#ECFDF5"/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
        <Card>
          <ST>Receita por cliente</ST>
          {clients.filter(c=>c.status==="ativo").map(c=>(
            <div key={c.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:"1px solid #EEF3F8"}}>
              <ClientLogo url={c.logo_url} name={c.name} size={36}/>
              <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:"#111827"}}>{c.name}</div><div style={{fontSize:11,color:"#64748B"}}>Dia {c.vencimento}</div></div>
              <div style={{textAlign:"right"}}><div style={{fontSize:14,fontWeight:800}}>R$ {Number(c.valor).toLocaleString()}</div></div>
            </div>
          ))}
        </Card>
        <Card>
          <ST>Despesas por categoria</ST>
          {Object.entries(despesas.reduce((acc,d)=>{acc[d.categoria]=(acc[d.categoria]||0)+Number(d.valor);return acc;},{})).map(([cat,val])=>(
            <div key={cat} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid #EEF3F8",fontSize:13}}>
              <span style={{color:"#374151",fontWeight:600}}>{cat}</span><span style={{fontWeight:800}}>R$ {val.toLocaleString()}</span>
            </div>
          ))}
          <div style={{marginTop:14,display:"flex",justifyContent:"space-between",fontWeight:800,fontSize:15}}><span>Total</span><span style={{color:"#EF4444"}}>R$ {despT.toLocaleString()}</span></div>
        </Card>
      </div>
    </div>
  );
};

// ── COBRANÇAS ─────────────────────────────────────────────────────────────────
const BLANK_COBR={cliente:"",valor:"",vencimento:"",status:"pendente",pagamento:""};

const CobrancasPage=({cobr,setCobr,clients,loading})=>{
  const [filter,setFilter]=useState("todos");
  const [modal,setModal]=useState(false);
  const [form,setForm]=useState(BLANK_COBR);
  const [editing,setEditing]=useState(null);
  const [confirm,setConfirm]=useState(null);
  const [saving,setSaving]=useState(false);

  const fl=cobr.filter(c=>filter==="todos"||c.status===filter);
  const f=(k,v)=>setForm(p=>({...p,[k]:v}));

  const openNew=()=>{setForm(BLANK_COBR);setEditing(null);setModal(true);};
  const openEdit=(c)=>{setForm({...c,vencimento:c.vencimento?.split("T")[0]||c.vencimento});setEditing(c.id);setModal(true);};

  const marcarPago=async(id)=>{
    await supabase.from("cobrancas").update({status:"pago",pagamento:"Pix"}).eq("id",id);
    setCobr(prev=>prev.map(c=>c.id===id?{...c,status:"pago",pagamento:"Pix"}:c));
  };

  const save=async()=>{
    if(!form.cliente||!form.valor){return;}
    setSaving(true);
    const data={cliente:form.cliente,valor:Number(form.valor),vencimento:form.vencimento,status:form.status,pagamento:form.pagamento};
    if(editing){
      await supabase.from("cobrancas").update(data).eq("id",editing);
      setCobr(prev=>prev.map(c=>c.id===editing?{...c,...data}:c));
    } else {
      const {data:ins}=await supabase.from("cobrancas").insert([data]).select();
      if(ins) setCobr(prev=>[...prev,...ins]);
    }
    setSaving(false);setModal(false);
  };

  const remove=async(id)=>{
    await supabase.from("cobrancas").delete().eq("id",id);
    setCobr(prev=>prev.filter(c=>c.id!==id));
    setConfirm(null);
  };

  if(loading) return <Loading/>;
  return (
    <div>
      <div style={{display:"flex",gap:12,marginBottom:20,alignItems:"center",flexWrap:"wrap"}}>
        {["todos","pendente","pago","atrasado"].map(fi=><Btn key={fi} size="sm" variant={filter===fi?"secondary":"ghost"} onClick={()=>setFilter(fi)}>{fi.charAt(0).toUpperCase()+fi.slice(1)} <span style={{marginLeft:6,background:filter===fi?"rgba(255,255,255,0.25)":"#EEF3F8",borderRadius:99,padding:"0 6px",fontSize:11,fontWeight:800,color:filter===fi?"#fff":"#64748B"}}>{cobr.filter(c=>fi==="todos"||c.status===fi).length}</span></Btn>)}
        <div style={{flex:1}}/><Btn onClick={openNew}>+ Nova Cobrança</Btn>
      </div>
      <Card style={{padding:0}}>
        <Tbl cols={["Cliente","Valor","Vencimento","Forma","Status","Ações"]}
          rows={fl.map(c=>[
            <span style={{fontWeight:700,color:"#111827"}}>{c.cliente}</span>,
            <span style={{fontWeight:800}}>R$ {Number(c.valor).toLocaleString()}</span>,
            fmtDate(c.vencimento),
            c.pagamento||<span style={{color:"#94A3B8"}}>—</span>,
            <StatusBadge status={c.status}/>,
            <div style={{display:"flex",gap:6}}>
              {c.status!=="pago"&&<Btn size="sm" variant="success" onClick={()=>marcarPago(c.id)}>Pago</Btn>}
              <Btn size="sm" variant="ghost" onClick={()=>openEdit(c)}>{IC.edit}</Btn>
              <Btn size="sm" variant="danger" onClick={()=>setConfirm(c)}>{IC.trash}</Btn>
            </div>
          ])}/>
      </Card>
      {modal&&<Modal title={editing?"Editar Cobrança":"Nova Cobrança"} onClose={()=>setModal(false)}>
        <FSel label="Cliente" value={form.cliente} onChange={v=>f("cliente",v)} options={[{value:"",label:"Selecione..."},...clients.map(c=>({value:c.name,label:c.name}))]}/>
        <FInput label="Valor (R$)" value={form.valor} onChange={v=>f("valor",v)} placeholder="1800"/>
        <FInput label="Data de vencimento" value={form.vencimento} onChange={v=>f("vencimento",v)} type="date"/>
        <FSel label="Status" value={form.status} onChange={v=>f("status",v)} options={[{value:"pendente",label:"Pendente"},{value:"pago",label:"Pago"},{value:"atrasado",label:"Atrasado"}]}/>
        <FSel label="Forma de pagamento" value={form.pagamento} onChange={v=>f("pagamento",v)} options={[{value:"",label:"—"},{value:"Pix",label:"Pix"},{value:"Transferência",label:"Transferência"},{value:"Boleto",label:"Boleto"}]}/>
        <div style={{display:"flex",gap:10}}><Btn style={{flex:1}} onClick={save} disabled={saving}>{saving?"Salvando...":"Salvar"}</Btn><Btn variant="ghost" onClick={()=>setModal(false)} style={{flex:1}}>Cancelar</Btn></div>
      </Modal>}
      {confirm&&<ConfirmModal msg={`Remover cobrança de "${confirm.cliente}"?`} onConfirm={()=>remove(confirm.id)} onCancel={()=>setConfirm(null)}/>}
    </div>
  );
};

// ── DESPESAS ──────────────────────────────────────────────────────────────────
const BLANK_DESP={nome:"",categoria:"Ferramentas",valor:"",vencimento:"",status:"pendente"};

const DespesasPage=({despesas,setDespesas,loading})=>{
  const [modal,setModal]=useState(false);
  const [form,setForm]=useState(BLANK_DESP);
  const [editing,setEditing]=useState(null);
  const [confirm,setConfirm]=useState(null);
  const [saving,setSaving]=useState(false);

  const f=(k,v)=>setForm(p=>({...p,[k]:v}));
  const total=despesas.reduce((a,d)=>a+Number(d.valor),0);
  const pagas=despesas.filter(d=>d.status==="pago").reduce((a,d)=>a+Number(d.valor),0);

  const openNew=()=>{setForm(BLANK_DESP);setEditing(null);setModal(true);};
  const openEdit=(d)=>{setForm({...d,vencimento:d.vencimento?.split("T")[0]||d.vencimento});setEditing(d.id);setModal(true);};

  const marcarPago=async(id)=>{
    await supabase.from("despesas").update({status:"pago"}).eq("id",id);
    setDespesas(prev=>prev.map(d=>d.id===id?{...d,status:"pago"}:d));
  };

  const save=async()=>{
    if(!form.nome){return;}
    setSaving(true);
    const data={nome:form.nome,categoria:form.categoria,valor:Number(form.valor),vencimento:form.vencimento,status:form.status};
    if(editing){
      await supabase.from("despesas").update(data).eq("id",editing);
      setDespesas(prev=>prev.map(d=>d.id===editing?{...d,...data}:d));
    } else {
      const {data:ins}=await supabase.from("despesas").insert([data]).select();
      if(ins) setDespesas(prev=>[...prev,...ins]);
    }
    setSaving(false);setModal(false);
  };

  const remove=async(id)=>{
    await supabase.from("despesas").delete().eq("id",id);
    setDespesas(prev=>prev.filter(d=>d.id!==id));
    setConfirm(null);
  };

  if(loading) return <Loading/>;
  return (
    <div>
      <div style={{display:"flex",gap:14,marginBottom:20,flexWrap:"wrap",alignItems:"flex-start"}}>
        <MC label="Total despesas" value={`R$ ${total.toLocaleString()}`} icon={IC.money} bg="#F8FAFC"/>
        <MC label="Já pagas" value={`R$ ${pagas.toLocaleString()}`} icon={IC.check} bg="#ECFDF5"/>
        <MC label="A pagar" value={`R$ ${(total-pagas).toLocaleString()}`} icon={IC.clock} bg="#FFFBEB"/>
        <div style={{marginLeft:"auto"}}><Btn onClick={openNew}>+ Adicionar Despesa</Btn></div>
      </div>
      <Card style={{padding:0}}>
        <Tbl cols={["Nome","Categoria","Valor","Vencimento","Status","Ações"]}
          rows={despesas.map(d=>[
            <span style={{fontWeight:700,color:"#111827"}}>{d.nome}</span>,
            <span style={{background:"#EEF3F8",borderRadius:6,padding:"2px 8px",fontSize:12,fontWeight:600,color:"#64748B"}}>{d.categoria}</span>,
            <span style={{fontWeight:800}}>R$ {Number(d.valor).toLocaleString()}</span>,
            fmtDate(d.vencimento),
            <StatusBadge status={d.status}/>,
            <div style={{display:"flex",gap:6}}>
              {d.status!=="pago"&&<Btn size="sm" variant="success" onClick={()=>marcarPago(d.id)}>Pago</Btn>}
              <Btn size="sm" variant="ghost" onClick={()=>openEdit(d)}>{IC.edit}</Btn>
              <Btn size="sm" variant="danger" onClick={()=>setConfirm(d)}>{IC.trash}</Btn>
            </div>
          ])}/>
      </Card>
      {modal&&<Modal title={editing?"Editar Despesa":"Nova Despesa"} onClose={()=>setModal(false)}>
        <FInput label="Nome da despesa *" value={form.nome} onChange={v=>f("nome",v)} placeholder="Adobe Creative Cloud"/>
        <FSel label="Categoria" value={form.categoria} onChange={v=>f("categoria",v)} options={["Ferramentas","Assinaturas","Colaboradores","Internet","Equipamentos","Outros"].map(c=>({value:c,label:c}))}/>
        <FInput label="Valor (R$)" value={form.valor} onChange={v=>f("valor",v)} placeholder="349"/>
        <FInput label="Data de vencimento" value={form.vencimento} onChange={v=>f("vencimento",v)} type="date"/>
        <FSel label="Status" value={form.status} onChange={v=>f("status",v)} options={[{value:"pendente",label:"Pendente"},{value:"pago",label:"Pago"}]}/>
        <div style={{display:"flex",gap:10}}><Btn style={{flex:1}} onClick={save} disabled={saving}>{saving?"Salvando...":"Salvar"}</Btn><Btn variant="ghost" onClick={()=>setModal(false)} style={{flex:1}}>Cancelar</Btn></div>
      </Modal>}
      {confirm&&<ConfirmModal msg={`Remover "${confirm.nome}"?`} onConfirm={()=>remove(confirm.id)} onCancel={()=>setConfirm(null)}/>}
    </div>
  );
};

// ── TAREFAS KANBAN ────────────────────────────────────────────────────────────
const BLANK_TASK={titulo:"",cliente:"",responsavel:"",prioridade:"media",status:"a_fazer",tipo:"Design",entrega:""};

const TarefasPage=({tasks,setTasks,clients,equipe,loading})=>{
  const [modal,setModal]=useState(false);
  const [form,setForm]=useState(BLANK_TASK);
  const [editing,setEditing]=useState(null);
  const [confirm,setConfirm]=useState(null);
  const [dragId,setDragId]=useState(null);
  const [filter,setFilter]=useState("");
  const [saving,setSaving]=useState(false);

  const cols=[{id:"a_fazer",label:"A Fazer",color:"#1D4ED8"},{id:"em_producao",label:"Em Produção",color:"#FF6200"},{id:"aguardando",label:"Aguardando",color:"#7C3AED"},{id:"ajustes",label:"Ajustes",color:"#F59E0B"},{id:"finalizado",label:"Finalizado",color:"#10B981"},{id:"atrasado",label:"Atrasado",color:"#EF4444"}];
  const fl=tasks.filter(t=>filter===""||t.cliente?.toLowerCase().includes(filter.toLowerCase())||t.responsavel?.toLowerCase().includes(filter.toLowerCase()));
  const f=(k,v)=>setForm(p=>({...p,[k]:v}));

  const openNew=()=>{setForm(BLANK_TASK);setEditing(null);setModal(true);};
  const openEdit=(t)=>{setForm({...t,entrega:t.entrega?.split("T")[0]||t.entrega});setEditing(t.id);setModal(true);};

  const drop=async(newStatus)=>{
    if(!dragId) return;
    await supabase.from("tarefas").update({status:newStatus}).eq("id",dragId);
    setTasks(prev=>prev.map(t=>t.id===dragId?{...t,status:newStatus}:t));
    setDragId(null);
  };

  const save=async()=>{
    if(!form.titulo){return;}
    setSaving(true);
    const data={titulo:form.titulo,cliente:form.cliente,responsavel:form.responsavel,prioridade:form.prioridade,status:form.status,tipo:form.tipo,entrega:form.entrega};
    if(editing){
      await supabase.from("tarefas").update(data).eq("id",editing);
      setTasks(prev=>prev.map(t=>t.id===editing?{...t,...data}:t));
    } else {
      const {data:ins}=await supabase.from("tarefas").insert([data]).select();
      if(ins) setTasks(prev=>[...prev,...ins]);
    }
    setSaving(false);setModal(false);
  };

  const remove=async(id)=>{
    await supabase.from("tarefas").delete().eq("id",id);
    setTasks(prev=>prev.filter(t=>t.id!==id));
    setConfirm(null);
  };

  if(loading) return <Loading/>;
  return (
    <div>
      <div style={{display:"flex",gap:12,marginBottom:18,alignItems:"center"}}>
        <input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Filtrar por cliente ou responsável..." style={{flex:1,padding:"9px 14px",borderRadius:9,border:"1.5px solid #DDE5EF",fontSize:13,color:"#111827",outline:"none",fontFamily:"inherit"}}/>
        <Btn onClick={openNew}>+ Nova Tarefa</Btn>
      </div>
      <div style={{display:"flex",gap:14,overflowX:"auto",paddingBottom:16}}>
        {cols.map(col=>{
          const ct=fl.filter(t=>t.status===col.id);
          return (
            <div key={col.id} style={{minWidth:240,flex:"0 0 240px"}} onDragOver={e=>e.preventDefault()} onDrop={()=>drop(col.id)}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                <div style={{width:10,height:10,borderRadius:99,background:col.color}}/>
                <span style={{fontSize:13,fontWeight:800,color:"#1F2F46"}}>{col.label}</span>
                <span style={{marginLeft:"auto",background:"#EEF3F8",borderRadius:99,padding:"1px 9px",fontSize:11,fontWeight:700,color:"#64748B"}}>{ct.length}</span>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:10,minHeight:120,background:"#F0F4F9",borderRadius:12,padding:10}}>
                {ct.map(t=>(
                  <div key={t.id} draggable onDragStart={()=>setDragId(t.id)} style={{background:"#fff",borderRadius:10,padding:"12px 14px",boxShadow:"0 1px 3px rgba(0,0,0,0.06)",cursor:"grab",borderLeft:`3px solid ${col.color}`}}>
                    <div style={{fontSize:13,fontWeight:700,color:"#111827",marginBottom:4}}>{t.titulo}</div>
                    <div style={{fontSize:11,color:"#64748B",marginBottom:8}}>{t.cliente}</div>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><PBadge p={t.prioridade}/><div style={{fontSize:11,color:"#64748B"}}>{t.responsavel}</div></div>
                    <div style={{fontSize:11,color:"#94A3B8",display:"flex",alignItems:"center",gap:4,marginBottom:8}}>{IC.clock} {fmtDate(t.entrega)}</div>
                    <div style={{display:"flex",gap:6}}>
                      <Btn size="sm" variant="ghost" style={{flex:1,padding:"4px 8px"}} onClick={()=>openEdit(t)}>{IC.edit}</Btn>
                      <Btn size="sm" variant="danger" style={{flex:1,padding:"4px 8px"}} onClick={()=>setConfirm(t)}>{IC.trash}</Btn>
                    </div>
                  </div>
                ))}
                {ct.length===0&&<div style={{color:"#94A3B8",fontSize:12,textAlign:"center",padding:"20px 0"}}>Solte aqui</div>}
              </div>
            </div>
          );
        })}
      </div>
      {modal&&<Modal title={editing?"Editar Tarefa":"Nova Tarefa"} onClose={()=>setModal(false)}>
        <FInput label="Título *" value={form.titulo} onChange={v=>f("titulo",v)} placeholder="Arte Dia dos Namorados"/>
        <FSel label="Cliente" value={form.cliente} onChange={v=>f("cliente",v)} options={[{value:"",label:"Selecione..."},...clients.map(c=>({value:c.name,label:c.name}))]}/>
        <FSel label="Responsável" value={form.responsavel} onChange={v=>f("responsavel",v)} options={[{value:"",label:"Selecione..."},...equipe.map(e=>({value:e.nome.split(" ")[0],label:e.nome}))]}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          <FSel label="Prioridade" value={form.prioridade} onChange={v=>f("prioridade",v)} options={["baixa","media","alta","urgente"].map(p=>({value:p,label:p.charAt(0).toUpperCase()+p.slice(1)}))}/>
          <FSel label="Tipo" value={form.tipo} onChange={v=>f("tipo",v)} options={["Design","Vídeo","Tráfego pago","Relatório","Aprovação","Conteúdo"].map(t=>({value:t,label:t}))}/>
        </div>
        <FSel label="Status" value={form.status} onChange={v=>f("status",v)} options={["a_fazer","em_producao","aguardando","ajustes","finalizado","atrasado"].map(s=>({value:s,label:s.replace("_"," ").replace(/\b\w/g,l=>l.toUpperCase())}))}/>
        <FInput label="Data de entrega" value={form.entrega} onChange={v=>f("entrega",v)} type="date"/>
        <div style={{display:"flex",gap:10}}><Btn style={{flex:1}} onClick={save} disabled={saving}>{saving?"Salvando...":"Salvar"}</Btn><Btn variant="ghost" onClick={()=>setModal(false)} style={{flex:1}}>Cancelar</Btn></div>
      </Modal>}
      {confirm&&<ConfirmModal msg={`Remover tarefa "${confirm.titulo}"?`} onConfirm={()=>remove(confirm.id)} onCancel={()=>setConfirm(null)}/>}
    </div>
  );
};

// ── EQUIPE ────────────────────────────────────────────────────────────────────
const BLANK_EQ={nome:"",funcao:"",tipo:"fixo",status:"ativo",whatsapp:""};

const EquipePage=({equipe,setEquipe,tasks,loading})=>{
  const [modal,setModal]=useState(false);
  const [form,setForm]=useState(BLANK_EQ);
  const [editing,setEditing]=useState(null);
  const [confirm,setConfirm]=useState(null);
  const [verTarefas,setVerTarefas]=useState(null);
  const [saving,setSaving]=useState(false);

  const f=(k,v)=>setForm(p=>({...p,[k]:v}));
  const openNew=()=>{setForm(BLANK_EQ);setEditing(null);setModal(true);};
  const openEdit=(e)=>{setForm({...e});setEditing(e.id);setModal(true);};

  const save=async()=>{
    if(!form.nome){return;}
    setSaving(true);
    const data={nome:form.nome,funcao:form.funcao,tipo:form.tipo,status:form.status,whatsapp:form.whatsapp};
    if(editing){
      await supabase.from("colaboradores").update(data).eq("id",editing);
      setEquipe(prev=>prev.map(e=>e.id===editing?{...e,...data}:e));
    } else {
      const {data:ins}=await supabase.from("colaboradores").insert([data]).select();
      if(ins) setEquipe(prev=>[...prev,...ins]);
    }
    setSaving(false);setModal(false);
  };

  const remove=async(id)=>{
    await supabase.from("colaboradores").delete().eq("id",id);
    setEquipe(prev=>prev.filter(e=>e.id!==id));
    setConfirm(null);
  };

  if(loading) return <Loading/>;
  return (
    <div>
      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:18}}><Btn onClick={openNew}>+ Adicionar Colaborador</Btn></div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:16}}>
        {equipe.map(e=>{
          const primeiroNome=e.nome.split(" ")[0];
          const tf=tasks.filter(t=>t.responsavel===primeiroNome);
          const at=tf.filter(t=>t.status==="atrasado");
          return (
            <Card key={e.id}>
              <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:14}}>
                <div style={{width:50,height:50,background:"linear-gradient(135deg,#1F2F46,#2D4A6A)",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:20,fontWeight:800}}>{e.nome.charAt(0)}</div>
                <div>
                  <div style={{fontSize:15,fontWeight:800,color:"#111827"}}>{e.nome}</div>
                  <div style={{fontSize:12,color:"#64748B"}}>{e.funcao}</div>
                  <span style={{background:e.tipo==="fixo"?"#EFF6FF":"#F5F3FF",color:e.tipo==="fixo"?"#1D4ED8":"#7C3AED",fontSize:11,fontWeight:700,borderRadius:6,padding:"2px 8px"}}>{e.tipo?.charAt(0).toUpperCase()+e.tipo?.slice(1)}</span>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>
                <div style={{background:"#F8FAFC",borderRadius:8,padding:"8px 10px",textAlign:"center"}}><div style={{fontSize:18,fontWeight:800,color:"#111827"}}>{tf.length}</div><div style={{fontSize:10,color:"#64748B",fontWeight:600}}>Total</div></div>
                <div style={{background:"#ECFDF5",borderRadius:8,padding:"8px 10px",textAlign:"center"}}><div style={{fontSize:18,fontWeight:800,color:"#10B981"}}>{tf.filter(t=>t.status==="finalizado").length}</div><div style={{fontSize:10,color:"#10B981",fontWeight:600}}>Feitas</div></div>
                <div style={{background:at.length>0?"#FEF2F2":"#F8FAFC",borderRadius:8,padding:"8px 10px",textAlign:"center"}}><div style={{fontSize:18,fontWeight:800,color:at.length>0?"#EF4444":"#94A3B8"}}>{at.length}</div><div style={{fontSize:10,color:"#64748B",fontWeight:600}}>Atras.</div></div>
              </div>
              <div style={{fontSize:12,color:"#64748B",marginBottom:12}}>{e.whatsapp}</div>
              <div style={{display:"flex",gap:8}}>
                <Btn size="sm" variant="ghost" style={{flex:1}} onClick={()=>setVerTarefas({nome:e.nome,tasks:tf})}>Ver tarefas</Btn>
                <Btn size="sm" variant="ghost" onClick={()=>openEdit(e)}>{IC.edit}</Btn>
                <Btn size="sm" variant="danger" onClick={()=>setConfirm(e)}>{IC.trash}</Btn>
              </div>
            </Card>
          );
        })}
      </div>

      {verTarefas&&<Modal title={`Tarefas — ${verTarefas.nome}`} onClose={()=>setVerTarefas(null)}>
        {verTarefas.tasks.length===0?<div style={{textAlign:"center",color:"#64748B",padding:"20px 0"}}>Nenhuma tarefa atribuída.</div>:verTarefas.tasks.map(t=>(
          <div key={t.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 12px",background:"#F8FAFC",borderRadius:10,marginBottom:8}}>
            <div><div style={{fontSize:13,fontWeight:700,color:"#111827"}}>{t.titulo}</div><div style={{fontSize:11,color:"#64748B"}}>{t.cliente} · {fmtDate(t.entrega)}</div></div>
            <div style={{display:"flex",gap:8,alignItems:"center"}}><PBadge p={t.prioridade}/><StatusBadge status={t.status}/></div>
          </div>
        ))}
      </Modal>}

      {modal&&<Modal title={editing?"Editar Colaborador":"Novo Colaborador"} onClose={()=>setModal(false)}>
        <FInput label="Nome completo *" value={form.nome} onChange={v=>f("nome",v)} placeholder="Juliana Ferreira"/>
        <FInput label="Função" value={form.funcao} onChange={v=>f("funcao",v)} placeholder="Designer"/>
        <FInput label="WhatsApp" value={form.whatsapp} onChange={v=>f("whatsapp",v)} placeholder="94997001122"/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          <FSel label="Tipo" value={form.tipo} onChange={v=>f("tipo",v)} options={[{value:"fixo",label:"Fixo"},{value:"freelancer",label:"Freelancer"}]}/>
          <FSel label="Status" value={form.status} onChange={v=>f("status",v)} options={[{value:"ativo",label:"Ativo"},{value:"inativo",label:"Inativo"}]}/>
        </div>
        <div style={{display:"flex",gap:10}}><Btn style={{flex:1}} onClick={save} disabled={saving}>{saving?"Salvando...":"Salvar"}</Btn><Btn variant="ghost" onClick={()=>setModal(false)} style={{flex:1}}>Cancelar</Btn></div>
      </Modal>}

      {confirm&&<ConfirmModal msg={`Remover "${confirm.nome}" da equipe?`} onConfirm={()=>remove(confirm.id)} onCancel={()=>setConfirm(null)}/>}
    </div>
  );
};

// ── CALENDÁRIO ────────────────────────────────────────────────────────────────
const MOCK_DATAS=[
  {id:1,nome:"Dia dos Namorados",data:"12/06/2025",tipo:"Comercial",nivel:"alto",nichos:["Restaurantes","Floricultura","Moda","Presentes"],status:"urgente"},
  {id:2,nome:"Festa Junina / São João",data:"24/06/2025",tipo:"Sazonal",nivel:"medio",nichos:["Alimentação","Vestuário","Eventos"],status:"planejar"},
  {id:3,nome:"Dia do Médico",data:"18/10/2025",tipo:"Nicho",nivel:"alto",nichos:["Saúde","Clínicas","Hospitais"],status:"futuro"},
  {id:4,nome:"Black Friday",data:"28/11/2025",tipo:"Comercial",nivel:"critico",nichos:["Todos os nichos"],status:"futuro"},
  {id:5,nome:"Aniversário de Marabá",data:"04/04/2026",tipo:"Local",nivel:"medio",nichos:["Comércio local","Serviços"],status:"futuro"},
];
const CalendarioPage=()=>{
  const [sel,setSel]=useState(null);
  const nm={alto:"#FF6200",medio:"#F59E0B",critico:"#EF4444"};
  return (
    <div>
      <div style={{fontSize:13,color:"#64748B",marginBottom:20}}>Datas comemorativas e oportunidades para seus clientes</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:14}}>
        {MOCK_DATAS.map(d=>(
          <Card key={d.id} onClick={()=>setSel(d)} style={{cursor:"pointer",borderLeft:`4px solid ${nm[d.nivel]||"#64748B"}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
              <div><div style={{fontSize:15,fontWeight:800,color:"#111827"}}>{d.nome}</div><div style={{fontSize:12,color:"#64748B",marginTop:2}}>{d.data}</div></div>
              <StatusBadge status={d.status}/>
            </div>
            <div style={{fontSize:12,color:"#64748B"}}>Nichos: {d.nichos.slice(0,3).join(", ")}</div>
          </Card>
        ))}
      </div>
      {sel&&<Modal title={sel.nome} onClose={()=>setSel(null)}>
        <div style={{background:"#EEF3F8",borderRadius:10,padding:"14px 16px",marginBottom:16,fontSize:13,fontWeight:700,color:"#111827"}}>{sel.data} · {sel.tipo}</div>
        <div style={{marginBottom:14}}><div style={{fontSize:12,fontWeight:700,color:"#64748B",textTransform:"uppercase",letterSpacing:0.5,marginBottom:8}}>Nichos</div><div style={{display:"flex",flexWrap:"wrap",gap:6}}>{sel.nichos.map(n=><span key={n} style={{background:"#FFF7F3",color:"#FF6200",borderRadius:8,padding:"4px 12px",fontSize:12,fontWeight:700}}>{n}</span>)}</div></div>
        <div style={{display:"flex",gap:10}}><Btn style={{flex:1}}>Criar Campanha</Btn><Btn variant="secondary" style={{flex:1}}>Criar Tarefas</Btn></div>
      </Modal>}
    </div>
  );
};

// ── TRÁFEGO ───────────────────────────────────────────────────────────────────
const MOCK_TRAFEGO=[
  {id:1,cliente:"Academia FitBody",plataforma:"Meta Ads",recebido:1500,gasto:1430,saldo:70,status:"baixo"},
  {id:2,cliente:"Clínica Beleza & Saúde",plataforma:"Meta Ads",recebido:2000,gasto:1200,saldo:800,status:"ok"},
  {id:3,cliente:"Churrascaria Pantanal",plataforma:"Google Ads",recebido:1000,gasto:1000,saldo:0,status:"zerado"},
  {id:4,cliente:"Moda Feminina Estilo",plataforma:"Meta Ads",recebido:800,gasto:350,saldo:450,status:"ok"},
];
const TráfegoPage=()=>(
  <div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:16}}>
      {MOCK_TRAFEGO.map(t=>{
        const pct=Math.round((t.gasto/t.recebido)*100);
        return (
          <Card key={t.id} style={{borderLeft:`4px solid ${t.status==="ok"?"#10B981":t.status==="baixo"?"#F59E0B":"#EF4444"}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
              <div><div style={{fontSize:15,fontWeight:800,color:"#111827"}}>{t.cliente}</div><div style={{fontSize:12,color:"#64748B"}}>{t.plataforma}</div></div>
              <StatusBadge status={t.status}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:14}}>
              <div><div style={{fontSize:10,color:"#64748B",fontWeight:700,textTransform:"uppercase"}}>Recebido</div><div style={{fontSize:15,fontWeight:800}}>R$ {t.recebido.toLocaleString()}</div></div>
              <div><div style={{fontSize:10,color:"#64748B",fontWeight:700,textTransform:"uppercase"}}>Gasto</div><div style={{fontSize:15,fontWeight:800,color:"#EF4444"}}>R$ {t.gasto.toLocaleString()}</div></div>
              <div><div style={{fontSize:10,color:"#64748B",fontWeight:700,textTransform:"uppercase"}}>Saldo</div><div style={{fontSize:15,fontWeight:800,color:t.saldo<100?"#EF4444":"#10B981"}}>R$ {t.saldo.toLocaleString()}</div></div>
            </div>
            <div style={{background:"#EEF3F8",borderRadius:99,height:8,overflow:"hidden",marginBottom:10}}><div style={{background:t.status==="ok"?"#10B981":t.status==="baixo"?"#F59E0B":"#EF4444",height:"100%",width:`${pct}%`,borderRadius:99}}/></div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"#64748B"}}><span>{pct}% utilizado</span>{t.status!=="ok"&&<span style={{color:"#EF4444",fontWeight:700}}>{t.status==="zerado"?"Campanha pausada!":"Saldo baixo!"}</span>}</div>
            {t.status!=="ok"&&<div style={{marginTop:12}}><Btn size="sm" style={{width:"100%"}}>Solicitar recarga ao cliente</Btn></div>}
          </Card>
        );
      })}
    </div>
  </div>
);

// ── MODELOS ───────────────────────────────────────────────────────────────────
const MODELOS=[
  {cat:"Cobrança",nome:"Lembrete 3 dias antes",msg:"Olá, {{nome}}! Passando para lembrar que a mensalidade referente aos serviços da MarketForge vence no dia {{data}}. Valor: R$ {{valor}}. Qualquer dúvida, estou à disposição."},
  {cat:"Cobrança",nome:"Vencimento hoje",msg:"Olá, {{nome}}! Hoje é o vencimento da mensalidade referente aos serviços da MarketForge. Valor: R$ {{valor}}. Pode enviar o comprovante por aqui assim que realizar o pagamento."},
  {cat:"Cobrança",nome:"2 dias em atraso",msg:"Olá, {{nome}}! Identificamos que a mensalidade com vencimento em {{data}} ainda consta como pendente. Consegue verificar para a gente, por favor?"},
  {cat:"Tráfego",nome:"Saldo baixo",msg:"Olá, {{nome}}! O saldo atual da campanha é de R$ {{saldo}}. Para mantermos os anúncios ativos sem interrupção, recomendamos uma nova recarga."},
  {cat:"Equipe",nome:"Lembrete tarefa",msg:"Oi, {{colaborador}}! Você tem uma tarefa para entregar {{data}}: {{titulo}}. Cliente: {{cliente}}. Acesse o painel e atualize o status quando finalizar."},
  {cat:"Contratos",nome:"Renovação de contrato",msg:"Olá, {{nome}}! Seu contrato com a MarketForge está próximo do vencimento. Podemos alinhar a renovação para manter a continuidade dos serviços."},
];
const MensagensPage=()=>{
  const cats=[...new Set(MODELOS.map(m=>m.cat))];
  const [ac,setAc]=useState("Cobrança");
  const [cp,setCp]=useState(null);
  const copy=(msg,i)=>{navigator.clipboard.writeText(msg).catch(()=>{});setCp(i);setTimeout(()=>setCp(null),2000);};
  return (
    <div>
      <div style={{display:"flex",gap:8,marginBottom:20}}>{cats.map(c=><Btn key={c} size="sm" variant={ac===c?"secondary":"ghost"} onClick={()=>setAc(c)}>{c}</Btn>)}</div>
      {MODELOS.filter(m=>m.cat===ac).map((m,i)=>(
        <Card key={i} style={{marginBottom:14}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
            <span style={{fontSize:15,fontWeight:800,color:"#111827"}}>{m.nome}</span>
            <Btn size="sm" variant={cp===i?"success":"ghost"} onClick={()=>copy(m.msg,i)}>{cp===i?"Copiado!":"Copiar"}</Btn>
          </div>
          <div style={{background:"#F8FAFC",borderRadius:10,padding:"14px 16px",fontSize:13,color:"#374151",lineHeight:1.6}}>
            {m.msg.split(/({{[^}]+}})/).map((part,j)=>/{{.+}}/.test(part)?<span key={j} style={{background:"#FFF7F3",color:"#FF6200",fontWeight:700,borderRadius:4,padding:"0 4px"}}>{part}</span>:part)}
          </div>
        </Card>
      ))}
    </div>
  );
};

// ── APP ROOT ──────────────────────────────────────────────────────────────────
export default function App() {
  const [loggedIn,setLoggedIn]=useState(false);
const [perfil,setPerfil]=useState("operacional");
const [nomeUser,setNomeUser]=useState("erikklinder");(()=>{
  if(typeof window !== "undefined") return localStorage.getItem("mf_logged") === "true";
  return false;
});
  const [page,setPage]=useState("hoje");

  // Data state
  const [clients,setClients]=useState([]);
  const [cobr,setCobr]=useState([]);
  const [tasks,setTasks]=useState([]);
  const [despesas,setDespesas]=useState([]);
  const [equipe,setEquipe]=useState([]);
  const [loadingData,setLoadingData]=useState(true);

  // Seed se tabela vazia
const seedIfEmpty = async (table, seed, setter) => {
  try {
    const {data, error} = await supabase.from(table).select("*");
    if(error) { console.error("Erro ao carregar", table, error); return; }
    if(data?.length === 0) {
      const {data:ins, error:e2} = await supabase.from(table).insert(seed).select();
      if(e2) console.error("Erro ao inserir seed", table, e2);
      if(ins) setter(ins);
    } else {
      setter(data);
    }
  } catch(e) {
    console.error("seedIfEmpty error", table, e);
  }
};

  useEffect(()=>{
    if(!loggedIn) return;
const load = async () => {
  setLoadingData(true);
  try {
    const {data:c} = await supabase.from("clientes").select("*");
    if(c) setClients(c);
    const {data:cb} = await supabase.from("cobrancas").select("*");
    if(cb) setCobr(cb);
    const {data:t} = await supabase.from("tarefas").select("*");
    if(t) setTasks(t);
    const {data:d} = await supabase.from("despesas").select("*");
    if(d) setDespesas(d);
    const {data:e} = await supabase.from("colaboradores").select("*");
    if(e) setEquipe(e);
  } catch(err) {
    console.error("Erro ao carregar dados:", err);
    alert("Erro: " + JSON.stringify(err));
  } finally {
    setLoadingData(false);
  }
};
load();
  },[loggedIn]);

  if(!loggedIn) return <LoginPage onLogin={(p,n)=>{setLoggedIn(true);setPerfil(p);setNomeUser(n);}}/>;

  const cobrPend = cobr.filter(c=>c.status==="pendente"||c.status==="atrasado").length;

  const pages = {
    hoje:<HojePage setPage={setPage} clients={clients} cobr={cobr} tasks={tasks}/>,
    dashboard:<DashboardPage clients={clients} cobr={cobr} despesas={despesas}/>,
    clientes:<ClientesPage clients={clients} setClients={setClients} loading={loadingData}/>,
    financeiro:<FinanceiroPage clients={clients} cobr={cobr} despesas={despesas}/>,
    cobr:<CobrancasPage cobr={cobr} setCobr={setCobr} clients={clients} loading={loadingData}/>,
    despesas:<DespesasPage despesas={despesas} setDespesas={setDespesas} loading={loadingData}/>,
    tarefas:<TarefasPage tasks={tasks} setTasks={setTasks} clients={clients} equipe={equipe} loading={loadingData}/>,
    calendario:<CalendarioPage/>,
    equipe:<EquipePage equipe={equipe} setEquipe={setEquipe} tasks={tasks} loading={loadingData}/>,
    trafego:<TráfegoPage/>,
    mensagens:<MensagensPage/>,
  };

  return (
    <div style={{fontFamily:"'Sora','Segoe UI',sans-serif",background:"#EEF3F8",minHeight:"100vh"}}>
      <Sidebar page={page} setPage={setPage} perfil={perfil} onLogout={()=>{supabase.auth.signOut();setLoggedIn(false);setPerfil("operacional");setClients([]);setCobr([]);setTasks([]);setDespesas([]);setEquipe([]);}} cobrPend={cobrPend}/>
      <Topbar page={page}/>
      <main style={{marginLeft:230,paddingTop:62}}>
        <div style={{padding:"28px 30px",minHeight:"calc(100vh - 62px)"}}>
          {pages[page]}
        </div>
      </main>
    </div>
  );
}
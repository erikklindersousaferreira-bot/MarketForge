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
  target:<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  video:<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>,
  report:<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="15" x2="9" y2="17"/><line x1="12" y1="12" x2="12" y2="17"/><line x1="15" y1="10" x2="15" y2="17"/></svg>,
  repeat:<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>,
};

// ── HELPERS ───────────────────────────────────────────────────────────────────
const fmtDate = (d) => { if(!d) return "—"; try { const s=String(d).split("T")[0]; const [a,m,dia]=s.split("-"); if(a&&m&&dia) return `${dia}/${m}/${a}`; return new Date(d).toLocaleDateString("pt-BR"); } catch { return d; } };
const genId = () => Date.now();
const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const todayStr = () => ymd(new Date());
// Soma meses numa data "AAAA-MM-DD" mantendo o dia (limitado ao último dia do mês: 31/01 + 1 → 28/02)
const addMonths = (dateStr, n) => {
  const [a,m,d] = String(dateStr||todayStr()).split("T")[0].split("-").map(Number);
  const ultimoDia = new Date(a, m-1+n+1, 0).getDate();
  return ymd(new Date(a, m-1+n, Math.min(d, ultimoDia)));
};


const StatusBadge = ({status}) => {
  const m = {ativo:["#DCFCE7","#166534","Ativo"],pausado:["#FEF9C3","#854D0E","Pausado"],cancelado:["#FEE2E2","#991B1B","Cancelado"],inadimplente:["#FEE2E2","#991B1B","Inadimplente"],pago:["#DCFCE7","#166534","Pago"],pendente:["#FEF9C3","#92400E","Pendente"],atrasado:["#FEE2E2","#991B1B","Atrasado"],a_fazer:["#EFF6FF","#1D4ED8","A Fazer"],em_producao:["#FFF7ED","#C2410C","Em Produção"],aguardando:["#F5F3FF","#7C3AED","Aguardando"],finalizado:["#DCFCE7","#166534","Finalizado"],urgente:["#FEE2E2","#991B1B","Urgente"],ok:["#DCFCE7","#166534","OK"],baixo:["#FEF9C3","#92400E","Baixo"],zerado:["#FEE2E2","#991B1B","Zerado"],planejar:["#EFF6FF","#1D4ED8","Planejar"],futuro:["#F3F4F6","#6B7280","Futuro"],ajustes:["#FEF9C3","#92400E","Ajustes"],agendada:["#EFF6FF","#1D4ED8","Agendada"],feita:["#DCFCE7","#166534","Feita"],cancelada:["#F3F4F6","#6B7280","Cancelada"],nao_foi:["#FEE2E2","#991B1B","Não foi"]};
  const [bg,color,label] = m[status]||["#F3F4F6","#6B7280",status];
  return <span style={{background:bg,color,fontSize:11,fontWeight:700,padding:"2px 10px",borderRadius:20}}>{label}</span>;
};

const PBadge = ({p}) => {
  const m = {baixa:["#EFF6FF","#1D4ED8"],media:["#F5F3FF","#7C3AED"],alta:["#FFF7ED","#C2410C"],urgente:["#FEE2E2","#991B1B"]};
  const [bg,c] = m[p]||["#F3F4F6","#6B7280"];
  return <span style={{background:bg,color:c,fontSize:11,fontWeight:700,padding:"2px 9px",borderRadius:20}}>{p.charAt(0).toUpperCase()+p.slice(1)}</span>;
};

const Card = ({children,style={},onClick}) => <div onClick={onClick} style={{background:"#fff",borderRadius:14,boxShadow:"0 1px 4px rgba(0,0,0,0.07),0 0 0 1px rgba(221,229,239,0.8)",padding:22,transition:"box-shadow 0.18s,transform 0.18s",...style,cursor:onClick?"pointer":undefined}} onMouseEnter={onClick?e=>{e.currentTarget.style.boxShadow="0 6px 20px rgba(0,0,0,0.1),0 0 0 1px rgba(221,229,239,0.8)";e.currentTarget.style.transform="translateY(-1px)";}:undefined} onMouseLeave={onClick?e=>{e.currentTarget.style.boxShadow="0 1px 4px rgba(0,0,0,0.07),0 0 0 1px rgba(221,229,239,0.8)";e.currentTarget.style.transform="";}:undefined}>{children}</div>;

const MC = ({label,value,sub,icon,bg="#FFF7F3",compact,trend}) => (
  <Card style={{display:"flex",alignItems:"flex-start",gap:compact?8:14,minWidth:compact?0:160,padding:compact?12:22}}>
    <div style={{background:bg,borderRadius:compact?9:12,width:compact?34:46,height:compact?34:46,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,color:"#FF6200",boxShadow:`0 4px 12px ${bg}cc`}}>{icon}</div>
    <div style={{flex:1}}>
      <div style={{fontSize:compact?9.5:11,color:"#94A3B8",fontWeight:600,letterSpacing:0.5,textTransform:"uppercase",marginBottom:2}}>{label}</div>
      <div style={{fontSize:compact?16:22,fontWeight:800,color:"#111827",lineHeight:1.2}}>{value}</div>
      {sub&&<div style={{fontSize:12,color:"#64748B",marginTop:2}}>{sub}</div>}
    </div>
    {trend&&<div style={{fontSize:11,fontWeight:700,color:trend>0?"#10B981":"#EF4444",background:trend>0?"#ECFDF5":"#FEF2F2",borderRadius:6,padding:"2px 7px",alignSelf:"flex-start",marginTop:2}}>{trend>0?"+":""}{trend}%</div>}
  </Card>
);

const Btn = ({children,onClick,variant="primary",size="md",style={},disabled}) => {
  const sz = {sm:{padding:"5px 12px",fontSize:12},md:{padding:"9px 18px",fontSize:13},lg:{padding:"12px 26px",fontSize:15}};
  const vr = {
    primary:{background:"linear-gradient(135deg,#FF6200,#FF7A20)",color:"#fff",boxShadow:"0 2px 8px rgba(255,98,0,0.3)"},
    secondary:{background:"linear-gradient(135deg,#1F2F46,#2D4A6A)",color:"#fff",boxShadow:"0 2px 8px rgba(31,47,70,0.3)"},
    ghost:{background:"transparent",color:"#64748B",boxShadow:"0 0 0 1.5px #DDE5EF"},
    danger:{background:"linear-gradient(135deg,#EF4444,#DC2626)",color:"#fff",boxShadow:"0 2px 8px rgba(239,68,68,0.25)"},
    success:{background:"linear-gradient(135deg,#10B981,#059669)",color:"#fff",boxShadow:"0 2px 8px rgba(16,185,129,0.25)"},
    warn:{background:"linear-gradient(135deg,#F59E0B,#D97706)",color:"#fff",boxShadow:"0 2px 8px rgba(245,158,11,0.25)"}
  };
  return <button onClick={onClick} disabled={disabled} style={{borderRadius:8,fontWeight:700,cursor:disabled?"not-allowed":"pointer",border:"none",letterSpacing:0.2,fontFamily:"inherit",transition:"opacity 0.15s,transform 0.12s",...sz[size],...vr[variant],opacity:disabled?0.5:1,...style}}
    onMouseEnter={!disabled?e=>{e.currentTarget.style.opacity="0.88";e.currentTarget.style.transform="translateY(-1px)";}:undefined}
    onMouseLeave={!disabled?e=>{e.currentTarget.style.opacity="1";e.currentTarget.style.transform="";}:undefined}
  >{children}</button>;
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

const ST = ({children,action,sub}) => (
  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
    <div style={{display:"flex",alignItems:"center",gap:12}}>
      <div style={{width:4,height:24,background:"linear-gradient(180deg,#FF6200,#FF8C00)",borderRadius:2}}/>
      <div>
        <h2 style={{margin:0,fontSize:18,fontWeight:800,color:"#111827",lineHeight:1.2}}>{children}</h2>
        {sub&&<div style={{fontSize:12,color:"#94A3B8",marginTop:1}}>{sub}</div>}
      </div>
    </div>
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

const Loading = () => (
  <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:200,gap:14}}>
    <div style={{width:36,height:36,border:"3px solid #EEF3F8",borderTop:"3px solid #FF6200",borderRadius:"50%",animation:"spin 0.7s linear infinite"}}/>
    <div style={{fontSize:13,color:"#94A3B8",fontWeight:500}}>Carregando...</div>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);

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
const NAV_ADMIN=[{id:"hoje",label:"Hoje",icon:IC.sun},{id:"dashboard",label:"Dashboard",icon:IC.chart},{id:"prospeccao",label:"Prospecção",icon:IC.target},{id:"clientes",label:"Clientes",icon:IC.users},{id:"financeiro",label:"Financeiro",icon:IC.money},{id:"cobr",label:"Cobranças",icon:IC.list},{id:"despesas",label:"Despesas",icon:IC.money},{id:"tarefas",label:"Tarefas",icon:IC.check},{id:"calendario",label:"Calendário",icon:IC.cal},{id:"agenda",label:"Agenda",icon:IC.cal},{id:"equipe",label:"Equipe",icon:IC.user},{id:"mensagens",label:"Modelos",icon:IC.msg}];
const NAV_OP=[{id:"hoje",label:"Hoje",icon:IC.sun},{id:"prospeccao",label:"Prospecção",icon:IC.target},{id:"tarefas",label:"Tarefas",icon:IC.check},{id:"calendario",label:"Calendário",icon:IC.cal},{id:"agenda",label:"Agenda",icon:IC.cal},{id:"equipe",label:"Equipe",icon:IC.user},{id:"mensagens",label:"Modelos",icon:IC.msg}];
const LABELS={hoje:"Hoje",dashboard:"Dashboard",prospeccao:"Prospecção CRM",clientes:"Clientes",financeiro:"Financeiro",cobr:"Cobranças",despesas:"Despesas",tarefas:"Tarefas",calendario:"Calendário Estratégico",agenda:"Agenda Recorrente",equipe:"Equipe",mensagens:"Modelos de Mensagem"};

const Sidebar=({page,setPage,onLogout,cobrPend,perfil,open,setOpen})=>{
const NAV = perfil==="admin" ? NAV_ADMIN : NAV_OP;
const isMobile = typeof window!=="undefined"&&window.innerWidth<768;
return (
  <>
    {isMobile&&open&&<div onClick={()=>setOpen(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:99}}/>}
    <div style={{width:230,background:"#1F2F46",minHeight:"100vh",display:"flex",flexDirection:"column",position:"fixed",top:0,left:isMobile?(open?0:-230):0,zIndex:100,transition:"left 0.3s"}}>
      <div style={{padding:"20px 18px 16px",borderBottom:"1px solid rgba(255,255,255,0.08)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <img src="https://i.postimg.cc/jdB530mK/mkt.png" alt="MarketForge" style={{height:38,objectFit:"contain"}} onError={e=>{e.target.style.display="none"}}/>
        {isMobile&&<button onClick={()=>setOpen(false)} style={{background:"none",border:"none",color:"rgba(255,255,255,0.5)",fontSize:22,cursor:"pointer"}}>×</button>}
      </div>
      <nav style={{flex:1,padding:"14px 10px",overflowY:"auto"}}>
        {NAV.map(n=>{
          const active=page===n.id;
          return (
            <div key={n.id} onClick={()=>{setPage(n.id);setOpen(false);}}
              style={{display:"flex",alignItems:"center",gap:11,padding:"9px 12px",borderRadius:10,marginBottom:2,cursor:"pointer",
                background:active?"rgba(255,98,0,0.15)":"transparent",
                color:active?"#FF6200":"rgba(255,255,255,0.6)",
                fontWeight:active?700:500,fontSize:13,
                borderLeft:active?"3px solid #FF6200":"3px solid transparent",
                transition:"background 0.15s,color 0.15s"}}
              onMouseEnter={e=>{if(!active){e.currentTarget.style.background="rgba(255,255,255,0.06)";e.currentTarget.style.color="rgba(255,255,255,0.9)";}}}
              onMouseLeave={e=>{if(!active){e.currentTarget.style.background="transparent";e.currentTarget.style.color="rgba(255,255,255,0.6)";}}}
            >
              <span style={{opacity:active?1:0.7,display:"flex"}}>{n.icon}</span>
              <span style={{flex:1}}>{n.label}</span>
              {n.id==="cobr"&&cobrPend>0&&<span style={{background:"#EF4444",color:"#fff",fontSize:10,fontWeight:700,borderRadius:10,padding:"1px 7px",minWidth:18,textAlign:"center"}}>{cobrPend}</span>}
            </div>
          );
        })}
      </nav>
      <div style={{padding:"14px 10px",borderTop:"1px solid rgba(255,255,255,0.07)"}}>
        <div onClick={onLogout}
          style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:10,cursor:"pointer",color:"rgba(255,255,255,0.4)",fontSize:13,transition:"color 0.15s,background 0.15s"}}
          onMouseEnter={e=>{e.currentTarget.style.color="rgba(255,255,255,0.8)";e.currentTarget.style.background="rgba(255,255,255,0.06)";}}
          onMouseLeave={e=>{e.currentTarget.style.color="rgba(255,255,255,0.4)";e.currentTarget.style.background="transparent";}}
        >
          {IC.logout} Sair
        </div>
      </div>
    </div>
  </>
);};

const Topbar=({page,nomeUser,perfil,onMenuClick})=>{
const isMobile = typeof window!=="undefined"&&window.innerWidth<768;
const SUB_LABELS={hoje:"Visão geral do dia",dashboard:"KPIs e métricas",prospeccao:"CRM de leads",clientes:"Gestão de carteira",financeiro:"Receitas e despesas",cobr:"Cobranças mensais",despesas:"Custos operacionais",tarefas:"Produção da equipe",calendario:"Calendário estratégico",agenda:"Agendamentos recorrentes",equipe:"Time e desempenho",mensagens:"Templates de mensagem"};
return (
  <div style={{position:"fixed",top:0,left:isMobile?0:230,right:0,height:62,background:"rgba(255,255,255,0.97)",backdropFilter:"blur(8px)",borderBottom:"1px solid #EEF3F8",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 24px",zIndex:99,boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
    <div style={{display:"flex",alignItems:"center",gap:12}}>
      {isMobile&&<button onClick={onMenuClick} style={{background:"none",border:"none",cursor:"pointer",color:"#64748B",fontSize:22,display:"flex",padding:4}}>☰</button>}
      <div>
        <div style={{fontSize:16,fontWeight:800,color:"#111827",lineHeight:1.2}}>{LABELS[page]||page}</div>
        {SUB_LABELS[page]&&<div style={{fontSize:11,color:"#94A3B8",fontWeight:500}}>{SUB_LABELS[page]}</div>}
      </div>
    </div>
    <div style={{display:"flex",alignItems:"center",gap:14}}>
      <div style={{cursor:"pointer",color:"#94A3B8",display:"flex",padding:6,borderRadius:8,transition:"background 0.15s,color 0.15s"}}
        onMouseEnter={e=>{e.currentTarget.style.background="#F1F5F9";e.currentTarget.style.color="#64748B";}}
        onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color="#94A3B8";}}
      >{IC.bell}</div>
      <div style={{display:"flex",alignItems:"center",gap:9,cursor:"pointer",padding:"4px 8px",borderRadius:10,transition:"background 0.15s"}}
        onMouseEnter={e=>e.currentTarget.style.background="#F8FAFC"}
        onMouseLeave={e=>e.currentTarget.style.background="transparent"}
      >
        <div style={{width:34,height:34,background:"linear-gradient(135deg,#FF6200,#FF8C00)",borderRadius:99,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:13,fontWeight:800,boxShadow:"0 2px 8px rgba(255,98,0,0.35)"}}>{nomeUser?.charAt(0).toUpperCase()||"E"}</div>
        {!isMobile&&<div>
          <div style={{fontSize:13,fontWeight:700,color:"#111827"}}>{nomeUser||"erikklinder"}</div>
          <div style={{fontSize:11,color:"#94A3B8"}}>{perfil==="admin"?"Admin":"Operacional"}</div>
        </div>}
      </div>
    </div>
  </div>
);};

// ── HOJE ──────────────────────────────────────────────────────────────────────
const getGreeting=()=>{const h=new Date().getHours();if(h<12)return"Bom dia";if(h<18)return"Boa tarde";return"Boa noite";};

const HojePage=({setPage,clients,cobr,tasks,perfil,nomeUser})=>{
  const atrasadas=tasks.filter(t=>t.status==="atrasado");
  const cobPend=cobr.filter(c=>c.status==="pendente"||c.status==="atrasado");
  const cobHoje=cobPend.slice(0,4);
  const hoje=new Date();
  const diasSemana=["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"];
  const meses=["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
  const dataStr=`${diasSemana[hoje.getDay()]}, ${hoje.getDate()} de ${meses[hoje.getMonth()]}`;

  const atalhos=[
    {label:"Nova tarefa",icon:IC.check,page:"tarefas",color:"#FF6200",bg:"#FFF7F3"},
    {label:"Ver cobranças",icon:IC.money,page:"cobr",color:"#10B981",bg:"#ECFDF5"},
    {label:"Ver clientes",icon:IC.users,page:"clientes",color:"#3B82F6",bg:"#EFF6FF"},
    {label:"Ver agenda",icon:IC.cal,page:"agenda",color:"#7C3AED",bg:"#F5F3FF"},
  ];

  return (
    <div>
      {/* Hero */}
      <div style={{background:"linear-gradient(135deg,#1F2F46 0%,#2D4A6A 100%)",borderRadius:20,padding:"28px 32px",marginBottom:24,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-40,right:-40,width:200,height:200,background:"radial-gradient(circle,rgba(255,98,0,0.2) 0%,transparent 70%)",pointerEvents:"none"}}/>
        <div style={{position:"absolute",bottom:-60,left:100,width:160,height:160,background:"radial-gradient(circle,rgba(255,98,0,0.1) 0%,transparent 70%)",pointerEvents:"none"}}/>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:16,position:"relative",zIndex:1}}>
          <div>
            <div style={{fontSize:13,color:"rgba(255,255,255,0.5)",fontWeight:500,marginBottom:4}}>{dataStr}</div>
            <div style={{fontSize:26,fontWeight:800,color:"#fff",marginBottom:4}}>{getGreeting()}, {(nomeUser||"erikklinder").split(" ")[0]}!</div>
            <div style={{fontSize:14,color:"rgba(255,255,255,0.6)"}}>Aqui está o resumo do dia na MarketForge</div>
          </div>
          <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
            {atalhos.map(a=>(
              <button key={a.page} onClick={()=>setPage(a.page)}
                style={{display:"flex",alignItems:"center",gap:8,padding:"9px 16px",borderRadius:10,border:"none",cursor:"pointer",background:"rgba(255,255,255,0.1)",color:"#fff",fontSize:12,fontWeight:600,fontFamily:"inherit",transition:"background 0.15s"}}
                onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.18)"}
                onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.1)"}
              >
                <span style={{color:a.color}}>{a.icon}</span>{a.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:14,marginBottom:24}}>
        {perfil==="admin"&&<MC label="Cobranças pendentes" value={cobPend.length} icon={IC.money} bg="#FFF7F3"/>}
        <MC label="Tarefas atrasadas" value={atrasadas.length} icon={IC.alert} bg="#FEF2F2"/>
        <MC label="Clientes ativos" value={clients.filter(c=>c.status==="ativo").length} icon={IC.users} bg="#ECFDF5"/>
        {perfil==="admin"&&<MC label="Inadimplentes" value={clients.filter(c=>c.status==="inadimplente").length} icon={IC.users} bg="#FEF2F2"/>}
        <MC label="Em produção" value={tasks.filter(t=>t.status==="em_producao").length} icon={IC.check} bg="#F5F3FF"/>
      </div>

      {/* Painéis */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:18}}>
        {perfil==="admin"&&<Card>
          <ST action={<Btn size="sm" variant="ghost" onClick={()=>setPage("cobr")}>Ver todas</Btn>}>Cobranças pendentes</ST>
          {cobHoje.length===0
            ?<div style={{color:"#10B981",textAlign:"center",padding:"20px 0",fontSize:13,fontWeight:600}}>✓ Tudo em dia!</div>
            :cobHoje.map(c=>(
              <div key={c.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 12px",background:"#F8FAFC",borderRadius:10,marginBottom:8,border:"1px solid #EEF3F8"}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:700,color:"#111827"}}>{c.cliente}</div>
                  <div style={{fontSize:11,color:"#64748B",display:"flex",alignItems:"center",gap:4,marginTop:2}}>{IC.clock} {fmtDate(c.vencimento)}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:14,fontWeight:800,color:"#111827"}}>R$ {Number(c.valor).toLocaleString()}</div>
                  <StatusBadge status={c.status}/>
                </div>
              </div>
            ))
          }
        </Card>}
        <Card>
          <ST action={<Btn size="sm" variant="ghost" onClick={()=>setPage("tarefas")}>Ver todas</Btn>}>Tarefas atrasadas</ST>
          {atrasadas.length===0
            ?<div style={{color:"#10B981",textAlign:"center",padding:"20px 0",fontSize:13,fontWeight:600}}>✓ Nenhuma atrasada!</div>
            :atrasadas.slice(0,4).map(t=>(
              <div key={t.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 12px",background:"#FEF2F2",borderRadius:10,border:"1px solid #FECACA",marginBottom:8}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:700,color:"#111827"}}>{t.titulo}</div>
                  <div style={{fontSize:11,color:"#64748B",marginTop:2}}>{t.cliente} · {t.responsavel}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:11,color:"#EF4444",fontWeight:700,marginBottom:2}}>Atrasada</div>
                  <div style={{fontSize:11,color:"#94A3B8"}}>{fmtDate(t.entrega)}</div>
                </div>
              </div>
            ))
          }
        </Card>
        {perfil==="admin"&&<Card>
          <ST action={<Btn size="sm" variant="ghost" onClick={()=>setPage("clientes")}>Ver todos</Btn>}>Clientes inadimplentes</ST>
          {clients.filter(c=>c.status==="inadimplente").length===0
            ?<div style={{color:"#10B981",textAlign:"center",padding:"20px 0",fontSize:13,fontWeight:600}}>✓ Carteira saudável!</div>
            :clients.filter(c=>c.status==="inadimplente").slice(0,4).map(c=>(
              <div key={c.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 12px",background:"#FEF2F2",borderRadius:10,border:"1px solid #FECACA",marginBottom:8}}>
                <ClientLogo url={c.logo_url} name={c.name} size={34}/>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:700,color:"#111827"}}>{c.name}</div>
                  <div style={{fontSize:11,color:"#64748B",marginTop:2}}>R$ {Number(c.valor).toLocaleString()} · Dia {c.vencimento}</div>
                </div>
              </div>
            ))
          }
        </Card>}
      </div>
    </div>
  );
};

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
const BarChart=({items,max})=>(
  <div style={{display:"flex",alignItems:"flex-end",gap:6,height:64,paddingTop:8}}>
    {items.map((it,i)=>(
      <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
        <div style={{width:"100%",background:it.color,borderRadius:"4px 4px 0 0",height:`${max?Math.max(4,(it.value/max)*56):4}px`,transition:"height 0.4s ease"}}/>
        <div style={{fontSize:9,color:"#94A3B8",textAlign:"center",lineHeight:1.2}}>{it.label}</div>
      </div>
    ))}
  </div>
);

const DashboardPage=({clients,cobr,despesas,tasks})=>{
  const recR=cobr.filter(c=>c.status==="pago").reduce((a,c)=>a+Number(c.valor),0);
  const recP=cobr.filter(c=>c.status==="pendente").reduce((a,c)=>a+Number(c.valor),0);
  const recA=cobr.filter(c=>c.status==="atrasado").reduce((a,c)=>a+Number(c.valor),0);
  const despT=despesas.filter(d=>d.status!=="cancelado").reduce((a,d)=>a+Number(d.valor),0);
  const despPagas=despesas.filter(d=>d.status==="pago").reduce((a,d)=>a+Number(d.valor),0);
  const lucroEst=recR-despPagas;
  const atv=clients.filter(c=>c.status==="ativo").length;
  const inadim=clients.filter(c=>c.status==="inadimplente").length;
  const mrr=clients.filter(c=>c.status==="ativo").reduce((a,c)=>a+Number(c.valor),0);

  // Mini bar data
  const cobBarMax=Math.max(cobr.filter(c=>c.status==="pago").length,cobr.filter(c=>c.status==="pendente").length,cobr.filter(c=>c.status==="atrasado").length,1);
  const cliBarMax=Math.max(atv,clients.filter(c=>c.status==="pausado").length,inadim,1);

  // Top clientes por valor
  const topClients=[...clients].filter(c=>c.status==="ativo").sort((a,b)=>Number(b.valor)-Number(a.valor)).slice(0,5);

  return (
    <div>
      {/* Faixa de destaque MRR */}
      <div style={{background:"linear-gradient(135deg,#1F2F46,#2D4A6A)",borderRadius:16,padding:"20px 28px",marginBottom:22,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:14}}>
        <div>
          <div style={{fontSize:12,color:"rgba(255,255,255,0.5)",fontWeight:500,marginBottom:2}}>MRR (Receita Recorrente Mensal)</div>
          <div style={{fontSize:32,fontWeight:900,color:"#FF6200",letterSpacing:-1}}>R$ {mrr.toLocaleString()}</div>
          <div style={{fontSize:12,color:"rgba(255,255,255,0.5)",marginTop:2}}>{atv} cliente{atv!==1?"s":""} ativo{atv!==1?"s":""}</div>
        </div>
        <div style={{display:"flex",gap:20,flexWrap:"wrap"}}>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:22,fontWeight:800,color:lucroEst>=0?"#34D399":"#F87171"}}>{lucroEst>=0?"+":""}R$ {lucroEst.toLocaleString()}</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.45)"}}>Lucro estimado</div>
          </div>
          <div style={{width:1,background:"rgba(255,255,255,0.1)"}}/>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:22,fontWeight:800,color:"#FBBF24"}}>R$ {recP.toLocaleString()}</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.45)"}}>Em aberto</div>
          </div>
          <div style={{width:1,background:"rgba(255,255,255,0.1)"}}/>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:22,fontWeight:800,color:"#F87171"}}>R$ {recA.toLocaleString()}</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.45)"}}>Atrasado</div>
          </div>
        </div>
      </div>

      {/* KPI grid */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(175px,1fr))",gap:14,marginBottom:22}}>
        <MC label="Receita recebida" value={`R$ ${recR.toLocaleString()}`} icon={IC.check} bg="#ECFDF5"/>
        <MC label="Despesas totais" value={`R$ ${despT.toLocaleString()}`} icon={IC.money} bg="#F8FAFC"/>
        <MC label="Clientes ativos" value={atv} icon={IC.users} bg="#F5F3FF"/>
        <MC label="Inadimplentes" value={inadim} icon={IC.alert} bg="#FEF2F2"/>
        {tasks&&<MC label="Tarefas abertas" value={tasks.filter(t=>t.status!=="finalizado"&&t.status!=="cancelado").length} icon={IC.check} bg="#FFFBEB"/>}
        <MC label="Despesas pagas" value={`R$ ${despPagas.toLocaleString()}`} icon={IC.trending} bg="#ECFDF5"/>
      </div>

      {/* Painéis */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(290px,1fr))",gap:18}}>
        {/* Cobranças - gráfico */}
        <Card>
          <ST>Cobranças — visão geral</ST>
          <BarChart
            max={cobBarMax}
            items={[
              {label:"Pagas",value:cobr.filter(c=>c.status==="pago").length,color:"#10B981"},
              {label:"Pendentes",value:cobr.filter(c=>c.status==="pendente").length,color:"#F59E0B"},
              {label:"Atrasadas",value:cobr.filter(c=>c.status==="atrasado").length,color:"#EF4444"},
            ]}
          />
          <div style={{height:1,background:"#EEF3F8",margin:"14px 0 12px"}}/>
          {[{label:"Pagas",count:cobr.filter(c=>c.status==="pago").length,color:"#10B981",icon:"✓"},{label:"Pendentes",count:cobr.filter(c=>c.status==="pendente").length,color:"#F59E0B",icon:"·"},{label:"Atrasadas",count:cobr.filter(c=>c.status==="atrasado").length,color:"#EF4444",icon:"!"}].map(s=>(
            <div key={s.label} style={{marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                <span style={{fontSize:12,color:"#374151",fontWeight:600,display:"flex",alignItems:"center",gap:6}}>
                  <span style={{display:"inline-flex",width:18,height:18,background:s.color+"22",color:s.color,borderRadius:4,alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800}}>{s.icon}</span>
                  {s.label}
                </span>
                <span style={{fontSize:13,fontWeight:800,color:s.color}}>{s.count}</span>
              </div>
              <div style={{background:"#EEF3F8",borderRadius:99,height:5,overflow:"hidden"}}>
                <div style={{background:s.color,height:"100%",width:cobr.length?`${(s.count/cobr.length)*100}%`:"0%",borderRadius:99,transition:"width 0.5s ease"}}/>
              </div>
            </div>
          ))}
        </Card>

        {/* Clientes - gráfico */}
        <Card>
          <ST>Clientes — distribuição</ST>
          <BarChart
            max={cliBarMax}
            items={[
              {label:"Ativos",value:atv,color:"#10B981"},
              {label:"Pausados",value:clients.filter(c=>c.status==="pausado").length,color:"#F59E0B"},
              {label:"Inadim.",value:inadim,color:"#EF4444"},
            ]}
          />
          <div style={{height:1,background:"#EEF3F8",margin:"14px 0 12px"}}/>
          {[{label:"Ativos",color:"#10B981",key:"ativo"},{label:"Pausados",color:"#F59E0B",key:"pausado"},{label:"Inadimplentes",color:"#EF4444",key:"inadimplente"}].map(s=>(
            <div key={s.key} style={{marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                <span style={{fontSize:12,color:"#374151",fontWeight:600}}>
                  <span style={{display:"inline-block",width:8,height:8,background:s.color,borderRadius:"50%",marginRight:6}}/>
                  {s.label}
                </span>
                <span style={{fontSize:13,fontWeight:800,color:s.color}}>{clients.filter(c=>c.status===s.key).length}</span>
              </div>
              <div style={{background:"#EEF3F8",borderRadius:99,height:5,overflow:"hidden"}}>
                <div style={{background:s.color,height:"100%",width:clients.length?`${(clients.filter(c=>c.status===s.key).length/clients.length)*100}%`:"0%",borderRadius:99,transition:"width 0.5s ease"}}/>
              </div>
            </div>
          ))}
        </Card>

        {/* Top clientes */}
        {topClients.length>0&&<Card>
          <ST>Top clientes por mensalidade</ST>
          {topClients.map((c,i)=>(
            <div key={c.id||i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:i<topClients.length-1?"1px solid #EEF3F8":"none"}}>
              <div style={{width:22,height:22,borderRadius:"50%",background:i===0?"linear-gradient(135deg,#FF6200,#FF8C00)":i===1?"linear-gradient(135deg,#94A3B8,#CBD5E1)":"linear-gradient(135deg,#D97706,#FCD34D)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:i<2?"#fff":"#1F2F46",flexShrink:0}}>
                {i+1}
              </div>
              <ClientLogo url={c.logo_url} name={c.name} size={28}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12,fontWeight:700,color:"#111827",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.name}</div>
                <div style={{fontSize:11,color:"#94A3B8"}}>{c.plano||"—"}</div>
              </div>
              <div style={{fontSize:13,fontWeight:800,color:"#1F2F46",whiteSpace:"nowrap"}}>R$ {Number(c.valor).toLocaleString()}</div>
            </div>
          ))}
        </Card>}

        {/* Despesas */}
        <Card>
          <ST>Despesas — status</ST>
          {[{label:"Pagas",key:"pago",color:"#10B981"},{label:"Pendentes",key:"pendente",color:"#F59E0B"},{label:"Atrasadas",key:"atrasado",color:"#EF4444"}].map(s=>(
            <div key={s.key} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 12px",background:"#F8FAFC",borderRadius:10,marginBottom:8,border:"1px solid #EEF3F8"}}>
              <span style={{fontSize:13,fontWeight:600,color:"#374151",display:"flex",alignItems:"center",gap:8}}>
                <span style={{width:8,height:8,borderRadius:"50%",background:s.color,display:"inline-block"}}/>
                {s.label}
              </span>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:13,fontWeight:800,color:s.color}}>R$ {despesas.filter(d=>d.status===s.key).reduce((a,d)=>a+Number(d.valor),0).toLocaleString()}</div>
                <div style={{fontSize:11,color:"#94A3B8"}}>{despesas.filter(d=>d.status===s.key).length} item{despesas.filter(d=>d.status===s.key).length!==1?"s":""}</div>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
};

// ── CLIENTES ──────────────────────────────────────────────────────────────────
const BLANK_CLIENT = {name:"",nicho:"",valor:"",vencimento:"",status:"ativo",responsavel:"",whatsapp:"",logo_url:"",cidade:"Marabá",plano:"Básico"};

const ClientesPage=({clients,setClients,cobr,setCobr,loading})=>{
  const [search,setSearch]=useState("");
  const [filter,setFilter]=useState("todos");
  const [modal,setModal]=useState(false);
  const [form,setForm]=useState(BLANK_CLIENT);
  const [editing,setEditing]=useState(null);
  const [confirm,setConfirm]=useState(null);
  const [saving,setSaving]=useState(false);
  const [uploadingLogo,setUploadingLogo]=useState(false);

  const uploadLogo=async(file)=>{
    if(!file) return;
    setUploadingLogo(true);
    const ext=file.name.split(".").pop();
    const path=`logos/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const {error}=await supabase.storage.from("clientes-logos").upload(path,file,{upsert:true,contentType:file.type});
    if(!error){
      const {data:{publicUrl}}=supabase.storage.from("clientes-logos").getPublicUrl(path);
      setForm(p=>({...p,logo_url:publicUrl}));
    }
    setUploadingLogo(false);
  };

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
      if(!error&&inserted){
        setClients(prev=>[...prev,...inserted]);
        const novoCliente=inserted[0];
        const hoje=new Date();
        const anoVenc=hoje.getDate()>Number(form.vencimento)?hoje.getFullYear()+(hoje.getMonth()===11?1:0):hoje.getFullYear();
        const mesVenc=hoje.getDate()>Number(form.vencimento)?(hoje.getMonth()+1)%12:hoje.getMonth();
        const dataVenc=`${anoVenc}-${String(mesVenc+1).padStart(2,"0")}-${String(form.vencimento).padStart(2,"0")}`;
        const cobData={cliente:novoCliente.name,valor:Number(form.valor),vencimento:dataVenc,status:"pendente",pagamento:""};
        const {data:cobIns}=await supabase.from("cobrancas").insert([cobData]).select();
        if(cobIns) setCobr(prev=>[...prev,...cobIns]);
      }
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
        <div style={{marginBottom:16,display:"flex",alignItems:"center",gap:16}}>
          <ClientLogo url={form.logo_url} name={form.name} size={64}/>
          <div style={{flex:1}}>
            <label style={{display:"block",fontSize:12,fontWeight:700,color:"#374151",marginBottom:6}}>Logo do cliente</label>
            <label style={{display:"inline-flex",alignItems:"center",gap:8,padding:"8px 16px",background:"#F1F5F9",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:600,color:"#374151",border:"1.5px dashed #CBD5E1",transition:"background 0.15s"}}>
              <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>uploadLogo(e.target.files?.[0])}/>
              {uploadingLogo?<span>Enviando...</span>:<><span style={{fontSize:16}}>{IC.image}</span><span>Enviar imagem</span></>}
            </label>
            {form.logo_url&&<div style={{fontSize:10,color:"#10B981",marginTop:4,fontWeight:600}}>✓ Logo carregada</div>}
          </div>
        </div>
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

// ── PROSPECÇÃO CRM ────────────────────────────────────────────────────────────
const BLANK_PROSPECCAO={empresa:"",segmento:"",bairro:"",instagram:"",whatsapp:"",responsavel:"",observacoes:"",status:"encontrado",prioridade:"media",temperatura:"morno",origem:"instagram",servicos:[],valor_estimado:"",motivo_perda:"",proxima_acao:"",proxima_acao_data:"",vendedor:""};
const PROSP_COLS=[
  {id:"encontrado",label:"Encontrado",color:"#64748B"},
  {id:"mensagem_enviada",label:"Mensagem Enviada",color:"#3B82F6"},
  {id:"ligacao_realizada",label:"Ligação Realizada",color:"#0EA5E9"},
  {id:"visita_agendada",label:"Visita Agendada",color:"#8B5CF6"},
  {id:"reuniao_realizada",label:"Reunião Realizada",color:"#F59E0B"},
  {id:"proposta_enviada",label:"Proposta Enviada",color:"#FF6200"},
  {id:"aguardando_resposta",label:"Aguardando Resposta",color:"#EAB308"},
  {id:"fechado",label:"Fechado",color:"#10B981"},
  {id:"perdido",label:"Perdido",color:"#EF4444"},
];
const PROSP_STATUS_LABEL=Object.fromEntries(PROSP_COLS.map(c=>[c.id,c.label]));
const PROSP_STAGE_ORDER=["encontrado","mensagem_enviada","ligacao_realizada","visita_agendada","reuniao_realizada","proposta_enviada","aguardando_resposta","fechado"];
const SERVICOS_OPTS=[
  {value:"gestao_redes",label:"Gestão de Redes"},
  {value:"trafego_pago",label:"Tráfego Pago"},
  {value:"site",label:"Site"},
  {value:"sistema",label:"Sistema"},
  {value:"identidade_visual",label:"Identidade Visual"},
  {value:"videos",label:"Vídeos"},
  {value:"automacao",label:"Automação"},
];
const ORIGEM_OPTS=[
  {value:"instagram",label:"Instagram"},
  {value:"google_maps",label:"Google Maps"},
  {value:"indicacao",label:"Indicação"},
  {value:"rua",label:"Rua"},
  {value:"facebook",label:"Facebook"},
  {value:"tiktok",label:"TikTok"},
  {value:"outro",label:"Outro"},
];
const MOTIVO_PERDA_OPTS=[
  {value:"sem_orcamento",label:"Sem orçamento"},
  {value:"ja_possui_agencia",label:"Já possui agência"},
  {value:"nao_respondeu",label:"Não respondeu"},
  {value:"nao_tem_interesse",label:"Não tem interesse"},
  {value:"vai_pensar",label:"Vai pensar"},
  {value:"outro",label:"Outro"},
];
const TEMP_EMOJI={quente:"🔥",morno:"🌤",frio:"❄️"};
const IA_TABS=[
  {id:"whatsapp",label:"Mensagem WhatsApp"},
  {id:"ligacao",label:"Roteiro de Ligação"},
  {id:"argumentos",label:"Argumentos de Venda"},
  {id:"videos",label:"Ideias de Vídeo"},
  {id:"instagram",label:"Diagnóstico Instagram"},
  {id:"proposta",label:"Proposta"},
];
const selStyle={padding:"8px 12px",borderRadius:8,border:"1.5px solid #DDE5EF",fontSize:12,color:"#374151",outline:"none",fontFamily:"inherit",background:"#fff"};

const ProspStatusBadge=({status})=>{
  const col=PROSP_COLS.find(c=>c.id===status)||{color:"#6B7280",label:status};
  return <span style={{background:col.color+"22",color:col.color,fontSize:11,fontWeight:700,padding:"2px 10px",borderRadius:20}}>{col.label}</span>;
};
const ProspPrio=({p})=>{
  const m={alta:["#FEE2E2","#991B1B","Alta"],media:["#FEF9C3","#92400E","Média"],baixa:["#DCFCE7","#166534","Baixa"]};
  const [bg,c,label]=m[p]||["#F3F4F6","#6B7280",p];
  return <span style={{background:bg,color:c,fontSize:11,fontWeight:700,padding:"2px 9px",borderRadius:20}}>{label}</span>;
};

const ProspeccaoPage=({prospeccao,setProspeccao,equipe,loading})=>{
  const isMobile = typeof window!=="undefined"&&window.innerWidth<768;
  const [modal,setModal]=useState(false);
  const [form,setForm]=useState(BLANK_PROSPECCAO);
  const [editing,setEditing]=useState(null);
  const [confirm,setConfirm]=useState(null);
  const [dragId,setDragId]=useState(null);
  const [saving,setSaving]=useState(false);

  const [fBairro,setFBairro]=useState("");
  const [fSegmento,setFSegmento]=useState("");
  const [fStatus,setFStatus]=useState("");
  const [fVendedor,setFVendedor]=useState("");
  const [fTemp,setFTemp]=useState("");

  const [detail,setDetail]=useState(null);
  const [historico,setHistorico]=useState([]);
  const [histLoading,setHistLoading]=useState(false);
  const [novoHist,setNovoHist]=useState("");

  const [iaOpen,setIaOpen]=useState(false);
  const [iaTab,setIaTab]=useState("whatsapp");
  const [iaCache,setIaCache]=useState({});
  const [iaLoading,setIaLoading]=useState(false);
  const [iaErr,setIaErr]=useState("");
  const [iaCopied,setIaCopied]=useState(false);

  const gerarIA=async(tipo,forcar)=>{
    if(!detail) return;
    if(iaCache[tipo]&&!forcar) return;
    setIaLoading(true);setIaErr("");
    try{
      const res=await fetch("/api/gerar-abordagem",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({tipo,empresa:{empresa:detail.empresa,segmento:detail.segmento,bairro:detail.bairro,instagram:detail.instagram,servicos:(detail.servicos||[]).map(s=>SERVICOS_OPTS.find(o=>o.value===s)?.label||s),observacoes:detail.observacoes,temperatura:detail.temperatura,valor_estimado:detail.valor_estimado}})});
      const json=await res.json();
      if(!res.ok||json.error) throw new Error(json.error||"Erro ao gerar conteúdo");
      setIaCache(prev=>({...prev,[tipo]:json.texto}));
    }catch(e){
      setIaErr(e.message||"Erro ao gerar conteúdo");
    }
    setIaLoading(false);
  };

  useEffect(()=>{
    if(!iaOpen||!detail) return;
    if(iaCache[iaTab]) return;
    gerarIA(iaTab,false);
  },[iaOpen,iaTab,detail]);

  const copyIA=(texto)=>{navigator.clipboard.writeText(texto).catch(()=>{});setIaCopied(true);setTimeout(()=>setIaCopied(false),2000);};

  const f=(k,v)=>setForm(p=>({...p,[k]:v}));
  const openNew=()=>{setForm(BLANK_PROSPECCAO);setEditing(null);setModal(true);};
  const openEdit=(p)=>{setForm({...BLANK_PROSPECCAO,...p,servicos:p.servicos||[],valor_estimado:p.valor_estimado??"",proxima_acao_data:p.proxima_acao_data?.split("T")[0]||p.proxima_acao_data||""});setEditing(p.id);setModal(true);};

  const closeDetail=()=>{setDetail(null);setIaOpen(false);setIaCache({});setNovoHist("");setHistorico([]);};
  const openDetail=async(p)=>{
    setDetail(p);setIaCache({});setIaOpen(false);
    setHistLoading(true);
    const {data:h}=await supabase.from("prospeccao_historico").select("*").eq("prospeccao_id",p.id).order("created_at",{ascending:false});
    setHistorico(h||[]);
    setHistLoading(false);
  };

  const save=async()=>{
    if(!form.empresa){return;}
    setSaving(true);
    const data={empresa:form.empresa,segmento:form.segmento,bairro:form.bairro,instagram:form.instagram,whatsapp:form.whatsapp,responsavel:form.responsavel,observacoes:form.observacoes,status:form.status,prioridade:form.prioridade,temperatura:form.temperatura,origem:form.origem,servicos:form.servicos,valor_estimado:form.valor_estimado?Number(form.valor_estimado):null,motivo_perda:form.status==="perdido"?form.motivo_perda:null,proxima_acao:form.proxima_acao,proxima_acao_data:form.proxima_acao_data||null,vendedor:form.vendedor};
    if(editing){
      const anterior=prospeccao.find(p=>p.id===editing);
      await supabase.from("prospeccao").update(data).eq("id",editing);
      setProspeccao(prev=>prev.map(p=>p.id===editing?{...p,...data,updated_at:new Date().toISOString()}:p));
      if(anterior&&anterior.status!==data.status){
        const texto=`Status alterado de "${PROSP_STATUS_LABEL[anterior.status]}" para "${PROSP_STATUS_LABEL[data.status]}"`;
        const {data:h}=await supabase.from("prospeccao_historico").insert([{prospeccao_id:editing,texto}]).select();
        if(h&&detail&&detail.id===editing) setHistorico(prev=>[...h,...prev]);
      }
    } else {
      const {data:ins}=await supabase.from("prospeccao").insert([data]).select();
      if(ins){
        setProspeccao(prev=>[...prev,...ins]);
        await supabase.from("prospeccao_historico").insert([{prospeccao_id:ins[0].id,texto:"Empresa cadastrada na prospecção"}]);
      }
    }
    setSaving(false);setModal(false);
  };

  const remove=async(id)=>{
    await supabase.from("prospeccao").delete().eq("id",id);
    setProspeccao(prev=>prev.filter(p=>p.id!==id));
    setConfirm(null);
    if(detail&&detail.id===id) closeDetail();
  };

  const moveStatus=async(newStatus,taskId)=>{
    const id=taskId||dragId;
    if(!id) return;
    const item=prospeccao.find(p=>p.id===id);
    if(!item||item.status===newStatus){setDragId(null);return;}
    await supabase.from("prospeccao").update({status:newStatus}).eq("id",id);
    setProspeccao(prev=>prev.map(p=>p.id===id?{...p,status:newStatus,updated_at:new Date().toISOString()}:p));
    const texto=`Status alterado de "${PROSP_STATUS_LABEL[item.status]}" para "${PROSP_STATUS_LABEL[newStatus]}"`;
    const {data:h}=await supabase.from("prospeccao_historico").insert([{prospeccao_id:id,texto}]).select();
    if(h&&detail&&detail.id===id) setHistorico(prev=>[...h,...prev]);
    setDragId(null);
  };

  const addHistorico=async()=>{
    if(!novoHist.trim()||!detail) return;
    const {data:h}=await supabase.from("prospeccao_historico").insert([{prospeccao_id:detail.id,texto:novoHist.trim()}]).select();
    if(h) setHistorico(prev=>[...h,...prev]);
    setNovoHist("");
  };

  const filterSelStyle=isMobile?{...selStyle,width:"100%",boxSizing:"border-box" as const}:selStyle;
  const miniSelect=(value,onChange,options,placeholder)=>(
    <select value={value} onChange={e=>onChange(e.target.value)} style={filterSelStyle}>
      <option value="">{placeholder}</option>
      {options.map(o=><option key={o} value={o}>{o}</option>)}
    </select>
  );

  const bairros=[...new Set(prospeccao.map(p=>p.bairro).filter(Boolean))];
  const segmentos=[...new Set(prospeccao.map(p=>p.segmento).filter(Boolean))];
  const vendedores=[...new Set(prospeccao.map(p=>p.vendedor).filter(Boolean))];

  const fl=prospeccao.filter(p=>
    (fBairro===""||p.bairro===fBairro)&&
    (fSegmento===""||p.segmento===fSegmento)&&
    (fStatus===""||p.status===fStatus)&&
    (fVendedor===""||p.vendedor===fVendedor)&&
    (fTemp===""||p.temperatura===fTemp)
  );

  const stageIdx=(s)=>PROSP_STAGE_ORDER.indexOf(s);
  const atLeast=(stage)=>prospeccao.filter(p=>stageIdx(p.status)>=stageIdx(stage)).length;
  const mensagensEnviadas=atLeast("mensagem_enviada");
  const visitasRealizadas=atLeast("visita_agendada");
  const reunioesRealizadas=atLeast("reuniao_realizada");
  const propostasEnviadas=atLeast("proposta_enviada");
  const clientesFechados=prospeccao.filter(p=>p.status==="fechado").length;
  const taxaConversao=prospeccao.length?((clientesFechados/prospeccao.length)*100).toFixed(1):"0.0";
  const valorNegociacao=prospeccao.filter(p=>p.status!=="fechado"&&p.status!=="perdido").reduce((a,p)=>a+Number(p.valor_estimado||0),0);
  const valorFechado=prospeccao.filter(p=>p.status==="fechado").reduce((a,p)=>a+Number(p.valor_estimado||0),0);
  const seteDiasAtras=new Date();seteDiasAtras.setDate(seteDiasAtras.getDate()-7);
  const paradas=prospeccao.filter(p=>p.status!=="fechado"&&p.status!=="perdido"&&p.updated_at&&new Date(p.updated_at)<seteDiasAtras).length;

  if(loading) return <Loading/>;
  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(auto-fill,minmax(190px,1fr))",gap:isMobile?8:14,marginBottom:22}}>
        <MC compact={isMobile} label="Total empresas" value={prospeccao.length} icon={IC.users} bg="#EFF6FF"/>
        <MC compact={isMobile} label="Mensagens enviadas" value={mensagensEnviadas} icon={IC.msg} bg="#F5F3FF"/>
        <MC compact={isMobile} label="Visitas realizadas" value={visitasRealizadas} icon={IC.cal} bg="#FFF7ED"/>
        <MC compact={isMobile} label="Reuniões realizadas" value={reunioesRealizadas} icon={IC.user} bg="#FFFBEB"/>
        <MC compact={isMobile} label="Propostas enviadas" value={propostasEnviadas} icon={IC.list} bg="#ECFDF5"/>
        <MC compact={isMobile} label="Clientes fechados" value={clientesFechados} icon={IC.check} bg="#ECFDF5"/>
        <MC compact={isMobile} label="Taxa de conversão" value={`${taxaConversao}%`} icon={IC.trending} bg="#FFF7F3"/>
        <MC compact={isMobile} label="Em negociação" value={`R$ ${valorNegociacao.toLocaleString("pt-BR")}`} icon={IC.money} bg="#F8FAFC"/>
        <MC compact={isMobile} label="Valor fechado" value={`R$ ${valorFechado.toLocaleString("pt-BR")}`} icon={IC.money} bg="#ECFDF5"/>
        <MC compact={isMobile} label="Paradas +7 dias" value={paradas} icon={IC.alert} bg="#FEF2F2"/>
      </div>

      <div style={{display:isMobile?"grid":"flex",gridTemplateColumns:isMobile?"1fr 1fr":undefined,gap:10,marginBottom:18,flexWrap:isMobile?undefined:"wrap",alignItems:"center"}}>
        {miniSelect(fBairro,setFBairro,bairros,"Todos os bairros")}
        {miniSelect(fSegmento,setFSegmento,segmentos,"Todos os segmentos")}
        <select value={fStatus} onChange={e=>setFStatus(e.target.value)} style={filterSelStyle}>
          <option value="">Todos os status</option>
          {PROSP_COLS.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
        {miniSelect(fVendedor,setFVendedor,vendedores,"Todos os vendedores")}
        <select value={fTemp} onChange={e=>setFTemp(e.target.value)} style={filterSelStyle}>
          <option value="">Todas as temperaturas</option>
          <option value="quente">🔥 Quente</option>
          <option value="morno">🌤 Morno</option>
          <option value="frio">❄️ Frio</option>
        </select>
        {!isMobile&&<div style={{flex:1}}/>}
        <Btn style={isMobile?{gridColumn:"1 / -1"}:undefined} onClick={openNew}>+ Nova Empresa</Btn>
      </div>

      <div style={{display:"flex",gap:isMobile?10:14,overflowX:"auto",paddingBottom:16,WebkitOverflowScrolling:"touch"}}>
        {PROSP_COLS.map(col=>{
          const ct=fl.filter(p=>p.status===col.id);
          return (
            <div key={col.id} style={{minWidth:isMobile?180:250,flex:isMobile?"0 0 180px":"0 0 250px"}} onDragOver={e=>e.preventDefault()} onDrop={()=>moveStatus(col.id)}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                <div style={{width:10,height:10,borderRadius:99,background:col.color}}/>
                <span style={{fontSize:13,fontWeight:800,color:"#1F2F46"}}>{col.label}</span>
                <span style={{marginLeft:"auto",background:"#EEF3F8",borderRadius:99,padding:"1px 9px",fontSize:11,fontWeight:700,color:"#64748B"}}>{ct.length}</span>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:10,minHeight:120,background:"#F0F4F9",borderRadius:12,padding:10}}>
                {ct.map(p=>(
                  <div key={p.id} draggable onDragStart={()=>setDragId(p.id)} onClick={()=>openDetail(p)} style={{background:"#fff",borderRadius:10,padding:"12px 14px",boxShadow:"0 1px 3px rgba(0,0,0,0.06)",cursor:"pointer",borderLeft:`3px solid ${col.color}`,userSelect:"none"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:6,marginBottom:4}}>
                      <div style={{fontSize:13,fontWeight:700,color:"#111827"}}>{p.empresa}</div>
                      <span style={{fontSize:15,flexShrink:0}}>{TEMP_EMOJI[p.temperatura]||""}</span>
                    </div>
                    <div style={{fontSize:11,color:"#64748B",marginBottom:8}}>{p.segmento}{p.bairro?` · ${p.bairro}`:""}</div>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                      <ProspPrio p={p.prioridade}/>
                      {p.valor_estimado?<div style={{fontSize:12,fontWeight:800,color:"#111827"}}>R$ {Number(p.valor_estimado).toLocaleString("pt-BR")}</div>:null}
                    </div>
                    {p.proxima_acao&&<div style={{fontSize:11,color:"#94A3B8",display:"flex",alignItems:"center",gap:4,marginBottom:8}}>{IC.clock} {p.proxima_acao}{p.proxima_acao_data?` — ${fmtDate(p.proxima_acao_data)}`:""}</div>}
                    <select onClick={e=>e.stopPropagation()} onChange={e=>{if(e.target.value)moveStatus(e.target.value,p.id);e.target.value="";}} style={{width:"100%",padding:"6px 10px",borderRadius:8,border:"1.5px solid #DDE5EF",fontSize:12,color:"#64748B",background:"#F8FAFC",fontFamily:"inherit"}}>
                      <option value="">Mover para...</option>
                      {PROSP_COLS.filter(c=>c.id!==col.id).map(c=><option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                  </div>
                ))}
                {ct.length===0&&<div style={{color:"#94A3B8",fontSize:12,textAlign:"center",padding:"20px 0"}}>Solte aqui</div>}
              </div>
            </div>
          );
        })}
      </div>

      {modal&&<Modal title={editing?"Editar Prospecção":"Nova Empresa"} onClose={()=>setModal(false)} width={560}>
        <FInput label="Nome da empresa *" value={form.empresa} onChange={v=>f("empresa",v)} placeholder="Padaria Pão Quente"/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          <FInput label="Segmento" value={form.segmento} onChange={v=>f("segmento",v)} placeholder="Alimentação"/>
          <FInput label="Bairro" value={form.bairro} onChange={v=>f("bairro",v)} placeholder="Centro"/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          <FInput label="Instagram" value={form.instagram} onChange={v=>f("instagram",v)} placeholder="@empresa"/>
          <FInput label="WhatsApp" value={form.whatsapp} onChange={v=>f("whatsapp",v)} placeholder="94999999999"/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          <FInput label="Responsável" value={form.responsavel} onChange={v=>f("responsavel",v)} placeholder="Nome do responsável"/>
          <FInput label="Vendedor" value={form.vendedor} onChange={v=>f("vendedor",v)} placeholder="Nome do vendedor"/>
        </div>
        <div style={{marginBottom:14}}>
          <label style={{display:"block",fontSize:12,fontWeight:700,color:"#374151",marginBottom:5}}>Observações</label>
          <textarea value={form.observacoes} onChange={e=>f("observacoes",e.target.value)} rows={3} placeholder="Anotações sobre a empresa..." style={{width:"100%",padding:"9px 13px",borderRadius:8,border:"1.5px solid #DDE5EF",fontSize:13,color:"#111827",outline:"none",fontFamily:"inherit",boxSizing:"border-box",background:"#FAFBFD",resize:"vertical"}}/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14}}>
          <FSel label="Status" value={form.status} onChange={v=>f("status",v)} options={PROSP_COLS.map(c=>({value:c.id,label:c.label}))}/>
          <FSel label="Prioridade" value={form.prioridade} onChange={v=>f("prioridade",v)} options={[{value:"alta",label:"Alta"},{value:"media",label:"Média"},{value:"baixa",label:"Baixa"}]}/>
          <FSel label="Temperatura" value={form.temperatura} onChange={v=>f("temperatura",v)} options={[{value:"quente",label:"🔥 Quente"},{value:"morno",label:"🌤 Morno"},{value:"frio",label:"❄️ Frio"}]}/>
        </div>
        <FSel label="Origem" value={form.origem} onChange={v=>f("origem",v)} options={ORIGEM_OPTS}/>
        {form.status==="perdido"&&<FSel label="Motivo da perda" value={form.motivo_perda} onChange={v=>f("motivo_perda",v)} options={[{value:"",label:"Selecione..."},...MOTIVO_PERDA_OPTS]}/>}
        <div style={{marginBottom:14}}>
          <label style={{display:"block",fontSize:12,fontWeight:700,color:"#374151",marginBottom:5}}>Serviços de interesse</label>
          <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
            {SERVICOS_OPTS.map(s=>{
              const ativo=form.servicos.includes(s.value);
              return (
                <button key={s.value} type="button" onClick={()=>f("servicos",ativo?form.servicos.filter(x=>x!==s.value):[...form.servicos,s.value])}
                  style={{border:ativo?"1.5px solid #FF6200":"1.5px solid #DDE5EF",background:ativo?"#FFF7F3":"#FAFBFD",color:ativo?"#FF6200":"#64748B",borderRadius:20,padding:"6px 14px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{s.label}</button>
              );
            })}
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          <FInput label="Valor estimado (R$)" value={form.valor_estimado} onChange={v=>f("valor_estimado",v)} placeholder="1500"/>
          <FInput label="Próxima ação" value={form.proxima_acao} onChange={v=>f("proxima_acao",v)} placeholder="Ligar novamente"/>
        </div>
        <FInput label="Data da próxima ação" value={form.proxima_acao_data} onChange={v=>f("proxima_acao_data",v)} type="date"/>
        <div style={{display:"flex",gap:10,marginTop:4}}>
          <Btn style={{flex:1}} onClick={save} disabled={saving}>{saving?"Salvando...":"Salvar"}</Btn>
          <Btn variant="ghost" onClick={()=>setModal(false)} style={{flex:1}}>Cancelar</Btn>
        </div>
      </Modal>}

      {detail&&<Modal title={detail.empresa} onClose={closeDetail} width={620}>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16}}>
          <ProspStatusBadge status={detail.status}/>
          <ProspPrio p={detail.prioridade}/>
          <span style={{fontSize:11,fontWeight:700,padding:"2px 10px",borderRadius:20,background:"#F3F4F6",color:"#374151"}}>{TEMP_EMOJI[detail.temperatura]} {detail.temperatura?.charAt(0).toUpperCase()+detail.temperatura?.slice(1)}</span>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16,fontSize:13}}>
          <div><div style={{color:"#94A3B8",fontSize:11,fontWeight:700,textTransform:"uppercase"}}>Segmento</div><div style={{color:"#111827",fontWeight:600}}>{detail.segmento||"—"}</div></div>
          <div><div style={{color:"#94A3B8",fontSize:11,fontWeight:700,textTransform:"uppercase"}}>Bairro</div><div style={{color:"#111827",fontWeight:600}}>{detail.bairro||"—"}</div></div>
          <div><div style={{color:"#94A3B8",fontSize:11,fontWeight:700,textTransform:"uppercase"}}>Instagram</div><div style={{color:"#111827",fontWeight:600}}>{detail.instagram||"—"}</div></div>
          <div><div style={{color:"#94A3B8",fontSize:11,fontWeight:700,textTransform:"uppercase"}}>WhatsApp</div><div style={{color:"#111827",fontWeight:600}}>{detail.whatsapp||"—"}</div></div>
          <div><div style={{color:"#94A3B8",fontSize:11,fontWeight:700,textTransform:"uppercase"}}>Responsável</div><div style={{color:"#111827",fontWeight:600}}>{detail.responsavel||"—"}</div></div>
          <div><div style={{color:"#94A3B8",fontSize:11,fontWeight:700,textTransform:"uppercase"}}>Vendedor</div><div style={{color:"#111827",fontWeight:600}}>{detail.vendedor||"—"}</div></div>
          <div><div style={{color:"#94A3B8",fontSize:11,fontWeight:700,textTransform:"uppercase"}}>Origem</div><div style={{color:"#111827",fontWeight:600}}>{ORIGEM_OPTS.find(o=>o.value===detail.origem)?.label||detail.origem||"—"}</div></div>
          <div><div style={{color:"#94A3B8",fontSize:11,fontWeight:700,textTransform:"uppercase"}}>Valor estimado</div><div style={{color:"#111827",fontWeight:600}}>{detail.valor_estimado?`R$ ${Number(detail.valor_estimado).toLocaleString("pt-BR")}`:"—"}</div></div>
        </div>
        {detail.servicos?.length>0&&<div style={{marginBottom:16}}>
          <div style={{color:"#94A3B8",fontSize:11,fontWeight:700,textTransform:"uppercase",marginBottom:6}}>Serviços de interesse</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>{detail.servicos.map(s=><span key={s} style={{background:"#FFF7F3",color:"#FF6200",borderRadius:8,padding:"4px 12px",fontSize:12,fontWeight:700}}>{SERVICOS_OPTS.find(o=>o.value===s)?.label||s}</span>)}</div>
        </div>}
        {(detail.proxima_acao||detail.proxima_acao_data)&&<div style={{background:"#EEF3F8",borderRadius:10,padding:"12px 14px",marginBottom:16,fontSize:13}}>
          <div style={{fontWeight:700,color:"#111827"}}>Próxima ação: {detail.proxima_acao||"—"}</div>
          {detail.proxima_acao_data&&<div style={{color:"#64748B",fontSize:12,marginTop:2}}>{fmtDate(detail.proxima_acao_data)}</div>}
        </div>}
        {detail.observacoes&&<div style={{marginBottom:16}}>
          <div style={{color:"#94A3B8",fontSize:11,fontWeight:700,textTransform:"uppercase",marginBottom:6}}>Observações</div>
          <div style={{fontSize:13,color:"#374151",lineHeight:1.6,background:"#F8FAFC",borderRadius:10,padding:"12px 14px"}}>{detail.observacoes}</div>
        </div>}
        {detail.status==="perdido"&&detail.motivo_perda&&<div style={{marginBottom:16,background:"#FEF2F2",borderRadius:10,padding:"12px 14px",fontSize:13,color:"#991B1B"}}>Motivo da perda: {MOTIVO_PERDA_OPTS.find(o=>o.value===detail.motivo_perda)?.label||detail.motivo_perda}</div>}

        <Btn style={{width:"100%",marginBottom:20,background:"linear-gradient(135deg,#7C3AED,#A855F7)"}} onClick={()=>setIaOpen(true)}>🤖 Gerar abordagem com IA</Btn>

        <div style={{fontSize:12,fontWeight:700,color:"#64748B",textTransform:"uppercase",letterSpacing:0.5,marginBottom:10}}>Histórico</div>
        <div style={{display:"flex",gap:8,marginBottom:14}}>
          <input value={novoHist} onChange={e=>setNovoHist(e.target.value)} placeholder="Adicionar registro ao histórico..." onKeyDown={e=>{if(e.key==="Enter")addHistorico();}} style={{flex:1,padding:"8px 12px",borderRadius:8,border:"1.5px solid #DDE5EF",fontSize:12,color:"#111827",outline:"none",fontFamily:"inherit"}}/>
          <Btn size="sm" onClick={addHistorico}>Adicionar</Btn>
        </div>
        <div style={{maxHeight:220,overflowY:"auto"}}>
          {histLoading?<div style={{color:"#94A3B8",fontSize:12,textAlign:"center",padding:"14px 0"}}>Carregando...</div>:historico.length===0?<div style={{color:"#94A3B8",fontSize:12,textAlign:"center",padding:"14px 0"}}>Nenhum registro ainda.</div>:historico.map(h=>(
            <div key={h.id} style={{padding:"10px 0",borderBottom:"1px solid #EEF3F8"}}>
              <div style={{fontSize:12,color:"#374151"}}>{h.texto}</div>
              <div style={{fontSize:10,color:"#94A3B8",marginTop:2}}>{new Date(h.created_at).toLocaleString("pt-BR")}</div>
            </div>
          ))}
        </div>

        <div style={{display:"flex",gap:10,marginTop:20}}>
          <Btn variant="ghost" style={{flex:1}} onClick={()=>{const p=detail;closeDetail();openEdit(p);}}>{IC.edit} Editar</Btn>
          <Btn variant="danger" style={{flex:1}} onClick={()=>setConfirm(detail)}>{IC.trash} Excluir</Btn>
        </div>
      </Modal>}

      {iaOpen&&detail&&(
        <div style={{position:"fixed",inset:0,background:"rgba(17,24,39,0.5)",zIndex:1200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{background:"#fff",borderRadius:16,width:"100%",maxWidth:640,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,0.25)"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"18px 24px",borderBottom:"1px solid #EEF3F8"}}>
              <div style={{fontSize:17,fontWeight:800,color:"#111827"}}>🤖 Gerar abordagem — {detail.empresa}</div>
              <button onClick={()=>setIaOpen(false)} style={{background:"none",border:"none",fontSize:22,cursor:"pointer",color:"#64748B"}}>×</button>
            </div>
            <div style={{display:"flex",gap:6,padding:"14px 24px 0",flexWrap:"wrap",borderBottom:"1px solid #EEF3F8"}}>
              {IA_TABS.map(t=><button key={t.id} onClick={()=>setIaTab(t.id)} style={{background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:700,padding:"8px 10px",color:iaTab===t.id?"#FF6200":"#64748B",borderBottom:iaTab===t.id?"2px solid #FF6200":"2px solid transparent",marginBottom:-1}}>{t.label}</button>)}
            </div>
            <div style={{padding:24}}>
              {iaLoading&&<div style={{textAlign:"center",padding:"40px 0",color:"#64748B",fontSize:13}}>Gerando conteúdo com IA...</div>}
              {!iaLoading&&iaErr&&<div style={{background:"#FEF2F2",border:"1px solid #FECACA",color:"#991B1B",borderRadius:8,padding:"12px 14px",fontSize:13,marginBottom:14}}>{iaErr}</div>}
              {!iaLoading&&!iaErr&&iaCache[iaTab]&&(
                <div style={{background:"#F8FAFC",borderRadius:10,padding:"16px 18px",fontSize:13,color:"#374151",lineHeight:1.7,whiteSpace:"pre-wrap",marginBottom:16}}>{iaCache[iaTab]}</div>
              )}
              {!iaLoading&&(
                <div style={{display:"flex",gap:10}}>
                  <Btn variant={iaCopied?"success":"ghost"} style={{flex:1}} onClick={()=>copyIA(iaCache[iaTab]||"")} disabled={!iaCache[iaTab]}>{iaCopied?"Copiado!":"Copiar"}</Btn>
                  <Btn variant="secondary" style={{flex:1}} onClick={()=>gerarIA(iaTab,true)}>⟳ Regenerar</Btn>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {confirm&&<ConfirmModal msg={`Remover "${confirm.empresa}" da prospecção?`} onConfirm={()=>remove(confirm.id)} onCancel={()=>setConfirm(null)}/>}
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
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:18}}>
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
    const cobAtual=cobr.find(c=>c.id===id);
    if(!cobAtual) return;
    const pagamento=cobAtual.pagamento||"Pix";
    await supabase.from("cobrancas").update({status:"pago",pagamento}).eq("id",id);
    setCobr(prev=>prev.map(c=>c.id===id?{...c,status:"pago",pagamento}:c));
    // Gera a cobrança do mês seguinte (mesmo cliente, valor e dia), se ainda não existir
    const novaData=addMonths(cobAtual.vencimento,1);
    if(cobr.some(c=>c.cliente===cobAtual.cliente&&String(c.vencimento).split("T")[0]===novaData)) return;
    const novaCob={cliente:cobAtual.cliente,valor:cobAtual.valor,vencimento:novaData,status:"pendente",pagamento:""};
    const {data:ins}=await supabase.from("cobrancas").insert([novaCob]).select();
    if(ins) setCobr(prev=>[...prev,...ins]);
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
const BLANK_DESP={nome:"",categoria:"Ferramentas",valor:"",vencimento:"",status:"pendente",tipo:"uma_vez",parcelado_em:"1"};

const DespesasPage=({despesas,setDespesas,loading})=>{
  const [modal,setModal]=useState(false);
  const [form,setForm]=useState(BLANK_DESP);
  const [editing,setEditing]=useState(null);
  const [confirm,setConfirm]=useState(null);
  const [saving,setSaving]=useState(false);

  const f=(k,v)=>setForm(p=>({...p,[k]:v}));
  const total=despesas.reduce((a,d)=>a+Number(d.valor),0);
  const pagas=despesas.filter(d=>d.status==="pago").reduce((a,d)=>a+Number(d.valor),0);

  const openNew=()=>{setForm({...BLANK_DESP,vencimento:todayStr()});setEditing(null);setModal(true);};
  const openEdit=(d)=>{setForm({...d,tipo:d.tipo||"uma_vez",parcelado_em:String(d.parcelado_em||1),vencimento:d.vencimento?.split("T")[0]||d.vencimento});setEditing(d.id);setModal(true);};

  const marcarPago=async(id)=>{
    const desp=despesas.find(d=>d.id===id);
    if(!desp) return;
    await supabase.from("despesas").update({status:"pago"}).eq("id",id);
    setDespesas(prev=>prev.map(d=>d.id===id?{...d,status:"pago"}:d));
    // Conta fixa: cria a do mês seguinte (a atual fica registrada como paga)
    if(desp.tipo!=="fixa") return;
    const novaData=addMonths(desp.vencimento,1);
    if(despesas.some(d=>d.tipo==="fixa"&&d.nome===desp.nome&&String(d.vencimento).split("T")[0]===novaData)) return;
    const nova={nome:desp.nome,categoria:desp.categoria,valor:desp.valor,vencimento:novaData,status:"pendente",tipo:"fixa",parcelado_em:1,parcela_numero:1};
    const {data:ins}=await supabase.from("despesas").insert([nova]).select();
    if(ins) setDespesas(prev=>[...prev,...ins]);
  };

  const desativarFixa=async(id)=>{
    await supabase.from("despesas").update({tipo:"uma_vez"}).eq("id",id);
    setDespesas(prev=>prev.map(d=>d.id===id?{...d,tipo:"uma_vez"}:d));
  };

  const save=async()=>{
    if(!form.nome){return;}
    setSaving(true);
    const base={nome:form.nome,categoria:form.categoria,valor:Number(form.valor),vencimento:form.vencimento||null,status:form.status,tipo:form.tipo};
    if(editing){
      await supabase.from("despesas").update(base).eq("id",editing);
      setDespesas(prev=>prev.map(d=>d.id===editing?{...d,...base}:d));
    } else {
      // Parcelada: uma linha por parcela, vencendo mês a mês a partir da data informada
      const n=form.tipo==="uma_vez"?Math.max(1,parseInt(form.parcelado_em)||1):1;
      const venc0=form.vencimento||todayStr();
      const rows=Array.from({length:n},(_,i)=>({...base,vencimento:addMonths(venc0,i),parcelado_em:n,parcela_numero:i+1,status:i===0?form.status:"pendente"}));
      const {data:ins}=await supabase.from("despesas").insert(rows).select();
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
        <Tbl cols={["Nome","Categoria","Tipo","Valor","Vencimento","Status","Ações"]}
          rows={despesas.map(d=>[
            <span style={{fontWeight:700,color:"#111827"}}>{d.nome}</span>,
            <span style={{background:"#EEF3F8",borderRadius:6,padding:"2px 8px",fontSize:12,fontWeight:600,color:"#64748B"}}>{d.categoria}</span>,
            d.tipo==="fixa"?<span style={{background:"#F5F3FF",color:"#7C3AED",borderRadius:6,padding:"2px 8px",fontSize:12,fontWeight:700}}>Fixa</span>
              :d.parcelado_em>1?<span style={{background:"#FFF7ED",color:"#C2410C",borderRadius:6,padding:"2px 8px",fontSize:12,fontWeight:700,whiteSpace:"nowrap"}}>Parcela {d.parcela_numero}/{d.parcelado_em}</span>
              :<span style={{color:"#94A3B8",fontSize:12}}>Uma vez</span>,
            <span style={{fontWeight:800}}>R$ {Number(d.valor).toLocaleString()}</span>,
            fmtDate(d.vencimento),
            <StatusBadge status={d.status}/>,
            <div style={{display:"flex",gap:6}}>
              {d.status!=="pago"&&<Btn size="sm" variant="success" onClick={()=>marcarPago(d.id)}>Pago</Btn>}
              {d.tipo==="fixa"&&d.status!=="pago"&&<Btn size="sm" variant="ghost" onClick={()=>desativarFixa(d.id)} style={{whiteSpace:"nowrap"}}>Parar de repetir</Btn>}
              <Btn size="sm" variant="ghost" onClick={()=>openEdit(d)}>{IC.edit}</Btn>
              <Btn size="sm" variant="danger" onClick={()=>setConfirm(d)}>{IC.trash}</Btn>
            </div>
          ])}/>
      </Card>
      {modal&&<Modal title={editing?"Editar Despesa":"Nova Despesa"} onClose={()=>setModal(false)}>
        <FInput label="Nome da despesa *" value={form.nome} onChange={v=>f("nome",v)} placeholder="Adobe Creative Cloud"/>
        <FSel label="Categoria" value={form.categoria} onChange={v=>f("categoria",v)} options={["Ferramentas","Assinaturas","Colaboradores","Internet","Equipamentos","Outros"].map(c=>({value:c,label:c}))}/>
        <FSel label="Tipo" value={form.tipo} onChange={v=>f("tipo",v)} options={[{value:"uma_vez",label:"Uma vez"},{value:"fixa",label:"Fixa (repete todo mês)"}]}/>
        {!editing&&form.tipo==="uma_vez"&&<FSel label="Parcelado em" value={form.parcelado_em} onChange={v=>f("parcelado_em",v)} options={Array.from({length:24},(_,i)=>({value:String(i+1),label:i===0?"À vista (1x)":`${i+1}x`}))}/>}
        <FInput label={Number(form.parcelado_em)>1&&!editing&&form.tipo==="uma_vez"?"Valor de cada parcela (R$)":"Valor (R$)"} value={form.valor} onChange={v=>f("valor",v)} placeholder="349"/>
        <FInput label={Number(form.parcelado_em)>1&&!editing&&form.tipo==="uma_vez"?"Vencimento da 1ª parcela":"Data de vencimento"} value={form.vencimento} onChange={v=>f("vencimento",v)} type="date"/>
        {form.tipo==="fixa"&&<div style={{fontSize:12,color:"#64748B",marginTop:-6,marginBottom:14}}>Ao marcar como paga, a conta do mês seguinte é criada automaticamente.</div>}
        <FSel label="Status" value={form.status} onChange={v=>f("status",v)} options={[{value:"pendente",label:"Pendente"},{value:"pago",label:"Pago"}]}/>
        <div style={{display:"flex",gap:10}}><Btn style={{flex:1}} onClick={save} disabled={saving}>{saving?"Salvando...":"Salvar"}</Btn><Btn variant="ghost" onClick={()=>setModal(false)} style={{flex:1}}>Cancelar</Btn></div>
      </Modal>}
      {confirm&&<ConfirmModal msg={`Remover "${confirm.nome}"?`} onConfirm={()=>remove(confirm.id)} onCancel={()=>setConfirm(null)}/>}
    </div>
  );
};

// ── AGENDA RECORRENTE ─────────────────────────────────────────────────────────
const DIAS_SEMANA=[{label:"Seg",value:1},{label:"Ter",value:2},{label:"Qua",value:3},{label:"Qui",value:4},{label:"Sex",value:5},{label:"Sáb",value:6},{label:"Dom",value:0}];
const TIPO_AGENDA={gravacao:{label:"Gravação",emoji:"📹",color:"#FF6200",bg:"#FFF7F3"},reuniao:{label:"Reunião",emoji:"📞",color:"#3B82F6",bg:"#EFF6FF"},atendimento:{label:"Atendimento",emoji:"🤝",color:"#10B981",bg:"#ECFDF5"}};
// Colunas do kanban semanal: segunda é o início da semana
const SEMANA_COLS=[{label:"Seg",dia:1},{label:"Ter",dia:2},{label:"Qua",dia:3},{label:"Qui",dia:4},{label:"Sex",dia:5},{label:"Sáb",dia:6},{label:"Dom",dia:0}];
const BLANK_AGENDA={cliente_id:"",tipo:"gravacao",dias_semana:[],horario:"",local_descricao:"",responsavel_id:"",briefing:""};
const AGENDA_SEMANAS=12;

// Gera as ocorrências futuras (próximas 12 semanas) de uma agenda recorrente
const gerarOcorrencias=(ag,semanas=AGENDA_SEMANAS)=>{
  const agora=new Date();
  const hoje=new Date(agora);hoje.setHours(0,0,0,0);
  const [h,m]=String(ag.horario).split(":").map(Number);
  const out=[];
  for(let s=0;s<semanas;s++){
    for(const dia of ag.dias_semana||[]){
      const d=new Date(hoje);
      d.setDate(d.getDate()+((dia-hoje.getDay()+7)%7)+s*7);
      d.setHours(h,m,0,0);
      if(d>agora) out.push({agenda_recorrente_id:ag.id,data_hora:d.toISOString(),status:"pendente",notificacao_enviada:false});
    }
  }
  return out.sort((a,b)=>a.data_hora.localeCompare(b.data_hora));
};

const getMondayOfWeek=(date)=>{const d=new Date(date);d.setHours(0,0,0,0);d.setDate(d.getDate()-((d.getDay()+6)%7));return d;};
const fmtHora=(iso)=>new Date(iso).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"});
const mesmoDia=(iso,offset=0)=>{const d=new Date();d.setDate(d.getDate()+offset);return new Date(iso).toDateString()===d.toDateString();};
const diasLabel=(dias)=>DIAS_SEMANA.filter(d=>(dias||[]).includes(d.value)).map(d=>d.label).join(", ");

// Notificações PWA: usa o service worker quando houver (obrigatório no Android), senão a API direta
const notificar=async(titulo,corpo)=>{
  if(typeof window==="undefined"||!("Notification" in window)||Notification.permission!=="granted") return;
  const opts={body:corpo,icon:"/icon.png",badge:"/icon.png"};
  try{
    const reg=await navigator.serviceWorker?.getRegistration();
    if(reg){await reg.showNotification(titulo,opts);return;}
    new Notification(titulo,opts);
  }catch(e){console.error("Erro ao notificar",e);}
};

const TipoAgendaBadge=({tipo})=>{const t=TIPO_AGENDA[tipo];return t?<span style={{background:t.bg,color:t.color,fontSize:11,fontWeight:700,padding:"2px 10px",borderRadius:20,whiteSpace:"nowrap"}}>{t.emoji} {t.label}</span>:null;};

const AgendaPage=({clients,equipe})=>{
  const isMobile=typeof window!=="undefined"&&window.innerWidth<768;
  const [agendas,setAgendas]=useState([]);
  const [ocorrencias,setOcorrencias]=useState([]);
  const [loading,setLoading]=useState(true);
  const [filtro,setFiltro]=useState("todos");
  const [modal,setModal]=useState(false);
  const [form,setForm]=useState(BLANK_AGENDA);
  const [editing,setEditing]=useState(null);
  const [confirm,setConfirm]=useState(null);
  const [saving,setSaving]=useState(false);
  const [notifOk,setNotifOk]=useState(typeof window!=="undefined"&&"Notification" in window&&Notification.permission==="granted");
  const [banner,setBanner]=useState(null);
  const [semanaOffset,setSemanaOffset]=useState(0);
  const [ocsSemana,setOcsSemana]=useState([]);
  const [hojeKey,setHojeKey]=useState(()=>new Date().toDateString());

  const f=(k,v)=>setForm(p=>({...p,[k]:v}));
  const nomeCli=(id)=>clients.find(c=>String(c.id)===String(id))?.name||"—";
  const nomeResp=(id)=>equipe.find(e=>String(e.id)===String(id))?.nome||"";
  const agendaDe=(oc)=>agendas.find(a=>a.id===oc.agenda_recorrente_id);

  const load=async()=>{
    setLoading(true);
    try{
      const inicioHoje=new Date();inicioHoje.setHours(0,0,0,0);
      const {data:ags,error}=await supabase.from("agenda_recorrente").select("*").eq("ativa",true).order("created_at",{ascending:false});
      if(error) throw error;
      // Completa a janela de 12 semanas (agendas antigas vão "andando" sozinhas)
      const novas=(ags||[]).flatMap(a=>gerarOcorrencias(a));
      if(novas.length) await supabase.from("agenda_ocorrencia").upsert(novas,{onConflict:"agenda_recorrente_id,data_hora",ignoreDuplicates:true});
      const {data:ocs}=await supabase.from("agenda_ocorrencia").select("*").gte("data_hora",inicioHoje.toISOString()).order("data_hora");
      const ativos=new Set((ags||[]).map(a=>a.id));
      setAgendas(ags||[]);
      setOcorrencias((ocs||[]).filter(o=>ativos.has(o.agenda_recorrente_id)));
    }catch(e){console.error("Erro ao carregar agenda",e);}
    setLoading(false);
  };
  useEffect(()=>{load();},[]);

  // Vira o dia (ex.: domingo → segunda) sem recarregar a página: o kanban acompanha a nova semana
  useEffect(()=>{
    const t=setInterval(()=>setHojeKey(new Date().toDateString()),60000);
    return ()=>clearInterval(t);
  },[]);

  const segunda=getMondayOfWeek(new Date(hojeKey));
  segunda.setDate(segunda.getDate()+semanaOffset*7);
  const domingoFim=new Date(segunda);domingoFim.setDate(domingoFim.getDate()+7);

  // Ocorrências da semana exibida (inclui semanas passadas)
  useEffect(()=>{
    if(agendas.length===0){setOcsSemana([]);return;}
    const ativos=new Set(agendas.map(a=>a.id));
    supabase.from("agenda_ocorrencia").select("*").gte("data_hora",segunda.toISOString()).lt("data_hora",domingoFim.toISOString()).order("data_hora")
      .then(({data})=>setOcsSemana((data||[]).filter(o=>ativos.has(o.agenda_recorrente_id))));
  },[semanaOffset,agendas,hojeKey]);

  // Alerta 24h antes de cada ocorrência pendente (uma única vez por ocorrência)
  useEffect(()=>{
    if(!notifOk||agendas.length===0) return;
    const agora=Date.now(),em24h=agora+24*60*60*1000;
    const alvo=ocorrencias.filter(o=>o.status==="pendente"&&!o.notificacao_enviada&&new Date(o.data_hora).getTime()>agora&&new Date(o.data_hora).getTime()<=em24h);
    if(alvo.length===0) return;
    alvo.forEach(o=>{
      const ag=agendaDe(o);if(!ag) return;
      const t=TIPO_AGENDA[ag.tipo];
      notificar(`${t.emoji} ${t.label} — ${mesmoDia(o.data_hora)?"hoje":"amanhã"} ${fmtHora(o.data_hora)}`,`${nomeCli(ag.cliente_id)}${ag.local_descricao?` • ${ag.local_descricao}`:""}`);
    });
    const ids=alvo.map(o=>o.id);
    supabase.from("agenda_ocorrencia").update({notificacao_enviada:true}).in("id",ids).then(()=>{});
    setOcorrencias(prev=>prev.map(o=>ids.includes(o.id)?{...o,notificacao_enviada:true}:o));
  },[ocorrencias,agendas,notifOk]);

  const ativarNotif=async()=>{
    if(!("Notification" in window)){setBanner(["err","Este navegador não suporta notificações."]);return;}
    const r=await Notification.requestPermission();
    setNotifOk(r==="granted");
    setBanner(r==="granted"?["ok","Notificações ativadas! Você receberá alertas 24h antes."]:["err","Permissão negada. Ative nas configurações do navegador."]);
    setTimeout(()=>setBanner(null),4000);
  };

  const openNew=()=>{setForm(BLANK_AGENDA);setEditing(null);setModal(true);};
  const openEdit=(a)=>{setForm({cliente_id:a.cliente_id||"",tipo:a.tipo,dias_semana:a.dias_semana||[],horario:String(a.horario||"").slice(0,5),local_descricao:a.local_descricao||"",responsavel_id:a.responsavel_id||"",briefing:a.briefing||""});setEditing(a);setModal(true);};
  const toggleDia=(v)=>setForm(p=>({...p,dias_semana:p.dias_semana.includes(v)?p.dias_semana.filter(d=>d!==v):[...p.dias_semana,v]}));

  const save=async()=>{
    if(!form.cliente_id||!form.tipo||form.dias_semana.length===0||!form.horario) return;
    setSaving(true);
    try{
      const data={cliente_id:form.cliente_id,tipo:form.tipo,dias_semana:[...form.dias_semana].sort(),horario:form.horario,local_descricao:form.local_descricao||null,responsavel_id:form.responsavel_id||null,briefing:form.briefing||null};
      let ag;
      if(editing){
        const {data:up,error}=await supabase.from("agenda_recorrente").update(data).eq("id",editing.id).select().single();
        if(error) throw error;
        ag=up;
        // Regenera só as futuras pendentes; feitas/canceladas ficam no histórico
        await supabase.from("agenda_ocorrencia").delete().eq("agenda_recorrente_id",ag.id).eq("status","pendente").gte("data_hora",new Date().toISOString());
      } else {
        const {data:ins,error}=await supabase.from("agenda_recorrente").insert([{...data,ativa:true}]).select().single();
        if(error) throw error;
        ag=ins;
      }
      const ocs=gerarOcorrencias(ag);
      if(ocs.length) await supabase.from("agenda_ocorrencia").upsert(ocs,{onConflict:"agenda_recorrente_id,data_hora",ignoreDuplicates:true});
      setModal(false);
      await load();
    }catch(e){
      console.error("Erro ao salvar agenda",e);
      alert("Erro ao salvar agenda. Tente novamente.");
    }
    setSaving(false);
  };

  const remove=async(a)=>{
    await supabase.from("agenda_ocorrencia").delete().eq("agenda_recorrente_id",a.id).gte("data_hora",new Date().toISOString());
    await supabase.from("agenda_recorrente").update({ativa:false}).eq("id",a.id);
    setAgendas(prev=>prev.filter(x=>x.id!==a.id));
    setOcorrencias(prev=>prev.filter(o=>o.agenda_recorrente_id!==a.id));
    setOcsSemana(prev=>prev.filter(o=>o.agenda_recorrente_id!==a.id));
    setConfirm(null);
  };

  const setStatusOc=async(id,status)=>{
    await supabase.from("agenda_ocorrencia").update({status}).eq("id",id);
    setOcorrencias(prev=>prev.map(o=>o.id===id?{...o,status}:o));
    setOcsSemana(prev=>prev.map(o=>o.id===id?{...o,status}:o));
  };

  if(loading) return <Loading/>;

  const agora=Date.now(),em7=agora+7*24*60*60*1000;
  const fl=ocsSemana.filter(o=>filtro==="todos"||agendaDe(o)?.tipo===filtro);
  const diasSemana=SEMANA_COLS.map((c,i)=>{const d=new Date(segunda);d.setDate(d.getDate()+i);return {...c,data:d,ocs:fl.filter(o=>new Date(o.data_hora).toDateString()===d.toDateString())};});
  const fimSemana=diasSemana[6].data;
  const fmtDM=(d)=>d.toLocaleDateString("pt-BR",{day:"2-digit",month:"short"}).replace(".","");
  const pend=(o)=>o.status==="pendente";
  const totalHoje=ocorrencias.filter(o=>pend(o)&&mesmoDia(o.data_hora)).length;
  const totalAmanha=ocorrencias.filter(o=>pend(o)&&mesmoDia(o.data_hora,1)).length;
  const totalSemana=ocorrencias.filter(o=>{const t=new Date(o.data_hora).getTime();return pend(o)&&t>=agora&&t<=em7;}).length;

  return (
    <div>
      {banner&&<div style={{background:banner[0]==="ok"?"#DCFCE7":"#FEE2E2",color:banner[0]==="ok"?"#166534":"#991B1B",borderRadius:10,padding:"10px 14px",fontSize:13,fontWeight:600,marginBottom:16}}>{banner[1]}</div>}

      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:isMobile?8:16,marginBottom:20}}>
        <MC compact={isMobile} label="Hoje" value={totalHoje} icon={IC.cal}/>
        <MC compact={isMobile} label="Amanhã" value={totalAmanha} icon={IC.clock} bg="#EFF6FF"/>
        <MC compact={isMobile} label="Próx. 7 dias" value={totalSemana} icon={IC.repeat} bg="#F0FDF4"/>
      </div>

      <div style={{display:"flex",gap:isMobile?8:12,marginBottom:20,alignItems:"center",flexWrap:"wrap"}}>
        {[{value:"todos",label:"Todos"},...Object.entries(TIPO_AGENDA).map(([value,t])=>({value,label:`${t.emoji} ${t.label}`}))].map(fi=><Btn key={fi.value} size="sm" variant={filtro===fi.value?"secondary":"ghost"} onClick={()=>setFiltro(fi.value)}>{fi.label} <span style={{marginLeft:6,background:filtro===fi.value?"rgba(255,255,255,0.25)":"#EEF3F8",borderRadius:99,padding:"0 6px",fontSize:11,fontWeight:800,color:filtro===fi.value?"#fff":"#64748B"}}>{ocsSemana.filter(o=>fi.value==="todos"||agendaDe(o)?.tipo===fi.value).length}</span></Btn>)}
        <div style={{flex:1}}/>
        {!notifOk&&<Btn variant="ghost" onClick={ativarNotif}>🔔 Ativar notificações</Btn>}
        <Btn onClick={openNew}>+ Nova Agenda</Btn>
      </div>

      <Card style={{padding:0,marginBottom:24}}>
        <div style={{padding:"16px 18px 12px",fontSize:14,fontWeight:800,color:"#111827",display:"flex",alignItems:"center",gap:8}}><span style={{color:"#FF6200",display:"flex"}}>{IC.repeat}</span>Agendas fixas <span style={{fontSize:12,color:"#64748B",fontWeight:600}}>· {agendas.length} ativa{agendas.length!==1?"s":""}</span></div>
        <Tbl cols={["Cliente","Tipo","Dias","Horário","Responsável","Ações"]}
          rows={agendas.map(a=>[
            <div><div style={{fontWeight:700,color:"#111827"}}>{nomeCli(a.cliente_id)}</div>{a.local_descricao&&<div style={{fontSize:11,color:"#64748B"}}>{a.local_descricao}</div>}</div>,
            <TipoAgendaBadge tipo={a.tipo}/>,
            <span style={{whiteSpace:"nowrap"}}>{diasLabel(a.dias_semana)}</span>,
            <span style={{fontWeight:700,whiteSpace:"nowrap"}}>{String(a.horario).slice(0,5)}</span>,
            nomeResp(a.responsavel_id)||<span style={{color:"#94A3B8"}}>—</span>,
            <div style={{display:"flex",gap:6}}>
              <Btn size="sm" variant="ghost" onClick={()=>openEdit(a)}>{IC.edit}</Btn>
              <Btn size="sm" variant="danger" onClick={()=>setConfirm(a)}>{IC.trash}</Btn>
            </div>
          ])}/>
      </Card>

      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14,flexWrap:"wrap"}}>
        <h2 style={{margin:0,fontSize:18,fontWeight:800,color:"#111827",marginRight:"auto"}}>{semanaOffset===0?"Esta semana":semanaOffset===1?"Próxima semana":semanaOffset===-1?"Semana passada":"Semana"} <span style={{fontSize:13,fontWeight:600,color:"#64748B"}}>· {fmtDM(segunda)} – {fmtDM(fimSemana)}</span></h2>
        <Btn size="sm" variant="ghost" onClick={()=>setSemanaOffset(o=>o-1)}>← Anterior</Btn>
        <Btn size="sm" variant={semanaOffset===0?"secondary":"ghost"} onClick={()=>setSemanaOffset(0)}>Hoje</Btn>
        <Btn size="sm" variant="ghost" onClick={()=>setSemanaOffset(o=>o+1)}>Próxima →</Btn>
      </div>
      <div style={{overflowX:"auto",paddingBottom:8}}>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(7,minmax(140px,1fr))":"repeat(7,1fr)",gap:10}}>
          {diasSemana.map(col=>{
            const ehHoje=col.data.toDateString()===hojeKey;
            return (
              <div key={col.dia} style={{display:"flex",flexDirection:"column",minHeight:200,background:"#F0F4F9",borderRadius:12,overflow:"hidden",minWidth:0}}>
                <div style={{background:ehHoje?"#FF6200":"#F8FAFC",color:ehHoje?"#fff":"#1F2F46",padding:"8px 10px",textAlign:"center",borderBottom:ehHoje?"none":"1px solid #DDE5EF"}}>
                  <div style={{fontSize:13,fontWeight:800}}>{col.label}</div>
                  <div style={{fontSize:11,fontWeight:600,opacity:ehHoje?0.9:0.6}}>{col.data.getDate()}</div>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:8,padding:8,flex:1}}>
                  {col.ocs.map(o=>{
                    const ag=agendaDe(o);if(!ag) return null;
                    const t=TIPO_AGENDA[ag.tipo];
                    const resp=nomeResp(ag.responsavel_id);
                    return (
                      <div key={o.id} title={ag.briefing||""} style={{background:"#fff",borderRadius:8,padding:10,boxShadow:"0 1px 3px rgba(0,0,0,0.06)",borderLeft:`3px solid ${t.color}`,opacity:o.status==="pendente"?1:0.55}}>
                        <div style={{fontSize:13,fontWeight:800,color:"#111827",textDecoration:o.status==="cancelada"?"line-through":"none"}}>{fmtHora(o.data_hora)}</div>
                        <div style={{fontSize:12,fontWeight:700,color:"#1F2F46",margin:"2px 0 6px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{nomeCli(ag.cliente_id)}</div>
                        <TipoAgendaBadge tipo={ag.tipo}/>
                        {resp&&<div style={{fontSize:11,color:"#64748B",marginTop:6,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>👤 {resp}</div>}
                        <div style={{display:"flex",gap:4,marginTop:8,alignItems:"center"}}>
                          {o.status==="pendente"
                            ?<><Btn size="sm" variant="success" style={{flex:1,padding:"3px 6px"}} onClick={()=>setStatusOc(o.id,"feita")}>✓</Btn><Btn size="sm" variant="ghost" style={{flex:1,padding:"3px 6px"}} onClick={()=>setStatusOc(o.id,"cancelada")}>✕</Btn></>
                            :<><div style={{flex:1}}><StatusBadge status={o.status}/></div><Btn size="sm" variant="ghost" style={{padding:"3px 6px"}} onClick={()=>setStatusOc(o.id,"pendente")}>↺</Btn></>}
                        </div>
                      </div>
                    );
                  })}
                  {col.ocs.length===0&&<div style={{color:"#94A3B8",fontSize:12,textAlign:"center",padding:"20px 0"}}>—</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {modal&&<Modal title={editing?"Editar Agenda":"Nova Agenda Recorrente"} onClose={()=>setModal(false)}>
        <FSel label="Cliente *" value={form.cliente_id} onChange={v=>f("cliente_id",v)} options={[{value:"",label:"Selecione..."},...clients.map(c=>({value:c.id,label:c.name}))]}/>
        <FSel label="Tipo *" value={form.tipo} onChange={v=>f("tipo",v)} options={Object.entries(TIPO_AGENDA).map(([value,t])=>({value,label:`${t.emoji} ${t.label}`}))}/>
        <div style={{marginBottom:14}}>
          <label style={{display:"block",fontSize:12,fontWeight:700,color:"#374151",marginBottom:5}}>Dias da semana *</label>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {DIAS_SEMANA.map(d=>{const on=form.dias_semana.includes(d.value);return (
              <label key={d.value} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 10px",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:700,border:`1.5px solid ${on?"#FF6200":"#DDE5EF"}`,background:on?"#FFF7F3":"#FAFBFD",color:on?"#FF6200":"#374151"}}>
                <input type="checkbox" checked={on} onChange={()=>toggleDia(d.value)} style={{accentColor:"#FF6200",margin:0}}/>{d.label}
              </label>
            );})}
          </div>
        </div>
        <FInput label="Horário *" value={form.horario} onChange={v=>f("horario",v)} type="time"/>
        <FInput label="Local / Descrição" value={form.local_descricao} onChange={v=>f("local_descricao",v)} placeholder="Ex.: Studio da agência, sala de reuniões..."/>
        <FSel label="Responsável" value={form.responsavel_id} onChange={v=>f("responsavel_id",v)} options={[{value:"",label:"Selecione..."},...equipe.map(e=>({value:e.id,label:e.nome}))]}/>
        <div style={{marginBottom:14}}>
          <label style={{display:"block",fontSize:12,fontWeight:700,color:"#374151",marginBottom:5}}>Briefing</label>
          <textarea value={form.briefing} onChange={e=>f("briefing",e.target.value)} rows={3} placeholder="O que será feito..." style={{width:"100%",padding:"9px 13px",borderRadius:8,border:"1.5px solid #DDE5EF",fontSize:13,color:"#111827",outline:"none",fontFamily:"inherit",boxSizing:"border-box",background:"#FAFBFD",resize:"vertical"}}/>
        </div>
        <div style={{background:"#FFF7F3",border:"1px solid #FFD8BF",color:"#9A3412",borderRadius:10,padding:"10px 14px",fontSize:12,fontWeight:600,marginBottom:16}}>
          {editing?"Salvar vai regenerar as ocorrências pendentes futuras.":`Serão geradas automaticamente as ocorrências das próximas ${AGENDA_SEMANAS} semanas.`}
        </div>
        <div style={{display:"flex",gap:10}}><Btn style={{flex:1}} onClick={save} disabled={saving||!form.cliente_id||form.dias_semana.length===0||!form.horario}>{saving?"Salvando...":"Salvar"}</Btn><Btn variant="ghost" onClick={()=>setModal(false)} style={{flex:1}}>Cancelar</Btn></div>
      </Modal>}
      {confirm&&<ConfirmModal msg={`Excluir a agenda de "${nomeCli(confirm.cliente_id)}"? As ocorrências futuras também serão removidas.`} onConfirm={()=>remove(confirm)} onCancel={()=>setConfirm(null)}/>}
    </div>
  );
};

// ── TAREFAS KANBAN ────────────────────────────────────────────────────────────
const BLANK_TASK={titulo:"",cliente:"",responsavel:"",prioridade:"media",status:"a_fazer",tipo:"Design",entrega:""};

const isAtrasada=(t:any)=>{
  if(!t.entrega||t.status==="finalizado"||t.status==="cancelado") return false;
  const hoje=new Date(); hoje.setHours(0,0,0,0);
  const dt=new Date(t.entrega+"T00:00:00");
  return dt<hoje;
};
const diasAtraso=(t:any)=>{
  if(!isAtrasada(t)) return 0;
  const hoje=new Date(); hoje.setHours(0,0,0,0);
  const dt=new Date(t.entrega+"T00:00:00");
  return Math.floor((hoje.getTime()-dt.getTime())/(86400000));
};

const TarefasPage=({tasks,setTasks,clients,equipe,loading})=>{
  const [modal,setModal]=useState(false);
  const [form,setForm]=useState(BLANK_TASK);
  const [editing,setEditing]=useState(null);
  const [confirm,setConfirm]=useState(null);
  const [dragId,setDragId]=useState(null);
  const [dragOver,setDragOver]=useState<string|null>(null);
  const [search,setSearch]=useState("");
  const [filterResp,setFilterResp]=useState("");
  const [filterPrio,setFilterPrio]=useState("");
  const [saving,setSaving]=useState(false);

  const cols=[
    {id:"a_fazer",label:"A Fazer",color:"#1D4ED8",bg:"#EFF6FF"},
    {id:"em_producao",label:"Em Produção",color:"#FF6200",bg:"#FFF7ED"},
    {id:"aguardando",label:"Aguardando",color:"#7C3AED",bg:"#F5F3FF"},
    {id:"ajustes",label:"Ajustes",color:"#F59E0B",bg:"#FFFBEB"},
    {id:"finalizado",label:"Finalizado",color:"#10B981",bg:"#ECFDF5"},
    {id:"atrasado",label:"Atrasado",color:"#EF4444",bg:"#FEF2F2"},
  ];

  const responsaveis=[...new Set(tasks.map(t=>t.responsavel).filter(Boolean))];

  const fl=tasks.filter(t=>{
    if(search&&!t.titulo?.toLowerCase().includes(search.toLowerCase())&&!t.cliente?.toLowerCase().includes(search.toLowerCase())) return false;
    if(filterResp&&t.responsavel!==filterResp) return false;
    if(filterPrio&&t.prioridade!==filterPrio) return false;
    return true;
  });

  const atrasadasCount=tasks.filter(t=>isAtrasada(t)&&t.status!=="atrasado").length;

  const f=(k,v)=>setForm(p=>({...p,[k]:v}));
  const openNew=()=>{setForm(BLANK_TASK);setEditing(null);setModal(true);};
  const openEdit=(t)=>{setForm({...t,entrega:t.entrega?.split("T")[0]||t.entrega});setEditing(t.id);setModal(true);};

  const drop=async(newStatus,taskId?)=>{
    const id=taskId||dragId;
    if(!id) return;
    await supabase.from("tarefas").update({status:newStatus}).eq("id",id);
    setTasks(prev=>prev.map(t=>t.id===id?{...t,status:newStatus}:t));
    setDragId(null);setDragOver(null);
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
      {/* Aviso de tarefas não marcadas como atrasadas */}
      {atrasadasCount>0&&<div style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:10,padding:"10px 16px",marginBottom:16,display:"flex",alignItems:"center",gap:10}}>
        <span style={{color:"#EF4444",fontSize:16}}>{IC.alert}</span>
        <span style={{fontSize:13,color:"#7F1D1D",fontWeight:600}}>{atrasadasCount} tarefa{atrasadasCount>1?"s":""} com prazo vencido — considere mover para "Atrasado".</span>
      </div>}

      {/* Filtros */}
      <div style={{display:"flex",gap:10,marginBottom:18,alignItems:"center",flexWrap:"wrap"}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar tarefa ou cliente..." style={{flex:1,minWidth:200,padding:"9px 14px",borderRadius:9,border:"1.5px solid #DDE5EF",fontSize:13,color:"#111827",outline:"none",fontFamily:"inherit"}}/>
        <select value={filterResp} onChange={e=>setFilterResp(e.target.value)} style={{padding:"9px 12px",borderRadius:9,border:"1.5px solid #DDE5EF",fontSize:12,color:filterResp?"#111827":"#94A3B8",background:"#fff",fontFamily:"inherit",outline:"none"}}>
          <option value="">Todos responsáveis</option>
          {responsaveis.map(r=><option key={r} value={r}>{r}</option>)}
        </select>
        <select value={filterPrio} onChange={e=>setFilterPrio(e.target.value)} style={{padding:"9px 12px",borderRadius:9,border:"1.5px solid #DDE5EF",fontSize:12,color:filterPrio?"#111827":"#94A3B8",background:"#fff",fontFamily:"inherit",outline:"none"}}>
          <option value="">Todas prioridades</option>
          {["baixa","media","alta","urgente"].map(p=><option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
        </select>
        {(search||filterResp||filterPrio)&&<Btn size="sm" variant="ghost" onClick={()=>{setSearch("");setFilterResp("");setFilterPrio("");}}>✕ Limpar</Btn>}
        <Btn onClick={openNew}>+ Nova Tarefa</Btn>
      </div>

      {/* Kanban board */}
      <div style={{display:"flex",gap:14,overflowX:"auto",paddingBottom:16}}>
        {cols.map(col=>{
          const ct=fl.filter(t=>t.status===col.id);
          const isOver=dragOver===col.id;
          return (
            <div key={col.id} style={{minWidth:240,flex:"0 0 240px"}}
              onDragOver={e=>{e.preventDefault();setDragOver(col.id);}}
              onDragLeave={()=>setDragOver(null)}
              onDrop={()=>drop(col.id)}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                <div style={{width:10,height:10,borderRadius:99,background:col.color}}/>
                <span style={{fontSize:13,fontWeight:800,color:"#1F2F46"}}>{col.label}</span>
                <span style={{marginLeft:"auto",background:col.bg,borderRadius:99,padding:"1px 9px",fontSize:11,fontWeight:700,color:col.color}}>{ct.length}</span>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:10,minHeight:120,background:isOver?"#E0F2FE":"#F0F4F9",borderRadius:12,padding:10,transition:"background 0.15s",border:isOver?`2px dashed ${col.color}`:"2px solid transparent"}}>
                {ct.map(t=>{
                  const atrasado=isAtrasada(t);
                  const dias=diasAtraso(t);
                  return (
                    <div key={t.id} draggable onDragStart={()=>setDragId(t.id)} onDragEnd={()=>{setDragId(null);setDragOver(null);}}
                      style={{background:"#fff",borderRadius:10,padding:"12px 14px",boxShadow:atrasado?"0 0 0 2px #EF4444,0 2px 8px rgba(239,68,68,0.12)":"0 1px 3px rgba(0,0,0,0.06)",cursor:"grab",borderLeft:`3px solid ${atrasado?"#EF4444":col.color}`,userSelect:"none",opacity:dragId===t.id?0.5:1}}>
                      {/* Indicador de atraso */}
                      {atrasado&&<div style={{background:"#FEF2F2",borderRadius:6,padding:"3px 8px",fontSize:10,fontWeight:700,color:"#EF4444",marginBottom:8,display:"flex",alignItems:"center",gap:4}}>{IC.alert} {dias}d atrasada</div>}
                      <div style={{fontSize:13,fontWeight:700,color:"#111827",marginBottom:4,lineHeight:1.3}}>{t.titulo}</div>
                      <div style={{fontSize:11,color:"#64748B",marginBottom:8,fontWeight:500}}>{t.cliente}</div>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                        <PBadge p={t.prioridade}/>
                        <div style={{fontSize:11,color:"#64748B",fontWeight:600}}>{t.responsavel}</div>
                      </div>
                      {t.entrega&&<div style={{fontSize:11,color:atrasado?"#EF4444":"#94A3B8",display:"flex",alignItems:"center",gap:4,marginBottom:8,fontWeight:atrasado?700:400}}>{IC.clock} {fmtDate(t.entrega)}</div>}
                      <div style={{display:"flex",gap:6,marginBottom:6}}>
                        <Btn size="sm" variant="ghost" style={{flex:1,padding:"4px 8px"}} onClick={()=>openEdit(t)}>{IC.edit}</Btn>
                        <Btn size="sm" variant="danger" style={{flex:1,padding:"4px 8px"}} onClick={()=>setConfirm(t)}>{IC.trash}</Btn>
                      </div>
                      <select onChange={e=>{if(e.target.value)drop(e.target.value,t.id);e.target.value="";}} style={{width:"100%",padding:"6px 10px",borderRadius:8,border:"1.5px solid #DDE5EF",fontSize:12,color:"#64748B",background:"#F8FAFC",fontFamily:"inherit",cursor:"pointer"}}>
                        <option value="">Mover para...</option>
                        {cols.filter(c=>c.id!==col.id).map(c=><option key={c.id} value={c.id}>{c.label}</option>)}
                      </select>
                    </div>
                  );
                })}
                {ct.length===0&&<div style={{color:isOver?col.color:"#94A3B8",fontSize:12,textAlign:"center",padding:"20px 0",fontWeight:isOver?700:400}}>{isOver?"Soltar aqui":"Vazio"}</div>}
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

// ── EQUIPE + SISTEMA DE PENALIDADES ──────────────────────────────────────────
const BLANK_EQ={nome:"",funcao:"",tipo:"fixo",status:"ativo",whatsapp:""};
const PENALIDADE_VALOR=50; // R$ de referência por ponto

const EquipePage=({equipe,setEquipe,tasks,loading,perfil})=>{
  const [modal,setModal]=useState(false);
  const [form,setForm]=useState(BLANK_EQ);
  const [editing,setEditing]=useState(null);
  const [confirm,setConfirm]=useState(null);
  const [verTarefas,setVerTarefas]=useState(null);
  const [saving,setSaving]=useState(false);
  const [penalidades,setPenalidades]=useState([]);
  const [loadingPen,setLoadingPen]=useState(true);
  const [verPenalidades,setVerPenalidades]=useState(null);
  const [cancelando,setCancelando]=useState(null);
  const [justificativa,setJustificativa]=useState("");

  const f=(k,v)=>setForm(p=>({...p,[k]:v}));
  const openNew=()=>{setForm(BLANK_EQ);setEditing(null);setModal(true);};
  const openEdit=(e)=>{setForm({...e});setEditing(e.id);setModal(true);};

  // ── Carrega penalidades e detecta tarefas vencidas sem penalidade ──
  const loadPenalidades=async()=>{
    setLoadingPen(true);
    const {data:pens}=await supabase.from("penalidades").select("*").order("created_at",{ascending:false});
    const penAtivas=pens||[];
    setPenalidades(penAtivas);

    // Detecta tarefas vencidas sem penalidade registrada
    const hoje=new Date();hoje.setHours(0,0,0,0);
    const vencidas=tasks.filter(t=>{
      if(!t.entrega||t.status==="finalizado"||t.status==="cancelado") return false;
      const dt=new Date(t.entrega+"T00:00:00");
      return dt<hoje;
    });
    const idsComPenalidade=new Set(penAtivas.filter(p=>p.status!=="cancelada").map(p=>p.tarefa_id));
    const semPenalidade=vencidas.filter(t=>!idsComPenalidade.has(t.id));
    if(semPenalidade.length===0){setLoadingPen(false);return;}

    // Aplica penalidade automática a cada uma (uma só vez por tarefa)
    const novas=semPenalidade.map(t=>({
      colaborador_nome:t.responsavel||"Sem responsável",
      tarefa_id:t.id,
      tarefa_titulo:t.titulo,
      tarefa_cliente:t.cliente||"",
      tarefa_entrega:t.entrega,
      pontos:-1,
      status:"ativa",
    }));
    if(novas.length){
      const {data:ins}=await supabase.from("penalidades").insert(novas).select();
      if(ins) setPenalidades(prev=>[...ins,...prev]);
    }
    setLoadingPen(false);
  };

  useEffect(()=>{if(!loading) loadPenalidades();},[loading,tasks]);

  const cancelarPenalidade=async(pen)=>{
    if(!justificativa.trim()){return;}
    await supabase.from("penalidades").update({status:"cancelada",justificativa_cancelamento:justificativa,cancelado_em:new Date().toISOString()}).eq("id",pen.id);
    setPenalidades(prev=>prev.map(p=>p.id===pen.id?{...p,status:"cancelada",justificativa_cancelamento:justificativa}:p));
    setCancelando(null);setJustificativa("");
  };

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

  const getPontos=(nome)=>penalidades.filter(p=>p.colaborador_nome===nome.split(" ")[0]&&p.status==="ativa").reduce((a,p)=>a+p.pontos,0);
  const getPenaidadesAtivas=(nome)=>penalidades.filter(p=>p.colaborador_nome===nome.split(" ")[0]&&p.status==="ativa");

  if(loading) return <Loading/>;
  return (
    <div>
      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:18}}><Btn onClick={openNew}>+ Adicionar Colaborador</Btn></div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(290px,1fr))",gap:16}}>
        {equipe.map(e=>{
          const primeiroNome=e.nome.split(" ")[0];
          const tf=tasks.filter(t=>t.responsavel===primeiroNome);
          const at=tf.filter(t=>t.status==="atrasado");
          const pontos=getPontos(e.nome);
          const penAtivas=getPenaidadesAtivas(e.nome);
          return (
            <Card key={e.id}>
              <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:14}}>
                <div style={{position:"relative"}}>
                  <div style={{width:50,height:50,background:"linear-gradient(135deg,#1F2F46,#2D4A6A)",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:20,fontWeight:800}}>{e.nome.charAt(0)}</div>
                  {pontos<0&&<div style={{position:"absolute",top:-6,right:-6,background:"#EF4444",color:"#fff",borderRadius:99,width:20,height:20,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800}}>{pontos}</div>}
                </div>
                <div>
                  <div style={{fontSize:15,fontWeight:800,color:"#111827"}}>{e.nome}</div>
                  <div style={{fontSize:12,color:"#64748B"}}>{e.funcao}</div>
                  <span style={{background:e.tipo==="fixo"?"#EFF6FF":"#F5F3FF",color:e.tipo==="fixo"?"#1D4ED8":"#7C3AED",fontSize:11,fontWeight:700,borderRadius:6,padding:"2px 8px"}}>{e.tipo?.charAt(0).toUpperCase()+e.tipo?.slice(1)}</span>
                </div>
              </div>

              {/* Score de pontuação */}
              <div style={{background:pontos<0?"#FEF2F2":pontos===0?"#F8FAFC":"#ECFDF5",borderRadius:10,padding:"10px 14px",marginBottom:12,display:"flex",alignItems:"center",gap:10}}>
                <div style={{fontSize:22,fontWeight:900,color:pontos<0?"#EF4444":pontos===0?"#94A3B8":"#10B981"}}>{pontos}</div>
                <div>
                  <div style={{fontSize:12,fontWeight:700,color:"#374151"}}>Pontuação</div>
                  <div style={{fontSize:11,color:"#64748B"}}>Ref: R$ {Math.abs(pontos)*PENALIDADE_VALOR} {pontos<0?"dedução":pontos===0?"sem pendências":"bônus"}</div>
                </div>
                {penAtivas.length>0&&<div style={{marginLeft:"auto"}}><Btn size="sm" variant="danger" onClick={()=>setVerPenalidades({nome:e.nome,pens:penalidades.filter(p=>p.colaborador_nome===primeiroNome)})}>{IC.alert} {penAtivas.length}</Btn></div>}
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

      {/* Modal: tarefas do colaborador */}
      {verTarefas&&<Modal title={`Tarefas — ${verTarefas.nome}`} onClose={()=>setVerTarefas(null)}>
        {verTarefas.tasks.length===0?<div style={{textAlign:"center",color:"#64748B",padding:"20px 0"}}>Nenhuma tarefa atribuída.</div>:verTarefas.tasks.map(t=>(
          <div key={t.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 12px",background:"#F8FAFC",borderRadius:10,marginBottom:8}}>
            <div><div style={{fontSize:13,fontWeight:700,color:"#111827"}}>{t.titulo}</div><div style={{fontSize:11,color:"#64748B"}}>{t.cliente} · {fmtDate(t.entrega)}</div></div>
            <div style={{display:"flex",gap:8,alignItems:"center"}}><PBadge p={t.prioridade}/><StatusBadge status={t.status}/></div>
          </div>
        ))}
      </Modal>}

      {/* Modal: histórico de penalidades */}
      {verPenalidades&&<Modal title={`Penalidades — ${verPenalidades.nome}`} onClose={()=>setVerPenalidades(null)} width={560}>
        <div style={{marginBottom:12,fontSize:12,color:"#64748B"}}>Cada tarefa vencida sem entrega gera -1 ponto (referência: R$ {PENALIDADE_VALOR}).</div>
        {verPenalidades.pens.length===0?<div style={{textAlign:"center",color:"#64748B",padding:"20px 0"}}>Nenhuma penalidade registrada.</div>:verPenalidades.pens.map(p=>(
          <div key={p.id} style={{padding:"12px 14px",background:p.status==="cancelada"?"#F8FAFC":"#FEF2F2",borderRadius:10,marginBottom:8,border:`1px solid ${p.status==="cancelada"?"#E2E8F0":"#FECACA"}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:"#111827",textDecoration:p.status==="cancelada"?"line-through":"none"}}>{p.tarefa_titulo}</div>
                <div style={{fontSize:11,color:"#64748B"}}>{p.tarefa_cliente} · Venceu: {fmtDate(p.tarefa_entrega)}</div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:13,fontWeight:900,color:p.status==="cancelada"?"#94A3B8":"#EF4444"}}>{p.pontos} ponto</span>
                {p.status==="cancelada"?<span style={{background:"#F3F4F6",color:"#6B7280",fontSize:10,fontWeight:700,borderRadius:6,padding:"2px 8px"}}>Cancelada</span>:
                perfil==="admin"&&<Btn size="sm" variant="ghost" onClick={()=>{setCancelando(p);setVerPenalidades(null);}}>Cancelar</Btn>}
              </div>
            </div>
            {p.status==="cancelada"&&p.justificativa_cancelamento&&<div style={{fontSize:11,color:"#64748B",marginTop:4,fontStyle:"italic"}}>Motivo: {p.justificativa_cancelamento}</div>}
          </div>
        ))}
      </Modal>}

      {/* Modal: cancelar penalidade (só admin) */}
      {cancelando&&<Modal title="Cancelar Penalidade" onClose={()=>{setCancelando(null);setJustificativa("");}}>
        <div style={{background:"#FFFBEB",border:"1px solid #FDE68A",borderRadius:10,padding:"12px 14px",fontSize:13,color:"#92400E",marginBottom:16}}>
          Você está cancelando a penalidade de <strong>{cancelando.colaborador_nome}</strong> pela tarefa "<strong>{cancelando.tarefa_titulo}</strong>".
        </div>
        <div style={{marginBottom:14}}>
          <label style={{display:"block",fontSize:12,fontWeight:700,color:"#374151",marginBottom:5}}>Justificativa *</label>
          <textarea value={justificativa} onChange={e=>setJustificativa(e.target.value)} rows={3} placeholder="Ex.: Prazo foi estendido pelo cliente, entrega ocorreu sem registro..." style={{width:"100%",padding:"9px 13px",borderRadius:8,border:"1.5px solid #DDE5EF",fontSize:13,color:"#111827",outline:"none",fontFamily:"inherit",boxSizing:"border-box",background:"#FAFBFD",resize:"vertical"}}/>
        </div>
        <div style={{display:"flex",gap:10}}>
          <Btn style={{flex:1}} onClick={()=>cancelarPenalidade(cancelando)} disabled={!justificativa.trim()}>Confirmar cancelamento</Btn>
          <Btn variant="ghost" style={{flex:1}} onClick={()=>{setCancelando(null);setJustificativa("");}}>Voltar</Btn>
        </div>
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
  {id:1,nome:"Dia dos Namorados",data:"12/06/2026",tipo:"Comercial",nivel:"alto",nichos:["Restaurantes","Floricultura","Moda","Presentes"],status:"urgente"},
  {id:2,nome:"Festa Junina / São João",data:"24/06/2026",tipo:"Sazonal",nivel:"medio",nichos:["Alimentação","Vestuário","Eventos"],status:"planejar"},
  {id:3,nome:"Dia do Psicólogo",data:"27/05/2026",tipo:"Nicho",nivel:"medio",nichos:["Saúde","Clínicas","Bem-estar"],status:"urgente"},
  {id:4,nome:"Dia do Hambúrguer",data:"28/05/2026",tipo:"Nicho",nivel:"medio",nichos:["Alimentação","Restaurantes","Delivery"],status:"urgente"},
  {id:5,nome:"Dia do Recepcionista",data:"28/05/2026",tipo:"Nicho",nivel:"medio",nichos:["Clínicas","Empresas","Serviços"],status:"urgente"},
  {id:6,nome:"Dia Mundial do Meio Ambiente",data:"05/06/2026",tipo:"Sazonal",nivel:"medio",nichos:["Todos os nichos"],status:"planejar"},
  {id:7,nome:"Dia dos Pais",data:"09/08/2026",tipo:"Comercial",nivel:"alto",nichos:["Presentes","Moda","Restaurantes","Eletrônicos"],status:"futuro"},
  {id:8,nome:"Dia do Cliente",data:"15/09/2026",tipo:"Comercial",nivel:"alto",nichos:["Todos os nichos"],status:"futuro"},
  {id:9,nome:"Dia das Crianças",data:"12/10/2026",tipo:"Comercial",nivel:"alto",nichos:["Brinquedos","Moda Infantil","Alimentação"],status:"futuro"},
  {id:10,nome:"Halloween",data:"31/10/2026",tipo:"Comercial",nivel:"medio",nichos:["Festas","Alimentação","Moda"],status:"futuro"},
  {id:11,nome:"Black Friday",data:"27/11/2026",tipo:"Comercial",nivel:"critico",nichos:["Todos os nichos"],status:"futuro"},
  {id:12,nome:"Natal",data:"25/12/2026",tipo:"Comercial",nivel:"critico",nichos:["Todos os nichos"],status:"futuro"},
  {id:13,nome:"Ano Novo",data:"01/01/2027",tipo:"Comercial",nivel:"alto",nichos:["Festas","Restaurantes","Viagens"],status:"futuro"},
  {id:14,nome:"Aniversário de Marabá",data:"04/04/2027",tipo:"Local",nivel:"medio",nichos:["Comércio local","Serviços"],status:"futuro"},
];
const CalendarioPage=()=>{
  const [sel,setSel]=useState(null);
  const nm={alto:"#FF6200",medio:"#F59E0B",critico:"#EF4444"};
  return (
    <div>
      <div style={{fontSize:13,color:"#64748B",marginBottom:20}}>Datas comemorativas e oportunidades para seus clientes</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:14}}>
        {MOCK_DATAS.filter(d=>{
  const [dia,mes,ano]=d.data.split("/").map(Number);
  const dataEvento=new Date(ano,mes-1,dia);
  const hoje=new Date();
  const doisMeses=new Date();
  doisMeses.setMonth(doisMeses.getMonth()+2);
  const importante=d.nivel==="critico"||d.nivel==="alto";
  return dataEvento>=hoje && dataEvento<=doisMeses;
}).map(d=>(
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
  const [checandoSessao,setChecandoSessao]=useState(true);
const [menuOpen,setMenuOpen]=useState(false);
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
  const [prospeccao,setProspeccao]=useState([]);
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
  supabase.auth.getSession().then(({data:{session}})=>{
    if(session){
      supabase.from("usuarios").select("perfil,nome").eq("id",session.user.id).single().then(({data:u})=>{
        setPerfil(u?.perfil||"operacional");
        setNomeUser(u?.nome||session.user.email||"");
        setLoggedIn(true);
        setChecandoSessao(false);
      });
    } else {
      setChecandoSessao(false);
    }
  });
},[]);
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
    const {data:pr} = await supabase.from("prospeccao").select("*");
    if(pr) setProspeccao(pr);
  } catch(err) {
    console.error("Erro ao carregar dados:", err);
    alert("Erro: " + JSON.stringify(err));
  } finally {
    setLoadingData(false);
  }
};
load();
  },[loggedIn]);

  if(checandoSessao) return <div style={{minHeight:"100vh",background:"#1F2F46",display:"flex",alignItems:"center",justifyContent:"center"}}><img src="https://i.postimg.cc/jdB530mK/mkt.png" alt="MarketForge" style={{height:60,objectFit:"contain",animation:"pulse 1.5s ease-in-out infinite"}} onError={e=>{e.target.style.display="none"}}/></div>;
  if(!loggedIn) return <LoginPage onLogin={(p,n)=>{setLoggedIn(true);setPerfil(p);setNomeUser(n);}}/>;

  const cobrPend = cobr.filter(c=>c.status==="pendente"||c.status==="atrasado").length;

  const pages = {
    hoje:<HojePage setPage={setPage} clients={clients} cobr={cobr} tasks={tasks} perfil={perfil} nomeUser={nomeUser}/>,
    dashboard:<DashboardPage clients={clients} cobr={cobr} despesas={despesas} tasks={tasks}/>,
    prospeccao:<ProspeccaoPage prospeccao={prospeccao} setProspeccao={setProspeccao} equipe={equipe} loading={loadingData}/>,
    clientes:<ClientesPage clients={clients} setClients={setClients} cobr={cobr} setCobr={setCobr} loading={loadingData}/>,
    financeiro:<FinanceiroPage clients={clients} cobr={cobr} despesas={despesas}/>,
    cobr:<CobrancasPage cobr={cobr} setCobr={setCobr} clients={clients} loading={loadingData}/>,
    despesas:<DespesasPage despesas={despesas} setDespesas={setDespesas} loading={loadingData}/>,
    tarefas:<TarefasPage tasks={tasks} setTasks={setTasks} clients={clients} equipe={equipe} loading={loadingData}/>,
    calendario:<CalendarioPage/>,
    agenda:<AgendaPage clients={clients} equipe={equipe}/>,
    equipe:<EquipePage equipe={equipe} setEquipe={setEquipe} tasks={tasks} loading={loadingData} perfil={perfil}/>,
    mensagens:<MensagensPage/>,
  };

  return (
    <div style={{fontFamily:"'Sora','Segoe UI',sans-serif",background:"#EEF3F8",minHeight:"100vh"}}>
      <Sidebar page={page} setPage={setPage} perfil={perfil} open={menuOpen} setOpen={setMenuOpen} onLogout={()=>{supabase.auth.signOut();setLoggedIn(false);setPerfil("operacional");setClients([]);setCobr([]);setTasks([]);setDespesas([]);setEquipe([]);setProspeccao([]);}} cobrPend={cobrPend}/>
      <Topbar page={page} nomeUser={nomeUser} perfil={perfil} onMenuClick={()=>setMenuOpen(true)}/>
      <main style={{marginLeft:typeof window!=="undefined"&&window.innerWidth<768?0:230,paddingTop:62}}>
        <div style={{padding:"28px 30px",minHeight:"calc(100vh - 62px)"}}>
          {pages[page]}
        </div>
      </main>
    </div>
  );
}

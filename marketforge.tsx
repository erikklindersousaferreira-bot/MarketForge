import { useState } from "react";

const MOCK_CLIENTS = [
  { id: 1, name: "Churrascaria Pantanal", nicho: "Alimentação", valor: 1800, vencimento: 10, status: "ativo", responsavel: "João Silva", whatsapp: "94991234567", logo: "🍖", cidade: "Marabá", plano: "Premium" },
  { id: 2, name: "Clínica Beleza & Saúde", nicho: "Saúde/Estética", valor: 2200, vencimento: 5, status: "ativo", responsavel: "Ana Costa", whatsapp: "94992345678", logo: "💆", cidade: "Marabá", plano: "Full" },
  { id: 3, name: "Auto Peças Motorista", nicho: "Automotivo", valor: 1200, vencimento: 15, status: "inadimplente", responsavel: "Pedro Lima", whatsapp: "94993456789", logo: "🔧", cidade: "Marabá", plano: "Básico" },
  { id: 4, name: "Moda Feminina Estilo", nicho: "Moda", valor: 1600, vencimento: 20, status: "ativo", responsavel: "Carla Souza", whatsapp: "94994567890", logo: "👗", cidade: "Marabá", plano: "Essencial" },
  { id: 5, name: "Academia FitBody", nicho: "Fitness", valor: 2800, vencimento: 1, status: "ativo", responsavel: "Marcos Ferro", whatsapp: "94995678901", logo: "💪", cidade: "Marabá", plano: "Full" },
  { id: 6, name: "Farmácia BemViver", nicho: "Farmácia", valor: 1400, vencimento: 25, status: "pausado", responsavel: "Sandra Reis", whatsapp: "94996789012", logo: "💊", cidade: "Marabá", plano: "Básico" },
];

const MOCK_COBR = [
  { id: 1, cliente: "Churrascaria Pantanal", valor: 1800, vencimento: "10/05/2025", status: "pago", pagamento: "Pix" },
  { id: 2, cliente: "Clínica Beleza & Saúde", valor: 2200, vencimento: "05/05/2025", status: "pago", pagamento: "Transferência" },
  { id: 3, cliente: "Auto Peças Motorista", valor: 1200, vencimento: "15/04/2025", status: "atrasado", pagamento: "" },
  { id: 4, cliente: "Moda Feminina Estilo", valor: 1600, vencimento: "20/05/2025", status: "pendente", pagamento: "" },
  { id: 5, cliente: "Academia FitBody", valor: 2800, vencimento: "01/05/2025", status: "pago", pagamento: "Pix" },
  { id: 6, cliente: "Farmácia BemViver", valor: 1400, vencimento: "25/05/2025", status: "pendente", pagamento: "" },
  { id: 7, cliente: "Churrascaria Pantanal", valor: 1800, vencimento: "10/06/2025", status: "pendente", pagamento: "" },
];

const MOCK_TASKS = [
  { id: 1, titulo: "Arte Dia dos Namorados", cliente: "Moda Feminina Estilo", responsavel: "Juliana", prioridade: "alta", status: "em_producao", tipo: "Design", entrega: "08/06/2025" },
  { id: 2, titulo: "Vídeo institucional", cliente: "Clínica Beleza & Saúde", responsavel: "Carlos", prioridade: "media", status: "aguardando", tipo: "Vídeo", entrega: "12/06/2025" },
  { id: 3, titulo: "Subir campanha Meta Ads", cliente: "Academia FitBody", responsavel: "Rafael", prioridade: "urgente", status: "a_fazer", tipo: "Tráfego pago", entrega: "05/06/2025" },
  { id: 4, titulo: "Relatório mensal maio", cliente: "Churrascaria Pantanal", responsavel: "Juliana", prioridade: "media", status: "finalizado", tipo: "Relatório", entrega: "01/06/2025" },
  { id: 5, titulo: "Posts semana 2", cliente: "Farmácia BemViver", responsavel: "Carlos", prioridade: "baixa", status: "a_fazer", tipo: "Design", entrega: "10/06/2025" },
  { id: 6, titulo: "Aprovação do feed", cliente: "Churrascaria Pantanal", responsavel: "Juliana", prioridade: "alta", status: "atrasado", tipo: "Aprovação", entrega: "01/05/2025" },
];

const MOCK_DESPESAS = [
  { id: 1, nome: "Adobe Creative Cloud", categoria: "Ferramentas", valor: 349, vencimento: "15/05/2025", status: "pago" },
  { id: 2, nome: "Meta Business Suite", categoria: "Assinaturas", valor: 99, vencimento: "20/05/2025", status: "pendente" },
  { id: 3, nome: "Salário - Juliana (Design)", categoria: "Colaboradores", valor: 2800, vencimento: "05/06/2025", status: "pendente" },
  { id: 4, nome: "Salário - Carlos (Vídeo)", categoria: "Colaboradores", valor: 2400, vencimento: "05/06/2025", status: "pendente" },
  { id: 5, nome: "Internet fibra", categoria: "Internet", valor: 199, vencimento: "10/05/2025", status: "pago" },
  { id: 6, nome: "Conta de Luz escritório", categoria: "Outros", valor: 320, vencimento: "12/05/2025", status: "pago" },
];

const MOCK_EQUIPE = [
  { id: 1, nome: "Juliana Ferreira", funcao: "Designer", tipo: "fixo", status: "ativo", whatsapp: "94997001122" },
  { id: 2, nome: "Carlos Mendes", funcao: "Editor de Vídeo", tipo: "fixo", status: "ativo", whatsapp: "94997002233" },
  { id: 3, nome: "Felipe Costa", funcao: "Gestor de Tráfego", tipo: "freelancer", status: "ativo", whatsapp: "94997003344" },
];

const MOCK_DATAS = [
  { id: 1, nome: "Dia dos Namorados", data: "12/06/2025", tipo: "Comercial", nivel: "alto", nichos: ["Restaurantes","Floricultura","Moda","Presentes"], status: "urgente" },
  { id: 2, nome: "Festa Junina / São João", data: "24/06/2025", tipo: "Sazonal", nivel: "medio", nichos: ["Alimentação","Vestuário","Eventos"], status: "planejar" },
  { id: 3, nome: "Dia do Médico", data: "18/10/2025", tipo: "Nicho", nivel: "alto", nichos: ["Saúde","Clínicas","Hospitais"], status: "futuro" },
  { id: 4, nome: "Black Friday", data: "28/11/2025", tipo: "Comercial", nivel: "critico", nichos: ["Todos os nichos"], status: "futuro" },
  { id: 5, nome: "Aniversário de Marabá", data: "04/04/2026", tipo: "Local", nivel: "medio", nichos: ["Comércio local","Serviços"], status: "futuro" },
];

const MOCK_TRAFEGO = [
  { id: 1, cliente: "Academia FitBody", plataforma: "Meta Ads", recebido: 1500, gasto: 1430, saldo: 70, status: "baixo" },
  { id: 2, cliente: "Clínica Beleza & Saúde", plataforma: "Meta Ads", recebido: 2000, gasto: 1200, saldo: 800, status: "ok" },
  { id: 3, cliente: "Churrascaria Pantanal", plataforma: "Google Ads", recebido: 1000, gasto: 1000, saldo: 0, status: "zerado" },
  { id: 4, cliente: "Moda Feminina Estilo", plataforma: "Meta Ads", recebido: 800, gasto: 350, saldo: 450, status: "ok" },
];

// SVG Icons
const IC = {
  sun: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  chart: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>,
  users: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  money: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  list: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  check: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
  cal: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  user: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  signal: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>,
  msg: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  logout: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  bell: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  alert: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  eye: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  eyeOff: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
  lock: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  clock: <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  trending: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
};

// Components
const StatusBadge = ({ status }) => {
  const map = { ativo:["#DCFCE7","#166534","Ativo"], pausado:["#FEF9C3","#854D0E","Pausado"], cancelado:["#FEE2E2","#991B1B","Cancelado"], inadimplente:["#FEE2E2","#991B1B","Inadimplente"], pago:["#DCFCE7","#166534","Pago"], pendente:["#FEF9C3","#92400E","Pendente"], atrasado:["#FEE2E2","#991B1B","Atrasado"], a_fazer:["#EFF6FF","#1D4ED8","A Fazer"], em_producao:["#FFF7ED","#C2410C","Em Produção"], aguardando:["#F5F3FF","#7C3AED","Aguardando"], finalizado:["#DCFCE7","#166534","Finalizado"], urgente:["#FEE2E2","#991B1B","Urgente"], ok:["#DCFCE7","#166534","OK"], baixo:["#FEF9C3","#92400E","Baixo"], zerado:["#FEE2E2","#991B1B","Zerado"], planejar:["#EFF6FF","#1D4ED8","Planejar"], futuro:["#F3F4F6","#6B7280","Futuro"] };
  const [bg,color,label] = map[status]||["#F3F4F6","#6B7280",status];
  return <span style={{background:bg,color,fontSize:11,fontWeight:700,padding:"2px 10px",borderRadius:20}}>{label}</span>;
};

const PBadge = ({ p }) => {
  const m = {baixa:["#EFF6FF","#1D4ED8"],media:["#F5F3FF","#7C3AED"],alta:["#FFF7ED","#C2410C"],urgente:["#FEE2E2","#991B1B"]};
  const [bg,c]=m[p]||["#F3F4F6","#6B7280"];
  return <span style={{background:bg,color:c,fontSize:11,fontWeight:700,padding:"2px 9px",borderRadius:20}}>{p.charAt(0).toUpperCase()+p.slice(1)}</span>;
};

const Card = ({children,style={},onClick}) => <div onClick={onClick} style={{background:"#fff",borderRadius:14,boxShadow:"0 1px 4px rgba(0,0,0,0.07),0 0 0 1px #DDE5EF",padding:22,...style,cursor:onClick?"pointer":undefined}}>{children}</div>;

const MC = ({label,value,sub,icon,bg="#FFF7F3"}) => (
  <Card style={{display:"flex",alignItems:"flex-start",gap:14,minWidth:160}}>
    <div style={{background:bg,borderRadius:12,width:46,height:46,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,color:"#FF6200"}}>{icon}</div>
    <div>
      <div style={{fontSize:11,color:"#64748B",fontWeight:600,letterSpacing:0.4,textTransform:"uppercase"}}>{label}</div>
      <div style={{fontSize:22,fontWeight:800,color:"#111827",lineHeight:1.2,marginTop:2}}>{value}</div>
      {sub&&<div style={{fontSize:12,color:"#64748B",marginTop:2}}>{sub}</div>}
    </div>
  </Card>
);

const Btn = ({children,onClick,variant="primary",size="md",style={},disabled}) => {
  const sz={sm:{padding:"6px 14px",fontSize:12},md:{padding:"9px 18px",fontSize:13},lg:{padding:"12px 26px",fontSize:15}};
  const vr={primary:{background:"#FF6200",color:"#fff"},secondary:{background:"#1F2F46",color:"#fff"},ghost:{background:"transparent",color:"#64748B",boxShadow:"0 0 0 1px #DDE5EF"},danger:{background:"#EF4444",color:"#fff"},success:{background:"#10B981",color:"#fff"}};
  return <button onClick={onClick} disabled={disabled} style={{borderRadius:8,fontWeight:700,cursor:disabled?"not-allowed":"pointer",border:"none",letterSpacing:0.2,fontFamily:"inherit",...sz[size],...vr[variant],opacity:disabled?0.5:1,...style}}>{children}</button>;
};

const FInput = ({label,value,onChange,type="text",placeholder="",icon,extra}) => (
  <div style={{marginBottom:16}}>
    {label&&<label style={{display:"block",fontSize:12,fontWeight:700,color:"#374151",marginBottom:6}}>{label}</label>}
    <div style={{position:"relative"}}>
      {icon&&<div style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"#94A3B8"}}>{icon}</div>}
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        style={{width:"100%",padding:icon?"9px 40px 9px 38px":"9px 13px",borderRadius:8,border:"1.5px solid #DDE5EF",fontSize:13,color:"#111827",outline:"none",fontFamily:"inherit",boxSizing:"border-box",background:"#FAFBFD"}} />
      {extra&&<div style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)"}}>{extra}</div>}
    </div>
  </div>
);

const Sel = ({label,value,onChange,options}) => (
  <div style={{marginBottom:16}}>
    {label&&<label style={{display:"block",fontSize:12,fontWeight:700,color:"#374151",marginBottom:6}}>{label}</label>}
    <select value={value} onChange={e=>onChange(e.target.value)} style={{width:"100%",padding:"9px 13px",borderRadius:8,border:"1.5px solid #DDE5EF",fontSize:13,color:"#111827",outline:"none",fontFamily:"inherit",boxSizing:"border-box",background:"#FAFBFD"}}>
      {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

const Modal = ({title,onClose,children}) => (
  <div style={{position:"fixed",inset:0,background:"rgba(17,24,39,0.45)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
    <div style={{background:"#fff",borderRadius:16,width:"100%",maxWidth:520,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,0.2)"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"20px 24px",borderBottom:"1px solid #EEF3F8"}}>
        <div style={{fontSize:17,fontWeight:800,color:"#111827"}}>{title}</div>
        <button onClick={onClose} style={{background:"none",border:"none",fontSize:22,cursor:"pointer",color:"#64748B"}}>×</button>
      </div>
      <div style={{padding:24}}>{children}</div>
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

// LOGIN
const LoginPage = ({onLogin}) => {
  const [u,setU]=useState("");
  const [s,setS]=useState("");
  const [show,setShow]=useState(false);
  const [err,setErr]=useState("");
  const [loading,setLoading]=useState(false);

  const handle = () => {
    if(!u||!s){setErr("Preencha todos os campos.");return;}
    setLoading(true);setErr("");
    setTimeout(()=>{
      if(u==="erikklinder"&&s==="432008erik"){onLogin();}
      else{setErr("Usuário ou senha incorretos. Tente novamente.");setLoading(false);}
    },900);
  };

  return (
    <div style={{minHeight:"100vh",background:"#1F2F46",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"'Sora','Segoe UI',sans-serif"}}>
      <div style={{position:"fixed",inset:0,backgroundImage:"radial-gradient(circle at 20% 50%,rgba(255,98,0,0.08) 0%,transparent 50%)",pointerEvents:"none"}}/>
      <div style={{background:"#fff",borderRadius:20,boxShadow:"0 24px 80px rgba(0,0,0,0.35)",padding:"48px 44px",width:"100%",maxWidth:420,textAlign:"center",position:"relative",zIndex:1}}>
        <div style={{marginBottom:32}}>
          <img src="https://i.postimg.cc/02xYt6Qp/logo-vertical-nomepreta.png" alt="MarketForge" style={{height:64,objectFit:"contain",marginBottom:18}} onError={e=>{e.target.style.display='none'}}/>
          <div style={{fontSize:17,fontWeight:700,color:"#111827",marginBottom:6}}>Acesso ao Painel</div>
          <div style={{fontSize:13,color:"#64748B"}}>Gestão financeira, clientes e produção da agência</div>
        </div>

        <div style={{textAlign:"left"}}>
          <FInput label="Usuário" value={u} onChange={setU} placeholder="Seu usuário" icon={IC.user} />
          <FInput label="Senha" value={s} onChange={v=>setS(v)} type={show?"text":"password"} placeholder="Sua senha" icon={IC.lock}
            extra={<button onClick={()=>setShow(!show)} style={{background:"none",border:"none",cursor:"pointer",color:"#94A3B8",display:"flex",alignItems:"center"}}>{show?IC.eyeOff:IC.eye}</button>} />
        </div>

        {err&&<div style={{background:"#FEF2F2",border:"1px solid #FECACA",color:"#991B1B",borderRadius:8,padding:"10px 14px",fontSize:13,marginBottom:16,textAlign:"left",display:"flex",alignItems:"center",gap:8}}><span style={{color:"#EF4444",flexShrink:0}}>{IC.alert}</span>{err}</div>}

        <Btn onClick={handle} size="lg" style={{width:"100%",background:"linear-gradient(135deg,#FF6200,#FF8C00)",fontSize:14}} disabled={loading}>
          {loading?"Entrando...":"Entrar no sistema"}
        </Btn>

        <div style={{marginTop:16,fontSize:12}}><span style={{cursor:"pointer",color:"#FF6200",fontWeight:600}}>Esqueci minha senha</span></div>
        <div style={{marginTop:28,paddingTop:20,borderTop:"1px solid #EEF3F8",fontSize:11,color:"#94A3B8"}}>© 2025 MarketForge — @marketforge_</div>
      </div>
    </div>
  );
};

// SIDEBAR
const NAV=[
  {id:"hoje",label:"Hoje",icon:IC.sun},
  {id:"dashboard",label:"Dashboard",icon:IC.chart},
  {id:"clientes",label:"Clientes",icon:IC.users},
  {id:"financeiro",label:"Financeiro",icon:IC.money},
  {id:"cobr",label:"Cobranças",icon:IC.list},
  {id:"despesas",label:"Despesas",icon:IC.money},
  {id:"tarefas",label:"Tarefas",icon:IC.check},
  {id:"calendario",label:"Calendário",icon:IC.cal},
  {id:"equipe",label:"Equipe",icon:IC.user},
  {id:"trafego",label:"Tráfego",icon:IC.signal},
  {id:"mensagens",label:"Modelos",icon:IC.msg},
];

const Sidebar=({page,setPage,onLogout})=>(
  <div style={{width:230,background:"#1F2F46",minHeight:"100vh",display:"flex",flexDirection:"column",position:"fixed",top:0,left:0,zIndex:100}}>
    <div style={{padding:"20px 18px 16px",borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
      <img src="https://i.postimg.cc/jdB530mK/mkt.png" alt="MarketForge" style={{height:38,objectFit:"contain"}} onError={e=>{e.target.style.display='none'}}/>
    </div>
    <nav style={{flex:1,padding:"14px 10px",overflowY:"auto"}}>
      {NAV.map(n=>(
        <div key={n.id} onClick={()=>setPage(n.id)} style={{display:"flex",alignItems:"center",gap:11,padding:"9px 12px",borderRadius:10,marginBottom:2,cursor:"pointer",background:page===n.id?"rgba(255,98,0,0.18)":"transparent",color:page===n.id?"#FF6200":"rgba(255,255,255,0.65)",fontWeight:page===n.id?700:500,fontSize:13}}>
          <span style={{opacity:page===n.id?1:0.7}}>{n.icon}</span>{n.label}
          {n.id==="cobr"&&<span style={{marginLeft:"auto",background:"#EF4444",color:"#fff",fontSize:10,fontWeight:700,borderRadius:10,padding:"1px 7px"}}>3</span>}
        </div>
      ))}
    </nav>
    <div style={{padding:"14px 10px",borderTop:"1px solid rgba(255,255,255,0.08)"}}>
      <div onClick={onLogout} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:10,cursor:"pointer",color:"rgba(255,255,255,0.5)",fontSize:13}}>
        {IC.logout} Sair
      </div>
    </div>
  </div>
);

const LABELS={hoje:"Hoje",dashboard:"Dashboard",clientes:"Clientes",financeiro:"Financeiro",cobr:"Cobranças",despesas:"Despesas",tarefas:"Tarefas",calendario:"Calendário Estratégico",equipe:"Equipe",trafego:"Saldo de Tráfego",mensagens:"Modelos de Mensagem"};

const Topbar=({page})=>(
  <div style={{position:"fixed",top:0,left:230,right:0,height:62,background:"#fff",borderBottom:"1px solid #DDE5EF",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 28px",zIndex:99}}>
    <div style={{fontSize:18,fontWeight:800,color:"#111827"}}>{LABELS[page]||page}</div>
    <div style={{display:"flex",alignItems:"center",gap:16}}>
      <div style={{position:"relative",cursor:"pointer",color:"#64748B"}}>{IC.bell}<span style={{position:"absolute",top:-4,right:-4,background:"#EF4444",color:"#fff",fontSize:9,fontWeight:800,borderRadius:99,padding:"1px 5px"}}>5</span></div>
      <div style={{display:"flex",alignItems:"center",gap:9}}>
        <div style={{width:34,height:34,background:"linear-gradient(135deg,#FF6200,#FF8C00)",borderRadius:99,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:14,fontWeight:700}}>E</div>
        <div><div style={{fontSize:13,fontWeight:700,color:"#111827"}}>erikklinder</div><div style={{fontSize:11,color:"#64748B"}}>Admin</div></div>
      </div>
    </div>
  </div>
);

// HOJE
const HojePage=({setPage})=>{
  const atrasadas=MOCK_TASKS.filter(t=>t.status==="atrasado");
  const cobHoje=MOCK_COBR.filter(c=>c.status==="pendente"||c.status==="atrasado").slice(0,4);
  return (
    <div>
      <div style={{marginBottom:22,display:"flex",alignItems:"center",gap:12}}>
        <div style={{width:48,height:48,background:"linear-gradient(135deg,#FF6200,#FF8C00)",borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff"}}>{IC.sun}</div>
        <div>
          <div style={{fontSize:22,fontWeight:800,color:"#111827"}}>Bom dia, erikklinder!</div>
          <div style={{fontSize:13,color:"#64748B"}}>Quinta-feira, 5 de junho de 2025 · Aqui está o que precisa de atenção hoje</div>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:14,marginBottom:28}}>
        <MC label="Cobranças pendentes" value="3" sub="R$ 4.600 em aberto" icon={IC.money} bg="#FFF7F3"/>
        <MC label="Tarefas hoje" value="4" sub="2 urgentes" icon={IC.check} bg="#F5F3FF"/>
        <MC label="Tarefas atrasadas" value={atrasadas.length} sub="Atenção necessária" icon={IC.alert} bg="#FEF2F2"/>
        <MC label="Inadimplentes" value="1" sub="Auto Peças" icon={IC.users} bg="#FEF2F2"/>
        <MC label="Saldo baixo" value="2" sub="Academia, Churr." icon={IC.signal} bg="#FFFBEB"/>
        <MC label="Datas próximas" value="1" sub="Dia dos Namorados" icon={IC.cal} bg="#ECFDF5"/>
      </div>
      <Card style={{marginBottom:22,borderLeft:"4px solid #EF4444"}}>
        <div style={{fontSize:14,fontWeight:800,color:"#111827",marginBottom:12,display:"flex",alignItems:"center",gap:8}}><span style={{color:"#EF4444"}}>{IC.alert}</span>Alertas importantes</div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {[
            {cor:"#EF4444",msg:"Auto Peças Motorista está inadimplente há 20 dias"},
            {cor:"#F59E0B",msg:"Saldo de tráfego da Churrascaria Pantanal zerou — campanha pausada"},
            {cor:"#F59E0B",msg:"Academia FitBody com apenas R$ 70 de saldo em Meta Ads"},
            {cor:"#EF4444",msg:"Contrato da Farmácia BemViver vence em 15 dias"},
            {cor:"#3B82F6",msg:"Dia dos Namorados (12/06) — crie campanhas para seus clientes!"},
          ].map((a,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:10,background:"#F8FAFC",borderRadius:8,padding:"10px 14px",borderLeft:`3px solid ${a.cor}`}}>
              <span style={{flex:1,fontSize:13,color:"#374151"}}>{a.msg}</span>
            </div>
          ))}
        </div>
      </Card>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
        <Card>
          <ST action={<Btn size="sm" variant="ghost" onClick={()=>setPage("cobr")}>Ver todas</Btn>}>Cobranças pendentes</ST>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {cobHoje.map(c=>(
              <div key={c.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 12px",background:"#F8FAFC",borderRadius:10}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:700,color:"#111827"}}>{c.cliente}</div>
                  <div style={{fontSize:12,color:"#64748B",display:"flex",alignItems:"center",gap:4}}>{IC.clock} Venc: {c.vencimento}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:14,fontWeight:800,color:"#111827"}}>R$ {c.valor.toLocaleString()}</div>
                  <StatusBadge status={c.status}/>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <ST action={<Btn size="sm" variant="ghost" onClick={()=>setPage("tarefas")}>Ver todas</Btn>}>Tarefas atrasadas</ST>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {atrasadas.map(t=>(
              <div key={t.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 12px",background:"#FEF2F2",borderRadius:10,border:"1px solid #FECACA"}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:700,color:"#111827"}}>{t.titulo}</div>
                  <div style={{fontSize:12,color:"#64748B"}}>{t.cliente} · {t.responsavel}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:11,color:"#EF4444",fontWeight:700}}>Atrasada</div>
                  <div style={{fontSize:11,color:"#64748B"}}>{t.entrega}</div>
                </div>
              </div>
            ))}
            {atrasadas.length===0&&<div style={{color:"#10B981",fontSize:13,padding:"16px 0",textAlign:"center"}}>Nenhuma tarefa atrasada!</div>}
          </div>
        </Card>
      </div>
    </div>
  );
};

// DASHBOARD
const DashboardPage=()=>{
  const recR=MOCK_COBR.filter(c=>c.status==="pago").reduce((a,c)=>a+c.valor,0);
  const recP=MOCK_COBR.filter(c=>c.status==="pendente").reduce((a,c)=>a+c.valor,0);
  const recA=MOCK_COBR.filter(c=>c.status==="atrasado").reduce((a,c)=>a+c.valor,0);
  const despT=MOCK_DESPESAS.reduce((a,d)=>a+d.valor,0);
  const lucro=recR-despT;
  const atv=MOCK_CLIENTS.filter(c=>c.status==="ativo").length;
  const bars=[{mes:"Jan",rec:9800,desp:6100},{mes:"Fev",rec:10200,desp:6300},{mes:"Mar",rec:9400,desp:5900},{mes:"Abr",rec:11000,desp:6500},{mes:"Mai",rec:recR,desp:despT}];
  const mx=Math.max(...bars.map(d=>Math.max(d.rec,d.desp)));
  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))",gap:14,marginBottom:24}}>
        <MC label="Receita recebida" value={`R$ ${(recR/1000).toFixed(1)}k`} icon={IC.check} bg="#ECFDF5"/>
        <MC label="Em aberto" value={`R$ ${(recP/1000).toFixed(1)}k`} icon={IC.clock} bg="#FFFBEB"/>
        <MC label="Atrasado" value={`R$ ${recA}`} icon={IC.alert} bg="#FEF2F2"/>
        <MC label="Despesas" value={`R$ ${(despT/1000).toFixed(1)}k`} icon={IC.money} bg="#F8FAFC"/>
        <MC label="Lucro estimado" value={`R$ ${(lucro/1000).toFixed(1)}k`} icon={IC.trending} bg="#ECFDF5"/>
        <MC label="Clientes ativos" value={atv} icon={IC.users} bg="#F5F3FF"/>
        <MC label="Ticket médio" value={`R$ ${Math.round(recR/Math.max(atv,1))}`} icon={IC.chart} bg="#EEF3F8"/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:18}}>
        <Card>
          <ST>Receita × Despesas — últimos 5 meses</ST>
          <div style={{display:"flex",alignItems:"flex-end",gap:10,height:160,padding:"0 8px"}}>
            {bars.map((d,i)=>(
              <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                <div style={{display:"flex",gap:4,width:"100%",alignItems:"flex-end",justifyContent:"center"}}>
                  <div style={{flex:1,background:"#FF6200",borderRadius:"4px 4px 0 0",height:Math.round((d.rec/mx)*130)}}/>
                  <div style={{flex:1,background:"#DDE5EF",borderRadius:"4px 4px 0 0",height:Math.round((d.desp/mx)*130)}}/>
                </div>
                <div style={{fontSize:11,color:"#64748B",fontWeight:600}}>{d.mes}</div>
              </div>
            ))}
          </div>
          <div style={{display:"flex",gap:18,marginTop:10}}>
            <div style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:"#64748B"}}><div style={{width:12,height:12,background:"#FF6200",borderRadius:3}}/> Receita</div>
            <div style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:"#64748B"}}><div style={{width:12,height:12,background:"#DDE5EF",borderRadius:3}}/> Despesas</div>
          </div>
        </Card>
        <Card>
          <ST>Status cobranças</ST>
          {[{label:"Pagas",count:MOCK_COBR.filter(c=>c.status==="pago").length,color:"#10B981"},{label:"Pendentes",count:MOCK_COBR.filter(c=>c.status==="pendente").length,color:"#F59E0B"},{label:"Atrasadas",count:MOCK_COBR.filter(c=>c.status==="atrasado").length,color:"#EF4444"}].map(s=>(
            <div key={s.label} style={{marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:13,color:"#374151",fontWeight:600}}>{s.label}</span><span style={{fontSize:13,fontWeight:800,color:s.color}}>{s.count}</span></div>
              <div style={{background:"#EEF3F8",borderRadius:99,height:7,overflow:"hidden"}}><div style={{background:s.color,height:"100%",width:`${(s.count/MOCK_COBR.length)*100}%`,borderRadius:99}}/></div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
};

// CLIENTES
const ClientesPage=()=>{
  const [search,setSearch]=useState("");
  const [filter,setFilter]=useState("todos");
  const [modal,setModal]=useState(false);
  const [sel,setSel]=useState(null);
  const fl=MOCK_CLIENTS.filter(c=>(c.name.toLowerCase().includes(search.toLowerCase())||c.nicho.toLowerCase().includes(search.toLowerCase()))&&(filter==="todos"||c.status===filter));
  return (
    <div>
      <div style={{display:"flex",gap:12,marginBottom:20,alignItems:"center",flexWrap:"wrap"}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar cliente..." style={{flex:1,minWidth:200,padding:"9px 14px",borderRadius:9,border:"1.5px solid #DDE5EF",fontSize:13,color:"#111827",outline:"none",fontFamily:"inherit"}}/>
        {["todos","ativo","pausado","inadimplente"].map(f=><Btn key={f} size="sm" variant={filter===f?"secondary":"ghost"} onClick={()=>setFilter(f)}>{f.charAt(0).toUpperCase()+f.slice(1)}</Btn>)}
        <Btn onClick={()=>setModal(true)}>+ Novo Cliente</Btn>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:16}}>
        {fl.map(c=>(
          <Card key={c.id} onClick={()=>setSel(c)}>
            <div style={{display:"flex",alignItems:"flex-start",gap:14}}>
              <div style={{width:50,height:50,background:"#EEF3F8",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>{c.logo}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
                  <div style={{fontSize:15,fontWeight:800,color:"#111827",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.name}</div>
                  <StatusBadge status={c.status}/>
                </div>
                <div style={{fontSize:12,color:"#64748B",marginTop:3}}>{c.nicho} · {c.cidade}</div>
                <div style={{fontSize:12,color:"#64748B",marginTop:2}}>{c.responsavel}</div>
              </div>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:14,paddingTop:12,borderTop:"1px solid #EEF3F8"}}>
              <div><div style={{fontSize:11,color:"#64748B",fontWeight:600}}>MENSALIDADE</div><div style={{fontSize:18,fontWeight:800,color:"#111827"}}>R$ {c.valor.toLocaleString()}</div></div>
              <div style={{textAlign:"right"}}><div style={{fontSize:11,color:"#64748B",fontWeight:600}}>VENCIMENTO</div><div style={{fontSize:14,fontWeight:700,color:"#1F2F46"}}>Dia {c.vencimento}</div></div>
              <div style={{textAlign:"right"}}><div style={{fontSize:11,color:"#64748B",fontWeight:600}}>PLANO</div><div style={{fontSize:13,fontWeight:700,color:"#FF6200"}}>{c.plano}</div></div>
            </div>
          </Card>
        ))}
      </div>
      {sel&&<Modal title={sel.name} onClose={()=>setSel(null)}>
        <div style={{display:"flex",gap:16,marginBottom:20,alignItems:"center"}}>
          <div style={{width:64,height:64,background:"#EEF3F8",borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",fontSize:32}}>{sel.logo}</div>
          <div><div style={{fontSize:20,fontWeight:800,color:"#111827"}}>{sel.name}</div><div style={{fontSize:13,color:"#64748B"}}>{sel.nicho} · {sel.cidade}</div><div style={{marginTop:4}}><StatusBadge status={sel.status}/></div></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
          {[{label:"Responsável",value:sel.responsavel},{label:"WhatsApp",value:sel.whatsapp},{label:"Mensalidade",value:`R$ ${sel.valor.toLocaleString()}`},{label:"Vencimento",value:`Dia ${sel.vencimento}`},{label:"Plano",value:sel.plano}].map(f=>(
            <div key={f.label} style={{background:"#F8FAFC",borderRadius:8,padding:"10px 14px"}}>
              <div style={{fontSize:10,color:"#64748B",fontWeight:700,textTransform:"uppercase",letterSpacing:0.5}}>{f.label}</div>
              <div style={{fontSize:14,fontWeight:700,color:"#111827",marginTop:2}}>{f.value}</div>
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:10}}><Btn variant="primary" style={{flex:1}}>Editar</Btn><Btn variant="secondary" style={{flex:1}}>Cobranças</Btn><Btn variant="ghost" style={{flex:1}}>Tarefas</Btn></div>
      </Modal>}
      {modal&&<Modal title="Novo Cliente" onClose={()=>setModal(false)}>
        <FInput label="Nome da empresa" value="" onChange={()=>{}} placeholder="Churrascaria Pantanal"/>
        <FInput label="Responsável" value="" onChange={()=>{}} placeholder="João Silva"/>
        <FInput label="WhatsApp" value="" onChange={()=>{}} placeholder="94991234567"/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          <FInput label="Valor mensal (R$)" value="" onChange={()=>{}} placeholder="1800"/>
          <FInput label="Dia de vencimento" value="" onChange={()=>{}} placeholder="10"/>
        </div>
        <Sel label="Status" value="ativo" onChange={()=>{}} options={[{value:"ativo",label:"Ativo"},{value:"pausado",label:"Pausado"}]}/>
        <div style={{display:"flex",gap:10}}><Btn style={{flex:1}}>Salvar Cliente</Btn><Btn variant="ghost" onClick={()=>setModal(false)} style={{flex:1}}>Cancelar</Btn></div>
      </Modal>}
    </div>
  );
};

// FINANCEIRO
const FinanceiroPage=()=>{
  const recR=MOCK_COBR.filter(c=>c.status==="pago").reduce((a,c)=>a+c.valor,0);
  const recP=MOCK_COBR.filter(c=>c.status==="pendente").reduce((a,c)=>a+c.valor,0);
  const recA=MOCK_COBR.filter(c=>c.status==="atrasado").reduce((a,c)=>a+c.valor,0);
  const despT=MOCK_DESPESAS.reduce((a,d)=>a+d.valor,0);
  const despP=MOCK_DESPESAS.filter(d=>d.status==="pago").reduce((a,d)=>a+d.valor,0);
  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:14,marginBottom:24}}>
        <MC label="Receita recebida" value={`R$ ${recR.toLocaleString()}`} icon={IC.check} bg="#ECFDF5"/>
        <MC label="Em aberto" value={`R$ ${recP.toLocaleString()}`} icon={IC.clock} bg="#FFFBEB"/>
        <MC label="Atrasado" value={`R$ ${recA.toLocaleString()}`} icon={IC.alert} bg="#FEF2F2"/>
        <MC label="Despesas do mês" value={`R$ ${despT.toLocaleString()}`} icon={IC.money} bg="#F8FAFC"/>
        <MC label="Lucro líquido" value={`R$ ${(recR-despP).toLocaleString()}`} icon={IC.trending} bg="#ECFDF5"/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
        <Card>
          <ST>Receita por cliente</ST>
          {MOCK_CLIENTS.filter(c=>c.status==="ativo").map(c=>(
            <div key={c.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:"1px solid #EEF3F8"}}>
              <span style={{fontSize:18}}>{c.logo}</span>
              <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:"#111827"}}>{c.name}</div><div style={{fontSize:11,color:"#64748B"}}>Dia {c.vencimento}</div></div>
              <div style={{textAlign:"right"}}><div style={{fontSize:14,fontWeight:800,color:"#111827"}}>R$ {c.valor.toLocaleString()}</div><StatusBadge status="ativo"/></div>
            </div>
          ))}
        </Card>
        <Card>
          <ST>Despesas por categoria</ST>
          {Object.entries(MOCK_DESPESAS.reduce((acc,d)=>{acc[d.categoria]=(acc[d.categoria]||0)+d.valor;return acc;},{})).map(([cat,val])=>(
            <div key={cat} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid #EEF3F8",fontSize:13}}>
              <span style={{color:"#374151",fontWeight:600}}>{cat}</span><span style={{fontWeight:800,color:"#111827"}}>R$ {val.toLocaleString()}</span>
            </div>
          ))}
          <div style={{marginTop:14,display:"flex",justifyContent:"space-between",fontWeight:800,color:"#111827",fontSize:15}}><span>Total</span><span style={{color:"#EF4444"}}>R$ {despT.toLocaleString()}</span></div>
        </Card>
      </div>
    </div>
  );
};

// COBRANÇAS
const CobrancasPage=()=>{
  const [filter,setFilter]=useState("todos");
  const [modal,setModal]=useState(false);
  const [cobr,setCobr]=useState(MOCK_COBR);
  const fl=cobr.filter(c=>filter==="todos"||c.status===filter);
  const mp=id=>setCobr(prev=>prev.map(c=>c.id===id?{...c,status:"pago",pagamento:"Pix"}:c));
  return (
    <div>
      <div style={{display:"flex",gap:12,marginBottom:20,alignItems:"center",flexWrap:"wrap"}}>
        {["todos","pendente","pago","atrasado"].map(f=><Btn key={f} size="sm" variant={filter===f?"secondary":"ghost"} onClick={()=>setFilter(f)}>{f.charAt(0).toUpperCase()+f.slice(1)} <span style={{marginLeft:6,background:filter===f?"rgba(255,255,255,0.25)":"#EEF3F8",borderRadius:99,padding:"0 6px",fontSize:11,fontWeight:800,color:filter===f?"#fff":"#64748B"}}>{cobr.filter(c=>f==="todos"||c.status===f).length}</span></Btn>)}
        <div style={{flex:1}}/><Btn onClick={()=>setModal(true)}>+ Nova Cobrança</Btn>
      </div>
      <Card style={{padding:0}}>
        <Tbl cols={["Cliente","Valor","Vencimento","Forma","Status","Ações"]}
          rows={fl.map(c=>[
            <span style={{fontWeight:700,color:"#111827"}}>{c.cliente}</span>,
            <span style={{fontWeight:800}}>R$ {c.valor.toLocaleString()}</span>,
            c.vencimento,
            c.pagamento||<span style={{color:"#94A3B8"}}>—</span>,
            <StatusBadge status={c.status}/>,
            <div style={{display:"flex",gap:6}}>{c.status!=="pago"&&<Btn size="sm" variant="success" onClick={()=>mp(c.id)}>Pago</Btn>}<Btn size="sm" variant="ghost">Cobrar</Btn></div>
          ])}/>
      </Card>
      <Card style={{marginTop:18,background:"linear-gradient(135deg,#1F2F46,#2D4A6A)",color:"#fff"}}>
        <div style={{fontSize:15,fontWeight:800,marginBottom:12}}>Régua de Cobrança Automática</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:12}}>
          {[{dias:"3 dias antes",acao:"Lembrete antecipado",cor:"#10B981"},{dias:"No dia",acao:"Cobrança no vencimento",cor:"#F59E0B"},{dias:"2 dias após",acao:"Primeiro aviso de atraso",cor:"#FF6200"},{dias:"5 dias após",acao:"Aviso de possível pausa",cor:"#EF4444"}].map(r=>(
            <div key={r.dias} style={{background:"rgba(255,255,255,0.08)",borderRadius:10,padding:"12px 14px",borderLeft:`3px solid ${r.cor}`}}>
              <div style={{fontSize:12,fontWeight:800,color:r.cor}}>{r.dias}</div>
              <div style={{fontSize:13,color:"rgba(255,255,255,0.8)",marginTop:3}}>{r.acao}</div>
            </div>
          ))}
        </div>
        <div style={{marginTop:14,fontSize:12,color:"rgba(255,255,255,0.5)"}}>Integração via WhatsApp/n8n preparada</div>
      </Card>
      {modal&&<Modal title="Nova Cobrança" onClose={()=>setModal(false)}>
        <Sel label="Cliente" value="" onChange={()=>{}} options={MOCK_CLIENTS.map(c=>({value:c.id,label:c.name}))}/>
        <FInput label="Valor (R$)" value="" onChange={()=>{}} placeholder="1800"/>
        <FInput label="Data de vencimento" value="" onChange={()=>{}} type="date"/>
        <div style={{display:"flex",gap:10}}><Btn style={{flex:1}}>Salvar</Btn><Btn variant="ghost" onClick={()=>setModal(false)} style={{flex:1}}>Cancelar</Btn></div>
      </Modal>}
    </div>
  );
};

// DESPESAS
const DespesasPage=()=>{
  const [modal,setModal]=useState(false);
  const total=MOCK_DESPESAS.reduce((a,d)=>a+d.valor,0);
  const pagas=MOCK_DESPESAS.filter(d=>d.status==="pago").reduce((a,d)=>a+d.valor,0);
  return (
    <div>
      <div style={{display:"flex",gap:14,marginBottom:20,flexWrap:"wrap"}}>
        <MC label="Total despesas" value={`R$ ${total.toLocaleString()}`} icon={IC.money} bg="#F8FAFC"/>
        <MC label="Já pagas" value={`R$ ${pagas.toLocaleString()}`} icon={IC.check} bg="#ECFDF5"/>
        <MC label="A pagar" value={`R$ ${(total-pagas).toLocaleString()}`} icon={IC.clock} bg="#FFFBEB"/>
        <div style={{marginLeft:"auto",display:"flex",alignItems:"flex-start"}}><Btn onClick={()=>setModal(true)}>+ Adicionar Despesa</Btn></div>
      </div>
      <Card style={{padding:0}}>
        <Tbl cols={["Nome","Categoria","Valor","Vencimento","Status"]}
          rows={MOCK_DESPESAS.map(d=>[
            <span style={{fontWeight:700,color:"#111827"}}>{d.nome}</span>,
            <span style={{background:"#EEF3F8",borderRadius:6,padding:"2px 8px",fontSize:12,fontWeight:600,color:"#64748B"}}>{d.categoria}</span>,
            <span style={{fontWeight:800}}>R$ {d.valor.toLocaleString()}</span>,
            d.vencimento,
            <StatusBadge status={d.status}/>
          ])}/>
      </Card>
      {modal&&<Modal title="Nova Despesa" onClose={()=>setModal(false)}>
        <FInput label="Nome da despesa" value="" onChange={()=>{}} placeholder="Adobe Creative Cloud"/>
        <Sel label="Categoria" value="" onChange={()=>{}} options={["Ferramentas","Assinaturas","Colaboradores","Internet","Outros"].map(c=>({value:c,label:c}))}/>
        <FInput label="Valor (R$)" value="" onChange={()=>{}} placeholder="349"/>
        <FInput label="Data de vencimento" value="" onChange={()=>{}} type="date"/>
        <div style={{display:"flex",gap:10}}><Btn style={{flex:1}}>Salvar</Btn><Btn variant="ghost" onClick={()=>setModal(false)} style={{flex:1}}>Cancelar</Btn></div>
      </Modal>}
    </div>
  );
};

// TAREFAS KANBAN
const TarefasPage=()=>{
  const [tasks,setTasks]=useState(MOCK_TASKS);
  const [modal,setModal]=useState(false);
  const [dragId,setDragId]=useState(null);
  const [filter,setFilter]=useState("");
  const cols=[{id:"a_fazer",label:"A Fazer",color:"#1D4ED8"},{id:"em_producao",label:"Em Produção",color:"#FF6200"},{id:"aguardando",label:"Aguardando",color:"#7C3AED"},{id:"ajustes",label:"Ajustes",color:"#F59E0B"},{id:"finalizado",label:"Finalizado",color:"#10B981"},{id:"atrasado",label:"Atrasado",color:"#EF4444"}];
  const fl=tasks.filter(t=>filter===""||t.cliente.toLowerCase().includes(filter.toLowerCase())||t.responsavel.toLowerCase().includes(filter.toLowerCase()));
  return (
    <div>
      <div style={{display:"flex",gap:12,marginBottom:18,alignItems:"center"}}>
        <input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Filtrar por cliente ou responsável..." style={{flex:1,padding:"9px 14px",borderRadius:9,border:"1.5px solid #DDE5EF",fontSize:13,color:"#111827",outline:"none",fontFamily:"inherit"}}/>
        <Btn onClick={()=>setModal(true)}>+ Nova Tarefa</Btn>
      </div>
      <div style={{display:"flex",gap:14,overflowX:"auto",paddingBottom:16}}>
        {cols.map(col=>{
          const ct=fl.filter(t=>t.status===col.id);
          return (
            <div key={col.id} style={{minWidth:240,flex:"0 0 240px"}} onDragOver={e=>e.preventDefault()} onDrop={()=>{if(dragId){setTasks(prev=>prev.map(t=>t.id===dragId?{...t,status:col.id}:t));setDragId(null);}}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                <div style={{width:10,height:10,borderRadius:99,background:col.color}}/>
                <span style={{fontSize:13,fontWeight:800,color:"#1F2F46"}}>{col.label}</span>
                <span style={{marginLeft:"auto",background:"#EEF3F8",borderRadius:99,padding:"1px 9px",fontSize:11,fontWeight:700,color:"#64748B"}}>{ct.length}</span>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:10,minHeight:120,background:"#F0F4F9",borderRadius:12,padding:10}}>
                {ct.map(t=>(
                  <div key={t.id} draggable onDragStart={()=>setDragId(t.id)} style={{background:"#fff",borderRadius:10,padding:"12px 14px",boxShadow:"0 1px 3px rgba(0,0,0,0.06)",cursor:"grab",borderLeft:`3px solid ${col.color}`}}>
                    <div style={{fontSize:13,fontWeight:700,color:"#111827",marginBottom:6}}>{t.titulo}</div>
                    <div style={{fontSize:11,color:"#64748B",marginBottom:8}}>{t.cliente}</div>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><PBadge p={t.prioridade}/><div style={{fontSize:11,color:"#64748B"}}>{t.responsavel}</div></div>
                    <div style={{marginTop:8,fontSize:11,color:"#94A3B8",display:"flex",alignItems:"center",gap:4}}>{IC.clock} {t.entrega}</div>
                  </div>
                ))}
                {ct.length===0&&<div style={{color:"#94A3B8",fontSize:12,textAlign:"center",padding:"20px 0"}}>Solte aqui</div>}
              </div>
            </div>
          );
        })}
      </div>
      {modal&&<Modal title="Nova Tarefa" onClose={()=>setModal(false)}>
        <FInput label="Título" value="" onChange={()=>{}} placeholder="Arte Dia dos Namorados"/>
        <Sel label="Cliente" value="" onChange={()=>{}} options={MOCK_CLIENTS.map(c=>({value:c.id,label:c.name}))}/>
        <Sel label="Responsável" value="" onChange={()=>{}} options={MOCK_EQUIPE.map(e=>({value:e.id,label:e.nome}))}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          <Sel label="Prioridade" value="media" onChange={()=>{}} options={["baixa","media","alta","urgente"].map(p=>({value:p,label:p.charAt(0).toUpperCase()+p.slice(1)}))}/>
          <Sel label="Tipo" value="design" onChange={()=>{}} options={["Design","Vídeo","Tráfego pago","Relatório"].map(t=>({value:t,label:t}))}/>
        </div>
        <FInput label="Data de entrega" value="" onChange={()=>{}} type="date"/>
        <div style={{display:"flex",gap:10}}><Btn style={{flex:1}}>Criar Tarefa</Btn><Btn variant="ghost" onClick={()=>setModal(false)} style={{flex:1}}>Cancelar</Btn></div>
      </Modal>}
    </div>
  );
};

// CALENDÁRIO
const CalendarioPage=()=>{
  const [sel,setSel]=useState(null);
  const nm={alto:"#FF6200",medio:"#F59E0B",critico:"#EF4444"};
  return (
    <div>
      <div style={{fontSize:13,color:"#64748B",marginBottom:20}}>Datas comemorativas e oportunidades comerciais para seus clientes</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:14}}>
        {MOCK_DATAS.map(d=>(
          <Card key={d.id} onClick={()=>setSel(d)} style={{cursor:"pointer",borderLeft:`4px solid ${nm[d.nivel]||"#64748B"}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
              <div><div style={{fontSize:15,fontWeight:800,color:"#111827"}}>{d.nome}</div><div style={{fontSize:12,color:"#64748B",marginTop:2,display:"flex",alignItems:"center",gap:4}}>{IC.cal} {d.data}</div></div>
              <StatusBadge status={d.status}/>
            </div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              <span style={{background:"#EEF3F8",borderRadius:6,padding:"2px 8px",fontSize:11,fontWeight:600,color:"#64748B"}}>{d.tipo}</span>
              <span style={{background:(nm[d.nivel]||"#64748B")+"20",borderRadius:6,padding:"2px 8px",fontSize:11,fontWeight:700,color:nm[d.nivel]||"#64748B"}}>Oport. {d.nivel}</span>
            </div>
            <div style={{marginTop:10,fontSize:12,color:"#64748B"}}>Nichos: {d.nichos.slice(0,3).join(", ")}</div>
          </Card>
        ))}
      </div>
      {sel&&<Modal title={sel.nome} onClose={()=>setSel(null)}>
        <div style={{background:"#EEF3F8",borderRadius:10,padding:"14px 16px",marginBottom:16,display:"flex",alignItems:"center",gap:8}}>{IC.cal}<span style={{fontSize:13,fontWeight:700,color:"#111827"}}>{sel.data} · {sel.tipo}</span></div>
        <div style={{marginBottom:14}}>
          <div style={{fontSize:12,fontWeight:700,color:"#64748B",textTransform:"uppercase",letterSpacing:0.5,marginBottom:8}}>Nichos recomendados</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>{sel.nichos.map(n=><span key={n} style={{background:"#FFF7F3",color:"#FF6200",borderRadius:8,padding:"4px 12px",fontSize:12,fontWeight:700}}>{n}</span>)}</div>
        </div>
        <div style={{display:"flex",gap:10}}><Btn style={{flex:1}}>Criar Campanha</Btn><Btn variant="secondary" style={{flex:1}}>Criar Tarefas</Btn></div>
      </Modal>}
    </div>
  );
};

// EQUIPE
const EquipePage=()=>{
  const [modal,setModal]=useState(false);
  return (
    <div>
      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:18}}><Btn onClick={()=>setModal(true)}>+ Adicionar Colaborador</Btn></div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:16}}>
        {MOCK_EQUIPE.map(e=>{
          const tf=MOCK_TASKS.filter(t=>t.responsavel===e.nome.split(" ")[0]);
          const at=tf.filter(t=>t.status==="atrasado");
          return (
            <Card key={e.id}>
              <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:14}}>
                <div style={{width:50,height:50,background:"linear-gradient(135deg,#1F2F46,#2D4A6A)",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:20,fontWeight:800}}>{e.nome.charAt(0)}</div>
                <div>
                  <div style={{fontSize:15,fontWeight:800,color:"#111827"}}>{e.nome}</div>
                  <div style={{fontSize:12,color:"#64748B"}}>{e.funcao}</div>
                  <span style={{background:e.tipo==="fixo"?"#EFF6FF":"#F5F3FF",color:e.tipo==="fixo"?"#1D4ED8":"#7C3AED",fontSize:11,fontWeight:700,borderRadius:6,padding:"2px 8px"}}>{e.tipo.charAt(0).toUpperCase()+e.tipo.slice(1)}</span>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>
                <div style={{background:"#F8FAFC",borderRadius:8,padding:"8px 10px",textAlign:"center"}}><div style={{fontSize:18,fontWeight:800,color:"#111827"}}>{tf.length}</div><div style={{fontSize:10,color:"#64748B",fontWeight:600}}>Total</div></div>
                <div style={{background:"#ECFDF5",borderRadius:8,padding:"8px 10px",textAlign:"center"}}><div style={{fontSize:18,fontWeight:800,color:"#10B981"}}>{tf.filter(t=>t.status==="finalizado").length}</div><div style={{fontSize:10,color:"#10B981",fontWeight:600}}>Feitas</div></div>
                <div style={{background:at.length>0?"#FEF2F2":"#F8FAFC",borderRadius:8,padding:"8px 10px",textAlign:"center"}}><div style={{fontSize:18,fontWeight:800,color:at.length>0?"#EF4444":"#94A3B8"}}>{at.length}</div><div style={{fontSize:10,color:"#64748B",fontWeight:600}}>Atras.</div></div>
              </div>
              <div style={{fontSize:12,color:"#64748B"}}>{e.whatsapp}</div>
              <div style={{display:"flex",gap:8,marginTop:12}}><Btn size="sm" variant="ghost" style={{flex:1}}>Ver tarefas</Btn><Btn size="sm" variant="secondary" style={{flex:1}}>Lembrete</Btn></div>
            </Card>
          );
        })}
      </div>
      {modal&&<Modal title="Novo Colaborador" onClose={()=>setModal(false)}>
        <FInput label="Nome completo" value="" onChange={()=>{}} placeholder="Juliana Ferreira"/>
        <FInput label="Função" value="" onChange={()=>{}} placeholder="Designer"/>
        <FInput label="WhatsApp" value="" onChange={()=>{}} placeholder="94997001122"/>
        <Sel label="Tipo" value="fixo" onChange={()=>{}} options={[{value:"fixo",label:"Fixo"},{value:"freelancer",label:"Freelancer"}]}/>
        <div style={{display:"flex",gap:10}}><Btn style={{flex:1}}>Salvar</Btn><Btn variant="ghost" onClick={()=>setModal(false)} style={{flex:1}}>Cancelar</Btn></div>
      </Modal>}
    </div>
  );
};

// TRÁFEGO
const TráfegoPage=()=>{
  const [modal,setModal]=useState(false);
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:20,alignItems:"center"}}>
        <div style={{fontSize:13,color:"#64748B"}}>Verba de tráfego é separada da mensalidade</div>
        <Btn onClick={()=>setModal(true)}>+ Nova Recarga</Btn>
      </div>
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
                <div><div style={{fontSize:10,color:"#64748B",fontWeight:700,textTransform:"uppercase"}}>Recebido</div><div style={{fontSize:15,fontWeight:800,color:"#111827"}}>R$ {t.recebido.toLocaleString()}</div></div>
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
      {modal&&<Modal title="Nova Recarga" onClose={()=>setModal(false)}>
        <Sel label="Cliente" value="" onChange={()=>{}} options={MOCK_CLIENTS.map(c=>({value:c.id,label:c.name}))}/>
        <Sel label="Plataforma" value="meta" onChange={()=>{}} options={[{value:"meta",label:"Meta Ads"},{value:"google",label:"Google Ads"},{value:"tiktok",label:"TikTok Ads"}]}/>
        <FInput label="Valor recebido (R$)" value="" onChange={()=>{}} placeholder="1500"/>
        <FInput label="Data da recarga" value="" onChange={()=>{}} type="date"/>
        <div style={{display:"flex",gap:10}}><Btn style={{flex:1}}>Salvar</Btn><Btn variant="ghost" onClick={()=>setModal(false)} style={{flex:1}}>Cancelar</Btn></div>
      </Modal>}
    </div>
  );
};

// MENSAGENS
const MensagensPage=()=>{
  const modelos=[
    {cat:"Cobrança",nome:"Lembrete 3 dias antes",msg:"Olá, {{nome}}! Passando para lembrar que a mensalidade referente aos serviços da MarketForge vence no dia {{data}}. Valor: R$ {{valor}}. Qualquer dúvida, estou à disposição."},
    {cat:"Cobrança",nome:"Vencimento hoje",msg:"Olá, {{nome}}! Hoje é o vencimento da mensalidade referente aos serviços da MarketForge. Valor: R$ {{valor}}. Pode enviar o comprovante por aqui assim que realizar o pagamento."},
    {cat:"Cobrança",nome:"2 dias em atraso",msg:"Olá, {{nome}}! Identificamos que a mensalidade com vencimento em {{data}} ainda consta como pendente. Consegue verificar para a gente, por favor?"},
    {cat:"Tráfego",nome:"Saldo baixo",msg:"Olá, {{nome}}! O saldo atual da campanha é de R$ {{saldo}}. Para mantermos os anúncios ativos sem interrupção, recomendamos uma nova recarga."},
    {cat:"Equipe",nome:"Lembrete tarefa",msg:"Oi, {{colaborador}}! Você tem uma tarefa para entregar {{data}}: {{titulo}}. Cliente: {{cliente}}. Acesse o painel e atualize o status quando finalizar."},
    {cat:"Equipe",nome:"Tarefa atrasada",msg:"Oi, {{colaborador}}! Essa tarefa está atrasada: {{titulo}}. Cliente: {{cliente}}. Prazo original: {{data}}. Atualize o status ou informe o motivo no painel."},
    {cat:"Contratos",nome:"Renovação de contrato",msg:"Olá, {{nome}}! Seu contrato com a MarketForge está próximo do vencimento. Podemos alinhar a renovação para manter a continuidade dos serviços."},
  ];
  const cats=[...new Set(modelos.map(m=>m.cat))];
  const [ac,setAc]=useState("Cobrança");
  const [cp,setCp]=useState(null);
  const copy=(msg,i)=>{navigator.clipboard.writeText(msg).catch(()=>{});setCp(i);setTimeout(()=>setCp(null),2000);};
  return (
    <div>
      <div style={{display:"flex",gap:8,marginBottom:20}}>{cats.map(c=><Btn key={c} size="sm" variant={ac===c?"secondary":"ghost"} onClick={()=>setAc(c)}>{c}</Btn>)}</div>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        {modelos.filter(m=>m.cat===ac).map((m,i)=>(
          <Card key={i}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
              <div><span style={{background:"#EEF3F8",borderRadius:6,padding:"2px 8px",fontSize:11,fontWeight:700,color:"#64748B",marginRight:8}}>{m.cat}</span><span style={{fontSize:15,fontWeight:800,color:"#111827"}}>{m.nome}</span></div>
              <Btn size="sm" variant={cp===i?"success":"ghost"} onClick={()=>copy(m.msg,i)}>{cp===i?"Copiado!":"Copiar"}</Btn>
            </div>
            <div style={{background:"#F8FAFC",borderRadius:10,padding:"14px 16px",fontSize:13,color:"#374151",lineHeight:1.6}}>
              {m.msg.split(/({{[^}]+}})/).map((part,j)=>/{{.+}}/.test(part)?<span key={j} style={{background:"#FFF7F3",color:"#FF6200",fontWeight:700,borderRadius:4,padding:"0 4px"}}>{part}</span>:part)}
            </div>
            <div style={{marginTop:10,display:"flex",gap:8}}><Btn size="sm" variant="ghost">Editar</Btn><Btn size="sm" variant="ghost">Testar envio</Btn></div>
          </Card>
        ))}
      </div>
    </div>
  );
};

// APP
export default function App() {
  const [loggedIn,setLoggedIn]=useState(false);
  const [page,setPage]=useState("hoje");
  if(!loggedIn)return <LoginPage onLogin={()=>setLoggedIn(true)}/>;
  const pages={hoje:<HojePage setPage={setPage}/>,dashboard:<DashboardPage/>,clientes:<ClientesPage/>,financeiro:<FinanceiroPage/>,cobr:<CobrancasPage/>,despesas:<DespesasPage/>,tarefas:<TarefasPage/>,calendario:<CalendarioPage/>,equipe:<EquipePage/>,trafego:<TráfegoPage/>,mensagens:<MensagensPage/>};
  return (
    <div style={{fontFamily:"'Sora','Segoe UI',sans-serif",background:"#EEF3F8",minHeight:"100vh"}}>
      <Sidebar page={page} setPage={setPage} onLogout={()=>setLoggedIn(false)}/>
      <Topbar page={page}/>
      <main style={{marginLeft:230,paddingTop:62}}>
        <div style={{padding:"28px 30px",minHeight:"calc(100vh - 62px)"}}>
          {pages[page]||<div style={{color:"#64748B",textAlign:"center",marginTop:60}}>Módulo em desenvolvimento</div>}
        </div>
      </main>
    </div>
  );
}
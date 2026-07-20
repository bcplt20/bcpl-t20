import { useState } from "react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const dailyRevenue = [
  { day:"Jul 14", p1:12400, p2:4200 }, { day:"Jul 15", p1:18700, p2:7800 },
  { day:"Jul 16", p1:14200, p2:5600 }, { day:"Jul 17", p1:22100, p2:9400 },
  { day:"Jul 18", p1:28900, p2:14200 }, { day:"Jul 19", p1:31400, p2:18700 },
  { day:"Jul 20", p1:24800, p2:11200 },
];

const paymentMethods = [
  { name:"UPI", value:62, color:"#6366F1" }, { name:"Net Banking", value:19, color:"#FF6B00" },
  { name:"Card", value:14, color:"#10B981" }, { name:"Wallet", value:5, color:"#F59E0B" },
];

const transactions = [
  { id:"TXN001", name:"Arjun Sharma",  email:"arjun@gmail.com",  phone:"9876543210", gstin:"27AADCA2009R1Z7", type:"Phase 2", amount:2000, method:"UPI",         time:"Today 8:24 PM",  status:"success" },
  { id:"TXN002", name:"Priya Patel",   email:"priya@gmail.com",  phone:"9812345678", gstin:"",              type:"Phase 1", amount:299,  method:"Card",        time:"Today 7:51 PM",  status:"success" },
  { id:"TXN003", name:"Rahul Kumar",   email:"rahul@gmail.com",  phone:"9898989898", gstin:"",              type:"Phase 2", amount:2000, method:"Net Banking",  time:"Today 6:38 PM",  status:"pending" },
  { id:"TXN004", name:"Sneha Verma",   email:"sneha@gmail.com",  phone:"9811223344", gstin:"",              type:"Phase 1", amount:299,  method:"UPI",         time:"Today 5:12 PM",  status:"failed"  },
  { id:"TXN005", name:"Vikas Singh",   email:"vikas@gmail.com",  phone:"9900112233", gstin:"07AAACR0038E1Z2", type:"Phase 1", amount:399, method:"UPI",        time:"Today 4:44 PM",  status:"success" },
  { id:"TXN006", name:"Deepak Gupta",  email:"deepak@gmail.com", phone:"9867453210", gstin:"",              type:"Phase 2", amount:3000, method:"Wallet",       time:"Today 3:29 PM",  status:"success" },
  { id:"TXN007", name:"Meena Joshi",   email:"meena@gmail.com",  phone:"9701234567", gstin:"",              type:"Phase 1", amount:299,  method:"UPI",         time:"Today 2:11 PM",  status:"refunded"},
  { id:"TXN008", name:"Kavita Nair",   email:"kavita@gmail.com", phone:"9845671230", gstin:"32AAFCN0258Q1ZO", type:"Phase 2", amount:2000, method:"Card",      time:"Today 1:05 PM",  status:"success" },
];

const gstRate = 0.18;
const BCPL_GSTIN = "07AABCK9234P1ZX";
const BCPL_ADDRESS = "BCPL T20, Kriparti Playing11 Pvt. Ltd., 4th Floor, Sector-44, Gurugram, Haryana - 122003";

const statusConfig: Record<string,{color:string;bg:string}> = {
  success:  { color:"#10B981", bg:"#10B98122" },
  pending:  { color:"#F59E0B", bg:"#F59E0B22" },
  failed:   { color:"#EF4444", bg:"#EF444422" },
  refunded: { color:"#6366F1", bg:"#6366F122" },
};

const gstMonthly = [
  { month:"Apr", collected:18400, remitted:18400 }, { month:"May", collected:24200, remitted:24200 },
  { month:"Jun", collected:31800, remitted:28000 }, { month:"Jul", collected:42100, remitted:0 },
];

const CustomTooltip = ({ active, payload, label }:any) => {
  if(active&&payload?.length) return (
    <div style={{ background:"#0D1526", border:"1px solid #1E293B", borderRadius:10, padding:"10px 16px" }}>
      <p style={{ color:"#94A3B8", fontSize:11, margin:"0 0 6px" }}>{label}</p>
      {payload.map((p:any)=>(
        <p key={p.name} style={{ color:p.color, fontSize:14, fontWeight:700, margin:"2px 0" }}>
          {p.name==="p1"?"Phase 1":"Phase 2"}: ₹{p.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
  return null;
};

function InvoiceModal({ txn, onClose }:{ txn:typeof transactions[0]; onClose:()=>void }) {
  const [email, setEmail] = useState(txn.email);
  const [sent,  setSent]  = useState(false);
  const [loading, setLoading] = useState(false);
  const base = txn.amount;
  const gstAmt = Math.round(base * gstRate);
  const total  = base + gstAmt;
  const cgst = gstAmt/2, sgst = gstAmt/2;
  const invoiceNo = `BCPL/25-26/${txn.id}`;
  const today = new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"long",year:"numeric"});

  const handleSend = () => {
    setLoading(true);
    setTimeout(()=>{ setLoading(false); setSent(true); },1600);
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"#000000CC", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:16 }}>
      <div style={{ background:"#0D1526", border:"1px solid #1E293B", borderRadius:20, width:"100%", maxWidth:600, maxHeight:"92vh", overflowY:"auto" }}>
        {/* Invoice preview */}
        <div style={{ background:"#060B18", borderRadius:"20px 20px 0 0", padding:28, borderBottom:"1px solid #1E293B" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24 }}>
            <div>
              <div style={{ display:"flex", alignItems:"baseline", gap:4, marginBottom:4 }}>
                <span style={{ fontWeight:900, fontSize:22, color:"#FF6B00" }}>BCPL</span>
                <span style={{ fontWeight:900, fontSize:22, color:"#F1F5F9" }}>T20</span>
              </div>
              <div style={{ fontSize:11, color:"#64748B" }}>Kriparti Playing11 Pvt. Ltd.</div>
              <div style={{ fontSize:11, color:"#475569", maxWidth:220, marginTop:3 }}>{BCPL_ADDRESS}</div>
              <div style={{ fontSize:11, color:"#475569", marginTop:3 }}>GSTIN: <span style={{ color:"#F59E0B", fontWeight:700 }}>{BCPL_GSTIN}</span></div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ background:"linear-gradient(135deg,#FF6B00,#D95E10)", borderRadius:10, padding:"6px 16px", display:"inline-block", marginBottom:8 }}>
                <span style={{ fontSize:12, fontWeight:900, color:"#fff" }}>GST INVOICE</span>
              </div>
              <div style={{ fontSize:12, color:"#94A3B8" }}>Invoice No: <strong style={{ color:"#F1F5F9" }}>{invoiceNo}</strong></div>
              <div style={{ fontSize:12, color:"#94A3B8", marginTop:4 }}>Date: {today}</div>
            </div>
          </div>

          {/* Bill to */}
          <div style={{ background:"#0A1020", borderRadius:12, padding:"14px 16px", marginBottom:20, border:"1px solid #1E293B" }}>
            <div style={{ fontSize:10, color:"#475569", fontWeight:700, textTransform:"uppercase", letterSpacing:.5, marginBottom:8 }}>BILL TO</div>
            <div style={{ fontSize:15, fontWeight:700, color:"#F1F5F9" }}>{txn.name}</div>
            <div style={{ fontSize:12, color:"#64748B", marginTop:2 }}>{txn.email} · {txn.phone}</div>
            {txn.gstin&&<div style={{ fontSize:12, color:"#F59E0B", marginTop:2 }}>GSTIN: {txn.gstin}</div>}
          </div>

          {/* Line items */}
          <table style={{ width:"100%", borderCollapse:"collapse", marginBottom:16 }}>
            <thead>
              <tr style={{ background:"#1E293B" }}>
                {["Description","HSN","Rate","Qty","Amount"].map(h=>(
                  <th key={h} style={{ padding:"8px 12px", textAlign:h==="Amount"?"right":"left", fontSize:10, color:"#94A3B8", fontWeight:700, textTransform:"uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom:"1px solid #1E293B" }}>
                <td style={{ padding:"12px 12px", fontSize:13, color:"#F1F5F9" }}>BCPL T20 Season 5 — {txn.type} Registration ({txn.type==="Phase 1"?"Online Scout Review":"Physical Trial Entry"})</td>
                <td style={{ padding:"12px 12px", fontSize:12, color:"#64748B" }}>999299</td>
                <td style={{ padding:"12px 12px", fontSize:13, color:"#94A3B8" }}>₹{base.toLocaleString()}</td>
                <td style={{ padding:"12px 12px", fontSize:13, color:"#94A3B8" }}>1</td>
                <td style={{ padding:"12px 12px", fontSize:13, color:"#F1F5F9", textAlign:"right" }}>₹{base.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>

          {/* Tax breakdown */}
          <div style={{ display:"flex", justifyContent:"flex-end" }}>
            <div style={{ width:260 }}>
              {[{l:"Subtotal",v:`₹${base.toLocaleString()}`},{l:"CGST @ 9%",v:`₹${cgst.toFixed(2)}`},{l:"SGST @ 9%",v:`₹${sgst.toFixed(2)}`}].map(r=>(
                <div key={r.l} style={{ display:"flex", justifyContent:"space-between", padding:"5px 0", borderBottom:"1px solid #1E293B" }}>
                  <span style={{ fontSize:12, color:"#64748B" }}>{r.l}</span>
                  <span style={{ fontSize:12, color:"#94A3B8" }}>{r.v}</span>
                </div>
              ))}
              <div style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderTop:"2px solid #FF6B0044", marginTop:2 }}>
                <span style={{ fontSize:14, fontWeight:800, color:"#F1F5F9" }}>Total</span>
                <span style={{ fontSize:16, fontWeight:800, color:"#FF6B00" }}>₹{total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop:16, padding:"10px 14px", background:"#0A1020", borderRadius:10, border:"1px solid #1E293B" }}>
            <div style={{ fontSize:10, color:"#334155", lineHeight:1.6 }}>
              This is a computer-generated invoice. No signature required. Payment received via {txn.method} on {txn.time}. TXN ID: {txn.id}.
            </div>
          </div>
        </div>

        {/* Send section */}
        <div style={{ padding:"20px 28px" }}>
          <div style={{ fontSize:14, fontWeight:700, color:"#F1F5F9", marginBottom:12 }}>📧 Send Invoice via Email</div>
          {sent
            ? <div style={{ background:"#10B98122", border:"1px solid #10B98144", borderRadius:12, padding:"16px 20px", color:"#10B981", fontWeight:700, textAlign:"center" }}>✅ Invoice sent to {email}</div>
            : (
              <div style={{ display:"flex", gap:10 }}>
                <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email address" style={{ flex:1, padding:"10px 14px", background:"#060B18", border:"1px solid #1E293B", borderRadius:10, color:"#F1F5F9", fontSize:13, outline:"none" }}/>
                <button onClick={handleSend} disabled={loading} style={{ padding:"10px 20px", borderRadius:10, border:"none", background:"linear-gradient(135deg,#FF6B00,#FF8C40)", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap" }}>
                  {loading?"Sending…":"Send Invoice"}
                </button>
              </div>
            )
          }
          <div style={{ display:"flex", gap:8, marginTop:12 }}>
            <button style={{ padding:"9px 16px", borderRadius:9, border:"1px solid #1E293B", background:"transparent", color:"#94A3B8", fontSize:12, cursor:"pointer" }}>⬇ Download PDF</button>
            <button style={{ padding:"9px 16px", borderRadius:9, border:"1px solid #1E293B", background:"transparent", color:"#94A3B8", fontSize:12, cursor:"pointer" }}>📋 Copy Link</button>
            <button onClick={onClose} style={{ padding:"9px 16px", borderRadius:9, border:"none", background:"#1E293B", color:"#64748B", fontSize:12, cursor:"pointer", marginLeft:"auto" }}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FinanceView() {
  const [tab,       setTab]       = useState<"overview"|"gst"|"invoices">("overview");
  const [txnFilter, setTxnFilter] = useState<"all"|"success"|"pending"|"failed"|"refunded">("all");
  const [invoice,   setInvoice]   = useState<typeof transactions[0]|null>(null);
  const [gstSearch, setGstSearch] = useState("");

  const filtered = txnFilter==="all"?transactions:transactions.filter(t=>t.status===txnFilter);
  const gstFiltered = transactions.filter(t=>t.status==="success"&&(t.name.toLowerCase().includes(gstSearch.toLowerCase())||t.id.toLowerCase().includes(gstSearch.toLowerCase())));
  const totalGST = transactions.filter(t=>t.status==="success").reduce((a,t)=>a+Math.round(t.amount*gstRate),0);

  const card:React.CSSProperties = { background:"linear-gradient(135deg,#0D1526 0%,#0A1020 100%)", border:"1px solid #1E293B", borderRadius:16, padding:20 };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <div style={{ fontSize:20, fontWeight:800, color:"#F1F5F9" }}>Finance & GST</div>
          <div style={{ fontSize:12, color:"#64748B", marginTop:2 }}>Revenue tracking, GST compliance, and invoice management</div>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button style={{ padding:"9px 18px", borderRadius:9, border:"1px solid #1E293B", background:"transparent", color:"#94A3B8", fontSize:12, cursor:"pointer" }}>⬇ Export CSV</button>
          <button style={{ padding:"9px 18px", borderRadius:9, border:"none", background:"linear-gradient(135deg,#FF6B00,#FF8C40)", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer" }}>📄 Bulk Invoices</button>
        </div>
      </div>

      {/* Revenue Cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
        {[
          { label:"Total Revenue",     value:"₹6,30,600", sub:"All phases combined",       color:"#FF6B00", icon:"💰", delta:"+12.4%" },
          { label:"Phase 1 Revenue",   value:"₹3,81,200", sub:"3,812 registrations",       color:"#F59E0B", icon:"💳", delta:"+8.2%"  },
          { label:"Phase 2 Revenue",   value:"₹2,49,400", sub:"1,247 selections",          color:"#10B981", icon:"🏆", delta:"+24.7%" },
          { label:"GST Collected",     value:`₹${totalGST.toLocaleString()}`, sub:"18% on registration fees", color:"#6366F1", icon:"🏛", delta:"FY 25-26" },
        ].map(s=>(
          <div key={s.label} style={{ ...card, borderTop:`3px solid ${s.color}`, position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", top:0, right:0, width:60, height:60, background:`radial-gradient(${s.color}18,transparent 70%)`, borderRadius:"50%" }}/>
            <div style={{ fontSize:22, marginBottom:8 }}>{s.icon}</div>
            <div style={{ fontSize:24, fontWeight:800, color:"#F1F5F9" }}>{s.value}</div>
            <div style={{ fontSize:11, color:"#64748B", marginTop:2 }}>{s.label}</div>
            <div style={{ display:"flex", justifyContent:"space-between", marginTop:8 }}>
              <span style={{ fontSize:10, color:"#334155" }}>{s.sub}</span>
              <span style={{ fontSize:11, fontWeight:700, color:s.delta.startsWith("+")?"#10B981":"#6366F1" }}>{s.delta}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:6 }}>
        {([["overview","📊 Overview"],["gst","🏛 GST Summary"],["invoices","📄 Invoices"]] as const).map(([t,l])=>(
          <button key={t} onClick={()=>setTab(t as any)} style={{ padding:"9px 20px", borderRadius:10, border:"1px solid", borderColor:tab===t?"#FF6B00":"#1E293B", background:tab===t?"#FF6B0022":"transparent", color:tab===t?"#FF6B00":"#64748B", fontSize:12, fontWeight:700, cursor:"pointer" }}>{l}</button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {tab==="overview"&&(
        <>
          <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:16 }}>
            <div style={card}>
              <div style={{ fontSize:14, fontWeight:700, color:"#F1F5F9", marginBottom:16 }}>Daily Revenue — Last 7 Days</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={dailyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B"/>
                  <XAxis dataKey="day" stroke="#334155" tick={{ fill:"#64748B", fontSize:11 }}/>
                  <YAxis stroke="#334155" tick={{ fill:"#64748B", fontSize:10 }} tickFormatter={v=>`₹${(v/1000).toFixed(0)}k`}/>
                  <Tooltip content={<CustomTooltip/>}/>
                  <Bar dataKey="p1" fill="#F59E0B" radius={[4,4,0,0]} name="p1"/>
                  <Bar dataKey="p2" fill="#10B981" radius={[4,4,0,0]} name="p2"/>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <div style={{ fontSize:14, fontWeight:700, color:"#F1F5F9", marginBottom:12 }}>Payment Methods</div>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={paymentMethods} cx="50%" cy="50%" innerRadius={38} outerRadius={60} dataKey="value" strokeWidth={0}>
                    {paymentMethods.map((m,i)=><Cell key={i} fill={m.color}/>)}
                  </Pie>
                  <Tooltip formatter={(v:any)=>[`${v}%`,""]} contentStyle={{ background:"#0D1526", border:"1px solid #1E293B", borderRadius:8 }}/>
                </PieChart>
              </ResponsiveContainer>
              {paymentMethods.map(m=>(
                <div key={m.name} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:8 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}><div style={{ width:8, height:8, borderRadius:2, background:m.color }}/><span style={{ fontSize:12, color:"#94A3B8" }}>{m.name}</span></div>
                  <span style={{ fontSize:12, fontWeight:700, color:"#F1F5F9" }}>{m.value}%</span>
                </div>
              ))}
            </div>
          </div>
          {/* Transaction log */}
          <div style={card}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <div style={{ fontSize:14, fontWeight:700, color:"#F1F5F9" }}>Transaction Log</div>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {(["all","success","pending","failed","refunded"] as const).map(f=>(
                  <button key={f} onClick={()=>setTxnFilter(f)} style={{ padding:"5px 12px", borderRadius:7, border:"1px solid", borderColor:txnFilter===f?(f==="all"?"#FF6B00":statusConfig[f]?.color||"#FF6B00"):"#1E293B", background:txnFilter===f?((f==="all"?"#FF6B00":statusConfig[f]?.color||"#FF6B00")+"22"):"transparent", color:txnFilter===f?(f==="all"?"#FF6B00":statusConfig[f]?.color):"#64748B", fontSize:11, fontWeight:700, cursor:"pointer", textTransform:"capitalize" }}>{f}</button>
                ))}
              </div>
            </div>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr style={{ borderBottom:"1px solid #1E293B" }}>
                  {["Txn ID","Player","Phase","Amount","Method","Time","Status","Invoice"].map(h=>(
                    <th key={h} style={{ padding:"8px 10px", textAlign:"left", fontSize:10, color:"#475569", fontWeight:700, textTransform:"uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(t=>(
                  <tr key={t.id} style={{ borderBottom:"1px solid #0F1B2D" }}>
                    <td style={{ padding:"11px 10px", fontFamily:"monospace", fontSize:11, color:"#475569" }}>{t.id}</td>
                    <td style={{ padding:"11px 10px", fontSize:13, fontWeight:600, color:"#F1F5F9" }}>{t.name}</td>
                    <td style={{ padding:"11px 10px" }}><span style={{ fontSize:11, padding:"2px 8px", borderRadius:4, background:t.type==="Phase 2"?"#10B98122":"#F59E0B22", color:t.type==="Phase 2"?"#10B981":"#F59E0B", fontWeight:700 }}>{t.type}</span></td>
                    <td style={{ padding:"11px 10px", fontSize:14, fontWeight:800, color:"#FF6B00" }}>₹{t.amount.toLocaleString()}</td>
                    <td style={{ padding:"11px 10px", fontSize:12, color:"#94A3B8" }}>{t.method}</td>
                    <td style={{ padding:"11px 10px", fontSize:11, color:"#475569" }}>{t.time}</td>
                    <td style={{ padding:"11px 10px" }}><span style={{ padding:"3px 10px", borderRadius:20, fontSize:10, fontWeight:800, background:statusConfig[t.status].bg, color:statusConfig[t.status].color, textTransform:"capitalize" }}>{t.status}</span></td>
                    <td style={{ padding:"11px 10px" }}>
                      {t.status==="success"
                        ? <button onClick={()=>setInvoice(t)} style={{ padding:"4px 10px", borderRadius:6, border:"1px solid #FF6B0044", background:"#FF6B0011", color:"#FF6B00", fontSize:11, cursor:"pointer", fontWeight:700 }}>📄 GST Invoice</button>
                        : <span style={{ fontSize:10, color:"#334155" }}>N/A</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── GST SUMMARY TAB ── */}
      {tab==="gst"&&(
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {/* GST Header Cards */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
            {[
              { label:"Total GST Collected", value:`₹${totalGST.toLocaleString()}`, sub:"FY 2025-26", color:"#6366F1", icon:"🏛" },
              { label:"CGST (9%)",           value:`₹${(totalGST/2).toLocaleString()}`, sub:"Central GST", color:"#FF6B00", icon:"🇮🇳" },
              { label:"SGST (9%)",           value:`₹${(totalGST/2).toLocaleString()}`, sub:"State GST", color:"#10B981", icon:"📍" },
              { label:"Registered GSTINs",   value:"3", sub:"Businesses with GSTIN", color:"#F59E0B", icon:"📋" },
            ].map(s=>(
              <div key={s.label} style={{ ...card, borderTop:`3px solid ${s.color}` }}>
                <div style={{ fontSize:20, marginBottom:8 }}>{s.icon}</div>
                <div style={{ fontSize:22, fontWeight:800, color:s.color }}>{s.value}</div>
                <div style={{ fontSize:11, color:"#64748B", marginTop:3 }}>{s.label}</div>
                <div style={{ fontSize:10, color:"#334155", marginTop:6 }}>{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Monthly GST chart */}
          <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:14 }}>
            <div style={card}>
              <div style={{ fontSize:14, fontWeight:700, color:"#F1F5F9", marginBottom:4 }}>Monthly GST Collected vs Remitted</div>
              <div style={{ fontSize:11, color:"#475569", marginBottom:16 }}>Track GSTR-1 compliance month by month</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={gstMonthly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B"/>
                  <XAxis dataKey="month" stroke="#334155" tick={{ fill:"#64748B", fontSize:11 }}/>
                  <YAxis stroke="#334155" tick={{ fill:"#64748B", fontSize:10 }} tickFormatter={v=>`₹${(v/1000).toFixed(0)}k`}/>
                  <Tooltip contentStyle={{ background:"#0D1526", border:"1px solid #1E293B", borderRadius:8 }}/>
                  <Bar dataKey="collected" fill="#6366F1" radius={[4,4,0,0]} name="Collected"/>
                  <Bar dataKey="remitted"  fill="#10B981" radius={[4,4,0,0]} name="Remitted"/>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <div style={{ fontSize:14, fontWeight:700, color:"#F1F5F9", marginBottom:16 }}>BCPL GST Details</div>
              {[{l:"Business Name",v:"Kriparti Playing11 Pvt. Ltd."},{l:"GSTIN",v:BCPL_GSTIN},{l:"Registration Type",v:"Regular"},{l:"State",v:"Haryana (07)"},{l:"Next GSTR-1 Due",v:"11 Aug 2026"},{l:"HSN Code",v:"999299 — Sports Services"},{l:"GST Rate",v:"18% (CGST 9% + SGST 9%)"}].map(r=>(
                <div key={r.l} style={{ padding:"10px 0", borderBottom:"1px solid #1E293B" }}>
                  <div style={{ fontSize:10, color:"#475569", fontWeight:700, textTransform:"uppercase" }}>{r.l}</div>
                  <div style={{ fontSize:13, color:"#F1F5F9", marginTop:3, fontWeight:600 }}>{r.v}</div>
                </div>
              ))}
              <button style={{ width:"100%", marginTop:14, padding:"10px", borderRadius:10, border:"1px solid #6366F144", background:"#6366F111", color:"#6366F1", fontSize:12, fontWeight:700, cursor:"pointer" }}>
                📥 Download GSTR-1 Report
              </button>
            </div>
          </div>

          {/* B2B transactions with GSTIN */}
          <div style={card}>
            <div style={{ fontSize:14, fontWeight:700, color:"#F1F5F9", marginBottom:4 }}>B2B Registrations (with GSTIN)</div>
            <div style={{ fontSize:11, color:"#475569", marginBottom:14 }}>Players/entities who provided GSTIN — eligible for ITC</div>
            {transactions.filter(t=>t.gstin&&t.status==="success").length===0
              ? <div style={{ textAlign:"center", padding:"20px 0", color:"#334155" }}>No B2B transactions found</div>
              : (
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead>
                    <tr style={{ borderBottom:"1px solid #1E293B" }}>
                      {["Player","GSTIN","Phase","Taxable Amt","CGST (9%)","SGST (9%)","Total","Invoice"].map(h=>(
                        <th key={h} style={{ padding:"8px 10px", textAlign:"left", fontSize:10, color:"#475569", fontWeight:700, textTransform:"uppercase" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.filter(t=>t.gstin&&t.status==="success").map(t=>{
                      const gst = Math.round(t.amount*gstRate);
                      return (
                        <tr key={t.id} style={{ borderBottom:"1px solid #0F1B2D" }}>
                          <td style={{ padding:"11px 10px", fontSize:13, color:"#F1F5F9", fontWeight:600 }}>{t.name}</td>
                          <td style={{ padding:"11px 10px", fontSize:11, color:"#F59E0B", fontFamily:"monospace" }}>{t.gstin}</td>
                          <td style={{ padding:"11px 10px" }}><span style={{ fontSize:11, padding:"2px 8px", borderRadius:4, background:t.type==="Phase 2"?"#10B98122":"#F59E0B22", color:t.type==="Phase 2"?"#10B981":"#F59E0B", fontWeight:700 }}>{t.type}</span></td>
                          <td style={{ padding:"11px 10px", fontSize:13, color:"#94A3B8" }}>₹{t.amount.toLocaleString()}</td>
                          <td style={{ padding:"11px 10px", fontSize:13, color:"#6366F1" }}>₹{(gst/2).toFixed(2)}</td>
                          <td style={{ padding:"11px 10px", fontSize:13, color:"#6366F1" }}>₹{(gst/2).toFixed(2)}</td>
                          <td style={{ padding:"11px 10px", fontSize:14, fontWeight:800, color:"#FF6B00" }}>₹{(t.amount+gst).toLocaleString()}</td>
                          <td style={{ padding:"11px 10px" }}>
                            <button onClick={()=>setInvoice(t)} style={{ padding:"4px 10px", borderRadius:6, border:"1px solid #FF6B0044", background:"#FF6B0011", color:"#FF6B00", fontSize:11, cursor:"pointer", fontWeight:700 }}>📄 Invoice</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )
            }
          </div>
        </div>
      )}

      {/* ── INVOICES TAB ── */}
      {tab==="invoices"&&(
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div style={{ display:"flex", gap:10, alignItems:"center" }}>
            <input value={gstSearch} onChange={e=>setGstSearch(e.target.value)} placeholder="Search by player name or TXN ID…" style={{ flex:1, padding:"10px 14px", background:"#0D1526", border:"1px solid #1E293B", borderRadius:10, color:"#F1F5F9", fontSize:13, outline:"none" }}/>
            <button style={{ padding:"10px 18px", borderRadius:10, border:"1px solid #1E293B", background:"transparent", color:"#94A3B8", fontSize:12, cursor:"pointer" }}>⬇ Bulk Download</button>
          </div>
          <div style={card}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:14 }}>
              <div style={{ fontSize:14, fontWeight:700, color:"#F1F5F9" }}>All GST Invoices</div>
              <span style={{ fontSize:11, color:"#64748B" }}>{gstFiltered.length} invoices</span>
            </div>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr style={{ borderBottom:"1px solid #1E293B" }}>
                  {["Invoice No","Player","Email","Phase","Base Amt","GST (18%)","Total","Action"].map(h=>(
                    <th key={h} style={{ padding:"8px 10px", textAlign:"left", fontSize:10, color:"#475569", fontWeight:700, textTransform:"uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {gstFiltered.map(t=>{
                  const gst = Math.round(t.amount*gstRate);
                  return (
                    <tr key={t.id} style={{ borderBottom:"1px solid #0F1B2D" }}>
                      <td style={{ padding:"11px 10px", fontFamily:"monospace", fontSize:11, color:"#6366F1" }}>BCPL/25-26/{t.id}</td>
                      <td style={{ padding:"11px 10px", fontSize:13, fontWeight:600, color:"#F1F5F9" }}>{t.name}</td>
                      <td style={{ padding:"11px 10px", fontSize:11, color:"#64748B" }}>{t.email}</td>
                      <td style={{ padding:"11px 10px" }}><span style={{ fontSize:11, padding:"2px 8px", borderRadius:4, background:t.type==="Phase 2"?"#10B98122":"#F59E0B22", color:t.type==="Phase 2"?"#10B981":"#F59E0B", fontWeight:700 }}>{t.type}</span></td>
                      <td style={{ padding:"11px 10px", fontSize:13, color:"#94A3B8" }}>₹{t.amount.toLocaleString()}</td>
                      <td style={{ padding:"11px 10px", fontSize:13, color:"#6366F1" }}>₹{gst.toLocaleString()}</td>
                      <td style={{ padding:"11px 10px", fontSize:14, fontWeight:800, color:"#FF6B00" }}>₹{(t.amount+gst).toLocaleString()}</td>
                      <td style={{ padding:"11px 10px" }}>
                        <div style={{ display:"flex", gap:6 }}>
                          <button onClick={()=>setInvoice(t)} style={{ padding:"4px 10px", borderRadius:6, border:"1px solid #FF6B0044", background:"#FF6B0011", color:"#FF6B00", fontSize:11, cursor:"pointer", fontWeight:700 }}>View</button>
                          <button onClick={()=>setInvoice(t)} style={{ padding:"4px 10px", borderRadius:6, border:"1px solid #6366F144", background:"#6366F111", color:"#6366F1", fontSize:11, cursor:"pointer" }}>Email</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── GST Invoice Modal ── */}
      {invoice&&<InvoiceModal txn={invoice} onClose={()=>setInvoice(null)}/>}
    </div>
  );
}

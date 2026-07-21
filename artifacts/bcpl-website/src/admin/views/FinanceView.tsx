import { useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line
} from "recharts";

/* ─── Constants ─────────────────────────────────────────────── */
const GST_RATE   = 0.18;
const CF_FEE     = 0.02;   // Cashfree 2% gateway fee
const TDS_RATE   = 0.10;   // TDS on prizes
const BCPL_GSTIN = "07AAHCK4053D1ZS";
const BCPL_ADDR  = "Kriparti Playing11 Private Limited, 2nd Floor Back Side, RZ-108, Indra Park, Uttam Nagar, West Delhi, Delhi - 110059";

/* ─── Data — empty until real transactions come in ───────────── */
const dailyRevenue: { day:string; p1:number; p2:number; refunds:number }[] = [];
const monthlyPL: { month:string; revenue:number; gatewayCost:number; gstPaid:number; net:number }[] = [];
const paymentMethods = [
  { name:"UPI",         value:0, color:"#6366F1" },
  { name:"Net Banking", value:0, color:"#FF6B00" },
  { name:"Card",        value:0, color:"#10B981" },
  { name:"Wallet",      value:0, color:"#F59E0B" },
];
const gstMonthly: { month:string; collected:number; remitted:number; due:string }[] = [];
type Txn = { id:string; name:string; email:string; phone:string; gstin:string; type:"Phase 1"|"Phase 2"; amount:number; method:string; time:string; status:"success"|"pending"|"failed"|"refunded" };
const TRANSACTIONS: Txn[] = [];
const REFUNDS: { id:string; txnId:string; name:string; amount:number; reason:string; status:string; date:string; method:string; days:number }[] = [];
const TDS_PRIZES: { player:string; prize:string; tds:string; net:string; pan:string; status:string }[] = [];

const SC: Record<string,{color:string;bg:string;label:string}> = {
  success:  { color:"#10B981", bg:"#10B98122", label:"Success"  },
  pending:  { color:"#F59E0B", bg:"#F59E0B22", label:"Pending"  },
  failed:   { color:"#EF4444", bg:"#EF444422", label:"Failed"   },
  refunded: { color:"#6366F1", bg:"#6366F122", label:"Refunded" },
};

/* ─── Invoice Modal ──────────────────────────────────────────── */
function InvoiceModal({ txn, onClose }: { txn: Txn; onClose: () => void }) {
  const [email,   setEmail]   = useState(txn.email);
  const [sent,    setSent]    = useState(false);
  const [loading, setLoading] = useState(false);
  const base = txn.amount;
  const gst  = Math.round(base * GST_RATE);
  const cgst = gst / 2, sgst = gst / 2;
  const total = base + gst;
  const invoiceNo = `BCPL/25-26/${txn.id}`;
  const today = new Date().toLocaleDateString("en-IN", { day:"2-digit", month:"long", year:"numeric" });

  return (
    <div style={{ position:"fixed", inset:0, background:"#000000CC", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:16 }} onClick={onClose}>
      <div style={{ background:"#0D1526", border:"1px solid #1E293B", borderRadius:20, width:"100%", maxWidth:620, maxHeight:"92vh", overflowY:"auto" }} onClick={e=>e.stopPropagation()}>

        {/* Top action bar */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"16px 24px", borderBottom:"1px solid #1E293B" }}>
          <div style={{ fontSize:15, fontWeight:800, color:"#F1F5F9" }}>📄 GST Tax Invoice</div>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={()=>{
              const w=window.open("","_blank");if(!w)return;
              const iNo=`BCPL/25-26/${txn.id}`;
              const gst=Math.round(base*GST_RATE);const cgst=gst/2;const total=base+gst;
              w.document.write(`<!DOCTYPE html><html><head><title>${iNo}</title>
              <style>body{font-family:Arial,sans-serif;font-size:11px;padding:0;margin:0}
              .lh{display:flex;align-items:center;gap:16px;background:#FF6B00;padding:14px 30px;color:#fff}
              .logo{width:54px;height:54px;border-radius:50%;overflow:hidden;border:3px solid rgba(255,255,255,.4);flex-shrink:0}
              .logo img{width:100%;height:100%;object-fit:cover}
              .lh-title{font-size:16px;font-weight:900;letter-spacing:.04em}
              .lh-sub{font-size:9px;opacity:.8;margin-top:2px}
              .body{padding:24px 32px;max-width:800px}
              .inv-header{display:flex;justify-content:space-between;margin-bottom:20px;padding-bottom:14px;border-bottom:2px solid #FF6B00}
              .inv-badge{background:#FF6B00;color:#fff;padding:5px 14px;border-radius:6px;font-weight:900;font-size:11px;letter-spacing:.04em;display:inline-block;margin-bottom:6px}
              h3{margin:0;font-size:12px;color:#555}
              .bill{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:18px}
              .bill-box{background:#f8f8f8;border:1px solid #eee;border-radius:8px;padding:12px}
              .bill-label{font-size:9px;font-weight:700;color:#888;text-transform:uppercase;margin-bottom:6px}
              table{width:100%;border-collapse:collapse;margin-bottom:16px;font-size:10px}
              th{background:#f1f1f1;padding:6px 8px;text-align:left;font-size:9px;font-weight:700;text-transform:uppercase;color:#555}
              td{padding:8px;border-bottom:1px solid #eee}
              .tax-box{float:right;width:260px;background:#f8f8f8;border:1px solid #eee;border-radius:8px;padding:12px}
              .tax-row{display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #eee;font-size:10px}
              .total-row{display:flex;justify-content:space-between;padding:8px 0 0;font-weight:900;font-size:14px}
              .total-row span:last-child{color:#FF6B00}
              .footer{clear:both;margin-top:20px;border-top:2px solid #FF6B00;padding:10px 32px;font-size:8px;color:#666;display:flex;justify-content:space-between}
              @media print{body{} .lh{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head>
              <body>
              <div class="lh">
                <div class="logo"><img src="/bcpl-website/bcpl-assets/bcpl-ball-color.jpg"/></div>
                <div><div class="lh-title">BCPL T20 — Bhartiya Corporate Premier League</div>
                <div class="lh-sub">KRIPARTI PLAYING11 PRIVATE LIMITED · GSTIN: ${BCPL_GSTIN}</div>
                <div class="lh-sub">2nd Floor Back Side, RZ-108, Indra Park, Uttam Nagar, West Delhi — 110059</div></div>
              </div>
              <div class="body">
                <div class="inv-header">
                  <div>
                    <div class="inv-badge">TAX INVOICE</div>
                    <h3>Invoice No: <strong>${iNo}</strong></h3>
                    <h3>Date: ${new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"long",year:"numeric"})}</h3>
                    <h3>HSN/SAC Code: 999299 — Sports Event Services</h3>
                    <h3>GST Rate: 18% (CGST 9% + SGST 9%)</h3>
                  </div>
                  <div style="text-align:right">
                    <div style="font-size:11px;color:#555">Place of Supply: PAN India</div>
                    <div style="font-size:10px;color:#888;margin-top:4px">TXN ID: ${txn.id}</div>
                    <div style="font-size:10px;color:#888">Method: ${txn.method}</div>
                  </div>
                </div>
                <div class="bill">
                  <div class="bill-box">
                    <div class="bill-label">Issued By (Supplier)</div>
                    <strong>Kriparti Playing11 Pvt. Ltd.</strong><br/>
                    <span style="font-size:10px;color:#555">GSTIN: ${BCPL_GSTIN}<br/>
                    2nd Floor Back Side, RZ-108, Indra Park,<br/>Uttam Nagar, West Delhi - 110059</span>
                  </div>
                  <div class="bill-box">
                    <div class="bill-label">Bill To (Recipient)</div>
                    <strong>${txn.name}</strong><br/>
                    <span style="font-size:10px;color:#555">${txn.email}<br/>${txn.phone}${txn.gstin?`<br/>GSTIN: ${txn.gstin}`:""}</span>
                  </div>
                </div>
                <table>
                  <thead><tr><th>Description</th><th>HSN</th><th>Rate</th><th>Qty</th><th>Taxable Amount</th></tr></thead>
                  <tbody>
                    <tr><td>BCPL T20 Season 5 — ${txn.type} Registration<br/><span style="font-size:9px;color:#888">${txn.type==="Phase 1"?"Online Scout Review &amp; Video Submission":"Physical Trial Entry &amp; Franchise Auction Eligibility"}</span></td>
                    <td>999299</td><td>₹${base.toLocaleString()}</td><td>1</td><td>₹${base.toLocaleString()}</td></tr>
                  </tbody>
                </table>
                <div class="tax-box">
                  <div class="tax-row"><span>Subtotal</span><span>₹${base.toLocaleString()}</span></div>
                  <div class="tax-row"><span>CGST @ 9%</span><span>₹${cgst.toFixed(2)}</span></div>
                  <div class="tax-row"><span>SGST @ 9%</span><span>₹${cgst.toFixed(2)}</span></div>
                  <div class="total-row"><span>Total Payable</span><span>₹${total.toLocaleString()}</span></div>
                  <div style="font-size:8px;color:#888;margin-top:6px">Computer-generated invoice. Subject to Delhi jurisdiction.</div>
                </div>
              </div>
              <div class="footer">
                <span>Invoice: ${iNo} · Verified Payment</span>
                <span>Kriparti Playing11 Pvt. Ltd. · CIN: U74999DL2019PTC345678</span>
                <span>legal@bcplt20.com · bcplt20.com</span>
              </div>
              </body></html>`);
              w.document.close();setTimeout(()=>w.print(),500);
            }} style={{ padding:"6px 14px", borderRadius:8, border:"1px solid #1E293B", background:"transparent", color:"#94A3B8", fontSize:12, cursor:"pointer" }}>⬇ PDF</button>
            <button onClick={onClose} style={{ padding:"6px 12px", borderRadius:8, border:"none", background:"#1E293B", color:"#64748B", fontSize:12, cursor:"pointer" }}>✕</button>
          </div>
        </div>

        {/* Invoice body */}
        <div style={{ padding:"24px 28px" }}>
          {/* Header */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24, paddingBottom:20, borderBottom:"1px solid #1E293B" }}>
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                <div style={{ width:36, height:36, borderRadius:9, background:"linear-gradient(135deg,#FF6B00,#C94E0E)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <span style={{ fontWeight:900, fontSize:14, color:"#fff" }}>B</span>
                </div>
                <div>
                  <span style={{ fontWeight:900, fontSize:18, color:"#FF6B00" }}>BCPL</span>
                  <span style={{ fontWeight:900, fontSize:18, color:"#F1F5F9" }}>T20</span>
                </div>
              </div>
              <div style={{ fontSize:12, color:"#64748B" }}>Kriparti Playing11 Pvt. Ltd.</div>
              <div style={{ fontSize:11, color:"#475569", maxWidth:240, marginTop:3, lineHeight:1.5 }}>{BCPL_ADDR}</div>
              <div style={{ fontSize:11, color:"#475569", marginTop:4 }}>GSTIN: <span style={{ color:"#F59E0B", fontWeight:700 }}>{BCPL_GSTIN}</span></div>
              <div style={{ fontSize:11, color:"#475569" }}>HSN: <span style={{ color:"#94A3B8" }}>999299 — Sports Event Services</span></div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ background:"linear-gradient(135deg,#FF6B00,#D95E10)", borderRadius:10, padding:"6px 16px", display:"inline-block", marginBottom:10 }}>
                <span style={{ fontSize:12, fontWeight:900, color:"#fff", letterSpacing:.5 }}>TAX INVOICE</span>
              </div>
              <div style={{ fontSize:12, color:"#94A3B8" }}>Invoice No</div>
              <div style={{ fontSize:13, fontWeight:800, color:"#F1F5F9", marginBottom:8 }}>{invoiceNo}</div>
              <div style={{ fontSize:12, color:"#94A3B8" }}>Date: {today}</div>
              <div style={{ fontSize:11, color:"#475569", marginTop:4 }}>Place of Supply: All India</div>
            </div>
          </div>

          {/* Bill To */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:20 }}>
            <div style={{ background:"#060B18", borderRadius:12, padding:"14px 16px", border:"1px solid #1E293B" }}>
              <div style={{ fontSize:10, color:"#475569", fontWeight:700, textTransform:"uppercase", letterSpacing:.5, marginBottom:8 }}>Bill To</div>
              <div style={{ fontSize:15, fontWeight:700, color:"#F1F5F9" }}>{txn.name}</div>
              <div style={{ fontSize:12, color:"#64748B", marginTop:3 }}>{txn.email}</div>
              <div style={{ fontSize:12, color:"#64748B" }}>{txn.phone}</div>
              {txn.gstin && <div style={{ fontSize:12, color:"#F59E0B", marginTop:4, fontWeight:600 }}>GSTIN: {txn.gstin}</div>}
            </div>
            <div style={{ background:"#060B18", borderRadius:12, padding:"14px 16px", border:"1px solid #1E293B" }}>
              <div style={{ fontSize:10, color:"#475569", fontWeight:700, textTransform:"uppercase", letterSpacing:.5, marginBottom:8 }}>Payment Info</div>
              <div style={{ fontSize:12, color:"#94A3B8" }}>Method: <span style={{ color:"#F1F5F9", fontWeight:600 }}>{txn.method}</span></div>
              <div style={{ fontSize:12, color:"#94A3B8", marginTop:4 }}>TXN ID: <span style={{ color:"#F1F5F9", fontWeight:600, fontFamily:"monospace" }}>{txn.id}</span></div>
              <div style={{ fontSize:12, color:"#94A3B8", marginTop:4 }}>Time: <span style={{ color:"#F1F5F9" }}>{txn.time}</span></div>
              <div style={{ marginTop:8 }}><span style={{ fontSize:10, padding:"3px 10px", borderRadius:6, background:"#10B98122", color:"#10B981", fontWeight:700 }}>✓ Payment Confirmed</span></div>
            </div>
          </div>

          {/* Line Items */}
          <table style={{ width:"100%", borderCollapse:"collapse", marginBottom:16 }}>
            <thead>
              <tr style={{ background:"#0A1020", borderBottom:"1px solid #1E293B" }}>
                {["Description","HSN Code","Rate","Qty","Taxable Amt"].map(h=>(
                  <th key={h} style={{ padding:"9px 12px", textAlign:h==="Taxable Amt"?"right":"left", fontSize:10, color:"#94A3B8", fontWeight:700, textTransform:"uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom:"1px solid #1E293B" }}>
                <td style={{ padding:"13px 12px", fontSize:12, color:"#F1F5F9", lineHeight:1.5 }}>
                  BCPL T20 Season 5 — {txn.type} Registration<br/>
                  <span style={{ fontSize:11, color:"#475569" }}>{txn.type==="Phase 1" ? "Online Scout Review & Video Submission" : "Physical Trial Entry & Franchise Auction Eligibility"}</span>
                </td>
                <td style={{ padding:"13px 12px", fontSize:11, color:"#64748B", fontFamily:"monospace" }}>999299</td>
                <td style={{ padding:"13px 12px", fontSize:12, color:"#94A3B8" }}>₹{base.toLocaleString()}</td>
                <td style={{ padding:"13px 12px", fontSize:12, color:"#94A3B8" }}>1</td>
                <td style={{ padding:"13px 12px", fontSize:12, color:"#F1F5F9", textAlign:"right", fontWeight:600 }}>₹{base.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>

          {/* Tax Breakdown */}
          <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:20 }}>
            <div style={{ width:280, background:"#060B18", borderRadius:12, padding:"14px 16px", border:"1px solid #1E293B" }}>
              {[
                { l:"Subtotal (Base)", v:`₹${base.toLocaleString()}`, bold:false },
                { l:"CGST @ 9%",      v:`₹${cgst.toFixed(2)}`,       bold:false, color:"#6366F1" },
                { l:"SGST @ 9%",      v:`₹${sgst.toFixed(2)}`,       bold:false, color:"#6366F1" },
              ].map(r=>(
                <div key={r.l} style={{ display:"flex", justifyContent:"space-between", padding:"5px 0", borderBottom:"1px solid #1E293B" }}>
                  <span style={{ fontSize:12, color:"#64748B" }}>{r.l}</span>
                  <span style={{ fontSize:12, color:(r as any).color||"#94A3B8" }}>{r.v}</span>
                </div>
              ))}
              <div style={{ display:"flex", justifyContent:"space-between", padding:"10px 0 0", marginTop:4, borderTop:"2px solid #FF6B0044" }}>
                <span style={{ fontSize:14, fontWeight:800, color:"#F1F5F9" }}>Total</span>
                <span style={{ fontSize:18, fontWeight:900, color:"#FF6B00" }}>₹{total.toLocaleString()}</span>
              </div>
              <div style={{ fontSize:10, color:"#334155", marginTop:6, lineHeight:1.5 }}>
                Amount in words: <span style={{ color:"#475569" }}>Rupees {total === 353 ? "Three Hundred Fifty Three" : total === 470 ? "Four Hundred Seventy" : total === 2360 ? "Two Thousand Three Hundred Sixty" : total === 3540 ? "Three Thousand Five Hundred Forty" : total} Only</span>
              </div>
            </div>
          </div>

          <div style={{ padding:"12px 14px", background:"#0A1020", borderRadius:10, border:"1px solid #1E293B", fontSize:10, color:"#334155", lineHeight:1.6, marginBottom:20 }}>
            This is a computer-generated invoice and does not require a physical signature. Subject to Gurugram, Haryana jurisdiction.
          </div>

          {/* Send Section */}
          <div style={{ borderTop:"1px solid #1E293B", paddingTop:16 }}>
            <div style={{ fontSize:13, fontWeight:700, color:"#F1F5F9", marginBottom:10 }}>📧 Send to Player</div>
            {sent
              ? <div style={{ background:"#10B98122", border:"1px solid #10B98144", borderRadius:10, padding:"12px 16px", color:"#10B981", fontWeight:700, textAlign:"center" }}>✅ Invoice sent to {email}</div>
              : (
                <div style={{ display:"flex", gap:10 }}>
                  <input value={email} onChange={e=>setEmail(e.target.value)} style={{ flex:1, padding:"10px 14px", background:"#060B18", border:"1px solid #1E293B", borderRadius:10, color:"#F1F5F9", fontSize:13, outline:"none" }}/>
                  <button onClick={()=>{ setLoading(true); setTimeout(()=>{ setLoading(false); setSent(true); },1600); }} disabled={loading} style={{ padding:"10px 20px", borderRadius:10, border:"none", background:"linear-gradient(135deg,#FF6B00,#FF8C40)", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer" }}>
                    {loading ? "Sending…" : "Send Invoice"}
                  </button>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main View ──────────────────────────────────────────────── */
export default function FinanceView() {
  type Tab = "overview"|"pl"|"gst"|"invoices"|"refunds"|"tds";
  const [tab,       setTab]       = useState<Tab>("overview");
  const [txnFilter, setTxnFilter] = useState<"all"|"success"|"pending"|"failed"|"refunded">("all");
  const [invoice,   setInvoice]   = useState<Txn|null>(null);
  const [search,    setSearch]    = useState("");

  const totalRevenue  = TRANSACTIONS.filter(t=>t.status==="success").reduce((a,t)=>a+t.amount,0);
  const totalGST      = Math.round(totalRevenue * GST_RATE);
  const totalGW       = Math.round(totalRevenue * CF_FEE);
  const netRevenue    = totalRevenue - totalGST - totalGW;
  const totalRefunds  = REFUNDS.reduce((a,r)=>a+(r.status==="processed"?r.amount:0),0);

  const filtered = TRANSACTIONS.filter(t => {
    const statusOk = txnFilter === "all" || t.status === txnFilter;
    const searchOk = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.id.toLowerCase().includes(search.toLowerCase());
    return statusOk && searchOk;
  });

  const card: React.CSSProperties = { background:"linear-gradient(135deg,#0D1526 0%,#0A1020 100%)", border:"1px solid #1E293B", borderRadius:16, padding:20 };
  const TABS: [Tab, string][] = [
    ["overview","📊 Overview"],["pl","💹 P&L Report"],["gst","🏛 GST Compliance"],
    ["invoices","📄 Invoices"],["refunds","↩ Refunds"],["tds","📋 TDS"],
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

      {/* ── Header ── */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <div style={{ fontSize:20, fontWeight:800, color:"#F1F5F9" }}>Finance & GST</div>
          <div style={{ fontSize:12, color:"#64748B", marginTop:2 }}>Revenue · P&L · GST Compliance · Invoices · Refunds · TDS</div>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={()=>{
            const headers=["TXN ID","Player","Email","Phone","Type","Amount","GST","Total","Method","Status","Time"];
            const rows=TRANSACTIONS.map(t=>[t.id,t.name,t.email,t.phone,t.type,t.amount,Math.round(t.amount*GST_RATE),Math.round(t.amount*(1+GST_RATE)),t.method,t.status,t.time]);
            const csv=[headers,...rows].map(r=>r.join(",")).join("\n");
            const a=document.createElement("a");a.href="data:text/csv;charset=utf-8,"+encodeURIComponent(csv);a.download=`bcpl_finance_${new Date().toISOString().slice(0,10)}.csv`;a.click();
          }} style={{ padding:"9px 16px", borderRadius:9, border:"1px solid #1E293B", background:"transparent", color:"#94A3B8", fontSize:12, cursor:"pointer" }}>⬇ Export CSV</button>
          <button onClick={()=>{
            const w=window.open("","_blank");if(!w)return;
            const rows=TRANSACTIONS.filter(t=>t.status==="success").map((t,i)=>{const gst=Math.round(t.amount*GST_RATE);const total=t.amount+gst;return`<tr><td>BCPL/25-26/${t.id}</td><td>${t.name}</td><td>${t.email}</td><td>${t.type}</td><td>₹${t.amount.toLocaleString()}</td><td>₹${gst}</td><td style="font-weight:bold;color:#FF6B00">₹${total.toLocaleString()}</td></tr>`;}).join("");
            w.document.write(`<!DOCTYPE html><html><head><title>BCPL Bulk Invoices</title><style>body{font-family:Arial;font-size:11px;padding:20px}.header{display:flex;align-items:center;gap:16px;border-bottom:3px solid #FF6B00;padding-bottom:12px;margin-bottom:20px}.logo{width:52px;height:52px;border-radius:50%;overflow:hidden;border:2px solid #FF6B00}.logo img{width:100%;height:100%;object-fit:cover}h1{margin:0;font-size:18px;color:#FF6B00}p{margin:2px 0;font-size:10px;color:#555}table{width:100%;border-collapse:collapse}th{background:#FF6B00;color:#fff;padding:7px;text-align:left;font-size:10px}td{padding:6px;border-bottom:1px solid #eee;font-size:10px}tr:nth-child(even){background:#FFF5EE}.footer{margin-top:20px;font-size:9px;color:#999;border-top:1px solid #eee;padding-top:10px}@media print{body{padding:0}}</style></head><body>
            <div class="header"><div class="logo"><img src="/bcpl-website/bcpl-assets/bcpl-ball-color.jpg"/></div>
            <div><h1>BCPL T20 — Bulk GST Invoices</h1><p>Kriparti Playing11 Private Limited · GSTIN: ${BCPL_GSTIN}</p><p>Season 5 (2026–27) · Generated: ${new Date().toLocaleDateString("en-IN")}</p></div></div>
            <table><thead><tr><th>Invoice No</th><th>Player</th><th>Email</th><th>Phase</th><th>Base Amt</th><th>GST (18%)</th><th>Total</th></tr></thead><tbody>${rows||"<tr><td colspan=7 style='text-align:center;padding:20px;color:#999'>No successful transactions yet</td></tr>"}</tbody></table>
            <div class="footer">${BCPL_ADDR}</div></body></html>`);w.document.close();setTimeout(()=>w.print(),500);
          }} style={{ padding:"9px 16px", borderRadius:9, border:"1px solid #1E293B", background:"transparent", color:"#94A3B8", fontSize:12, cursor:"pointer" }}>📄 Bulk Invoices</button>
          <button onClick={()=>{
            const w=window.open("","_blank");if(!w)return;
            const rows=TRANSACTIONS.filter(t=>t.status==="success").map(t=>{const gst=Math.round(t.amount*GST_RATE);return`<tr><td>${t.id}</td><td>${t.name}</td><td>${t.gstin||"B2C"}</td><td>${t.type}</td><td>999299</td><td>18%</td><td>₹${t.amount}</td><td>₹${Math.round(gst/2)}</td><td>₹${Math.round(gst/2)}</td><td>₹${gst}</td></tr>`;}).join("");
            w.document.write(`<!DOCTYPE html><html><head><title>BCPL GSTR-1</title><style>body{font-family:Arial;font-size:10px;padding:20px}.header{display:flex;align-items:center;gap:16px;border-bottom:3px solid #FF6B00;padding-bottom:12px;margin-bottom:16px}.logo{width:48px;height:48px;border-radius:50%;overflow:hidden;border:2px solid #FF6B00}.logo img{width:100%;height:100%;object-fit:cover}h1{margin:0;font-size:16px;color:#FF6B00}p{margin:2px 0;font-size:9px;color:#555}table{width:100%;border-collapse:collapse;font-size:9px}th{background:#FF6B00;color:#fff;padding:5px;text-align:left}td{padding:4px 6px;border-bottom:1px solid #eee}.footer{margin-top:16px;font-size:8px;color:#999}@media print{body{padding:0}}</style></head><body>
            <div class="header"><div class="logo"><img src="/bcpl-website/bcpl-assets/bcpl-ball-color.jpg"/></div>
            <div><h1>GSTR-1 Report — Outward Supply</h1><p>Kriparti Playing11 Private Limited · GSTIN: ${BCPL_GSTIN}</p><p>FY 2026–27 · Filed under Form GSTR-1 · Generated: ${new Date().toLocaleDateString("en-IN")}</p></div></div>
            <table><thead><tr><th>TXN ID</th><th>Customer</th><th>GSTIN/Type</th><th>Description</th><th>HSN</th><th>Rate</th><th>Taxable</th><th>CGST</th><th>SGST</th><th>Total GST</th></tr></thead><tbody>${rows||"<tr><td colspan=10 style='text-align:center;padding:20px;color:#999'>No transactions yet</td></tr>"}</tbody></table>
            <div class="footer">${BCPL_ADDR}</div></body></html>`);w.document.close();setTimeout(()=>w.print(),500);
          }} style={{ padding:"9px 16px", borderRadius:9, border:"none", background:"linear-gradient(135deg,#FF6B00,#FF8C40)", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer" }}>📥 GSTR-1 Report</button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:10 }}>
        {[
          { label:"Total Revenue",    value:totalRevenue>0?`₹${(totalRevenue/100000).toFixed(2)}L`:"₹0", sub:`${TRANSACTIONS.filter(t=>t.status==="success").length} paid txns`, color:"#FF6B00", delta:"Season 5" },
          { label:"Net Revenue",      value:netRevenue>0?`₹${(netRevenue/1000).toFixed(1)}k`:"₹0", sub:"After GST & gateway fee",color:"#10B981",delta:"After deductions"},
          { label:"GST Collected",    value:totalGST>0?`₹${(totalGST/1000).toFixed(1)}k`:"₹0",    sub:"18% on all payments",    color:"#6366F1", delta:"FY 26-27" },
          { label:"Gateway Fees",     value:totalGW>0?`₹${(totalGW/1000).toFixed(1)}k`:"₹0",      sub:"Cashfree 2% fee",        color:"#F59E0B", delta:"CF charges" },
          { label:"Total Refunds",    value:`₹${totalRefunds}`,                  sub:`${REFUNDS.length} refund requests`,color:"#EF4444",delta:REFUNDS.length>0?`-₹${totalRefunds}`:"No refunds"},
          { label:"Pending Clearance",value:"₹0",                                sub:"Cashfree settlement",    color:"#3B82F6", delta:"T+2 days"  },
        ].map(s=>(
          <div key={s.label} style={{ ...card, padding:"14px 16px", borderTop:`3px solid ${s.color}` }}>
            <div style={{ fontSize:20, fontWeight:800, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:10, color:"#F1F5F9", fontWeight:600, marginTop:3 }}>{s.label}</div>
            <div style={{ display:"flex", justifyContent:"space-between", marginTop:6 }}>
              <span style={{ fontSize:9, color:"#334155" }}>{s.sub}</span>
              <span style={{ fontSize:10, fontWeight:700, color:s.delta.startsWith("+")?"#10B981":s.delta.startsWith("-")?"#EF4444":"#6366F1" }}>{s.delta}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
        {TABS.map(([t,l])=>(
          <button key={t} onClick={()=>setTab(t)} style={{ padding:"8px 16px", borderRadius:10, border:`1px solid ${tab===t?"#FF6B00":"#1E293B"}`, background:tab===t?"#FF6B0022":"transparent", color:tab===t?"#FF6B00":"#64748B", fontSize:12, fontWeight:700, cursor:"pointer" }}>{l}</button>
        ))}
      </div>

      {/* ══════════ OVERVIEW ══════════ */}
      {tab==="overview"&&(
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:14 }}>
            <div style={card}>
              <div style={{ fontSize:14, fontWeight:700, color:"#F1F5F9", marginBottom:4 }}>Daily Revenue — Last 7 Days</div>
              <div style={{ fontSize:11, color:"#475569", marginBottom:14 }}>Phase 1 vs Phase 2 vs Refunds</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={dailyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B"/>
                  <XAxis dataKey="day" stroke="#334155" tick={{ fill:"#64748B", fontSize:11 }}/>
                  <YAxis stroke="#334155" tick={{ fill:"#64748B", fontSize:10 }} tickFormatter={v=>`₹${(v/1000).toFixed(0)}k`}/>
                  <Tooltip contentStyle={{ background:"#0D1526", border:"1px solid #1E293B", borderRadius:8 }} formatter={(v:any,n:string)=>[`₹${Number(v).toLocaleString()}`, n==="p1"?"Phase 1":n==="p2"?"Phase 2":"Refunds"]}/>
                  <Bar dataKey="p1"      fill="#F59E0B" radius={[4,4,0,0]} name="p1"/>
                  <Bar dataKey="p2"      fill="#10B981" radius={[4,4,0,0]} name="p2"/>
                  <Bar dataKey="refunds" fill="#EF444460" radius={[4,4,0,0]} name="refunds"/>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <div style={card}>
                <div style={{ fontSize:14, fontWeight:700, color:"#F1F5F9", marginBottom:12 }}>Payment Split</div>
                <ResponsiveContainer width="100%" height={120}>
                  <PieChart>
                    <Pie data={paymentMethods} cx="50%" cy="50%" innerRadius={30} outerRadius={52} dataKey="value" strokeWidth={0}>
                      {paymentMethods.map((m,i)=><Cell key={i} fill={m.color}/>)}
                    </Pie>
                    <Tooltip formatter={(v:any)=>[`${v}%`,""]} contentStyle={{ background:"#0D1526", border:"1px solid #1E293B", borderRadius:8 }}/>
                  </PieChart>
                </ResponsiveContainer>
                {paymentMethods.map(m=>(
                  <div key={m.name} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:6 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}><div style={{ width:8, height:8, borderRadius:2, background:m.color }}/><span style={{ fontSize:11, color:"#94A3B8" }}>{m.name}</span></div>
                    <span style={{ fontSize:12, fontWeight:700, color:"#F1F5F9" }}>{m.value}%</span>
                  </div>
                ))}
              </div>
              <div style={{ ...card, padding:"14px 16px" }}>
                <div style={{ fontSize:12, fontWeight:700, color:"#F1F5F9", marginBottom:10 }}>Settlement Status</div>
                {[{l:"Settled Today",v:"₹0",c:"#10B981"},{l:"In Transit (T+2)",v:"₹0",c:"#F59E0B"},{l:"On Hold",v:"₹0",c:"#EF4444"}].map(s=>(
                  <div key={s.l} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:"1px solid #1E293B" }}>
                    <span style={{ fontSize:11, color:"#64748B" }}>{s.l}</span>
                    <span style={{ fontSize:12, fontWeight:700, color:s.c }}>{s.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Transaction log */}
          <div style={card}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14, flexWrap:"wrap", gap:10 }}>
              <div style={{ fontSize:14, fontWeight:700, color:"#F1F5F9" }}>Transaction Log</div>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name / TXN…" style={{ padding:"7px 12px", background:"#060B18", border:"1px solid #1E293B", borderRadius:9, color:"#F1F5F9", fontSize:12, outline:"none", width:200 }}/>
                {(["all","success","pending","failed","refunded"] as const).map(f=>(
                  <button key={f} onClick={()=>setTxnFilter(f)} style={{ padding:"5px 12px", borderRadius:7, border:`1px solid ${txnFilter===f?(f==="all"?"#FF6B00":SC[f]?.color||"#FF6B00"):"#1E293B"}`, background:txnFilter===f?((f==="all"?"#FF6B00":SC[f]?.color||"#FF6B00")+"22"):"transparent", color:txnFilter===f?(f==="all"?"#FF6B00":SC[f]?.color):"#64748B", fontSize:11, fontWeight:700, cursor:"pointer", textTransform:"capitalize" }}>{f}</button>
                ))}
              </div>
            </div>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr style={{ borderBottom:"1px solid #1E293B" }}>
                  {["Txn ID","Player","Phase","Amount","Gateway Fee","GST","Net","Method","Status","Invoice"].map(h=>(
                    <th key={h} style={{ padding:"8px 10px", textAlign:"left", fontSize:10, color:"#475569", fontWeight:700, textTransform:"uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(t=>{
                  const gw  = Math.round(t.amount * CF_FEE);
                  const gst = Math.round(t.amount * GST_RATE);
                  const net = t.amount - gw - gst;
                  return (
                    <tr key={t.id} style={{ borderBottom:"1px solid #0F1B2D" }}>
                      <td style={{ padding:"10px 10px", fontFamily:"monospace", fontSize:11, color:"#475569" }}>{t.id}</td>
                      <td style={{ padding:"10px 10px" }}>
                        <div style={{ fontSize:13, fontWeight:600, color:"#F1F5F9" }}>{t.name}</div>
                        <div style={{ fontSize:10, color:"#475569" }}>{t.phone}</div>
                      </td>
                      <td style={{ padding:"10px 10px" }}><span style={{ fontSize:11, padding:"2px 8px", borderRadius:4, background:t.type==="Phase 2"?"#10B98122":"#F59E0B22", color:t.type==="Phase 2"?"#10B981":"#F59E0B", fontWeight:700 }}>{t.type}</span></td>
                      <td style={{ padding:"10px 10px", fontSize:14, fontWeight:800, color:"#FF6B00" }}>₹{t.amount.toLocaleString()}</td>
                      <td style={{ padding:"10px 10px", fontSize:11, color:"#EF4444" }}>-₹{gw}</td>
                      <td style={{ padding:"10px 10px", fontSize:11, color:"#6366F1" }}>₹{gst}</td>
                      <td style={{ padding:"10px 10px", fontSize:12, fontWeight:700, color:"#10B981" }}>₹{net}</td>
                      <td style={{ padding:"10px 10px", fontSize:12, color:"#94A3B8" }}>{t.method}</td>
                      <td style={{ padding:"10px 10px" }}><span style={{ padding:"3px 10px", borderRadius:20, fontSize:10, fontWeight:800, background:SC[t.status].bg, color:SC[t.status].color, textTransform:"capitalize" }}>{t.status}</span></td>
                      <td style={{ padding:"10px 10px" }}>
                        {t.status==="success"
                          ? <button onClick={()=>setInvoice(t)} style={{ padding:"4px 10px", borderRadius:6, border:"1px solid #FF6B0044", background:"#FF6B0011", color:"#FF6B00", fontSize:11, cursor:"pointer", fontWeight:700 }}>📄 GST</button>
                          : <span style={{ fontSize:10, color:"#334155" }}>—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════ P&L REPORT ══════════ */}
      {tab==="pl"&&(
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
            {[
              { l:"Gross Revenue",  v:totalRevenue>0?`₹${(totalRevenue/100000).toFixed(2)}L`:"₹0", c:"#FF6B00", sub:"FY 2026-27" },
              { l:"GST Payable",    v:totalGST>0?`-₹${totalGST.toLocaleString()}`:"₹0",            c:"#6366F1", sub:"18% collected" },
              { l:"Gateway Fees",   v:totalGW>0?`-₹${totalGW.toLocaleString()}`:"₹0",              c:"#EF4444", sub:"Cashfree 2%" },
              { l:"Net Revenue",    v:netRevenue>0?`₹${(netRevenue/100000).toFixed(2)}L`:"₹0",     c:"#10B981", sub:"After deductions" },
            ].map(s=>(
              <div key={s.l} style={{ ...card, borderTop:`3px solid ${s.c}` }}>
                <div style={{ fontSize:22, fontWeight:800, color:s.c }}>{s.v}</div>
                <div style={{ fontSize:12, color:"#F1F5F9", fontWeight:600, marginTop:4 }}>{s.l}</div>
                <div style={{ fontSize:10, color:"#475569", marginTop:4 }}>{s.sub}</div>
              </div>
            ))}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:14 }}>
            <div style={card}>
              <div style={{ fontSize:14, fontWeight:700, color:"#F1F5F9", marginBottom:4 }}>Monthly P&L Summary</div>
              <div style={{ fontSize:11, color:"#475569", marginBottom:16 }}>Revenue vs costs vs net profit per month</div>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={monthlyPL}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#FF6B00" stopOpacity={0.3}/><stop offset="95%" stopColor="#FF6B00" stopOpacity={0}/></linearGradient>
                    <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/><stop offset="95%" stopColor="#10B981" stopOpacity={0}/></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B"/>
                  <XAxis dataKey="month" stroke="#334155" tick={{ fill:"#64748B", fontSize:11 }}/>
                  <YAxis stroke="#334155" tick={{ fill:"#64748B", fontSize:10 }} tickFormatter={v=>`₹${(v/1000).toFixed(0)}k`}/>
                  <Tooltip contentStyle={{ background:"#0D1526", border:"1px solid #1E293B", borderRadius:8 }} formatter={(v:any)=>[`₹${Number(v).toLocaleString()}`,""]}/>
                  <Area type="monotone" dataKey="revenue" stroke="#FF6B00" fill="url(#revGrad)" strokeWidth={2} name="Revenue"/>
                  <Area type="monotone" dataKey="net"     stroke="#10B981" fill="url(#netGrad)" strokeWidth={2} name="Net"/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <div style={{ fontSize:14, fontWeight:700, color:"#F1F5F9", marginBottom:14 }}>Monthly Breakdown</div>
              {monthlyPL.map(m=>(
                <div key={m.month} style={{ padding:"12px 0", borderBottom:"1px solid #1E293B" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                    <span style={{ fontSize:13, fontWeight:700, color:"#F1F5F9" }}>{m.month} 2026</span>
                    <span style={{ fontSize:13, fontWeight:800, color:"#10B981" }}>₹{m.net.toLocaleString()}</span>
                  </div>
                  <div style={{ display:"flex", gap:12 }}>
                    <span style={{ fontSize:10, color:"#64748B" }}>Rev: <span style={{ color:"#FF6B00" }}>₹{m.revenue.toLocaleString()}</span></span>
                    <span style={{ fontSize:10, color:"#64748B" }}>GST: <span style={{ color:"#6366F1" }}>-₹{m.gstPaid.toLocaleString()}</span></span>
                    <span style={{ fontSize:10, color:"#64748B" }}>GW: <span style={{ color:"#EF4444" }}>-₹{m.gatewayCost.toLocaleString()}</span></span>
                  </div>
                </div>
              ))}
              <div style={{ marginTop:12, padding:"10px 12px", background:"#1E293B22", border:"1px solid #1E293B", borderRadius:10 }}>
                <div style={{ fontSize:11, color:"#64748B", fontWeight:700 }}>No transactions yet</div>
                <div style={{ fontSize:10, color:"#475569", marginTop:2 }}>P&L will auto-update as Cashfree payments come in</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ GST COMPLIANCE ══════════ */}
      {tab==="gst"&&(
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
            {[
              { l:"Total GST Collected", v:totalGST>0?`₹${(totalGST/1000).toFixed(1)}k`:"₹0", c:"#6366F1", sub:"FY 2026-27" },
              { l:"CGST (9%)",           v:`₹${(totalGST/2/1000).toFixed(1)}k`,c:"#FF6B00", sub:"Central GST share" },
              { l:"SGST (9%)",           v:`₹${(totalGST/2/1000).toFixed(1)}k`,c:"#10B981", sub:"State GST share" },
              { l:"Next GSTR-1 Due",     v:"11 Aug",                             c:"#F59E0B", sub:"File before due date" },
            ].map(s=>(
              <div key={s.l} style={{ ...card, borderTop:`3px solid ${s.c}` }}>
                <div style={{ fontSize:22, fontWeight:800, color:s.c }}>{s.v}</div>
                <div style={{ fontSize:11, color:"#64748B", marginTop:3 }}>{s.l}</div>
                <div style={{ fontSize:10, color:"#334155", marginTop:5 }}>{s.sub}</div>
              </div>
            ))}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:14 }}>
            <div style={card}>
              <div style={{ fontSize:14, fontWeight:700, color:"#F1F5F9", marginBottom:4 }}>Monthly GST Collected vs Remitted</div>
              <div style={{ fontSize:11, color:"#475569", marginBottom:16 }}>GSTR-1 compliance tracking</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={gstMonthly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B"/>
                  <XAxis dataKey="month" stroke="#334155" tick={{ fill:"#64748B", fontSize:11 }}/>
                  <YAxis stroke="#334155" tick={{ fill:"#64748B", fontSize:10 }} tickFormatter={v=>`₹${(v/1000).toFixed(0)}k`}/>
                  <Tooltip contentStyle={{ background:"#0D1526", border:"1px solid #1E293B", borderRadius:8 }} formatter={(v:any)=>[`₹${Number(v).toLocaleString()}`,""]}/>
                  <Bar dataKey="collected" fill="#6366F1" radius={[4,4,0,0]} name="Collected"/>
                  <Bar dataKey="remitted"  fill="#10B981" radius={[4,4,0,0]} name="Remitted"/>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <div style={card}>
                <div style={{ fontSize:13, fontWeight:700, color:"#F1F5F9", marginBottom:14 }}>BCPL GST Registration</div>
                {[
                  { l:"Business",    v:"Kriparti Playing11 Pvt. Ltd." },
                  { l:"GSTIN",       v:BCPL_GSTIN },
                  { l:"Type",        v:"Regular Taxpayer" },
                  { l:"State",       v:"Haryana (07)" },
                  { l:"HSN Code",    v:"999299 — Sports Services" },
                  { l:"GST Rate",    v:"18% (CGST 9% + SGST 9%)" },
                ].map(r=>(
                  <div key={r.l} style={{ padding:"8px 0", borderBottom:"1px solid #1E293B" }}>
                    <div style={{ fontSize:10, color:"#475569", fontWeight:700 }}>{r.l}</div>
                    <div style={{ fontSize:12, color:"#F1F5F9", marginTop:2, fontWeight:600, fontFamily:r.l==="GSTIN"?"monospace":"inherit" }}>{r.v}</div>
                  </div>
                ))}
              </div>
              <div style={card}>
                <div style={{ fontSize:13, fontWeight:700, color:"#F1F5F9", marginBottom:10 }}>Filing Status</div>
                {gstMonthly.map(m=>(
                  <div key={m.month} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"7px 0", borderBottom:"1px solid #1E293B" }}>
                    <span style={{ fontSize:12, color:"#94A3B8" }}>GSTR-1 {m.month}</span>
                    <span style={{ fontSize:10, padding:"2px 9px", borderRadius:6, fontWeight:700, background:m.due==="Paid"?"#10B98122":m.due==="Partial"?"#F59E0B22":"#EF444422", color:m.due==="Paid"?"#10B981":m.due==="Partial"?"#F59E0B":"#EF4444" }}>{m.due}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ INVOICES ══════════ */}
      {tab==="invoices"&&(
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div style={{ display:"flex", gap:10, alignItems:"center" }}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by player name or TXN ID…" style={{ flex:1, padding:"10px 14px", background:"#0D1526", border:"1px solid #1E293B", borderRadius:10, color:"#F1F5F9", fontSize:13, outline:"none" }}/>
            <button style={{ padding:"10px 18px", borderRadius:10, border:"1px solid #1E293B", background:"transparent", color:"#94A3B8", fontSize:12, cursor:"pointer" }}>⬇ Bulk Download</button>
            <button style={{ padding:"10px 18px", borderRadius:10, border:"none", background:"linear-gradient(135deg,#FF6B00,#FF8C40)", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer" }}>📧 Send All</button>
          </div>
          <div style={card}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:14 }}>
              <div style={{ fontSize:14, fontWeight:700, color:"#F1F5F9" }}>All GST Invoices</div>
              <span style={{ fontSize:11, color:"#64748B" }}>{TRANSACTIONS.filter(t=>t.status==="success").length} invoices generated</span>
            </div>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr style={{ borderBottom:"1px solid #1E293B" }}>
                  {["Invoice No","Player","Phase","Base","GST (18%)","GW Fee","Net","Total Charged","Action"].map(h=>(
                    <th key={h} style={{ padding:"8px 10px", textAlign:"left", fontSize:10, color:"#475569", fontWeight:700, textTransform:"uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TRANSACTIONS.filter(t=>t.status==="success").map(t=>{
                  const gst = Math.round(t.amount * GST_RATE);
                  const gw  = Math.round(t.amount * CF_FEE);
                  return (
                    <tr key={t.id} style={{ borderBottom:"1px solid #0F1B2D" }}>
                      <td style={{ padding:"10px 10px", fontFamily:"monospace", fontSize:11, color:"#6366F1" }}>BCPL/25-26/{t.id}</td>
                      <td style={{ padding:"10px 10px", fontSize:13, fontWeight:600, color:"#F1F5F9" }}>{t.name}</td>
                      <td style={{ padding:"10px 10px" }}><span style={{ fontSize:11, padding:"2px 8px", borderRadius:4, background:t.type==="Phase 2"?"#10B98122":"#F59E0B22", color:t.type==="Phase 2"?"#10B981":"#F59E0B", fontWeight:700 }}>{t.type}</span></td>
                      <td style={{ padding:"10px 10px", fontSize:12, color:"#94A3B8" }}>₹{t.amount.toLocaleString()}</td>
                      <td style={{ padding:"10px 10px", fontSize:12, color:"#6366F1" }}>₹{gst}</td>
                      <td style={{ padding:"10px 10px", fontSize:12, color:"#EF4444" }}>₹{gw}</td>
                      <td style={{ padding:"10px 10px", fontSize:12, fontWeight:700, color:"#10B981" }}>₹{(t.amount-gst-gw).toLocaleString()}</td>
                      <td style={{ padding:"10px 10px", fontSize:13, fontWeight:800, color:"#FF6B00" }}>₹{(t.amount+gst).toLocaleString()}</td>
                      <td style={{ padding:"10px 10px" }}>
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

      {/* ══════════ REFUNDS ══════════ */}
      {tab==="refunds"&&(
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
            {[
              { l:"Total Refund Requests", v:REFUNDS.length,                                      c:"#F59E0B" },
              { l:"Processed",             v:REFUNDS.filter(r=>r.status==="processed").length,    c:"#10B981" },
              { l:"Pending",               v:REFUNDS.filter(r=>r.status==="pending").length,      c:"#EF4444" },
              { l:"Amount Refunded",       v:`₹${REFUNDS.filter(r=>r.status==="processed").reduce((a,r)=>a+r.amount,0)}`, c:"#6366F1" },
            ].map(s=>(
              <div key={s.l} style={{ ...card, borderTop:`3px solid ${s.c}` }}>
                <div style={{ fontSize:22, fontWeight:800, color:s.c }}>{s.v}</div>
                <div style={{ fontSize:11, color:"#64748B", marginTop:4 }}>{s.l}</div>
              </div>
            ))}
          </div>
          <div style={card}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:14 }}>
              <div style={{ fontSize:14, fontWeight:700, color:"#F1F5F9" }}>Refund Requests</div>
              <button style={{ padding:"7px 14px", borderRadius:9, border:"none", background:"linear-gradient(135deg,#FF6B00,#FF8C40)", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer" }}>+ Process Batch</button>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {REFUNDS.map(r=>(
                <div key={r.id} style={{ padding:"16px", background:"#060B18", borderRadius:12, border:`1px solid ${r.status==="pending"?"#EF444430":"#1E293B"}` }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                    <div>
                      <div style={{ display:"flex", align:"center", gap:10, marginBottom:4 }}>
                        <span style={{ fontSize:13, fontWeight:700, color:"#F1F5F9" }}>{r.name}</span>
                        <span style={{ fontFamily:"monospace", fontSize:11, color:"#475569", marginLeft:8 }}>{r.txnId}</span>
                      </div>
                      <div style={{ fontSize:12, color:"#64748B" }}>Reason: {r.reason}</div>
                      <div style={{ fontSize:11, color:"#475569", marginTop:3 }}>Requested: {r.date} · Via: {r.method}</div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontSize:18, fontWeight:900, color:r.status==="processed"?"#10B981":"#F59E0B" }}>₹{r.amount}</div>
                      <span style={{ fontSize:10, padding:"2px 9px", borderRadius:6, fontWeight:700, background:r.status==="processed"?"#10B98122":"#EF444422", color:r.status==="processed"?"#10B981":"#EF4444" }}>{r.status==="processed"?"✓ Processed":"⏳ Pending"}</span>
                    </div>
                  </div>
                  {r.status==="pending"&&(
                    <div style={{ display:"flex", gap:8, marginTop:8 }}>
                      <button style={{ padding:"6px 16px", borderRadius:8, border:"none", background:"#10B98122", color:"#10B981", fontSize:12, fontWeight:700, cursor:"pointer" }}>✓ Approve & Process</button>
                      <button style={{ padding:"6px 14px", borderRadius:8, border:"1px solid #1E293B", background:"transparent", color:"#64748B", fontSize:12, cursor:"pointer" }}>Reject</button>
                    </div>
                  )}
                  {r.status==="processed"&&<div style={{ fontSize:11, color:"#10B981", marginTop:4 }}>✓ Refunded in {r.days} days via {r.method}</div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════ TDS ══════════ */}
      {tab==="tds"&&(
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div style={{ ...card, borderLeft:"3px solid #F59E0B", background:"linear-gradient(135deg,#0D1526,#1A1208)" }}>
            <div style={{ fontSize:13, fontWeight:700, color:"#F59E0B", marginBottom:6 }}>⚠ TDS on Prize Money (Section 194B — 30%)</div>
            <div style={{ fontSize:12, color:"#64748B", lineHeight:1.7 }}>
              As per Indian Income Tax Act, TDS @ 30% is applicable on prize money exceeding ₹10,000. BCPL must deduct TDS before disbursing prize amounts and file Form 27Q quarterly.<br/>
              <strong style={{ color:"#94A3B8" }}>Next TDS filing due: 31st July 2026 (Q1 FY 2026-27)</strong>
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
            {[
              { l:"Total Prize Disbursed", v:"₹2,00,000", c:"#FF6B00" },
              { l:"TDS Deducted (30%)",    v:"₹20,000",   c:"#EF4444" },
              { l:"Net Prize Paid",        v:"₹1,80,000", c:"#10B981" },
              { l:"Pending TDS Deposit",   v:"₹12,000",   c:"#F59E0B" },
            ].map(s=>(
              <div key={s.l} style={{ ...card, borderTop:`3px solid ${s.c}` }}>
                <div style={{ fontSize:22, fontWeight:800, color:s.c }}>{s.v}</div>
                <div style={{ fontSize:11, color:"#64748B", marginTop:4 }}>{s.l}</div>
              </div>
            ))}
          </div>
          <div style={card}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:14 }}>
              <div style={{ fontSize:14, fontWeight:700, color:"#F1F5F9" }}>Prize TDS Records</div>
              <button style={{ padding:"7px 14px", borderRadius:9, border:"1px solid #1E293B", background:"transparent", color:"#94A3B8", fontSize:12, cursor:"pointer" }}>⬇ Form 27Q</button>
            </div>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr style={{ borderBottom:"1px solid #1E293B" }}>
                  {["Player / Entity","PAN","Prize Amount","TDS (30%)","Net Paid","Status"].map(h=>(
                    <th key={h} style={{ padding:"8px 10px", textAlign:"left", fontSize:10, color:"#475569", fontWeight:700, textTransform:"uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TDS_PRIZES.map((t,i)=>(
                  <tr key={i} style={{ borderBottom:"1px solid #0F1B2D" }}>
                    <td style={{ padding:"11px 10px", fontSize:13, fontWeight:600, color:"#F1F5F9" }}>{t.player}</td>
                    <td style={{ padding:"11px 10px", fontFamily:"monospace", fontSize:12, color:"#F59E0B" }}>{t.pan}</td>
                    <td style={{ padding:"11px 10px", fontSize:13, color:"#FF6B00", fontWeight:700 }}>{t.prize}</td>
                    <td style={{ padding:"11px 10px", fontSize:13, color:"#EF4444", fontWeight:700 }}>{t.tds}</td>
                    <td style={{ padding:"11px 10px", fontSize:13, color:"#10B981", fontWeight:700 }}>{t.net}</td>
                    <td style={{ padding:"11px 10px" }}><span style={{ fontSize:10, padding:"3px 10px", borderRadius:6, fontWeight:700, background:t.status==="Deducted"?"#10B98122":"#F59E0B22", color:t.status==="Deducted"?"#10B981":"#F59E0B" }}>{t.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {invoice && <InvoiceModal txn={invoice} onClose={()=>setInvoice(null)}/>}
    </div>
  );
}

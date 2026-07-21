import { useState } from "react";

const CITIES: { city:string; date:string; venue:string; slots:number; filled:number; waitlist:number; status:string; region:string }[] = [];

const statusColor = (s: string) =>
  s==="Full"?"#EF4444":s==="Almost Full"?"#F59E0B":"#10B981";

export default function TrialCitiesView() {
  const [sel,   setSel]   = useState<number|null>(null);
  const [addOpen, setAdd] = useState(false);
  const card: React.CSSProperties = { background:"linear-gradient(135deg,#0D1526,#0A1020)", border:"1px solid #1E293B", borderRadius:16, padding:20 };

  const totSlots = CITIES.reduce((a,c)=>a+c.slots,0);
  const totFilled= CITIES.reduce((a,c)=>a+c.filled,0);
  const totWait  = CITIES.reduce((a,c)=>a+c.waitlist,0);
  const fillPct  = totSlots > 0 ? Math.round(totFilled/totSlots*100) : 0;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <div style={{ fontSize:20, fontWeight:800, color:"#F1F5F9" }}>Trial City Manager</div>
          <div style={{ fontSize:12, color:"#64748B", marginTop:2 }}>Manage trial venues, slots, check-in QR codes and waitlists city-wise</div>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button style={{ padding:"9px 16px", borderRadius:9, border:"1px solid #1E293B", background:"transparent", color:"#94A3B8", fontSize:12, cursor:"pointer" }}>⬇ Export All Registrations</button>
          <button onClick={()=>setAdd(true)} style={{ padding:"9px 16px", borderRadius:9, border:"none", background:"linear-gradient(135deg,#FF6B00,#FF8C40)", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer" }}>+ Add City</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
        {[
          { label:"Total Cities",     value:CITIES.length,                 color:"#6366F1" },
          { label:"Total Slots",      value:totSlots || 0,                 color:"#FF6B00" },
          { label:"Filled / Booked",  value:`${totFilled} (${fillPct}%)`,  color:"#10B981" },
          { label:"On Waitlist",      value:totWait,                       color:"#F59E0B" },
        ].map(s=>(
          <div key={s.label} style={{ ...card, borderTop:`3px solid ${s.color}` }}>
            <div style={{ fontSize:24, fontWeight:800, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:11, color:"#64748B", marginTop:5 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* City Grid */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:12 }}>
        {CITIES.map((c,i)=>{
          const pct = Math.round(c.filled/c.slots*100);
          const isOpen = sel===i;
          return (
            <div key={i} style={{ ...card, cursor:"pointer", border:`1px solid ${isOpen?"#FF6B0060":"#1E293B"}` }} onClick={()=>setSel(isOpen?null:i)}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
                <div>
                  <div style={{ fontSize:16, fontWeight:800, color:"#F1F5F9" }}>{c.city}</div>
                  <div style={{ fontSize:11, color:"#475569", marginTop:3 }}>{c.venue}</div>
                  <div style={{ fontSize:11, color:"#64748B", marginTop:2 }}>📅 {c.date}</div>
                </div>
                <span style={{ fontSize:10, fontWeight:800, padding:"3px 10px", borderRadius:8, background:`${statusColor(c.status)}22`, color:statusColor(c.status) }}>{c.status}</span>
              </div>
              {/* Slot bar */}
              <div style={{ marginBottom:10 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                  <span style={{ fontSize:11, color:"#64748B" }}>{c.filled}/{c.slots} slots filled</span>
                  <span style={{ fontSize:11, fontWeight:700, color:statusColor(c.status) }}>{pct}%</span>
                </div>
                <div style={{ height:6, background:"#1E293B", borderRadius:3, overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${pct}%`, background:`linear-gradient(90deg,${statusColor(c.status)},${statusColor(c.status)}cc)`, borderRadius:3 }}/>
                </div>
              </div>
              {/* Waitlist */}
              {c.waitlist>0&&(
                <div style={{ fontSize:11, color:"#F59E0B" }}>⏳ {c.waitlist} on waitlist</div>
              )}
              {/* Expanded */}
              {isOpen&&(
                <div style={{ marginTop:14, paddingTop:14, borderTop:"1px solid #1E293B", display:"flex", gap:8, flexWrap:"wrap" }}>
                  <button onClick={e=>{e.stopPropagation()}} style={{ padding:"7px 14px", borderRadius:8, border:"none", background:"linear-gradient(135deg,#FF6B00,#FF8C40)", color:"#fff", fontSize:11, fontWeight:700, cursor:"pointer" }}>📲 Generate QR Code</button>
                  <button onClick={e=>{e.stopPropagation()}} style={{ padding:"7px 14px", borderRadius:8, border:"1px solid #1E293B", background:"transparent", color:"#94A3B8", fontSize:11, cursor:"pointer" }}>👥 View Registrations</button>
                  <button onClick={e=>{e.stopPropagation()}} style={{ padding:"7px 14px", borderRadius:8, border:"1px solid #1E293B", background:"transparent", color:"#94A3B8", fontSize:11, cursor:"pointer" }}>✉ WhatsApp Blast</button>
                  <button onClick={e=>{e.stopPropagation()}} style={{ padding:"7px 14px", borderRadius:8, border:"1px solid #EF444460", background:"transparent", color:"#EF4444", fontSize:11, cursor:"pointer" }}>🔒 Close Slots</button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add City Modal */}
      {addOpen&&(
        <div style={{ position:"fixed", inset:0, background:"#00000080", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center" }} onClick={()=>setAdd(false)}>
          <div style={{ ...card, width:480, padding:28 }} onClick={e=>e.stopPropagation()}>
            <div style={{ fontSize:16, fontWeight:800, color:"#F1F5F9", marginBottom:20 }}>Add New Trial City</div>
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              {[{l:"City Name",k:"city"},{l:"Venue",k:"venue"},{l:"Trial Date",k:"date"},{l:"Total Slots",k:"slots"}].map(f=>(
                <div key={f.k}>
                  <label style={{ fontSize:11, fontWeight:700, color:"#475569", display:"block", marginBottom:7 }}>{f.l.toUpperCase()}</label>
                  <input style={{ width:"100%", padding:"10px 12px", borderRadius:9, border:"1px solid #1E293B", background:"#060B18", color:"#E2E8F0", fontSize:13, outline:"none", boxSizing:"border-box" }}/>
                </div>
              ))}
              <div style={{ display:"flex", gap:10, marginTop:4 }}>
                <button onClick={()=>setAdd(false)} style={{ flex:1, padding:"11px", borderRadius:10, border:"1px solid #1E293B", background:"transparent", color:"#94A3B8", fontSize:13, cursor:"pointer" }}>Cancel</button>
                <button style={{ flex:1, padding:"11px", borderRadius:10, border:"none", background:"linear-gradient(135deg,#FF6B00,#FF8C40)", color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer" }}>Add City</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

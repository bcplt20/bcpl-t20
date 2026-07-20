import { useState } from "react";

const BANNERS = [
  { id: 1, name: "Hero Banner",       location: "Home – Hero",         type: "Image", status: "Active",   size: "1920×600", updated: "15 Jul 2025" },
  { id: 2, name: "Registration CTA",  location: "Home – Mid section",  type: "HTML",  status: "Active",   size: "Full-width", updated: "18 Jul 2025" },
  { id: 3, name: "TechCorp Ad",       location: "Sidebar – Right",     type: "Image", status: "Active",   size: "300×250",  updated: "10 Jul 2025" },
  { id: 4, name: "Auction Countdown", location: "All pages – Top bar", type: "HTML",  status: "Paused",   size: "Full-width", updated: "20 Jul 2025" },
  { id: 5, name: "Mobile Sticky",     location: "Mobile – Bottom",     type: "HTML",  status: "Draft",    size: "Full-width", updated: "20 Jul 2025" },
];

const STATUS_COLOR: Record<string, string> = {
  Active: "#22C55E",
  Paused: "#F59E0B",
  Draft:  "#7A8EA8",
};

export default function BannersView() {
  const [banners, setBanners] = useState(BANNERS);

  const toggle = (id: number) => {
    setBanners(prev => prev.map(b =>
      b.id === id
        ? { ...b, status: b.status === "Active" ? "Paused" : "Active" }
        : b
    ));
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
        <button style={{
          padding: "10px 20px", background: "linear-gradient(135deg,#FF7A29,#FF4500)",
          color: "#fff", border: "none", borderRadius: 8, fontWeight: 700,
          cursor: "pointer", fontSize: 13, fontFamily: "'Montserrat', sans-serif",
        }}>
          + Add Banner
        </button>
      </div>

      <div style={{ background: "#0D1B2E", borderRadius: 14, border: "1px solid rgba(255,255,255,.07)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "rgba(255,255,255,.04)" }}>
              {["Name","Location","Type","Size","Status","Updated","Actions"].map(h => (
                <th key={h} style={{
                  padding: "12px 16px", textAlign: "left", color: "#7A8EA8",
                  fontSize: 11, fontWeight: 700, textTransform: "uppercase",
                  letterSpacing: ".06em", borderBottom: "1px solid rgba(255,255,255,.07)",
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {banners.map((b, i) => (
              <tr key={b.id} style={{
                borderBottom: i < banners.length - 1 ? "1px solid rgba(255,255,255,.05)" : "none",
              }}>
                <td style={{ padding: "14px 16px", color: "#fff", fontWeight: 700, fontSize: 13 }}>{b.name}</td>
                <td style={{ padding: "14px 16px", color: "#7A8EA8", fontSize: 12 }}>{b.location}</td>
                <td style={{ padding: "14px 16px" }}>
                  <span style={{
                    background: b.type === "HTML" ? "#A855F722" : "#3B9EFF22",
                    color: b.type === "HTML" ? "#A855F7" : "#3B9EFF",
                    borderRadius: 6, padding: "3px 8px", fontSize: 11, fontWeight: 700,
                  }}>
                    {b.type}
                  </span>
                </td>
                <td style={{ padding: "14px 16px", color: "#7A8EA8", fontSize: 12 }}>{b.size}</td>
                <td style={{ padding: "14px 16px" }}>
                  <span style={{
                    background: `${STATUS_COLOR[b.status]}22`,
                    color: STATUS_COLOR[b.status],
                    borderRadius: 6, padding: "3px 8px", fontSize: 11, fontWeight: 700,
                  }}>
                    {b.status}
                  </span>
                </td>
                <td style={{ padding: "14px 16px", color: "#7A8EA8", fontSize: 12 }}>{b.updated}</td>
                <td style={{ padding: "14px 16px" }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      onClick={() => toggle(b.id)}
                      style={{
                        padding: "5px 12px",
                        background: b.status === "Active" ? "#F59E0B22" : "#22C55E22",
                        color: b.status === "Active" ? "#F59E0B" : "#22C55E",
                        border: `1px solid ${b.status === "Active" ? "#F59E0B" : "#22C55E"}`,
                        borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 700,
                      }}
                    >
                      {b.status === "Active" ? "Pause" : "Activate"}
                    </button>
                    <button style={{
                      padding: "5px 12px", background: "rgba(255,255,255,.06)",
                      color: "#7A8EA8", border: "1px solid rgba(255,255,255,.12)",
                      borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 700,
                    }}>
                      Edit
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

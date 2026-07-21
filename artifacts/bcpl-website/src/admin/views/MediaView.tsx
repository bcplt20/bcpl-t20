import { useState } from "react";

type MediaFolder = {
  id: number; name: string; type: "photo" | "video" | "mixed";
  createdAt: string; files: MediaFile[];
};
type MediaFile = {
  id: number; name: string; type: "photo" | "video";
  size: string; addedAt: string; thumb: string;
};

export default function MediaView() {
  const [folders, setFolders]         = useState<MediaFolder[]>([]);
  const [openFolder, setOpenFolder]   = useState<MediaFolder | null>(null);
  const [newFolderOpen, setNFO]       = useState(false);
  const [newFolderName, setNFName]    = useState("");
  const [newFolderType, setNFType]    = useState<"photo"|"video"|"mixed">("photo");
  const [uploading, setUploading]     = useState(false);

  const card: React.CSSProperties = {
    background: "linear-gradient(135deg,#0D1526 0%,#0A1020 100%)",
    border: "1px solid #1E293B", borderRadius: 16, padding: 20,
  };

  const totalPhotos = folders.reduce((a,f)=>a+f.files.filter(x=>x.type==="photo").length,0);
  const totalVideos = folders.reduce((a,f)=>a+f.files.filter(x=>x.type==="video").length,0);
  const totalFiles  = folders.reduce((a,f)=>a+f.files.length,0);

  function createFolder() {
    if (!newFolderName.trim()) return;
    const now = new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"});
    setFolders(prev=>[...prev,{ id:Date.now(), name:newFolderName.trim(), type:newFolderType, createdAt:now, files:[] }]);
    setNFName(""); setNFO(false);
  }

  function deleteFolder(id:number) {
    if(!confirm("Delete this folder and all its files?")) return;
    setFolders(prev=>prev.filter(f=>f.id!==id));
    if(openFolder?.id===id) setOpenFolder(null);
  }

  function addFilesToFolder(folderId:number) {
    // Simulate file addition (real S3 upload to be integrated)
    const now = new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"short"});
    const folder = folders.find(f=>f.id===folderId);
    if (!folder) return;
    const newFile: MediaFile = {
      id: Date.now(), name: "New File", type: folder.type === "video" ? "video" : "photo",
      size: "—", addedAt: now, thumb: folder.type === "video" ? "🎬" : "📸",
    };
    setFolders(prev=>prev.map(f=>f.id===folderId ? {...f, files:[...f.files,newFile]} : f));
    setOpenFolder(prev=>prev?.id===folderId ? {...prev, files:[...prev.files,newFile]} : prev);
  }

  function deleteFile(folderId:number, fileId:number) {
    setFolders(prev=>prev.map(f=>f.id===folderId ? {...f, files:f.files.filter(x=>x.id!==fileId)} : f));
    setOpenFolder(prev=>prev?.id===folderId ? {...prev, files:prev.files.filter(x=>x.id!==fileId)} : prev);
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:10 }}>
        <div>
          {openFolder ? (
            <>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                <button onClick={()=>setOpenFolder(null)} style={{ background:"none", border:"1px solid #1E293B", borderRadius:6, color:"#64748B", padding:"4px 10px", fontSize:11, cursor:"pointer" }}>← Back</button>
                <div style={{ fontSize:20, fontWeight:800, color:"#F1F5F9" }}>{openFolder.name}</div>
              </div>
              <div style={{ fontSize:12, color:"#64748B" }}>{openFolder.files.length} file{openFolder.files.length!==1?"s":""} · {openFolder.type}</div>
            </>
          ) : (
            <>
              <div style={{ fontSize:20, fontWeight:800, color:"#F1F5F9" }}>Photos &amp; Videos</div>
              <div style={{ fontSize:12, color:"#64748B", marginTop:2 }}>Create folders, upload media. Shown on the public website.</div>
            </>
          )}
        </div>
        <div style={{ display:"flex", gap:10 }}>
          {!openFolder && (
            <button onClick={()=>setNFO(true)} style={{ padding:"10px 18px", borderRadius:10, border:"1px solid #FF6B00", background:"transparent", color:"#FF6B00", fontSize:13, cursor:"pointer", fontWeight:600 }}>
              📁 Create Folder
            </button>
          )}
          {openFolder && (
            <button onClick={()=>setUploading(true)} style={{ padding:"10px 20px", borderRadius:10, border:"none", background:"linear-gradient(135deg,#FF6B00,#FF8C40)", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer" }}>
              ⬆ Add Files to Folder
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      {!openFolder && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
          {[
            { label:"Folders",     value:folders.length,  icon:"📁", color:"#6366F1" },
            { label:"Photos",      value:totalPhotos,     icon:"📸", color:"#F59E0B" },
            { label:"Videos",      value:totalVideos,     icon:"🎬", color:"#3B82F6" },
          ].map(s=>(
            <div key={s.label} style={{ ...card, display:"flex", alignItems:"center", gap:14, borderLeft:`3px solid ${s.color}` }}>
              <span style={{ fontSize:26 }}>{s.icon}</span>
              <div>
                <div style={{ fontSize:22, fontWeight:800, color:"#F1F5F9" }}>{s.value}</div>
                <div style={{ fontSize:11, color:"#64748B" }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Folder list */}
      {!openFolder && (
        <>
          {folders.length === 0 ? (
            <div style={{ ...card, textAlign:"center", padding:"60px 20px" }}>
              <div style={{ fontSize:56, marginBottom:16 }}>📁</div>
              <div style={{ fontSize:18, fontWeight:700, color:"#F1F5F9", marginBottom:8 }}>No folders yet</div>
              <div style={{ fontSize:13, color:"#64748B", marginBottom:24 }}>Create a folder first — e.g. "Mumbai vs Rajasthan" or "Season 4 Highlights"</div>
              <button onClick={()=>setNFO(true)} style={{ padding:"11px 28px", borderRadius:10, border:"none", background:"linear-gradient(135deg,#FF6B00,#FF8C40)", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer" }}>
                📁 Create First Folder
              </button>
            </div>
          ) : (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:12 }}>
              {folders.map(f=>(
                <div key={f.id} style={{ ...card, cursor:"pointer", transition:"border-color .15s" }}
                  onClick={()=>setOpenFolder(f)}
                  onMouseEnter={e=>(e.currentTarget.style.borderColor="#FF6B00")}
                  onMouseLeave={e=>(e.currentTarget.style.borderColor="#1E293B")}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                    <span style={{ fontSize:36 }}>{f.type==="video"?"🎬":f.type==="photo"?"📸":"📁"}</span>
                    <button onClick={e=>{ e.stopPropagation(); deleteFolder(f.id); }}
                      style={{ background:"none", border:"1px solid #EF444422", borderRadius:6, color:"#EF4444", fontSize:11, padding:"3px 8px", cursor:"pointer" }}>🗑</button>
                  </div>
                  <div style={{ fontWeight:700, fontSize:14, color:"#F1F5F9", marginBottom:4 }}>{f.name}</div>
                  <div style={{ fontSize:11, color:"#64748B" }}>{f.files.length} file{f.files.length!==1?"s":""} · {f.type} · {f.createdAt}</div>
                </div>
              ))}
              {/* Add folder card */}
              <div onClick={()=>setNFO(true)} style={{ ...card, border:"2px dashed #1E293B", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:8, cursor:"pointer", minHeight:130, transition:"border-color .15s" }}
                onMouseEnter={e=>(e.currentTarget.style.borderColor="#FF6B00")}
                onMouseLeave={e=>(e.currentTarget.style.borderColor="#1E293B")}>
                <span style={{ fontSize:28 }}>+</span>
                <span style={{ fontSize:12, color:"#475569", fontWeight:600 }}>New folder</span>
              </div>
            </div>
          )}
        </>
      )}

      {/* Folder contents */}
      {openFolder && (
        <div>
          {openFolder.files.length === 0 ? (
            <div style={{ ...card, textAlign:"center", padding:"60px 20px" }}>
              <div style={{ fontSize:48, marginBottom:12 }}>{openFolder.type==="video"?"🎬":"📸"}</div>
              <div style={{ fontSize:16, fontWeight:700, color:"#F1F5F9", marginBottom:8 }}>No files yet in "{openFolder.name}"</div>
              <div style={{ fontSize:13, color:"#64748B", marginBottom:20 }}>Click "Add Files to Folder" to upload photos or videos.</div>
              <button onClick={()=>setUploading(true)} style={{ padding:"11px 28px", borderRadius:10, border:"none", background:"linear-gradient(135deg,#FF6B00,#FF8C40)", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer" }}>
                ⬆ Add Files
              </button>
            </div>
          ) : (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:12 }}>
              {openFolder.files.map(file=>(
                <div key={file.id} style={{ ...card, padding:0, overflow:"hidden" }}>
                  <div style={{ height:120, background:"linear-gradient(135deg,#0F1B2D,#0A1020)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:36 }}>
                    {file.thumb}
                  </div>
                  <div style={{ padding:"10px 12px" }}>
                    <div style={{ fontSize:12, fontWeight:600, color:"#F1F5F9", marginBottom:4, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{file.name}</div>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <span style={{ fontSize:10, color:"#64748B" }}>{file.addedAt} · {file.size}</span>
                      <button onClick={()=>deleteFile(openFolder.id,file.id)} style={{ background:"none", border:"none", color:"#EF4444", fontSize:12, cursor:"pointer" }}>🗑</button>
                    </div>
                  </div>
                </div>
              ))}
              <div onClick={()=>setUploading(true)} style={{ ...card, border:"2px dashed #1E293B", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:8, cursor:"pointer", minHeight:160, transition:"border-color .15s" }}
                onMouseEnter={e=>(e.currentTarget.style.borderColor="#FF6B00")}
                onMouseLeave={e=>(e.currentTarget.style.borderColor="#1E293B")}>
                <span style={{ fontSize:28 }}>⬆</span>
                <span style={{ fontSize:12, color:"#475569", fontWeight:600 }}>Add file</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Folder Modal */}
      {newFolderOpen && (
        <div style={{ position:"fixed", inset:0, background:"#00000088", display:"flex", alignItems:"center", justifyContent:"center", zIndex:999 }}>
          <div style={{ background:"#0D1526", border:"1px solid #1E293B", borderRadius:20, padding:28, width:400, position:"relative" }}>
            <button onClick={()=>setNFO(false)} style={{ position:"absolute", top:12, right:14, background:"none", border:"none", color:"#64748B", fontSize:18, cursor:"pointer" }}>✕</button>
            <div style={{ fontSize:18, fontWeight:800, color:"#F1F5F9", marginBottom:20 }}>📁 Create New Folder</div>
            <label style={{ fontSize:11, color:"#64748B", fontWeight:700, display:"block", marginBottom:6 }}>FOLDER NAME</label>
            <input value={newFolderName} onChange={e=>setNFName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&createFolder()}
              placeholder="e.g. Mumbai vs Rajasthan — Match 1"
              style={{ width:"100%", padding:"10px 14px", background:"#060B18", border:"1px solid #1E293B", borderRadius:10, color:"#F1F5F9", fontSize:13, outline:"none", marginBottom:16 }} />
            <label style={{ fontSize:11, color:"#64748B", fontWeight:700, display:"block", marginBottom:6 }}>CONTENT TYPE</label>
            <div style={{ display:"flex", gap:8, marginBottom:20 }}>
              {(["photo","video","mixed"] as const).map(t=>(
                <button key={t} onClick={()=>setNFType(t)} style={{ flex:1, padding:"9px 0", borderRadius:9, border:`1px solid ${newFolderType===t?"#FF6B00":"#1E293B"}`, background:newFolderType===t?"#FF6B0022":"transparent", color:newFolderType===t?"#FF6B00":"#64748B", fontSize:12, fontWeight:700, cursor:"pointer", textTransform:"capitalize" }}>
                  {t==="photo"?"📸 Photos":t==="video"?"🎬 Videos":"📁 Mixed"}
                </button>
              ))}
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={()=>setNFO(false)} style={{ flex:1, padding:"11px 0", borderRadius:10, border:"1px solid #1E293B", background:"transparent", color:"#64748B", fontSize:13, cursor:"pointer" }}>Cancel</button>
              <button onClick={createFolder} disabled={!newFolderName.trim()} style={{ flex:1, padding:"11px 0", borderRadius:10, border:"none", background:"linear-gradient(135deg,#FF6B00,#FF8C40)", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", opacity:newFolderName.trim()?1:0.5 }}>Create Folder</button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {uploading && (
        <div style={{ position:"fixed", inset:0, background:"#00000088", display:"flex", alignItems:"center", justifyContent:"center", zIndex:999 }}>
          <div style={{ background:"#0D1526", border:"1px solid #1E293B", borderRadius:20, padding:28, width:480 }}>
            <div style={{ fontSize:18, fontWeight:800, color:"#F1F5F9", marginBottom:6 }}>⬆ Upload Files</div>
            <div style={{ fontSize:12, color:"#64748B", marginBottom:20 }}>S3 / cloud storage integration coming soon. For now, click "Add" to mark a placeholder file.</div>
            <div style={{ background:"#060B18", borderRadius:14, border:"2px dashed #334155", padding:"40px 20px", textAlign:"center", marginBottom:18, cursor:"pointer" }}
              onMouseEnter={e=>(e.currentTarget.style.borderColor="#FF6B00")}
              onMouseLeave={e=>(e.currentTarget.style.borderColor="#334155")}>
              <div style={{ fontSize:40, marginBottom:10 }}>☁</div>
              <div style={{ fontSize:14, color:"#94A3B8", fontWeight:600 }}>Drag & drop files here</div>
              <div style={{ fontSize:12, color:"#475569", marginTop:4 }}>JPG, PNG, MP4, MOV — up to 500MB per file</div>
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={()=>setUploading(false)} style={{ flex:1, padding:"11px 0", borderRadius:10, border:"1px solid #1E293B", background:"transparent", color:"#64748B", fontSize:13, cursor:"pointer" }}>Cancel</button>
              <button onClick={()=>{ if(openFolder) addFilesToFolder(openFolder.id); setUploading(false); }}
                style={{ flex:1, padding:"11px 0", borderRadius:10, border:"none", background:"linear-gradient(135deg,#FF6B00,#FF8C40)", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer" }}>
                {openFolder ? "Add Placeholder File" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React from 'react';

export function Skel({ w, h, r, style }: { w?: number | string; h?: number | string; r?: number; style?: React.CSSProperties }) {
  return (
    <div
      className="skel"
      aria-hidden
      style={{ width: w ?? '100%', height: h ?? 16, borderRadius: r ?? 10, ...style }}
    />
  );
}

export function SkelRows({ n = 3, h = 16, gap = 10 }: { n?: number; h?: number; gap?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap }}>
      {Array.from({ length: n }).map((_, i) => (
        <Skel key={i} h={h} />
      ))}
    </div>
  );
}

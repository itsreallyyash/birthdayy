'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { ImageMetadata } from '@/lib/types';
import { supabase } from '@/lib/supabase';

// ─── Pixel Sprites ────────────────────────────────────────────────────────────
// 12 wide × 16 tall, scale × 3 = 36 × 48 px
//
// Girl: brown hair, glasses (G=frame g=lens), yellow top, PINK SKIRT
// Boy:  dark short hair, no glasses, wide black shirt, blue jeans

// Shared body rows 0-11, only legs differ between frames A/B
const GIRL_BODY: string[] = [
  '....HHHH....',  // hair top
  '..HHHHHHHH..',  // hair wide
  '.HSSSSSSSSH.',  // face + hair sides
  '.HGgSSGgSSH.',  // glasses (G=frame, g=tinted lens)
  '.HSSSSSSSSH.',  // face
  '..SSSSSSSS..',  // chin
  '.YYYYYYYYYY.',  // yellow top shoulders
  'YYYYYYYYYYYY',  // yellow top
  'YYYYYYYYYYYY',  // yellow top
  '.PPPPPPPPPP.',  // pink skirt
  'PPPPPPPPPPPP',  // skirt wider
  'PPPPPPPPPPPP',  // skirt widest
];
const GIRL_A: string[] = [
  ...GIRL_BODY,
  '...SS....SS.',  // legs apart
  '..SS.....SS.',
  '..BB.....BB.',  // shoes
  '............',
];
const GIRL_B: string[] = [
  ...GIRL_BODY,
  '..SS.....SS.',  // legs other step
  '...SS....SS.',
  '...BB....BB.',  // shoes
  '............',
];

const BOY_BODY: string[] = [
  '....KKKK....',  // short hair top
  '...KKKKKKK..',  // hair (shorter, less spread than girl)
  '..KSSSSSSK..',  // face + short hair sides
  '..KSSSSSSK..',  // face — no glasses
  '..KSSSSSSK..',  // face
  '...SSSSSS...',  // chin
  '.NNNNNNNNNN.',  // black shirt — wide shoulders (wider than face)
  'NNNNNNNNNNNN',  // shirt
  'NNNNNNNNNNNN',  // shirt
  'NNNNNNNNNNNN',  // shirt
  '..DDDDDDDD..',  // dark jeans
  '..DDDDDDDD..',  // jeans
];
const BOY_A: string[] = [
  ...BOY_BODY,
  '..DDD..DDD..',  // legs apart
  '.DDD...DDD..',
  '.BBB...BBB..',  // wider shoes
  '............',
];
const BOY_B: string[] = [
  ...BOY_BODY,
  '..DDD..DDD..',  // legs other step
  '..DDD...DDD.',
  '..BBB...BBB.',  // wider shoes
  '............',
];

const GP: Record<string, string> = {
  H: '#5C3317',  // brown hair
  S: '#FDBCB4',  // skin
  G: '#2a2a2a',  // glasses frame
  g: '#b8d8e8',  // glasses lens (light blue tint)
  Y: '#FFD700',  // yellow top
  P: '#e8799a',  // pink skirt
  B: '#2a1a0e',  // shoes
};
const BP: Record<string, string> = {
  K: '#1a1a1a',  // dark hair
  S: '#f5cba7',  // warmer skin tone
  N: '#0d0d0d',  // black shirt
  D: '#1c2a50',  // dark jeans
  B: '#2a1a0e',  // shoes
};

function Sprite({ data, pal, px = 3 }: { data: string[]; pal: Record<string, string>; px?: number }) {
  const cols = data[0]?.length ?? 8;
  return (
    <svg width={cols * px} height={data.length * px} style={{ imageRendering: 'pixelated', display: 'block' }}>
      {data.flatMap((row, y) =>
        [...row].map((c, x) => {
          const fill = pal[c];
          if (!fill) return null;
          return <rect key={`${y}-${x}`} x={x * px} y={y * px} width={px} height={px} fill={fill} />;
        })
      )}
    </svg>
  );
}

// ─── Map Layout ───────────────────────────────────────────────────────────────
// 15 cols: TT GG[L]G PPP G[R]GG TT   (path centered)
// col:      01 234 5 678 9 0 12 34
const T = 32; // tile px
const COLS = 15;

type ColKind = 'tree' | 'grass' | 'path' | 'photo_L' | 'photo_R';
const COL_KINDS: ColKind[] = [
  'tree','tree','grass','grass','photo_L','grass','path','path','path','grass','photo_R','grass','grass','tree','tree',
];

// Tile base colors
function tileColor(kind: ColKind, col: number, row: number): string {
  const checker = (col + row) % 2;
  if (kind === 'path') return checker ? 'rgba(196,168,130,0.35)' : 'rgba(189,160,122,0.35)';
  if (kind === 'tree')  return checker ? '#4a904a' : '#428242';
  return ['#68b568','#5fa65f','#62ab62','#5ea55e','#64ad64'][(col * 3 + row * 7) % 5];
}

type RowSpec =
  | { photo: false }
  | { photo: true; img: ImageMetadata; side: 'left' | 'right' };

function buildMap(images: ImageMetadata[]): RowSpec[] {
  const rows: RowSpec[] = [];
  for (let i = 0; i < 5; i++) rows.push({ photo: false });
  images.forEach((img, idx) => {
    rows.push({ photo: false });
    rows.push({ photo: false });
    rows.push({ photo: true, img, side: idx % 2 === 0 ? 'left' : 'right' });
    rows.push({ photo: false });
  });
  for (let i = 0; i < 5; i++) rows.push({ photo: false });
  return rows;
}

// Row indices that have photos (for player snap-to positions)
function photoRows(imgCount: number): number[] {
  return Array.from({ length: imgCount }, (_, i) => 5 + i * 4 + 2);
}

// ─── Photo Frame on Map ────────────────────────────────────────────────────────
function MapPhotoFrame({
  img, side, active, onClick,
}: {
  img: ImageMetadata; side: 'left' | 'right'; active: boolean; onClick: () => void;
}) {
  // Frame spans 2 tiles, centered on photo_L col (col 4) or photo_R col (col 10)
  const centerCol = side === 'left' ? 4 : 10;
  const left = centerCol * T - 28; // 56px wide frame, offset to center on col
  const frameW = 64;
  const frameH = 64;

  return (
    <div
      style={{
        position: 'absolute',
        top: T / 2 - frameH / 2,
        left,
        width: frameW,
        height: frameH,
        cursor: 'pointer',
        zIndex: 5,
      }}
      onClick={onClick}
    >
      {/* Wooden outer frame */}
      <div
        style={{
          width: '100%',
          height: '100%',
          padding: 4,
          background: active ? '#8b4513' : '#5a2d0c',
          border: `3px solid ${active ? '#ffd700' : '#3d1a05'}`,
          boxShadow: active ? '0 0 10px rgba(255,215,0,0.7)' : '2px 2px 4px rgba(0,0,0,0.5)',
          boxSizing: 'border-box',
        }}
      >
        <img
          src={img.blob_url}
          alt={img.filename}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          onError={(e) => { (e.target as HTMLImageElement).style.background = '#222'; (e.target as HTMLImageElement).src = ''; }}
        />
      </div>
      {/* Plaque */}
      <div
        style={{
          position: 'absolute',
          bottom: -16,
          left: '50%',
          transform: 'translateX(-50%)',
          background: active ? '#c8960c' : '#8b6914',
          border: '2px solid #5a3d00',
          padding: '1px 4px',
          whiteSpace: 'nowrap',
          fontFamily: "'Press Start 2P', cursive",
          fontSize: 5,
          color: '#fff',
        }}
      >
        {active ? '[ ENTER ]' : img.filename.replace(/^\d+-/, '').slice(0, 12)}
      </div>
    </div>
  );
}

// ─── Tree Decor ────────────────────────────────────────────────────────────────
function TreeDecor({ col, row }: { col: number; row: number }) {
  if ((col * 2 + row * 3) % 4 !== 0) return null;
  return (
    <>
      <div style={{ position: 'absolute', bottom: 0, left: '40%', width: '20%', height: '45%', background: '#7a4f1e' }} />
      <div style={{ position: 'absolute', bottom: '30%', left: '8%', width: '84%', height: '90%', background: '#2d6b38', borderRadius: '50% 50% 35% 35%' }} />
      <div style={{ position: 'absolute', bottom: '52%', left: '15%', width: '70%', height: '65%', background: '#245530', borderRadius: '50% 50% 35% 35%', opacity: 0.6 }} />
    </>
  );
}

// ─── Grass Tufts ──────────────────────────────────────────────────────────────
function GrassTuft({ col, row }: { col: number; row: number }) {
  if ((col * 5 + row * 3) % 7 !== 0) return null;
  return (
    <div style={{ position: 'absolute', bottom: 4, left: '30%', display: 'flex', gap: 2 }}>
      <div style={{ width: 3, height: 8, background: '#3d8f3d', borderRadius: 2, transform: 'rotate(-10deg)' }} />
      <div style={{ width: 3, height: 10, background: '#4a9f4a', borderRadius: 2 }} />
      <div style={{ width: 3, height: 7, background: '#3d8f3d', borderRadius: 2, transform: 'rotate(10deg)' }} />
    </div>
  );
}

// ─── Gameboy Mobile Controls ──────────────────────────────────────────────────
function DpadBtn({ label, style, onPress }: { label: string; style: React.CSSProperties; onPress: () => void }) {
  const repeatRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const start = (e: React.PointerEvent) => {
    e.preventDefault();
    onPress();
    repeatRef.current = setInterval(onPress, 120);
  };
  const stop = () => {
    clearInterval(repeatRef.current);
    repeatRef.current = undefined;
  };

  return (
    <button
      onPointerDown={start}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      style={{
        position: 'absolute',
        width: 36, height: 36,
        background: '#1a1a2e',
        border: '2px solid #333',
        borderRadius: 4,
        color: '#aaa',
        fontSize: 16,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        touchAction: 'none',
        ...style,
      }}
    >
      {label}
    </button>
  );
}


// ─── Birthday Screen ──────────────────────────────────────────────────────────

const FW_DIRS = [
  [0,-1],[0.71,-0.71],[1,0],[0.71,0.71],[0,1],[-0.71,0.71],[-1,0],[-0.71,-0.71],
];
const FW_BURSTS = [
  { x:18, y:22, color:'#ffd700', delay:  0   },
  { x:78, y:18, color:'#ff69b4', delay: -0.5 },
  { x:50, y:33, color:'#00eeff', delay: -1.0 },
  { x:14, y:62, color:'#ff5555', delay: -1.5 },
  { x:83, y:58, color:'#66ff88', delay: -2.0 },
  { x:53, y:72, color:'#ffffff', delay: -2.5 },
];
const BD_MSGS = [
  { text:'★  HAPPY BIRTHDAY  ★',      size:16, color:'#ffd700', glow:'#ffd700' },
  { text:'YOU ARE SUPER AWESOME',      size:9,  color:'#ffffff', glow:'#888'    },
  { text:'YOU ARE AN INCREDIBLE HUMAN',size:8,  color:'#ff69b4', glow:'#ff69b4' },
  { text:'★  HAPPY 23RD  ★',          size:16, color:'#00eeff', glow:'#00eeff' },
];

function BirthdayScreen({ onRestart }: { onRestart: () => void }) {
  const [phase, setPhase]         = useState<'loading'|'fireworks'|'message'>('loading');
  const [msgLine, setMsgLine]     = useState(-1);
  const [keepGoing, setKeepGoing] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('fireworks'),               1000);
    const t2 = setTimeout(() => { setPhase('message'); setMsgLine(0); }, 3600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  useEffect(() => {
    if (msgLine < 0 || msgLine >= BD_MSGS.length) return;
    const t = setTimeout(() => setMsgLine(l => l + 1), 750);
    return () => clearTimeout(t);
  }, [msgLine]);

  return (
    <div style={{ position:'fixed', inset:0, zIndex:9999, background:'#000',
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
      <style>{`
        @keyframes fw-p {
          0%   { transform:translate(0,0) scale(1.5); opacity:1; }
          35%  { transform:translate(var(--tx),var(--ty)) scale(1); opacity:0.9; }
          50%  { transform:translate(var(--tx),var(--ty)) scale(0.3); opacity:0; }
          100% { opacity:0; }
        }
        @keyframes fw-flash {
          0%  { transform:scale(2.5); opacity:1; }
          18% { transform:scale(0.3); opacity:0; }
          100%{ opacity:0; }
        }
        @keyframes bd-in {
          from { opacity:0; transform:translateY(12px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes bd-blink { 0%,100%{opacity:1} 50%{opacity:0.1} }
        @keyframes bd-pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.07)} }
      `}</style>

      {/* Loading dots */}
      {phase === 'loading' && (
        <div style={{ display:'flex', gap:12 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{ width:14, height:14, background:'#ffd700', imageRendering:'pixelated',
              animation:`bd-blink 0.75s ${i*0.25}s infinite` }} />
          ))}
        </div>
      )}

      {/* Fireworks */}
      {phase !== 'loading' && FW_BURSTS.map((b, bi) => (
        <div key={bi} style={{ position:'absolute', left:`${b.x}%`, top:`${b.y}%`, transform:'translate(-50%,-50%)' }}>
          {FW_DIRS.map(([dx,dy], i) => {
            const dist = 52 + (i % 3) * 20;
            return (
              <div key={i} style={{
                position:'absolute', width:5, height:5, background:b.color, imageRendering:'pixelated',
                animation:`fw-p 2.8s linear ${b.delay}s infinite`,
                '--tx':`${dx*dist}px`, '--ty':`${dy*dist}px`,
              } as React.CSSProperties} />
            );
          })}
          <div style={{ position:'absolute', width:10, height:10, background:b.color,
            transform:'translate(-2.5px,-2.5px)', imageRendering:'pixelated',
            animation:`fw-flash 2.8s linear ${b.delay}s infinite` }} />
        </div>
      ))}

      {/* Birthday message */}
      <div style={{ position:'relative', zIndex:10, textAlign:'center', padding:'0 24px', maxWidth:520 }}>
        {BD_MSGS.slice(0, Math.max(msgLine, 0)).map((m, i) => (
          <div key={i} style={{ fontFamily:"'Press Start 2P',cursive", fontSize:m.size, color:m.color,
            marginBottom:18, lineHeight:1.6, animation:'bd-in 0.6s ease-out forwards',
            textShadow:`0 0 20px ${m.glow}, 0 0 6px ${m.glow}` }}>
            {m.text}
          </div>
        ))}

        {msgLine >= BD_MSGS.length && (
          <>
            <div style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap', marginTop:28, animation:'bd-in 0.5s ease-out forwards' }}>
              <button onClick={onRestart} style={{
                fontFamily:"'Press Start 2P',cursive", fontSize:9, padding:'10px 18px',
                background:'#ffd700', border:'3px solid #8b6914', color:'#2d1a00',
                cursor:'pointer', animation:'bd-pulse 2s ease-in-out infinite',
              }}>↺ RESTART</button>
              <button onClick={() => setKeepGoing(v => !v)} style={{
                fontFamily:"'Press Start 2P',cursive", fontSize:9, padding:'10px 18px',
                background:'transparent', border:'3px solid #ffd700', color:'#ffd700', cursor:'pointer',
              }}>KEEP GOING →</button>
            </div>

            {keepGoing && (
              <div style={{ marginTop:20, background:'rgba(255,215,0,0.06)', border:'2px solid #ffd700',
                padding:'16px 18px', animation:'bd-in 0.4s ease-out forwards' }}>
                <div style={{ fontFamily:"'Press Start 2P',cursive", fontSize:7, color:'#ffd700', marginBottom:10, lineHeight:2 }}>
                  WANT MORE MEMORIES?
                </div>
                <div style={{ fontFamily:"'Press Start 2P',cursive", fontSize:7, color:'#bbb', lineHeight:2.2, marginBottom:8 }}>
                  Admin password:<br />
                  <span style={{ color:'#ffd700' }}>{process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'lilbalcony'}</span>
                </div>
                <div style={{ fontFamily:"'Press Start 2P',cursive", fontSize:6, color:'#666', lineHeight:2 }}>
                  upload <br />photos to extend the journey! 
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Comments modal types ──────────────────────────────────────────────────────
interface Comment {
  id: string;
  image_id: string;
  author: string;
  content: string;
  created_at: string;
}

let _endNotified = false;
function notifyEnd() {
  if (_endNotified) return;
  _endNotified = true;
  const timestamp = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short',
  });
  fetch('/api/notify-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'end', timestamp }),
  }).catch(() => {});
}

// ─── Main Gallery Component ────────────────────────────────────────────────────
export function GalleryRoom() {
  const [images, setImages] = useState<ImageMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [playerRow, setPlayerRow] = useState(3);
  const [walkFrame, setWalkFrame] = useState(0);
  const [openImg, setOpenImg]       = useState<ImageMetadata | null>(null);
  const [showBirthday, setShowBirthday] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [author, setAuthor] = useState('');
  const [posting, setPosting] = useState(false);
  const [commentError, setCommentError] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerH, setContainerH] = useState(400);
  const commentRef = useRef<HTMLTextAreaElement>(null);

  // Measure container
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    setContainerH(el.clientHeight);
    const ro = new ResizeObserver(() => setContainerH(el.clientHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Fetch images
  useEffect(() => {
    supabase.from('images').select('*').order('sort_order').then(({ data }) => {
      setImages(data || []);
      setLoading(false);
    });
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const rows = useMemo(() => buildMap(images), [images]);
  const snapRows = useMemo(() => photoRows(images.length), [images.length]);

  // Walk animation tick
  useEffect(() => {
    const id = setInterval(() => setWalkFrame((f) => 1 - f), 250);
    return () => clearInterval(id);
  }, []);

  // Keyboard nav
  useEffect(() => {
    if (openImg) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault(); e.stopImmediatePropagation();
        setPlayerRow((r) => Math.max(0, r - 1));
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault(); e.stopImmediatePropagation();
        const next = Math.min(rows.length - 1, playerRow + 1);
        if (next >= rows.length - 3) { setShowBirthday(true); notifyEnd(); }
        else { setPlayerRow(next); }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const sr = snapRows.find((r) => Math.abs(r - playerRow) <= 1);
        if (sr !== undefined) {
          const spec = rows[sr];
          if (spec.photo) openModal(spec.img);
        }
      } else if (e.key === 'Escape') {
        setOpenImg(null);
      }
    };
    window.addEventListener('keydown', onKey, { capture: true });
    return () => window.removeEventListener('keydown', onKey, { capture: true });
  }, [openImg, playerRow, rows, snapRows]);

  const openModal = useCallback(async (img: ImageMetadata) => {
    setOpenImg(img);
    setComments([]);
    setCommentError('');
    const { data } = await supabase.from('photo_comments').select('*').eq('image_id', img.id).order('created_at');
    setComments(data || []);
    setTimeout(() => commentRef.current?.focus(), 150);
  }, []);

  const postComment = async () => {
    if (!newComment.trim() || !openImg) return;
    setPosting(true);
    setCommentError('');
    const { error } = await supabase
      .from('photo_comments')
      .insert({ image_id: openImg.id, author: author.trim() || 'Anonymous', content: newComment.trim() });
    if (error) {
      setCommentError(error.message);
      setPosting(false);
      return;
    }
    // Refetch all comments so we get the real persisted state
    const { data } = await supabase.from('photo_comments').select('*').eq('image_id', openImg.id).order('created_at');
    setComments(data || []);
    setNewComment('');
    setPosting(false);
  };

  if (loading) {
    return (
      <div style={{ position: 'absolute', inset: 0, background: '#5fa65f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: "'Press Start 2P', cursive" }} className="text-yellow-900 animate-pulse text-xs">
          LOADING GALLERY...
        </div>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div style={{ position: 'absolute', inset: 0, background: '#5fa65f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="text-center space-y-2">
          <div style={{ fontFamily: "'Press Start 2P', cursive" }} className="text-yellow-900 text-sm">NO IMAGES YET</div>
          <p className="text-xs text-yellow-800">Upload from the admin panel</p>
        </div>
      </div>
    );
  }

  // Map scroll: translate so playerRow stays centered vertically
  const mapY = containerH / 2 - T / 2 - playerRow * T;

  // Which map row the player is near for photo highlighting
  const nearPhotoRow = snapRows.find((r: number) => Math.abs(r - playerRow) <= 1);

  // Virtual rendering: only render rows within ±12 of player
  const RENDER_BUFFER = 12;
  const firstRow = Math.max(0, playerRow - RENDER_BUFFER);
  const lastRow = Math.min(rows.length - 1, playerRow + RENDER_BUFFER);

  return (
    <>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
      <div ref={containerRef} style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#5fa65f', minHeight: 0 }}>

        {/* Scrolling tile map */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: 0,
            width: COLS * T,
            height: rows.length * T,
            transform: `translateX(-50%) translateY(${mapY}px)`,
            transition: 'transform 0.12s linear',
          }}
        >
          {/* Street background — your two photos repeating alternately down the path */}
          {Array.from(
            { length: Math.ceil((rows.length * T) / 160) },
            (_, i) => {
              const src = i % 2 === 0 ? '/pb1.png' : '/pb2.png';
              return (
                <div
                  key={`street-tile-${i}`}
                  style={{
                    position: 'absolute',
                    left: 6 * T,
                    top: i * 160,
                    width: 3 * T,
                    height: 160,
                    backgroundImage: `url('${src}')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    opacity: 0.55,
                    filter: 'sepia(0.5) brightness(0.85) contrast(1.05)',
                    pointerEvents: 'none',
                  }}
                />
              );
            }
          )}

          {/* THE END board */}
          <div style={{
            position: 'absolute', left: 6 * T - 8, top: (rows.length - 4) * T,
            width: 3 * T + 16, zIndex: 8, pointerEvents: 'none', textAlign: 'center',
          }}>
            <div style={{ background: 'rgba(15,5,0,0.92)', border: '3px solid #ffd700',
              padding: '10px 8px', boxShadow: '0 0 20px rgba(255,215,0,0.55)' }}>
              <div style={{ fontFamily: "'Press Start 2P',cursive", fontSize: 8, color: '#ffd700', marginBottom: 4 }}>
                ★ THE END? ★
              </div>
              <div style={{ fontFamily: "'Press Start 2P',cursive", fontSize: 5, color: '#c8a050', lineHeight: 1.8 }}>
                KEEP WALKING...
              </div>
            </div>
            <div style={{ width: 4, height: 16, background: '#7a4f1e', margin: '0 auto' }} />
          </div>

          {rows.slice(firstRow, lastRow + 1).map((spec: RowSpec, relIdx: number) => {
            const rowIdx = firstRow + relIdx;
            return (
              <div key={rowIdx} style={{ position: 'absolute', top: rowIdx * T, left: 0, width: '100%', height: T, display: 'flex' }}>
                {/* Base tiles */}
                {COL_KINDS.map((kind: ColKind, col: number) => (
                  <div
                    key={col}
                    style={{
                      width: T, height: T,
                      background: tileColor(kind, col, rowIdx),
                      position: 'relative',
                      flexShrink: 0,
                    }}
                  >
                    {kind === 'tree' && <TreeDecor col={col} row={rowIdx} />}
                    {(kind === 'grass' || kind === 'photo_L' || kind === 'photo_R') && (
                      <GrassTuft col={col} row={rowIdx} />
                    )}
                    {kind === 'path' && col === 6 && (
                      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, background: '#a07840', opacity: 0.5 }} />
                    )}
                    {kind === 'path' && col === 8 && (
                      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 2, background: '#a07840', opacity: 0.5 }} />
                    )}
                  </div>
                ))}

                {/* Photo frames (row overlay) */}
                {spec.photo && (
                  <MapPhotoFrame
                    img={spec.img}
                    side={spec.side}
                    active={nearPhotoRow === rowIdx}
                    onClick={() => openModal(spec.img)}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Characters — always centered */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            gap: 2,
            zIndex: 10,
            filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.4))',
          }}
        >
          <Sprite data={walkFrame === 0 ? GIRL_A : GIRL_B} pal={GP} px={3} />
          <Sprite data={walkFrame === 0 ? BOY_B : BOY_A} pal={BP} px={3} />
        </div>

        {/* HUD — hidden on mobile since gameboy controls are shown */}
        <div
          className="hidden sm:block"
          style={{
            position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)',
            fontFamily: "'Press Start 2P', cursive",
            fontSize: 7,
            background: 'rgba(0,0,0,0.55)',
            color: '#fff',
            padding: '4px 10px',
            borderRadius: 2,
            whiteSpace: 'nowrap',
            zIndex: 20,
          }}
        >
          {nearPhotoRow !== undefined ? '↑↓ WALK  •  ENTER TO VIEW' : '↑↓ WALK'}
        </div>

      </div>

      {/* Mobile Gameboy Controls Panel */}
      <div
        className="sm:hidden"
        style={{
          height: 140,
          background: 'linear-gradient(to bottom, #1a0a2e, #0d0520)',
          borderTop: '3px solid #ffd700',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
        }}
      >
        {/* D-pad */}
        <div style={{ position: 'relative', width: 108, height: 108 }}>
          <DpadBtn label="▲" onPress={() => setPlayerRow((r) => Math.max(0, r - 1))} style={{ top: 0, left: 36 }} />
          <DpadBtn label="▼" onPress={() => { const next = Math.min(rows.length - 1, playerRow + 1); if (next >= rows.length - 3) { setShowBirthday(true); notifyEnd(); } else { setPlayerRow(next); } }} style={{ bottom: 0, left: 36 }} />
          <div style={{ position: 'absolute', top: 36, left: 36, width: 36, height: 36, background: '#111', border: '2px solid #333', borderRadius: 4 }} />
        </div>

        {/* Center label */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: "'Press Start 2P', cursive", fontSize: 6, color: '#6a4a8a', lineHeight: 1.6 }}>
            MEMORY<br />WORLD
          </div>
          {nearPhotoRow !== undefined && (
            <div style={{ fontFamily: "'Press Start 2P', cursive", fontSize: 6, color: '#ffd700', marginTop: 4 }}>
              A TO VIEW
            </div>
          )}
        </div>

        {/* A / B buttons */}
        <div style={{ position: 'relative', width: 100, height: 100 }}>
          <button
            onPointerDown={(e) => { e.preventDefault(); setOpenImg(null); }}
            style={{
              position: 'absolute', top: 0, left: 0,
              width: 44, height: 44, borderRadius: '50%',
              background: '#3d1a6e', border: '3px solid #6a3aaa',
              color: '#ccc', fontFamily: "'Press Start 2P', cursive", fontSize: 8,
              userSelect: 'none', WebkitUserSelect: 'none', touchAction: 'none',
            }}
          >B</button>
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              const sr = snapRows.find((r: number) => Math.abs(r - playerRow) <= 1);
              if (sr !== undefined) { const spec: RowSpec = rows[sr]; if (spec.photo) openModal(spec.img); }
            }}
            style={{
              position: 'absolute', bottom: 0, right: 0,
              width: 44, height: 44, borderRadius: '50%',
              background: nearPhotoRow !== undefined ? '#8b0000' : '#4a0000',
              border: `3px solid ${nearPhotoRow !== undefined ? '#ff4444' : '#880000'}`,
              color: nearPhotoRow !== undefined ? '#fff' : '#888',
              fontFamily: "'Press Start 2P', cursive", fontSize: 8,
              userSelect: 'none', WebkitUserSelect: 'none', touchAction: 'none',
              boxShadow: nearPhotoRow !== undefined ? '0 0 8px rgba(255,50,50,0.6)' : 'none',
            }}
          >A</button>
        </div>
      </div>
    </div>

      {/* Photo modal */}
      {openImg && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.8)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpenImg(null); }}
        >
          <div
            className="flex flex-col overflow-hidden"
            style={{
              background: '#fffde8',
              border: '4px solid #8b4513',
              boxShadow: '0 0 0 2px #ffd700',
              width: '100%',
              maxWidth: 560,
              maxHeight: '88vh',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 12px',
                borderBottom: '2px solid #c8960c',
                background: '#fff8dc',
                flexShrink: 0,
              }}
            >
              <span style={{ fontFamily: "'Press Start 2P', cursive", fontSize: 8, color: '#5a2d0c', maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {openImg.filename.replace(/^\d+-/, '')}
              </span>
              <button
                onClick={() => setOpenImg(null)}
                className="pixel-btn text-xs"
                style={{ fontFamily: "'Press Start 2P', cursive", fontSize: 7 }}
              >
                CLOSE [ESC]
              </button>
            </div>

            {/* Image */}
            <div style={{ background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <img
                src={openImg.blob_url}
                alt={openImg.filename}
                style={{ maxWidth: '100%', maxHeight: '45vh', objectFit: 'contain', display: 'block' }}
              />
            </div>

            {/* Comments */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 12, minHeight: 0 }}>
              <div style={{ fontFamily: "'Press Start 2P', cursive", fontSize: 8, color: '#8b4513', marginBottom: 8 }}>
                COMMENTS ({comments.length})
              </div>
              {comments.length === 0 && (
                <p style={{ fontSize: 11, color: '#999', fontStyle: 'italic' }}>No comments yet — leave the first!</p>
              )}
              {comments.map((c) => (
                <div key={c.id} style={{ background: '#fff8dc', border: '2px solid #e8c96a', borderRadius: 2, padding: '6px 8px', marginBottom: 6 }}>
                  <div style={{ fontFamily: "'Press Start 2P', cursive", fontSize: 7, color: '#8b4513', marginBottom: 3 }}>{c.author}</div>
                  <p style={{ fontSize: 12, color: '#333', lineHeight: 1.5 }}>{c.content}</p>
                </div>
              ))}

              {/* Post comment */}
              <div style={{ borderTop: '2px solid #e8c96a', marginTop: 10, paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Your name (optional)"
                  style={{ padding: '4px 8px', border: '2px solid #c8a050', fontSize: 8, background: '#fff', fontFamily: "'Press Start 2P', cursive" }}
                />
                <textarea
                  ref={commentRef}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && e.ctrlKey) postComment(); }}
                  placeholder="Leave a comment… (Ctrl+Enter)"
                  rows={2}
                  style={{ padding: '4px 8px', border: '2px solid #c8a050', fontSize: 8, background: '#fff', resize: 'none', fontFamily: "'Press Start 2P', cursive" }}
                />
                <button
                  onClick={postComment}
                  disabled={!newComment.trim() || posting}
                  className="pixel-btn text-xs"
                  style={{ fontFamily: "'Press Start 2P', cursive", fontSize: 8, opacity: !newComment.trim() || posting ? 0.5 : 1 }}
                >
                  {posting ? 'POSTING…' : 'POST COMMENT'}
                </button>
                {commentError && (
                  <div style={{ fontFamily: "'Press Start 2P', cursive", fontSize: 7, color: '#cc0000', lineHeight: 1.5 }}>
                    ✗ {commentError}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showBirthday && (
        <BirthdayScreen onRestart={() => { setShowBirthday(false); setPlayerRow(3); }} />
      )}
    </>
  );
}

// Decorative SVG assets — ink mountains, blossom branches, bamboo dividers

interface BlossomBranchProps {
  width?: number;
  height?: number;
  variant?: "tr" | "tl" | "br" | "bl";
  className?: string;
  style?: React.CSSProperties;
}

export function BlossomBranch({ width = 180, height = 120, variant = "tr", className = "", style = {} }: BlossomBranchProps) {
  const flipX = variant.includes("l") ? "scaleX(-1)" : "";
  const flipY = variant.includes("b") ? "scaleY(-1)" : "";
  const transform = [flipX, flipY].filter(Boolean).join(" ") || undefined;

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 180 120"
      className={className}
      style={{ display: "block", transform, ...style }}
    >
      <defs>
        <radialGradient id="petal" cx="0.4" cy="0.4">
          <stop offset="0" stopColor="#fce4e8" />
          <stop offset="0.6" stopColor="#f0b4c0" />
          <stop offset="1" stopColor="#d98ea0" />
        </radialGradient>
        <radialGradient id="petalDeep" cx="0.4" cy="0.4">
          <stop offset="0" stopColor="#f5c4cd" />
          <stop offset="1" stopColor="#c77a8b" />
        </radialGradient>
      </defs>
      {/* main branch */}
      <path d="M0,15 Q40,20 75,35 Q110,50 135,40 Q155,35 175,45" stroke="#3d2a22" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M45,22 Q55,10 70,5" stroke="#3d2a22" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M95,42 Q100,55 108,68" stroke="#3d2a22" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M135,40 Q145,25 155,20" stroke="#3d2a22" strokeWidth="1.3" fill="none" strokeLinecap="round" />
      <path d="M75,35 Q85,48 88,60" stroke="#3d2a22" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      {/* blossom clusters */}
      <BlossomCluster cx={70} cy={5} scale={1} />
      <BlossomCluster cx={98} cy={68} scale={0.9} />
      <BlossomCluster cx={135} cy={40} scale={1.1} deep />
      <BlossomCluster cx={155} cy={20} scale={0.8} />
      <BlossomCluster cx={45} cy={22} scale={0.85} />
      <BlossomCluster cx={88} cy={60} scale={0.7} />
      <BlossomCluster cx={25} cy={18} scale={0.75} />
      <BlossomCluster cx={175} cy={45} scale={0.9} deep />
      {/* buds */}
      <circle cx="115" cy="45" r="2.5" fill="url(#petalDeep)" />
      <circle cx="60" cy="30" r="2" fill="url(#petalDeep)" />
      <circle cx="150" cy="38" r="2.2" fill="url(#petalDeep)" />
    </svg>
  );
}

function BlossomCluster({ cx, cy, scale = 1, deep = false }: { cx: number; cy: number; scale?: number; deep?: boolean }) {
  const fill = deep ? "url(#petalDeep)" : "url(#petal)";
  return (
    <g>
      {Array.from({ length: 5 }, (_, i) => {
        const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
        const px = cx + Math.cos(a) * 5 * scale;
        const py = cy + Math.sin(a) * 5 * scale;
        return (
          <ellipse
            key={i}
            cx={px}
            cy={py}
            rx={4.5 * scale}
            ry={5.5 * scale}
            fill={fill}
            transform={`rotate(${i * 72} ${px} ${py})`}
            opacity="0.92"
          />
        );
      })}
      <circle cx={cx} cy={cy} r={1.8 * scale} fill="#c9a961" />
      {Array.from({ length: 4 }, (_, i) => {
        const a = (i / 4) * Math.PI * 2;
        return <circle key={i} cx={cx + Math.cos(a) * 2.2 * scale} cy={cy + Math.sin(a) * 2.2 * scale} r={0.5 * scale} fill="#8b6914" />;
      })}
    </g>
  );
}

interface InkMountainsProps {
  width?: number;
  height?: number;
  opacity?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function InkMountains({ width = 400, height = 80, opacity = 0.55, className = "", style = {} }: InkMountainsProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 400 80"
      className={className}
      style={{ display: "block", ...style }}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="mtFade" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#4a6478" stopOpacity="0.75" />
          <stop offset="1" stopColor="#8fa3b5" stopOpacity="0.25" />
        </linearGradient>
        <linearGradient id="mtFade2" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#6b8599" stopOpacity="0.55" />
          <stop offset="1" stopColor="#a8bac8" stopOpacity="0.1" />
        </linearGradient>
      </defs>
      <path d="M0,55 Q25,40 55,50 T110,45 Q140,30 175,40 T240,38 Q280,28 320,42 T400,40 L400,80 L0,80 Z" fill="url(#mtFade2)" opacity={opacity} />
      <path d="M0,62 Q20,55 45,58 Q70,45 95,55 Q130,62 160,52 Q195,42 225,55 Q260,62 295,50 Q330,42 365,55 Q385,60 400,55 L400,80 L0,80 Z" fill="url(#mtFade)" opacity={opacity * 0.85} />
      <path d="M0,72 Q15,65 40,70 Q65,60 90,68 Q120,74 150,66 Q180,58 210,70 Q240,76 270,66 Q300,58 335,70 Q365,76 400,68 L400,80 L0,68 Z" fill="#4a6478" opacity={opacity * 0.5} />
      <circle cx="80" cy="50" r="1.5" fill="#4a6478" opacity="0.3" />
      <circle cx="260" cy="45" r="2" fill="#4a6478" opacity="0.25" />
      <circle cx="340" cy="52" r="1.2" fill="#4a6478" opacity="0.3" />
    </svg>
  );
}

interface BambooDividerProps {
  width?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function BambooDivider({ width = 200, className = "", style = {} }: BambooDividerProps) {
  return (
    <svg width={width} height="10" viewBox={`0 0 ${width} 10`} className={className} style={{ display: "block", ...style }}>
      <line x1="0" y1="5" x2={width * 0.3} y2="5" stroke="#c9a961" strokeWidth="0.5" />
      <circle cx={width * 0.35} cy="5" r="2" fill="none" stroke="#c9a961" strokeWidth="0.5" />
      <circle cx={width * 0.5} cy="5" r="1" fill="#b23b2e" />
      <circle cx={width * 0.65} cy="5" r="2" fill="none" stroke="#c9a961" strokeWidth="0.5" />
      <line x1={width * 0.7} y1="5" x2={width} y2="5" stroke="#c9a961" strokeWidth="0.5" />
    </svg>
  );
}

interface SectionTitleProps {
  cn: string;
  en: string;
}

export function SectionTitle({ cn, en }: SectionTitleProps) {
  return (
    <div className="flex items-end gap-3 mb-3">
      <div>
        <div style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 17, fontWeight: 500, color: "var(--ink-dark)", lineHeight: 1, letterSpacing: 1 }}>{cn}</div>
        <div style={{ fontFamily: "'Cormorant SC', serif", fontSize: 9, letterSpacing: 2, color: "var(--ink-faint)", marginTop: 5, textTransform: "uppercase" }}>{en}</div>
      </div>
      <div className="flex-1 mb-1" style={{ height: 1, background: "var(--border-ink)" }} />
    </div>
  );
}

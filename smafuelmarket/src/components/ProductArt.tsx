import type { ArtKey } from "@/lib/catalog";

/**
 * Product imagery is drawn inline as SVG rather than loaded from an image host,
 * so the catalogue renders identically offline with no third-party requests.
 * Each product supplies a glyph key plus a hue; the same artwork is reused at
 * every size from rail thumbnail to product page hero.
 *
 * When the backend lands, this is the seam where Cloudinary URLs take over:
 * products gain an `images[]` field and this component becomes the fallback for
 * items that have no photograph yet.
 */

type Props = {
  art: ArtKey;
  hue: number;
  className?: string;
  /** Skips the tinted backdrop, for art sitting on a white card. */
  bare?: boolean;
};

function palette(hue: number) {
  return {
    bg: `hsl(${hue} 45% 94%)`,
    bgAlt: `hsl(${hue} 40% 88%)`,
    mid: `hsl(${hue} 34% 62%)`,
    deep: `hsl(${hue} 42% 36%)`,
    shadow: `hsl(${hue} 25% 80%)`,
  };
}

type Pal = ReturnType<typeof palette>;

export default function ProductArt({ art, hue, className, bare = false }: Props) {
  const p = palette(hue);
  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      role="img"
      aria-label={`${art} illustration`}
      preserveAspectRatio="xMidYMid meet"
    >
      {!bare && <rect width="200" height="200" rx="6" fill={p.bg} />}
      {!bare && <ellipse cx="100" cy="168" rx="54" ry="8" fill={p.shadow} opacity="0.6" />}
      <g>{glyph(art, p)}</g>
    </svg>
  );
}

/* ---- Shared silhouettes ------------------------------------------------- */

function Bottle({ p, cap, label = true }: { p: Pal; cap: string; label?: boolean }) {
  return (
    <>
      <rect x="86" y="26" width="28" height="16" rx="4" fill={cap} />
      <path d="M88 42h24l10 22v78a16 16 0 0 1-16 16H94a16 16 0 0 1-16-16V64z" fill={p.mid} />
      {label && <rect x="80" y="92" width="40" height="42" rx="4" fill={p.bgAlt} />}
      <path d="M88 42h24l4 9H84z" fill={p.deep} opacity="0.35" />
    </>
  );
}

function Can({ p, band }: { p: Pal; band: string }) {
  return (
    <>
      <rect x="70" y="38" width="60" height="124" rx="14" fill={p.mid} />
      <rect x="70" y="76" width="60" height="42" fill={band} />
      <ellipse cx="100" cy="40" rx="30" ry="8" fill={p.bgAlt} />
      <ellipse cx="100" cy="40" rx="14" ry="4" fill={p.deep} opacity="0.4" />
    </>
  );
}

function Bag({ p, accent }: { p: Pal; accent: string }) {
  return (
    <>
      <path d="M56 52c14-8 74-8 88 0l8 90c2 14-8 22-22 22H70c-14 0-24-8-22-22z" fill={p.mid} />
      <path d="M56 52c14-8 74-8 88 0l2 20c-16-8-76-8-92 0z" fill={accent} />
      <rect x="76" y="96" width="48" height="34" rx="5" fill={p.bgAlt} opacity="0.85" />
    </>
  );
}

function Box({ p, accent, tall = false }: { p: Pal; accent: string; tall?: boolean }) {
  const y = tall ? 34 : 58;
  const h = tall ? 128 : 96;
  return (
    <>
      <rect x="62" y={y} width="76" height={h} rx="6" fill={p.mid} />
      <rect x="62" y={y} width="76" height="26" rx="6" fill={accent} />
      <rect x="74" y={y + 42} width="52" height={h - 60} rx="4" fill={p.bgAlt} opacity="0.85" />
    </>
  );
}

/* ---- Glyphs -------------------------------------------------------------- */

function glyph(art: ArtKey, p: Pal) {
  switch (art) {
    case "soda":
      return <Bottle p={p} cap="#b3402f" />;
    case "water":
      return <Bottle p={p} cap="#3f86c4" />;
    case "juice":
      return <Bottle p={p} cap="#e0862c" />;
    case "cleaner":
      return (
        <>
          <path d="M96 30h20v16h-20z" fill={p.deep} />
          <path d="M116 34h22l10 14h-32z" fill={p.deep} />
          <path d="M86 46h40l8 24v72a14 14 0 0 1-14 14H92a14 14 0 0 1-14-14V70z" fill={p.mid} />
          <rect x="86" y="92" width="40" height="38" rx="4" fill={p.bgAlt} />
        </>
      );
    case "detergent":
      return (
        <>
          <rect x="76" y="52" width="52" height="20" rx="6" fill={p.deep} />
          <path d="M70 72h64v70a18 18 0 0 1-18 18H88a18 18 0 0 1-18-18z" fill={p.mid} />
          <rect x="82" y="96" width="40" height="34" rx="4" fill={p.bgAlt} />
          <circle cx="100" cy="113" r="9" fill={p.deep} opacity="0.5" />
        </>
      );
    case "sanitizer":
      return (
        <>
          <rect x="90" y="20" width="20" height="14" rx="3" fill={p.deep} />
          <path d="M84 34h32l-4 12h-24z" fill={p.deep} opacity="0.6" />
          <path d="M78 46h44v96a16 16 0 0 1-16 16H94a16 16 0 0 1-16-16z" fill={p.mid} />
          <rect x="86" y="86" width="28" height="40" rx="4" fill={p.bgAlt} />
        </>
      );
    case "oil":
      return (
        <>
          <rect x="84" y="24" width="26" height="18" rx="4" fill={p.deep} />
          <path d="M62 42h76a14 14 0 0 1 14 14v86a18 18 0 0 1-18 18H66a18 18 0 0 1-18-18V56a14 14 0 0 1 14-14z" fill={p.mid} />
          <rect x="66" y="84" width="68" height="48" rx="5" fill={p.bgAlt} />
          <path d="M138 60h14v34h-14z" fill={p.deep} opacity="0.4" />
        </>
      );
    case "coolant":
      return (
        <>
          <rect x="88" y="26" width="24" height="16" rx="4" fill={p.deep} />
          <path d="M64 42h72v100a18 18 0 0 1-18 18H82a18 18 0 0 1-18-18z" fill={p.mid} />
          <rect x="74" y="80" width="52" height="46" rx="5" fill={p.bgAlt} />
          <path d="M100 92l10 18a11 11 0 1 1-20 0z" fill={p.deep} opacity="0.55" />
        </>
      );

    case "energy":
      return <Can p={p} band="#6d4bb8" />;
    case "soup":
      return <Can p={p} band="#c0722f" />;
    case "beer":
      return <Can p={p} band="#c39a3c" />;
    case "petFood":
      return (
        <>
          <Bag p={p} accent="#5f8f4a" />
          <circle cx="100" cy="118" r="13" fill={p.deep} opacity="0.45" />
        </>
      );
    case "chips":
      return <Bag p={p} accent="#e0a52c" />;
    case "nuts":
      return (
        <>
          <rect x="70" y="46" width="60" height="112" rx="12" fill={p.mid} />
          <rect x="70" y="46" width="60" height="18" rx="9" fill={p.deep} />
          <rect x="80" y="82" width="40" height="44" rx="5" fill={p.bgAlt} />
        </>
      );
    case "jerky":
      return (
        <>
          <Bag p={p} accent="#8a4a2c" />
          <path d="M84 104h32M84 116h24" stroke={p.deep} strokeWidth="5" strokeLinecap="round" opacity="0.5" />
        </>
      );

    case "coffee":
      return (
        <>
          <path d="M66 60h68l-8 86a18 18 0 0 1-18 16H92a18 18 0 0 1-18-16z" fill={p.mid} />
          <rect x="60" y="48" width="80" height="14" rx="7" fill={p.deep} />
          <rect x="86" y="40" width="28" height="10" rx="5" fill={p.deep} opacity="0.7" />
          <rect x="78" y="92" width="44" height="30" rx="4" fill={p.bgAlt} />
          <path d="M88 30c0-6 8-6 8-12M104 30c0-6 8-6 8-12" stroke={p.mid} strokeWidth="4" strokeLinecap="round" fill="none" />
        </>
      );
    case "milk":
      return (
        <>
          <path d="M72 58h56v84a18 18 0 0 1-18 18H90a18 18 0 0 1-18-18z" fill={p.bgAlt} />
          <path d="M72 58l14-26h28l14 26z" fill={p.mid} />
          <rect x="92" y="26" width="16" height="10" rx="3" fill={p.deep} />
          <rect x="82" y="92" width="36" height="38" rx="4" fill={p.mid} opacity="0.5" />
        </>
      );
    case "eggs":
      return (
        <>
          <path d="M44 108h112v34a12 12 0 0 1-12 12H56a12 12 0 0 1-12-12z" fill={p.mid} />
          {[62, 100, 138].map((x) => (
            <ellipse key={x} cx={x} cy="98" rx="20" ry="24" fill={p.bgAlt} />
          ))}
          <path d="M44 108h112" stroke={p.deep} strokeWidth="4" opacity="0.4" />
        </>
      );

    case "candy":
      return (
        <>
          <rect x="72" y="76" width="56" height="48" rx="10" fill={p.mid} />
          <path d="M72 84l-26-14v60l26-14z" fill={p.deep} opacity="0.65" />
          <path d="M128 84l26-14v60l-26-14z" fill={p.deep} opacity="0.65" />
          <path d="M86 92h28M86 106h20" stroke={p.bgAlt} strokeWidth="5" strokeLinecap="round" />
        </>
      );
    case "chocolate":
      return (
        <>
          <rect x="58" y="58" width="84" height="88" rx="7" fill={p.mid} />
          <rect x="58" y="58" width="84" height="26" rx="7" fill={p.deep} opacity="0.5" />
          {[0, 1, 2].map((r) =>
            [0, 1, 2].map((c) => (
              <rect key={`${r}-${c}`} x={66 + c * 24} y={92 + r * 18} width="20" height="14" rx="3" fill={p.bgAlt} opacity="0.7" />
            )),
          )}
        </>
      );
    case "gum":
      return (
        <>
          <rect x="76" y="44" width="48" height="112" rx="8" fill={p.mid} />
          <rect x="76" y="44" width="48" height="30" rx="8" fill={p.deep} />
          <rect x="86" y="86" width="28" height="52" rx="4" fill={p.bgAlt} />
        </>
      );

    case "bread":
      return (
        <>
          <path d="M48 90c0-22 22-36 52-36s52 14 52 36v46a14 14 0 0 1-14 14H62a14 14 0 0 1-14-14z" fill={p.mid} />
          <path d="M62 78c10-10 66-10 76 0" stroke={p.bgAlt} strokeWidth="6" fill="none" strokeLinecap="round" />
          <rect x="70" y="112" width="60" height="6" rx="3" fill={p.bgAlt} opacity="0.6" />
        </>
      );
    case "donut":
      return (
        <>
          <circle cx="100" cy="104" r="52" fill={p.mid} />
          <circle cx="100" cy="104" r="50" fill={p.deep} opacity="0.25" />
          <circle cx="100" cy="104" r="18" fill={p.bg} />
          <path d="M52 100a48 48 0 0 1 96 0c0 8-6 10-12 6s-14-2-18 4-16 6-22 0-14-8-22-4-22 2-22-6z" fill={p.bgAlt} />
          {[[74, 88], [120, 84], [96, 76], [132, 108], [66, 116]].map(([x, y], i) => (
            <rect key={i} x={x} y={y} width="11" height="4" rx="2" fill={p.deep} opacity="0.7" transform={`rotate(${i * 37} ${x} ${y})`} />
          ))}
        </>
      );
    case "muffin":
      return (
        <>
          <path d="M66 96h68l-8 54a12 12 0 0 1-12 10H86a12 12 0 0 1-12-10z" fill={p.mid} />
          <path d="M60 96c0-26 18-42 40-42s40 16 40 42z" fill={p.deep} opacity="0.55" />
          {[[82, 76], [104, 68], [120, 84], [94, 88]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="5" fill={p.bg} />
          ))}
          <path d="M74 110h52M78 128h44" stroke={p.bgAlt} strokeWidth="4" strokeLinecap="round" opacity="0.6" />
        </>
      );
    case "sandwich":
      return (
        <>
          <path d="M48 88c0-18 24-30 52-30s52 12 52 30z" fill={p.mid} />
          <rect x="46" y="88" width="108" height="12" rx="5" fill="#e8c15c" />
          <path d="M50 100h100l-8 12H58z" fill="#d9a05b" />
          <path d="M46 112h108v18a14 14 0 0 1-14 14H60a14 14 0 0 1-14-14z" fill={p.mid} />
        </>
      );
    case "hotdog":
      return (
        <>
          <path d="M40 106c0-16 14-26 30-26h60c16 0 30 10 30 26s-14 26-30 26H70c-16 0-30-10-30-26z" fill={p.mid} />
          <path d="M50 100c0-10 10-16 22-16h56c12 0 22 6 22 16s-10 16-22 16H72c-12 0-22-6-22-16z" fill="#b5533a" />
          <path d="M58 96c14 10 30-8 44 2s26-8 40 2" stroke="#e8c15c" strokeWidth="6" fill="none" strokeLinecap="round" />
        </>
      );
    case "pizza":
      return (
        <>
          <path d="M100 36l52 104a8 8 0 0 1-7 12H55a8 8 0 0 1-7-12z" fill={p.mid} />
          <path d="M100 56l40 82H60z" fill="#d9822b" opacity="0.75" />
          {[[92, 96], [112, 116], [84, 126]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="7" fill="#a8402f" />
          ))}
        </>
      );
    case "iceCream":
      return (
        <>
          <rect x="66" y="66" width="68" height="90" rx="10" fill={p.mid} />
          <rect x="60" y="56" width="80" height="16" rx="8" fill={p.deep} />
          <path d="M72 96c8-14 20-6 28-16s22 0 28-10v50H72z" fill={p.bgAlt} opacity="0.8" />
        </>
      );

    case "cereal":
      return <Box p={p} accent="#d98b2b" tall />;
    case "pasta":
      return <Box p={p} accent="#c4622f" tall />;
    case "pills":
      return (
        <>
          <Box p={p} accent="#3f86c4" />
          <path d="M92 108h16M100 100v16" stroke={p.deep} strokeWidth="6" strokeLinecap="round" />
        </>
      );
    case "bandage":
      return (
        <>
          <Box p={p} accent="#c4553f" />
          <rect x="80" y="98" width="40" height="14" rx="7" fill={p.deep} opacity="0.6" transform="rotate(-20 100 105)" />
        </>
      );
    case "cigarettes":
      return (
        <>
          <Box p={p} accent="#8a3a2f" />
          <rect x="76" y="72" width="48" height="10" rx="3" fill={p.bgAlt} />
          <text x="100" y="130" textAnchor="middle" fontSize="20" fontWeight="700" fill={p.deep} opacity="0.7">
            21+
          </text>
        </>
      );
    case "toothpaste":
      return (
        <>
          <path d="M62 84h76v40a14 14 0 0 1-14 14H76a14 14 0 0 1-14-14z" fill={p.mid} />
          <path d="M138 96h12v16h-12z" fill={p.deep} />
          <path d="M62 84l-14-8v56l14-8z" fill={p.deep} opacity="0.45" />
          <rect x="76" y="98" width="44" height="12" rx="4" fill={p.bgAlt} />
        </>
      );

    case "wiper":
      return (
        <>
          <path d="M32 132h136" stroke={p.mid} strokeWidth="12" strokeLinecap="round" />
          <path d="M44 118h112" stroke={p.deep} strokeWidth="7" strokeLinecap="round" opacity="0.7" />
          {[60, 90, 120, 148].map((x) => (
            <rect key={x} x={x} y="112" width="6" height="22" rx="3" fill={p.mid} />
          ))}
          <path d="M96 62l8 50" stroke={p.mid} strokeWidth="9" strokeLinecap="round" />
        </>
      );
    case "airFreshener":
      return (
        <>
          <path d="M100 34v22" stroke={p.deep} strokeWidth="4" strokeLinecap="round" />
          <path d="M100 56l44 40-44 62-44-62z" fill={p.mid} />
          <path d="M100 78l26 22-26 38-26-38z" fill={p.bgAlt} opacity="0.75" />
        </>
      );
    case "phoneCharger":
      return (
        <>
          <rect x="72" y="34" width="56" height="52" rx="12" fill={p.mid} />
          <rect x="84" y="86" width="32" height="26" rx="6" fill={p.deep} opacity="0.7" />
          <rect x="86" y="112" width="28" height="52" rx="12" fill={p.mid} />
          <rect x="92" y="50" width="16" height="8" rx="4" fill={p.bgAlt} />
          <rect x="92" y="64" width="16" height="8" rx="4" fill={p.bgAlt} />
        </>
      );
    case "battery":
      return (
        <>
          {[74, 112].map((x, i) => (
            <g key={x}>
              <rect x={x} y="46" width="26" height="108" rx="5" fill={i ? p.deep : p.mid} />
              <rect x={x + 7} y="38" width="12" height="10" rx="3" fill={p.deep} />
              <rect x={x + 4} y="84" width="18" height="30" rx="3" fill={p.bgAlt} opacity="0.85" />
            </g>
          ))}
        </>
      );
    case "lightbulb":
      return (
        <>
          <circle cx="100" cy="86" r="40" fill={p.mid} />
          <path d="M84 122h32v14a10 10 0 0 1-10 10h-12a10 10 0 0 1-10-10z" fill={p.deep} />
          <rect x="86" y="146" width="28" height="8" rx="4" fill={p.deep} opacity="0.7" />
          <path d="M92 96c0-14 16-14 16-28" stroke={p.bgAlt} strokeWidth="5" fill="none" strokeLinecap="round" />
        </>
      );
    case "paperTowel":
      return (
        <>
          <rect x="70" y="40" width="60" height="118" rx="8" fill={p.bgAlt} />
          <rect x="70" y="40" width="60" height="118" rx="8" fill={p.mid} opacity="0.35" />
          <ellipse cx="100" cy="42" rx="30" ry="9" fill={p.mid} />
          <ellipse cx="100" cy="42" rx="11" ry="4" fill={p.deep} />
          <path d="M130 78h18v56l-18 8z" fill={p.bgAlt} />
          <path d="M100 60v88" stroke={p.deep} strokeWidth="3" opacity="0.3" strokeDasharray="6 8" />
        </>
      );
    case "lighter":
      return (
        <>
          <rect x="80" y="66" width="40" height="90" rx="12" fill={p.mid} />
          <rect x="84" y="52" width="32" height="16" rx="4" fill={p.deep} />
          <path d="M100 22c10 12 14 20 4 28-8-4-8-12-4-28z" fill="#e08a2c" />
          <rect x="88" y="96" width="24" height="34" rx="4" fill={p.bgAlt} />
        </>
      );
    case "petTreat":
      return (
        <>
          <path d="M56 92a16 16 0 1 1 22-15h44a16 16 0 1 1 0 30H78a16 16 0 0 1-22-15z" fill={p.mid} />
          <path d="M56 128a16 16 0 1 1 22-15h44a16 16 0 1 1 0 30H78a16 16 0 0 1-22-15z" fill={p.deep} opacity="0.6" />
        </>
      );

    default:
      return <rect x="64" y="64" width="72" height="72" rx="10" fill={p.mid} />;
  }
}

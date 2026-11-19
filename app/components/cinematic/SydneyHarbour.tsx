import "./sydney-harbour.css";

// The landmarks, skyline and light passes are authored vectors, not frames from
// the background film. The full scene is present even before hydration.
const resolution = 24;
const bridgeSpan = { left: 112, width: 630 };
const horizon = 435;

function steelPoint(t: number, lower = false) {
  const rise = Math.pow(Math.sin(Math.PI * t), lower ? 0.94 : 0.81);
  return [bridgeSpan.left + bridgeSpan.width * t, (lower ? 398 : 366) - (lower ? 166 : 183) * rise] as const;
}

const xy = (point: readonly number[]) => point.map(value => value.toFixed(1)).join(" ");
const bridgeStations = Array.from({ length: resolution + 1 }, (_, index) => index / resolution);
const archTop = `M${bridgeStations.map(t => xy(steelPoint(t))).join("L")}`;
const archBase = `M${bridgeStations.map(t => xy(steelPoint(t, true))).join("L")}`;
const archBraces = bridgeStations.slice(0, -1).map((t, index) => {
  const next = bridgeStations[index + 1];
  const top = xy(steelPoint(t));
  const base = xy(steelPoint(t, true));
  return `M${top}L${base}M${index % 2 ? top : base}L${xy(steelPoint(next, Boolean(index % 2)))}`;
}).join("");
const hangers = bridgeStations.slice(2, -2).map(t => {
  const point = steelPoint(t, true);
  return `M${xy(point)}V382`;
}).join("");
const girder = Array.from({ length: 71 }, (_, index) => `M${index * 12} 388l12 10 12-10`).join("");

const towers = [
  [0, 39, 14], [43, 22, 26], [67, 40, 25], [106, 30, 39],
  [132, 18, 62], [157, 42, 54], [199, 52, 86], [222, 36, 52],
  [255, 39, 108], [300, 38, 79], [343, 25, 124], [370, 51, 83],
  [425, 35, 62], [464, 66, 41], [528, 36, 47], [565, 51, 34],
  [614, 32, 60], [649, 44, 76], [698, 26, 95], [732, 41, 111],
  [777, 24, 69], [804, 34, 91], [839, 29, 143], [872, 51, 108],
  [929, 27, 71], [961, 25, 96], [990, 32, 49], [1024, 29, 54],
  [1061, 56, 41], [1121, 42, 25],
] as const;

function noise(key: number) {
  const value = Math.sin(key * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
}

const skyline = towers.map(([x, width, height], index) => {
  const baseline = horizon - 13;
  const roof = baseline - height;
  return `M${x} ${baseline}V${roof}H${x + 3}v-3h${width - 8}v3H${x + width}V${baseline}Z${index % 6 === 0 ? `M${x + 7} ${roof}v-6h2v6Z` : ""}`;
}).join("");

function towerWindows(highlights: boolean) {
  return towers.map(([x, width, height], tower) => {
    let lights = "";
    for (let y = horizon - height - 7; y < horizon - 16; y += 6.8) {
      for (let i = 4; i < width - 3; i += 5.8) {
        const intensity = noise(x + i + y * 21 + tower);
        if (highlights ? intensity > 0.79 : intensity < 0.55) {
          lights += `M${(x + i).toFixed(1)} ${y.toFixed(1)}h${highlights ? 1.8 : 1.2}`;
        }
      }
    }
    return lights;
  }).join("");
}

function currentLines(band: number) {
  return Array.from({ length: 78 }, (_, index) => {
    const key = index + band * 80;
    const depth = noise(key + 11);
    const x = noise(key) * 1240 - 20;
    const y = horizon + 13 + depth * 266;
    const length = (3 + noise(key + 283) * 47) * (0.22 + depth * 1.8);
    return `M${x.toFixed(1)} ${y.toFixed(1)}q${(length * .48).toFixed(1)} ${(noise(key + 53) - .5).toFixed(1)} ${length.toFixed(1)} 0`;
  }).join("");
}

function reflectionLines(center: number, spread: number, count: number, reach: number) {
  return Array.from({ length: count }, (_, index) => {
    const key = index + center;
    const depth = (index / count) ** 1.06;
    const y = horizon + 4 + depth * reach + noise(key + 32) * (5 + depth * 12);
    const x = center + (center - 550) * depth * .14 + (noise(key) - .5) * spread * (1 + depth * 1.6);
    const length = (noise(key + 265) + .18) * (8 + 44 * depth);
    return `M${x.toFixed(1)} ${y.toFixed(1)}h${length.toFixed(1)}`;
  }).join("");
}

const sailPaths = [
  { shell: "M767 415Q801 397 808 368Q831 384 839 415Z", edge: "M767 415Q801 397 808 368", tone: "pearl" },
  { shell: "M811 416C856 392 879 351 869 306C904 323 930 365 933 416Z", edge: "M811 416C856 392 879 351 869 306", tone: "lilac" },
  { shell: "M861 417C913 392 932 338 910 254C953 278 996 331 993 382Q988 402 977 417Z", edge: "M861 417C913 392 932 338 910 254C953 278 996 331 993 382", tone: "pearl" },
  { shell: "M919 417C953 400 992 354 981 311C1002 327 1022 366 1024 415Z", edge: "M919 417C953 400 992 354 981 311", tone: "lilac" },
  { shell: "M965 415C1017 394 1041 352 1026 302C1071 329 1094 371 1086 399L1073 415Z", edge: "M965 415C1017 394 1041 352 1026 302C1071 329 1094 371 1086 399", tone: "pearl" },
  { shell: "M1055 414C1086 399 1102 376 1097 358C1118 370 1133 394 1138 413Z", edge: "M1055 414C1086 399 1102 376 1097 358", tone: "lilac" },
] as const;

function MasonryPylon({ x }: { x: number }) {
  return (
    <g transform={`translate(${x} 0)`}>
      <path d="M-3 424H71V437H-3ZM3 415H65V425H3Z" fill="#2b2438" stroke="#705170" />
      <path d="M7 416L13 321H49L57 416Z" fill="url(#sh-masonry)" stroke="#b58cad" />
      <path d="M49 321L58 317L66 407L57 416Z" fill="#242039" stroke="#655778" />
      <path d="M10 313H53L58 317L49 325H10Z" fill="#967184" stroke="#e3a599" />
      <path d="M11 309L48 309L53 314H9Z" fill="#edbf9b" />
      <path d="M23 326L20 415M39 326L44 416M12 338H51M11 348H51M10 358H52M9 368H53M8 378H54M8 388H55M7 398H56M7 408H56" stroke="#eab49f" strokeWidth=".55" opacity=".52" />
      <path d="M28 330H35V355H27ZM28 373H36L37 415H27Z" fill="#21192d" />
      <path d="M29 332H34V347H29Z" fill="#ffd291" opacity=".83" />
    </g>
  );
}

export function SydneyHarbour() {
  return (
    <div className="sydney-harbour" data-sydney-harbour aria-hidden="true">
      <div className="sydney-harbour-scene">
        <svg viewBox="0 0 1200 720" focusable="false">
          <defs>
            <radialGradient id="sh-sky" cx=".45" cy=".83" r=".67">
              <stop stopColor="#335caf" stopOpacity=".78" />
              <stop offset=".43" stopColor="#23285e" stopOpacity=".63" />
              <stop offset="1" stopColor="#121529" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="sh-bloom">
              <stop stopColor="#d4447c" stopOpacity=".82" />
              <stop offset=".36" stopColor="#8c2d7a" stopOpacity=".51" />
              <stop offset="1" stopColor="#562580" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="sh-haze">
              <stop stopColor="#7269c9" stopOpacity=".5" />
              <stop offset=".58" stopColor="#4b63b7" stopOpacity=".29" />
              <stop offset="1" stopColor="#4371ae" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="sh-steel" x1="0" x2="1" y1="0" y2=".74">
              <stop stopColor="#5269a5" />
              <stop offset=".32" stopColor="#92c9f1" />
              <stop offset=".63" stopColor="#bca3e6" />
              <stop offset="1" stopColor="#af536f" />
            </linearGradient>
            <linearGradient id="sh-masonry">
              <stop stopColor="#665374" />
              <stop offset=".39" stopColor="#c18f83" />
              <stop offset=".66" stopColor="#906982" />
              <stop offset="1" stopColor="#473758" />
            </linearGradient>
            <linearGradient id="sh-pearl" x1=".94" x2=".13" y1=".82" y2=".21">
              <stop stopColor="#4e426a" />
              <stop offset=".31" stopColor="#ad87a0" />
              <stop offset=".67" stopColor="#f8d1ab" />
              <stop offset="1" stopColor="#fff0d0" />
            </linearGradient>
            <linearGradient id="sh-lilac" x1=".94" x2=".23" y1=".89" y2=".10">
              <stop stopColor="#312545" />
              <stop offset=".45" stopColor="#7662a4" />
              <stop offset="1" stopColor="#dac0d2" />
            </linearGradient>
            <linearGradient id="sh-glass" x2="0" y2="1">
              <stop stopColor="#151425" />
              <stop offset="1" stopColor="#4a364d" />
            </linearGradient>
            <linearGradient id="sh-water" x2="0" y2="1">
              <stop stopColor="#171f3b" stopOpacity=".92" />
              <stop offset=".31" stopColor="#19223f" stopOpacity=".91" />
              <stop offset="1" stopColor="#101321" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="sh-windows">
              <stop stopColor="#7189af" />
              <stop offset=".52" stopColor="#5da8ce" />
              <stop offset="1" stopColor="#d28da9" />
            </linearGradient>
            <linearGradient id="sh-reflection" x2="0" y2="1">
              <stop stopColor="white" />
              <stop offset=".57" stopColor="white" stopOpacity=".66" />
              <stop offset="1" stopColor="white" stopOpacity="0" />
            </linearGradient>
            <mask id="sh-water-mask" maskUnits="userSpaceOnUse" x="0" y={horizon} width="1200" height="270">
              <rect x="0" y={horizon} width="1200" height="270" fill="url(#sh-reflection)" />
            </mask>
            <pattern id="sh-tiles" width="5" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(-28)">
              <path d="M0 0H5M0 2H5M2.5 0V2M0 2V4" fill="none" stroke="#4e466f" strokeWidth=".34" />
            </pattern>
          </defs>
          <rect x="0" y="30" width="1200" height={horizon} fill="url(#sh-sky)" />
          <ellipse cx="985" cy="337" rx="460" ry="256" fill="url(#sh-bloom)" />
          <ellipse cx="472" cy="327" rx="540" ry="127" fill="url(#sh-haze)" />
          <path d={Array.from({ length: 31 }, (_, index) => `M${(70 + noise(index) * 1110).toFixed(1)} ${(83 + noise(index + 560) * 169).toFixed(1)}h.7`).join("")} stroke="#c5cff8" strokeWidth=".8" opacity=".48" />
          <path d="M0 329C214 318 308 330 468 312S771 289 869 288 1042 284 1200 249M0 344C158 335 350 365 535 325S768 296 910 295 1053 295 1200 265M92 357C222 360 288 364 437 343S728 317 964 330 1092 319 1200 319" fill="none" stroke="#bd82bd" opacity=".16" />
          <path d="M107 155h46m949 0h43M89 155v16m1073-16v16M89 527v-16m1073 16v-16M107 527h46m949 0h43" fill="none" stroke="#caa4c3" strokeWidth="1" opacity=".42" />
          <g className="sydney-harbour-skyline">
            <path d={skyline} fill="#181a32" stroke="#5d5485" strokeWidth=".9" />
            <path d={towerWindows(false)} stroke="url(#sh-windows)" strokeWidth=".95" opacity=".72" />
            <path d={towerWindows(true)} stroke="#f5b985" strokeWidth="1.15" opacity=".76" />
            <path d="M936 421L940 297H944L948 421Z" fill="#4d2d43" stroke="#b46c7d" strokeWidth=".7" />
            <path d="M940 301L931 292L929 283H955L953 293L944 301Z" fill="#8b555d" stroke="#db997a" />
            <path d="M935 279Q942 274 950 279L955 284H929Z" fill="#edbb90" />
            <path d="M942 276V248" stroke="#eeb995" />
            <circle cx="942" cy="248" r="1.4" fill="#ffcfaa" />
          </g>
          <g>
            <path d="M0 416C62 418 117 406 200 409L288 424 470 419 678 415 794 425 955 419 1117 412 1200 423V443H0Z" fill="#131222" />
            <path d="M0 426L115 422 160 431 271 432 351 428 540 431 652 425 859 434 1082 427 1200 433" fill="none" stroke="url(#sh-windows)" opacity=".75" />
            <path d="M0 434H1200" stroke="#b8a3d6" strokeWidth=".8" opacity=".49" />
          </g>
          <rect x="0" y={horizon} width="1200" height="285" fill="url(#sh-water)" />
          <g className="sydney-harbour-ripples" mask="url(#sh-water-mask)" fill="none" strokeLinecap="round">
            <path d={currentLines(0)} stroke="#6577bb" strokeWidth="1.05" opacity=".49" />
            <path d={currentLines(1)} stroke="#293d65" strokeWidth="2.3" opacity=".55" />
            <path d={currentLines(2)} stroke="#c189b0" strokeWidth=".65" opacity=".45" />
            <path d={reflectionLines(150, 86, 40, 146)} stroke="#b092da" strokeWidth="1.5" opacity=".61" />
            <path d={reflectionLines(387, 161, 68, 222)} stroke="#579fd7" strokeWidth="1.5" opacity=".63" />
            <path d={reflectionLines(570, 45, 30, 97)} stroke="#8ccee6" strokeWidth="1.4" opacity=".57" />
            <path d={reflectionLines(708, 44, 59, 173)} stroke="#dc9e96" strokeWidth="1.35" opacity=".74" />
            <path d={reflectionLines(884, 106, 54, 189)} stroke="#d360a2" strokeWidth="2.1" opacity=".68" />
            <path d={reflectionLines(968, 55, 62, 214)} stroke="#fdd0a0" strokeWidth="1.65" opacity=".79" />
            <path d={reflectionLines(1060, 79, 46, 152)} stroke="#bd7abf" strokeWidth="1.5" opacity=".68" />
            <path d="M188 453h26m40 1h79m146 20h64m95 8h23m203-24h45m17-13h102m-121 77h87m-139 52h70m-380 10h76m477-78h62" stroke="#f7bfc4" strokeWidth="1.15" opacity=".61" />
          </g>
          <g className="sydney-harbour-bridge" fill="none">
            <g transform="translate(31 -18) scale(.99 1)" stroke="#696293" opacity=".78">
              <path d={archTop} strokeWidth="4" />
              <path d={archBase} strokeWidth="3.5" />
              <path d={archBraces} strokeWidth="1.2" />
              <path d={hangers} strokeWidth="1.25" />
              <path d="M0 390H835" strokeWidth="7" />
            </g>
            <path d={bridgeStations.slice(2, -2).map(t => {
              const point = steelPoint(t);
              return `M${xy(point)}l${(31 - point[0] * .01).toFixed(1)}-18`;
            }).join("")} stroke="#8b7ab4" strokeWidth="1.15" />
            <MasonryPylon x={122} />
            <MasonryPylon x={703} />
            <path d={hangers} stroke="#8f91bb" opacity=".85" strokeWidth="1.55" />
            <path d={archBraces} stroke="url(#sh-steel)" strokeWidth="2.2" />
            <path d={archBase} stroke="#211b39" strokeWidth="7" />
            <path d={archBase} stroke="url(#sh-steel)" strokeWidth="3.5" />
            <path d={archTop} stroke="#403b6c" strokeWidth="9" />
            <path d={archTop} stroke="url(#sh-steel)" strokeWidth="4.7" />
            <path d={archTop} stroke="#cae2ff" strokeWidth="1.15" opacity=".79" transform="translate(0 -2.15)" />
            <path d="M0 382H846V401H0Z" fill="#231d38" />
            <path d={girder} stroke="#956887" opacity=".75" />
            <path d="M0 382H846M0 400H846" stroke="url(#sh-steel)" strokeWidth="1.6" />
            <path d="M0 379H835" stroke="#fac481" strokeWidth="2.5" strokeLinecap="round" strokeDasharray=".6 9.6" opacity=".88" />
            <path d="M19 381H83m139 0h39m298 0h53m137 0h80" stroke="#ffe2ad" strokeWidth="1.4" opacity=".7" />
            <MasonryPylon x={91} />
            <MasonryPylon x={674} />
            <path d="M394 184v-10m11 7v-14" stroke="#8791b9" strokeWidth="1" />
            <path d="M394 174l9 2-9 2m11-11 9 2-9 2" fill="#d889a2" />
          </g>
          <g className="sydney-harbour-opera">
            <path d="M757 422L785 407H1138L1168 425 1132 440 779 443Z" fill="#271c32" stroke="#a46f8c" />
            <path d="M785 412L1126 405 1154 419 773 427Z" fill="#49314a" />
            {sailPaths.map(({ shell, edge, tone }) => (
              <g key={shell}>
                <path d={shell} fill={`url(#sh-${tone})`} stroke={tone === "pearl" ? "#fad4b0" : "#c3a5cb"} strokeWidth="1.34" strokeLinejoin="round" />
                <path d={shell} fill="url(#sh-tiles)" opacity=".53" />
                <path d={edge} fill="none" stroke={tone === "pearl" ? "#fff2d0" : "#dac4f2"} strokeWidth="1.65" strokeLinecap="round" opacity=".85" />
              </g>
            ))}
            <path d="M874 414Q934 378 921 278M890 413Q950 378 935 290M908 411Q962 378 949 309M929 409Q970 380 965 331M982 415Q1034 384 1033 320M998 413Q1053 386 1048 332M1016 412Q1066 382 1061 351" fill="none" stroke="#fff0cf" strokeWidth=".65" opacity=".62" />
            <path d="M932 414Q968 397 990 358Q1000 386 980 414ZM1031 414Q1069 395 1080 367Q1092 386 1074 414Z" fill="url(#sh-glass)" stroke="#e0afd0" strokeWidth=".75" />
            <path d="M950 410l1-7m8 7 3-13m7 11 4-19m6 15 6-25m59 33 2-7m8 6 3-10m7 6 5-16m-103 14 25-11m60 14 26-9" fill="none" stroke="#c2acd7" strokeWidth=".8" opacity=".77" />
            <path d="M780 416L1133 411 1145 418 777 424Z" fill="#73515b" stroke="#e0a488" />
            <path d="M776 425L1150 420 1157 427 777 433Z" fill="#53394e" />
            <path d="M790 421L1134 416" stroke="#ffc98d" strokeWidth="2.4" strokeDasharray="2 5" />
            <path d="M781 434L1145 428M784 438L1131 432" stroke="#d18987" strokeWidth=".88" opacity=".85" />
          </g>
          <g fill="none" strokeLinejoin="round" opacity=".91">
            <path d="M447 503h66l-14 8h-40zm15-1 5-9h25l9 9" fill="#41263c" stroke="#b97988" strokeWidth=".75" />
            <path d="M469 497h21" stroke="#f6c497" strokeWidth="1.5" strokeDasharray="2 2" />
            <path d="M420 511c28 1 74 10 126 2m-138 5c28 4 64 8 102 4m8 4c24 0 50-3 64-9" stroke="#929ac8" strokeWidth=".8" opacity=".71" />
          </g>
        </svg>
        <div className="sydney-harbour-caption">
          <span><b>01</b> Sydney After Dark</span>
          <span>Harbour study</span>
        </div>
      </div>
    </div>
  );
}

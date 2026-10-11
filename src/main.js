import * as THREE from "three";
import { COPY as C, UI } from "./copy.js";

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const pad = (n) => String(n).padStart(2, "0");
// ease between whole steps so panels rest centred instead of stopping mid-slide
const snap = (pos) => { const i = Math.floor(pos), f = pos - i; const t = clamp((f - 0.18) / 0.64); return i + t * t * (3 - 2 * t); };

/* ================= line-art icons (no text) ================= */
const ICONS = {
  research: `<circle cx="50" cy="50" r="26"/><path d="M70 70 L98 98"/><path class="acc" d="M38 46 H62 M38 56 H54"/>`,
  communication: `<rect x="18" y="32" width="84" height="56" rx="8"/><path class="acc" d="M18 40 L60 68 L102 40"/>`,
  decision: `<circle cx="60" cy="18" r="6"/><path d="M60 24 V50 M60 50 L30 80 M60 50 L90 80"/><circle cx="30" cy="86" r="6"/><circle class="acc" cx="90" cy="86" r="6"/><path class="acc" d="M84 86 l4 4 l8 -9"/>`,
  workflow: `<rect x="8" y="46" width="28" height="28" rx="6"/><rect x="46" y="46" width="28" height="28" rx="6"/><rect class="acc" x="84" y="46" width="28" height="28" rx="6"/><path d="M36 60 H46 M74 60 H84"/>`,
  followup: `<path d="M92 60 A32 32 0 1 1 78 33"/><path class="acc" d="M80 18 L80 36 L62 36"/><path d="M60 44 V62 L72 70"/>`,
  escalation: `<circle cx="42" cy="38" r="14"/><path d="M16 96 C16 70 68 70 68 96"/><path class="acc" d="M84 80 V32 M70 46 L84 32 L98 46"/>`,
  calendar: `<rect x="18" y="26" width="84" height="76" rx="8"/><path d="M18 46 H102 M40 16 V34 M80 16 V34"/><path class="acc" d="M36 64 h10 M56 64 h10 M76 64 h10 M36 82 h10 M56 82 h10"/>`,
  outreach: `<path d="M14 60 L100 24 L78 100 L56 70 Z"/><path class="acc" d="M100 24 L56 70"/>`,
  megaphone: `<path d="M20 50 H46 L88 28 V92 L46 70 H20 Z"/><path class="acc" d="M34 70 L40 98 H52 L48 72"/>`,
  chart: `<path d="M16 100 H104 M16 100 V20"/><path class="acc" d="M32 86 L52 62 L68 74 L100 36"/>`,
  cart: `<path d="M12 24 H28 L40 72 H92 L102 40 H34"/><circle cx="48" cy="90" r="6"/><circle class="acc" cx="84" cy="90" r="6"/>`,
  bank: `<path d="M12 44 L60 18 L108 44 Z"/><path class="acc" d="M26 50 V88 M46 50 V88 M74 50 V88 M94 50 V88 M16 98 H104"/>`,
};
const icon = (name) =>
  `<svg class="icon" viewBox="0 0 120 120" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${ICONS[name].replace(/<(path|circle|rect)\b/g, '<$1 pathLength="1"')}</svg>`;

const CAP_ICONS = ["research", "communication", "decision", "workflow", "followup", "escalation"];
const USED_ICONS = ["calendar", "outreach", "megaphone", "chart", "cart", "bank"];

/* ================= build the page from copy.js ================= */
const arrows = (arr) => arr.join(" <i>→</i> ");
const html = {
  hero: () => `
  <section id="top" class="track hero-track">
    <div class="stage hero-stage">
      <canvas id="gl" aria-hidden="true"></canvas>
      <div class="hero-copy" id="heroCopy">
        <h1>${C.title}</h1>
        <p>${C.what.parts[0]}</p>
        <a class="btn btn-primary" href="#cta">${UI.cta}</a>
      </div>
      <div class="ring-text" id="ringText">
        <span class="eyebrow">${C.what.heading}</span>
        <div class="ring-parts">${C.what.parts.slice(1).map((t, i) => `<p class="ring-part${i === 0 ? " is-active" : ""}">${t}</p>`).join("")}</div>
      </div>
      <div class="wedge" id="wedge"></div>
    </div>
  </section>`,

  problem: () => `
  <section class="track giant-track">
    <div class="stage giant-stage">
      <span class="eyebrow" id="giantEyebrow">${C.problem.heading}</span>
      <h2 class="giant" id="giant">${C.problem.lead.replace(" that is", "<br>that is")}</h2>
      <div class="giant-sub" id="giantSub">${C.problem.body.map((t) => `<p>${t}</p>`).join("")}</div>
    </div>
  </section>`,

  can: () => `
  <section id="what" class="track cap-track">
    <div class="stage cap-stage">
      <div class="cap-head"><h2>${C.can.heading}</h2><p class="mute">${C.can.intro}</p></div>
      <div class="cap-body">
        <ul class="acc" id="acc">${C.can.items.map(([t, d]) => `<li><h3>${t}</h3><p>${d}</p></li>`).join("")}</ul>
        <div class="cap-view glow"><div class="cap-strip" id="capStrip">${C.can.items.map((_, i) => `<div class="cap-card">${icon(CAP_ICONS[i])}<div class="skel"><i></i><i></i><i></i></div></div>`).join("")}</div></div>
      </div>
    </div>
  </section>`,

  how: () => `
  <section class="track how-track" id="how">
    <div class="stage car-stage">
      <div class="stage-head"><h2>${C.how.heading}</h2>${C.how.body.map((t) => `<p>${t}</p>`).join("")}</div>
      <div class="cards">${C.how.steps.map((s, i) => `
        <article class="card glow">
          <div class="card-ui"><ol class="stepper">${C.how.steps.map((n, j) => `<li class="${j === i ? "on" : j < i ? "done" : ""}">${n}</li>`).join("")}</ol></div>
          <div class="card-copy"><span class="num">${pad(i + 1)}</span><h3>${s}</h3></div>
        </article>`).join("")}</div>
      <div class="bar"><button class="arrow glow prev" aria-label="Previous">←</button><span class="count"></span><button class="arrow glow next" aria-label="Next">→</button></div>
    </div>
  </section>`,

  built: () => `
  <section class="track built-track">
    <div class="stage built-stage">
      <div class="built-text">
        <h2>${C.built.heading}</h2>
        <p class="lead">${C.built.lead}</p>
        <p class="mute">${C.built.intro}</p>
        <p class="chain" id="builtChain">${C.built.levels.map((l) => `<span>${l}</span>`).join("<i>→</i>")}</p>
        <p class="mute built-body" id="builtBody">${C.built.body}</p>
      </div>
      <div class="built-viz"><svg id="rings" viewBox="0 0 600 600" role="img" aria-label="${C.built.levels.join(" → ")}"><g id="ringsG">
        ${C.built.levels.map((_, i) => `<circle class="ring" cx="300" cy="300" r="${[270, 200, 130, 60][i]}" vector-effect="non-scaling-stroke"/>`).join("")}
        ${C.built.levels.map((l) => `<text class="rlabel" x="300" y="0" font-size="15">${l}</text>`).join("")}
      </g></svg></div>
    </div>
  </section>`,

  used: () => `
  <section class="track used-track" id="used">
    <div class="stage car-stage">
      <div class="stage-head"><h2>${C.used.heading}</h2></div>
      <div class="cards">${C.used.items.map(([t, d], i) => `
        <article class="card glow">
          <div class="card-ui">${i === 1
            ? `<ol class="stepper flow">${C.used.outreach.map((s, j) => `<li class="on" style="--d:${j}">${s}</li>`).join("")}</ol>`
            : icon(USED_ICONS[i])}</div>
          <div class="card-copy"><span class="num">${pad(i + 1)}</span><h3>${t}</h3><p>${d}</p></div>
        </article>`).join("")}</div>
      <div class="bar"><button class="arrow glow prev" aria-label="Previous">←</button><span class="count"></span><button class="arrow glow next" aria-label="Next">→</button></div>
    </div>
  </section>`,

  example: () => `
  <section class="track example-track">
    <div class="stage example-stage">
      <div class="example-text">
        <h2>${C.example.heading}</h2>
        <p class="lead">${C.example.lead}</p>
        <p class="mute">${C.example.intro}</p>
        <p class="mute example-body" id="exBody">${C.example.body}</p>
      </div>
      <ol class="tl" id="tl">${C.example.steps.map((s) => `<li>${s}</li>`).join("")}</ol>
    </div>
  </section>`,

  humans: () => `
  <section class="track humans-track">
    <div class="stage humans-stage">
      <div class="humans-text">
        <h2>${C.humans.heading}</h2>
        <p class="lead">${C.humans.lead}</p>
        <p class="mute">${C.humans.intro}</p>
        <p class="mute">${C.humans.body}</p>
      </div>
      <div class="loop-wrap"><svg id="loop" viewBox="-90 0 740 400" role="img" aria-label="${C.humans.loop.join(" → ")}">
        <circle class="loop-ring" cx="280" cy="200" r="140"/>
        ${C.humans.loop.map((l, i) => {
          const [x, y] = [[280, 60], [420, 200], [280, 340], [140, 200]][i];
          const [lx, ly, a] = [[280, 38, "middle"], [440, 206, "start"], [280, 376, "middle"], [120, 206, "end"]][i];
          return `<circle class="loop-node" cx="${x}" cy="${y}" r="9"/><text class="loop-label" x="${lx}" y="${ly}" text-anchor="${a}" font-size="19">${l}</text>`;
        }).join("")}
        <circle id="loopDot" cx="280" cy="60" r="6"/>
      </svg></div>
    </div>
  </section>`,

  outcome: () => `
  <section id="cta" class="outro">
    <span class="eyebrow reveal">${C.outcome.heading}</span>
    <p class="lead reveal">${C.outcome.lead}</p>
    <p class="mute reveal">${C.outcome.intro}</p>
    <h2 class="goal reveal">${C.outcome.goal.replace(". More", ".<br>More")}</h2>
    <div class="final reveal"><span class="eyebrow">${C.outcome.simplest}</span><h2 class="line">${C.outcome.line}</h2></div>
    <a class="btn btn-primary btn-lg glow reveal" href="#top">${UI.cta}</a>
  </section>`,
};
$("#app").innerHTML = Object.values(html).map((f) => f()).join("");
$("#brand").textContent = UI.brand;
$("#navCta").textContent = UI.cta;
$$(".glow").forEach((el) => { /* ensure ::after glow layer has a positioned parent */ });

/* ================= scroll plumbing ================= */
let target = scrollY, current = scrollY;
addEventListener("scroll", () => { target = scrollY; }, { passive: true });

const regs = [];
const tracks = $$(".track");
const geom = new Map();
function measure() { tracks.forEach((t) => geom.set(t, { top: t.offsetTop, h: t.offsetHeight })); }
measure();
addEventListener("load", measure);
addEventListener("resize", measure);
new ResizeObserver(measure).observe(document.body);
const progress = (t) => { const g = geom.get(t); return clamp((current - g.top) / Math.max(1, g.h - innerHeight)); };
const reg = (t, fn) => regs.push({ t, fn });
const scrollToProgress = (t, p) => { const g = geom.get(t); scrollTo({ top: g.top + p * (g.h - innerHeight), behavior: reduced ? "auto" : "smooth" }); };

document.addEventListener("pointermove", (e) => {
  const el = e.target.closest?.(".glow");
  if (!el) return;
  const r = el.getBoundingClientRect();
  el.style.setProperty("--mx", `${e.clientX - r.left}px`);
  el.style.setProperty("--my", `${e.clientY - r.top}px`);
});

const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && e.target.classList.add("in")), { threshold: 0.2 });
$$(".reveal").forEach((el, i) => { el.style.transitionDelay = `${(i % 6) * 80}ms`; io.observe(el); });

/* ================= 1 · HERO: Three.js particles ================= */
const canvas = $("#gl");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
camera.position.z = 11;

const COUNT = innerWidth < 760 ? 6000 : 13000;
const aT = new Float32Array(COUNT), aOff = new Float32Array(COUNT * 3), aSeed = new Float32Array(COUNT * 3), pos = new Float32Array(COUNT * 3);
const rnd = Math.random;
const gauss = () => (rnd() + rnd() + rnd() + rnd() - 2) / 2;
for (let i = 0; i < COUNT; i++) {
  aT[i] = rnd();
  aOff[i * 3] = gauss() * 1.6; aOff[i * 3 + 1] = gauss() * 1.1; aOff[i * 3 + 2] = gauss() * 2.0;
  aSeed[i * 3] = rnd(); aSeed[i * 3 + 1] = Math.floor(rnd() * 4); aSeed[i * 3 + 2] = rnd();
}
const geo = new THREE.BufferGeometry();
geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
geo.setAttribute("aT", new THREE.BufferAttribute(aT, 1));
geo.setAttribute("aOff", new THREE.BufferAttribute(aOff, 3));
geo.setAttribute("aSeed", new THREE.BufferAttribute(aSeed, 3));

const mat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  uniforms: { uTime: { value: 0 }, uMorph: { value: 0 }, uMouse: { value: new THREE.Vector2(99, 99) }, uPx: { value: renderer.getPixelRatio() } },
  vertexShader: /* glsl */ `
    attribute float aT; attribute vec3 aOff; attribute vec3 aSeed;
    uniform float uTime, uMorph, uPx; uniform vec2 uMouse;
    varying float vA; varying float vMix;
    const float PI = 3.14159265;
    void main(){
      float t = fract(aT + uTime * 0.012) * 2.0 - 1.0;
      vec3 s = vec3(t * 9.5, -t * 3.2 + sin(t * 3.0 + uTime * 0.2) * 0.9, 0.0) + aOff;
      float ang = aSeed.x * 2.0 * PI + uTime * 0.12;
      float r = 3.1 + (aSeed.z - 0.5) * 0.06;
      float inner = step(aSeed.z, 0.3);
      float rr = mix(r, sqrt(aSeed.z / 0.3) * 3.0, inner);
      float y = (aSeed.y - 1.5) * 0.34;
      y = mix(y, aOff.y * 0.12, inner);
      vec3 q = vec3(cos(ang) * rr, y, sin(ang) * rr);
      float m = smoothstep(0.0, 1.0, uMorph);
      vec3 p = mix(s, q, m);
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      vec2 d = mv.xy - uMouse;
      float dist = length(d);
      float push = smoothstep(2.6, 0.0, dist);
      mv.xy += normalize(d + 1e-4) * push * 0.9;
      mv.z += push * 0.6;
      gl_Position = projectionMatrix * mv;
      float size = mix(2.2, 2.6, aSeed.z) + push * 2.0;
      gl_PointSize = size * uPx * (9.0 / -mv.z);
      vA = mix(0.55, 0.95, aSeed.z) * mix(1.0, 1.0 - inner * 0.95, smoothstep(0.55, 1.0, uMorph));
      vMix = clamp(push * 1.4 + aSeed.z * 0.2, 0.0, 1.0);
    }`,
  fragmentShader: /* glsl */ `
    varying float vA; varying float vMix;
    void main(){
      float d = length(gl_PointCoord - 0.5);
      float a = smoothstep(0.5, 0.0, d);
      vec3 col = mix(vec3(0.96, 0.97, 1.0), vec3(0.28, 0.5, 1.0), vMix);
      gl_FragColor = vec4(col, a * a * vA);
    }`,
});
const points = new THREE.Points(geo, mat);
points.frustumCulled = false;
const rig = new THREE.Group();
scene.add(rig); rig.add(points);

const lattice = new THREE.Group();
const lineMat = new THREE.LineBasicMaterial({ color: 0x7aa7ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending });
for (let k = 0; k < 4; k++) {
  const pts = [];
  for (let i = 0; i <= 128; i++) { const a = (i / 128) * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * 3.1, (k - 1.5) * 0.34, Math.sin(a) * 3.1)); }
  lattice.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMat));
}
const ticks = [];
for (let i = 0; i < 72; i++) { const a = (i / 72) * Math.PI * 2; ticks.push(new THREE.Vector3(Math.cos(a) * 3.1, -0.51, Math.sin(a) * 3.1), new THREE.Vector3(Math.cos(a) * 3.1, 0.51, Math.sin(a) * 3.1)); }
lattice.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(ticks), lineMat));
rig.add(lattice);

function resize() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.position.z = Math.max(11, 4.1 / (Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * (w / h)));
  camera.updateProjectionMatrix();
}
addEventListener("resize", resize);
resize();

const mouseTarget = new THREE.Vector2(99, 99), mouseNow = new THREE.Vector2(99, 99);
addEventListener("pointermove", (e) => {
  const r = canvas.getBoundingClientRect();
  const nx = ((e.clientX - r.left) / r.width) * 2 - 1, ny = -(((e.clientY - r.top) / r.height) * 2 - 1);
  const halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
  mouseTarget.set(nx * halfH * camera.aspect, ny * halfH);
}, { passive: true });
addEventListener("pointerleave", () => mouseTarget.set(99, 99));

const heroTrack = $(".hero-track"), heroCopy = $("#heroCopy"), ringText = $("#ringText"), wedge = $("#wedge");
const ringParts = $$(".ring-part");
let partIdx = 0, heroVisible = true;
const SLANT = 28;
reg(heroTrack, (p) => {
  mat.uniforms.uMorph.value = smooth(0.02, 0.24, p);
  const out = smooth(0.0, 0.14, p);
  heroCopy.style.opacity = String(1 - out);
  heroCopy.style.transform = `translate3d(0, ${-out * 80}px, 0)`;
  ringText.style.opacity = String(smooth(0.26, 0.34, p) * (1 - smooth(0.78, 0.84, p)));
  lineMat.opacity = smooth(0.2, 0.32, p) * 0.45;
  const idx = clamp(Math.floor(((p - 0.32) / 0.46) * ringParts.length), 0, ringParts.length - 1);
  if (idx !== partIdx) { partIdx = idx; ringParts.forEach((el, n) => { el.classList.toggle("is-active", n === idx); el.classList.toggle("is-past", n < idx); }); }
  const w = smooth(0.8, 0.97, p), top = (100 + SLANT) * (1 - w);
  wedge.style.clipPath = `polygon(${top}% 0, 100% 0, 100% 100%, ${top - SLANT}% 100%)`;
  rig.rotation.x = 0.95 * smooth(0.02, 0.24, p);
  points.rotation.y = lattice.rotation.y = p * 2.2;
  rig.scale.setScalar(lerp(1, 1.12, smooth(0.3, 0.8, p)));
  heroVisible = p < 0.995;
});

/* ================= 2 · PROBLEM (giant text) ================= */
const giantTrack = $(".giant-track"), giant = $("#giant"), giantSub = $("#giantSub"), giantEyebrow = $("#giantEyebrow");
reg(giantTrack, (p) => {
  const e = smooth(0.0, 0.62, p);
  const endFont = clamp(innerWidth * 0.04, 20, 56), baseFont = innerWidth * 0.11;
  giant.style.transform = `translate3d(${lerp(38, 0, e)}vw,0,0) scale(${lerp(1, endFont / baseFont, e)})`;
  giant.style.opacity = String(lerp(0.3, 1, smooth(0.0, 0.5, p)));
  giantEyebrow.style.opacity = String(smooth(0.1, 0.5, p));
  const sub = smooth(0.66, 0.92, p);
  giantSub.style.opacity = String(sub);
  giantSub.style.transform = `translate3d(0, ${(1 - sub) * 24}px, 0)`;
});

/* ================= 3 · WHAT HOPE CAN DO ================= */
const capTrack = $(".cap-track"), acc = $("#acc"), strip = $("#capStrip");
const accItems = $$("li", acc), capCards = $$(".cap-card", strip);
let capIdx = -1;
const setCap = (idx) => { if (idx === capIdx) return; capIdx = idx; accItems.forEach((li, i) => li.classList.toggle("is-open", i === idx)); capCards.forEach((c, i) => c.classList.toggle("is-live", i === idx)); };
reg(capTrack, (p) => {
  const n = C.can.items.length, raw = clamp(p * 1.06) * (n - 1), pos = snap(raw);
  strip.style.transform = `translate3d(${-pos * 100}%,0,0)`;
  setCap(Math.round(pos));
});
accItems.forEach((li, i) => li.addEventListener("click", () => scrollToProgress(capTrack, i / (C.can.items.length - 1) / 1.06)));

/* ================= 4 + 6 · pinned horizontal carousels ================= */
function carousel(track) {
  const cardsEl = $(".cards", track), cards = $$(".card", cardsEl), count = $(".count", track);
  const n = cards.length;
  let idx = -1;
  reg(track, (p) => {
    const pos = snap(p * (n - 1)), cardW = cards[0].offsetWidth, gap = parseFloat(getComputedStyle(cardsEl).columnGap) || 28;
    cardsEl.style.transform = `translate3d(${(innerWidth - cardW) / 2 - pos * (cardW + gap)}px,0,0)`;
    cards.forEach((c, i) => { const d = clamp(Math.abs(i - pos)); c.style.opacity = String(lerp(1, 0.32, d)); c.style.transform = `scale(${lerp(1, 0.94, d)})`; });
    const k = Math.round(pos);
    if (k !== idx) { idx = k; count.textContent = `${k + 1} / ${n}`; cards.forEach((c, i) => c.classList.toggle("is-live", i === k)); }
  });
  $(".prev", track).addEventListener("click", () => scrollToProgress(track, clamp(idx - 1, 0, n - 1) / (n - 1)));
  $(".next", track).addEventListener("click", () => scrollToProgress(track, clamp(idx + 1, 0, n - 1) / (n - 1)));
}
carousel($(".how-track"));
carousel($(".used-track"));

/* ================= 5 · BUILT AROUND YOUR BUSINESS ================= */
const builtTrack = $(".built-track"), ringsG = $("#ringsG");
const ringEls = $$(".ring", ringsG), rlabels = $$(".rlabel", ringsG), chainSpans = $$("#builtChain span");
const RADII = [270, 200, 130, 60];
const SCALES = RADII.map((r) => 270 / r);
reg(builtTrack, (p) => {
  const pos = clamp(p * 1.08) * 3, i0 = Math.min(2, Math.floor(pos)), f = pos - i0;
  const s = Math.exp(lerp(Math.log(SCALES[i0]), Math.log(SCALES[i0 + 1]), smooth(0.15, 0.85, f)));
  ringsG.setAttribute("transform", `translate(300 300) scale(${s}) translate(-300 -300)`);
  const active = Math.round(pos);
  ringEls.forEach((c, i) => c.classList.toggle("on", i === active));
  rlabels.forEach((t, i) => { t.classList.toggle("on", i === active); t.setAttribute("font-size", (15 / s).toFixed(2)); t.setAttribute("y", (300 - RADII[i] + 22 / s).toFixed(2)); });
  chainSpans.forEach((sp, i) => sp.classList.toggle("on", i <= active));
});

/* ================= 7 · A SIMPLE EXAMPLE ================= */
const exTrack = $(".example-track"), tl = $("#tl"), tlItems = $$("li", tl), exBody = $("#exBody");
reg(exTrack, (p) => {
  const n = tlItems.length, k = clamp(Math.floor(clamp(p / 0.82) * n + 0.0001), 0, n);
  tlItems.forEach((li, i) => li.classList.toggle("on", i < k));
  tl.style.setProperty("--fill", String(clamp((k - 1) / (n - 1), 0, 1)));
  const b = smooth(0.84, 0.96, p);
  exBody.style.opacity = String(b); exBody.style.transform = `translate3d(0, ${(1 - b) * 16}px, 0)`;
});

/* ================= 8 · ROLE OF HUMANS ================= */
const humansTrack = $(".humans-track"), loopDot = $("#loopDot");
const loopNodes = $$(".loop-node"), loopLabels = $$(".loop-label");
reg(humansTrack, (p) => {
  const pos = clamp(p / 0.94) * 4, a = (-90 + pos * 90) * (Math.PI / 180);
  loopDot.setAttribute("cx", (280 + 140 * Math.cos(a)).toFixed(1));
  loopDot.setAttribute("cy", (200 + 140 * Math.sin(a)).toFixed(1));
  const near = Math.round(pos) % 4;
  loopNodes.forEach((c, i) => c.classList.toggle("on", i === near));
  loopLabels.forEach((t, i) => t.classList.toggle("on", i === near));
});

/* ================= main loop ================= */
const t0 = performance.now();
let last = t0;
function frame(now = performance.now()) {
  const dt = Math.min((now - last) / 1000, 0.1);
  last = now;
  current += (target - current) * (reduced ? 1 : 1 - Math.exp(-dt * 7));
  if (Math.abs(target - current) < 0.05) current = target;
  for (const { t, fn } of regs) {
    const g = geom.get(t);
    if (current > g.top - innerHeight * 1.3 && current < g.top + g.h + innerHeight * 0.3) fn(progress(t));
  }
  if (heroVisible) {
    mouseNow.lerp(mouseTarget, 0.12);
    mat.uniforms.uMouse.value.copy(mouseNow);
    mat.uniforms.uTime.value = reduced ? 8 : (now - t0) / 1000;
    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
window.__hope = { ready: true };

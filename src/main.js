import * as THREE from "three";

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = (s, r = document) => r.querySelector(s);

/* ---------- smoothed scroll ---------- */
let target = scrollY, current = scrollY;
addEventListener("scroll", () => { target = scrollY; }, { passive: true });

/* progress (0..1) of a tall track while its sticky stage is pinned */
function progress(track) {
  const top = track.offsetTop;
  const span = track.offsetHeight - innerHeight;
  return clamp((current - top) / span);
}

/* ---------- glow follows cursor ---------- */
document.addEventListener("pointermove", (e) => {
  const el = e.target.closest?.(".glow");
  if (!el) return;
  const r = el.getBoundingClientRect();
  el.style.setProperty("--mx", `${e.clientX - r.left}px`);
  el.style.setProperty("--my", `${e.clientY - r.top}px`);
});

/* ================= HERO: Three.js particles ================= */
const canvas = $("#gl");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
camera.position.z = 11;

const COUNT = innerWidth < 760 ? 6000 : 13000;
const aT = new Float32Array(COUNT);
const aOff = new Float32Array(COUNT * 3);
const aSeed = new Float32Array(COUNT * 3);
const pos = new Float32Array(COUNT * 3); // required by three, unused
const rnd = () => Math.random();
const gauss = () => (rnd() + rnd() + rnd() + rnd() - 2) / 2;
for (let i = 0; i < COUNT; i++) {
  aT[i] = rnd();
  aOff[i * 3] = gauss() * 1.6;
  aOff[i * 3 + 1] = gauss() * 1.1;
  aOff[i * 3 + 2] = gauss() * 2.0;
  aSeed[i * 3] = rnd();
  aSeed[i * 3 + 1] = Math.floor(rnd() * 4); // which of 4 rings
  aSeed[i * 3 + 2] = rnd(); // inner-disc flag / sparkle
}
const geo = new THREE.BufferGeometry();
geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
geo.setAttribute("aT", new THREE.BufferAttribute(aT, 1));
geo.setAttribute("aOff", new THREE.BufferAttribute(aOff, 3));
geo.setAttribute("aSeed", new THREE.BufferAttribute(aSeed, 3));

const mat = new THREE.ShaderMaterial({
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  uniforms: {
    uTime: { value: 0 },
    uMorph: { value: 0 },
    uMouse: { value: new THREE.Vector2(99, 99) },
    uPx: { value: renderer.getPixelRatio() },
  },
  vertexShader: /* glsl */ `
    attribute float aT; attribute vec3 aOff; attribute vec3 aSeed;
    uniform float uTime, uMorph, uPx; uniform vec2 uMouse;
    varying float vA; varying float vMix;
    const float PI = 3.14159265;
    void main(){
      // stream: diagonal flowing band
      float t = fract(aT + uTime * 0.012) * 2.0 - 1.0;
      vec3 s = vec3(t * 9.5, -t * 3.2 + sin(t * 3.0 + uTime * 0.2) * 0.9, 0.0) + aOff;
      // ring: 4 stacked rings (+ inner disc dust that fades out)
      float ang = aSeed.x * 2.0 * PI + uTime * 0.12;
      float r = 3.1 + (aSeed.z - 0.5) * 0.06;
      float inner = step(aSeed.z, 0.3);
      float rr = mix(r, sqrt(aSeed.z / 0.3) * 3.0, inner);
      float y = (aSeed.y - 1.5) * 0.34;
      y = mix(y, (aOff.y) * 0.12, inner);
      vec3 q = vec3(cos(ang) * rr, y, sin(ang) * rr);
      float m = smoothstep(0.0, 1.0, uMorph);
      vec3 p = mix(s, q, m);
      // mouse repulsion in view space
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
const rig = new THREE.Group(); // tilt lives here so points + lattice always match
scene.add(rig);
rig.add(points);

// ring lattice lines (fade in with morph)
const lattice = new THREE.Group();
const lineMat = new THREE.LineBasicMaterial({ color: 0x7aa7ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending });
for (let k = 0; k < 4; k++) {
  const pts = [];
  for (let i = 0; i <= 128; i++) {
    const a = (i / 128) * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(a) * 3.1, (k - 1.5) * 0.34, Math.sin(a) * 3.1));
  }
  lattice.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMat));
}
const ticks = [];
for (let i = 0; i < 72; i++) {
  const a = (i / 72) * Math.PI * 2;
  ticks.push(new THREE.Vector3(Math.cos(a) * 3.1, -0.51, Math.sin(a) * 3.1), new THREE.Vector3(Math.cos(a) * 3.1, 0.51, Math.sin(a) * 3.1));
}
lattice.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(ticks), lineMat));
rig.add(lattice);

function resize() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  // keep the whole ring (r≈3.1, scaled up to 1.12) inside narrow portrait viewports
  camera.position.z = Math.max(11, 4.1 / (Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * (w / h)));
  camera.updateProjectionMatrix();
}
addEventListener("resize", resize);
resize();

// mouse -> view-space xy at z = 0 plane
const mouseTarget = new THREE.Vector2(99, 99);
const mouseNow = new THREE.Vector2(99, 99);
addEventListener("pointermove", (e) => {
  const r = canvas.getBoundingClientRect();
  const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
  const ny = -(((e.clientY - r.top) / r.height) * 2 - 1);
  const halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
  mouseTarget.set(nx * halfH * camera.aspect, ny * halfH);
}, { passive: true });
addEventListener("pointerleave", () => mouseTarget.set(99, 99));

/* ---------- hero DOM bits ---------- */
const heroTrack = $(".hero-track");
const heroCopy = $("#heroCopy");
const ringLabel = $("#ringLabel");
const words = [...ringLabel.children];
const wedge = $("#wedge");
let wordIdx = 0;
const SLANT = 28;

function setWord(i) {
  if (i === wordIdx) return;
  words.forEach((w, n) => {
    w.classList.toggle("is-active", n === i);
    w.classList.toggle("is-past", n < i);
  });
  wordIdx = i;
}

function updateHero() {
  const p = progress(heroTrack);
  // morph: stream -> ring over first 22% of the track
  mat.uniforms.uMorph.value = smooth(0.02, 0.24, p);
  // hero copy leaves early
  const out = smooth(0.0, 0.14, p);
  heroCopy.style.opacity = String(1 - out);
  heroCopy.style.transform = `translate3d(0, ${-out * 80}px, 0)`;
  // ring label + lattice
  const ringIn = smooth(0.24, 0.32, p) * (1 - smooth(0.78, 0.84, p));
  ringLabel.style.opacity = String(ringIn);
  lineMat.opacity = smooth(0.2, 0.32, p) * 0.45;
  // words change on scroll across 0.30 -> 0.80
  setWord(clamp(Math.floor(((p - 0.3) / 0.5) * words.length), 0, words.length - 1));
  // wedge wipe 0.8 -> 0.97
  const w = smooth(0.8, 0.97, p);
  const top = (100 + SLANT) * (1 - w);
  wedge.style.clipPath = `polygon(${top}% 0, 100% 0, 100% 100%, ${top - SLANT}% 100%)`;
  // ring scale/rotation tied to scroll
  rig.rotation.x = 0.95 * smooth(0.02, 0.24, p);
  points.rotation.y = lattice.rotation.y = p * 2.2;
  rig.scale.setScalar(lerp(1, 1.12, smooth(0.3, 0.8, p)));
  // pause rendering when scrolled past
  return p < 0.995;
}

/* ================= GIANT TEXT ================= */
const giantTrack = $(".giant-track");
const giant = $("#giant");
const giantSub = $("#giantSub");
function updateGiant() {
  const p = progress(giantTrack);
  const e = smooth(0.0, 0.7, p);
  // text is laid out huge (crisp) and scaled DOWN to heading size
  const endScale = clamp(innerWidth * 0.044, 28, 60) / (innerWidth * 0.16);
  const s = lerp(1, endScale, e);
  const x = lerp(38, 0, e);
  giant.style.transform = `translate3d(${x}vw,0,0) scale(${s})`;
  giant.style.opacity = String(lerp(0.28, 1, smooth(0.0, 0.6, p)));
  const sub = smooth(0.7, 0.95, p);
  giantSub.style.opacity = String(sub);
  giantSub.style.transform = `translate3d(0, ${(1 - sub) * 24}px, 0)`;
}

/* ================= PINNED CAROUSEL ================= */
const carTrack = $(".carousel-track");
const cardsEl = $("#cards");
const cards = [...cardsEl.children];
const countEl = $("#count");
let carIdx = -1;
function updateCarousel() {
  const p = progress(carTrack);
  const n = cards.length;
  const pos = p * (n - 1);
  const cardW = cards[0].offsetWidth, gap = parseFloat(getComputedStyle(cardsEl).columnGap) || 28;
  const x = (innerWidth - cardW) / 2 - pos * (cardW + gap);
  cardsEl.style.transform = `translate3d(${x}px,0,0)`;
  cards.forEach((c, i) => {
    const d = Math.abs(i - pos);
    c.style.opacity = String(lerp(1, 0.32, clamp(d)));
    c.style.transform = `scale(${lerp(1, 0.94, clamp(d))})`;
  });
  const idx = Math.round(pos);
  if (idx !== carIdx) {
    carIdx = idx;
    countEl.textContent = `${idx + 1} / ${n}`;
    cards.forEach((c, i) => c.classList.toggle("is-live", i === idx));
  }
}
function goCard(i) {
  const n = cards.length;
  const span = carTrack.offsetHeight - innerHeight;
  const y = carTrack.offsetTop + (clamp(i, 0, n - 1) / (n - 1)) * span;
  scrollTo({ top: y, behavior: reduced ? "auto" : "smooth" });
}
$("#prev").addEventListener("click", () => goCard(carIdx - 1));
$("#next").addEventListener("click", () => goCard(carIdx + 1));

/* ================= CAPABILITIES ================= */
const CAPS = [
  { t: "Research", d: "Find and process the information needed to complete a task.", ui: () => `<small>Prospect brief</small><b>Northwind Logistics</b><p style="color:var(--mute)">120 staff · expanding to 3 depots · hiring ops leads</p><ul class="checks"><li style="--d:0">Website read</li><li style="--d:1">News checked</li><li style="--d:2">Contacts found</li></ul>` },
  { t: "Communication", d: "Handle emails, customer conversations, outreach, replies and updates.", ui: () => `<small>Draft reply</small><div class="bubble">Can we move the call to Thursday?</div><b>Thursday 10:00 works. Invite sent.</b><small>Sent by Hope · 4s ago</small>` },
  { t: "Decision support", d: "Qualify, prioritize, route and recommend next actions within defined rules.", ui: () => `<small>Lead score</small><b>Qualified · priority high</b><div class="bars"><i style="height:35%"></i><i style="height:55%"></i><i style="height:48%"></i><i style="height:82%"></i><i style="height:94%"></i></div>` },
  { t: "Workflow execution", d: "Carry out multi-step tasks across the systems your business uses.", ui: () => `<small>Running workflow</small><ul class="checks"><li style="--d:0">Created CRM record</li><li style="--d:1">Booked calendar slot</li><li style="--d:2">Posted to team channel</li><li style="--d:3">Updated pipeline stage</li></ul>` },
  { t: "Follow-up", d: "Continue working after the first action instead of stopping at one response.", ui: () => `<small>Follow-up schedule</small><ul class="checks"><li style="--d:0">Day 0 · intro email</li><li style="--d:1">Day 3 · nudge</li><li style="--d:2">Day 7 · value add</li></ul><small>Stops the moment they reply.</small>` },
  { t: "Human escalation", d: "Recognize when a situation needs human judgment and hand it to the right person.", ui: () => `<small>Needs a human</small><b>Refund over limit</b><p style="color:var(--mute)">Handed to Support Lead with full context.</p><div class="row"><span class="chip">Decline</span><span class="chip chip-hot">Approve</span></div>` },
];
const acc = $("#acc"), strip = $("#capStrip");
CAPS.forEach((c) => {
  const li = document.createElement("li");
  li.innerHTML = `<h3>${c.t}</h3><p>${c.d}</p>`;
  acc.appendChild(li);
  const card = document.createElement("div");
  card.className = "cap-card";
  card.innerHTML = `<div class="mock glow">${c.ui()}</div>`;
  strip.appendChild(card);
});
const accItems = [...acc.children], capCards = [...strip.children];
const capTrack = $(".cap-track");
let capIdx = -1;
function updateCaps() {
  const p = progress(capTrack);
  const n = CAPS.length;
  const pos = clamp(p * 1.06, 0, 1) * (n - 1);
  strip.style.transform = `translate3d(${-pos * 100}%,0,0)`;
  const idx = Math.round(pos);
  if (idx !== capIdx) {
    capIdx = idx;
    accItems.forEach((li, i) => li.classList.toggle("is-open", i === idx));
    capCards.forEach((c, i) => c.classList.toggle("is-live", i === idx));
  }
}
accItems.forEach((li, i) => li.addEventListener("click", () => {
  const span = capTrack.offsetHeight - innerHeight;
  scrollTo({ top: capTrack.offsetTop + (i / (CAPS.length - 1)) * span / 1.06, behavior: reduced ? "auto" : "smooth" });
}));

/* ================= LOOP ================= */
const t0 = performance.now();
let last = t0;
function frame(now = performance.now()) {
  // frame-rate independent smoothing (same feel at 30, 60 or 144 fps)
  const dt = Math.min((now - last) / 1000, 0.1);
  last = now;
  current += (target - current) * (reduced ? 1 : 1 - Math.exp(-dt * 7));
  if (Math.abs(target - current) < 0.05) current = target;
  const heroVisible = updateHero();
  updateGiant();
  updateCarousel();
  updateCaps();
  if (heroVisible) {
    mouseNow.lerp(mouseTarget, 0.12);
    mat.uniforms.uMouse.value.copy(mouseNow);
    mat.uniforms.uTime.value = reduced ? 8 : (performance.now() - t0) / 1000;
    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
window.__hope = { ready: true };

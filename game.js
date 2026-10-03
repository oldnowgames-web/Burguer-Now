// --- 1. CONFIGURAÇÃO DA CENA THREE.JS ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x131822);
scene.fog = new THREE.FogExp2(0x131822, 0.018);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 20, 26);
camera.lookAt(0, 1, 1);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setSize(window.innerWidth, window.innerHeight);
const COARSE = window.matchMedia('(pointer: coarse)').matches;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, COARSE ? 1.5 : 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputEncoding = THREE.sRGBEncoding;
document.body.appendChild(renderer.domElement);

// Câmera adaptativa: em telas menos largas que 16:10 afasta um pouco para caber a cozinha inteira
function fitCamera() {
    camera.aspect = innerWidth / innerHeight;
    const k = Math.max(1, Math.min(1.8, 1.6 / camera.aspect));
    camera.position.set(0, 20 * k, 26 * k); camera.lookAt(0, 1.8, 1);
    camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight);
}
fitCamera();

// Iluminação de Estúdio / Lanchonete Acolhedora
const ambientLight = new THREE.AmbientLight(0xfff5e6, 0.75);
scene.add(ambientLight);

const mainLight = new THREE.DirectionalLight(0xfffaed, 0.9);
mainLight.position.set(12, 22, 10);
mainLight.castShadow = true;
mainLight.shadow.mapSize.width = COARSE ? 1024 : 2048;
mainLight.shadow.mapSize.height = COARSE ? 1024 : 2048;
mainLight.shadow.camera.near = 0.5;
mainLight.shadow.camera.far = 60;
mainLight.shadow.camera.left = -15;
mainLight.shadow.camera.right = 15;
mainLight.shadow.camera.top = 15;
mainLight.shadow.camera.bottom = -15;
mainLight.shadow.bias = -0.0005;
scene.add(mainLight);

// Luz de preenchimento quente na cozinha
const kitchenWarmLight = new THREE.PointLight(0xff9d3b, 0.8, 20);
kitchenWarmLight.position.set(-4, 6, 4);
scene.add(kitchenWarmLight);

// Textura procedural de piso quadriculado
function createTileTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = '#334155';
    ctx.fillRect(0, 0, 128, 128);
    ctx.fillRect(128, 128, 128, 128);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(10, 10);
    return texture;
}

// --- 2. CENÁRIO DA LANCHONETE ---
// Piso
const floorGeo = new THREE.PlaneGeometry(40, 40);
const floorMat = new THREE.MeshStandardMaterial({ map: createTileTexture(), roughness: 0.4 });
const floor = new THREE.Mesh(floorGeo, floorMat);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// Parede do fundo
const wallGeo = new THREE.PlaneGeometry(40, 20);
const wallMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });
const wall = new THREE.Mesh(wallGeo, wallMat);
wall.position.set(0, 10, -10);
scene.add(wall);

// Balcão de Atendimento (Madeira Nobre)
const counterGeo = new THREE.BoxGeometry(22, 3.8, 3.2);
const counterMat = new THREE.MeshStandardMaterial({ color: 0x5c3a21, roughness: 0.5 });
const counter = new THREE.Mesh(counterGeo, counterMat);
counter.position.set(0, 1.9, -1);
counter.castShadow = true;
counter.receiveShadow = true;
scene.add(counter);

// Tampo do Balcão
const counterTopGeo = new THREE.BoxGeometry(22.6, 0.3, 3.6);
const counterTopMat = new THREE.MeshStandardMaterial({ color: 0x2d1a0e, roughness: 0.2, metalness: 0.1 });
const counterTop = new THREE.Mesh(counterTopGeo, counterTopMat);
counterTop.position.set(0, 3.85, -1);
counterTop.castShadow = true;
counterTop.receiveShadow = true;
scene.add(counterTop);

// Mesa Principal da Cozinha (Inox)
const tableGeo = new THREE.BoxGeometry(27, 3.2, 5.5);
const tableMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.25 });
const kitchenTable = new THREE.Mesh(tableGeo, tableMat);
kitchenTable.position.set(0, 1.6, 5.5);
kitchenTable.castShadow = true;
kitchenTable.receiveShadow = true;
scene.add(kitchenTable);

// Bandeja de Servir (Local de Montagem)
const trayGeo = new THREE.BoxGeometry(4.2, 0.2, 3.2);
const trayMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 });
const tray = new THREE.Mesh(trayGeo, trayMat);
tray.position.set(0, 3.3, 5.5);
tray.receiveShadow = true;
tray.castShadow = true;
scene.add(tray);

// Papel da Bandeja
const paperGeo = new THREE.PlaneGeometry(3.8, 2.8);
const paperMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
const paper = new THREE.Mesh(paperGeo, paperMat);
paper.rotation.x = -Math.PI / 2;
paper.position.set(0, 3.41, 5.5);
scene.add(paper);

// --- 3. INGREDIENTES DETALHADOS ---
const M = (c, r = .6, m = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
const pick = a => a[Math.floor(Math.random() * a.length)];
const cast = o => { o.traverse(c => { if (c.isMesh) c.castShadow = true; }); return o; };
const rot = (m, x, y, z) => { m.rotation.set(x, y, z); return m; };

function createBunTopMesh() {
    const g = new THREE.Group(), mat = M(0xc2701a, .55);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(1.25, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2), mat);
    dome.scale.y = .7; g.add(dome);
    const glaze = new THREE.Mesh(new THREE.SphereGeometry(1.26, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2.6),
        new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: .15, transparent: true, opacity: .4 }));
    glaze.scale.y = .71; g.add(glaze);
    g.add(rot(new THREE.Mesh(new THREE.TorusGeometry(1.2, .09, 8, 28), mat), Math.PI / 2, 0, 0));
    const sm = M(0xfff7dc, .7), sg = new THREE.SphereGeometry(.05, 6, 4);
    for (let i = 0; i < 36; i++) {
        const s = new THREE.Mesh(sg, sm), p = Math.random() * 6.283, t = Math.random() * 1.05 + .05;
        s.position.set(1.24 * Math.sin(t) * Math.cos(p), 1.24 * Math.cos(t) * .7, 1.24 * Math.sin(t) * Math.sin(p));
        s.scale.set(2, .7, 1); s.rotation.y = -p; g.add(s);
    }
    return cast(g);
}
function createBunBottomMesh() {
    const g = new THREE.Group(), mat = M(0xc2701a, .6);
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.12, .35, 28), mat));
    g.add(rot(new THREE.Mesh(new THREE.TorusGeometry(1.19, .08, 8, 28), mat), Math.PI / 2, 0, 0)).children[1].position.y = .17;
    const crumb = new THREE.Mesh(new THREE.CylinderGeometry(1.08, 1.08, .02, 24), M(0xf6d9a0, .9));
    crumb.position.y = .18; g.add(crumb);
    return cast(g);
}
function createPattyMesh(c = 0x4a2a17) {
    const g = new THREE.Group(), mat = M(c, .95);
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(1.22, 1.2, .32, 28), mat));
    for (let i = 0; i < 14; i++) { // borda irregular
        const a = i / 14 * 6.283, b = new THREE.Mesh(new THREE.SphereGeometry(.17, 8, 6), mat);
        b.position.set(Math.cos(a) * 1.2, 0, Math.sin(a) * 1.2); b.scale.y = 1.05; g.add(b);
    }
    const jm = new THREE.MeshStandardMaterial({ color: 0x7c4a26, roughness: .1 });
    for (let i = 0; i < 4; i++) { const j = new THREE.Mesh(new THREE.SphereGeometry(.08, 6, 4), jm); j.scale.y = .3; j.position.set((Math.random() - .5) * 1.6, .17, (Math.random() - .5) * 1.6); g.add(j); }
    return cast(g);
}
function createCheeseMesh() {
    const g = new THREE.Group(), mat = M(0xfbbf24, .3);
    g.add(new THREE.Mesh(new THREE.BoxGeometry(1.7, .05, 1.7), mat));
    [[0, .85, -.5, 0], [0, -.85, .5, 0], [.85, 0, 0, -.5], [-.85, 0, 0, .5]].forEach(([x, z, rx, rz], i) => {
        const p = new THREE.Group(), f = new THREE.Mesh(new THREE.BoxGeometry(i < 2 ? 1.7 : .5, .05, i < 2 ? .5 : 1.7), mat);
        p.position.set(x, 0, z); f.position.set(i < 2 ? 0 : -Math.sign(x) * -.25, 0, i < 2 ? -Math.sign(z) * -.25 : 0);
        f.position.set(i < 2 ? 0 : Math.sign(x) * .25, 0, i < 2 ? Math.sign(z) * .25 : 0);
        p.rotation.x = i === 0 ? -.5 : i === 1 ? .5 : 0; p.rotation.z = i === 2 ? -.5 : i === 3 ? .5 : 0;
        p.add(f); g.add(p);
    });
    g.rotation.y = Math.PI / 6; return cast(g);
}
function createCheddarMesh() {
    const g = new THREE.Group(), mat = M(0xf97316, .25);
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.28, .08, 24), mat));
    for (let i = 0; i < 9; i++) {
        const a = i / 9 * 6.283 + Math.random() * .3, L = .25 + Math.random() * .5, x = Math.cos(a) * 1.27, z = Math.sin(a) * 1.27;
        const d = new THREE.Mesh(new THREE.CylinderGeometry(.11, .08, L, 8), mat); d.position.set(x, -L / 2, z);
        const t = new THREE.Mesh(new THREE.SphereGeometry(.12, 8, 8), mat); t.position.set(x, -L, z); g.add(d, t);
    }
    return cast(g);
}
function createSaladMesh() {
    const g = new THREE.Group();
    for (let i = 0; i < 4; i++) {
        const geo = new THREE.CircleGeometry(1, 24, 0, 6.283), p = geo.attributes.position;
        for (let k = 0; k < p.count; k++) { const x = p.getX(k), y = p.getY(k), r = Math.hypot(x, y); p.setZ(k, Math.sin(Math.atan2(y, x) * 9 + i) * .1 * r + Math.sin(r * 6) * .03); }
        geo.computeVertexNormals();
        const leaf = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: i % 2 ? 0x4ade80 : 0x16a34a, roughness: .7, side: THREE.DoubleSide }));
        leaf.rotation.set(-Math.PI / 2 + (Math.random() - .5) * .25, 0, Math.random() * 6.28);
        leaf.position.set((Math.random() - .5) * .5, i * .025, (Math.random() - .5) * .5);
        leaf.scale.setScalar(1.05 - i * .05); g.add(leaf);
    }
    return cast(g);
}
const BACON_PAL = [[0xb23a36, 0xfbd5d0], [0x7c2314, 0xf2b66a], [0x1c0e0a, 0x2e1d12]];
function createBaconMesh(st = -1) {
    const [lc, fc] = st < 0 ? [0x9f1d1d, 0xfecaca] : BACON_PAL[st], g = new THREE.Group(), red = M(lc, .5), fat = M(fc, .4); g.userData.lean = red; g.userData.fat = fat;
    function strip(ang, dy, dz) {
        const s = new THREE.Group();
        for (let i = 0; i < 9; i++) {
            const seg = new THREE.Mesh(new THREE.BoxGeometry(.24, .06, .42 + (i % 3) * .03), i % 2 ? fat : red);
            seg.position.set(-1 + i * .25, Math.sin(i * .9) * .035, Math.sin(i * .7) * .06); seg.rotation.z = Math.cos(i * .9) * .15; s.add(seg);
        }
        s.rotation.y = ang; s.position.set(dz, dy, 0); return s;
    }
    g.add(strip(Math.PI / 5, .03, .1), strip(-Math.PI / 5, .09, -.1));
    return cast(g);
}

function createTomatoMesh() { const g = new THREE.Group(); g.add(new THREE.Mesh(new THREE.CylinderGeometry(.95, .95, .12, 24), M(0xdc2626, .35)), new THREE.Mesh(new THREE.CylinderGeometry(.6, .6, .13, 16), M(0xf87171, .4))); return cast(g); }
function createOnionMesh() { const g = new THREE.Group(); [1, .7, .42].forEach((r, i) => g.add(rot(new THREE.Mesh(new THREE.TorusGeometry(r, .07, 6, 24), M(i % 2 ? 0xf5f3ff : 0xe9d5ff, .4)), Math.PI / 2, 0, 0))); return cast(g); }
function createPickleMesh() { const g = new THREE.Group(); [[-.4, .3], [.4, -.3], [0, .55]].forEach(([x, z]) => { const a = new THREE.Mesh(new THREE.CylinderGeometry(.48, .48, .09, 16), M(0x65a30d, .4)), b = new THREE.Mesh(new THREE.CylinderGeometry(.32, .32, .1, 12), M(0xbef264, .4)); a.position.set(x, 0, z); b.position.set(x, 0, z); g.add(a, b); }); return cast(g); }
function createEggMesh() { const g = new THREE.Group(), y = new THREE.Mesh(new THREE.SphereGeometry(.4, 14, 10), M(0xf59e0b, .2)); y.scale.y = .55; y.position.y = .07; g.add(new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.15, .1, 20), M(0xfffbeb, .3)), y); return cast(g); }
function createSauceMesh(col) { const g = new THREE.Group(), m = M(col, .15); for (let i = 0; i < 7; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(.22, 8, 6), m); b.scale.y = .25; b.position.set(-.9 + i * .3, 0, Math.sin(i * 1.3) * .35); g.add(b); } return cast(g); }
function createFriesMesh(col = 0xfacc15, basket = true, spread = false) { const g = new THREE.Group(); if (spread) { const sm = M(col, .6); for (let i = 0; i < 44; i++) { const f = new THREE.Mesh(new THREE.BoxGeometry(.1, .7 + Math.random() * .3, .1), sm), r = Math.sqrt(Math.random()) * 1.25, a = Math.random() * 6.283; f.position.set(Math.cos(a) * r, Math.random() * .16, Math.sin(a) * r); f.rotation.order = 'YXZ'; f.rotation.set(Math.PI / 2 + (Math.random() - .5) * .5, Math.random() * 6.283, (Math.random() - .5) * .5); g.add(f); } return cast(g); } if (basket) { const bx = new THREE.Mesh(new THREE.CylinderGeometry(.55, .4, .7, 4), M(0xdc2626, .5)); bx.rotation.y = Math.PI / 4; bx.position.y = .35; g.add(bx); } const fm = M(col, .6); for (let i = 0; i < 9; i++) { const f = new THREE.Mesh(new THREE.BoxGeometry(.11, .8, .11), fm); f.position.set((i % 3 - 1) * .2, .95, (Math.floor(i / 3) - 1) * .2); f.rotation.set((Math.random() - .5) * .3, 0, (Math.random() - .5) * .3); g.add(f); } return cast(g); }
function createFryerMesh() {
    const g = new THREE.Group(), put = (m, y) => { m.position.y = y; g.add(m); return m; };
    put(new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.5, .12, 32), M(0x0f172a, .5, .6)), .06);
    put(new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.15, 1.1, 32, 1, true), new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: .35, metalness: .6, side: THREE.DoubleSide })), .6);
    put(rot(new THREE.Mesh(new THREE.CircleGeometry(1.15, 32), M(0x1c1208, .5)), -Math.PI / 2, 0, 0), .14);
    put(rot(new THREE.Mesh(new THREE.TorusGeometry(1.3, .08, 10, 40), M(0xcbd5e1, .3, .8)), Math.PI / 2, 0, 0), 1.15);
    cast(g);
    const rg = new THREE.RingGeometry(.001, 1.26, 40, 12), p = rg.attributes.position, R = new Float32Array(p.count), A = new Float32Array(p.count);
    for (let i = 0; i < p.count; i++) { R[i] = Math.hypot(p.getX(i), p.getY(i)); A[i] = Math.atan2(p.getY(i), p.getX(i)); }
    const surf = put(rot(new THREE.Mesh(rg, new THREE.MeshStandardMaterial({ color: 0xe0900c, emissive: 0x7a3b00, emissiveIntensity: .45, roughness: .08, metalness: .2 })), -Math.PI / 2, 0, 0), .9);
    const bm = new THREE.MeshStandardMaterial({ color: 0xffe8a3, emissive: 0x8a5a10, emissiveIntensity: .5, transparent: true, opacity: .85, roughness: .1 });
    const bubbles = Array.from({ length: 20 }, () => { const m = new THREE.Mesh(new THREE.SphereGeometry(.07, 8, 6), bm); m.visible = false; g.add(m); return { m, t: Math.random() * 2, age: 0, dur: 1, x: 0, z: 0, on: false }; });
    g.userData.oil = { surf, R, A, bubbles }; return g;
}
function createSodaMachineMesh() {
    const g = new THREE.Group(), red = M(0xdc2626, .35, .2), dark = M(0x111827, .45, .3), steel = M(0xcbd5e1, .25, .9);
    const part = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); g.add(m); return m; }, bx = (w, h, d, mat, x, y, z) => part(new THREE.BoxGeometry(w, h, d), mat, x, y, z);
    bx(2.8, 3.3, 1.6, red, 0, 1.65, 0); bx(2.86, .3, 1.66, dark, 0, .15, 0); bx(2.9, .1, 1.7, steel, 0, 3.35, 0); bx(1.9, .1, 1.1, dark, 0, 3.45, .3);
    for (let i = -2; i <= 2; i++) bx(.06, .02, .95, steel, i * .36, 3.505, .3);
    bx(2.4, 2.5, .06, dark, 0, 1.75, .82);
    part(new THREE.PlaneGeometry(2.1, .62), new THREE.MeshBasicMaterial({ map: makeLabel('🥤 REFRI', 256, 76, '800 40px Poppins,sans-serif', '#fff', '#b91c1c') }), 0, 2.7, .86);
    const led = part(new THREE.SphereGeometry(.12, 10, 8), new THREE.MeshBasicMaterial({ color: 0x7dd3fc }), 0, 1.7, .88);
    [0x38bdf8, 0x22c55e, 0xf59e0b].forEach((c, i) => rot(part(new THREE.CylinderGeometry(.17, .17, .08, 16), M(c, .3), (i - 1) * .62, 1.1, .88), Math.PI / 2, 0, 0));
    part(new THREE.CylinderGeometry(.16, .16, 2.75, 12), steel, 0, 4.775, -.6); part(new THREE.SphereGeometry(.2, 12, 10), steel, 0, 6, -.6); bx(.3, .3, .9, steel, 0, 6, -.15);
    part(new THREE.CylinderGeometry(.42, .42, .5, 20), M(0xb91c1c, .4), 0, 5.95, .3); part(new THREE.CylinderGeometry(.17, .08, .24, 12), steel, 0, 5.62, .3);
    g.userData.led = led; return cast(g);
}
function createCupMesh() { const g = new THREE.Group(), part = (r1, r2, h, y, c) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, 16), M(c, .4)); m.position.y = y; g.add(m); return m; }; part(.5, .38, 1.1, .55, 0xf8fafc); part(.51, .45, .4, .55, 0xdc2626); part(.54, .54, .08, 1.12, 0x1e293b); part(.04, .04, .7, 1.45, 0x22c55e).position.x = .1; return cast(g); }
const SODA_COL = 0x4a2511, CUP_RB = .33, CUP_RT = .45, CUP_H = 1.1, CUP_MAXL = .95, innerR = y => CUP_RB + (CUP_RT - CUP_RB) * y / CUP_H;
function createLiquidCup() {
    const g = new THREE.Group(), add = (m, y) => { m.position.y = y; g.add(m); return m; };
    add(new THREE.Mesh(new THREE.CylinderGeometry(.5, .38, CUP_H, 24, 1, true), new THREE.MeshStandardMaterial({ color: 0xdbeafe, roughness: .08, transparent: true, opacity: .28, side: THREE.DoubleSide, depthWrite: false })), CUP_H / 2).renderOrder = 3;
    add(new THREE.Mesh(new THREE.CylinderGeometry(.38, .38, .05, 24), M(0xe2e8f0, .3)), .025).castShadow = true;
    add(new THREE.Mesh(new THREE.CylinderGeometry(.505, .495, .14, 24, 1, true), new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: .4, side: THREE.DoubleSide })), CUP_H - .1);
    const lg = new THREE.CylinderGeometry(1, 1, 1, 24, 1); lg.userData.base = lg.attributes.position.array.slice();
    const liquid = add(new THREE.Mesh(lg, new THREE.MeshStandardMaterial({ color: SODA_COL, roughness: .12, transparent: true, opacity: .93, depthWrite: false })), 0); liquid.renderOrder = 1; liquid.castShadow = true;
    const foam = add(new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 24), M(0xf3dfb8, .9)), 0);
    const lid = new THREE.Group(); lid.visible = false; g.add(lid);
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(.54, .54, .08, 24), M(0x1e293b, .4)); disc.position.y = CUP_H + .04; lid.add(disc);
    const straw = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, .4, 8), M(0x22c55e, .4)); straw.position.set(.1, CUP_H + .17, 0); straw.rotation.z = -.15; lid.add(straw);
    const bm = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .55, depthWrite: false }), bubbles = [];
    for (let i = 0; i < 8; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(.035, 6, 5), bm); b.renderOrder = 2; b.userData = { a: Math.random() * 6.28, r: Math.random() * .28, y: Math.random(), sp: .25 + Math.random() * .4 }; g.add(b); bubbles.push(b); }
    g.userData = { liquid, foam, lid, bubbles, h: 0 }; setCupLevel(g, 0, .05); return g;
}
function setCupLevel(g, h, foamH) {
    const u = g.userData, pos = u.liquid.geometry.attributes.position, base = u.liquid.geometry.userData.base, rt = innerR(h);
    for (let i = 0; i < pos.count; i++) { const top = base[i * 3 + 1] > 0, r = top ? rt : CUP_RB; pos.setXYZ(i, base[i * 3] * r, top ? h : 0, base[i * 3 + 2] * r); }
    pos.needsUpdate = true; u.h = h; u.liquid.visible = h > .005; u.foam.visible = h > .02; u.foam.scale.set(rt * 1.02, foamH, rt * 1.02); u.foam.position.y = h + foamH / 2;
}
function updateCupFizz(g, dt) { const u = g.userData; u.bubbles.forEach(b => { const d = b.userData; b.visible = u.liquid.visible; d.y += dt * d.sp; d.a += dt * .5; if (d.y > u.h) d.y = .04 + Math.random() * .1; const r = Math.min(d.r, innerR(d.y) - .06); b.position.set(Math.cos(d.a) * r, d.y, Math.sin(d.a) * r); }); }

// --- 4. POTES, CHAPA E DECORAÇÃO ---
function makeLabel(text, w, h, font, fg, bg) {
    const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
    if (bg) { x.fillStyle = bg; x.fillRect(0, 0, w, h); }
    x.font = font; x.fillStyle = fg; x.textAlign = 'center'; x.textBaseline = 'middle'; x.shadowColor = fg; x.shadowBlur = bg ? 0 : 18;
    x.fillText(text, w / 2, h / 2); return new THREE.CanvasTexture(c);
}
const dropGeo = new THREE.SphereGeometry(.08, 6, 5), dropMats = {}, drops = [];
function splash(x, y, z, color, n = 8, power = 3, spread = .5) {
    const mat = dropMats[color] || (dropMats[color] = new THREE.MeshStandardMaterial({ color, roughness: .15, emissive: color, emissiveIntensity: .2 }));
    for (let i = 0; i < n; i++) { const m = new THREE.Mesh(dropGeo, mat), a = Math.random() * 6.283, sp = Math.random() * spread * power; m.position.set(x, y, z); m.scale.setScalar(.6 + Math.random() * .8); scene.add(m); drops.push({ m, vx: Math.cos(a) * sp, vz: Math.sin(a) * sp, vy: power * (.5 + Math.random() * .8), y0: y }); }
}
function updateDrops(dt) { for (let i = drops.length - 1; i >= 0; i--) { const d = drops[i], p = d.m.position; d.vy -= 16 * dt; p.x += d.vx * dt; p.y += d.vy * dt; p.z += d.vz * dt; if (d.vy < 0 && p.y < d.y0) { scene.remove(d.m); drops.splice(i, 1); } } }
function addLabel(text, x, y, z) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: makeLabel(text, 256, 64, '800 34px Poppins,sans-serif', '#fff', 'rgba(15,23,42,.85)'), depthTest: false })); sp.scale.set(2.4, .6, 1); sp.position.set(x, y, z); scene.add(sp); }
function popupAt(text, color, v) { const d = document.createElement('div'); d.className = 'popup'; d.innerHTML = text; d.style.color = color; const [x, y] = screenPos(v); d.style.left = x + 'px'; d.style.top = y + 'px'; document.body.appendChild(d); setTimeout(() => d.remove(), 1300); }
// Textura de brilho (barata) + faíscas de comemoração
const glowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.25, 'rgba(255,220,120,.7)'); g.addColorStop(1, 'rgba(255,200,80,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
function sparkle(x, y, z, n = 10) {
    for (let i = 0; i < n; i++) {
        const m = new THREE.SpriteMaterial({ map: glowTex, color: pick([0xfde047, 0xfbbf24, 0xffffff]), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
        const s = new THREE.Sprite(m), a = Math.random() * 6.283, r = 1.2 + Math.random() * 1.6, h = 1.5 + Math.random() * 2.2, sz = .5 + Math.random() * .6;
        s.position.set(x, y, z); scene.add(s);
        tween(.9, k => { s.position.set(x + Math.cos(a) * r * k, y + h * Math.sin(k * Math.PI * .9), z + Math.sin(a) * r * k * .5); s.scale.setScalar(sz * (1 - k * .5)); m.opacity = 1 - k; }, () => { scene.remove(s); m.dispose(); });
    }
}
const potGroups = [];
function createPot(x, z, label, colorHex, factory, n, sc, dy) {
    const group = new THREE.Group();
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.0, 1.2, 24), M(0xcbd5e1, .3, .5));
    pot.position.y = 3.8; pot.castShadow = true; group.add(pot);
    group.add(rot(new THREE.Mesh(new THREE.TorusGeometry(1.2, .08, 8, 24), M(colorHex, .4)), Math.PI / 2, 0, 0)).children[1].position.y = 4.4;
    const label3d = new THREE.Sprite(new THREE.SpriteMaterial({ map: makeLabel(label, 256, 64, '800 34px Poppins,sans-serif', '#fff', 'rgba(15,23,42,.85)'), depthTest: false }));
    label3d.scale.set(2.4, .6, 1); label3d.position.y = 6.2; group.add(label3d);
    for (let i = 0; i < n; i++) { const it = factory(); it.scale.setScalar(sc); it.position.set((i % 2 - .5) * .3, 4.3 + i * dy, (Math.random() - .5) * .3); it.rotation.y = Math.random() * 6; group.add(it); }
    const hit = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 2.4, 16), new THREE.MeshBasicMaterial({ visible: false }));
    hit.position.y = 4.2; hit.userData = { ingredient: label, isClickable: true }; group.add(hit);
    group.userData.pot = true; group.position.set(x, 0, z); scene.add(group); potGroups.push(group); return group;
}
createPot(-4.2, 5.5, 'Pão', 0xd97706, createBunTopMesh, 2, .5, .3);
createPot(4.2, 7.0, 'Salada', 0x22c55e, createSaladMesh, 3, .6, .12);
createPot(7.0, 7.0, 'Bacon', 0x991b1b, createBaconMesh, 4, .6, .1);
createPot(4.2, 4.2, 'Queijo', 0xfacc15, createCheeseMesh, 5, .5, .06);
createPot(7.0, 4.2, 'Cheddar', 0xea580c, createCheddarMesh, 3, .5, .08);

const table2 = new THREE.Mesh(new THREE.BoxGeometry(31, 3.2, 3.4), tableMat); table2.position.set(0, 1.6, 11); table2.castShadow = table2.receiveShadow = true; scene.add(table2);
[['Tomate', 0xdc2626, createTomatoMesh, 4, .5, .1], ['Cebola', 0xa855f7, createOnionMesh, 3, .5, .12], ['Picles', 0x65a30d, createPickleMesh, 3, .55, .1], ['Ovo', 0xf59e0b, createEggMesh, 3, .5, .1],
 ['Ketchup', 0xdc2626, () => createSauceMesh(0xdc2626), 2, .6, .06], ['Maionese', 0xfef3c7, () => createSauceMesh(0xfef9c3), 2, .6, .06], ['Barbecue', 0x78350f, () => createSauceMesh(0x78350f), 2, .6, .06],
 ['Copo300', 0x38bdf8, () => createCupMesh(), 1, .45, 0], ['Copo500', 0x0ea5e9, () => createCupMesh(), 1, .6, 0], ['Copo700', 0x0369a1, () => createCupMesh(), 1, .75, 0]].forEach((q, i) => createPot((i - 4) * 2.4, 11, ...q));
const grillBase = new THREE.Mesh(new THREE.BoxGeometry(5.2, .3, 4.2), M(0x1e293b, .2, .9));
grillBase.position.set(-8, 3.35, 5.5); grillBase.castShadow = true; scene.add(grillBase);
const grillHit = new THREE.Mesh(new THREE.BoxGeometry(5.4, 1.5, 4.4), new THREE.MeshBasicMaterial({ visible: false }));
grillHit.position.set(-8, 3.8, 5.5); grillHit.userData = { grill: true, isClickable: true }; scene.add(grillHit);
addLabel('Chapa', -8, 7, 5.5);
const STAGES = [[0, 'Crua', 0xd9736b], [5, 'Ao ponto', 0x7a4224], [10, 'Bem passada', 0x4a2a17], [15, 'Queimada', 0x0f0a08]];
const BACON_STAGES = [[0, 'Crua', 0], [4, 'Pronto', 1], [9, 'Queimado', 2]];
const stageOf = (t, tbl = STAGES) => tbl.reduce((r, st, i) => t >= st[0] ? i : r, 0);
const tintBacon = (m, st) => { m.userData.lean.color.setHex(BACON_PAL[st][0]); m.userData.fat.color.setHex(BACON_PAL[st][1]); };
const SLOTS = [[-9.3, 4.6], [-6.7, 4.6], [-9.3, 6.4], [-6.7, 6.4]].map(([x, z]) => { const tag = document.createElement('div'); tag.className = 'slot-tag'; document.body.appendChild(tag); return { x, z, mesh: null, kind: 'Carne', t: 0, st: 0, tag }; });

// Fritadeira (uma só, afastada dos potes e bem dentro da bancada)
const FRYER_X = 11.2, FRYER_Z = 5.5;
const fryerMesh = createFryerMesh(); fryerMesh.scale.setScalar(1.3); fryerMesh.position.set(FRYER_X, 3.2, FRYER_Z); scene.add(fryerMesh);
const FRYER_SURF_Y = 3.2 + .9 * 1.3, FRY = { intensity: .25, kick: 0, spit: 0 };
addLabel('Fritadeira', FRYER_X, 7, FRYER_Z);
function updateFryer(dt, time) {
    const o = fryerMesh.userData.oil, pos = o.surf.geometry.attributes.position, busy = !!FRY_SLOTS[0].mesh;
    FRY.intensity += ((busy ? 1 : .25) - FRY.intensity) * Math.min(1, dt * 3); FRY.kick *= Math.exp(-dt * 2.2);
    const amp = .012 + .03 * FRY.intensity, sp = 1 + FRY.intensity * .8;
    for (let i = 0; i < pos.count; i++) { const r = o.R[i], a = o.A[i]; pos.setZ(i, (1 - Math.pow(r / 1.26, 4) * .65) * (amp * (Math.sin(r * 7 - time * 3.2 * sp) * .55 + Math.sin(a * 3 + time * 2.1 * sp + r * 2.5) * .45) + FRY.kick * .08 * Math.sin(r * 11 - time * 9) * (1 - r / 1.26))); }
    pos.needsUpdate = true; o.surf.geometry.computeVertexNormals();
    const want = Math.round(4 + 16 * FRY.intensity);
    o.bubbles.forEach((b, i) => {
        if (!b.on) { if (i < want && (b.t -= dt) <= 0) { const a = Math.random() * 6.283, r = busy ? .45 + Math.random() * .7 : Math.random() * 1.05; Object.assign(b, { x: Math.cos(a) * r, z: Math.sin(a) * r, age: 0, dur: .5 + Math.random() * .6, on: true }); b.m.visible = true; } return; }
        b.age += dt; const k = b.age / b.dur;
        if (k >= 1) { b.on = false; b.m.visible = false; b.t = Math.random() * .6; return; }
        const s = k < .75 ? k / .75 : 1 + (k - .75) * 1.6; b.m.scale.set(s, s * .55, s); b.m.position.set(b.x, .92 + s * .02, b.z);
    });
    if (busy && (FRY.spit -= dt) <= 0) { FRY.spit = .12 + Math.random() * .2; const a = Math.random() * 6.283, r = .5 + Math.random() * .7; splash(FRYER_X + Math.cos(a) * r * 1.3, FRYER_SURF_Y, FRYER_Z + Math.sin(a) * r * 1.3, 0xe0900c, 1, 1.6, .4); }
}
const fryerHit = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 1.6, 20), new THREE.MeshBasicMaterial({ visible: false }));
fryerHit.position.set(FRYER_X, 3.9, FRYER_Z); fryerHit.userData = { fryer: true, isClickable: true }; scene.add(fryerHit);
const FRY_STAGES = [[0, 'Crua', 0xfef3c7], [4, 'Pronta', 0xfacc15], [8, 'Queimada', 0x422006]];
const fryStageOf = t => FRY_STAGES.reduce((r, st, i) => t >= st[0] ? i : r, 0);
const FRY_SLOTS = [[FRYER_X, FRYER_Z]].map(([x, z]) => { const tag = document.createElement('div'); tag.className = 'slot-tag'; document.body.appendChild(tag); return { x, z, mesh: null, t: 0, st: 0, tag }; });

// Máquina de refrigerante (refil)
const SODA_X = 10.5, SODA_Z = 13.5, PAD_Y = 3.5, NOZZLE_Y = 5.5;
const soda = createSodaMachineMesh(); soda.position.set(SODA_X, 0, SODA_Z); scene.add(soda);
for (const [w, h, d, y, z] of [[3, 3.5, 1.8, 1.75, 0], [2, 1.6, 1.4, 4.3, .3]]) { const hb = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ visible: false })); hb.position.set(SODA_X, y, SODA_Z + z); hb.userData = { refill: true, isClickable: true }; scene.add(hb); }
const REFILL = { x: SODA_X, z: SODA_Z + .3, cup: null, size: 0, t: 0, full: false, flying: false, endT: 0, sp: 0, tag: document.createElement('div') };
REFILL.tag.className = 'slot-tag'; document.body.appendChild(REFILL.tag);
const streamGeo = new THREE.CylinderGeometry(1, 1, 1, 10, 1, true);
const stream = new THREE.Mesh(streamGeo, new THREE.MeshStandardMaterial({ color: SODA_COL, roughness: .1, transparent: true, opacity: .9 }));
const streamIn = new THREE.Mesh(streamGeo, new THREE.MeshBasicMaterial({ color: 0xc08a50, transparent: true, opacity: .55 }));
stream.visible = streamIn.visible = false; scene.add(stream, streamIn);
function setStream(on, top, bot, time) {
    stream.visible = streamIn.visible = on && top - bot > .02; if (!stream.visible) return;
    const w = .075 * (1 + .15 * Math.sin(time * 47) + .1 * Math.sin(time * 29)), len = top - bot;
    stream.scale.set(w, len, w); stream.position.set(REFILL.x, (top + bot) / 2, REFILL.z); streamIn.scale.set(w * .45, len, w * .45); streamIn.position.copy(stream.position);
}
        const steamGeo = new THREE.SphereGeometry(.22, 8, 8), steam = [];
for (let i = 0; i < 16; i++) {
    const s = new THREE.Mesh(steamGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false }));
    s.userData = { t: Math.random(), x: -9.4 + Math.random() * 2.8, z: 4 + Math.random() * 2.6 }; scene.add(s); steam.push(s);
}
// Letreiro neon, lâmpadas e faixa na parede
const SIGN_FONT = '84px "Titan One", "Poppins", sans-serif', mkSign = () => makeLabel('🍔 BURGUER NOW', 1024, 192, SIGN_FONT, '#fbbf24');
const sign = new THREE.Mesh(new THREE.PlaneGeometry(11, 2.06), new THREE.MeshBasicMaterial({ map: mkSign(), transparent: true }));
sign.position.set(0, 11, -9.9); scene.add(sign);
if (document.fonts && document.fonts.load) document.fonts.load(SIGN_FONT).then(() => { sign.material.map = mkSign(); sign.material.needsUpdate = true; }).catch(() => {});
const signGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xf59e0b, transparent: true, opacity: .5, blending: THREE.AdditiveBlending, depthWrite: false }));
signGlow.scale.set(17, 6.5, 1); signGlow.position.set(0, 11, -9.95); scene.add(signGlow);
const lampHaloMat = new THREE.SpriteMaterial({ map: glowTex, color: 0xffd27a, transparent: true, opacity: .6, blending: THREE.AdditiveBlending, depthWrite: false });
const stripe = new THREE.Mesh(new THREE.PlaneGeometry(40, .8), M(0xb91c1c, .6)); stripe.position.set(0, 6.5, -9.95); scene.add(stripe);
for (const x of [-9, -3, 3, 9]) {
    const lamp = new THREE.Mesh(new THREE.ConeGeometry(.9, .8, 20, 1, true), new THREE.MeshStandardMaterial({ color: 0xf59e0b, side: THREE.DoubleSide }));
    lamp.position.set(x, 14, -7); const bulb = new THREE.Mesh(new THREE.SphereGeometry(.3, 12, 12), new THREE.MeshBasicMaterial({ color: 0xfff1c2 }));
    bulb.position.set(x, 13.6, -7); scene.add(lamp, bulb);
    const halo = new THREE.Sprite(lampHaloMat); halo.scale.set(3.4, 3.4, 1); halo.position.set(x, 13.4, -7); scene.add(halo);
}

// --- 5. CLIENTE 3D DETALHADO ---
const CY = 3.4; // altura do quadril dos clientes (pernas chegam ao chão)
const customers = []; let focus = null;
function createCustomer3D(type, sx) {
    const g = new THREE.Group(), body = new THREE.Group();
    const skin = M(pick([0xfdba74, 0xe0a370, 0x8d5524, 0xc68642, 0xffdbac]), .6), shirt = M(pick([0x2563eb, 0x7c3aed, 0xdb2777, 0x059669, 0xd97706]), .7);
    const hairC = M(pick([0x1c1917, 0x78350f, 0xfacc15, 0xb45309, 0x9ca3af]), .8), dark = M(0x111827, .5);
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.2, 3.0, 24), shirt); torso.position.y = 1.5; body.add(torso);
    const collar = rot(new THREE.Mesh(new THREE.TorusGeometry(.55, .1, 8, 16), M(0xffffff)), Math.PI / 2, 0, 0); collar.position.y = 3; body.add(collar);
    const pocket = new THREE.Mesh(new THREE.BoxGeometry(.5, .5, .06), M(0x000000, .8)); pocket.material.transparent = true; pocket.material.opacity = .25; pocket.position.set(.5, 2.2, 1.08); body.add(pocket);
    const belt = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.17, .18, 24), dark); belt.position.y = .25; body.add(belt);
    const pants = M(pick([0x1e3a8a, 0x1f2937, 0x57534e, 0x0f766e, 0x7f1d1d]), .7), shoeM = M(0x111827, .45), shoeSole = M(0xf8fafc, .6);
    const mkLeg = x => {
        const l = new THREE.Group(), len = CY - .125;
        const th = new THREE.Mesh(new THREE.CylinderGeometry(.44, .36, len, 14), pants); th.position.y = -len / 2;
        const sh = new THREE.Mesh(new THREE.SphereGeometry(.45, 14, 10), shoeM); sh.scale.set(.9, .5, 1.45); sh.position.set(0, -len, .3);
        const so = new THREE.Mesh(new THREE.BoxGeometry(.78, .08, 1.15), shoeSole); so.position.set(0, -len - .2, .3);
        l.add(th, sh, so); l.position.set(x, .1, 0); body.add(l); return l;
    };
    const legL = mkLeg(-.55), legR = mkLeg(.55);
    const mkArm = x => {
        const a = new THREE.Group(); const u = new THREE.Mesh(new THREE.CylinderGeometry(.28, .24, 1.7, 10), shirt); u.position.y = -.85;
        const h = new THREE.Mesh(new THREE.SphereGeometry(.3, 12, 10), skin); h.position.y = -1.8; a.add(u, h);
        a.position.set(x, 2.8, 0); a.rotation.z = x < 0 ? .12 : -.12; a.userData.baseZ = a.rotation.z; body.add(a); return a;
    };
    const armL = mkArm(-1.3), armR = mkArm(1.3);
    const head = new THREE.Group(); head.position.y = 4.2; body.add(head);
    head.add(new THREE.Mesh(new THREE.SphereGeometry(.85, 24, 20), skin));
    for (const s of [-1, 1]) { const ear = new THREE.Mesh(new THREE.SphereGeometry(.16, 8, 8), skin); ear.position.set(s * .84, 0, 0); ear.scale.z = .5; head.add(ear); }
    const nose = new THREE.Mesh(new THREE.SphereGeometry(.13, 8, 8), skin); nose.position.set(0, -.05, .85); head.add(nose);
    const eyes = [], brows = [];
    for (const s of [-1, 1]) {
        const w = new THREE.Mesh(new THREE.SphereGeometry(.17, 12, 10), M(0xffffff, .3)); w.position.set(s * .3, .15, .72);
        const p = new THREE.Mesh(new THREE.SphereGeometry(.09, 8, 8), dark); p.position.z = .13; w.add(p); head.add(w); eyes.push(w);
        const b = new THREE.Mesh(new THREE.BoxGeometry(.3, .06, .06), hairC); b.position.set(s * .3, .42, .76); head.add(b); brows.push(b);
        const cheek = new THREE.Mesh(new THREE.CircleGeometry(.13, 10), new THREE.MeshBasicMaterial({ color: 0xf87171, transparent: true, opacity: .4 })); cheek.position.set(s * .5, -.2, .7); cheek.lookAt(s * 1.5, -.2, 3); head.add(cheek);
    }
    const mouth = new THREE.Mesh(new THREE.TorusGeometry(.2, .04, 6, 14, Math.PI), M(0x7f1d1d)); mouth.position.set(0, -.32, .78); head.add(mouth);
    const style = Math.floor(Math.random() * 4);
    if (style === 0) { // boné
        const cap = new THREE.Mesh(new THREE.SphereGeometry(.9, 20, 12, 0, 6.283, 0, Math.PI / 2), M(pick([0xdc2626, 0x1e293b, 0x0ea5e9]))); cap.position.y = .15; head.add(cap);
        const brim = new THREE.Mesh(new THREE.CylinderGeometry(.6, .6, .05, 16, 1, false, 0, Math.PI), cap.material); brim.rotation.y = -Math.PI / 2; brim.scale.z = 1.4; brim.position.set(0, .3, .8); head.add(brim);
    } else if (style === 1) { const h = new THREE.Mesh(new THREE.SphereGeometry(.92, 20, 12, 0, 6.283, 0, Math.PI / 2.1), hairC); h.position.y = .1; h.rotation.x = -.2; head.add(h); }
    else if (style === 2) { const b = new THREE.Mesh(new THREE.SphereGeometry(.9, 20, 12, 0, 6.283, 0, Math.PI / 2.4), M(0xf59e0b)); b.position.y = .2; head.add(b); const pom = new THREE.Mesh(new THREE.SphereGeometry(.2, 8, 8), M(0xffffff)); pom.position.y = 1; head.add(pom); }
    else { const mu = new THREE.Mesh(new THREE.BoxGeometry(.6, .1, .1), hairC); mu.position.set(0, -.2, .86); head.add(mu); }
    if (Math.random() < .4) for (const s of [-1, 1]) { const gl = new THREE.Mesh(new THREE.TorusGeometry(.2, .03, 6, 16), dark); gl.position.set(s * .3, .15, .88); head.add(gl); }
    if (type === 'critico') { shirt.color.setHex(0x1f2937); const bt = new THREE.Mesh(new THREE.BoxGeometry(.8, .28, .12), M(0xdc2626)); bt.position.set(0, 3, 1.05); body.add(bt); const mo = new THREE.Mesh(new THREE.TorusGeometry(.22, .04, 6, 16), M(0xfacc15, .2, .8)); mo.position.set(.3, .15, .9); head.add(mo); }
    if (type === 'vip') { shirt.color.setHex(0xb45309); const cr = new THREE.Mesh(new THREE.ConeGeometry(.6, .6, 5), M(0xfacc15, .2, .8)); cr.position.y = 1.15; head.add(cr); }
    const hit = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 7, 16), new THREE.MeshBasicMaterial({ visible: false }));
    hit.position.y = 1.75; hit.userData = { isCustomer: true, isClickable: true }; g.add(body, hit);
    if (type === 'crianca') g.scale.setScalar(.72);
    cast(g); const cy = CY * g.scale.y; g.position.set(-16, cy, -7.2); g.rotation.y = .9; scene.add(g);
    const c = { g, hit, body, head, armL, armR, legL, legR, cy, eyes, brows, mouth, type, sx, state: 'entering', t: 0, pat: 0, maxPat: 1, blink: 2, blinkT: 0, shake: 0, rt: 0, order: null, slot: null, bub: null };
    customers.push(c); setMood(c, 'neutral'); return c;
}
function setMood(c, m) {
    c.mood = m; c.mouth.rotation.z = m === 'angry' ? 0 : Math.PI; c.mouth.scale.set(1, m === 'neutral' ? .35 : 1, 1);
    c.brows[0].rotation.z = m === 'angry' ? -.45 : 0; c.brows[1].rotation.z = m === 'angry' ? .45 : 0;
}

// --- 6. LÓGICA DO JOGO ---
const MAX_STACK_LIMIT = 10, MAX_ERRORS = 5, SLOT_X = [-7, 0, 7];
let money = 0, errors = 0, served = 0, streak = 0, gameOver = true, spawnCd = 1, level = 1, day = 1, xp = 0, dayT = 0, dayRev = 0, dayUsed = 0, dayWaste = 0;
let currentTray = [], trayMeat = [], trayBacon = [], visualPartsGroup = [], currentStackY = 3.5;
const sides = { Batata: null, Bebida: null };
const EMO = { 'Pão': '🍞', 'Carne': '🥩', 'Queijo': '🧀', 'Cheddar': '🟠', 'Salada': '🥬', 'Bacon': '🥓', 'Tomate': '🍅', 'Cebola': '🧅', 'Picles': '🥒', 'Ovo': '🍳', 'Ketchup': '🍅', 'Maionese': '🥚', 'Barbecue': '🟤', 'Batata': '🍟', 'Bebida': '🥤' };
const TYPES = { apressado: { tag: '⚡ Cliente apressado', pm: .6, pay: 1.2, tip: 2 }, normal: { tag: 'Pedido', pm: 1, pay: 1, tip: 1 }, critico: { tag: '🧐 Crítico gastronômico', pm: .8, pay: 3, tip: .3 }, crianca: { tag: '🧒 Criança', pm: .55, pay: .6, tip: 1 }, vip: { tag: '👑 Cliente VIP', pm: 1.1, pay: 1, tip: 4 } };
const maxCust = () => dayT < DAY_LEN / 6 ? 1 : level >= 5 ? 2 : 1; // 1 cliente no começo da noite; mais só em níveis altos
const recipes = [
    { name: "Hambúrguer Normal", price: 30, required: ["Pão", "Carne", "Queijo", "Pão"] },
    { name: "Hambúrguer com Salada", price: 32, required: ["Pão", "Carne", "Queijo", "Salada", "Pão"] },
    { name: "Hambúrguer com Cheddar", price: 33, required: ["Pão", "Carne", "Cheddar", "Pão"] },
    { name: "Hambúrguer com Bacon", price: 34, required: ["Pão", "Carne", "Queijo", "Bacon", "Pão"] },
    { name: "Hambúrguer Bacon e Salada", price: 36, required: ["Pão", "Carne", "Queijo", "Bacon", "Salada", "Pão"] },
    { name: "Hambúrguer Cheddar e Bacon", price: 38, required: ["Pão", "Carne", "Cheddar", "Bacon", "Pão"] },
    { name: "Hambúrguer Duplo", price: 40, required: ["Pão", "Carne", "Queijo", "Carne", "Queijo", "Pão"] },
    { name: "Tomate e Cebola", price: 35, required: ["Pão", "Carne", "Queijo", "Tomate", "Cebola", "Pão"] },
    { name: "Picles e Ketchup", price: 34, required: ["Pão", "Carne", "Queijo", "Picles", "Ketchup", "Pão"] },
    { name: "Hambúrguer com Ovo", price: 36, required: ["Pão", "Carne", "Queijo", "Ovo", "Pão"] },
    { name: "Salada e Maionese", price: 34, required: ["Pão", "Carne", "Queijo", "Salada", "Maionese", "Pão"] },
    { name: "Barbecue Bacon", price: 40, required: ["Pão", "Carne", "Cheddar", "Bacon", "Barbecue", "Pão"] },
    { name: "Duplo Completo", price: 52, required: ["Pão", "Carne", "Queijo", "Carne", "Tomate", "Cebola", "Maionese", "Pão"] }
];
const $ = id => document.getElementById(id);
const bubble = $('speech-bubble');

// Tweens simples
const anims = [];
const tween = (dur, fn, done) => anims.push({ t: 0, dur, fn, done });
function bounceOut(t) { const n = 7.5625, d = 2.75; if (t < 1 / d) return n * t * t; if (t < 2 / d) return n * (t -= 1.5 / d) * t + .75; if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + .9375; return n * (t -= 2.625 / d) * t + .984375; }
function screenPos(v) { const p = v.clone().project(camera); return [(p.x * .5 + .5) * innerWidth, (-p.y * .5 + .5) * innerHeight]; }
function popup(text, color, c) {
    c = c || focus; if (!c) return; const d = document.createElement('div'); d.className = 'popup'; d.innerHTML = text; d.style.color = color;
    const [x, y] = screenPos(new THREE.Vector3(c.g.position.x, c.g.position.y + 6.5 * c.g.scale.y, c.g.position.z));
    d.style.left = x + 'px'; d.style.top = y + 'px'; document.body.appendChild(d); setTimeout(() => d.remove(), 1300);
}
function showFeedback(c, html, ms) {
    if (!c.bub) return; const m = c.bub.querySelector('.main'), f = c.bub.querySelector('.fb'); m.classList.add('hidden'); f.innerHTML = html; f.classList.remove('hidden');
    clearTimeout(c.fbT); c.fbT = setTimeout(() => { f.classList.add('hidden'); m.classList.remove('hidden'); }, ms);
}
function renderHint() {
    customers.forEach(k => { if (k.bub) { k.bub.style.borderColor = k === focus ? '#f59e0b' : '#cbd5e1'; k.bub.style.boxShadow = k === focus ? '0 10px 25px rgba(0,0,0,.35), 0 0 22px rgba(245,158,11,.55)' : ''; } });
    const o = focus && focus.order; if (!o) { $('hint-recipe').innerText = 'Aguardando cliente...'; $('hint-sequence').innerHTML = ''; $('hint-extra').innerText = ''; return; }
    $('hint-recipe').innerText = `${o.r.name} ($${o.price.toFixed(2)})`;
    $('hint-sequence').innerHTML = o.r.required.map((ing, i) => `<span class="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-md font-bold">${i + 1}. ${EMO[ing]} ${ing}</span>`).join('');
    $('hint-extra').innerText = `🔥 Carne: ${STAGES[o.point][1]}${o.r.required.includes('Bacon') ? ' · 🥓 Bacon: Pronto' : ''}${o.fries ? ' · 🍟 Batata frita' : ''}${o.drink ? ' · 🥤 Bebida ' + o.drinkSize + 'ml' : ''}`;
}
function pickFocus() { focus = customers.find(k => k.state === 'waiting') || null; renderHint(); }
function spawnCustomer() {
    if (dayT > DAY_LEN - 17) return;
    const i = [0, 1, 2].find(k => k < maxCust() && !customers.some(c => c.slot === k)); if (i === undefined) return;
    const r = Math.random(), type = level < 2 || served < 2 ? 'normal' : r < .1 ? 'critico' : r < .24 ? 'crianca' : r < .34 ? 'vip' : r < .5 ? 'apressado' : 'normal';
    createCustomer3D(type, SLOT_X[i]).slot = i; SFX.play('door');
}
function generateOrder(c) {
    const T = TYPES[c.type], pool = (a => c.type === 'crianca' ? a.slice(0, 3) : a)(recipes.filter(availRecipe));
    const r = Tut.on ? recipes[0] : pick(pool), fries = !Tut.on && LV_ING.Batata <= level && c.type !== 'crianca' && Math.random() < .45, drink = Tut.on || Math.random() < .45, drinkSize = drink ? (Tut.on ? 300 : pick([300, 500, 700])) : 0;
    c.order = { r, point: Tut.on ? 1 : pick([1, 2]), fries, drink, drinkSize, price: +((r.price + (fries ? 12 : 0) + (drink ? 8 : 0)) * T.pay).toFixed(2) };
    c.maxPat = c.pat = Math.max(24, 52 - level * 3 - served * .5) * T.pm * (1 + (fries + drink) * .4);
    const b = c.bub = document.createElement('div'); b.className = 'speech-bubble pop'; b.style.display = 'block';
    b.innerHTML = `<div class="main"><div class="text-xs font-black text-gray-900 leading-tight">${r.name}</div><div class="text-[10px] font-bold text-gray-600 leading-tight">🔥 ${STAGES[c.order.point][1]}${fries ? ' · 🍟' : ''}${drink ? ' · 🥤 ' + drinkSize + 'ml' : ''}</div><div class="flex items-center gap-1.5 mt-1"><span class="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-1.5 rounded-full">$${c.order.price.toFixed(2)}</span><div class="flex-1 bg-gray-200 rounded-full h-1.5 overflow-hidden"><div class="pbar h-1.5 rounded-full" style="width:100%;background:#10b981"></div></div></div></div><div class="fb hidden"></div>`;
    document.body.appendChild(b); if (!focus || focus.state !== 'waiting') focus = c; renderHint();
}

const MESHES = { Carne: [createPattyMesh, .32], Queijo: [createCheeseMesh, .1], Cheddar: [createCheddarMesh, .1], Salada: [createSaladMesh, .15], Bacon: [createBaconMesh, .14], Tomate: [createTomatoMesh, .12], Cebola: [createOnionMesh, .1], Picles: [createPickleMesh, .1], Ovo: [createEggMesh, .12], Ketchup: [() => createSauceMesh(0xdc2626), .06], Maionese: [() => createSauceMesh(0xfef9c3), .06], Barbecue: [() => createSauceMesh(0x78350f), .06] };
function warnFull() { if (document.body.classList.contains('hud-min')) { toast('⚠️ Bandeja cheia! (máx. 10 itens)'); return; } const w = $('limit-warning'); w.classList.remove('hidden'); setTimeout(() => w.classList.add('hidden'), 2500); }
function addIngredientToTray(name, stage) {
    if (currentTray.length >= MAX_STACK_LIMIT) return warnFull();
    SFX.play('pop'); currentTray.push(name); if (name === 'Carne') trayMeat.push(stage); if (name === 'Bacon') trayBacon.push(stage); updateTrayUI();
    let mesh, h = .25;
    if (name === 'Pão') { const bottom = currentTray.length === 1; mesh = bottom ? createBunBottomMesh() : createBunTopMesh(); h = bottom ? .35 : .6; }
    else { const [f, hh] = MESHES[name]; mesh = name === 'Carne' ? f(STAGES[stage][2]) : name === 'Bacon' ? f(stage) : f(); h = hh; }
    const ty = currentStackY + h / 2; mesh.position.set(0, ty + 4, 5.5); mesh.rotation.y += Math.random() * .4 - .2;
    scene.add(mesh); visualPartsGroup.push(mesh); currentStackY += h;
    tween(.6, k => { mesh.position.y = ty + 4 * (1 - bounceOut(k)); });
}
function updateTrayUI() {
    const n = currentTray.length; $('stack-count').innerText = `${n} / ${MAX_STACK_LIMIT} Ingredientes`;
    $('stack-bar').style.width = `${n / MAX_STACK_LIMIT * 100}%`;
    $('stack-bar').className = `${n >= MAX_STACK_LIMIT ? 'bg-red-500' : 'bg-amber-500'} h-2.5 rounded-full transition-all duration-300`;
    let mi = 0, bi = 0; const chips = currentTray.map(i => `${EMO[i]} ${i}${i === 'Carne' ? ' · ' + STAGES[trayMeat[mi++]][1] : i === 'Bacon' ? ' · ' + BACON_STAGES[trayBacon[bi++]][1] : ''}`)
        .concat(sides.Batata ? [`${EMO.Batata} Batata`] : []).concat(sides.Bebida ? [`${EMO.Bebida} ${sides.Bebida.size}ml`] : []);
    $('tray-list').innerHTML = chips.length ? chips.map(t => `<span class="px-2 py-0.5 bg-gray-800 text-gray-200 border border-gray-700 rounded-md font-medium text-[11px]">${t}</span>`).join('') : '<span class="text-gray-500 italic">Prato vazio</span>';
}
window.jogarFora = function () {
    visualPartsGroup.forEach(p => scene.remove(p)); visualPartsGroup = []; currentTray = []; trayMeat = []; trayBacon = []; currentStackY = 3.5;
    for (const k in sides) { if (sides[k]) scene.remove(sides[k].mesh); sides[k] = null; }
    $('limit-warning').classList.add('hidden'); updateTrayUI();
};
function flyBurger(c) {
    const parts = visualPartsGroup.concat(Object.values(sides).filter(Boolean).map(s => s.mesh)); visualPartsGroup = []; currentTray = []; trayMeat = []; trayBacon = []; sides.Batata = sides.Bebida = null; currentStackY = 3.5; updateTrayUI();
    const to = new THREE.Vector3(c.g.position.x, c.g.position.y + 3, c.g.position.z + 1);
    parts.forEach(p => { const s = p.position.clone(), s0 = p.scale.x; tween(.6, k => { p.position.lerpVectors(s, to, k * k); p.position.y += Math.sin(k * Math.PI) * 3; p.scale.setScalar(s0 * (1 - .8 * k)); }, () => scene.remove(p)); });
}
function grillClick(pt) {
    const s = SLOTS.reduce((a, b) => Math.hypot(a.x - pt.x, a.z - pt.z) < Math.hypot(b.x - pt.x, b.z - pt.z) ? a : b);
    if (!s.mesh) { s.kind = 'Carne'; s.mesh = createPattyMesh(STAGES[0][2]); s.mesh.scale.setScalar(.7); s.mesh.position.set(s.x, 3.65, s.z); scene.add(s.mesh); s.t = 0; s.st = 0; s.tag.style.display = 'block'; return; }
    const tbl = s.kind === 'Bacon' ? BACON_STAGES : STAGES, st = stageOf(s.t, tbl), burnt = st === tbl.length - 1;
    if (!burnt && currentTray.length >= MAX_STACK_LIMIT) return warnFull();
    scene.remove(s.mesh); s.mesh = null; s.tag.style.display = 'none';
    if (!burnt) { addIngredientToTray(s.kind, st); if (s.kind === 'Bacon' && st === 1) { ST.bacon++; checkAch(); } }
}
function bakeBacon(from) {
    const s = SLOTS.find(k => !k.mesh);
    if (!s) return popupAt('Chapa cheia! 🔥', '#fbbf24', new THREE.Vector3(-8, 6, 5.5));
    const m = createBaconMesh(0), a = new THREE.Vector3(from.x, 4.8, from.z), b = new THREE.Vector3(s.x, 3.52, s.z);
    m.scale.setScalar(.7); m.position.copy(a); scene.add(m); Object.assign(s, { kind: 'Bacon', mesh: m, t: -.55, st: 0 }); s.tag.style.display = 'block';
    tween(.55, k => { m.position.lerpVectors(a, b, k); m.position.y += Math.sin(k * Math.PI) * 2.6; m.rotation.y = k * 6.283; }, () => splash(s.x, 3.55, s.z, 0xf59e0b, 4, 1.6, .6));
}
function fryClick() {
    const s = FRY_SLOTS[0];
    if (!s.mesh) { if (LV_ING.Batata > level) return popupAt('🔒 Batata no nível 3', '#fbbf24', new THREE.Vector3(FRYER_X, 6, FRYER_Z));
        const m = createFriesMesh(FRY_STAGES[0][2], false, true); m.position.set(s.x, FRYER_SURF_Y + 1.6, s.z); scene.add(m); s.mesh = m; s.t = 0; s.st = 0; s.tag.style.display = 'block';
        tween(.35, k => { m.position.y = FRYER_SURF_Y - .02 + 1.6 * (1 - k) * (1 - k); }, () => { SFX.play('splash'); FRY.kick = 1; splash(FRYER_X, FRYER_SURF_Y, FRYER_Z, 0xe0900c, 14, 4, .7); }); return;
    }
    const st = fryStageOf(s.t); scene.remove(s.mesh); s.mesh = null; s.tag.style.display = 'none'; FRY.kick = .7; SFX.play('splash'); splash(FRYER_X, FRYER_SURF_Y, FRYER_Z, 0xe0900c, 8, 3, .7);
    if (st === 1 && !sides.Batata) {
        const m = createFriesMesh(FRY_STAGES[1][2]); m.scale.setScalar(1.1); const ty = 3.4;
        m.position.set(1.5, ty + 4, 6.4); scene.add(m); sides.Batata = { mesh: m };
        tween(.6, k => { m.position.y = ty + 4 * (1 - bounceOut(k)); }); updateTrayUI();
    }
}
function placeCup(size, from) {
    const R = REFILL; if (R.cup) return;
    const m = createLiquidCup(), a = new THREE.Vector3(from.x, 5.2, from.z), b = new THREE.Vector3(R.x, PAD_Y, R.z);
    m.scale.setScalar(.55 + size / 1000); m.position.copy(a); scene.add(m);
    Object.assign(R, { cup: m, size, t: -.1, full: false, endT: 0, flying: true, sp: 0 }); R.tag.style.display = 'block';
    tween(.5, k => { m.position.lerpVectors(a, b, k); m.position.y += Math.sin(k * Math.PI) * 2.4; }, () => { m.position.copy(b); R.flying = false; });
}
function onCupFull() { SFX.play('ding'); const l = REFILL.cup.userData.lid; l.visible = true; l.position.y = .9; tween(.45, k => { l.position.y = .9 * (1 - bounceOut(k)); }); }
function refillClick() {
    const R = REFILL; if (!R.cup || !R.full || R.flying || sides.Bebida) return;
    const cup = R.cup, a = cup.position.clone(), b = new THREE.Vector3(-1.5, 3.4, 6.4);
    sides.Bebida = { mesh: cup, size: R.size }; R.cup = null; R.tag.style.display = 'none'; updateTrayUI();
    tween(.55, k => { cup.position.lerpVectors(a, b, k); cup.position.y += Math.sin(k * Math.PI) * 2.6; });
}

function registerError() {
    errors++; updateErrorBadges(); SFX.play('error');
    if (errors < MAX_ERRORS || Tut.on) return false;
    endDay(true);
    return true;
}
function react(c, mood, secs) { setMood(c, mood); c.state = 'react'; c.rt = secs; c.order = null; const L = (mood === 'happy' ? HAPPY : ANGRY)[c.type]; if (L) setTimeout(() => popup(pick(L), mood === 'happy' ? '#fde68a' : '#fca5a5', c), 450); }

function deliverToCustomer(c) {
    focus = c; renderHint();
    if (c.state !== 'waiting' || !c.order || gameOver || !(currentTray.length || sides.Batata || sides.Bebida)) return;
    const o = c.order, ok = JSON.stringify(currentTray) === JSON.stringify(o.r.required) && trayMeat.every(s => s === o.point) && trayBacon.every(s => s === 1) && !!sides.Batata === o.fries && !!sides.Bebida === o.drink && (!o.drink || sides.Bebida.size === o.drinkSize);
    if (ok) {
        const ratio = c.pat / c.maxPat, tip = +((o.price * .25 * ratio + streak * .5) * TYPES[c.type].tip).toFixed(2), total = +((o.price + tip) * (1 + Math.max(0, level - 5) * .05)).toFixed(2);
        money += total; dayRev += total; served++; streak++; xp += 10 + Math.round(ratio * 10) + Math.min(streak, 5) * 2; updateHUD();
        showFeedback(c, `<div class="text-emerald-600 text-xs font-extrabold uppercase">Delicioso! 😋</div><div class="text-lg font-black text-gray-900">+ $${total.toFixed(2)}</div><div class="text-[11px] text-amber-600 font-bold">Gorjeta $${tip.toFixed(2)}${streak > 1 ? ' · 🔥 x' + streak : ''}</div>`, 1400);
        SFX.play('cash'); onServed(ratio); popup(`+$${total.toFixed(2)} 💰`, '#34d399', c); sparkle(c.g.position.x, c.g.position.y + 4.6 * c.g.scale.y, c.g.position.z + 1); flyBurger(c); react(c, 'happy', 1.4); pickFocus();
    } else {
        streak = 0; c.pat = Math.max(1, c.pat - 3);
        if (registerError()) return;
        if (c.type === 'critico') { if (registerError()) return; showFeedback(c, `<div class="text-red-600 text-xs font-extrabold uppercase">Inaceitável! 🧐</div><div class="text-xs font-bold text-gray-800 mt-1">O crítico foi embora</div>`, 1400); popup('💢', '#f87171', c); react(c, 'angry', 1.4); pickFocus(); return; }
        setMood(c, 'angry'); c.shake = .8;
        showFeedback(c, `<div class="text-red-600 text-xs font-extrabold uppercase">Eca! Está errado! 🤢</div><div class="text-xs font-bold text-gray-800 mt-1">Confira carne, itens e combo!</div>`, 2000);
        popup('❌', '#f87171', c); setTimeout(() => { if (c.state === 'waiting') setMood(c, 'neutral'); }, 1500);
    }
}
function updateErrorBadges() {
    $('error-badges').innerHTML = Array.from({ length: MAX_ERRORS }, (_, i) => i < errors ? '<span class="text-red-500 scale-110">❌</span>' : '<span class="text-gray-600">🖤</span>').join('');
}
function resetGame() {
    errors = 0; served = 0; streak = 0; spawnCd = 1; dayT = 0; dayRev = dayUsed = dayWaste = 0;
    $('modal-bankrupt').classList.add('hidden'); updateErrorBadges(); jogarFora();
    customers.splice(0).forEach(c => { scene.remove(c.g); if (c.bub) c.bub.remove(); }); focus = null; renderHint();
    SLOTS.forEach(s => { if (s.mesh) scene.remove(s.mesh); s.mesh = null; s.tag.style.display = 'none'; });
    FRY_SLOTS.forEach(s => { if (s.mesh) scene.remove(s.mesh); s.mesh = null; s.tag.style.display = 'none'; });
    if (REFILL.cup) scene.remove(REFILL.cup); REFILL.cup = null; REFILL.tag.style.display = 'none'; REFILL.flying = false; stream.visible = streamIn.visible = false;
}

// --- SISTEMA DE DIA E NÍVEIS ---
const DAY_LEN = 240; // 4 min reais = 18:00 → 00:00
const LV_ING = { 'Pão': 1, 'Carne': 1, 'Queijo': 1, 'Copo': 1, 'Salada': 2, 'Cheddar': 2, 'Bacon': 3, 'Batata': 3, 'Tomate': 4, 'Cebola': 4, 'Ovo': 4, 'Picles': 5, 'Ketchup': 5, 'Maionese': 5, 'Barbecue': 5 };
const UNLOCKS = { 2: '🥬 Salada · 🟠 Cheddar', 3: '🥓 Bacon na chapa · 🍟 Batata frita · pedidos com combo', 4: '🍅 Tomate · 🧅 Cebola · 🍳 Ovo · Hambúrguer Duplo', 5: '🥒 Picles · 🍅 Ketchup · 🥚 Maionese · 🟤 Barbecue · Duplo Completo · até 2 clientes ao mesmo tempo' };
recipes.forEach(r => { if (r.name === 'Hambúrguer Duplo') r.lv = 4; if (r.name === 'Duplo Completo') r.lv = 5; });
const availRecipe = r => (r.lv || 1) <= level && r.required.every(i => LV_ING[i] <= level);
let lastMin = -1;
function updateClock() {
    const m = Math.floor(dayT / DAY_LEN * 360); if (m === lastMin) return; lastMin = m;
    $('clock').textContent = `${String((18 + Math.floor(m / 60)) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}
let _lastMoney = 0;
function updateHUD() {
    const need = 80 * level; $('money').innerText = money.toFixed(2); $('day-n').textContent = day; $('lvl').textContent = level;
    $('xp-bar').style.width = Math.min(100, xp / need * 100) + '%'; $('xp-txt').textContent = xp >= need ? 'sobe ao fechar o dia!' : `${xp}/${need} XP`;
    if (money > _lastMoney + .001) { const mp = $('money').parentElement; mp.classList.remove('money-pop'); void mp.offsetWidth; mp.classList.add('money-pop'); } _lastMoney = money;
    lastMin = -1; updateClock();
}
function refreshPots() {
    potGroups.forEach(g => { const n = g.children.find(c => c.userData.ingredient).userData.ingredient; g.visible = LV_ING[n.startsWith('Copo') ? 'Copo' : n] <= level; });
}
function endDay(early) {
    if (gameOver) return; gameOver = true;
    customers.splice(0).forEach(c => { scene.remove(c.g); if (c.bub) c.bub.remove(); }); focus = null; renderHint();
    const ups = [], row = (a, b, c = '') => `<div class="flex justify-between border-b border-gray-800 pb-1"><span>${a}</span><b class="${c}">${b}</b></div>`;
    while (xp >= 80 * level) { xp -= 80 * level; level++; ups.push(level); }
    const record = dayRev > bestDay && dayRev > 0; if (record) bestDay = dayRev; ST.bestDay = bestDay; if (!early && errors === 0 && served > 0) ST.perfect++;
    SFX.play(ups.length ? 'level' : 'close'); checkAch();
    $('day-title').textContent = early ? `Dia ${day} · a loja fechou mais cedo (5 erros)` : `Dia ${day} encerrado · 00:00`;
    $('day-body').innerHTML = row('🧾 Pedidos entregues', served) + row('💰 Faturamento do dia', '$' + dayRev.toFixed(2), 'text-emerald-400 text-lg') + row('🏦 Caixa total', '$' + money.toFixed(2), 'text-amber-400') + row('🥇 Melhor noite', '$' + bestDay.toFixed(2), 'text-yellow-300') + (record ? '<div class="mt-2 p-2 rounded-xl bg-yellow-500/20 border border-yellow-400/60 text-yellow-200 font-black text-center">🏆 NOVO RECORDE DE FATURAMENTO!</div>' : '')
        + ups.map(l => `<div class="mt-3 p-3 rounded-xl bg-sky-500/20 border border-sky-400/50 text-sky-200 font-bold text-center">⭐ NÍVEL ${l}!<br><span class="text-xs font-semibold">${UNLOCKS[l] ? 'Desbloqueou: ' + UNLOCKS[l] : '💰 Pedidos pagam +' + (l - 5) * 5 + '% a mais'}</span></div>`).join('');
    $('modal-day').classList.remove('hidden'); updateHUD();
}
window.startDay = () => { resetGame(); refreshPots(); updateHUD(); gameOver = false; if (TIPS[level] && !tipShown[level]) { tipShown[level] = 1; toast(TIPS[level]); } };
window.nextDay = () => { $('modal-day').classList.add('hidden'); day++; startDay(); };

// --- POLIMENTO: SONS, AMBIENTE, FALAS, CONQUISTAS, PAUSA ---
let paused = false, started = false, bestDay = 0; const tipShown = {};
const ST = { served: 0, bacon: 0, perfect: 0, streak: 0, bestDay: 0 };
const TIPS = { 2: '🥬 Novos: salada e cheddar!', 3: '🥓 Bacon: clique no pote, leve à chapa e espere ficar pronto. 🍟 Batata liberada!', 4: '🍅 Tomate, cebola, ovo e Hambúrguer Duplo liberados!', 5: '🥒 Picles e molhos liberados · agora até 2 clientes juntos!' };
const LINES = { normal: ['Boa noite! Estou com fome.', 'Me vê um lanche caprichado!', 'Tô com pressa, mas sem estresse.'], critico: ['Vou avaliar cada detalhe.', 'Surpreenda o meu paladar.', 'Espero que a carne esteja no ponto.'], crianca: ['Eu quero um hambúrguer!!', 'Mãe, tô com muita fome!', 'Quero com bastante queijo!'], vip: ['Sirva o melhor da casa.', 'Tenho uma agenda apertada.', 'Capriche, por favor.'], apressado: ['Rápido, por favor!', 'Meu ônibus sai em 5 minutos!', 'Tô atrasado, vai logo!'] };
const HAPPY = { normal: ['Delícia!', 'Perfeito, valeu!'], critico: ['Hmm… aprovado.', 'Excelente execução.'], crianca: ['Eba!! 😋', 'Muito bom!'], vip: ['Impecável.', 'Manda a conta, é pra você.'], apressado: ['Boa, foi rápido!', 'Valeu, tô indo!'] };
const ANGRY = { normal: ['Que demora!', 'Assim não dá…'], critico: ['Inaceitável.', 'Nota baixa pra vocês.'], crianca: ['Buáááá!', 'Não gostei!'], vip: ['Que decepção.', 'Nunca mais volto.'], apressado: ['Perdi meu ônibus!', 'Não dá mais tempo!'] };
const ACH = [
    { ico: '🍔', name: 'Primeiro pedido', desc: 'Entregue 1 hambúrguer', goal: 1, get: () => ST.served },
    { ico: '🏅', name: '100 hambúrgueres', desc: 'Entregue 100 pedidos', goal: 100, get: () => ST.served },
    { ico: '🥓', name: 'Mestre do bacon', desc: '10 bacons no ponto', goal: 10, get: () => ST.bacon },
    { ico: '✨', name: 'Noite perfeita', desc: 'Termine uma noite sem erros', goal: 1, get: () => ST.perfect },
    { ico: '🔥', name: 'Em chamas', desc: 'Sequência de 10 acertos', goal: 10, get: () => ST.streak },
    { ico: '💰', name: 'Noite de ouro', desc: 'Fature $500 em uma noite', goal: 500, get: () => ST.bestDay },
    { ico: '⭐', name: 'Chef nível 5', desc: 'Chegue ao nível 5', goal: 5, get: () => level }
];
function toast(msg) { const d = document.createElement('div'); d.className = 'px-4 py-2 rounded-xl bg-gray-900/95 border border-amber-400/60 text-amber-200 text-sm font-bold shadow-xl'; d.innerHTML = msg; $('toast-box').appendChild(d); setTimeout(() => d.remove(), 4200); }
function checkAch() { if (Tut.on) return; ACH.forEach(a => { if (!a.done && a.get() >= a.goal) { a.done = true; toast(`🏆 Conquista: ${a.ico} <b>${a.name}</b>`); SFX.play('ach'); } }); }
function onServed(ratio) { ST.served++; ST.streak = Math.max(ST.streak, streak); checkAch(); }
window.showAch = () => { setPaused(true); $('ach-best').textContent = `Melhor noite: $${bestDay.toFixed(2)} · o progresso vale enquanto a página estiver aberta`; $('ach-list').innerHTML = ACH.map(a => { const v = Math.min(a.goal, Math.floor(a.get())); return `<div class="p-2.5 rounded-xl border ${a.done ? 'border-yellow-400/70 bg-yellow-500/10' : 'border-gray-700 bg-gray-800/60'}"><div class="flex justify-between font-bold"><span>${a.ico} ${a.name}</span><span class="text-xs ${a.done ? 'text-yellow-300' : 'text-gray-400'}">${a.done ? '✔ feito' : v + '/' + a.goal}</span></div><div class="text-[11px] text-gray-400">${a.desc}</div><div class="h-1.5 mt-1 rounded-full bg-gray-700 overflow-hidden"><div class="h-1.5 bg-yellow-400" style="width:${v / a.goal * 100}%"></div></div></div>`; }).join(''); $('modal-ach').classList.remove('hidden'); };
window.hideAch = () => { $('modal-ach').classList.add('hidden'); setPaused(false); };
function setPaused(v) { paused = v; SFX.suspend(v); }
window.togglePause = () => { if (gameOver || !started) return; setPaused(!paused); $('modal-pause').classList.toggle('hidden', !paused); };
window.showTut = () => { $('btn-tut-practice').classList.toggle('hidden', started); if (started) setPaused(true); $('modal-tut').classList.remove('hidden'); };
window.closeTut = () => {
    $('modal-tut').classList.add('hidden'); SFX.init();
    try { localStorage.setItem('bn_tut', '1'); } catch (e) {}
    if (!started) {
        const ss = $('start-screen'); if (!ss.classList.contains('hidden') && !ss.classList.contains('leaving')) return; // abriu "Como jogar" pelo menu: volta ao menu
        started = true; startDay();
    } else setPaused(false);
};
window.playNow = () => {
    if (started) return; SFX.init();
    const ss = $('start-screen'); ss.classList.add('leaving'); document.body.classList.remove('menu'); setTimeout(() => ss.classList.add('hidden'), 450);
    let seen = false; try { seen = !!localStorage.getItem('bn_tut'); } catch (e) {}
    if (seen) { started = true; startDay(); } else Tut.start();
};
window.goFull = () => {
    const d = document, el = d.documentElement;
    if (d.fullscreenElement) { d.exitFullscreen(); return; }
    if (el.requestFullscreen) el.requestFullscreen().then(() => { if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {}); }).catch(() => {});
};
if (!document.fullscreenEnabled) $('btn-full').classList.add('hidden');
window.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && !started && document.body.classList.contains('menu') && $('modal-tut').classList.contains('hidden') && $('modal-ach').classList.contains('hidden')) { e.preventDefault(); playNow(); } });
window.toggleMute = () => { $('btn-mute').textContent = SFX.toggle() ? '🔇' : '🔊'; };
window.addEventListener('keydown', e => { if (e.key === 'p' || e.key === 'P') togglePause(); });
window.addEventListener('pointerdown', () => SFX.init());
// Ambiente: do entardecer (18h) à madrugada (00h)
const SKY = [[0, 0xc9733b], [.3, 0x6a4a7c], [.65, 0x1e2748], [1, 0x090c17]], _c1 = new THREE.Color(), _c2 = new THREE.Color();
function updateAmbient() {
    const k = Math.min(1, dayT / DAY_LEN); let i = 1; while (i < SKY.length - 1 && k > SKY[i][0]) i++;
    const a = SKY[i - 1], b = SKY[i], c = _c1.setHex(a[1]).lerp(_c2.setHex(b[1]), Math.min(1, (k - a[0]) / (b[0] - a[0])));
    scene.background.copy(c); scene.fog.color.copy(c);
    ambientLight.intensity = .95 - .45 * k; ambientLight.color.setHex(0xfff0dc).lerp(_c2.setHex(0xa8b8ff), k * .7);
    mainLight.intensity = 1.05 - .55 * k; mainLight.color.setHex(0xffd7a0).lerp(_c2.setHex(0xaab8ff), k);
    kitchenWarmLight.intensity = .5 + .7 * k;
}
// Áudio sintetizado (Web Audio): sem arquivos externos
const SFX = (() => {
    let ctx, out, nb, muted = false, L = {}, S = { on: false, grill: 0, fry: false, pour: -1 };
    const rnd = (a, b) => a + Math.random() * (b - a);
    function env(g, t, a, d, pk) { g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(pk, t + a); g.gain.exponentialRampToValueAtTime(.0001, t + a + d); }
    function tone(f, t, d, g, type = 'sine', f2) { const o = ctx.createOscillator(), gn = ctx.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d); env(gn, t, .004, d, g); o.connect(gn); gn.connect(out); o.start(t); o.stop(t + d + .05); }
    function burst(type, f, q, t, d, g) { const s = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), gn = ctx.createGain(); s.buffer = nb; fl.type = type; fl.frequency.value = f; fl.Q.value = q; env(gn, t, .002, d, g); s.connect(fl); fl.connect(gn); gn.connect(out); s.start(t, Math.random()); s.stop(t + d + .05); }
    const bell = (f, t, g) => [[1, 1, 1.5], [2.76, .5, 1], [5.4, .25, .55], [8.93, .1, .3]].forEach(([m, a, d]) => tone(f * m, t, d, g * a));
    function loop(type, f, q) { const n = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), gn = ctx.createGain(); n.buffer = nb; n.loop = true; fl.type = type; fl.frequency.value = f; fl.Q.value = q; gn.gain.value = 0; n.connect(fl); fl.connect(gn); gn.connect(out); n.start(0, rnd(0, 1)); return { gn, fl }; }
    function tick() {
        if (!ctx || !S.on || muted) return; const t = ctx.currentTime;
        if (S.grill) for (let i = 0; i < Math.min(3, S.grill) * 2; i++) if (Math.random() < .35) burst('bandpass', rnd(3500, 9000), 2.5, t + rnd(0, .07), rnd(.006, .02), rnd(.05, .17));
        if (S.fry) { if (Math.random() < .6) burst('highpass', rnd(2500, 6000), 1, t, .012, rnd(.04, .1)); if (Math.random() < .3) tone(rnd(220, 480), t, .05, .07, 'sine', rnd(500, 900)); if (Math.random() < .5) burst('bandpass', rnd(6000, 9000), 3, t + rnd(0, .06), .01, .08); }
        if (S.pour >= 0) { for (let i = 0; i < 3; i++) if (Math.random() < .7) burst('highpass', rnd(6000, 10000), 1.5, t + rnd(0, .07), .008, rnd(.02, .06)); if (Math.random() < .25) tone(rnd(600, 1400), t, .03, .03, 'sine', rnd(1500, 2400)); }
    }
    return {
        init() {
            if (ctx) { if (ctx.state === 'suspended' && !paused) ctx.resume(); return; }
            try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
            const comp = ctx.createDynamicsCompressor(); out = ctx.createGain(); out.gain.value = muted ? 0 : .9; out.connect(comp); comp.connect(ctx.destination);
            nb = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); const d = nb.getChannelData(0); let b0 = 0; for (let i = 0; i < d.length; i++) { b0 = .97 * b0 + .03 * (Math.random() * 2 - 1); d[i] = (Math.random() * 2 - 1) * .6 + b0 * 6; }
            L.grill = loop('highpass', 3200, .7); L.grillLow = loop('bandpass', 1100, .5); L.fry = loop('bandpass', 4500, .6); L.fryLow = loop('lowpass', 450, .8); L.pour = loop('bandpass', 2000, 1.3); L.room = loop('lowpass', 260, .5);
            setInterval(tick, 70);
        },
        update(on, grill, fry, pour) {
            if (!ctx) return; S.on = on; S.grill = on ? grill : 0; S.fry = on && fry; S.pour = on ? pour : -1; const t = ctx.currentTime, set = (l, v) => l.gn.gain.setTargetAtTime(on && !muted ? v : 0, t, .12);
            set(L.grill, S.grill ? .018 + .01 * Math.min(3, S.grill) : 0); set(L.grillLow, S.grill ? .02 : 0); set(L.fry, S.fry ? .03 : 0); set(L.fryLow, S.fry ? .09 : 0);
            set(L.pour, S.pour >= 0 ? .07 : 0); if (S.pour >= 0) L.pour.fl.frequency.setTargetAtTime(1500 + 2600 * S.pour, t, .05); set(L.room, .03);
        },
        play(n) {
            if (!ctx || muted || ctx.state !== 'running') return; const t = ctx.currentTime;
            if (n === 'pop') { tone(210, t, .09, .22, 'sine', 90); burst('lowpass', 700, .7, t, .06, .2); }
            else if (n === 'cash') { bell(1760, t, .16); bell(1760, t + .13, .12); [2637, 3136, 3520].forEach((f, i) => tone(f, t + .26 + i * .06, .18, .05, 'triangle')); }
            else if (n === 'ding') { bell(1318, t, .18); }
            else if (n === 'error') { tone(170, t, .32, .22, 'sawtooth', 85); tone(120, t + .12, .3, .18, 'square', 70); }
            else if (n === 'door') { tone(784, t, .5, .1, 'sine'); tone(1047, t + .16, .6, .1, 'sine'); }
            else if (n === 'splash') { burst('bandpass', 1400, .6, t, .28, .32); burst('lowpass', 500, .8, t, .4, .4); for (let i = 0; i < 4; i++) tone(rnd(250, 500), t + .08 * i, .06, .06, 'sine', rnd(600, 900)); }
            else if (n === 'level' || n === 'ach') { [523, 659, 784, 1047, 1319].slice(n === 'ach' ? 2 : 0).forEach((f, i) => tone(f, t + i * .11, .5, .13, 'triangle')); bell(2093, t + .5, .08); }
            else if (n === 'close') { tone(659, t, .6, .12, 'triangle'); tone(523, t + .25, .8, .12, 'triangle'); }
        },
        suspend(v) { if (!ctx) return; v ? ctx.suspend() : ctx.resume(); },
        toggle() { muted = !muted; if (out) out.gain.value = muted ? 0 : .9; return muted; }
    };
})();

// --- 7. CLIQUES ---
const raycaster = new THREE.Raycaster(), mouse = new THREE.Vector2();
window.addEventListener('pointerdown', e => {
    if (e.target.closest('#ui') || e.target.closest('#modal-bankrupt') || e.target.closest('#start-screen') || e.target.closest('#tut-coach') || e.target.closest('button') || gameOver || paused) return;
    mouse.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
    raycaster.setFromCamera(mouse, camera);
    for (const h of raycaster.intersectObjects(scene.children, true)) {
        let o = h.object; while (o && !o.userData.isClickable) o = o.parent;
        if (!o) continue;
        if (o.userData.ingredient) {
            const ing = o.userData.ingredient;
            const key = ing.startsWith('Copo') ? 'Copo' : ing;
            if (LV_ING[key] > level) popupAt(`🔒 ${key} no nível ${LV_ING[key]}`, '#fbbf24', new THREE.Vector3(o.parent.position.x, 7, o.parent.position.z));
            else if (ing.startsWith('Copo')) { if (!REFILL.cup) placeCup(parseInt(ing.slice(4)), o.parent.position); }
            else if (ing === 'Bacon') { bakeBacon(o.parent.position); }
            else if (currentTray.length >= MAX_STACK_LIMIT) warnFull(); else addIngredientToTray(ing);
            const pg = o.parent; if (pg && pg.userData.pot) tween(.3, k => { const s = Math.sin(k * Math.PI); pg.scale.set(1 + s * .1, 1 - s * .12, 1 + s * .1); });
        } else if (o.userData.grill) grillClick(h.point);
        else if (o.userData.fryer) fryClick();
        else if (o.userData.refill) refillClick();
        else if (o.userData.isCustomer) { const c = customers.find(k => k.hit === o); if (c) deliverToCustomer(c); }
        return;
    }
});

// --- 8. LOOP DE ANIMAÇÃO ---
const clock = new THREE.Clock();
function updateCustomer(c, dt, time) {
    const g = c.g; c.t += dt;
    c.blink -= dt; if (c.blink < 0) { c.blink = 2 + Math.random() * 3; c.blinkT = .12; }
    if (c.blinkT > 0) c.blinkT -= dt; c.eyes.forEach(e => e.scale.y = c.blinkT > 0 ? .1 : 1);
    const w = Math.sin(time * 9);
    if (c.state === 'entering' || c.state === 'leaving') {
        g.position.x += dt * 7; g.rotation.y = .9;
        c.body.position.y = Math.abs(w) * .25; c.body.rotation.z = w * .06; c.armL.rotation.x = w * .6; c.armR.rotation.x = -w * .6; c.legL.rotation.x = -w * .55; c.legR.rotation.x = w * .55;
        if (c.state === 'entering' && g.position.x >= c.sx) { g.position.x = c.sx; c.state = 'waiting'; c.armL.rotation.x = c.armR.rotation.x = c.legL.rotation.x = c.legR.rotation.x = 0; c.body.rotation.z = 0; tween(.4, k => { g.position.z = -7.2 + 1.0 * k; }); generateOrder(c); }
        if (c.state === 'leaving' && g.position.x > 20) { scene.remove(g); customers.splice(customers.indexOf(c), 1); }
    } else if (c.state === 'waiting') {
        g.rotation.y += (0 - g.rotation.y) * Math.min(1, dt * 8); c.body.position.y = Math.sin(time * 2) * .04;
        c.head.rotation.y = Math.sin(time * .8) * .2; c.armL.rotation.x = c.armR.rotation.x = c.legL.rotation.x = c.legR.rotation.x = 0;
        if (c.shake > 0) { c.shake -= dt; g.position.x = c.sx + Math.sin(time * 60) * .15 * (c.shake / .8); } else g.position.x = c.sx;
        if (!gameOver && !Tut.on) c.pat -= dt;
        const r = Math.max(0, c.pat / c.maxPat), bar = c.bub.querySelector('.pbar');
        bar.style.width = r * 100 + '%'; bar.style.background = r > .5 ? '#10b981' : r > .25 ? '#f59e0b' : '#ef4444';
        if (c.pat <= 0 && !gameOver) {
            streak = 0; showFeedback(c, `<div class="text-red-600 text-xs font-extrabold uppercase">Demorou demais! 😡</div><div class="text-xs font-bold text-gray-800 mt-1">O cliente foi embora</div>`, 1400);
            popup('⏰ ❌', '#f87171', c); if (!registerError()) { react(c, 'angry', 1.4); pickFocus(); }
        }
    } else if (c.state === 'react') {
        c.rt -= dt; c.body.rotation.z = 0;
        if (c.mood === 'happy') { g.position.y = c.cy + Math.abs(Math.sin(c.t * 9)) * .6; c.armL.rotation.z = -2.6; c.armR.rotation.z = 2.6; c.legL.rotation.x = Math.sin(c.t * 9) * .4; c.legR.rotation.x = -Math.sin(c.t * 9) * .4; }
        else { g.position.x = c.sx + Math.sin(time * 50) * .12; c.armL.rotation.z = -.9; c.armR.rotation.z = .9; }
        if (c.rt <= 0) { g.position.set(c.sx, c.cy, -8.6); c.armL.rotation.z = c.armL.userData.baseZ; c.armR.rotation.z = c.armR.userData.baseZ; c.state = 'leaving'; c.slot = null; if (c.bub) c.bub.style.display = 'none'; }
    }
}
// Painel: compacto por padrão em telas pequenas; o botão 📋 alterna
const SMALL_SCR = window.matchMedia('(max-height: 520px), (max-width: 700px)');
function applyHud() { let p = null; try { p = localStorage.getItem('bn_hud'); } catch (e) {} document.body.classList.toggle('hud-min', p ? p === 'min' : SMALL_SCR.matches); }
window.toggleHud = () => { const min = !document.body.classList.contains('hud-min'); try { localStorage.setItem('bn_hud', min ? 'min' : 'full'); } catch (e) {} applyHud(); };
applyHud(); window.addEventListener('resize', applyHud);
// Balão sempre dentro da tela e NUNCA sobre o cliente: tenta em cima da cabeça; se não couber, encolhe um pouco; se ainda não couber, vai para o lado
const SMALL_LAND = window.matchMedia('(orientation: landscape) and (max-height: 520px)');
function placeBubble(b, c, x, y) {
    const g = c.g, base = SMALL_LAND.matches ? .85 : 1, m = 8, W = b.offsetWidth, H = b.offsetHeight, hudEl = document.querySelector('.hud-glass'), hr = hudEl && !document.body.classList.contains('menu') ? hudEl.getBoundingClientRect() : null;
    const hw = Math.abs(screenPos(new THREE.Vector3(g.position.x + 1.7 * g.scale.x, g.position.y, g.position.z))[0] - screenPos(new THREE.Vector3(g.position.x, g.position.y, g.position.z))[0]);
    const others = customers.filter(k => k !== c && k.state !== 'leaving').map(k => screenPos(new THREE.Vector3(k.g.position.x, k.g.position.y, k.g.position.z))[0]);
    const clash = (l, r) => others.some(ox => ox + hw > l && ox - hw < r);
    const place = (cx, bottom, sc, side, tx) => { b.style.left = cx + 'px'; b.style.top = bottom + 'px'; b.style.setProperty('--bs', sc); b.style.setProperty('--tx', tx + 'px'); b.classList.toggle('side', side); };
    for (const f of [1, .85, .7]) {
        const sc = base * f, w = W * sc, h = H * sc;
        // 1) em cima da cabeça
        let cx = Math.min(Math.max(x, w / 2 + m), innerWidth - w / 2 - m);
        if (hr && y - h < hr.bottom + 4 && cx - w / 2 < hr.right + 4 && cx + w / 2 > hr.left) cx = Math.max(cx, hr.right + 6 + w / 2); // não cobre o painel
        const topMin = h + m + (cx + w / 2 > innerWidth - 200 ? 50 : 0);
        if (cx + w / 2 > innerWidth - m) cx = innerWidth - w / 2 - m;
        if (y >= topMin && y <= innerHeight - m) { place(cx, y, sc, false, Math.max(-w / 2 + 22, Math.min(w / 2 - 22, x - cx))); return; }
        // 2) ao lado do cliente (direita, depois esquerda)
        for (const dir of [1, -1]) {
            const sx = x + dir * (hw + 10 + w / 2);
            if (sx - w / 2 < m || sx + w / 2 > innerWidth - m || clash(sx - w / 2, sx + w / 2)) continue;
            const bottom = Math.min(Math.max(y + h * .6, h + m + (sx + w / 2 > innerWidth - 200 ? 50 : 0)), innerHeight - m);
            place(sx, bottom, sc, true, 0); return;
        }
    }
    // último recurso (tela minúscula): menor tamanho, preso nas bordas
    const sc = base * .7, w = W * sc, h = H * sc, cx = Math.min(Math.max(x, w / 2 + m), innerWidth - w / 2 - m);
    place(cx, Math.min(Math.max(y, h + m), innerHeight - m), sc, false, 0);
}
function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), .05) * (paused ? 0 : 1), time = clock.elapsedTime;
    for (let i = anims.length - 1; i >= 0; i--) { const a = anims[i]; a.t += dt; const k = Math.min(a.t / a.dur, 1); a.fn(k); if (k >= 1) { anims.splice(i, 1); if (a.done) a.done(); } }
    customers.slice().forEach(c => updateCustomer(c, dt, time));
    if (!gameOver && !Tut.on) { dayT += dt; updateClock(); if (dayT >= DAY_LEN) endDay(false); }
    spawnCd -= dt; if (spawnCd <= 0 && !gameOver && !Tut.on) { spawnCustomer(); spawnCd = (2 + Math.random() * 3) * (1.3 - .6 * Math.exp(-((18 + dayT / DAY_LEN * 6 - 21) ** 2) / 1.5)); }
    updateDrops(dt); updateFryer(dt, time); updateAmbient(); SFX.update(!paused && !gameOver, SLOTS.filter(s => s.mesh).length, !!FRY_SLOTS[0].mesh, REFILL.cup && !REFILL.full && !REFILL.flying ? Math.min(1, Math.max(0, REFILL.t) / (.8 + REFILL.size / 250)) : -1);
    SLOTS.forEach(s => {
        if (!s.mesh) return; s.t += dt; const bacon = s.kind === 'Bacon', tbl = bacon ? BACON_STAGES : STAGES, st = stageOf(s.t, tbl);
        if (st !== s.st) { s.st = st; if (bacon) tintBacon(s.mesh, st); else s.mesh.children[0].material.color.setHex(STAGES[st][2]); }
        const [x, y] = screenPos(new THREE.Vector3(s.x, 5.4, s.z)); s.tag.style.left = x + 'px'; s.tag.style.top = y + 'px';
        s.tag.textContent = `${(bacon ? ['🥓', '✅', '💀'] : ['🥩', '🔥', '🍖', '💀'])[st]} ${tbl[st][1]}`; s.tag.style.color = (bacon ? ['#fca5a5', '#34d399', '#f87171'] : ['#fca5a5', '#34d399', '#fbbf24', '#f87171'])[st];
    });
    FRY_SLOTS.forEach(s => {
        if (!s.mesh) return; s.t += dt; const st = fryStageOf(s.t);
        if (st !== s.st) { s.st = st; s.mesh.children[1].material.color.setHex(FRY_STAGES[st][2]); }
        const [x, y] = screenPos(new THREE.Vector3(s.x, 5.2, s.z)); s.tag.style.left = x + 'px'; s.tag.style.top = y + 'px';
        s.tag.textContent = `${['🥔', '🍟', '💀'][st]} ${FRY_STAGES[st][1]}`; s.tag.style.color = ['#fef08a', '#34d399', '#f87171'][st];
    });
    const R = REFILL;
    if (R.cup) {
        const cup = R.cup, sc = cup.scale.x, fillTime = .8 + R.size / 250;
        if (!R.flying) { if (!R.full) { R.t += dt; if (R.t >= fillTime) { R.full = true; R.endT = 0; onCupFull(); } } else R.endT += dt; }
        const h = CUP_MAXL * (R.full ? 1 : Math.max(0, Math.min(1, R.t / fillTime)));
        const foamH = R.full ? (R.endT < .4 ? .04 + .06 * R.endT / .4 : .1 - .06 * Math.min(1, (R.endT - .4) / 2)) : .05 + .02 * Math.sin(time * 18);
        setCupLevel(cup, h, foamH); updateCupFizz(cup, dt);
        const surfY = PAD_Y + (h + foamH) * sc; let top = NOZZLE_Y, bot = surfY, on = false;
        if (!R.flying) {
            if (!R.full) { if (R.t > 0) { on = true; bot = NOZZLE_Y + (surfY - NOZZLE_Y) * Math.min(1, R.t / .16); if ((R.sp -= dt) <= 0) { R.sp = .05; splash(R.x, surfY, R.z, SODA_COL, 1, 1.5, .5); } } }
            else if (R.endT < .2) { on = true; top = NOZZLE_Y + (surfY - NOZZLE_Y) * (R.endT / .2); }
            cup.position.x = R.x + (!R.full && R.t > 0 ? Math.sin(time * 55) * .006 : 0);
        }
        setStream(on, top, bot, time);
        const [x, y] = screenPos(new THREE.Vector3(R.x, 6.9, R.z)); R.tag.style.left = x + 'px'; R.tag.style.top = y + 'px';
        R.tag.textContent = R.full ? `✅ ${R.size}ml pronto!` : `🥤 Enchendo... ${Math.min(99, Math.round(Math.max(0, R.t) / fillTime * 100))}%`;
        R.tag.style.color = R.full ? '#34d399' : '#38bdf8'; soda.userData.led.material.color.set(R.full ? '#34d399' : '#fbbf24');
    } else { setStream(false); soda.userData.led.material.color.set('#7dd3fc'); }
    if (sides.Bebida) updateCupFizz(sides.Bebida.mesh, dt);
    steam.forEach(s => { const d = s.userData; d.t = (d.t + dt * .35) % 1; s.position.set(d.x + Math.sin(time * 2 + d.z) * .2, 4 + d.t * 3, d.z); s.scale.setScalar(.6 + d.t * 1.4); s.material.opacity = .3 * (1 - d.t) * Math.min(1, d.t * 10); });
    customers.forEach(c => { if (!c.bub || c.state === 'leaving') return; const [x, y] = screenPos(new THREE.Vector3(c.g.position.x, c.g.position.y + 5.9 * c.g.scale.y, c.g.position.z)); placeBubble(c.bub, c, x, y); });
    signGlow.material.opacity = .5 + Math.sin(time * 2.2) * .06 + (Math.sin(time * 37) > .985 ? -.25 : 0);
    Tut.update();
        renderer.render(scene, camera);
}
// --- 9. TUTORIAL PRÁTICO (guiado, no primeiro jogo) ---
// O tutorial NÃO trava o jogo: a cada frame ele olha o estado real (bandeja, chapa, copo...)
// e mostra o primeiro passo ainda incompleto. Por isso se o jogador errar, ele se reorienta sozinho.
window.playTutorial = () => {
    if (started) return; $('modal-tut').classList.add('hidden'); SFX.init();
    const ss = $('start-screen'); ss.classList.add('leaving'); document.body.classList.remove('menu'); setTimeout(() => ss.classList.add('hidden'), 450);
    Tut.start();
};
const Tut = (() => {
    const T = { on: false, flags: {}, delivered: false, cust: null, key: '' };
    const el = { coach: $('tut-coach'), ring: $('tut-ring'), step: $('tc-step'), title: $('tc-title'), text: $('tc-text'), next: $('tc-next') };
    const REQ = recipes[0].required, DRINK = 300;
    const potPos = n => { const g = potGroups.find(p => p.children.some(c => c.userData.ingredient === n)); return g && new THREE.Vector3(g.position.x, 5, g.position.z); };
    const custPos = () => T.cust && new THREE.Vector3(T.cust.g.position.x, 5.5, T.cust.g.position.z);
    const domPos = sel => { const e = [...document.querySelectorAll(sel)].find(n => n.getBoundingClientRect().width > 0); if (!e) return null; const r = e.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };
    const meat = () => SLOTS.find(s => s.mesh && s.kind === 'Carne');
    const info = (id, title, text, btn, extra) => Object.assign({ id, info: true, title, text, btn, done: () => !!T.flags[id] }, extra);
    const act = (id, title, text, target, cond) => ({ id, title, text, target, done: () => T.delivered || cond() });

    const S = [
        info('welcome', 'Bem-vindo ao Burguer Now! 🍔', 'Vou te ensinar <b>na prática</b>, preparando o seu primeiro pedido. Em cada passo eu mostro onde clicar 👇', 'Vamos lá!'),
        info('order', 'Chegou um cliente!', 'O <b>balão</b> mostra o pedido: o lanche, o ponto da carne 🔥, a bebida 🥤 e o preço 💰. A barrinha verde é a <b>paciência</b> dele (aqui ela fica parada; no jogo de verdade ela vai baixando!).', 'Entendi',
            { target: custPos, ready: () => T.cust && T.cust.state === 'waiting', wait: 'O cliente está entrando na loja… 🚶' }),
        info('hud', 'Seu painel', '<b>💰 Caixa</b>, <b>❤️ erros</b> (com 5 erros a loja fecha), <b>⭐ nível</b> e a <b>💡 Dica de Montagem</b> com a ordem exata dos ingredientes. Se o painel estiver pequeno, o botão 📋 expande.', 'Certo', { target: () => domPos('.hud-glass') }),
        act('bun1', '1 · Pão de baixo', 'Os ingredientes vão na bandeja <b>na ordem do pedido</b>. Comece clicando no pote de <b>🍞 Pão</b>.', () => potPos('Pão'), () => currentTray.length >= 1),
        act('grill-put', '2 · Carne na chapa', 'Agora a carne: clique na <b>🔥 Chapa</b> para colocar um hambúrguer cru. Ele começa a cozinhar na hora.', () => new THREE.Vector3(-8, 4.5, 5.5), () => currentTray.includes('Carne') || !!meat()),
        act('grill-take', '3 · Ponto da carne', () => {
            const s = meat(), st = s ? stageOf(s.t) : 0;
            return st === 0 ? 'Veja a etiqueta sobre a chapa: <b>Crua → Ao ponto → Bem passada → Queimada</b>. O cliente pediu <b>Ao ponto</b>. ⏳ Aguarde (uns 5 segundos)…'
                : st === 1 ? '✅ <b>Ao ponto!</b> Clique de novo na chapa para pegar a carne e levar à bandeja.'
                : '😅 Passou do ponto! Pegue a carne e use o botão 🗑️ para refazer (tem que estar <b>Ao ponto</b>).';
        }, () => new THREE.Vector3(-8, 4.5, 5.5), () => currentTray.includes('Carne')),
        act('cheese', '4 · Queijo', 'Com a carne na bandeja, clique no pote de <b>🧀 Queijo</b>.', () => potPos('Queijo'), () => currentTray.length >= 3),
        act('bun2', '5 · Pão de cima', 'Feche o lanche clicando no <b>🍞 Pão</b> outra vez.', () => potPos('Pão'), () => currentTray.length >= 4),
        act('cup', '6 · Bebida', `O pedido também leva <b>🥤 ${DRINK}ml</b>. Clique no copo <b>${DRINK}</b> (o menor): ele vai sozinho para a máquina e começa a encher.`, () => potPos('Copo' + DRINK), () => !!(REFILL.cup || sides.Bebida)),
        act('soda', '7 · Retirar a bebida', () => REFILL.cup && REFILL.full ? '✅ Copo cheio! Clique na <b>máquina</b> para retirar a bebida.' : '🥤 Enchendo… aguarde o copo ficar pronto.', () => new THREE.Vector3(SODA_X, 5, SODA_Z), () => !!sides.Bebida),
        act('deliver', '8 · Entregar!', 'Prato completo! Confira com o balão e <b>clique no cliente</b> para entregar. 🍔🍟', custPos, () => served >= 1),
        info('win', 'Pedido entregue! 🎉', 'Acertou = <b>dinheiro + gorjeta + XP</b>. Quanto mais rápido, maior a gorjeta, e acertos seguidos dão bônus 🔥.', 'Continuar', { after: true }),
        info('rules', 'Regras da loja', '• Cliente impaciente <b>vai embora</b> e conta como erro ❌<br>• Montou errado? Use <b>🗑️</b> para recomeçar o prato<br>• Cada noite vai das 18:00 às 00:00; suba de nível para liberar <b>bacon 🥓, batata 🍟</b> e mais<br>• <b>P</b> pausa e ❓ mostra as dicas de novo', 'Abrir a loja! 🍔', { after: true })
    ];
    const badMsg = () => {
        if (currentTray.length > REQ.length || REQ.slice(0, currentTray.length).some((v, i) => v !== currentTray[i])) return 'Ingrediente fora de ordem! Confira a sequência no balão ou na 💡 Dica. Clique em <b>🗑️</b> para limpar o prato e recomeçar.';
        if (trayMeat.some(s => s !== 1)) return 'A carne não está <b>Ao ponto</b>. Clique em <b>🗑️</b> para limpar o prato e refazer.';
        if (sides.Bebida && sides.Bebida.size !== DRINK) return `Esse copo não é de ${DRINK}ml. Clique em <b>🗑️</b> para limpar e refazer.`;
        return null;
    };
    function finish() {
        if (!T.on) return; T.on = false; el.coach.classList.add('hidden'); el.ring.classList.add('hidden'); document.body.classList.remove('tutorial');
        try { localStorage.setItem('bn_tut', '1'); } catch (e) {}
        money = 0; xp = 0; served = 0; streak = 0; Object.assign(ST, { served: 0, bacon: 0, perfect: 0, streak: 0, bestDay: 0 });
        startDay(); toast('🍔 A loja abriu! Boa sorte, chef!');
    }
    el.next.onclick = () => { const s = S.find(x => !x.done()); if (!s || !s.info) return; T.flags[s.id] = 1; SFX.play('pop'); if (S.every(x => x.done())) finish(); };
    $('tc-skip').onclick = finish;
    return {
        get on() { return T.on; },
        start() {
            started = true; resetGame(); refreshPots(); updateHUD(); gameOver = false; Object.assign(T, { on: true, flags: {}, delivered: false, key: '' });
            document.body.classList.add('tutorial'); el.coach.classList.remove('hidden');
            T.cust = createCustomer3D('normal', SLOT_X[1]); T.cust.slot = 1; SFX.play('door');
        },
        update() {
            if (!T.on) return;
            if (!T.delivered && served >= 1) { T.delivered = true; ['welcome', 'order', 'hud'].forEach(k => T.flags[k] = 1); }
            const i = S.findIndex(s => !s.done()); if (i < 0) return finish();
            const s = S[i], bad = T.delivered ? null : badMsg(), waiting = s.ready && !s.ready();
            const txt = bad || (waiting ? s.wait : typeof s.text === 'function' ? s.text() : s.text), btn = !bad && s.info && !waiting;
            const key = [i, txt, btn, !!bad].join('|');
            if (key !== T.key) {
                T.key = key; el.coach.classList.toggle('warn', !!bad); el.step.textContent = `Passo ${i + 1} de ${S.length}`;
                el.title.innerHTML = bad ? '⚠️ Opa!' : s.title; el.text.innerHTML = txt; el.next.classList.toggle('hidden', !btn); el.next.textContent = s.btn || '';
            }
            const tg = bad ? domPos('#btn-trash, #btn-trash-fab') : s.target && s.target(), p = tg && (Array.isArray(tg) ? tg : screenPos(tg));
            el.ring.classList.toggle('hidden', !p); if (p) { el.ring.style.left = p[0] + 'px'; el.ring.style.top = p[1] + 'px'; }
        }
    };
})();

window.addEventListener('resize', fitCamera);
window.addEventListener('orientationchange', () => setTimeout(fitCamera, 250));

animate();
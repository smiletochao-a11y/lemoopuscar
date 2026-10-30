// Engine: one perspective camera around a spherical Earth, imagery plates sampled
// by lon/lat in a WebGL2 shader, and the same camera math in JS for the 2D annotation layer.
// One world -> screen function (project) serves every annotation, so lines stay glued to the ground.

export const R = 6371.0088;          // Earth radius, km
const D2R = Math.PI / 180;

// ------------------------------------------------------------------ vectors (double precision, JS)
const v = (x, y, z) => [x, y, z];
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = a => mul(a, 1 / Math.hypot(a[0], a[1], a[2]));

export function ecef(lat, lon, h = 0) {
  const p = lat * D2R, l = lon * D2R, r = R + h;
  return v(r * Math.cos(p) * Math.cos(l), r * Math.cos(p) * Math.sin(l), r * Math.sin(p));
}
function enu(lat, lon) {
  const p = lat * D2R, l = lon * D2R;
  const up = v(Math.cos(p) * Math.cos(l), Math.cos(p) * Math.sin(l), Math.sin(p));
  const east = v(-Math.sin(l), Math.cos(l), 0);
  const north = cross(up, east);
  return { up, east, north };
}

// camera: look at ground point (lat, lon) from distance d (km), tilt (deg from straight down),
// heading (deg, direction the camera faces, clockwise from north), roll (deg), vertical fov (deg),
// and a lens shift so the target can sit off-centre: (sx, sy) in pixels from the frame centre.
export function makeCamera({ lat, lon, d, tilt = 0, heading = 0, roll = 0, fov = 30, sx = 0, sy = 0 }, W = 1920, H = 1080) {
  const T = ecef(lat, lon, 0);
  const { up, east, north } = enu(lat, lon);
  const hd = heading * D2R, tl = tilt * D2R;
  const Hdir = add(mul(north, Math.cos(hd)), mul(east, Math.sin(hd)));
  const C = add(T, mul(add(mul(up, Math.cos(tl)), mul(Hdir, -Math.sin(tl))), d));
  const f = norm(sub(T, C));
  let u = norm(sub(add(mul(Hdir, Math.cos(tl)), mul(up, Math.sin(tl))), mul(f, 0)));   // screen-up before roll
  u = norm(sub(u, mul(f, dot(u, f))));
  let r = norm(cross(f, u));
  if (roll) { const rr = roll * D2R; const r2 = add(mul(r, Math.cos(rr)), mul(u, Math.sin(rr))); u = norm(cross(r2, f)); r = r2; }
  const F = (H / 2) / Math.tan(fov * D2R / 2);
  const Cc = mul(C, -1);                        // camera -> Earth centre
  const h = Math.hypot(C[0], C[1], C[2]) - R;   // altitude above the sphere
  return { C, f, u, r, F, W, H, sx, sy, Cc, c2: h * (2 * R + h), alt: h, tgt: { lat, lon } };
}

// world -> screen. Returns [x, y, visible] (visible = in front and on the camera's side of the globe)
export function project(cam, lat, lon, hgt = 0) {
  const P = ecef(lat, lon, hgt);
  const q = sub(P, cam.C);
  const z = dot(q, cam.f);
  const x = cam.W / 2 + cam.sx + cam.F * dot(q, cam.r) / z;
  const y = cam.H / 2 + cam.sy - cam.F * dot(q, cam.u) / z;
  const facing = dot(P, mul(q, -1)) > 0;      // surface normal points towards the camera
  return [x, y, z > 0 && facing];
}
// screen -> ground (lat, lon) or null
export function unproject(cam, x, y) {
  const nx = (x - cam.W / 2 - cam.sx) / cam.F, ny = -(y - cam.H / 2 - cam.sy) / cam.F;
  const d = norm(add(cam.f, add(mul(cam.r, nx), mul(cam.u, ny))));
  const b = dot(d, cam.Cc), disc = b * b - cam.c2;
  if (disc < 0) return null;
  const t = b - Math.sqrt(disc);
  const Q = sub(mul(d, t), cam.Cc);
  return [Math.asin(Q[2] / R) / D2R, Math.atan2(Q[1], Q[0]) / D2R];
}
// km per pixel at the target (for scale bars)
export function kmPerPx(cam) { return (cam.alt / Math.max(1e-6, Math.cos(0))) / cam.F; }

// ------------------------------------------------------------------ WebGL
// Plates, coarse to fine: 0 world, 1 Middle East (Blue Marble), 2 strait (Landsat ~80 m),
// 3 narrows (Landsat ~30 m), 4 tanker detail (Sentinel-2 ~8 m); 5 narrows water mask.
const VS = `#version 300 es
in vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }`;

const FS = `#version 300 es
precision highp float; precision highp sampler2D;
out vec4 o;
uniform vec2 uRes; uniform vec2 uShift; uniform float uF;
uniform vec3 uR, uU, uFw, uCc; uniform float uC2;
uniform sampler2D t0, t1, t2, t3, t4, t5, t6;
uniform vec4 b1, b2, b3, b4, b5;              // plate bboxes (w, s, e, n); 5 = Qatar (Landsat)
uniform float a1, a2, a3, a4, a5;             // plate opacities
uniform float uGrey;                          // 0 true colour .. 1 analyst grey
uniform float uLaneCol;                       // true colour back inside the shipping lanes
uniform vec4 uLane;                           // separation-zone centre line: lon0, lat0, slope (dlat/dlon), half width of the lanes band (deg lat)
uniform vec2 uLaneSpan;                       // lon range of the lanes
uniform float uShade, uExpo, uDetail, uClarity, uDim, uContrast;
uniform vec2 uBlurVec; uniform float uBlur;
uniform float uScan;                          // reveal scan: ground north of this latitude is painted, south is black (90 = all black, -90 = all shown)
uniform float uScanGlow;
uniform vec3 uFocus; uniform float uFocusDim; // dim outside a circle (lon, lat, radius deg)
const float RE = 6371.0088;

float lum(vec3 c){ return dot(c, vec3(.299, .587, .114)); }
vec2 uvOf(vec4 b, vec2 ll){ return vec2((ll.y - b.x) / (b.z - b.x), (b.w - ll.x) / (b.w - b.y)); }
float inside(vec2 uv, float f){ vec2 e = smoothstep(vec2(0.), vec2(f), uv) * smoothstep(vec2(0.), vec2(f), 1. - uv); return e.x * e.y; }
vec4 samp(sampler2D t, vec2 uv){
  vec3 c = texture(t, uv).rgb;
  float l = lum(c);
  float m1 = lum(texture(t, uv, 1.6).rgb), m2 = lum(texture(t, uv, 4.0).rgb), m3 = lum(texture(t, uv, 6.5).rgb);
  float d = l + uDetail * (0.7 * (l - m1) + 0.45 * (m1 - m2));
  d = m3 + (d - m3) * (1. + uClarity);
  return vec4(c, d);
}
vec4 ground(vec2 ll, out float wmask){
  wmask = 0.;
  vec4 col = samp(t0, vec2((ll.y + 180.) / 360., (90. - ll.x) / 180.));
  vec2 u1 = uvOf(b1, ll); float w1 = inside(u1, .03) * a1; if (w1 > 0.) col = mix(col, samp(t1, u1), w1);
  vec2 u2 = uvOf(b2, ll); float w2 = inside(u2, .04) * a2; if (w2 > 0.) col = mix(col, samp(t2, u2), w2);
  vec2 u3 = uvOf(b3, ll); float w3 = inside(u3, .05) * a3; if (w3 > 0.) { col = mix(col, samp(t3, u3), w3); wmask = texture(t5, u3).r * w3; }
  vec2 u5 = uvOf(b5, ll); float w5 = inside(u5, .05) * a5; if (w5 > 0.) col = mix(col, samp(t6, u5), w5);
  vec2 u4 = uvOf(b4, ll); float w4 = inside(u4, .12) * a4; if (w4 > 0.) col = mix(col, samp(t4, u4), w4);
  return col;
}
vec3 grade(vec4 c, vec2 ll, float wmask){
  float d = clamp((c.a - 0.03) / 0.85, 0., 1.);
  d = (1. - exp(-1.9 * d)) / (1. - exp(-1.9));
  d = d * d * (3. - 2. * d) * .30 + d * .70;
  d = pow(d, 1.05);
  d = clamp((d - .5) * uContrast + .5, 0., 1.);
  vec3 grey = mix(vec3(.026, .036, .044), vec3(.63, .655, .665), d);
  grey += (c.rgb - lum(c.rgb)) * 0.2;
  // the lanes: water inside the band around the separation zone keeps its true colour
  float off = (ll.x - (uLane.y + uLane.z * (ll.y - uLane.x))) / uLane.w;
  float band = (1. - smoothstep(.92, 1.0, abs(off))) * smoothstep(.30, .37, abs(off));   // the two lanes, not the separation zone
  band *= smoothstep(uLaneSpan.x, uLaneSpan.x + .04, ll.y) * (1. - smoothstep(uLaneSpan.y - .04, uLaneSpan.y, ll.y));
  float k = uLaneCol * band * smoothstep(.2, .7, wmask);
  vec3 tc = c.rgb * 1.35 + vec3(0., .012, .03);   // the sea's own colour, lifted a little so it reads against the grey
  float g = uGrey * (1. - k);
  return mix(k > 0. ? mix(c.rgb, tc, k) : c.rgb, grey, g);
}
vec3 shade(vec2 frag){
  vec2 n = (frag - uRes * .5 - uShift * vec2(1., -1.)) / uF;
  vec3 dir = normalize(uFw + n.x * uR + n.y * uU);
  float b = dot(dir, uCc);
  float disc = b * b - uC2;
  vec3 space = vec3(.012, .018, .024);
  if (disc < 0.) {
    float dmin = sqrt(max(dot(uCc, uCc) - b * b, 0.));
    float x = (dmin - RE) / 90.;
    return space + exp(-x) * step(0., b) * mix(vec3(.30, .55, .95), vec3(.75, .80, .85), uGrey) * .55 * uShade;
  }
  float t = b - sqrt(disc);
  vec3 Q = t * dir - uCc;
  vec2 ll = vec2(degrees(asin(clamp(Q.z / RE, -1., 1.))), degrees(atan(Q.y, Q.x)));
  float wm;
  vec4 c = ground(ll, wm);
  vec3 col = grade(c, ll, wm);
  float mu = clamp(dot(normalize(Q), -dir), 0., 1.);
  col *= mix(1., mix(.55, 1., pow(mu, .35)), uShade);
  col += uShade * pow(1. - mu, 3.) * mix(vec3(.25, .45, .85), vec3(.6, .65, .7), uGrey) * .55;
  if (uFocusDim > 0.) {
    float r = length(vec2((ll.y - uFocus.x) * cos(radians(ll.x)), ll.x - uFocus.y));
    col *= 1. - uFocusDim * smoothstep(uFocus.z * .6, uFocus.z * 2.4, r);
  }
  // the reveal scan: a soft swath (a satellite pass), not a hairline
  if (uScan > -89.) {
    float fw = max(fwidth(ll.x), 1e-7);
    float s = ll.x - uScan;
    col *= smoothstep(-fw * 40., fw * 40., s);
    col += uScanGlow * vec3(.8, .9, 1.) * .22 * exp(-abs(s) / (fw * 60.));
  }
  return col;
}
void main(){
  vec2 frag = gl_FragCoord.xy;
  vec3 col;
  if (uBlur > .5) {
    col = vec3(0.);
    for (int i = 0; i < 12; i++) { float k = (float(i) / 11. - .5) * uBlur; col += shade(frag + k * uBlurVec * vec2(1., -1.)); }
    col /= 12.;
  } else col = shade(frag);
  col *= uExpo;
  vec2 q = frag / uRes - .5; col *= 1. - .35 * dot(q, q) * 1.2;
  col *= (1. - uDim);
  o = vec4(max(col, 0.), 1.);
}`;

export class Engine {
  constructor(canvas) {
    const gl = canvas.getContext('webgl2', { antialias: false, preserveDrawingBuffer: true, premultipliedAlpha: false });
    if (!gl) throw new Error('WebGL2 not available');
    this.gl = gl;
    this.aniso = gl.getExtension('EXT_texture_filter_anisotropic');
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
    const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    this.p = p; gl.useProgram(p);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(p, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    this.U = {};
    for (let i = 0; i < 7; i++) gl.uniform1i(gl.getUniformLocation(p, 't' + i), i);
    this.tex = {};
  }
  u(name) { return this.U[name] ?? (this.U[name] = this.gl.getUniformLocation(this.p, name)); }
  upload(name, img, { mip = true } = {}) {
    const gl = this.gl, t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mip ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
    if (mip) gl.generateMipmap(gl.TEXTURE_2D);
    if (mip && this.aniso) gl.texParameterf(gl.TEXTURE_2D, this.aniso.TEXTURE_MAX_ANISOTROPY_EXT, 8);
    this.tex[name] = t;
  }
  // S: { cam, a: [a1..a4], bbox: {me, strait, narrows, det}, grey, laneCol, lane, shade, expo, detail, clarity, contrast, blur, blurVec, dim, scan, scanGlow, focus, focusDim }
  draw(S) {
    const gl = this.gl, c = S.cam;
    gl.viewport(0, 0, c.W, c.H);
    gl.uniform2f(this.u('uRes'), c.W, c.H);
    gl.uniform2f(this.u('uShift'), c.sx, c.sy);
    gl.uniform1f(this.u('uF'), c.F);
    gl.uniform3f(this.u('uR'), ...c.r); gl.uniform3f(this.u('uU'), ...c.u); gl.uniform3f(this.u('uFw'), ...c.f);
    gl.uniform3f(this.u('uCc'), ...c.Cc); gl.uniform1f(this.u('uC2'), c.c2);
    ['world', 'me', 'strait', 'narrows', 'det', 'narrows_w', 'qatar'].forEach((n, i) => { gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, this.tex[n]); });
    ['me', 'strait', 'narrows', 'det', 'qatar'].forEach((n, i) => { gl.uniform4f(this.u('b' + (i + 1)), ...S.bbox[n]); gl.uniform1f(this.u('a' + (i + 1)), S.a[i]); });
    gl.uniform1f(this.u('uGrey'), S.grey ?? 1); gl.uniform1f(this.u('uLaneCol'), S.laneCol ?? 0); gl.uniform4f(this.u('uLane'), ...(S.lane || [0, 0, 0, 1])); gl.uniform2f(this.u('uLaneSpan'), ...(S.laneSpan || [0, 0]));
    gl.uniform1f(this.u('uShade'), S.shade ?? 0); gl.uniform1f(this.u('uExpo'), S.expo ?? 1); gl.uniform1f(this.u('uDetail'), S.detail ?? 0.8); gl.uniform1f(this.u('uClarity'), S.clarity ?? 0.4);
    gl.uniform1f(this.u('uContrast'), S.contrast ?? 1);
    gl.uniform1f(this.u('uBlur'), S.blur ?? 0); gl.uniform2f(this.u('uBlurVec'), ...(S.blurVec || [1, 0])); gl.uniform1f(this.u('uDim'), S.dim ?? 0);
    gl.uniform1f(this.u('uScan'), S.scan ?? -90); gl.uniform1f(this.u('uScanGlow'), S.scanGlow ?? 0);
    gl.uniform3f(this.u('uFocus'), ...(S.focus || [0, 0, 1])); gl.uniform1f(this.u('uFocusDim'), S.focusDim ?? 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
}

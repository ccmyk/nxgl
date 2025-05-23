#version 300 es
precision highp float;

uniform vec2 uResolution;
uniform float uTime;
uniform float uStart0;
uniform float uStart1;
uniform float uStart2;
uniform float uStartX;
uniform float uStartY;
uniform float uMultiX;
uniform float uMultiY;

varying vec2 vUv;

// Classic 2D Perlin‐style noise from legacy
vec2 fade(vec2 t) { return t*t*t*(t*(t*6.0-15.0)+10.0); }
vec4 permute(vec4 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
float cnoise(vec2 P) {
  vec4 Pi = floor(P.xyxy) + vec4(0.0,0.0,1.0,1.0);
  vec4 Pf = fract(P.xyxy) - vec4(0.0,0.0,1.0,1.0);
  Pi = mod(Pi, 289.0);
  vec4 ix = Pi.xzxz, iy = Pi.yyww;
  vec4 fx = Pf.xzxz, fy = Pf.yyww;
  vec4 i  = permute(permute(ix) + iy);
  vec4 gx = 2.0 * fract(i * 0.0243902439) - 1.0;
  vec4 gy = abs(gx) - 0.5;
  vec4 tx = floor(gx + 0.5);
  gx = gx - tx;
  vec2 g00 = vec2(gx.x,gy.x), g10 = vec2(gx.y,gy.y);
  vec2 g01 = vec2(gx.z,gy.z), g11 = vec2(gx.w,gy.w);
  vec4 norm = 1.79284291400159 - 0.85373472095314 *
    vec4(dot(g00,g00), dot(g01,g01), dot(g10,g10), dot(g11,g11));
  g00 *= norm.x; g01 *= norm.y; g10 *= norm.z; g11 *= norm.w;
  float n00 = dot(g00, vec2(fx.x, fy.x));
  float n10 = dot(g10, vec2(fx.y, fy.y));
  float n01 = dot(g01, vec2(fx.z, fy.z));
  float n11 = dot(g11, vec2(fx.w, fy.w));
  vec2 fade_xy = fade(Pf.xy);
  vec2 n_x = mix(vec2(n00,n01), vec2(n10,n11), fade_xy.x);
  return 2.3 * mix(n_x.x, n_x.y, fade_xy.y);
}

void main() {
  float prog = 0.4;
  float noise = cnoise(
    vec2(
      vUv.x * uMultiX + uStartX,
      vUv.y * uMultiY + uStartY
    )
  ) * 3.0;

  vec4 col = vec4(0.0);
  // fade in/out exactly as legacy
  col.a = mix(1.0, noise + prog, uStart0) * uStart2;
  gl_FragColor = col;
}
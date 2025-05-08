precision highp float;

varying vec2 vUv;
uniform sampler2D tMap;
uniform float uStart;
uniform float uHover;

void main() {
  // distort U.x by uHover/uStart just like legacy ripple
  float moder = clamp((uStart * 0.5) + uHover, 0.0, 1.0);
  vec2 U = vec2(vUv.x - moder * 0.2, vUv.y);

  float cols = 16.0;
  vec2 P = vec2(cols, cols);
  float cent = (1.0 - U.x) - 0.5;
  cent = abs(cent) * 2.0;
  float idx = floor(cent * P.x) / P.x;

  U.x -= idx;
  U.x += (moder * (idx * 0.2)) + (floor(U.x * cols)/cols + idx * 1.2) * (moder * (idx * 0.1));
  U.x += idx + moder * 0.16;

  vec4 col = texture2D(tMap, U);
  gl_FragColor = col;
}
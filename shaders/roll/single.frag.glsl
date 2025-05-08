precision highp float;

uniform float uChange;
uniform float uStart;
uniform float uEnd;

uniform sampler2D tMap;
uniform sampler2D tMap2;

varying vec2 vUv1;
varying vec2 vUv2;

void main() {
  // mix from tMap → tMap2 at threshold uChange
  vec4 c1 = texture2D(tMap,  vUv1);
  vec4 c2 = texture2D(tMap2, vUv2);
  float m = step(uChange, fract(vUv1.x * 1.0));
  gl_FragColor = mix(c1, c2, m);
}
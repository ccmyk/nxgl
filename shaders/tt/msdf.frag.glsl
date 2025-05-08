#version 300 es
precision highp float;

in vec2 vUv;
in float vId;

uniform sampler2D tMap;
uniform float uTime;
uniform float uStart;
uniform float uPower;
uniform float uKey;
uniform float uWidth[/* your char count*2 */];
uniform float uHeight[/* same length */];
uniform float uPowers[/* your char count */];
uniform vec2 uMouse;

out vec4 outColor;

// Helper from legacy MSDF shader:
float median(float r, float g, float b) {
  return max(min(r, g), min(max(r, g), b));
}

void main() {
  vec3 sample = texture(tMap, vUv).rgb;
  float sd = median(sample.r, sample.g, sample.b) - 0.5;
  float d = fwidth(sd);              // ← yes, this is correct
  float alpha = clamp(sd / d + 0.5, 0.0, 1.0);

  // modulate by uStart and uPower if needed
  alpha *= mix(1.0, uPower, uStart);

  outColor = vec4(vec3(1.0), alpha);
}
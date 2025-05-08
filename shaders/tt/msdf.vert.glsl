#version 300 es
precision highp float;

in vec3 position;
in vec2 uv;
in float id;   // per-character index

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform float uStart;
uniform float uPower;
uniform float uKey;
uniform float uMouse; // only x component used
uniform vec2 uPowers; // per-character deformer array

out vec2 vUv;
out float vId;

void main() {
  vUv = uv;
  vId = id;

  // example of mixing in mouse & key:
  float power = uPower * mix(1.0, uPowers[int(id)], step(uKey, id));

  vec3 pos = position;
  pos.x += power * uMouse * 0.1;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
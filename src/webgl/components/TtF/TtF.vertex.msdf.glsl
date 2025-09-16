#version 300 es
precision highp float;

in vec2 uv;
in vec3 position;
in float id;
in vec3 index;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

out vec2 vUv;
out vec2 vUvR;
out float vId;

void main() {
  vUv = uv;
  vUvR = vec2(gl_VertexID << 1 & 2, gl_VertexID & 2);
  vId = id;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}

#version 300 es
precision highp float;

in vec2 uv;
in vec2 position;

uniform vec2 uResolution;

out vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}

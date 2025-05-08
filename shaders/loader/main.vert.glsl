// src/webgl/components/Loader/shaders/main.vert.glsl

attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0, 1);
}
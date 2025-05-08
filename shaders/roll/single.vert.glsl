precision highp float;

// attributes
attribute vec2 uv;
attribute vec2 position;

// transition uniforms
uniform float uChange;
uniform float uStart;
uniform float uEnd;
uniform vec2  uTextureSize;
uniform vec2  uTextureSize2;
uniform vec2  uCover;

// the two source textures
uniform sampler2D tMap;
uniform sampler2D tMap2;

// varyings to pass UVs
varying vec2 vUv1;
varying vec2 vUv2;

vec2 resizeUvCover(vec2 uv, vec2 size, vec2 resolution) {
  vec2 ratio = vec2(
    min((resolution.x/resolution.y)/(size.x/size.y), 1.0),
    min((resolution.y/resolution.x)/(size.y/size.x), 1.0)
  );
  return vec2(
    uv.x * ratio.x + (1.0 - ratio.x)*0.5,
    uv.y * ratio.y + (1.0 - ratio.y)*0.5
  );
}

void main() {
  // compute cover UVs for both textures
  vUv1 = resizeUvCover(uv, uTextureSize,  uCover);
  vUv2 = resizeUvCover(uv, uTextureSize2, uCover);

  gl_Position = vec4(position, 0.0, 1.0);
}
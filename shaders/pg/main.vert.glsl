
attribute vec3 uv;
attribute vec3 position;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat3 normalMatrix;


uniform vec2 uCover;
uniform float uZoom;
uniform float uMove;


varying vec3 vUv;

void main() {


    vUv = uv.xyz;

    vec3 pos = position;
    // pos.x *= 1.5;
    // pos.y *= 1.5;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
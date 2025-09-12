#version 300 es
precision highp float;

out vec4 FragColor;

uniform sampler2D tMap;
uniform float uTime;
uniform float uStart;
uniform float uOut;
uniform float uMouseT;
uniform float uMouse;

in vec2 vUv;

float ripple(float uv, float time, float prog) {
    float distance = length(((uv) + (time * 2.0)));
    return tan(distance * (1.0)) * (prog * -1.85);
}

float rippleout(float uv, float time, float prog, float multi) {
    float distance = length((uv * 3.0) + (time * 1.4));
    return tan(distance * (1.0)) * (multi * prog);
}

void main() {
    float timer = uOut; // Used for the exit animation
    float centeredY = (vUv.y - 0.5) * 2.0;

    // Calculate distortion effects based on uniforms animated by GSAP
    float rippleOutEffect = rippleout(vUv.y, timer, 1.0 - abs(timer), -0.36) * (0.1 * (1.0 - abs(timer)));
    float scrollRipple = ripple(vUv.y, uStart, uTime) * (0.001 * uTime);
    float mouseRipple = ripple(vUv.y, uMouse, uMouseT) * (0.0006 * uMouseT);

    // Combine the ripples to distort the Y coordinate of the texture lookup
    vec2 distortedUV = vec2(vUv.x, vUv.y + scrollRipple + mouseRipple + rippleOutEffect);
    distortedUV.y += uStart * 0.1002;

    // Sample the rendered text texture using the distorted UVs
    // Applying slight chromatic aberration by sampling channels with slightly different UVs
    float r = texture(tMap, vec2(distortedUV.x, distortedUV.y)).r;
    float g = texture(tMap, vec2(distortedUV.x, distortedUV.y)).g;
    float b = texture(tMap, vec2(distortedUV.x, distortedUV.y)).b;
    float a = texture(tMap, vec2(distortedUV.x, distortedUV.y)).a;

    // The final color is the distorted texture sample
    FragColor = vec4(r, g, b, a);
    
    // Fade out alpha based on ripple intensity
    FragColor.a -= abs(scrollRipple) * 0.5;
    FragColor.a -= abs(mouseRipple) * 0.5;
    
    // Cut off the effect at the edges during the exit animation
    if (rippleOutEffect * -32.0 > centeredY + timer) {
        FragColor = vec4(0.0, 0.0, 0.0, 0.0);
    }
}
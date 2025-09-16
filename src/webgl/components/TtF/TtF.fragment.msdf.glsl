#version 300 es
precision highp float;

out vec4 FragColor;

uniform sampler2D tMap;
uniform float uColor;

in vec2 vUv;

void main() {
    vec3 tex = texture(tMap, vUv).rgb;

    float signedDist = max(min(tex.r, tex.g), min(max(tex.r, tex.g), tex.b)) - 0.5;
    float d = fwidth(signedDist);
    float alpha = smoothstep(-d, d, signedDist);

    vec3 finalColor = vec3(uColor);

    FragColor = vec4(finalColor, alpha);
}


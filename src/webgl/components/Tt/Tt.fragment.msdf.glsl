#version 300 es
precision highp float;
out vec4 FragColor;

#define numTextures PITO
uniform sampler2D tMap;
uniform float uTime;
uniform vec2 uMouse;
uniform float uPower;
uniform float uCols;
uniform float uColor;
uniform float uStart;
uniform float uKey;
uniform float uPowers[numTextures];

in vec2 vUv;
in vec2 vUvR;
in float vId;

float ripple(float uv, float time, float prog) {
    float distance = length((uv) + time);
    return tan(distance * (prog)) * (-0.01);
}

void main() {
    float time2 = (sin(uTime * 0.001));
    float rippleUV = 0.0;
    vec3 tex = vec3(0.0);
    int index = int(vId);

    if (uKey == -2.0) {
        float mPos = (uStart - 1.0) * 1.0;
        float mPower = 1.0 - uStart;
        float startshit = (((vUvR.y - 1.0) * 7.0 * 0.001)) * uStart;
        float sumac = (ripple(vUvR.y, mPos, uCols) * ((0.4) * (1.0 - mPower + (1.0 * uPower))));
        rippleUV = (vUv.x + (startshit)) + sumac;
        tex = texture(tMap, vec2(rippleUV, vUv.y)).rgb;

    } else {
        float mPos = uPowers[index] * -2.0;
        float mPower = abs(uPowers[index] * (2.0 - abs(time2 * 0.5)));
        float sumac = (ripple(vUv.y, mPos, uCols) * ((0.2 * (1.0 - mPower)) * (1.0 - mPower)));
        rippleUV = (vUv.x) + sumac;
        tex = texture(tMap, vec2(rippleUV, vUv.y)).rgb;
    }

    float signedDist = max(min(tex.r, tex.g), min(max(tex.r, tex.g), tex.b)) - 0.5;
    float d = fwidth(signedDist);
    float alpha = smoothstep(-d, d, signedDist);

    vec3 finalColor = vec3(uColor); // If uColor is 1.0, it's white. If 0.0, it's black.

    float finalAlpha = alpha * (1.0 - uStart * 1.9);

    if (uKey == -2.0) {
        finalAlpha -= abs(ripple(vUvR.y, (uStart - 1.0), uCols) * 8.0);
    } else {
        finalAlpha -= abs(ripple(vUv.y, uPowers[index] * -2.0, uCols) * 8.0);
    }

    FragColor = vec4(finalColor, finalAlpha);
}
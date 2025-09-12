#version 300 es
precision highp float;

out vec4 FragColor;

uniform vec2 uCover;
uniform vec2 uTextureSize;
uniform sampler2D tMap;
uniform float uStart;
uniform vec2 uMouse;

in vec2 vUv;

// This function calculates the correct UVs to make a texture cover a plane,
// similar to CSS `background-size: cover`.
// It's a simplified version of the logic from the original vertex shader,
// now handled entirely in the fragment shader for clarity.
vec2 coverUvs(vec2 uv, vec2 textureSize, vec2 canvasSize) {
    float canvasRatio = canvasSize.x / canvasSize.y;
    float textureRatio = textureSize.x / textureSize.y;
    
    vec2 scale = vec2(1.0);
    vec2 offset = vec2(0.0);

    if (canvasRatio > textureRatio) {
        scale.y = (textureRatio / canvasRatio);
        offset.y = (1.0 - scale.y) * 0.5;
    } else {
        scale.x = (canvasRatio / textureRatio);
        offset.x = (1.0 - scale.x) * 0.5;
    }

    return uv * scale + offset;
}

void main() {
    vec2 mouse = uMouse;
    
    // The "reveal" animation is driven by the uStart uniform, which is controlled by scroll.
    // It creates an offset that slides the texture into view.
    mouse.x += uStart * -0.8;

    // The mouse also affects the perceived size of the texture, creating a stretch effect.
    vec2 effectiveTextureSize = uTextureSize;
    effectiveTextureSize.x *= 1.0 + abs(mouse.x);
    
    // Calculate the base UVs, adjusted for `background-size: cover`
    vec2 uv = coverUvs(vUv, effectiveTextureSize, uCover);

    // Apply the main distortion based on mouse position.
    // This creates the horizontal "smear" or "pull" effect.
    float cols = 8.0;
    float cent = (1.0 - vUv.x);
    cent += -0.5 + (mouse.x * 0.4);
    cent *= 2.0;
    cent = abs(cent);

    float gridSlice = floor(cent * cols) / cols;
    
    vec2 finalUv = uv;
    finalUv.x -= gridSlice;
    finalUv.x += (mouse.x * (gridSlice * 0.2));
    finalUv.x += (abs(vUv.x + mouse.x - 0.5) * 2.0) * (mouse.x * (gridSlice * 0.1));
    finalUv.x += gridSlice;

    // Final color lookup from the texture map
    vec4 color = texture(tMap, finalUv);

    FragColor = color;
}

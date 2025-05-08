#version 300 es
precision highp float;
#define varying in
#define texture2D texture
#define gl_FragColor FragColor
out vec4 FragColor;

uniform sampler2D tMap;

uniform float uColor;
uniform float uStart;



varying vec2 vUv;
varying vec2 vUvR;


void main() {



    
    vec3 tex = vec3(0.);



    tex = texture2D(tMap, vUv ).rgb;

    float signedDist = max(min(tex.r, tex.g), min(max(tex.r, tex.g), tex.b)) - 0.5;
    float d = fwidth(signedDist);
    float alpha = smoothstep(-d, d, signedDist);


    gl_FragColor.rgb = vec3(uColor);
    // gl_FragColor.r += distance(uMouse.x + .5 ,vUvR.y * .5);
    
    gl_FragColor.a = alpha;
    

}
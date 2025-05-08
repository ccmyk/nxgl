precision highp float;


uniform sampler2D tMap;
uniform vec2 uCover;
uniform float uMouse;
uniform vec2 uTextureSize;
uniform float uLoad;
uniform float uZoom;
uniform float uMove;
varying vec3 vUv;


vec2 coverTexture( vec2 imgSize, vec2 ouv, float mouse) {
  vec2 s = uCover;
  vec2 i = imgSize;
  ouv.x-=( (mouse) * 1.);

  
  float rs = s.x / s.y;
  float ri = i.x / i.y;
  vec2 new = rs < ri ? vec2(i.x * s.y / i.y, s.y) : vec2(s.x, i.y * s.x / i.x);
  vec2 offset = (rs < ri ? vec2((new.x - s.x) / 2.0, 0.0) : vec2(0.0, (new.y - s.y) / 2.0)) / new;
  vec2 uv = ouv * s / new + offset;
  
  return uv;
}


void main() {


    if(uLoad != 0.){

    vec2 tsize = uTextureSize;
    float mouse = uMouse ;
    float cols = 4. * uZoom;


    tsize.x *= 1. + abs(mouse); 
    vec2 cover = coverTexture(tsize, vUv.xy,mouse);


    vec2 U = cover,
        P = vec2(cols, cols),
        C = floor(U*P)/P;

    float centpos = vUv.x + (mouse);
    float cent = (1. - vUv.x);
    centpos += -.5 + (mouse * 2.4 );
    centpos *=2.;
    centpos = abs(centpos);

    cent += -.5  + (mouse * .4 );
    cent *=2.;
    cent = abs(cent);
    float otro = floor((cent)*P.x)/P.x;
    U.x -= otro;
    U.x += (mouse * (otro * .2));
    U.x += (centpos*1.2) * (mouse * (otro * .1));

    U.x += otro;
    U.x += uMouse * .2;


      gl_FragColor = texture2D(tMap,U);

      gl_FragColor.a = uLoad;

    }
    else{
    gl_FragColor = vec4(1.,0.,0.,0.);

    }
    // gl_FragColor = vec4(vUv.x,1. - vUv.x,vUv.x * .5,1.0);

}
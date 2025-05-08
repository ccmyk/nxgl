precision highp float;

// Default uniform for previous pass is 'tMap'.
// Can change this using the 'textureUniform' property
// when adding a pass.
uniform sampler2D tMap;

uniform float uTime;
uniform float uStart;
uniform float uMouseT;
uniform float uMouse;

varying vec2 vUv;

float ripple(float uv, float time, float prog, float multi) {
      float distance = length((uv * 3. ) + (time * 1.4)  );
      return tan(distance * (1.) ) * (multi * prog );

      
    }


  void main() {
    float timer = uStart;
    float centeredx = (vUv.x - .5) * 2.;
    float centeredy = (vUv.y - .5) * 2.;
    // float timertan = tan(.0002 * uTime  * -1.65);
  // float rippleUV = ripple(vUv.y,uStart , uTime) * (.001 * uTime);
  // float rippleUV = ripple(vUv.y,.5 , .5) * (.005 * 1.);
        
        // EL TIME
        // POSITIVO ABAJO
        // NEGATIVO ARRIBA 
          float rippleUV = (ripple(vUv.y  ,timer, 1. - abs(timer),-.36) * ( (.1 * (1. - abs(timer) ) ) ) );
          // float rippleUVy = (ripple(vUv.y  ,uMouse, 1. - abs(uMouse),-.03) * ( (.02 * (1. - abs(uMouse) ) ) ) );
          
          // rippleUVy *= .1;
  // rippleUV = min(1.,)
  vec2 U = vec2(vUv.x,rippleUV + vUv.y);
  // vec2 U = vec2(vUv.x  ,rippleUV + rippleUVy + vUv.y);


  float distor = 1.;
  // distor -= (.002 * uStart);

  // U.y += uStart * .1002;

  vec4 im = texture2D(tMap, U);


  if(rippleUV  * -100. > centeredy + timer){

    gl_FragColor = vec4(0. ,0. ,0. ,0.);
  }
  else{

    gl_FragColor = vec4(im);
  }

  
  // gl_FragColor.a -= abs(rippleUVy  ) *  (8. );

  // rippleUVa = tan(.0002 * uTime) * vUv.y;
  // gl_FragColor.a -= rippleUVa;
  // gl_FragColor = vec4(rippleUVa,0.,0.,1.);
  // gl_FragColor.a *= (abs(rippleUV - 1.  ) * .2);


  // gl_FragColor = vec4(alphacalc * 4.,0.,0.,1.);

  // gl_FragColor = vec4((abs(rippleUVa - vUv.y) - 1.),0.,0.,1.);
  // gl_FragColor = vec4((rippleUVa - 1.), (rippleUV) , 0. ,1.);
}

uniform vec2 u_resolution;
uniform vec2 u_mouse;

#define m1 vec2(u_mouse/u_resolution)
#define m vec2(0,0)
void main() {
  vec3 testred = vec3(1.0,m1.x,0.0);
  vec3 testblue = vec3(0.0,m1.y,1.0);
  vec3 red = vec3(1.0,0,0.0);
  vec3 blue = vec3(0.0,0.5,1.0);
  vec2 uv = gl_FragCoord.xy / u_resolution;
  vec3 col = vec3(0);

  float split = 0.15 * ((166.5/600.)-0.5) ;
  float lwm = 0.25;
  float hwm = lwm+split;
  if( uv.y < 0.25 ) {
    col = red * floor( mod(uv.x*10.,2.) );
  }
  if( uv.y > 0.75 ) {
    col = blue * floor( mod(uv.x*10.,2.) );
  }
  if( uv.y > 0.33 && uv.y < 0.67 ) {
    if( uv.x < (1.-hwm) && uv.x > (lwm) ) {
      col += red;
    }
    if( uv.x < (1.-lwm) && uv.x > (hwm) ) {
      col += blue;
    }
  }
  //-----------------------------------------------------
  // postprocess
  //-----------------------------------------------------

  // gama
  col = pow( col, vec3(0.44,0.44,0.44) );

  // contrast
  // col = mix( col, smoothstep( 0.0, 1.0, col ), 0.5 );

  // saturate
  // col = mix( col, vec3(dot(col,vec3(0.333))), -0.2 );

  // vigneting
  // col *= 0.2 + 0.8*pow(16.0*q.x*q.y*(1.0-q.x)*(1.0-q.y),0.2);

  gl_FragColor = vec4(col,1);
  // if( gl_FragCoord.y < 10. ) { gl_FragColor=vec4(pal(gl_FragCoord.x/u_resolution.x),1.); }
}
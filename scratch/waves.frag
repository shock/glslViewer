uniform vec2 u_resolution;
uniform float u_time;

#define ut u_time
#define l(x) length(x)
#define kPI 3.14159265
#define k2PI 2.*kPI
#define f(x) fract(x)
#define r(x) f(sin(x)*100000.0)

vec3 pal(float t) {
  // return vec3(t);
  vec3 a=vec3(0.5,0.5,0.5),
  b=vec3(0.5),
  c=vec3(1),d=vec3(0,0.33,0.67);
	return a+b*cos(6.2318*(c*t+d));
}

float random (vec2 st) {
  return f(sin(dot(st.xy, vec2(12.9898,78.233)))* 43758.5453123);
}

vec3 ef1( vec2 fc ) {
  vec2 uv=fc/u_resolution;
  vec2 ruv = uv * sin(ut*0.5)*0.5+0.5+0.01;
  // ruv = step(ruv, vec2(0.5));
  vec3 c = pal(random(ruv));
  return c;
}

float cmpd( float t, float o ) {
  t = 1.0 - 8.0 * abs( fract( t - o ) - 0.25 );
  // t = pow(t,2);
  // t = 2. * max( -0.0, t - 0.5 );
  return smoothstep(0., 1., t);
}

vec4 quadFade( mat4 sig1234, float t ) {
  float t1, t2, t3, t4;
  t1 = cmpd(t,0.);
  t2 = cmpd(t,0.25);
  t3 = cmpd(t,0.5);
  t4 = cmpd(t,0.75);
  return t1*sig1234[0] + t2*sig1234[1] + t3*sig1234[2] + t4*sig1234[3];
}

vec4 stage( mat4 in1234, float t ) {
  return quadFade( in1234, t );
}

vec3 gPC( vec2 fc ) {
  vec2 uv=fc/u_resolution;
  mat4 efs = mat4(0);
  efs[0].xyz = ef1(fc);
  efs[1].xyz = pal(uv.x*uv.y);
  efs[2].xyz = pal(uv.x-uv.y);
  efs[3].xyz = pal(uv.x+uv.y);
  return stage( efs, f(ut*0.125) ).xyz;
}

void main() {
  gl_FragColor=vec4(gPC(gl_FragCoord.xy),1.);
  if( gl_FragCoord.y < 10. ) {
    gl_FragColor=vec4(pal(gl_FragCoord.x/u_resolution.x),1.);
  }
}
uniform vec2 u_resolution;
uniform float u_time;

#define ut u_time
#define kPI 3.14159265
#define k2PI 2.*kPI
#define f(x) fract(x)
#define l(x) length(x)
#define c(x,y,z) clamp(x,y,z)
#define p(x,y) pow(x,y)
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

#define kTrans 0.001 // smaller is faster transition
#define c4(t) p(c(1.-8.*abs(f(t)-0.875),0.,1.),kTrans)

vec4 quadFade( mat4 s, float t ) {
  float t1, t2, t3, t4;
  t1 = c4(t); t2 = c4(t-0.25); t3 = c4(t-0.5); t4 = c4(t-0.75);
  return t1*s[0] + t2*s[1] + t3*s[2] + t4*s[3];
}

vec4 stage( mat4 s, float t ) {
  return quadFade( s, t );
}

#define s1 0.5
#define s2 1.
#define s3 1.
#define s4 1.
#define nSteps 4.
#define kPeriod s1+s2+s3+s4
#define ts(c,ss,s,u,r,t) if( u < ss+c ) { t = (u-c)/ss; r = t/nSteps + (s-1.)/nSteps; u = kPeriod; }; c+=ss;s+=1.;

vec2 seq( float u ) {
  float c = 0., s=0., r=0., t=0.;
  u = mod(u, kPeriod);
  ts(c,s1,s,u,r,t);
  ts(c,s2,s,u,r,t);
  ts(c,s3,s,u,r,t);
  ts(c,s4,s,u,r,t);
  return vec2(t,r);
}

vec3 gPC( vec2 fc ) {
  vec2 uv=fc/u_resolution;
  mat4 efs = mat4(0);
  efs[0].xyz = ef1(fc);
  efs[1].xyz = pal(uv.x*uv.y);
  efs[2].xyz = pal(uv.x-uv.y);
  efs[3].xyz = pal(uv.x+uv.y);
  return stage( efs, seq(ut).y ).xyz;
}

void main() {
  gl_FragColor=vec4(gPC(gl_FragCoord.xy),1.);
  if( gl_FragCoord.y < 10. ) {
    gl_FragColor=vec4(pal(gl_FragCoord.x/u_resolution.x),1.);
  }
}
uniform vec2 u_resolution;
uniform vec2 u_mouse;// Mouse screen pos
uniform float u_time;// Mouse screen pos

#define PI 3.14159

vec2 mouse = u_mouse / u_resolution;
float time = u_time * 0.2;
vec2 mCycle1 = vec2( cos( time * PI * 0.5 ), sin( time * PI * 0.5 ) );
vec2 mCycle2 = vec2( cos( time * PI ), sin( time * PI ) );

float planeDistance( in vec3 ro, in vec3 rd, in vec4 p )
{
  float rdDot = dot(rd,p.xyz);
  return -(dot(ro,p.xyz)+p.w)/rdDot;
}

vec4 planeIntersect( vec3 ro, vec3 rd, vec4 p ) {
  float d = planeDistance( ro, rd, p );
  vec4 i = vec4(ro + rd * d, 1.0);
  // i.w = d;
  return i;
}

vec4 plane = vec4( normalize(vec3(0, 0, 1.0)), 0.0 );

void changeVel( in vec3 pos, inout vec3 vel ) {
  // return;
  vec3 h = vec3( -0, 0, 1 ) - pos;
  h.xy += mCycle2;
  vec3 acc = sin(normalize(h)*PI * 0.1) * 0.1 / dot( h, h ) ;

  h = vec3( 0, 0, 2.415) - pos;
  // h = vec3( 0, 0, 2.355) - pos;
  h.z += 0.61 * mCycle1.x;
  h.xy += (sin(u_time * 5.1) * 0.001 + 0.01) * mCycle2;
  // h.z *= mouse.x;
  acc += sin(normalize(h) * 0.35) / dot( h, h ) ;
  vel += acc;
}

vec4 iterateToPlane( vec3 ro, inout vec3 vel ) {
  vec3 pos = ro;
  float d = 0.;
  float steps = 0.;
  vec3 lastVel = vel;

  for( int i = 0; i < 3; i++ ) {
    d = planeDistance( pos, vel, plane );
    steps += 1.0;
    lastVel = vel;
    changeVel( pos, vel );
    pos = pos + vel;
  }

  vec4 pi = planeIntersect( pos, vel, plane );
  return pi;
}

vec3 pal( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d ) {
    return a + b*cos( 6.28318*(c*t+d) );
}

vec3 colpal2( in float t ) {
  t = fract(t + sin(u_time * 0.098));
  return pal( t, vec3(0.5,0.0,0.5),vec3(0.5,0.5,0.5),vec3(2.0,1.0,1.0),vec3(0.0,0.33,0.67) );
}

float checkers(vec2 uv)
{
    vec2 w = fwidth(uv) + 0.001;
    vec2 i = 2.0*(abs(fract((uv-0.5*w)*0.5)-0.5)-abs(fract((uv+0.5*w)*0.5)-0.5))/w;
    return 0.5 - 0.5*i.x*i.y;
}

vec2 p( in vec2 x )
{
    vec2 h = fract(x/2.0)-0.5;
    return x*0.5 + h*(1.0-2.0*abs(h));
}

float checkers2(vec2 uv)
{
    vec2 w = fwidth(uv) + 0.001;
    vec2 i = (p(uv+w)-2.0*p(uv)+p(uv-w))/(w*w); // analytical integral (triangle filter)
    return 0.5 - 0.5*i.x*i.y;                   // xor pattern
}

float grid( vec2 uv ) {
  vec2 w = fwidth(uv) + 0.1;
  vec2 i = 2.0 * ( length( fract((uv-0.5)*0.5) - 0.5 ) - length(fract((uv+0.5)*0.5)-0.5) ) / w;
  float r = length((fract(i*0.5) - 0.5)*2.9);
  r = length(i);
  r = 1. - r;
  r = clamp(r, 0., 1.);
  r = mix( r, 0.28, min(length(fwidth(uv)),0.9));
  // r = r * smoothstep(1.0,0.5,fwidth(r));
  // if( r >= 1. ) r -= (r - 1.) * 0.2;
  return r;
}

float tiles( vec2 uv ) {
  vec2 w = fwidth(uv) + 0.1;
  vec2 i = 2.0 * ( length( fract((uv-0.5*w)*0.5) - 0.5 ) - length(fract((uv+0.5*w)*0.5)-0.5) ) / w;
  float r = length((fract(i*0.5) - 0.5)*2.9);
  r = length(i);
  r = 1. - r;
  r = clamp(r, 0., 1.);
  r = mix( r, 0.28, min(length(fwidth(uv)),0.9));
  // r = r * smoothstep(1.0,0.5,fwidth(r));
  // if( r >= 1. ) r -= (r - 1.) * 0.2;
  return r;
}

float dots( vec2 uv ) {
  float r = length( fract(uv) * 2. - 1. );
  r /= 1.4142;
  float w = length(fwidth(uv));
  r = mix( r, 0.5, min(w,1.));
  r = 1. - r;
  return r;
}

float triFade( vec3 sig123, float t ) {
  float t1 = 1.0 - 2.0 * abs( fract( t ) - 0.5 );
  t1 = 1.5 * max( -0.0, t1 - 0.333333 );
  t1 = smoothstep(0., 1., t1);
  float t2 = 1.0 - 2.0 * abs( fract( t + 0.33333 ) - 0.5 );
  t2 = 1.5 * max( -0.0, t2 - 0.333333 );
  t2 = smoothstep(0., 1., t2);
  float t3 = 1.0 - 2.0 * abs( fract( t + 0.66667 ) - 0.5 );
  t3 = 1.5 * max( -0.0, t3 - 0.333333 );
  t3 = smoothstep(0., 1., t3);
  float c = t1*sig123.x + t2*sig123.y + t3*sig123.z;
  return c;
}

vec3 planeColor( vec4 pi ) {
  vec3 color = vec3(0.);
  float c1 = dots( pi.xy * 1.0 );
  float c2 = tiles( pi.xy * 2. );
  float c3 = checkers2( pi.xy * 1. );
  float t = u_time * 0.1;
  float c = triFade( vec3(c1,c2,c3), t);
  color = vec3(c);
  color *= colpal2( fract(1. - pi.w + 0.98) );
  color += pow(dot( normalize(plane.xyz-vec3(pi.xy, 0.0)), plane.xyz ), 8.);
  return color;
}

float getLight( vec3 ro, vec3 rd, vec3 lp ) {
  vec4 pir = planeIntersect( ro, rd, plane );
  vec3 lo = lp - pir.xyz;
  vec3 co = ro - pir.xyz;
  vec3 ha = (lo - co) * 0.5;
  float spec = dot( normalize(ha), normalize(co) );
  spec = pow(spec, 30.);
  spec = pow(spec, 30.);
  return spec;
}

void pR(inout vec2 p, float a) {
	p = cos(a)*p + sin(a)*vec2(p.y, -p.x);
}

vec3 getPixelColor( vec2 fragCoord ) {
  vec2 uv=(fragCoord-.5*u_resolution.xy)/u_resolution.y;
  vec3 ro=vec3(0,1,3.9);
  vec3 rd = normalize(vec3(uv * 1.,-0.35));
  // vec3 rd = normalize(vec3(uv * 1.,-1));
  // pR( rd.yz, -1.1 * (sin(u_time * 0.4) * 0.5 + 0.5) );
  pR( rd.yz, -1.1 );
  pR( rd.xy, u_time * 0.2 );
  // pR( rd.yz, 0.1 );

  vec3 color = vec3(0.);

  vec4 pi = iterateToPlane( ro, rd );
  if( pi.w > -0. ) {
    vec3 cp = normalize(ro - pi.xyz);
    vec3 cp2 = plane.xyz;
    pi.w = clamp(dot( cp, cp2 ), 0., 1.);

    color=planeColor( pi );
    float r = 0.;//sin(u_time*2.) * 0.1;
    vec3 lp = vec3( r + 1. * mCycle2.x, r + 1. * mCycle2.y, 1 ) - plane.xyz;
    color += pow(getLight( ro, rd, lp), 30.);
  }

  return color;
}

vec3 antiAlias( vec2 fragCoord ) {
  vec2 aa = vec2( 1.0, 0.0 );
  vec3 color = vec3(0);
  color += getPixelColor( fragCoord + aa.xy );
  color += getPixelColor( fragCoord + aa.yx );
  color += getPixelColor( fragCoord + aa.xx );
  color += getPixelColor( fragCoord + aa.yy );
  color *= 0.25;
  return color;
}

void main()
{

  vec2 fragCoord = gl_FragCoord.xy;
  vec3 color = getPixelColor( fragCoord );
  gl_FragColor=vec4(color,1.);

}

uniform vec2 u_resolution;
uniform vec2 u_mouse;// Mouse screen pos
uniform float u_time;// Mouse screen pos

#define PI 3.14159

vec2 mouse = u_mouse / u_resolution;
float time = u_time * 0.2;
vec2 mCycle1 = vec2( cos( time * PI * 0.1 ), sin( time * PI * 0.1 ) );
vec2 mCycle2 = vec2( cos( time * PI ), sin( time * PI ) );

float planeDistance( in vec3 ro, in vec3 rd, in vec4 p )
{
  float rdDot = dot(rd,p.xyz);
  return -(dot(ro,p.xyz)+p.w)/rdDot;
}

vec4 planeIntersect( vec3 ro, vec3 rd, vec4 p ) {
  float d = planeDistance( ro, rd, p );
  vec4 i = vec4(ro + rd * d, 1.0);
  return i;
}

vec4 plane = vec4( normalize(vec3(0, -0, 1)), -1 );

void changeVel( in vec3 pos, inout vec3 vel ) {
  vec3 h = vec3( -0, 0, 1 ) - pos;
  h.xy += mCycle2;
  vec3 acc = sin(normalize(h)*PI) * 2. / dot( h, h ) ;

  h = vec3( 0, 0, 3.355) - pos;
  // h = vec3( 0, 0, 2.355) - pos;
  h.z += 3.31 * mCycle1.x;
  h.z *= mouse.x;
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
  vec3 cp = normalize(ro - pi.xyz);
  vec3 cp2 = vec3(0,0,1);
  pi.w = clamp(dot( cp, cp2 ), 0., 1.);
  return pi;
}

vec3 pal( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d ) {
    return a + b*cos( 6.28318*(c*t+d) );
}

vec3 colpal2( in float t ) {
  return pal( t, vec3(0.5,0.0,0.5),vec3(0.5,0.5,0.5),vec3(2.0,1.0,1.0),vec3(0.0,0.33,0.67) );
}

float checkers(vec2 uv)
{
    vec2 w = fwidth(uv) + 0.001;
    vec2 i = 2.0*(abs(fract((uv-0.5*w)*0.5)-0.5)-abs(fract((uv+0.5*w)*0.5)-0.5))/w;
    return 0.5 - 0.5*i.x*i.y;
}

float tiles( vec2 uv ) {
  vec2 w = fwidth(uv) + 0.1;
  vec2 i = 2.0 * ( length( fract((uv-0.5*w)*0.5) - 0.5 ) - length(fract((uv+0.5*w)*0.5)-0.5) ) / w;
  float r = length((fract(i*0.5) - 0.5)*2.9);
  r = length(i);
  r = 1. - r;
  if( r >= 1. ) r -= (r - 1.) * 0.2;
  return r;
}

float dots( vec2 uv ) {
  float r = length( fract(uv) * 2. - 1. );
  // r /= 1.4142;
  if( r >= 1. ) r -= (r - 1.) * 0.2;
  r = 1. - r;
  return r;
}

vec3 planeColor( vec4 pi ) {
  vec3 color = vec3(0.);
  float ck = checkers( pi.xy * 1. );
  color = vec3(ck);
  color *= colpal2( 1. - pi.w );
  color += pow(dot( normalize(vec3(0,0,1)-vec3(pi.xy, 0.0)), vec3(0,0,1) ), 8.);
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

vec3 getPixelColor( vec2 fragCoord ) {
  vec2 uv=(fragCoord-.5*u_resolution.xy)/u_resolution.y;
  vec3 ro=vec3(0,0,3.9);
  vec3 rd = normalize(vec3(uv * 1.,-0.35));

  vec4 pi = iterateToPlane( ro, rd );
  vec3 color=planeColor( pi );
  float r = 1. + mCycle2.x * 2.;
  color += pow(getLight( ro, rd, vec3( r * mCycle2.x, r * mCycle2.y, 1 ) ), 30.);
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
  vec3 color = antiAlias( fragCoord );
  // if( fragCoord.y < 10. ) {
  //   color = colpal2( fragCoord.x / u_resolution.x );
  // }
  gl_FragColor=vec4(color,1.);

}

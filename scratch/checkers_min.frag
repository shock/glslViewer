uniform vec2 u_resolution;
uniform vec2 u_mouse;// Mouse screen pos
uniform float u_time;// Mouse screen pos

#define PI 3.14159
#define PLANE_SIZE 20.

vec2 mouse = u_mouse / u_resolution;
float time = u_time * 0.2;
vec2 tCycle1 = vec2( cos( time * PI * 0.5 ), sin( time * PI * 0.5 ) );
vec2 tCycle2 = vec2( cos( time * PI ), sin( time * PI ) );
vec2 tCycle3 = vec2( cos( u_time * PI * 0.125 ), sin( u_time * PI * 0.125 ) );

float planeDistance( in vec3 ro, in vec3 rd, in vec4 p )
{
  float rdDot = dot(rd,p.xyz);
  return -(dot(ro,p.xyz)+p.w)/rdDot;
}

vec4 planeIntersect( vec3 ro, vec3 rd, vec4 p ) {
  float d = planeDistance( ro, rd, p );
  vec4 i = vec4(ro + rd * d, 1.0);
  // if( abs(i.x) > PLANE_SIZE || abs(i.y) > PLANE_SIZE ) {
  if( length(i.xy) > PLANE_SIZE ) {
    return vec4(-1.0);
  }
  // i.w = d;
  return i;
}

float sphDistance( in vec3 ro, in vec3 rd, in vec4 sph )
{
	vec3 oc = ro - sph.xyz;
	float b = dot( oc, rd );
	float c = dot( oc, oc ) - sph.w*sph.w;
	float h = b*b - c;
	if( h<0.0 ) return -1.0;
	return -b - sqrt( h );
}

vec4 sphIntersect( vec3 ro, vec3 rd, vec4 sph ) {
  vec4 i = vec4(-1.);
  float d = sphDistance( ro, rd, sph );
  if( d > 0. ) {
    i.xyz = ro + rd * d;
    i.w = d;
  }
  return i;
}

vec4 plane = vec4( normalize(vec3(0, 0, 1.0)), 1.00 );

void changeVel( in vec3 pos, inout vec3 vel ) {
  // return;
  vec3 h = vec3( -0, 0, 1 ) - pos;
  h.xy += tCycle2;
  vec3 acc = sin(normalize(h)*PI * 0.1) * 0.1 / dot( h, h ) ;

  h = vec3( 0, 0, 2.415) - pos;
  // h = vec3( 0, 0, 2.355) - pos;
  h.z += 0.61 * tCycle1.x;
  h.xy += (sin(u_time * 5.1) * 0.001 + 0.01) * tCycle2;
  // h.z *= mouse.x;
  acc += sin(normalize(h) * 0.35) / dot( h, h ) ;
  vel += acc;
}

vec4 iterateToPlane( vec3 ro, inout vec3 vel ) {
  vec3 pos = ro;
  vel *= 1.31;

  for( int i = 0; i < 3; i++ ) {
    changeVel( pos, vel );
    pos = pos + vel;
  }

  vec4 pi = planeIntersect( pos, vel, plane );
  return pi;
}

vec3 pal( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d ) {
    return a + b*cos( 6.28318*(c*t+d) );
}

vec3 colpal1( in float t ) {
  t = fract(t - u_time * 0.048);
  return pal( t, vec3(0.5,0.0,0.5),vec3(0.5,0.5,0.5),vec3(2.0,1.0,1.0),vec3(0.0,0.33,0.67) );
}

vec3 colpal2( in float t ) {
  t = fract(t - u_time * 0.048);
  return pal( t, vec3(0.5,0.0,0.5),vec3(0.5,0.5,0.5),vec3(1.0,1.0,1.0),vec3(0.0,0.33,0.67) );
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

float planes( vec2 uv ) {
  vec2 w = fwidth(uv) + 0.5;
  vec2 i = 2.0 * ( length( fract((uv-0.5)*0.5) - 0.5 ) - length(fract((uv+0.5)*0.5)-0.5) ) / fract(uv);
  float r = length((fract(i*0.5) - 0.5)*2.9);
  r = length(i);
  r = 1. - r;
  r = clamp(r, 0., 1.);
  r = mix( r, 0.28, min(length(fwidth(uv)),0.9));
  // r = r * smoothstep(1.0,0.5,fwidth(r));
  // if( r >= 1. ) r -= (r - 1.) * 0.2;
  return r;
}

float grid( vec2 uv ) {
  vec2 w = fwidth(uv) + 0.2;
  vec2 i = 2.0 * ( length( fract((uv-0.5)*0.5) - 0.5 ) - length(fract((uv+0.5)*0.5)-0.5) ) / w;
  float r = length((fract(i*0.5) - 0.5)*2.9);
  r = length(i);
  r = 1. - r;
  r = clamp(r, 0., 1.);
  r = mix( r, 0.28, min(length(fwidth(uv)),0.9));
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
  float c2 = grid( pi.xy * 1. );
  float c3 = tiles( pi.xy * 1. );
  float t = u_time * 0.1;
  float c = triFade( vec3(c1,c2,c3), t);
  color = vec3(c);
  pi.w = dot( normalize(vec3(0,0,1)), normalize(vec3(pi.xy,1.)));
  color *= colpal2( fract(1. - pi.w + 0.98) );
  color += pow(dot( normalize(plane.xyz-vec3(pi.xy, 0.0)), plane.xyz ), 16.);
  color = pow( color, vec3(0.666) );
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

float sR = 5.5;
vec4 sphere = vec4( sR * tCycle3.x, sR * -tCycle3.y, 4. + tCycle2.x, 2);
vec4 sphere2 = vec4( -sR * tCycle3.x, -sR * -tCycle3.y, 4. - tCycle2.x, 2);

vec3 bgColor( vec3 rd ) {
  // return vec3(0.16, 0.22, 0.70) - rd.z*0.8;
  vec3 color = vec3(0.36, 0.42, 0.990) - pow(abs(rd.z)*0.3,0.9);
  float sun = dot( normalize(rd), vec3(0,0,-1) );
  sun = pow(sun, 30.);
  sun = pow(sun, 30.3);
  // color += sun;
  color = pow( color, vec3(0.5) );
  return color;
}

vec3 sphereColor( vec4 sphere, vec4 si, vec3 ro ) {
  vec3 color = vec3(0.0);
  vec3 n = normalize(si.xyz - sphere.xyz);
  vec3 ci = normalize(ro - si.xyz);
  vec3 lp = vec3( 2, 1, 3);
  vec3 l = normalize( lp - si.xyz);
  color += max(0.,dot( ci, n ));
  // color.r += max(0.,dot( l, n));

  vec3 r = -ci - 2. * dot(-ci, n) * n;
  vec3 reflCol = bgColor(r);
  vec4 pi = planeIntersect( si.xyz, r, plane );
  if( pi.w >= 0. ) {
    vec3 pColor = planeColor(pi);
    reflCol = pColor;
  }
  color = mix( color, reflCol, 0.4);
  return color;
}

vec3 getPixelColor( vec2 fragCoord ) {
  vec2 uv=(fragCoord-.5*u_resolution.xy)/u_resolution.y;
  vec3 ro=vec3(0,0,3.9);
  vec3 rd = normalize(vec3(uv * 1.,-0.35));
  // vec3 rd = normalize(vec3(uv * 1.,-1));
  // pR( rd.yz, -0.2 -1.6 * (sin(u_time * 0.4) * 0.5 + 0.5) );
  pR( rd.yz, -1.8 + mouse.y);
  pR( rd.xy, u_time * 0.35 );
  pR( rd.xy, 0.0 + 2. * mouse.x);

  vec3 color = bgColor( rd );
  vec4 pi = iterateToPlane( ro, rd );
  vec4 sip = sphIntersect( ro, normalize(rd), sphere2 );
  vec4 si = sphIntersect( ro, normalize(rd), sphere );

  if( si.w >= 0. || sip.w >= 0. ) {
    if( sip.w > 0. ) color = sphereColor( sphere2, sip, ro );
    if( si.w > 0. ) color = sphereColor( sphere, si, ro );
  } else {
    if( pi.w > -0. ) {
      vec3 cp = normalize(ro - pi.xyz);
      vec3 cp2 = plane.xyz;
      pi.w = clamp(dot( cp, cp2 ), 0., 1.);

      color=planeColor( pi );
      float r = 0.;//sin(u_time*2.) * 0.1;
      vec3 lp = vec3( r + 1. * tCycle2.x, r + 1. * tCycle2.y, 1 ) - plane.xyz;
      color += pow(getLight( ro, rd, lp), 30.);
    }
  }

  // color = pow( color, vec3(0.4545) );
  return color;
}

int kAA = 3;
vec3 antiAlias( vec2 fragCoord ) {
  vec3 aa = vec3( 1.0, -1.0, 0.0 );
  vec3 color = vec3(0);
  for( int i = 0; i < kAA; i++ ) {
    for( int j = 0; j < kAA; j++ ) {
      vec2 a = vec2( float(i-1), float(j-1) );
      color += getPixelColor( fragCoord + a ) / length(abs(a)+1.);
    }
  }
  // color += getPixelColor( fragCoord + aa.xy );
  // color += getPixelColor( fragCoord + aa.yx );
  // color += getPixelColor( fragCoord + aa.xx );
  // color += getPixelColor( fragCoord + aa.yy );
  // color += getPixelColor( fragCoord + aa.xy );
  // color += getPixelColor( fragCoord + aa.yx );
  // color += getPixelColor( fragCoord + aa.xx );
  // color += getPixelColor( fragCoord + aa.yy );
  color *= 0.25;
  return color;
}

void main()
{

  vec2 fragCoord = gl_FragCoord.xy;
  vec3 color = getPixelColor( fragCoord );
  // if( fragCoord.y < 10. ) {
  //   color = colpal2( fragCoord.x / u_resolution.x );
  // }
  // if( fragCoord.y < 5. ) {
  //   color = pow(color, vec3(0.4545));
  // }
  gl_FragColor=vec4(color,1.);

}

uniform vec2 u_resolution;
uniform vec2 u_mouse;// Mouse screen pos
uniform float u_time;// Mouse screen pos

#define MAX_ITERATIONS 100.
#define PLANE_SIZE 20.0

vec2 mCycle = u_mouse / u_resolution;
float time = u_time * 0.5;
vec2 mCycle2 = vec2( cos( time * 3.14159 ), sin( time * 3.14159 ) );

// float plane_size = mCycle2.y * PLANE_SIZE;
float plane_size = PLANE_SIZE;

float planeDistance( in vec3 ro, in vec3 rd, in vec4 p )
{
  float rdDot = dot(rd,p.xyz);
  if( rdDot == 0.0 ) return -1.;
  return -(dot(ro,p.xyz)+p.w)/rdDot;
}

vec4 planeIntersect( vec3 ro, vec3 rd, vec4 p ) {

  float d = planeDistance( ro, rd, p );
  if( d >= 0. ) {
    vec4 i = vec4(ro + rd * d, 1.0);
    if( abs(i.x) < plane_size && abs(i.y) < plane_size ) {
      return i;
    }
  }
  return vec4( -1 );

}

float checkers(vec2 uv)
{
    vec2 w = fwidth(uv) + 0.001;
    vec2 i = 2.0*(abs(fract((uv-0.5*w)*0.5)-0.5)-abs(fract((uv+0.5*w)*0.5)-0.5))/w;
    return 0.5 - 0.5*i.x*i.y;
}

vec4 plane = vec4( normalize(vec3(0, 0, 1)), 0 );

void pR(inout vec2 p, float a) {
	p = cos(a)*p + sin(a)*vec2(p.y, -p.x);
}

void changeVel( in vec3 pos, inout vec3 vel ) {

  vec3 acc = (vec3(0.0) - pos);
  // pR(acc.xy, pos.z * 0.01 * mCycle.x);
  // pR(acc.yz, pos.x * 0.005);
  float scalar = 0.001;
  vel += acc * scalar;
  vel.z *= 0.88;
  vel.z -= length(vel.xy);

}

vec4 iterateToPlane( vec3 ro, inout vec3 rd ) {

  vec3 vel = normalize(rd);
  vec3 pos = ro;
  float d = 0.;
  float steps = 0.;
  vec3 acc = vec3(0);

  for( float i = 0.; i < MAX_ITERATIONS; i++ ) {
    d = planeDistance( pos, vel, plane );
    // if( abs(d) < 0.6 ) break;
    if( d < 1.7 ) break;
    steps += 1.0;
    changeVel( pos, vel );

    pos = pos + vel;
  }

  if( d > 0. ) {
    vec4 pi = planeIntersect( pos, vel, plane );
    if( pi.w > 0. ) {
      pi.w = steps / MAX_ITERATIONS;
      rd = vel;
      return pi;
    }
  }

  return vec4(-1.);

}

vec3 pal( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d )
{
    return a + b*cos( 6.28318*(c*t+d) );
}


vec3 planeColor( vec4 pi ) {

  vec3 color = vec3(0.);
  if( pi.w > 0. ) {
    float ck = checkers( pi.xy );
    if( ck > 0.99 ) {
      color = pal( pi.w, vec3(0.5,0.5,0.5),vec3(0.5,0.5,0.5),vec3(1.0,1.0,1.0),vec3(0.0,0.33,0.67) );
    }
    color.r = ck;
    // // color.g = pi.w;
    // color.b = dot( normalize(vec3(4,0,1)-pi.xyz), vec3(0,0,1) );
    // return checkers( pi.xy );
  }

  return color;

}

float getLight( vec3 ro, vec4 pi) {

  if( pi.w < 0. ) return 0.;
  vec3 lp = vec3( 2. * mCycle2.x, 2. * mCycle2.y, 1 );
  vec3 p = vec3(pi.xy, 0);
  vec3 lo = lp - p;
  vec3 co = ro - p;
  vec3 ha = (lo + co) * 0.5;
  float spec = dot( normalize(ha), normalize(co) );
  spec = pow(spec, 30.);
  spec = pow(spec, 30.);
  return spec;

}


void main()
{
  float light = 1.0;
  // float light = getSceneColor( gl_FragCoord.xy );

  vec2 fragCoord = gl_FragCoord.xy;
  vec2 uv=(fragCoord-.5*u_resolution.xy)/u_resolution.y;
  vec3 ro=vec3(0,0,100.);// Ray Origin/Camera
  vec3 rd=normalize(vec3(uv.x,uv.y,-1));// Ray Direction

  vec4 pi = iterateToPlane( ro, rd );
  vec3 color=planeColor( pi );// Diffuse lighting
  // color += getLight( ro, pi );
  // Set the output color
  gl_FragColor=vec4(color,1.);
}

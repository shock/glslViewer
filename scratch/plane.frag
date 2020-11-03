uniform vec2 u_resolution;

#define MAX_ITERATIONS 100.

float planeDistance( in vec3 ro, in vec3 rd, in vec4 p )
{
  float rdDot = dot(rd,p.xyz);
  if( rdDot == 0.0 ) return -1.;
  return -(dot(ro,p.xyz)+p.w)/rdDot;
}

vec4 planeIntersect( vec3 ro, vec3 rd, vec4 p ) {

  float d = planeDistance( ro, rd, p );
  if( d >= 0. ) {
    return vec4(ro + rd * d, 1.0);
  } else {
    return vec4( -1 );
  }

}

float checkers(vec2 uv)
{
    vec2 w = fwidth(uv) + 0.001;
    vec2 i = 2.0*(abs(fract((uv-0.5*w)*0.5)-0.5)-abs(fract((uv+0.5*w)*0.5)-0.5))/w;
    return 0.5 - 0.5*i.x*i.y;
}

vec4 plane = vec4( normalize(vec3(0, 0, 1)), 1 );

void pR(inout vec2 p, float a) {
	p = cos(a)*p + sin(a)*vec2(p.y, -p.x);
}

void changeVel( in vec3 pos, inout vec3 vel ) {

  vec3 acc = (vec3(0.0) - pos);
  // pR(acc.xy, pos.z * 0.001);
  // pR(acc.yz, pos.x * 0.005);
  float scalar = 0.001;
  vel += acc * scalar;
  vel.z *= 0.88;
  vel.z -= length(vel.xy);

}

vec4 iterateToPlane( vec3 ro, inout vec3 rd ) {

  vec3 vel = normalize(rd);// * 0.47;
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
    pi.w = steps / MAX_ITERATIONS;
    rd = vel;
    return pi;
  }

  return vec4(-1.);

}

vec3 planeColor( vec3 ro, vec3 rd ) {

  vec3 color = vec3(0.);
  vec4 pi = iterateToPlane( ro, rd );
  if( pi.w > 0. ) {
    color.r = checkers( pi.xy );
    // color.g = pi.w;
    color.b = dot( normalize(vec3(4,0,1)-pi.xyz), vec3(0,0,1) );
    // return checkers( pi.xy );
  }

  return color;

}


void main()
{
    float light = 1.0;
    // float light = getSceneColor( gl_FragCoord.xy );

    vec2 fragCoord = gl_FragCoord.xy;
    vec2 uv=(fragCoord-.5*u_resolution.xy)/u_resolution.y;
    vec3 ro=vec3(0,0,200.);// Ray Origin/Camera
    vec3 rd=normalize(vec3(uv.x,uv.y,-1));// Ray Direction

    vec3 color=planeColor( ro, rd );// Diffuse lighting
    // Set the output color
    gl_FragColor=vec4(color,1.);
}

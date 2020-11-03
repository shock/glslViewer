uniform vec2 u_resolution;

#define MAX_ITERATIONS 100

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

vec4 plane = vec4( normalize(vec3(0, 0, 1)), 10 );

void changeVel( in vec3 pos, inout vec3 vel ) {

  vec3 acc = (vec3(0.0) - pos) * 0.00086  ;
  vel += acc;

}

vec4 iterateToPlane( vec3 ro, vec3 rd ) {

  vec3 vel = rd * 0.01;
  vec3 pos = ro;
  float d = 0.;
  float steps = 0.;
  vec3 acc = vec3(0);

  for( int i = 0; i < MAX_ITERATIONS; i++ ) {
    d = planeDistance( pos, vel, plane );
    if( d < 0.01 ) break;
    steps += 1.0;
    changeVel( pos, vel );

    pos = pos + vel;
  }

  if( d > 0. ) {
    return planeIntersect( pos, vel, plane );
  }

  return vec4(-1.);

}

float planeColor( vec3 ro, vec3 rd ) {

  vec4 pi = iterateToPlane( ro, rd );
  if( pi.w > 0. ) {
    return checkers( pi.xy );
  } else {
    return 0.;
  }

}


void main()
{
    float light = 1.0;
    // float light = getSceneColor( gl_FragCoord.xy );

    vec2 fragCoord = gl_FragCoord.xy;
    vec2 uv=(fragCoord-.5*u_resolution.xy)/u_resolution.y;
    vec3 ro=vec3(0,0,3.);// Ray Origin/Camera
    vec3 rd=normalize(vec3(uv.x,uv.y,-1));// Ray Direction

    float val = planeColor( ro, rd );

    vec3 color=vec3(val,0,0);// Diffuse lighting
    // Set the output color
    gl_FragColor=vec4(color,1.);
}

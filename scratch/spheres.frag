uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;

#define iResolution u_resolution
#define iMouse vec3(u_mouse,0)
#define iTime u_time
#define ut u_time
#define kPI 3.14159265
#define k2PI (2.*kPI)
#define kPIi (1./kPI)
#define k2PIi (1./k2PI)
#define f(x) fract(x)
#define l(x) length(x)
#define c(x,y,z) clamp(x,y,z)
#define p(x,y) pow(x,y)
#define r(x) f(sin(x)*100000.0)
#define n(x) normalize(x)
#define v3 vec3(0)

vec2 m=iMouse.xy / iResolution;

void pR(inout vec2 p,float a) {
	p=cos(a)*p+sin(a)*vec2(p.y,-p.x);
}

vec3 pal(float t) {
  vec3 a=vec3(0.5,0.0,0.5),
  b=vec3(0.5),
  c=vec3(1),d=vec3(0,0.33,0.67);
	return a+b*cos(6.2318*(c*t+d));
}

float random (vec2 st) {
  return f(sin(dot(st.xy, vec2(12.9898,78.233)))* 43758.5453123);
}

float pD(vec3 ro,vec3 rd,vec4 p) {
	return -(dot(ro,p.xyz)+p.w)/dot(rd,p.xyz);
}

vec4 pI(vec3 ro,vec3 rd,vec4 p) {
	float d=pD(ro,rd,p);
  vec3 i = ro+rd*d;
	return vec4(i,d);
}

vec3 pN(vec4 p) {
  return p.xyz;
}

float sD(vec3 ro,vec3 rd,vec4 sph) {
	vec3 oc=ro-sph.xyz;
	float b=dot(oc,rd), c=dot(oc,oc)-sph.w*sph.w, h=b*b-c;
	if(h<0.0) return -1.0;
	return -b-sqrt(h);
}

vec2 polarCoords( vec3 pos ) {
  pos = n(pos);
  return vec2( 0.5 - atan(pos.x,pos.z) * k2PIi, 0.5 - asin(pos.y) * kPIi );
}

vec4 sI(vec3 ro,vec3 rd,vec4 sph) {
	vec4 i=vec4(-1.);
	float d=sD(ro,rd,sph);
	if(d > 0.) { i.xyz=ro+rd*d; i.w=d; }
	return i;
}

vec3 sN( vec3 i, vec4 s ) {
  return n(i - s.xyz);
}

float sSS( vec3 ro, vec3 rd, vec4 sph )
{
    vec3 oc = ro - sph.xyz;
    float b = dot( oc, rd );
    float c = dot( oc, oc ) - sph.w*sph.w;
    float h = b*b - c;
    return (b>0.0)?step(-1e-4,c):smoothstep(0.0,1.0,h*2./b);
}

float sphOcclusion( in vec3 pos, in vec3 nor, in vec4 sph )
{
		vec3  r = sph.xyz - pos;
		float l = length(r);
		float d = dot(nor,r);
		float res = d;

		if( d<sph.w ) res = pow(clamp((d+sph.w)/(2.0*sph.w),0.0,1.0),1.5)*sph.w;

		return clamp( res*(sph.w*sph.w)/(l*l*l), 0.0, 1.0 );
}

float chex(vec2 uv)
{
  vec2 w = fwidth(uv) + 0.0001;
  vec2 i = 2.0*(abs(f((uv-0.5*w)*0.5)-0.5)-abs(f((uv+0.5*w)*0.5)-0.5))/w;
  return 0.5 - 0.5*i.x*i.y;
}

float schex(vec2 uv) {
  vec2 i = sign(2.*(f(0.5*uv) - 0.5));
  return 0.5*i.x*i.y;
}

// --- analytically box-filtered checkerboard ---

vec3 tri( in vec3 x )
{
    vec3 h = fract(x/2.0)-0.5;
    return 1.0-2.0*abs(h);
}

float checkersTextureGradBox( in vec3 p ) {
  vec3 w = fwidth(p);   // filter kernel
  vec3 i = (tri(p+0.5*w)-tri(p-0.5*w))/w;    // analytical integral (box filter)
  return 0.5 - 0.5*i.x*i.y*i.z;              // xor pattern
}

float checkersTexture( in vec3 p )
{
    vec3 q = floor(p);
    return mod( q.x+q.y+q.z, 2.0 );            // xor pattern
}

float dots(vec2 uv) {
	return mix(1.-l(f(uv)*2.-1.),0.25,min(l(fwidth(uv)),1.));
}

float granite(vec2 uv) {
  uv = floor(uv*90.)/90.;
  vec2 w2 = fwidth(uv);
  float w = max(w2.x, w2.y) * 16.;
  // w = w * w;

  float g = random(uv*41.126);
  // g = g * g;
  g = mix(g,0.39,clamp(w,0.,1.));
  return g;
}

#define sharpness 4.

float sphTex( vec3 pos, vec3 nor, vec4 s )
{
  // return checkersTextureGradBox(pos);
  pos = (pos - s.xyz) * 3.;
  pR(pos.xz,ut*0.25);
  vec2 uv = polarCoords( pos );
  float c = chex( uv * 32.* vec2(2,1) );
  return c;
  vec3 weights = abs(nor);
  weights = pow(weights, vec3(sharpness) );
  weights = weights / (weights.x + weights.y + weights.z);
  return c * granite(pos.xy) * weights.z +
    granite(pos.yz) * weights.x +
    granite(pos.xz+1.) * weights.y;
}

vec4 p = vec4(n(vec3(0,1,0)),1);
vec4 s = vec4(0,0,0,1);
vec3 lightSource = vec3(-10,10,50);

float ai( float x, float m, float n ) {
  float t = x/m; if( x>m ) return x; return (2.0*n - m*t + 2.0*m - 3.0*n)*t*t + n;
}

struct RI {
  vec3 pos;
  float d;
  vec3 ro;
  vec3 rd;
  vec3 nor;
  int mid;
  float spec;
};

vec3 pC( RI ri, vec4 p) {
  vec3 c = vec3(chex(ri.pos.xz*2.));
  return c;
}

vec3 sC( RI ri, vec4 s ) {
  vec3 n = sN(ri.pos.xyz,s);
  return vec3(sphTex(ri.pos.xyz,n,s));
  return vec3(checkersTextureGradBox(ri.pos.xyz*2.));
}

vec3 shade( RI ri ) {
  float col;
  vec3 ol = n(lightSource - ri.pos);
  vec3 oc = n(ri.ro - ri.pos);
  vec3 ha = (ol + oc) * 0.5;
  ha = normalize(ha);
  float d = max(0.,dot(ol,ri.nor));
  float spe = pow(max(0.0, dot(oc, reflect(-ol, ri.nor))), 30.) * 2.0;
  d += spe;
  col = d;
  col *= 1.-sphOcclusion(ri.pos,ri.nor,s);
  col *= clamp(sSS(ri.pos, ol, s),0.,1.);
  col = ai(col,0.2,0.015);
  return vec3(col);
}

float light( RI ri ) {
  vec3 cl = n(lightSource - ri.ro);
  float i = dot(cl, ri.rd)+0.0001;
  i = pow(i,30.);
  i = pow(i,30.);
  i = pow(i,30.);
  return i;
}

#define SKY 0
#define SPHERE 1
#define GROUND 2

RI mapRay( RI ri ) {
  vec4 pi = pI(ri.ro, ri.rd, p);
  vec3 n;
  if( pi.w > 0. && pi.w < ri.d ) {
    ri.nor = pN(p);
    ri.pos = pi.xyz;
    ri.mid = GROUND;
    ri.d = pi.w;
  }
  vec4 si = sI(ri.ro, ri.rd, s);
  if( si.w > 0. && si.w < ri.d ) {
    ri.nor = sN(si.xyz, s);
    ri.pos = si.xyz;
    ri.mid = SPHERE;
    ri.d = si.w;
  }
  return ri;
}

vec3 getRayColor( RI ri, vec3 col ) {
  ri = mapRay( ri );
  if( ri.mid == SPHERE ) col = sC(ri, s);
  if( ri.mid == GROUND ) col = pC(ri, p);
  if( ri.d > 0. ) {
    col *= shade( ri );
    col *= exp( -0.05*ri.d );
  }
  if( l(lightSource-ri.ro) < ri.d )
    col += light( ri );
  return col;
}

vec3 hash3( float n ) { return fract(sin(vec3(n,n+1.0,n+2.0))*43758.5453123); }

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
  vec2 q = fragCoord.xy / iResolution.xy;
  vec2 p = (2.0*fragCoord.xy-iResolution.xy)/iResolution.y;
  // vec2 m = step(0.0001,iMouse.z) * iMouse.xy/iResolution.xy;

  float time = iTime*0.5;
  vec3 cen = vec3(0);


  //-----------------------------------------------------
  // camera
  //-----------------------------------------------------
  float an = 0.3*time - 7.0*m.x - 3.5;

  float le = 2.5;
  float d = 1.;
  vec3 ro = cen + vec3(sin(m.x*k2PI*2.)*4.*(1.+m.y*d),m.y*10.,cos(m.x*k2PI*2.)*4.*(1.+m.y*d));
  vec3 ta = cen;
  vec3 ww = normalize( ta - ro );
  vec3 uu = normalize( cross(ww,vec3(0.0,1.0,0.0) ) );
  vec3 vv = normalize( cross(uu,ww));
  vec3 rd = normalize( p.x*uu + p.y*vv + le*ww );

  float px = 1.0*(2.0/iResolution.y)*(1.0/le);

  vec3 col = vec3(0.03,0.04,0.2)*clamp(1.-rd.y,0.0,1.0);

  RI ri;
  ri.ro = ro; ri.rd = rd; ri.mid = SKY; ri.d = 1e20;
  col = getRayColor( ri, col );

  //-----------------------------------------------------
  // postprocess
  //-----------------------------------------------------

  // gama
  col = pow( col, vec3(0.44,0.44,0.44) );

  // contrast
  col = mix( col, smoothstep( 0.0, 1.0, col ), 0.5 );

  // saturate
  col = mix( col, vec3(dot(col,vec3(0.333))), -0.2 );

  // vigneting
  col *= 0.2 + 0.8*pow(16.0*q.x*q.y*(1.0-q.x)*(1.0-q.y),0.2);

  // dithering
  col += (1.0/255.0)*hash3(q.x+13.3214*q.y);

  fragColor = vec4( col, 1.0 );
}

void main() {
  mainImage(gl_FragColor, gl_FragCoord.xy);
  if( gl_FragCoord.y < 10. ) {
    gl_FragColor=vec4(pal(gl_FragCoord.x/u_resolution.x),1.);
  }
}
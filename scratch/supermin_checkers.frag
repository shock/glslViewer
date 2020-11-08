uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

#define PI 3.14159
#define ut u_time
#define n(x) normalize(x)
#define l(x) length(x)
#define f(x) fract(x)
#define v3 vec3(0)

vec2 m = u_mouse / u_resolution;
float t = ut * 0.2;
vec2 tc1 = vec2( cos( t * PI * 0.5 ), sin( t * PI * 0.5 ) );
vec2 tc2 = vec2( cos( t * PI ), sin( t * PI ) );
vec2 tc3 = vec2( cos( ut * PI * 0.125 ), sin( ut * PI * 0.125 ) );

float pD( in vec3 ro, in vec3 rd, in vec4 p )
{
	return -(dot(ro,p.xyz)+p.w)/dot(rd,p.xyz);
}

vec4 pI( vec3 ro, vec3 rd, vec4 p ) {
	float d = pD( ro, rd, p );
	vec4 i = vec4(ro + rd * d, 1.0);
	return i;
}

float sD( in vec3 ro, in vec3 rd, in vec4 sph )
{
	vec3 oc = ro - sph.xyz;
	float b = dot( oc, rd );
	float c = dot( oc, oc ) - sph.w*sph.w;
	float h = b*b - c;
	if( h<0.0 ) return -1.0;
	return -b - sqrt( h );
}

vec4 sI( vec3 ro, vec3 rd, vec4 sph ) {
	vec4 i = vec4(-1.);
	float d = sD( ro, rd, sph );
	if( d > 0. ) { i.xyz = ro + rd * d; i.w = d; }
	return i;
}

vec4 pl = vec4( vec3(0, 0, 1), 0 );

void cv( in vec3 pos, inout vec3 vel ) {
	vec3 h = vec3( -0, 0, 1 ) - pos;
	h.xy += tc2;
	vec3 acc = sin(n(h)*PI * 0.1) * 0.1 / dot( h, h ) ;

	h = vec3( 0, 0, 2.415) - pos;
	h.z += 0.61 * tc1.x;
	h.xy += (sin(ut * 5.1) * 0.001 + 0.01) * tc2;
	acc += sin(n(h) * 0.35) / dot( h, h ) ;
	vel += acc;
}

vec4 i2p( vec3 ro, inout vec3 vel ) {
	vec3 pos = ro;
	vel *= 1.31;

	for( int i = 0; i < 3; i++ ) {
		cv( pos, vel );
		pos = pos + vel;
	}

	vec4 pi = pI( pos, vel, pl );
	return pi;
}

vec3 colpal2( in float t ) {
	t = f(t - ut * 0.048);
	return vec3(0.5,0.0,0.5) + 0.5*cos(6.2318*(t+vec3(0,33,0.67)));
}

vec2 p( in vec2 x ) {
	vec2 h = f(x/2.0)-0.5;
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
	vec2 i = 2.0 * ( l( f((uv-0.5)*0.5) - 0.5 ) - l(f((uv+0.5)*0.5)-0.5) ) / f(uv);
	float r = l(i);
	r = 1. - r;
	r = clamp(r, 0., 1.);
	r = mix( r, 0.28, min(l(fwidth(uv)),0.9));
	return r;
}

float grid( vec2 uv ) {
	vec2 w = fwidth(uv) + 0.2;
	vec2 i = 2.0 * ( l( f((uv-0.5)*0.5) - 0.5 ) - l(f((uv+0.5)*0.5)-0.5) ) / w;
	float r = l((f(i*0.5) - 0.5)*2.9);
	r = l(i);
	r = 1. - r;
	r = clamp(r, 0., 1.);
	r = mix( r, 0.28, min(l(fwidth(uv)),0.9));
	return r;
}

float tiles( vec2 uv ) {
	vec2 w = fwidth(uv) + 0.1;
	vec2 i = 2.0 * ( l( f((uv-0.5*w)*0.5) - 0.5 ) - l(f((uv+0.5*w)*0.5)-0.5) ) / w;
	float r = l((f(i*0.5) - 0.5)*2.9);
	r = l(i);
	r = 1. - r;
	r = clamp(r, 0., 1.);
	r = mix( r, 0.28, min(l(fwidth(uv)),0.9));
	return r;
}

float dots( vec2 uv, float mod ) {
	float r = l( f(uv) * 2. - 1. );
	float w = l(fwidth(uv));
	r = 1. - r;
	r = mix( r, 0.25, min(w,1.));
	return r;
}

float quadFade( vec4 sig1234, float t ) {
	float t1 = 1.0 - 2.0 * abs( f( t ) - 0.5 );
	t1 = 2. * max( -0.0, t1 - 0.5 );
	t1 = smoothstep(0., 1., t1);
	float t2 = 1.0 - 2.0 * abs( f( t - 0.25 ) - 0.5 );
	t2 = 2. * max( -0.0, t2 - 0.5 );
	t2 = smoothstep(0., 1., t2);
	float t3 = 1.0 - 2.0 * abs( f( t - 0.5 ) - 0.5 );
	t3 = 2. * max( -0.0, t3 - 0.5 );
	t3 = smoothstep(0., 1., t3);
	float t4 = 1.0 - 2.0 * abs( f( t - 0.75 ) - 0.5 );
	t4 = 2. * max( -0.0, t4 - 0.5 );
	t4 = smoothstep(0., 1., t4);
	float c = t1*sig1234.x + t2*sig1234.y + t3*sig1234.z + t4*sig1234.w;
	return c;
}

vec3 pC( vec4 pi ) {
	vec3 color = vec3(0.);
	float c1 = dots( pi.xy * 1.0, 2. );
	float c2 = grid( pi.xy * 1. );
	float c3 = tiles( pi.xy * 2. );
	float c4 = checkers2( pi.xy * 1. );
	float t = ut * 0.07;
	float c = quadFade( vec4(c1,c2,c3,c4), t);
	color = vec3(c1);
	pi.w = dot( n(vec3(0,0,1)), n(vec3(pi.xy,1.)));
	color *= colpal2( f(1. - pi.w + 0.98) );
	color += pow(dot( n(pl.xyz-vec3(pi.xy, 0.0)), pl.xyz ), 16.);
	color = pow( color, vec3(0.666) );
	return color;
}

float gL( vec3 ro, vec3 rd, vec3 lp ) {
	vec4 pir = pI( ro, rd, pl );
	vec3 lo = lp - pir.xyz;
	vec3 co = ro - pir.xyz;
	vec3 ha = (lo - co) * 0.5;
	float spec = dot( n(ha), n(co) );
	spec = pow(spec, 30.);
	spec = pow(spec, 30.);
	return spec;
}

void pR(inout vec2 p, float a) {
	p = cos(a)*p + sin(a)*vec2(p.y, -p.x);
}

vec4 s = vec4( 5.5 * tc3.x, 5.5 * -tc3.y, 4. + tc2.x, 2);
vec4 s2 = vec4( -s.x, -s.y, 4. - tc2.x, 2);

vec3 sC( vec4 s, vec4 si, vec3 ro ) {
	vec3 color = vec3(0.0);
	vec3 n = n(si.xyz - s.xyz);
	vec3 ci = n(ro - si.xyz);
	vec3 lp = vec3( 2, 1, 3);
	vec3 l = n( lp - si.xyz);
	color += max(0.,dot( ci, n ));
	color = pow( color, vec3(1.2) );
	vec3 r = -ci - 2. * dot(-ci, n) * n;
	vec4 pi = pI( si.xyz, r, pl );
	color = mix( color, pC(pi), 0.6);
	return color;
}

vec3 gPC( vec2 fragCoord ) {
	vec2 uv=(fragCoord-.5*u_resolution.xy)/u_resolution.y;
	vec3 ro=vec3(0,0,3.9);
	vec3 rd = n(vec3(uv * 2.,-1.0));
	pR( rd.yz, -PI * m.y);
	pR( rd.xy, PI * m.x);

	vec3 c = v3;
	vec4 pi = i2p( ro, rd );
	vec4 sip = sI( ro, n(rd), s2 );
	vec4 si = sI( ro, n(rd), s );

	if( si.w >= 0. || sip.w >= 0. ) {
		if( sip.w > 0. ) c = sC( s2, sip, ro );
		if( si.w > 0. ) c = sC( s, si, ro );
	} else {
		if( pi.w > -0. ) {
			vec3 cp = n(ro - pi.xyz);
			vec3 cp2 = pl.xyz;
			pi.w = clamp(dot( cp, cp2 ), 0., 1.);
			c=pC( pi );
			float r = 0.;
			vec3 lp = vec3( r + 1. * tc2.x, r + 1. * tc2.y, 1 ) - pl.xyz;
			c += pow(gL( ro, rd, lp), 30.);
		}
	}
	return c;
}

void main() { gl_FragColor=vec4(gPC( gl_FragCoord.xy ),1.); }
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

#define PI 3.14159
#define ut u_time
// #define ut u_mouse.x*5.
#define n(x) normalize(x)
#define l(x) length(x)
#define f(x) fract(x)
#define v3 vec3(0)
#define inf 1./0.
#define sb 0.5

vec2 m=u_mouse / u_resolution * vec2(1,-1);
float t=ut*0.2;
vec2 tc1=vec2(cos(t*PI*0.5),sin(t*PI*0.5));
vec2 tc2=vec2(cos(t*PI),sin(t*PI));
vec2 tc3=vec2(cos(ut*PI*0.125),sin(ut*PI*0.125));

float pD(vec3 ro,vec3 rd,vec4 p) {
	return -(dot(ro,p.xyz)+p.w)/dot(rd,p.xyz);
}

vec4 pI(vec3 ro,vec3 rd,vec4 p) {
	float d=pD(ro,rd,p);
	return vec4(ro+rd*d,d);
}

float sD(vec3 ro,vec3 rd,vec4 sph) {
	vec3 oc=ro-sph.xyz;
	float b=dot(oc,rd);
	float c=dot(oc,oc)-sph.w*sph.w;
	float h=b*b-c;
	if(h<0.0) return -1.0;
	return -b-sqrt(h);
}

vec4 sI(vec3 ro,vec3 rd,vec4 sph) {
	vec4 i=vec4(-1.);
	float d=sD(ro,rd,sph);
	if(d > 0.) { i.xyz=ro+rd*d; i.w=d; }
	return i;
}

vec4 pl=vec4(n(vec3(0, 0, 3)),3.9);
// vec4 pl=vec4(n(vec3(tc3.x, tc3.y, 3)),2.9);
vec4 pl2=vec4(n(vec3(0,0,-1)),1.9);

void cv(vec3 pos,inout vec3 vel) {
	// return;
	vec3 acc=v3;
	vec3 h=vec3(-0,0,-pl.w+1.7)-pos;
	h.xy += 1.2*tc2;
	acc+=sin(n(h)*PI*0.1)*0.1 / dot(h,h) ;

	h=vec3(0,0,3)-pos;
	float tt = sin(t)*0.5+0.5;
	h.z += 3.*tt;
	acc += n(h) * 8. * tt/ dot(h,h) ;

	h=vec3(0,0,-pl.w+1.)-pos;
	h.z += 0.61*tc1.x;
	h.xy += (sin(ut*5.1)*0.0005+0.01)*tc2;
	acc += sin(n(h)*0.35)*2. / dot(h,h) ;
	vel += acc;
}

vec4 i2p(vec3 ro,inout vec3 v) {
	vec3 rd = n(v);
	vec3 pos = ro;
	for(int i=0; i < 3; i++) { cv(pos,v); pos=pos+v; }
	return pI(ro,n(v),pl);
}

vec3 pal(float t) {
	t=f(t-ut*0.048);
	return vec3(0.5,0.0,0.5)+0.5*cos(6.2318*(t+vec3(0,0,0.67)));
}

float tex(vec2 uv) {
	float r=l(f(uv)*2.-1.);
	float w=l(fwidth(uv));
	return mix(1.-r,0.25,min(w,1.));
}

float chex(vec2 uv) {
	vec2 w = fwidth(uv) + 0.001;
	vec2 i = 2.0*(abs(f((uv-0.5*w)*0.5)-0.5)-abs(f((uv+0.5*w)*0.5)-0.5))/w;
	return 0.5 - 0.5*i.x*i.y;
}

vec2 p( in vec2 x ) { vec2 h = fract(x/2.0)-0.5; return x*0.5 + h*(1.0-2.0*abs(h)); }

float checkers2(vec2 uv)
{
	vec2 w = fwidth(uv) + 0.001;
	vec2 i = (p(uv+w)-2.0*p(uv)+p(uv-w))/(w*w);
	return 0.5 - 0.5*i.x*i.y;
}

vec4 s=vec4(5.5*tc3.x,5.5*-tc3.y,0.+4.*tc2.x,2);
vec4 s2=vec4(-s.x,-s.y,0.-4.*tc2.x,2);

vec3 pC(vec4 pi, vec4 p) {
	vec3 c=vec3(0);
	if( pi.w < 0. ) return c;
	c += tex(pi.xy);
	pi.w=dot(n(vec3(0,0,1)),n(vec3(pi.xy,1)));
	c *= pal(f(-pi.w));
	float sl = 1. / min(pow(sD(pi.xyz, n(s.xyz - pi.xyz), s), 2.),1000.);
	float sl2 = 1. / min(pow(sD(pi.xyz, n(s2.xyz - pi.xyz), s2), 2.),1000.);
	c *= (sl + sl2) * 1.;
	if( p == pl ) c += pow(dot(n(vec3(pi.xy,1)),pl.xyz),16.);
	c *= pow(pi.w,0.5);
	return pow(c,vec3(0.666));
}

void pR(inout vec2 p,float a) {
	p=cos(a)*p+sin(a)*vec2(p.y,-p.x);
}

vec4 sSC(vec4 sp,vec4 si,vec3 ro) {
	vec3 c=v3;
	float d;
	vec3 n=n(si.xyz-sp.xyz);
	vec3 ci=n(ro-si.xyz);
	vec3 lp=0. - (pl.xyz * pl.w);
	vec3 l=n(lp-si.xyz);
	c += max(0.,dot(l,n)) * 0.5;
	vec3 r=-ci-2.*dot(-ci,n)*n;
	vec4 pi=pI(si.xyz,r,pl);
	vec4 pi2=pI(si.xyz,r,pl2);
	if( pi2.w > pi.w ) {
		c = mix(c,pC(pi2,pl2),sb);
		d = pi2.w;
	} else {
		c = mix(c,pC(pi,pl),sb);
		d = pi.w;
	}
	return vec4(c, d);
}

vec3 sC(vec4 sp,vec4 si,vec3 ro) {
	vec3 sc=v3;
	vec3 c;
	vec3 n=n(si.xyz-sp.xyz);
	vec3 ci=n(ro-si.xyz);
	vec3 lp=0. - (pl.xyz * pl.w);
	vec3 l=n(lp-si.xyz);
	sc += max(0.,dot(l,n)) * 0.5;
	vec3 r=-ci-2.*dot(-ci,n)*n;
	vec4 so = s;
	if( sp.x == s.x ) so = s2;
	float md = inf;
	vec4 si2 = sI(si.xyz, n(r), so);
	vec4 pi=pI(si.xyz,r,pl);
	vec4 pi2=pI(si.xyz,r,pl2);
	c = mix(sc,pC(pi,pl),sb);
	md = pi.w;
	if( pi2.w > pi.w ) {
		c = mix(sc,pC(pi2,pl2),sb);
		md = pi2.w;
	}
	vec4 osc = sSC(so, si2, si.xyz);
	if( si2.w > 0. && si2.w < md ) {
		md = si2.w;
		c = mix(sc,osc.xyz,sb);
	}

	return c;
}

float gL(vec3 ro,vec3 rd) {
	vec4 pi=pI(ro,rd,pl);
	vec3 lo=vec3(tc2,pl.w)-pi.xyz;
	vec3 co=ro-pi.xyz;
	vec3 ha=(lo-co)*0.5;
	float spec=dot(n(ha),n(co));
	spec=pow(spec,30.);
	spec=pow(spec,30.);
	spec=pow(spec,30.);
	return spec;
}

vec3 gPC(vec2 fc) {
	vec2 uv=(fc-.5*u_resolution.xy)/u_resolution.y;
	vec3 ro=vec3(8,0,0);
	vec3 rd=n(vec3(uv*2.,-1.0));
	// rd.z *= 1.61;
	pR(rd.yz,PI*m.y);
	// pR(rd.xy,2.*PI*m.x + t*0.5);
	pR(rd.xy,2.*PI*m.x);

	vec3 c=v3;
	vec4 pi=i2p(ro,rd);
	vec4 pi2 = pI( ro, n(rd), pl2 );
	vec4 sip=sI(ro,n(rd),s2);
	vec4 si=sI(ro,n(rd),s);
	float md = inf;
	if(sip.w > 0. && sip.w < md ) { md = sip.w; c=sC(s2,sip,ro); }
	if(si.w > 0. && si.w < md ) { md = si.w; c=sC(s,si,ro); }
	if(pi2.w > 0. && pi2.w < md ) {
		md = pi2.w;
		c+=pC(pi2,pl2);
		// c += pow(gL(ro,rd),30.);
	}
	if(pi.w > 0. && pi.w < md ) {
		md = pi.w;
		c+=pC(pi,pl);
		c += gL(ro,rd);
	}
	return c;
}

void main() { gl_FragColor=vec4(gPC(gl_FragCoord.xy),1.); }
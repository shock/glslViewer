uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

#define PI 3.14159265
#define ut (u_time * 1.)
#define n(x) normalize(x)
#define l(x) length(x)
#define f(x) fract(x)
#define v3 vec3(0)
#define sb 0.5
#define rv(x) (vec2(cos(x),sin(x)))

vec2 m=u_mouse / u_resolution * vec2(1,-1);
float t=ut*0.2;
vec2 tc1=rv(t*PI*0.5);
vec2 tc2=rv(t*PI);
vec2 tc3=rv(ut*PI*0.125);

float pD(vec3 ro,vec3 rd,vec4 p) {
	return -(dot(ro,p.xyz)+p.w)/dot(rd,p.xyz);
}

vec4 pI(vec3 ro,vec3 rd,vec4 p) {
	float d=pD(ro,rd,p);
	return vec4(ro+rd*d,d);
}

float sD(vec3 ro,vec3 rd,vec4 sph) {
	vec3 oc=ro-sph.xyz;
	float b=dot(oc,rd), c=dot(oc,oc)-sph.w*sph.w, h=b*b-c;
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
vec4 pl2=vec4(n(vec3(0,0,-1)),1.9);
vec4 s=vec4(5.5*tc3.x,5.5*-tc3.y,0.+4.*tc2.x,1.9);
vec4 s2=vec4(-s.x,-s.y,0.-4.*tc2.x,1.9);

void cv(inout vec3 pos,inout vec3 vel) {
	vec3 h=s.xyz-pos,h2=s2.xyz-pos;
	vel+=n(h)/dot(h,h)+n(h2)/dot(h2,h2); pos+=vel;
}

vec4 i2p(vec3 ro,inout vec3 v) {
	vec3 pos=ro;
	cv(pos,v); cv(pos,v); cv(pos,v);
	cv(pos,v); cv(pos,v); cv(pos,v);
	return pI(ro,n(v),pl);
}

vec3 pal(float t) {
	t=f(t-ut*0.048);
	return vec3(0.5,0.0,0.5)+0.5*cos(6.2318*(t+vec3(0,0,0.67)));
}

float tex(vec2 uv) {
	return mix(1.-l(f(uv)*2.-1.),0.25,min(l(fwidth(uv)),1.));
}

vec3 pC(vec4 pi, vec4 p) {
	vec3 c=vec3(0);
	if(pi.w<0.) return c;
	c += tex(pi.xy+vec2(t,tc1.y)*vec2(sign(pi.z)));
	pi.w=dot(n(vec3(0,0,1)),n(vec3(pi.xy,1)));
	c *= pal(f(-pi.w));
	float sl=1./min(pow(sD(pi.xyz,n(s.xyz-pi.xyz),s),2.),10.);
	float sl2=1./min(pow(sD(pi.xyz,n(s2.xyz-pi.xyz),s2),2.),10.);
	c *= (sl+sl2)*1.;
	if(p==pl) c+=pow(dot(n(vec3(pi.xy,1)),pl.xyz),16.);
	// c *= pow(pi.w,0.5);
	return pow(c,vec3(0.666));
}

void pR(inout vec2 p,float a) {
	p=cos(a)*p+sin(a)*vec2(p.y,-p.x);
}

vec3 sC(vec4 sp,vec4 si,vec3 ro) {
	vec3 sc=v3, c, c2;
	vec3 n=n(si.xyz-sp.xyz),ci=n(si.xyz-ro);
	vec3 lp=0.-(pl.xyz*pl.w),l=n(lp-si.xyz);
	sc += max(0.,dot(l,n)) * 0.5;

	vec3 r=reflect(ci,n);
	vec4 pi=pI(si.xyz,r,pl), pi2=pI(si.xyz,r,pl2);
	c = mix(sc,pC(pi,pl),sb);
	c2 = mix(sc,pC(pi2,pl2),sb);
	float md = pi.w;
	if( pi2.w > pi.w ) { c = c2; md = pi2.w; }

	vec4 so=s;
	if(sp.x == s.x) so = s2;
	sp=so; ro=si.xyz; si=sI(si.xyz,n(r),so);

	if( si.w > 0. && si.w < md ) {
		vec3 osc=v3, osc2 = v3;
		n=n(si.xyz-sp.xyz),ci=n(si.xyz-ro);
		lp=-(pl.xyz*pl.w),l=n(lp-si.xyz);
		osc += max(0.,dot(l,n)) * 0.5;
		r=reflect(ci,n);
		pi=pI(si.xyz,r,pl),pi2=pI(si.xyz,r,pl2);
		osc = mix(osc,pC(pi,pl),sb);
		osc2 = mix(osc,pC(pi2,pl2),sb);
		if( pi2.w > pi.w ) { osc = osc2; }
		c = mix(sc,osc,sb);
	}
	return c;
}

vec3 gPC(vec2 uv) {
	vec3 ro=vec3(0,7.2,0), rd=n(vec3(uv*2.,-1.0));
	vec3 c=v3;
	pR(rd.yz,PI*(m.y-0.5));
	pR(rd.xy,2.*PI*(m.x-0.5));

	vec4 pi=i2p(ro,rd), pi2=pI(ro,n(rd),pl2);
	vec4 sip=sI(ro,n(rd),s2), si=sI(ro,n(rd),s);
	float md=1./0.;
	if(sip.w>0. && sip.w<md) {md=sip.w; c=sC(s2,sip,ro);}
	if(si.w>0. && si.w<md) {md=si.w; c=sC(s,si,ro);}
	if(pi2.w>0. && pi2.w<md) {md=pi2.w; c+=pC(pi2,pl2);}
	if(pi.w>0. && pi.w<md) {md=pi.w; c+=pC(pi,pl);}
	c *= exp( -0.05*md );

	return c;
}

vec3 hash3( float n ) { return fract(sin(vec3(n,n+1.0,n+2.0))*43758.5453123); }

void main() {
	vec2 uv=(gl_FragCoord.xy-.5*u_resolution.xy)/u_resolution.y;
	vec2 q = gl_FragCoord.xy / u_resolution.xy;
	vec3 col = gPC(uv.xy);
	//-----------------------------------------------------
  // postprocess
  //-----------------------------------------------------

  // gama
  col = pow( col, vec3(0.44,0.5,0.55) );

  // contrast
  col = mix( col, smoothstep( 0.0, 1.0, col ), 0.5 );

  // saturate
  col = mix( col, vec3(dot(col,vec3(0.333))), -0.2 );

  // vigneting
  col *= 0.2 + 0.8*pow(16.0*q.x*q.y*(1.0-q.x)*(1.0-q.y),0.2);

  // dithering
  col += (1.0/255.0)*hash3(q.x+13.3214*q.y);

	gl_FragColor=vec4(col,1.);
}
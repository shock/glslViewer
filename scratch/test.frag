// precision highp float;

uniform vec2 u_resolution;// Width & height of the shader
uniform float u_time;// Time elapsed
uniform vec2 u_mouse;// Mouse screen pos

// Constants
#define PI 3.1415925359
#define MAX_STEPS 100// Mar Raymarching steps
#define MAX_DIST 100.// Max Raymarching distance
#define SURF_DIST.001// Surface Distance

#include "include.frag"
#include "camera.frag"

const vec4 GroundColor = vec4(1.0, 0.5, 1.0, 1.0);
const vec4 BoxColor = vec4(0,0,1,1);

float colorIntensity = 1.;
float ambientLight = 0.2;
vec3 difColor = vec3(1.0, 1.0, 1.0); // Diffuse Color

/// Functions

float GetDist(vec3 p)
{

    pMod1(p.x, 1.5);
    pMod1(p.z, 2.5);
    // Box
    vec3 b0p = vec3(0,0.5,0);
    b0p = p - b0p;
    // b0p.xy *= Rotate(u_time);
    // b0p.xz *= Rotate(u_time);
    float b0 = fBoxRound(b0p,vec3(.5,.5,.5),.1);

    vec3 s0p = vec3( 0, 0., 0);
    s0p = p - s0p;
    float s0 = fSphere(s0p, 0.5);
    // Plane
    float p0 = fPlane(p, vec3(0,1,0), 0.0);

    // Scene
    float scene = p0;

    // scene = fOpUnionChamfer(p0,b0, 0.1);
    scene = fOpUnionRound( scene, b0, 0.1);
    // scene = fOpUnionRound( scene, s0, 0.1);
    return scene;
}

float RayMarch(vec3 ro,vec3 rd)
{
    float dO=0.;//Distane Origin
    int i = 0;
    for( ; i < MAX_STEPS; i++ ) {

        if(dO>MAX_DIST)
            break;

        vec3 p=ro+rd*dO;
        float ds=GetDist(p);// ds is Distance Scene

        if(ds<SURF_DIST)
        {
            break;
        }
        dO+=ds;

    }
    // if( i == MAX_STEPS ) { return MAX_DIST; }
    return dO;
}

vec3 GetNormal(vec3 p)
{
    float d=GetDist(p);// Distance
    vec2 e=vec2(.01,0);// Epsilon

    vec3 n=d-vec3(
        GetDist(p-e.xyy),// e.xyy is the same as vec3(.01,0,0). The x of e is .01. this is called a swizzle
        GetDist(p-e.yxy),
        GetDist(p-e.yyx));

    return normalize(n);
}

// p - surface point, n - surface normal, d - ao factor
float ao(vec3 p, vec3 n, float k) {
	float o = 1.;

    o -= ( 1. * k - GetDist( p + n * 1. * k ) ) / exp2( 1. );
    o -= ( 2. * k - GetDist( p + n * 2. * k ) ) / exp2( 2. );
    o -= ( 3. * k - GetDist( p + n * 3. * k ) ) / exp2( 3. );
    o -= ( 4. * k - GetDist( p + n * 4. * k ) ) / exp2( 4. );
    o -= ( 5. * k - GetDist( p + n * 5. * k ) ) / exp2( 5. );

	return o;
}


float GetLight(vec3 p, vec3 ro)
{
    // Directional light
    // vec3 lightPos=vec3(0. + 5.*sin(u_time*0.3),5.,0.0+5.*cos(u_time*0.3));// Light Position
    vec3 lightPos=vec3(2, 5, 1);// Light Position

    vec3 l = normalize( lightPos - p ); // Light Vector
    vec3 c = normalize( ro - p );       // camera vector
    vec3 n = GetNormal( p );            // Normal Vector

    float dif=dot(n,l);// Diffuse light

    dif=clamp(dif,0.,1.);// Clamp so it doesnt go below 0

    // Shadows
    float d = RayMarch( p + n * SURF_DIST * 2.0, l );

    if ( d < length(lightPos-p) ) {
        // shadow
        dif*=.1;
    } else {
        // specular
        vec3 halfAngle = normalize((l + c) * 0.5);
        float spec = dot( halfAngle, n );
        spec = pow( spec, 16.0 );
        spec = pow( spec, 16.0 );
        dif += spec;
    }

    dif = dif * ( 1. - ambientLight ) + ambientLight;
    dif *= ao( p, n, 0.1 );

    return dif;
}

void main()
{
    vec2 uv=(gl_FragCoord.xy-.5*u_resolution.xy)/u_resolution.y;
    vec2 mPos = u_mouse / u_resolution - 0.5;
    mat2 camRot = Rotate( mPos.x * 2.0 * PI );

    vec3 ro=vec3(0,2,3.5);// Ray Origin/Camera
    vec3 rd=normalize(vec3(uv.x,uv.y,-1));// Ray Direction

    cameraPos( uv, ro, rd );

    float d=RayMarch(ro,rd);// Distance

    vec3 p=ro+rd*d;
    float light = GetLight(p, ro);
    // float originDistance = length( p );
    float originDistance = d;

    // grid guide
    // if( fract(p.x * 2.) < 0.05 || fract(p.z * 2.) < 0.05 ) { light = 0.; }

    if( originDistance >= MAX_DIST ) { light = 0.; }
    vec3 color=vec3(light);// Diffuse lighting

    // Set the output color
    gl_FragColor=vec4(color,1.);
}

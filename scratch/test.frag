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
float ambientLight = 0.3;
vec3 difColor = vec3(1.0, 1.0, 1.0); // Diffuse Color

/// Functions

float GetDist(vec3 p)
{

    pMod1(p.x, 2.);
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
    for(int i=0;i<MAX_STEPS;i++)
    {
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

float GetLight(vec3 p)
{
    // Directional light
    // vec3 lightPos=vec3(0. + 5.*sin(u_time*0.3),5.,0.0+5.*cos(u_time*0.3));// Light Position
    vec3 lightPos=vec3(1, 5, 1);// Light Position

    vec3 l=normalize(lightPos-p);// Light Vector
    vec3 n=GetNormal(p);// Normal Vector

    float dif=dot(n,l);// Diffuse light

    dif=clamp(dif,0.,1.);// Clamp so it doesnt go below 0

    // Shadows
    float d=RayMarch(p+n*SURF_DIST*2.,l);

    if(d<length(lightPos-p))dif*=.1;

    dif = dif * ( 1. - ambientLight ) + ambientLight;
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
    float light = GetLight(p);
    float originDistance = length( p );

    if(
        // fract(originDistance * 5.) < 0.05 ||
        fract(p.x * 2.) < 0.05 ||
        fract(p.z * 2.) < 0.05 ||
        // fract(p.y * 2.) < 0.05 ||
        originDistance > MAX_DIST
    ) { light = 0.; }
    vec3 color=vec3(light);// Diffuse lighting

    // Set the output color
    gl_FragColor=vec4(color,1.);
}

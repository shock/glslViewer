// precision highp float;

uniform vec2 u_resolution;// Width & height of the shader
uniform float u_time;// Time elapsed
uniform vec2 u_mouse;// Mouse screen pos

// Constants
#define PI 3.1415925359
#define MAX_STEPS 100// Mar Raymarching steps
#define MAX_DIST 100.// Max Raymarching distance
#define SURF_DIST.01// Surface Distance

#include "include.frag"

const vec4 GroundColor = vec4(1.0, 0.5, 1.0, 1.0);
const vec4 BoxColor = vec4(0,0,1,1);

float colorIntensity = 1.;
float ambientLight = 0.3;
vec3 difColor = vec3(1.0, 1.0, 1.0); // Diffuse Color

mat2 Rotate(float a) {
    float s=sin(a);
    float c=cos(a);
    return mat2(c,-s,s,c);
}

/// Functions


///////////////////////
// Boolean Operators
///////////////////////

vec4 intersectSDF(vec4 a, vec4 b) {
    return a.w > b.w ? a : b;
}

vec4 unionSDF(vec4 a, vec4 b) {
    return a.w < b.w? a : b;
}

vec4 differenceSDF(vec4 a, vec4 b) {
    return a.w > -b.w? a : vec4(b.rgb,-b.w);
}

vec4 GetDist(vec3 p)
{

    pMod1(p.x, 10.);
    // Box
    vec3 b0p = vec3(0,0.5,0);
    b0p = p - b0p;
    // b0p.xy *= Rotate(u_time);
    // b0p.xz *= Rotate(u_time);
    vec4 b0 = vec4(BoxColor.rgb,fBoxRound(b0p,vec3(.5,.5,.5),.1));

    // Plane
    vec4 p0 = vec4(GroundColor.rgb,fPlane(p,vec3(0,1,0),0.));

    // Scene
    vec4 scene = vec4(0);
    scene = unionSDF(p0,b0);

    return scene;
}

float RayMarch(vec3 ro,vec3 rd, inout vec3 dColor)
{
    float dO=0.;//Distane Origin
    for(int i=0;i<MAX_STEPS;i++)
    {
        if(dO>MAX_DIST)
            break;

        vec3 p=ro+rd*dO;
        vec4 ds=GetDist(p);// ds is Distance Scene

        if(ds.w<SURF_DIST)
        {
            dColor = ds.rgb;
            break;
        }
        dO+=ds.w;

    }
    return dO;
}

vec3 GetNormal(vec3 p)
{
    float d=GetDist(p).w;// Distance
    vec2 e=vec2(.01,0);// Epsilon

    vec3 n=d-vec3(
        GetDist(p-e.xyy).w,// e.xyy is the same as vec3(.01,0,0). The x of e is .01. this is called a swizzle
        GetDist(p-e.yxy).w,
        GetDist(p-e.yyx).w);

    return normalize(n);
}

vec3 GetLight(vec3 p, vec3 c)
{
    // Diffuse Color
    vec3 color = c.rgb * (colorIntensity);

    // Directional light
    vec3 lightPos=vec3(0. + 5.*sin(u_time*0.3),5.,0.0+5.*cos(u_time*0.3));// Light Position

    vec3 l=normalize(lightPos-p);// Light Vector
    vec3 n=GetNormal(p);// Normal Vector

    float dif=dot(n,l);// Diffuse light

    dif=clamp(dif,0.,1.);// Clamp so it doesnt go below 0

    // Shadows
    float d=RayMarch(p+n*SURF_DIST*2.,l,difColor);

    if(d<length(lightPos-p))dif*=.1;

    dif = dif * ( 1. - ambientLight ) + ambientLight;
    color = color * dif;
    return color;
}

void main()
{
    vec2 uv=(gl_FragCoord.xy-.5*u_resolution.xy)/u_resolution.y;
    vec2 mPos = u_mouse / u_resolution - 0.5;
    mat2 camRot = Rotate( mPos.x * 2.0 * PI );

    vec3 ro=vec3(0,2,4);// Ray Origin/Camera
    ro.y += (mPos.y) * 4.;
    vec3 rd=normalize(vec3(uv.x,uv.y,-1));// Ray Direction
    ro.xz *= camRot;
    rd.xz *= camRot;
    float d=RayMarch(ro,rd,difColor);// Distance

    vec3 p=ro+rd*d;
    vec3 color=GetLight(p,difColor);// Diffuse lighting

    // Set the output color
    gl_FragColor=vec4(color,1.);
}

#ifndef I_CAMERA
#define I_CAMERA

#include "include.frag"

void cameraPos( vec2 uv, inout vec3 ro, inout vec3 rd ) {

  vec2 mPos = u_mouse / u_resolution - 0.5;
  float camY = mPos.y;
  camY += 0.5;
  camY *= 4.;
  camY *= camY;
  camY -= 1.;
  ro.y += camY;

  mat2 camXZRot = Rotate( mPos.x * 2.0 * PI );

  vec3 cl = ro - vec3(0, 1, 0 );
  float pitch = atan( cl.y, cl.z );
  mat2 camYZRot = Rotate( pitch );

  ro.xz *= camXZRot;

  rd.yz = camYZRot * rd.yz;
  rd.xz *= camXZRot;

  normalize(rd);

}

#endif
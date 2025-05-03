#pragma once

#include <string>

const std::string wireframe3D_vert = R"(#version 410
#ifdef GL_ES
precision mediump float;
#endif

uniform mat4    u_modelViewProjectionMatrix;
in vec4  a_position;

void main(void) {
    gl_Position = u_modelViewProjectionMatrix * a_position;
}
)";

const std::string wireframe3D_frag = R"(#version 410
#ifdef GL_ES
precision mediump float;
#endif

uniform vec4 u_color;

out vec4 out_Color;

void main(void) {
    out_Color = u_color;
}
)";

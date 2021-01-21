#pragma once

#include <string>

static const std::string error_vert = R"(#version 410 core

#ifdef GL_ES
precision mediump float;
#endif

uniform mat4 u_modelViewProjectionMatrix;

in vec3  a_position;
out vec3    v_position;

void main(void) {
    v_position = a_position;
    gl_Position = u_modelViewProjectionMatrix * vec4(v_position,1.0);
}
)";

static const std::string error_frag = R"(#version 410
#ifdef GL_ES
precision mediump float;
#endif

out vec4 out_Color;

void main(void) {
    vec3 color = vec3(1.0, 0.0, 1.0);
    out_Color = vec4(color, 1.0);
}
)";

#pragma once

#include <string>

const std::string wireframe2D_vert = R"(#version 410
#ifdef GL_ES
precision mediump float;
#endif

// wireframe2D.h

uniform mat4 u_modelViewProjectionMatrix;
uniform vec2 u_translate;
uniform vec2 u_scale;
in vec4 a_position;

void main(void) {
    vec4 position = a_position;
    position.xy *= u_scale;
    position.xy += u_translate;
    gl_Position = u_modelViewProjectionMatrix * position;
})";

const std::string wireframe2D_frag = R"(#version 410
#ifdef GL_ES
precision mediump float;
#endif

out vec4 out_Color;

uniform vec4 u_color;

void main(void) {
    out_Color = u_color;
})";

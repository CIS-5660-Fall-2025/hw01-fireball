#version 300 es
precision highp float;

in vec3 fs_WorldPos;
out vec4 out_Col;

uniform vec4 u_Color;
uniform float u_Time;

void main() {
    vec3 p = fs_WorldPos;
    float t = u_Time * 0.01;

    out_Col = vec4(u_Color.rgb, u_Color.a);
}


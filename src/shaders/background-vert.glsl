#version 300 es

uniform mat4 u_Model;
uniform mat4 u_ViewProj;

in vec4 vs_Pos;
in vec4 vs_Nor;

out vec2 fs_UV;

void main() {
    fs_UV = vs_Pos.xy;
    gl_Position = vs_Pos;
}
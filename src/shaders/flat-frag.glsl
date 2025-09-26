#version 300 es
precision highp float;

uniform vec3 u_Eye, u_Ref, u_Up;
uniform vec2 u_Resolution;
uniform float u_Time;

in vec2 fs_Pos;
out vec4 out_Col;

void main() {
  vec3 colorA = vec3(1.f, 0.f, 0.f);
  vec3 colorB = vec3(0.f, 0.f, 0.f);
  float scaledX = fs_Pos.x * u_Resolution.x;
  float scaledY = fs_Pos.y * u_Resolution.y;
  float mixFactor = cos(scaledX * 0.05f) * sin(scaledY * 0.05f) + (sin(u_Time * 0.005) + 0.5);
  vec3 outCol3 = mix(colorA, colorB, mixFactor);
  out_Col = vec4(outCol3, 1.f);
}

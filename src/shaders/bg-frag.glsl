#version 300 es
precision highp float;

uniform vec3 u_Eye, u_Ref, u_Up;
uniform vec2 u_Dimensions;
uniform float u_Time;

uniform sampler2D u_BackgroundTexture;

in vec2 fs_Pos;
out vec4 out_Col;

void main() {
  vec4 bgTex = texture(u_BackgroundTexture, gl_FragCoord.xy / u_Dimensions);
  out_Col = bgTex;
}

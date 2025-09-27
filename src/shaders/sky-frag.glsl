#version 300 es
precision highp float;

uniform sampler2D u_SkyTexture;
uniform float u_Time;

uniform vec2 u_Resolution; 
uniform vec2 u_TexResolution; 

uniform float u_FallSpeed;

out vec4 out_Col;

void main() {
    vec2 uv = gl_FragCoord.xy / u_TexResolution;

    uv.y -= u_Time * 0.001 * u_FallSpeed;
    out_Col = texture(u_SkyTexture, uv);
}
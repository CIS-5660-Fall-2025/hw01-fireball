#version 300 es

// The four corners of a full-screen quad
const vec2 positions[4] = vec2[](
    vec2(-1, -1),
    vec2( 1, -1),
    vec2(-1,  1),
    vec2( 1,  1)
);

out vec2 v_UV;

void main() {
    vec2 pos = positions[gl_VertexID];
    gl_Position = vec4(pos, 0.999, 1.0);
    
    v_UV = pos * 0.5 + 0.5;
}
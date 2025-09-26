#version 300 es

// Vertex shader for fullscreen quad
precision highp float;

in vec4 vs_Pos;

out vec2 fs_UV;

void main() {
    // Convert NDC position to UV coordinates (0 to 1)
    fs_UV = vs_Pos.xy * 0.5 + 0.5;
    
    // Pass through position unchanged
    gl_Position = vs_Pos;
}
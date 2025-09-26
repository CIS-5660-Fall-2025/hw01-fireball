#version 300 es
precision highp float;
uniform float u_Time;
in vec2 fs_UV;
out vec4 out_Col;

float noise(vec2 st) {
    vec2 i = floor(st), f = fract(st);
    f = f * f * (3.0 - 2.0 * f);
    float a = fract(sin(dot(i, vec2(12.0, 78.0))) * 43758.0);
    float b = fract(sin(dot(i + vec2(1,0), vec2(12.0, 78.0))) * 43758.0);
    float c = fract(sin(dot(i + vec2(0,1), vec2(12.0, 78.0))) * 43758.0);
    float d = fract(sin(dot(i + vec2(1,1), vec2(12.0, 78.0))) * 43758.0);
    return mix(mix(a,b,f.x), mix(c,d,f.x), f.y);
}

float ember(vec2 uv, float speed, float size) {
    return pow(noise(uv * size + vec2(0, u_Time * speed)), 8.0);
}

void main() {
    vec2 uv = fs_UV * 0.5 + 0.5;
    vec3 color = mix(vec3(0.1,0.05,0.05), vec3(0.15,0.1,0.1), uv.y);
    color += vec3(noise(uv * 3.0 + vec2(0, -u_Time * 0.05)) * 0.1);
    color += vec3(1,0.6,0.2) * (ember(uv, 0.2, 10.0) * 0.3 + 
                                ember(uv + 2.0, 0.15, 15.0) * 0.2 + 
                                ember(uv - 2.0, 0.25, 8.0) * 0.15);
    out_Col = vec4(color, 1.0);
}
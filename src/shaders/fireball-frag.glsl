#version 300 es
precision highp float;

uniform vec4 u_Color;
uniform vec4 u_Tint;
uniform float u_Emissive;

in vec4 fs_Nor;
in vec4 fs_LightVec;
in vec4 fs_Pos; 
in float fs_Disp;

out vec4 out_Col;

float parabola(float x, float k) {
    return pow(4.0 * x * (1.0 - x), k);
}

void main() {
    float shape = parabola(fs_Disp, 0.75);
    float temp = smoothstep(0.35, 0.95, fs_Disp);

    vec3 ember = vec3(0.05, 0.00, 0.00);
    vec3 outer = vec3(0.80, 0.10, 0.00);
    vec3 inner = vec3(1.00, 0.60, 0.00);
    vec3 core = vec3(1.00, 0.95, 0.60);

    float firHalf = smoothstep(0.10, 0.40, fs_Disp);
    float secHalf = smoothstep(0.45, 0.80, fs_Disp);

    vec3 lowTemp = mix(ember, outer, firHalf);
    vec3 highTemp = mix(inner, core, secHalf);
    vec3 col  = mix(lowTemp, highTemp, temp);

    float glow = mix(0.6, 1.0, shape);

    vec3 baseColor = col * u_Tint.rgb * (0.8 * u_Emissive * glow);

    out_Col = vec4(baseColor, 1.0);
}
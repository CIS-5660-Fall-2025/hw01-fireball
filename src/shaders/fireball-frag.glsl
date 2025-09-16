#version 300 es
precision highp float;
precision highp int;

uniform vec4 u_Color; 
uniform float u_Time;

in vec4 fs_Col;
in vec4 fs_Pos;
in float worleyVal;
in float sinVal;

out vec4 out_Col; 

float bias(float t, float b) {
    return pow(t, log(b) / log(0.5));
}

float pulse(float c, float w, float x) {
    float z = (x - c) / max(w, 1e-5);
    return exp(-z * z);
}

vec3 fireGradient(float t){
    vec3 c0 = vec3(0.05, 0.01, 0.00);
    vec3 c1 = vec3(0.80 * u_Color.x, 0.10 * u_Color.y, 0.00 * u_Color.z);
    vec3 c2 = vec3(1.00 * u_Color.x, 0.45 * u_Color.y, 0.00 * u_Color.z);
    vec3 c3 = vec3(1.00 * u_Color.x, 0.85 * u_Color.y, 0.20 * u_Color.z);
    vec3 c4 = vec3(1.00, 1.00, 1.00);

    if (t < 0.25)      return mix(c0, c1, t / 0.25);
    else if (t < 0.5)  return mix(c1, c2, (t - 0.25) / 0.25);
    else if (t < 0.75) return mix(c2, c3, (t - 0.5) / 0.25);
    else               return mix(c3, c4, (t - 0.75) / 0.25);
}

void main() {
    float t = bias(sin(u_Time * 2.0), 0.7);

    float c = 0.45 + 0.15 * sin(u_Time * 2.0);
    float p = pulse(c, 0.18, sinVal);
    vec3 col = worleyVal < 0.02 ? t * u_Color.xyz : u_Color.xyz * 0.0 + fireGradient(p);

    out_Col = vec4(col, 1.0);
}

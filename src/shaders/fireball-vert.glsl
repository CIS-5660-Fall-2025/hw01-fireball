#version 300 es
precision highp float;

in vec4 vs_Pos;
in vec4 vs_Nor;

uniform float u_Time;
uniform mat4 u_Model;
uniform mat4 u_ViewProj;
uniform float u_Amp;
uniform float u_Freq;

out float fs_Displacement;
out vec4 fs_Pos;

float hash(vec3 p) {
    return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
}

// Perlin Noise
float noise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    vec3 u = f * f * (3.0 - 2.0 * f);

    return mix(mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), u.x),
                   mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), u.x), u.y),
               mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), u.x),
                   mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), u.x), u.y), u.z);
}

// FBM function
float fbm(vec3 p) {
    float value = 0.0;
    float amplitude = u_Amp;
    float frequency = u_Freq;
    for (int i = 0; i < 5; i++) {
        value += amplitude * noise(p * frequency + vec3(u_Time * 0.5));
        frequency *= 2.0;
        amplitude *= 0.5;
    }
    return value;
}

void main() {
    float displacement = 0.0;

    // Low freq and high amp
    displacement += sin(4.0 * u_Freq * fbm(vs_Pos.xyz) + sin(u_Time) * 0.5 * u_Freq) * u_Amp * 0.5;

    // High freq and low amp
    displacement += cos(20.0 * u_Freq * fbm(vs_Pos.xyz) + cos(u_Time) * 2.0 * u_Freq) * u_Amp * 0.2;

    vec3 displacedPosition = vec3(vs_Pos) + vec3(vs_Nor) * displacement;

    fs_Displacement = displacement;
    fs_Pos = u_Model * vec4(displacedPosition, 1.0);

    gl_Position = u_ViewProj * fs_Pos;
}

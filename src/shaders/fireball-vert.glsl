#version 300 es

uniform mat4 u_Model;
uniform mat4 u_ModelInvTr;
uniform mat4 u_ViewProj;
uniform float u_Time;           
uniform float u_WaveAmplitude;  
uniform float u_WaveFrequency;  
uniform float u_NoiseScale;
uniform float u_NoiseIntensity;

in vec4 vs_Pos;
in vec4 vs_Nor;
in vec4 vs_Col;

out vec4 fs_Nor;
out vec4 fs_LightVec;
out vec4 fs_Col;
out vec4 fs_Pos;
out float fs_Displacement; // Pass displacement to fragment shader

const vec4 lightPos = vec4(5, 5, 3, 1);

// Toolbox Functions

// 1. Smooth step function for smooth transitions
float smoothstep_custom(float edge0, float edge1, float x) {
    float t = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
    return t * t * (3.0 - 2.0 * t);
}

// 2. Bias function to control curve shape
float bias(float b, float t) {
    return pow(t, log(b) / log(0.5));
}

// 3. Pulse function for localized effects
float pulse(float c, float w, float x) {
    x = abs(x - c);
    if (x > w) return 0.0;
    x /= w;
    return 1.0 - x * x * (3.0 - 2.0 * x);
}

// 4. Triangle wave function
float triangleWave(float x, float freq, float amplitude) {
    return abs((x * freq - floor(x * freq)) * amplitude - (0.5 * amplitude));
}

// Simple 3D noise function
float noise3D(vec3 p) {
    return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
}

// Fractal Brownian Motion (fBm) for higher frequency detail
float fbm(vec3 p, int octaves) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    
    for (int i = 0; i < octaves; i++) {
        value += amplitude * (noise3D(p * frequency) - 0.5);
        amplitude *= 0.5;
        frequency *= 2.0;
    }
    
    return value;
}

void main() {
    fs_Col = vs_Col;
    
    vec4 position = vs_Pos;
    vec3 normal = normalize(vs_Nor.xyz);
    
    vec3 spherePos = normalize(position.xyz);
    float heightFactor = (spherePos.y + 1.0) * 0.5;
    
    float topIntensity = pow(heightFactor, 1.5) * 3.0 + 0.5; 
    
    float time = u_Time * u_WaveFrequency;
    
    float wave1 = sin(spherePos.x * 1.5 + time) * 0.6;
    float wave2 = sin(spherePos.y * 2.0 + time * 0.8) * 0.5;
    float wave3 = sin(spherePos.z * 1.8 + time * 1.3) * 0.4;
    float wave4 = sin(dot(spherePos.xz, vec2(3.0, 2.5)) + time * 1.5) * 0.3;

    float crossWave = sin(spherePos.x * spherePos.z * 4.0 + time * 2.0) * 0.2;
    
    float lowFreqDisplacement = bias(0.2, (wave1 + wave2 + wave3 + wave4 + crossWave + 2.5) / 5.0) * u_WaveAmplitude * topIntensity;
    
    vec3 fbmInput = spherePos * u_NoiseScale * 2.0 + vec3(time * 0.15);
    float highFreqDisplacement = fbm(fbmInput, 6) * 0.25 * u_NoiseIntensity * topIntensity;
    
    vec3 fbmInput2 = spherePos * u_NoiseScale * 4.0 + vec3(time * 0.3, time * 0.2, time * 0.25);
    float chaosDisplacement = fbm(fbmInput2, 4) * 0.15 * u_NoiseIntensity * pow(heightFactor, 2.0);
    
    float pulseEffect = pulse(0.0, 1.2, sin(time * 3.0)) * 0.3 * topIntensity;
    
    float flamePulse = pulse(0.8, 0.4, heightFactor) * sin(time * 4.0 + spherePos.x * 8.0) * 0.4 * u_WaveAmplitude;
    
    float triangleVariation = triangleWave(
        length(spherePos.xy) * 12.0 + time * 2.0, 
        2.0, 
        0.1
    ) * u_NoiseIntensity * topIntensity;
    
    float spikePattern = triangleWave(atan(spherePos.z, spherePos.x) * 6.0 + time, 1.0, 0.3) * 
                         pow(heightFactor, 3.0) * u_WaveAmplitude;
    
    float totalDisplacement = lowFreqDisplacement + highFreqDisplacement + chaosDisplacement + 
                             pulseEffect + flamePulse + triangleVariation + spikePattern;

    totalDisplacement = smoothstep_custom(-0.5, 1.0, totalDisplacement) * 0.8 - 0.2;

    if (heightFactor > 0.7) {
        float explosionFactor = pow((heightFactor - 0.7) / 0.3, 2.0);
        float explosion = sin(time * 5.0 + spherePos.x * 10.0) * sin(time * 3.0 + spherePos.z * 8.0) * 
                         explosionFactor * 0.6 * u_WaveAmplitude;
        totalDisplacement += explosion;
    }
    
    fs_Displacement = totalDisplacement;
    
    position.xyz += normal * totalDisplacement;
    
    mat3 invTranspose = mat3(u_ModelInvTr);
    fs_Nor = vec4(invTranspose * normal, 0);

    vec4 modelPosition = u_Model * position;
    fs_Pos = modelPosition;

    fs_LightVec = lightPos - modelPosition;
    
    gl_Position = u_ViewProj * modelPosition;
}
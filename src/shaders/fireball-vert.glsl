#version 300 es
precision highp float;

uniform mat4 u_Model;
uniform mat4 u_ModelInvTr;
uniform mat4 u_ViewProj;
uniform float u_Time; 
uniform int u_Octave;

in vec4 vs_Pos;
in vec4 vs_Nor;
in vec4 vs_Col;

out vec4 fs_Nor;
out vec4 fs_LightVec;
out vec4 fs_Pos;
out float fs_Disp;

const vec4 lightPos = vec4(5, 5, 3, 1);

// ------------- low-freq, high-amp sin field -------------------
float multiSine(vec3 p, float freq, float phase) {
    // random directions for distortion
    const vec3 d0 = normalize(vec3( 1.0,  0.2,  0.1));
    const vec3 d1 = normalize(vec3(-0.3,  1.0,  0.15));
    const vec3 d2 = normalize(vec3( 0.2, -0.4,  1.0));
    const vec3 d3 = normalize(vec3(-0.6,  0.7, -0.3));
    const vec3 d4 = normalize(vec3( 0.4,  0.3, -0.8));

    float s  = sin(dot(p, d0) * freq + (phase * 1.00) + 0.00);
    s       += sin(dot(p, d1) * freq + (phase * 0.85) + 1.57);
    s       += sin(dot(p, d2) * freq + (phase * 1.10) + 3.14);
    s       += sin(dot(p, d3) * freq + (phase * 0.72) + 2.40);
    s       += sin(dot(p, d4) * freq + (phase * 0.95) + 0.90);
    return s / 5.0;  // scale back down to [-1,1]
}

// ------------- Perlin Bia & Gain --------------------------
float bias(float b, float t) {
    return pow(t, log(b) / log(0.5));
}

float gain(float g, float t) {
    if (t < 0.5)
        return bias(1.0 - g, 2.0 * t) / 2.0;
    else
        return 1.0 - bias(1.0 - g, 2.0 - 2.0 * t) / 2.0;
}

// ------------- high-freq, low-amp FBM ---------------------
float hash(vec3 p) {
    p = fract(p * 0.285714 + vec3(0.37, 0.18, 0.52));
    p += dot(p, p.yzx + 19.87);
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float noise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    vec3 u = f*f*(3.0 - 2.0*f);  // Hermite smoothstep

    float n000 = hash(i + vec3(0,0,0));
    float n100 = hash(i + vec3(1,0,0));
    float n010 = hash(i + vec3(0,1,0));
    float n110 = hash(i + vec3(1,1,0));
    float n001 = hash(i + vec3(0,0,1));
    float n101 = hash(i + vec3(1,0,1));
    float n011 = hash(i + vec3(0,1,1));
    float n111 = hash(i + vec3(1,1,1));

    float nx00 = mix(n000, n100, u.x);
    float nx10 = mix(n010, n110, u.x);
    float nx01 = mix(n001, n101, u.x);
    float nx11 = mix(n011, n111, u.x);
    float nxy0 = mix(nx00, nx10, u.y);
    float nxy1 = mix(nx01, nx11, u.y);
    return mix(nxy0, nxy1, u.z);
}

float fbm(vec3 p, int oct) {
    float val = 0.0;
    float amp = 0.6;
    float frq = 1.0;
    for(int i = 0; i < 8; i++) {
        if(i>=oct) break;
        val += amp * noise(p * frq);
        frq *= 2.0;
        amp *= 0.6;
    }
    return val;
}



void main()
{
    vec3 modPos = vs_Pos.xyz;

    const float sinAmp = 0.35;
    const float sinFreq = 0.8;
    const float sinSpeed = 0.6;

    const float fbmAmp = 0.23; 
    const float fbmFreq = 7.0; 
    const float fbmSpeed = 1.2;

    float sinField = multiSine(normalize(modPos), sinFreq, u_Time * sinSpeed);
    float sinDisp = sinField * sinAmp;
    modPos += vs_Nor.xyz * sinDisp;

    vec3 pFBM = modPos * fbmFreq + vec3(0.0, u_Time * fbmSpeed, 0.0);
    float fbmDist = fbm(pFBM, u_Octave);
    fbmDist = gain(fbmDist, 0.65);
    float fbmDisp = fbmAmp * (fbmDist * 2.0 - 1.0);
    modPos += vs_Nor.xyz * fbmDisp;

    vec3 blendedNor = normalize(mix(vs_Nor.xyz, normalize(modPos), 0.75));

    mat3 invTranspose = mat3(u_ModelInvTr);
    fs_Nor = vec4(invTranspose * blendedNor, 0);
    fs_Pos = u_Model * vec4(modPos, 1.0);
    fs_LightVec = lightPos - fs_Pos;
    fs_Disp = clamp(0.6 * (0.5 + 0.5 * sinField) + 0.4 * fbmDist, 0.0, 1.0);

    gl_Position = u_ViewProj * fs_Pos;
}

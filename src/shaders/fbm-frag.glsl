#version 300 es
precision highp float;

uniform vec4 u_Color;

in vec4 fs_Nor;
in vec4 fs_LightVec;
in vec4 fs_Pos; 

out vec4 out_Col;

float hash(vec3 p) {
    p = fract(p * 0.285714 + vec3(0.37, 0.18, 0.52));
    p *= 19.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float noise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    vec3 u = f*f*(3.0 - 2.0*f);

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

float fbm(vec3 p) {
    float val = 0.0;
    float amp = 0.4;
    float frq = 1.0;
    for(int i = 0; i < 7; i++) {
        val += amp * (noise(p * frq) * 2.0 - 1.0);
        frq *= 2.0;
        amp *= 0.4;
    }
    return val;
}

void main() {
    vec3 pos = fs_Pos.xyz * 7.0;
    float n = fbm(pos);

    vec3 baseColor = mix(u_Color.rgb, vec3(1.0), n * 0.5 + 0.5);

    out_Col = vec4(baseColor, 1.0);
}
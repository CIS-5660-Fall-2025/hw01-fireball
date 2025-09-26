#version 300 es
uniform mat4 u_Model;
uniform mat4 u_ModelInvTr;
uniform mat4 u_ViewProj;
uniform float u_Time;
uniform float u_Displacement;
uniform float u_PulseSpeed;

in vec4 vs_Pos;
in vec4 vs_Nor;
out vec4 fs_Pos;
out vec4 fs_Nor;
out float fs_Displacement;

float random(vec3 p) {
    return fract(sin(dot(p, vec3(12.0, 78.0, 45.0))) * 43758.0);
}

float noise(vec3 p) {
    vec3 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(random(i), random(i + vec3(1,0,0)), f.x),
                   mix(random(i + vec3(0,1,0)), random(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(random(i + vec3(0,0,1)), random(i + vec3(1,0,1)), f.x),
                   mix(random(i + vec3(0,1,1)), random(i + vec3(1,1,1)), f.x), f.y), f.z);
}

float fbm(vec3 p) {
    float v = 0.0, a = 0.5;
    for(int i = 0; i < 4; i++) {
        v += a * noise(p);
        a *= 0.5;
        p *= 2.0;
    }
    return v;
}

void main() {
    fs_Nor = vec4(vec3(u_ModelInvTr * vs_Nor), 0.0);
    vec3 pos = vs_Pos.xyz;
    float baseDisp = sin(pos.x * 2.0 + pos.y + u_Time * 0.02) * 0.3 +
                    cos(pos.y * 2.0 + pos.z + u_Time * 0.03) * 0.3;
    float lowFreq = sin(pos.x * 2.0 + u_Time * u_PulseSpeed * 0.3) * 
                   cos(pos.z * 2.0 + u_Time * u_PulseSpeed * 0.2);
    float highFreq = fbm(pos + vec3(u_Time * u_PulseSpeed * 0.1));
    float y_offset = pow(pos.y + 1.0, 2.0) * 0.3;
    float flame = smoothstep(0.0, 1.0, 1.0 - length(vec2(pos.x, pos.z)) - y_offset);
    fs_Displacement = (baseDisp + (lowFreq * 0.3 + highFreq * 0.2) * u_Displacement) 
                     * flame * smoothstep(-1.0, 1.0, pos.y);
    pos += normalize(vs_Nor.xyz) * fs_Displacement;
    fs_Pos = u_Model * vec4(pos, 1.0);
    gl_Position = u_ViewProj * fs_Pos;
}
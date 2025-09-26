#version 300 es
precision highp float;
uniform float u_Time;
uniform float u_PulseSpeed;
uniform float u_ColorIntensity;

in vec4 fs_Pos;
in vec4 fs_Nor;
in float fs_Displacement;
out vec4 out_Col;

float spark(vec2 uv, float speed, float offset) {
    vec2 pos = uv + vec2(sin(u_Time * speed + offset) * 0.1, -mod(u_Time * speed + offset, 1.0));
    return exp(-length(pos) * length(pos) * 15.0);
}

vec3 fireGradient(float t) {
    t = clamp(t, 0.0, 1.0);
    return t < 0.5 ? mix(vec3(1,0.2,0), vec3(1,0.6,0), t * 2.0) 
                   : mix(vec3(1,0.6,0), vec3(1,1,0.8), (t - 0.5) * 2.0);
}

void main() {
    float edge = 1.0 - dot(normalize(fs_Nor.xyz), vec3(0,0,1));
    float colorPos = mix(fs_Displacement * 2.0 + 0.5, fs_Displacement * 2.0 - edge * 0.5, 0.5);
    vec3 fireColor = fireGradient(colorPos) * u_ColorIntensity;
    float sparkEffect = 0.0;
    vec2 sparkUV = fs_Pos.xy * 0.5;
    for(int i = 0; i < 6; i++) {
        sparkEffect += spark(sparkUV, 0.8 + float(i) * 0.1, float(i)) * 0.3;
    }
    fireColor = mix(fireColor, mix(vec3(1,0.6,0.2), vec3(1,0.9,0.5), sparkEffect), sparkEffect * edge);
    out_Col = vec4(fireColor * (sin(u_Time * u_PulseSpeed) * 0.1 + 0.9) + 
                   sin(fs_Pos.x * 4.0 + u_Time * u_PulseSpeed) * 0.1, 1.0);
}
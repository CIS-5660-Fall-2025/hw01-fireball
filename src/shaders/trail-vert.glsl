#version 300 es

uniform mat4 u_Model;
uniform mat4 u_ModelInvTr;
uniform mat4 u_ViewProj;
uniform float u_Time;
uniform float u_TrailLength;

in vec4 vs_Pos;
in vec4 vs_Nor;

out vec4 fs_Pos;
out vec4 fs_Nor;
out float fs_Age;

float random(vec3 p) {
    return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
}

float noise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    
    float a = random(i);
    float b = random(i + vec3(1.0, 0.0, 0.0));
    float c = random(i + vec3(0.0, 1.0, 0.0));
    float d = random(i + vec3(1.0, 1.0, 0.0));
    float e = random(i + vec3(0.0, 0.0, 1.0));
    float f1 = random(i + vec3(1.0, 0.0, 1.0));
    float g = random(i + vec3(0.0, 1.0, 1.0));
    float h = random(i + vec3(1.0, 1.0, 1.0));
    
    return mix(mix(mix(a, b, f.x),
                   mix(c, d, f.x), f.y),
               mix(mix(e, f1, f.x),
                   mix(g, h, f.x), f.y), f.z);
}

void main() {
    fs_Nor = vec4(vec3(u_ModelInvTr * vs_Nor), 0.0);
    
    // Calculate trail position
    vec3 pos = vs_Pos.xyz;
    float trailOffset = mod(u_Time * 0.5, u_TrailLength);
    pos.y -= trailOffset;
    
    // Add some horizontal movement
    float wobble = sin(pos.y * 2.0 + u_Time * 0.2) * 0.2;
    pos.x += wobble;
    
    // Add noise displacement
    vec3 noiseInput = pos + vec3(u_Time * 0.1);
    float noiseVal = noise(noiseInput * 2.0);
    pos += normalize(vs_Nor.xyz) * noiseVal * 0.2;
    
    // Calculate age for fragment shader
    fs_Age = (u_TrailLength - trailOffset) / u_TrailLength;
    
    fs_Pos = u_Model * vec4(pos, 1.0);
    gl_Position = u_ViewProj * fs_Pos;
}

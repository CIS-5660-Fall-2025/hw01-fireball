#version 300 es

uniform mat4 u_Model;
uniform mat4 u_ModelInvTr;
uniform mat4 u_ViewProj;
uniform float u_Time;

in vec4 vs_Pos;
in vec4 vs_Nor;
in vec4 vs_Col;

out vec4 fs_Pos;      
out float vHeat;      
out vec3 vNormalW;      

float tri(float x) {   
    return abs(fract(x) - 0.5) * 2.0;
}
float trigNoise(vec3 p, float t){
    float f = 3.5;
    return 0.8 * (
        sin(p.x * f + t * 1.5) +
        sin(p.y * (f * 1.07) + t * 1.1) +
        sin(p.z * (f * 0.93) + t * 0.7)
    );
}

void main() {
    vec3 P = vs_Pos.xyz;
    vec3 N = normalize(vs_Nor.xyz);

    float yN = clamp((P.y + 1.0) * 0.3, 0.0, 1.0); 
    float taper = mix(1.0, 0.5, yN);  
    float stretchY = 1.2;   
    
    float r = length(P.xz);
    vec2 dirXZ = (r > 1e-5) ? P.xz / r : vec2(0.0);
    float newR = r * taper;
    vec3 P_drop = vec3(dirXZ * newR, P.y * stretchY);

    float wobble = trigNoise(P_drop, u_Time) * 0.08
                 + (tri(P_drop.y * 2.0 + u_Time * 1.3) - 0.5) * 0.05;
    vec3 P_wobble = P_drop + wobble * N;

    float baseHeat = 1.0 - yN;               
    float heat = clamp(baseHeat + wobble * 1.2, 0.0, 1.0);
    vHeat = heat;

    vec4 worldPos = u_Model * vec4(P_wobble, 1.0);
    fs_Pos = worldPos;

    mat3 invTr = mat3(u_ModelInvTr);
    vNormalW = normalize(invTr * N);

    gl_Position = u_ViewProj * worldPos;
}

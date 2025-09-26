#version 300 es

uniform mat4 u_Model;
uniform mat4 u_ModelInvTr;
uniform mat4 u_ViewProj;
uniform float u_Time;           
uniform float u_WaveAmplitude;  
uniform float u_WaveFrequency;  

in vec4 vs_Pos;
in vec4 vs_Nor;
in vec4 vs_Col;

out vec4 fs_Nor;
out vec4 fs_LightVec;
out vec4 fs_Col;
out vec4 fs_Pos;  

const vec4 lightPos = vec4(5, 5, 3, 1);

void main() {
    fs_Col = vs_Col;
    
    vec4 deformedPos = vs_Pos;
    
    float wave1 = sin(vs_Pos.x * 3.0 + u_Time * u_WaveFrequency) * u_WaveAmplitude;

    float wave2 = cos(vs_Pos.y * 2.0 + u_Time * u_WaveFrequency * 0.7) * u_WaveAmplitude * 0.5;

    float wave3 = sin(vs_Pos.z * 2.5 - u_Time * u_WaveFrequency * 1.2) * 
                  cos(vs_Pos.x * 1.5 + u_Time * u_WaveFrequency * 0.5) * u_WaveAmplitude * 0.3;

    float distFromCenter = length(vs_Pos.xyz);
    float radialWave = sin(distFromCenter * 4.0 - u_Time * u_WaveFrequency * 2.0) * u_WaveAmplitude * 0.4;

    float totalWave = wave1 + wave2 + wave3 + radialWave;
    
    vec3 radialDir = normalize(vs_Pos.xyz);
    deformedPos.xyz += radialDir.xyz * totalWave;

    float twist = atan(vs_Pos.y, vs_Pos.x) + u_Time * 0.5;
    float twistAmount = sin(twist) * u_WaveAmplitude * 0.2;
    deformedPos.x += cos(twist) * twistAmount;
    deformedPos.y += sin(twist) * twistAmount;
    
    float pulse = sin(u_Time * u_WaveFrequency * 3.0) * 0.05 + 1.0;
    deformedPos.xyz *= pulse;

    mat3 invTranspose = mat3(u_ModelInvTr);
    fs_Nor = vec4(invTranspose * vec3(vs_Nor), 0);
    vec4 modelposition = u_Model * deformedPos;
    
    fs_Pos = modelposition;
    
    fs_LightVec = lightPos - modelposition;
    
    gl_Position = u_ViewProj * modelposition;
}
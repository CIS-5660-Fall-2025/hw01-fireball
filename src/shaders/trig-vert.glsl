#version 300 es
precision highp float;

uniform mat4 u_Model;
uniform mat4 u_ModelInvTr;
uniform mat4 u_ViewProj;
uniform float u_Time; 

in vec4 vs_Pos;
in vec4 vs_Nor;
in vec4 vs_Col;

out vec4 fs_Nor;
out vec4 fs_LightVec;
out vec4 fs_Pos;

const vec4 lightPos = vec4(5, 5, 3, 1);

void main()
{
    vec4 modPos = vs_Pos;
    
    modPos.x += 0.3 * sin(vs_Pos.y + u_Time);
    modPos.z += 0.5 * sin(vs_Pos.y + u_Time);
    modPos.y += 0.3 * cos(u_Time * 2.0);

    mat3 invTranspose = mat3(u_ModelInvTr);
    fs_Nor = vec4(invTranspose * vec3(vs_Nor), 0);

    fs_Pos = u_Model * modPos;
    fs_LightVec = lightPos - fs_Pos;
    gl_Position = u_ViewProj * fs_Pos;
}

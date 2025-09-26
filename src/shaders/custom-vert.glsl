#version 300 es

uniform mat4 u_Model;
uniform mat4 u_ModelInvTr;
uniform mat4 u_ViewProj;
uniform float u_Time;

in vec4 vs_Pos;
in vec4 vs_Nor;
in vec4 vs_Col;

out vec4 fs_Nor;
out vec4 fs_LightVec;
out vec4 fs_Col;
out vec3 fs_WorldPos;

const vec4 lightPos = vec4(5, 5, 3, 1);

void main() {
    fs_Col = vs_Col;

    mat3 invTranspose = mat3(u_ModelInvTr);
    vec3 nrm = normalize(invTranspose * vec3(vs_Nor));
    fs_Nor = vec4(nrm, 0.0);

    vec4 modelposition = u_Model * vs_Pos;

    modelposition.z *= 1.0 + ((sin(u_Time * 0.01)) + sin(u_Time * 0.01 + 12.34) * 0.8) * 0.3 ;
    modelposition.y *= 1.0 + ((cos(u_Time * 0.01))) * 0.3 ;

    fs_WorldPos = modelposition.xyz;
    fs_LightVec = lightPos - modelposition;
    gl_Position = u_ViewProj * modelposition;
}

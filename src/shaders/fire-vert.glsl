#version 300 es
precision highp float;

uniform mat4 u_Model;
uniform mat4 u_ModelInvTr;
uniform mat4 u_ViewProj;
uniform float u_Time;
uniform vec4 u_Color; 

uniform float u_NoiseScale;
uniform float u_Amplitude;
uniform float u_Speed;
uniform int   u_Octaves;

in vec4 vs_Pos;
in vec4 vs_Nor;

out vec4 fs_Nor;
out vec4 fs_LightVec;
out vec4 fs_Col;
out vec3 fs_WorldPos;

const vec4 lightPos = vec4(5.0, 5.0, 3.0, 1.0);

float h3(vec3 p){ return fract(sin(dot(p, vec3(127.1,311.7,74.7))) * 43758.5453123); }
float vnoise(vec3 p){
  vec3 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  float n000=h3(i+vec3(0,0,0)), n100=h3(i+vec3(1,0,0));
  float n010=h3(i+vec3(0,1,0)), n110=h3(i+vec3(1,1,0));
  float n001=h3(i+vec3(0,0,1)), n101=h3(i+vec3(1,0,1));
  float n011=h3(i+vec3(0,1,1)), n111=h3(i+vec3(1,1,1));
  float nx00=mix(n000,n100,f.x), nx10=mix(n010,n110,f.x);
  float nx01=mix(n001,n101,f.x), nx11=mix(n011,n111,f.x);
  float nxy0=mix(nx00,nx10,f.y), nxy1=mix(nx01,nx11,f.y);
  return mix(nxy0,nxy1,f.z);
}
float turb(vec3 p, int oct){
  const int MAXO=8; float a=0.5, f=1.0, s=0.0;
  for(int i=0;i<MAXO;i++){ if(i>=oct) break;
    float n = abs(vnoise(p*f)*2.0-1.0);
    s += n*a; f*=2.0; a*=0.5;
  }
  return s;
}


void main() {
  // transform normal to world
  mat3 invTr = mat3(u_ModelInvTr);
  vec3 nrm = normalize(invTr * vs_Nor.xyz);
  fs_Nor = vec4(nrm, 0.0);

  // base position in object space
  vec3 p = vs_Pos.xyz;

  float d = turb(p * u_NoiseScale + vec3(0.0, -u_Time / 100.0 * u_Speed, 0.0), u_Octaves);
  d = (d - 0.5) * 2.0;     // center around 0
  p += nrm * (d * u_Amplitude);

  vec4 modelPos = u_Model * vec4(p, 1.0);

  fs_WorldPos = modelPos.xyz;
  fs_LightVec = lightPos - modelPos;
  fs_Col = u_Color;        // use your uniform color
  gl_Position = u_ViewProj * modelPos;
}

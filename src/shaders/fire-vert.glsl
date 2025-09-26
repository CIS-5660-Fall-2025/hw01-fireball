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

out vec4 fs_Col;
out vec3 fs_WorldPos;
out vec3 fs_WorldNor;

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

float saturate(float x){ return clamp(x, 0.0, 1.0); }

void main() {
  mat3 invTr = mat3(u_ModelInvTr);
  vec3 nrm = normalize(invTr * vs_Nor.xyz);
  fs_WorldNor = nrm;

  vec3 worldUp = normalize((u_Model * vec4(0.0, 1.0, 0.0, 0.0)).xyz);

  vec3 p = vs_Pos.xyz;

  float t = turb(p * u_NoiseScale + vec3(0.0, -u_Time * 0.01 * u_Speed, 0.0), u_Octaves);

  float topness = saturate(dot(nrm, worldUp));
  float topBoost = 3.0;
  float topWeight = mix(0.2, topBoost, topness * topness);

  p += nrm * (t * u_Amplitude * topWeight);

  float stretch = 0.2;
  float topMask = mix(0.3, 0.85, topness * topness);
  p += worldUp * (stretch * t * topMask);

  vec4 modelPos = u_Model * vec4(p, 1.0);
  fs_WorldPos = modelPos.xyz;
  fs_Col = u_Color;
  gl_Position = u_ViewProj * modelPos;
}

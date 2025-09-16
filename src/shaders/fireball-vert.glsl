#version 300 es

uniform mat4 u_Model; 
uniform mat4 u_ModelInvTr;
uniform mat4 u_ViewProj;   
uniform float u_Time;
uniform float u_Crack;
uniform float u_HeightScale;

uniform vec2  u_MouseNDC;     
uniform float u_MouseRadiusNDC; 
uniform float u_Aspect;       
uniform int   u_MouseDown; 

in vec4 vs_Pos;            
in vec4 vs_Nor;             
in vec4 vs_Col;     
            
out vec4 fs_Col;     
out vec4 fs_Pos;
out float worleyVal;
out float sinVal;

float mod289(float x) { 
    return x - floor(x * (1.0 / 289.0)) * 289.0; 
}
vec3  mod289(vec3  x) { 
    return x - floor(x * (1.0 / 289.0)) * 289.0; 
}
vec4  mod289(vec4  x) { 
    return x - floor(x * (1.0 / 289.0)) * 289.0; 
}

vec4 permute(vec4 x){
    return mod289(((x * 34.0) + 1.0) * x);
}

vec3 hash33(vec3 p){
    vec3 ip = floor(p);
    vec3 f  = fract(p);
    
    vec4 x = vec4(ip, 0.0);
    vec4 a = permute(permute(permute(x.x + vec4(0.0, 1.0, 0.0, 1.0))
                                    + x.y + vec4(0.0, 0.0, 1.0, 1.0))
                                    + x.z + vec4(0.0, 0.0, 0.0, 0.0));
                            
    a = fract(a * (1.0 / 41.0));
    
    return fract(vec3(a.x + a.y, a.y + a.z, a.z + a.w));
}

vec2 worleyF1F2(vec3 p){
    vec3 ip = floor(p);
    vec3 fp = fract(p);

    float F1 = 1e9;
    float F2 = 1e9;

    for(int z = -1; z <= 1; z++) {
        for(int y = -1; y <= 1; y++) {
            for(int x = -1; x <= 1; x++){
                vec3 cell = ip + vec3(x, y, z);
                
                vec3 feature = cell + hash33(cell);
                vec3 d = feature - p;
                float dist2 = dot(d, d);
                if (dist2 < F1){
                    F2 = F1;
                    F1 = dist2;
                } else if (dist2 < F2){
                    F2 = dist2;
                }
            }
        }
    }
    return vec2(sqrt(F1), sqrt(F2));
}

float worleyValue(vec3 p){
    vec2 f = worleyF1F2(p);
    
    return smoothstep(0.1, 0.3, (f.y - f.x));    
}

float worleyFBM(vec3 p){
    float amp = 0.5;
    float freq = 1.0;
    float sum = 0.0;
    for(int i = 0; i < 2; ++i){
        sum += amp * worleyValue(p * freq);
        freq *= 2.0;
        amp  *= 0.5;
    }
    return sum;
}

float sinusoidal(vec3 p) {
    float A = 0.3;            
    vec3  k = vec3(1.5, 1.2, 1.0); 
    float phi = u_Time;      
    float h_low =
        A * ( sin(k.x * p.x + phi)
            + cos(k.y * p.y + phi * 0.7)
            + sin(k.z * p.z + phi * 1.3) ) / 3.0;
    return h_low;
}

void main() {
    vec3 P = vs_Pos.xyz;
    vec3 N = normalize(vs_Nor.xyz);

    vec4 clip = u_ViewProj * u_Model * vec4(P, 1.0);
    vec2 ndc  = clip.xy / clip.w;

    vec2 d = ndc - u_MouseNDC;
    d.x *= u_Aspect;
    float distNDC = length(d);

    float w = (u_MouseDown == 1) ? smoothstep(u_MouseRadiusNDC, 0.0, distNDC) : 0.0;

    float sinVal    = sinusoidal(P);
    worleyVal = 0.1 * worleyFBM((P + vec3(u_Time * 0.05)) * u_Crack);
    float height    = sinVal + worleyVal * u_HeightScale;

    float mouseStrength = 1.5;
    float sinAmplified = mix(sinVal, sinVal * (1.0 + mouseStrength), w);
    float bubble       = mouseStrength * w * 0.08; 
    float heightFinal  = sinAmplified + worleyVal * u_HeightScale + bubble;

    vec3 newPos = P + heightFinal * N;

    vec4 worldPos = u_Model * vec4(newPos, 1.0);
    fs_Pos = worldPos;
    fs_Col = vs_Col;
    gl_Position = u_ViewProj * worldPos;
}
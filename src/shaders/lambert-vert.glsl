#version 300 es
precision highp float;

uniform mat4 u_Model;
uniform mat4 u_ModelInvTr;
uniform mat4 u_ViewProj;

uniform float u_Time;
uniform float u_Amplitude;
uniform float u_Frequency;

uniform float u_ObjectType;

in vec4 vs_Pos;
in vec4 vs_Nor;
in vec4 vs_Col;

out vec4 fs_Nor;
out vec4 fs_LightVec;
out vec4 fs_Col;
out vec4 fs_Pos;
out float fs_Disp;

const vec4 lightPos = vec4(5, 5, 3, 1);

vec3 random3(vec3 p) {
    return fract(sin(vec3(
        dot(p, vec3(127.1, 311.7, 1.0)),
        dot(p, vec3(269.5, 183.3, 1.0)),
        dot(p, vec3(420.6, 631.2, 1.0))
    )) * 43758.5453);
}

float surflet(vec3 p, vec3 gridPoint) {
    vec3 t2 = abs(p - gridPoint);
    vec3 t3 = t2 * t2 * t2;
    vec3 t4 = t3 * t2;
    vec3 t5 = t4 * t2;
    vec3 t = vec3(1.0) - 6.0 * t5 + 15.0 * t4 - 10.0 * t3;
    vec3 gradient = random3(gridPoint) * 2.0 - vec3(1.0);
    vec3 diff = p - gridPoint;
    float height = dot(diff, gradient);
    return height * t.x * t.y * t.z;
}

float perlinNoise3D(vec3 p) {
    float surfletSum = 0.0;
    for(int dx = 0; dx <= 1; ++dx) {
        for(int dy = 0; dy <= 1; ++dy) {
            for(int dz = 0; dz <= 1; ++dz) {
                surfletSum += surflet(p, floor(p) + vec3(float(dx), float(dy), float(dz)));
            }
        }
    }
    return surfletSum;
}

float fbm(vec3 p, int octaves) {
    float value = 0.0;
    float amplitude = 1.0;
    float frequency = 1.0;
    float lacunarity = 2.0;
    float gain = 0.5;
    for(int i = 0; i < 8; i++) {
        if(i >= octaves) break;
        value += amplitude * perlinNoise3D(p * frequency);
        frequency *= lacunarity;
        amplitude *= gain;
    }
    return value;
}

float triangle_wave(float x, float freq, float amplitude) {
    float t = mod(x * freq, amplitude) / amplitude;
    return t < 0.5 ? 2.0 * t : 2.0 * (1.0 - t);
}

vec3 rotateY(vec3 p, float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return vec3(p.x * c - p.z * s, p.y, p.x * s + p.z * c);
}

void main() {
    vec3 pos = (u_Model * vs_Pos).xyz;

    if (u_ObjectType < 0.5) {
        pos.y *= 0.25;

        float angle = atan(pos.z, pos.x);
        float radius = length(pos.xz);
        float petals = 6.0;

        float petalShape = triangle_wave(angle, petals / (2.0 * 3.14159265), 1.0);
        petalShape = pow(petalShape, 0.8);

        float rNorm = clamp(length(pos.xz) / 1.0, 0.0, 1.0);
        float dip = pow(1.0 - rNorm, 2.0) * 0.75;
        pos.y -= dip;

        float minRadius = 0.1;
        float radialOffset = petalShape * 0.8;
        if(radius < minRadius){
            radialOffset *= radius / minRadius;
        }

        float tipLift = pow(petalShape, 1.5) * 0.8;
        tipLift *= 0.8 + 0.2 * sin(u_Time);
        if(radius < minRadius){
            tipLift *= radius / minRadius;
        }
        pos.y += tipLift;

        vec2 dir = normalize(pos.xz + 0.0001);
        float shapedRadius = radius + radialOffset;
        pos.x = dir.x * shapedRadius;
        pos.z = dir.y * shapedRadius;

        pos = rotateY(pos, u_Time * 0.5);
        
    } else {
        float radius = length(pos.xz);
        vec3 nor = normalize(vs_Nor.xyz);
        float height = pos.y;

        pos.y *= 0.5;

        float lowFreq = sin(pos.y * u_Frequency + u_Time) * u_Amplitude;
        float highFreq = fbm(pos * u_Frequency + vec3(0.0, u_Time * 0.5, 0.0), 4) * (u_Amplitude * 0.3);
        vec3 offset = vec3(14.52, 5824.63, 26837.4);
        float fbmMax = max(
            fbm(pos * u_Frequency + vec3(0.0, u_Time * 0.5, 0.0), 4),
            fbm((pos + offset) * u_Frequency + vec3(0.0, u_Time * 0.5, 0.0), 4)
        );

        float displacement = lowFreq + highFreq + fbmMax;

        float radialMask = smoothstep(0.0, 0.7, 1.0 - radius);
        float verticalMask = smoothstep(-0.3, 1.0, height);
        float baseMask = radialMask * verticalMask;

        vec3 centerDir = normalize(vec3(-pos.x * 0.3, 0.5, -pos.z * 0.3));
        vec3 finalDir = normalize(mix(vec3(0.0, 1.0, 0.0), centerDir, 0.3 + 0.3 * height)); 

        pos += baseMask * displacement * finalDir;

        fs_Disp = baseMask * displacement;
    }
    
    

    gl_Position = u_ViewProj * vec4(pos, 1.0);
    fs_Pos = vec4(pos, 1.0);
    fs_Nor = normalize(u_ModelInvTr * vs_Nor);
    fs_Col = vs_Col;
    fs_LightVec = lightPos - fs_Pos;
}
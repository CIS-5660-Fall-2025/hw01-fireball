#version 300 es

uniform mat4 u_Model;
uniform mat4 u_ModelInvTr;
uniform mat4 u_ViewProj;
uniform float u_Time;
uniform vec4 u_Color;
uniform float u_Radius;
uniform int u_Octaves;
uniform float u_InitialNoiseScale;
uniform float u_Lacunarity;
uniform float u_Persistence;

in vec4 vs_Pos;
in vec4 vs_Nor;

out vec4 fs_Pos;
out vec4 fs_Nor;
out vec4 fs_Col;
out float fs_Displacement;

float ease(float time, float start, float end, float duration)
{
    if(time < 0.f){
        return start;
    }
    if(time > duration){
        return end;
    }
    return end * (time / duration) + start;
}

// Credit to https://www.ronja-tutorials.com/post/024-white-noise/
float random3x1(vec3 pos, vec3 seedVector) {
    vec3 smallValue = sin(pos);
    float value = dot(smallValue, seedVector);
    value = fract(sin(value) * 143758.5453);
    // Remap from [-1, 1] to [0, 1]
    value = (value + 1.f)/2.f;
    return value;
}

vec3 random3x3(vec3 pos){
    return vec3(
        random3x1(pos, vec3(12.989, 78.233, 37.719)),
        random3x1(pos, vec3(39.346, 11.135, 83.155)),
        random3x1(pos, vec3(73.156, 52.235, 09.151))
    );
}

float noise(vec3 pos, float scale) {
    vec3 scaledPos = pos/scale;
    vec3 originalCell = floor(scaledPos);

    float minDistance = 100.f;
    for(int dx = -1; dx < 2; dx++) {
        for(int dy = -1; dy < 2; dy++) {
            for(int dz = -1; dz < 2; dz++) {
                vec3 dCell = vec3(float(dx), float(dy), float(dz));
                vec3 currentCell = originalCell + dCell;

                vec3 currentCellVoronoiCenter = currentCell + random3x3(currentCell);
                minDistance = min(minDistance, distance(currentCellVoronoiCenter, scaledPos));
            }
        }
    }

    return minDistance;
}

float noiseFBM(vec3 pos, float initialScale, vec3 displacementDirection, float initialSpeed, float persistence, float lacunarity, float speedFactor, int levels)
{
    float noiseValue = 0.f;
    float amplitude = 1.f;
    float scale = initialScale;
    float speed = initialSpeed;

    for(int i = 0; i<levels; i++){
        vec3 shiftedPosition = pos + displacementDirection * u_Time * speed;
        noiseValue += amplitude * noise(shiftedPosition, scale);
        scale *= u_Lacunarity;
        amplitude *= u_Persistence;
        speed *= speedFactor;
    }

    noiseValue = smoothstep(0.f, 1.f, 1.f - noiseValue);
    return noiseValue;
}

vec3 displaceVertex(vec3 inVertex, vec3 inNormal)
{
    float earVibration = 0.2 * sin(u_Time * 0.05);

    vec3 outVertex = inVertex;

    // Create ears shape
    outVertex.y += (u_Radius + earVibration) * cos(inVertex.x / (3.f * 0.5)) * cos(inVertex.y / (u_Radius * 0.5));

    // Push ears back
    outVertex.x += ease(inVertex.y + u_Radius, 0.f, -3.f, u_Radius * 2.f);
    //outVertex.x -= 0.5 * (inVertex.y + 0.f);
    float noiseMultiplier = 0.3f * u_Radius;
    float noiseValue = noiseMultiplier * (noiseFBM(inVertex, u_InitialNoiseScale, vec3(0.f, -1.f, 0.5f), 0.01f, 0.25f, 0.5f, 2.f, u_Octaves) - 0.5f);
    fs_Displacement = noiseValue;
    outVertex += inNormal * noiseValue;

    return outVertex;
}

void main()
{
    mat3 invTranspose = mat3(u_ModelInvTr);
    fs_Nor = vec4(invTranspose * vec3(vs_Nor), 0);

    fs_Pos = u_Model * vec4(displaceVertex(vs_Pos.xyz, vs_Nor.xyz), vs_Pos.w);

    fs_Col = u_Color;

    gl_Position = u_ViewProj * fs_Pos;
}

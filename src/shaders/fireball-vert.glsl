#version 300 es
precision highp float;

uniform mat4 u_Model;
uniform mat4 u_ModelInvTr;
uniform mat4 u_ViewProj;
uniform float u_Time;
uniform float u_Scale;

in vec4 vs_Pos;
in vec4 vs_Nor;

out vec4 fs_Nor;
out vec4 fs_LightVec;

const vec4 lightPos = vec4(5, 5, 3, 1);

// Random function for noise
vec3 random3(vec3 p) {
    return fract(sin(vec3(
        dot(p, vec3(127.1, 311.7, 74.7)),
        dot(p, vec3(269.5, 183.3, 246.1)),
        dot(p, vec3(113.5, 271.9, 124.6))
    )) * 43758.5453123);
}

// 3D noise function
float noise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    
    // Smooth interpolation
    f = f * f * (3.0 - 2.0 * f);
    
    // Sample 8 corners of the cube
    float n000 = dot(random3(i + vec3(0,0,0)) - 0.5, f - vec3(0,0,0));
    float n100 = dot(random3(i + vec3(1,0,0)) - 0.5, f - vec3(1,0,0));
    float n010 = dot(random3(i + vec3(0,1,0)) - 0.5, f - vec3(0,1,0));
    float n110 = dot(random3(i + vec3(1,1,0)) - 0.5, f - vec3(1,1,0));
    float n001 = dot(random3(i + vec3(0,0,1)) - 0.5, f - vec3(0,0,1));
    float n101 = dot(random3(i + vec3(1,0,1)) - 0.5, f - vec3(1,0,1));
    float n011 = dot(random3(i + vec3(0,1,1)) - 0.5, f - vec3(0,1,1));
    float n111 = dot(random3(i + vec3(1,1,1)) - 0.5, f - vec3(1,1,1));
    
    // Interpolate
    float nx00 = mix(n000, n100, f.x);
    float nx10 = mix(n010, n110, f.x);
    float nx01 = mix(n001, n101, f.x);
    float nx11 = mix(n011, n111, f.x);
    
    float nxy0 = mix(nx00, nx10, f.y);
    float nxy1 = mix(nx01, nx11, f.y);
    
    return mix(nxy0, nxy1, f.z);
}

// Fractal Brownian Motion
float fbm(vec3 p, int octaves) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    float maxValue = 0.0;
    
    for(int i = 0; i < octaves; i++) {
        if(i >= octaves) break;
        value += amplitude * noise(p * frequency);
        maxValue += amplitude;
        amplitude *= 0.5;
        frequency *= 2.0;
    }
    
    return value / maxValue;
}

// Random function for Voronoi
vec2 random2(vec2 p) {
    return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453);
}

// 2D Voronoi noise function
float voronoi(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    
    float minDist = 1.0;
    
    for (int x = -1; x <= 1; x++) {
        for (int y = -1; y <= 1; y++) {
            vec2 neighbor = vec2(float(x), float(y));
            vec2 point = random2(i + neighbor);
            vec2 diff = neighbor + point - f;
            float dist = length(diff);
            minDist = min(minDist, dist);
        }
    }
    
    return minDist;
}

void main() {
    vec3 pos = vs_Pos.xyz;
    vec3 normal = normalize(vs_Nor.xyz);
    
    // stretch the sphere vertically to create flame-like ellipsoid
    vec3 ellipsoidPos = vec3(pos.x, pos.y * 1.6, pos.z);
    
    // Create smooth flame shape
    float scaleFactor = 1.0;
    float normalizedY = ellipsoidPos.y / 1.5;
    
    if (normalizedY > -0.2) {
        // Create tapering flame top
        float taperStart = -0.2;
        float adjustedY = (normalizedY - taperStart) / (1.0 - taperStart);
        adjustedY = max(adjustedY, 0.0);
        
        float taperAmount = pow(adjustedY, 0.8);
        scaleFactor = 1.0 - taperAmount * 0.6;
        scaleFactor = max(scaleFactor, 0.2);
    } else {
        // Bottom part: flame base bulge
        float bulgeAmount = pow((-normalizedY - 0.2) / 0.8, 1.2);
        scaleFactor = 1.0 + bulgeAmount * 0.1;
    }
    
    // Apply scaling to create flame shape
    vec3 flamePos = vec3(ellipsoidPos.x * scaleFactor, ellipsoidPos.y, ellipsoidPos.z * scaleFactor);
    
    // Low Frequency, High Amplitude Displacement (FBM)
    // Much larger deformation for dramatic flame movement
    vec3 lowFreqCoord = flamePos * 0.4 + vec3(0.0, u_Time * 0.02, 0.0);
    float lowFreqNoise = fbm(lowFreqCoord, 3);
    float lowFreqDisplacement = lowFreqNoise * 1.8; // Very high amplitude for big deformations
    
    // High Frequency, Low Amplitude Displacement (FBM + Voronoi)
    // High frequency FBM for flame surface texture
    vec3 highFreqCoord = flamePos * 5.0 + vec3(u_Time * 0.008, 0.0, u_Time * 0.012);
    float highFreqNoise = fbm(highFreqCoord, 5);
    float highFreqDisplacement = highFreqNoise * 0.12;
    
    // Voronoi noise for flame cell-like structure
    vec2 voronoiCoord = vec2(flamePos.x + u_Time * 0.005, flamePos.y + u_Time * 0.007) * 4.0;
    float voronoiNoise = voronoi(voronoiCoord);
    float voronoiDisplacement = (voronoiNoise - 0.5) * 0.08;
    
    // Combine All Displacements
    float totalDisplacement = lowFreqDisplacement + highFreqDisplacement + voronoiDisplacement;
    
    // Apply displacement along normal to create flame surface
    vec3 finalPos = flamePos + normal * totalDisplacement;
    
    // Apply layer scale uniform 
    finalPos *= u_Scale;
    
    // Transform to world space
    vec4 modelPos = u_Model * vec4(finalPos, 1.0);
    
    // Transform normal
    mat3 invTranspose = mat3(u_ModelInvTr);
    fs_Nor = vec4(invTranspose * normal, 0.0);
    
    // Calculate light vector
    fs_LightVec = lightPos - modelPos;
    
    // Final position
    gl_Position = u_ViewProj * modelPos;
}
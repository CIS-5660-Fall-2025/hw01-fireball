#version 300 es

precision highp float;

uniform vec4 u_Color;        
uniform float u_Time;        
uniform float u_NoiseScale;  
uniform float u_NoiseIntensity; 

// Inputs from vertex shader
in vec4 fs_Nor;
in vec4 fs_LightVec;
in vec4 fs_Col;
in vec4 fs_Pos;  

out vec4 out_Col;

// 3D Worley Noise 
float worleyNoise(vec3 p) {
    // Get the integer cell and fractional position within the cell
    vec3 cellIndex = floor(p);
    vec3 localPos = fract(p);
    
    float minDistance = 1.0;
    
    // Check all neighboring cells
    for (int k = -1; k <= 1; k++) {
        for (int j = -1; j <= 1; j++) {
            for (int i = -1; i <= 1; i++) {
                vec3 neighbor = vec3(float(i), float(j), float(k));
                
                vec3 cellPosition = cellIndex + neighbor;
                vec3 randomOffset = vec3(
                    fract(sin(dot(cellPosition, vec3(12.9898, 78.233, 45.164))) * 43758.5453),
                    fract(sin(dot(cellPosition, vec3(47.328, 69.513, 12.963))) * 43758.5453),
                    fract(sin(dot(cellPosition, vec3(94.615, 23.728, 51.429))) * 43758.5453)
                );
                
                vec3 pointInCell = neighbor + randomOffset;

                float dist = length(localPos - pointInCell);

                minDistance = min(minDistance, dist);
            }
        }
    }
    
    return minDistance;
}

void main() {
    vec4 diffuseColor = u_Color;
    
    float diffuseTerm = dot(normalize(fs_Nor), normalize(fs_LightVec));
    diffuseTerm = clamp(diffuseTerm, 0.0, 1.0);
    
    float ambientTerm = 0.2;
    float lightIntensity = diffuseTerm + ambientTerm;
    
    vec3 noiseInput = fs_Pos.xyz * u_NoiseScale;
    
    // Add time-based animation
    if (u_Time > 0.0) {
        noiseInput += vec3(u_Time * 0.1, u_Time * 0.05, u_Time * 0.08);
    }
    
    float noiseValue = 1.0 - worleyNoise(noiseInput);

    noiseValue = pow(noiseValue, 1.5);

    vec3 noiseColor = mix(
        diffuseColor.rgb,          
        vec3(1.0) - diffuseColor.rgb, 
        noiseValue * u_NoiseIntensity 
    );
    
    vec3 colorVariation = vec3(
        sin(noiseValue * 6.28) * 0.05,
        cos(noiseValue * 4.0) * 0.05,
        sin(noiseValue * 2.0) * 0.05
    );
    noiseColor += colorVariation * u_NoiseIntensity;
    vec3 finalColor = noiseColor * lightIntensity;


    
    out_Col = vec4(finalColor, diffuseColor.a);
}
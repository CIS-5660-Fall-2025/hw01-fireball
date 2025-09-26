#version 300 es

// Fragment shader with individual Voronoi controls per layer
precision highp float;

uniform vec4 u_Color;
uniform float u_EmissionStrength;
uniform float u_FlameSize;
uniform float u_Time;
uniform float u_VoronoiScale; // Individual Voronoi scale per layer
uniform float u_GradientStrength; // Individual gradient strength per layer
uniform float u_TextureOffsetY;

// These are the interpolated values out of the rasterizer
in vec4 fs_Nor;
in vec4 fs_LightVec;

out vec4 out_Col;

// Random function for Voronoi
vec2 random2(vec2 p) {
    return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453);
}

// Weighted Voronoi with naturally different cell sizes and seamless wrapping
float voronoi(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    
    float minDist = 1.0;
    
    for (int x = -1; x <= 1; x++) {
        for (int y = -1; y <= 1; y++) {
            vec2 neighbor = vec2(float(x), float(y));
            vec2 point = random2(i + neighbor);
            
            // Give each seed point a different influence radius
            float weight = 0.8 + 0.7 * random2(point + vec2(123.0, 456.0)).x;
            
            vec2 diff = neighbor + point - f;
            
            // Handle wrapping for u coordinate to eliminate seams
            if (abs(diff.x) > 0.5) {
                diff.x = diff.x - sign(diff.x);
            }
            
            float dist = length(diff) / weight;
            minDist = min(minDist, dist);
        }
    }
    
    return minDist;
}

// Soft Light blending mode
float softLight(float base, float blend) {
    if (blend < 0.5) {
        return base - (1.0 - 2.0 * blend) * base * (1.0 - base);
    } else {
        float d = (base < 0.25) ? ((16.0 * base - 12.0) * base + 4.0) * base : sqrt(base);
        return base + (2.0 * blend - 1.0) * (d - base);
    }
}

// Mix RGB blending function
float mixRGB(float base, float blend, float factor) {
    return mix(base, blend, factor);
}

// Linear gradient 
float gradientTexture(vec3 normal) {
    return 1.0 - (normal.y + 1.0) * 0.5;
}

// Bell-shaped gradient
float bellGradient(vec3 normal) {
    float y = normal.y; 
    float center = 0.2; 
    float bellValue = exp(-((y - center) * (y - center)) / 0.2); 
    return bellValue;
}

// Combine 3 Voronoi scales with individual layer controls
float combinedVoronoi(vec2 texCoord, vec3 normal) {
    // Apply individual Voronoi scale to base coordinates
    vec2 scaledTexCoord = texCoord * u_VoronoiScale;
    scaledTexCoord.y += u_TextureOffsetY; // Apply Y offset
    
    // Time-based animation offsets 
    vec2 timeOffset1 = vec2(0.0, u_Time * 30.0 / 900.0);  // Medium scale
    vec2 timeOffset2 = vec2(0.0, u_Time * 60.0 / 900.0);  // Small flame
    vec2 timeOffset3 = vec2(0.0, u_Time * 15.0 / 900.0);  // Large flame
    
    // Generate Voronoi patterns with individual scaling
    float mainFlame = voronoi(scaledTexCoord + timeOffset1);
    float voronoi2x = voronoi((scaledTexCoord + timeOffset2) * 2.0);
    float voronoiHalf = voronoi((scaledTexCoord + timeOffset3) * 0.5);
    
    // Detect if this is the white layer based on color
    bool isWhiteLayer = (u_Color.r > 0.9 && u_Color.g > 0.6 && u_Color.b > 0.5);
    
    // Choose gradient type based on layer
    float gradient;
    if (isWhiteLayer) {
        gradient = bellGradient(normal); // Bell-shaped for white layer
    } else {
        gradient = gradientTexture(normal); // Linear for other layers
    }
    
    // Mix main flame with gradient using individual gradient strength
    float mixedMainFlame = mixRGB(mainFlame, gradient, u_GradientStrength);
    
    // Combine using Soft Light blending
    float step1 = softLight(mixedMainFlame, voronoi2x);
    float final = softLight(step1, voronoiHalf);
    
    return final;
}

void main() {
    // Calculate texture coordinates from world position
    vec3 normal = normalize(fs_Nor.xyz);
 
    // Use spherical coordinates with seam fix
    float u = atan(normal.z, normal.x) / 6.283185 + 0.5;
    float v = acos(normal.y) / 3.141593;
    
    // Add small noise to break the seam
    float seamFix = sin(normal.y * 31.416) * 0.001; 
    u += seamFix;
    
    vec2 texCoord = vec2(u, v) * 12.0;
    
    // Get combined Voronoi value with individual layer controls
    float voronoiValue = combinedVoronoi(texCoord, normal);
    
    // Create intensity based on Voronoi pattern
    float intensity = smoothstep(0.2, 1.0, voronoiValue);
    
    // Apply u_Color as base color and modulate with fire intensity
    vec3 baseColor = u_Color.rgb;
    vec3 fireColor = baseColor;
    
    // Flame size mask
    float flameMask = step(u_FlameSize, voronoiValue);
    
    // Discard transparent pixels
    if (flameMask < 0.1) {
        discard;
    }
    
    // Apply flame mask
    vec3 finalColor = fireColor * flameMask;
    
    // Apply emission strength
    vec3 emissionColor = finalColor * u_EmissionStrength;
    
    out_Col = vec4(emissionColor, flameMask);
}
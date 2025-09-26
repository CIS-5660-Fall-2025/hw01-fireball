#version 300 es

// Multi-color fire bloom blur shader
precision highp float;

uniform sampler2D u_Texture;
uniform vec2 u_Resolution;
uniform vec2 u_Direction;
uniform float u_BlurSize;
uniform float u_BloomThreshold;

in vec2 fs_UV;
out vec4 out_Col;

// Detect if a color represents fire/flame regardless of specific hue
bool isFlameColor(vec3 color) {
    float r = color.r;
    float g = color.g;
    float b = color.b;
    float brightness = dot(color, vec3(0.299, 0.587, 0.114));
     
    if (brightness < 0.2) return false;
    
    // Check various flame patterns:
    
    // 1. Red-dominant flames (red fire)
    if (r > 0.6 && r > g && r > b) return true;
    
    // 2. Orange/yellow flames (traditional fire)
    if (r > 0.4 && g > 0.2 && g < r && b < g) return true;
    
    // 3. White-hot flames (very bright with balanced colors)
    if (brightness > 0.7 && min(min(r,g),b) > 0.5) return true;
    
    // 4. Blue flames (high temperature)
    if (b > 0.6 && brightness > 0.5) return true;
    
    return false;
}

// Extract flame colors for bloom
vec3 extractFlameBloom(vec3 color, float threshold) {
    if (!isFlameColor(color)) return vec3(0.0);
    
    float brightness = dot(color, vec3(0.299, 0.587, 0.114));
    
    if (brightness > threshold) {
        float bloomIntensity = (brightness - threshold) / max(brightness, 0.001);
        return color * bloomIntensity * 2.0;
    }
    
    return vec3(0.0);
}

void main() {
    vec2 texelSize = 1.0 / u_Resolution;
    vec4 result = vec4(0.0);
    
    // Gaussian blur weights
    float weights[7] = float[](0.383103, 0.241843, 0.060626, 0.00598, 0.000229, 0.000003, 0.000000);
    
    // Center sample
    vec4 centerSample = texture(u_Texture, fs_UV);
    
    // Extract flame areas only on horizontal pass
    if (u_Direction.x > 0.5) {
        centerSample.rgb = extractFlameBloom(centerSample.rgb, u_BloomThreshold);
    }
    
    result += centerSample * weights[0];
    
    // Blur samples
    for(int i = 1; i < 7; i++) {
        vec2 offset = u_Direction * texelSize * float(i) * u_BlurSize;
        
        vec4 sampleA = texture(u_Texture, fs_UV + offset);
        vec4 sampleB = texture(u_Texture, fs_UV - offset);
        
        // Extract flame areas only on horizontal pass
        if (u_Direction.x > 0.5) {
            sampleA.rgb = extractFlameBloom(sampleA.rgb, u_BloomThreshold);
            sampleB.rgb = extractFlameBloom(sampleB.rgb, u_BloomThreshold);
        }
        
        result += (sampleA + sampleB) * weights[i];
    }
    
    out_Col = result;
}
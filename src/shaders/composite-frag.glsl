#version 300 es

// Real bloom composite shader
precision highp float;

uniform sampler2D u_OriginalTexture;
uniform sampler2D u_BloomTexture;
uniform float u_BloomStrength;
uniform float u_BloomThreshold;

in vec2 fs_UV;
out vec4 out_Col;

// Tone mapping to prevent over-bright bloom
vec3 tonemap(vec3 color) {
    // Simple Reinhard tone mapping
    return color / (color + vec3(1.0));
}

// Inverse tone mapping for more natural look
vec3 exposureTonemap(vec3 color, float exposure) {
    return vec3(1.0) - exp(-color * exposure);
}

void main() {
    // Sample both textures
    vec4 originalColor = texture(u_OriginalTexture, fs_UV);
    vec4 bloomColor = texture(u_BloomTexture, fs_UV);
    
    // Additive bloom blending
    vec3 bloomContribution = bloomColor.rgb * u_BloomStrength;
    
    // Combine original scene with bloom
    vec3 finalColor = originalColor.rgb + bloomContribution;
    
    // Optional: Apply tone mapping to prevent over-bright areas
    // Uncomment this line for more realistic look:
    // finalColor = exposureTonemap(finalColor, 1.2);
    
    // Add some extra glow enhancement
    vec3 enhanced = finalColor + bloomContribution * 0.3;
    
    out_Col = vec4(enhanced, originalColor.a);
}
#version 300 es
precision highp float;

// Inputs from vertex shader
in float fs_Alpha;
in float fs_Brightness;

// Output color
out vec4 out_Col;

void main() {
    // Create a bright white/blue meteor color
    vec3 meteorColor = vec3(0.9, 0.95, 1.0); // Bright white-blue
    
    // Apply brightness variation
    meteorColor *= fs_Brightness;
    
    // Add intensity for bloom effect
    meteorColor *= 2.5;
    
    // Final color with alpha
    out_Col = vec4(meteorColor, fs_Alpha);
}
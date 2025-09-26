#version 300 es
precision highp float;

uniform float u_Time;

in vec4 fs_Pos;
in vec4 fs_Nor;
in float fs_Age;

out vec4 out_Col;

void main() {
    // Color gradient from yellow to red to transparent
    vec3 youngColor = vec3(1.0, 0.9, 0.5); // Yellow
    vec3 midColor = vec3(1.0, 0.4, 0.0);   // Orange
    vec3 oldColor = vec3(0.7, 0.1, 0.0);   // Dark red
    
    // Mix colors based on age
    vec3 color;
    if(fs_Age < 0.3) {
        color = mix(oldColor, midColor, fs_Age / 0.3);
    } else {
        color = mix(midColor, youngColor, (fs_Age - 0.3) / 0.7);
    }
    
    // Fade out based on age
    float alpha = smoothstep(1.0, 0.0, fs_Age);
    
    // Add some variation based on normal
    float edge = 1.0 - dot(normalize(fs_Nor.xyz), normalize(vec3(0.0, 0.0, 1.0)));
    color = mix(color, color * 0.5, edge);
    
    // Add flickering
    float flicker = sin(u_Time * 10.0 + fs_Pos.y * 5.0) * 0.1 + 0.9;
    
    out_Col = vec4(color * flicker, alpha * 0.7);
}

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
in float fs_Displacement; 

out vec4 out_Col;

// Toolbox Functions

float smoothstep_custom(float edge0, float edge1, float x) {
    float t = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
    return t * t * (3.0 - 2.0 * t);
}

float impulse(float k, float x) {
    float h = k * x;
    return h * exp(1.0 - h);
}

float pcurve(float x, float a, float b) {
    float k = pow(a + b, a + b) / (pow(a, a) * pow(b, b));
    return k * pow(x, a) * pow(1.0 - x, b);
}

float parabola(float x, float k) {
    return pow(4.0 * x * (1.0 - x), k);
}

float noise(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
    vec3 normal = normalize(fs_Nor.xyz);
    vec3 lightVec = normalize(fs_LightVec.xyz);
    
    float diffuseTerm = dot(normal, lightVec);
    diffuseTerm = clamp(diffuseTerm, 0.0, 1.0);
    
    float ambientTerm = 0.3; 
    float lightIntensity = diffuseTerm + ambientTerm;
    
    float displaceNorm = clamp((fs_Displacement + 0.2) / 0.6, 0.0, 1.0);
    
    // Define fire color palette
    vec3 darkRed = vec3(0.4, 0.0, 0.0);      
    vec3 brightRed = vec3(1.0, 0.1, 0.0);    
    vec3 orange = vec3(1.0, 0.5, 0.0);       
    vec3 yellow = vec3(1.0, 0.9, 0.2);      
    vec3 white = vec3(1.0, 1.0, 0.8);        
    
    float colorParam = pcurve(displaceNorm, 1.5, 2.0);

    vec3 fireColor;
    
    if (colorParam < 0.3) {
        float t = smoothstep_custom(0.0, 0.3, colorParam);
        fireColor = mix(darkRed, brightRed, t);
    } else if (colorParam < 0.6) {
        float t = smoothstep_custom(0.3, 0.6, colorParam);
        fireColor = mix(brightRed, orange, t);
    } else if (colorParam < 0.85) {
        float t = smoothstep_custom(0.6, 0.85, colorParam);
        fireColor = mix(orange, yellow, t);
    } else {
        float t = smoothstep_custom(0.85, 1.0, colorParam);
        fireColor = mix(yellow, white, t);
    }
    
    vec2 screenPos = fs_Pos.xy * 0.1;
    float flicker = impulse(3.0, noise(screenPos + u_Time * 2.0) * 0.5 + 0.5);

    float intensity = parabola(displaceNorm, 0.8) * 2.0 + 0.5;
    
    vec3 baseColor = u_Color.rgb;
    fireColor = mix(baseColor, fireColor, 0.8); // Blend with base color
    
    fireColor *= (1.0 + flicker * 0.3) * intensity;
    
    vec3 finalColor = fireColor * lightIntensity;
    
    float rim = 1.0 - abs(dot(normal, normalize(-fs_Pos.xyz)));
    rim = pow(rim, 2.0);
    finalColor += rim * vec3(1.0, 0.4, 0.0) * 0.5;
    
    finalColor = max(finalColor, fireColor * 0.3);
    
    out_Col = vec4(finalColor, u_Color.a);
}
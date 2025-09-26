#version 300 es
precision highp float;

in vec4 vs_Pos;
in vec4 vs_Nor;

in vec4 a_InstanceData1; // startX, startY, velocityX, velocityY
in vec4 a_InstanceData2; // lifetime, currentTime, size, brightness

uniform float u_Time;

out float fs_Alpha;
out float fs_Brightness;

void main() {
    vec2 startPos = a_InstanceData1.xy;
    vec2 velocity = a_InstanceData1.zw;
    float lifetime = a_InstanceData2.x;
    float currentTime = a_InstanceData2.y;
    float size = a_InstanceData2.z;
    float brightness = a_InstanceData2.w;
    
    // Current meteor head position
    vec2 currentPos = startPos + velocity * currentTime;
    
    vec2 finalPos = currentPos;
    
    // Calculate trail progress based on current time
    float trailProgress = currentTime / lifetime;
    
    // Create dynamic trail that grows over time
    if (vs_Pos.x > 0.5) {
        // Tail vertex - trail length grows with time
        vec2 trailDirection = normalize(velocity);
        float maxTrailLength = size;
        float currentTrailLength = maxTrailLength * min(trailProgress * 3.0, 1.0);
        finalPos = currentPos - trailDirection * currentTrailLength;
    }
    
    // Calculate fade based on lifetime
    float fade = 1.0 - smoothstep(0.8, 1.0, trailProgress);
    
    // Make tail more transparent than head
    fs_Alpha = vs_Pos.x < 0.5 ? fade : fade * 0.4;
    fs_Brightness = brightness;
    
    gl_Position = vec4(finalPos, 0.0, 1.0);
}
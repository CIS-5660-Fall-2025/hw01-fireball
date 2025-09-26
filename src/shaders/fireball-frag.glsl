#version 300 es

precision highp float;

uniform vec4 u_Color;

uniform float u_Time;

in vec4 fs_Nor;
in vec4 fs_Col;
in float fs_Displacement;

out vec4 out_Col; // This is the final output color that you will see on your
                  // screen for the pixel that is currently being processed.

float smootherstep(float edge0, float edge1, float x)
{
    x = clamp((x - edge0)/(edge1-edge0), 0.0, 1.0);
    return x * x * x * (x * (x * 6.f - 15.f) + 10.f);
}

float bias(float b, float time)
{
    if(time < 0.f)
    {
        return 0.f;
    }
    if(time > 1.f)
    {
        return 1.f;
    }
    return pow(time, log(b) / log(0.5f));
}

float gain(float g, float time)
{
    if(time < 0.f){
        return 0.f;
    }
    if(time > 1.f){
        return 1.f;
    }
    if(time < 0.5f)
    {
        return bias(1.f - g, 2.f * time) / 2.f;
    }
    return 1.f - bias(1.f - g, 2.f - 2.f * time) / 2.f;
}

float triangleWave(float x)
{
    return 2.f * abs(x - floor(x + 0.5));
}

void main()
{
    // Use a triangle wave to map time to smoothly move between 0-1
    float oscillator = triangleWave(u_Time * 0.005);
    // Make the discoloration pulse over time
    float pulsingTime = gain(0.8f, oscillator);
    float mappedDisplacement = smootherstep(-2.f, 4.f, fs_Displacement + pulsingTime);
    // This creates a dusty appearance that looks like streaks
    vec3 blendedColor = mix(mix(fs_Col.xyz, vec3(0.f), mappedDisplacement), vec3(1.f), 0.2f - mappedDisplacement);
    out_Col = vec4(blendedColor, fs_Col.w);
}
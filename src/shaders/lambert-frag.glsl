#version 300 es

// This is a fragment shader. If you've opened this file first, please
// open and read lambert.vert.glsl before reading on.
// Unlike the vertex shader, the fragment shader actually does compute
// the shading of geometry. For every pixel in your program's output
// screen, the fragment shader is run for every bit of geometry that
// particular pixel overlaps. By implicitly interpolating the position
// data passed into the fragment shader by the vertex shader, the fragment shader
// can compute what color to apply to its pixel based on things like vertex
// position, light position, and vertex color.
precision highp float;
#define PI 3.1415926535

uniform vec4 u_Color; // The color with which to render this instance of geometry.
uniform float u_Time;
uniform float u_GradientType;
uniform float u_frameThreshold;

// These are the interpolated values out of the rasterizer, so you can't know
// their specific values without knowing the vertices that contributed to them
in vec3 fs_Nor;
in vec4 fs_LightVec;
in vec4 fs_Col;
in vec3 fs_Pos;

out vec4 out_Col; // This is the final output color that you will see on your
                  // screen for the pixel that is currently being processed.
float random2(vec2 st) {
    return fract(sin(dot(st, vec2(12.9898,78.233))) * 43758.5453123);
}

float perlin2D(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    float a = random2(i);
    float b = random2(i + vec2(1.0, 0.0));
    float c = random2(i + vec2(0.0, 1.0));
    float d = random2(i + vec2(1.0, 1.0));

    vec2 u = f * f * (3.0 - 2.0 * f);

    float x1 = mix(a, b, u.x);
    float x2 = mix(c, d, u.x);

    return mix(x1, x2, u.y);
}

// Value noise 3D by iq
// https://www.shadertoy.com/view/4sfGzS
float hash( ivec3 p )    // this hash is not production ready, please
{                        // replace this by something better

    // 3D -> 1D
    int n = p.x*3 + p.y*113 + p.z*311;

    // 1D hash by Hugo Elias
	n = (n << 13) ^ n;
    n = n * (n * n * 15731 + 789221) + 1376312589;
    return float( n & ivec3(0x0fffffff))/float(0x0fffffff);
}

float valueNoise3D( in vec3 x )
{
    ivec3 i = ivec3(floor(x));
    vec3 f = fract(x);
    // cubic smoothstep
    f = f*f*(3.0-2.0*f);
	
    return mix(mix(mix( hash(i+ivec3(0,0,0)), 
                        hash(i+ivec3(1,0,0)),f.x),
                   mix( hash(i+ivec3(0,1,0)), 
                        hash(i+ivec3(1,1,0)),f.x),f.y),
               mix(mix( hash(i+ivec3(0,0,1)), 
                        hash(i+ivec3(1,0,1)),f.x),
                   mix( hash(i+ivec3(0,1,1)), 
                        hash(i+ivec3(1,1,1)),f.x),f.y),f.z);
}

float fbm(vec3 p) {

    // PARAMETERS
    int iterCount = 3; 
    float ampDecreaseFactor = 0.5;
    float freqIncreaseFactor = 2.;
    float amp = 0.5; // INITIAL AMP

    // base values
    float fbmSum = 0.;
    vec3 seed = p;
    
    for (int i = 0; i < iterCount; i++) {

        fbmSum += valueNoise3D(seed) * amp;

        // decreasing factors
        amp *= ampDecreaseFactor;
        seed *= freqIncreaseFactor;
    }
    return fbmSum;
}

float getBias(float time, float bias)
{
  return (time / ((((1.0/bias) - 2.0)*(1.0 - time))+1.0));
}
float  getGain(float time, float gain)
{
  if(time < 0.5) {
    return getBias(time * 2.0, gain)/2.0;
  }
  else {
    return getBias(time * 2.0 - 1.0,1.0 - gain)/2.0 + 0.5;
  }
    
}

vec3 getGradColor(float t, float gradType) {
    vec3 offset, amp, c, d;
    
    if (gradType < 1.0) {
        // 1. ORANGE~BLUE
        offset = vec3(0.5, 0.5, 0.5);
        amp = vec3(0.5, 0.5, 0.5);
        c = vec3(1.0, 1.0, 1.0);
        d = vec3(0.0, 0.10, 0.20);
    } else if (gradType < 2.0) {
        // 2. LEGO
        offset = vec3(-1.000, -1.000, -1.000);
        amp = vec3(31.384, 31.384, 942.797);
        c = vec3(2.107, 2.107, 2.107);
        d = vec3(-2.275, -1.941, -1.608);
    } else if (gradType < 3.0) {
        // 3. Custom gradient 1
        offset = vec3(0.646, 0.361, 0.266);
        amp    = vec3(0.739, 0.558, 0.597);
        c      = vec3(0.733, 0.588, 0.485);
        d      = vec3(0.907, 1.837, -1.450);
    } else if (gradType < 4.0) {
        // 4. Red gradient
        offset = vec3(0.000, 0.500, 0.500);
        amp    = vec3(0.000, 0.500, 0.500);
        c      = vec3(0.000, 0.500, 0.333);
        d      = vec3(0.000, 0.500, 0.667);
    } else if (gradType < 5.0) {
        // 5. Custom gradient 2
        offset = vec3(0.678, 0.378, 0.048);
        amp    = vec3(0.848, 1.108, 0.038);
        c      = vec3(-0.382, 0.328, 0.333);
        d      = vec3(0.500, -1.502, 0.667);
    } else if (gradType < 6.0) {
        // 6. Blue gradient
        offset = vec3(0.678, 0.378, 0.048);
        amp    = vec3(0.848, 1.108, 0.038);
        c      = vec3(-0.382, 0.588, 0.333);
        d      = vec3(0.368, -1.633, 0.535);
    } else if (gradType < 7.0) {
        // 7. Magenta gradient (default)
        
         offset = vec3(0.504, 0.904, 0.768);
         amp    = vec3(0.682, 0.219, 0.051);
         c      = vec3(1.268, 0.307, 0.503);
         d      = vec3(1.017, 0.367, 0.544);
    }
    else {
        offset = vec3(0.938, 0.328, 0.718);
        amp    = vec3(0.659, 0.438, 0.328);
        c      = vec3(0.388, 0.388, 0.296);
        d      = vec3(2.538, 2.478, 0.168);
    }

    float r0 = offset.r + amp.r * cos(2.0 * PI * (c.r * t + d.r));
    float g0 = offset.g + amp.g * cos(2.0 * PI * (c.g * t + d.g));
    float b0 = offset.b + amp.b * cos(2.0 * PI * (c.b * t + d.b));

    r0 = clamp(r0, 0.0, 1.0);
    g0 = clamp(g0, 0.0, 1.0);
    b0 = clamp(b0, 0.0, 1.0);
    r0 = getGain(r0, 0.55);
    g0 = getGain(g0, 0.55);
    b0 = getGain(b0, 0.55);
    return vec3(r0, g0, b0);
}



void main() {
	
  vec2 seed = vec2(fs_Pos.x, fs_Pos.y) * 5.;
  
  float baseNoise = fbm(vec3(seed.x, seed.y - u_Time * 0.01, 0.));
  float topNoise = baseNoise * fs_Pos.y;
  
  float timeOffset = u_Time * 0.0004;
  vec3 color = 1. - getGradColor(length(fs_Pos.xy) + timeOffset + topNoise * 0.5, u_GradientType);
  
  if (topNoise > u_frameThreshold) {discard;}
  
  out_Col = vec4(color, 1.);
}

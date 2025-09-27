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

uniform vec4 u_Color; // The color with which to render this instance of geometry.
uniform float u_Time;

// These are the interpolated values out of the rasterizer, so you can't know
// their specific values without knowing the vertices that contributed to them
in vec4 fs_Nor;
in vec4 fs_LightVec;
in vec4 fs_Col;
in vec4 fs_Pos;

out vec4 out_Col; // This is the final output color that you will see on your
                  // screen for the pixel that is currently being processed.

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

vec2 fade(vec2 t) {
    return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

float grad(vec2 hash, vec2 p) {
    return dot(hash, p);
}

vec2 random2(vec2 p) {
    return normalize(vec2(
        fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453),
        fract(sin(dot(p, vec2(269.5, 183.3))) * 43758.5453)
    ) * 2.0 - 1.0);
}

float perlin(vec2 p) {
    vec2 pi = floor(p);
    vec2 pf = fract(p);

    vec2 w = fade(pf);

    vec2 g00 = random2(pi + vec2(0.0, 0.0));
    vec2 g10 = random2(pi + vec2(1.0, 0.0));
    vec2 g01 = random2(pi + vec2(0.0, 1.0));
    vec2 g11 = random2(pi + vec2(1.0, 1.0));

    float d00 = grad(g00, pf - vec2(0.0, 0.0));
    float d10 = grad(g10, pf - vec2(1.0, 0.0));
    float d01 = grad(g01, pf - vec2(0.0, 1.0));
    float d11 = grad(g11, pf - vec2(1.0, 1.0));

    float x1 = mix(d00, d10, w.x);
    float x2 = mix(d01, d11, w.x);
    float value = mix(x1, x2, w.y);

    return value * 0.5 + 0.5;
}


void main() {
    float pixelSize = 1.0 / 8.0;

    vec2 uv;

    // Get the absolute value of the normal to find the dominant axis
    vec3 absNor = abs(fs_Nor.xyz);

    if (absNor.y > absNor.x && absNor.y > absNor.z) {
        // Top or Bottom face (Y is dominant)
        uv = fs_Pos.xz;
    } else if (absNor.x > absNor.y && absNor.x > absNor.z) {
        // Left or Right face (X is dominant)
        uv = fs_Pos.yz;
    } else {
        // Front or Back face (Z is dominant)
        uv = fs_Pos.xy;
    }

    uv = floor(uv / pixelSize) * pixelSize;

    float stoneNoise = hash(uv * 16.0);
    stoneNoise =  clamp(floor(stoneNoise * 4.0) / 4.0 + 0.25, 0.0, 1.0); // 4 gray levels
    vec3 stoneColor = stoneNoise * u_Color.rgb;

    // Crack animation
    float progress = clamp(sin(u_Time * 0.1) * 1.0, 0.0, 1.0);
    float stage = floor(progress * 10.0);


    float crackPattern = perlin(uv * 8.0);
    crackPattern = smoothstep(0.45, 0.6, crackPattern);

    float revealMask = perlin(uv * 3.0);


    float stageThreshold = stage / 10.0;
    float crackVisibility = step(revealMask, stageThreshold);

    float finalCrack = 1.0 - ((1.0 - crackPattern) * crackVisibility);

    vec3 finalColor = stoneColor * finalCrack;

    out_Col = vec4(finalColor, 1.0);
}
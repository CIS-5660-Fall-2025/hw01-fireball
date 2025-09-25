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
uniform float u_Frequency;
uniform float u_Amplitude;
uniform float u_Time;

uniform float u_ObjectType;

// These are the interpolated values out of the rasterizer, so you can't know
// their specific values without knowing the vertices that contributed to them
in vec4 fs_Nor;
in vec4 fs_LightVec;
in vec4 fs_Col;
in vec4 fs_Pos;
in float fs_Disp;

out vec4 out_Col; // This is the final output color that you will see on your
                  // screen for the pixel that is currently being processed.
vec2 random2( vec2 p ) {
 return fract(sin(vec2(dot(p, vec2(127.1, 311.7)),
 dot(p, vec2(269.5,183.3))))
 * 43758.5453);
}

vec3 random3( vec3 p ) {
 return fract(sin(vec3(dot(p,vec3(127.1, 311.7,1 )),
    dot(p,vec3(269.5, 183.3, 1)),
    dot(p, vec3(420.6, 631.2, 1))
    )) * 43758.5453);
}

float surflet(vec3 p, vec3 gridPoint) {
    // Compute the distance between p and the grid point along each axis, and warp it with a
    // quintic function so we can smooth our cells
    vec3 t2 = abs(p - gridPoint);
    vec3 t3 = t2 * t2 * t2;
    vec3 t4 = t3 * t2;
    vec3 t5 = t4 * t2;

    vec3 t = vec3(1.f) - 6.f * t5 + 15.f * t4 - 10.f * t3;
    // Get the random vector for the grid point (assume we wrote a function random2
    // that returns a vec2 in the range [0, 1])
    vec3 gradient = random3(gridPoint) * 2. - vec3(1., 1., 1.);
    // Get the vector from the grid point to P
    vec3 diff = p - gridPoint;
    // Get the value of our height field by dotting grid->P with our gradient
    float height = dot(diff, gradient);
    // Scale our height field (i.e. reduce it) by our polynomial falloff function
    return height * t.x * t.y * t.z;
} 


float perlinNoise3D(vec3 p) {
    float surfletSum = 0.f;
    // Iterate over the four integer corners surrounding uv
    for(int dx = 0; dx <= 1; ++dx) {
        for(int dy = 0; dy <= 1; ++dy) {
            for(int dz = 0; dz <= 1; ++dz) {
                surfletSum += surflet(p, floor(p) + vec3(dx, dy, dz));
            }
        }
    }
    return surfletSum;
}

float fbm(vec3 p) {
    float value = 0.0;
    float amplitude = 10.0;
    float frequency = 4.0;
    for(int i = 0; i < 6; i++) {
        value += amplitude * perlinNoise3D(p * frequency);
        frequency *= 2.0;
        amplitude *= 0.7;
    }
    return value;
}

void main() {
    if (u_ObjectType < 0.5) {
        float radius = length(fs_Pos.xz);
        float angle = atan(fs_Pos.z, fs_Pos.x) - 0.21 - u_Time * 0.50;

        vec3 baseColor = vec3(1.0, 0.8, 0.9); // light pink
        vec3 tipColor  = vec3(0.8, 0.1, 0.5); // darker magenta

        float petals = 6.0;
        float petalMask = sin(angle * petals) * 0.5 + 0.5;
        petalMask = smoothstep(0.2, 1.0, petalMask);
        petalMask = pow(petalMask, 1.2);

        float h = clamp(fs_Pos.y * 0.5 + 0.5, 0.0, 1.0);
        vec3 col = mix(baseColor, tipColor, h);

        col = mix(col, col * vec3(1.2, 1.1, 1.1), petalMask);

        out_Col = vec4(col, 0.9);

    } else {
        vec3 pos = fs_Pos.xyz;
        float height = clamp(pos.y * 0.5 + 0.5, 0.0, 1.0);

        vec3 baseColor = u_Color.rgb;
        float saturation = max(baseColor.r, max(baseColor.g, baseColor.b)) - min(baseColor.r, min(baseColor.g, baseColor.b));
        float colorInjectFactor = smoothstep(0.4, 0.0, saturation);
        vec3 vibrantBase = vec3(1.0, 0.5, 0.0);

        baseColor = mix(baseColor, vibrantBase, colorInjectFactor);

        vec3 middleColor = pow(baseColor, vec3(1.75));
        vec3 coreColor = pow(baseColor, vec3(0.2));
        vec3 tipColor = vec3(1.0) - baseColor;

        vec3 temperatureTint;
        if (u_Color.r > u_Color.b) {
            temperatureTint = vec3(0.2, 0.1, 0.0);
        } else {
            temperatureTint = vec3(0.0, 0.1, 0.2);
        }
        vec3 coreGradient = mix(coreColor, middleColor, height) + 0.0;

        float rimFactor = smoothstep(0.4, 1.2, length(pos));

        vec3 finalColor = mix(coreGradient, tipColor, rimFactor);
        finalColor += temperatureTint;

        out_Col = vec4(finalColor, 1.0);
}
    
}
#version 300 es
precision highp float;

in float fs_Displacement;
in vec4 fs_Pos;

uniform float u_Time;

out vec4 outColor;

// Perlin Noise Part
float hash(vec3 p) {
    return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
}

float perlin(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    vec3 u = f * f * (3.0 - 2.0 * f);

    return mix(mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), u.x),
                   mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), u.x), u.y),
               mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), u.x),
                   mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), u.x), u.y), u.z);
}

// Worley Noise Part
vec3 random3(vec3 p) {
    return fract(sin(vec3(
        dot(p, vec3(127.1, 311.7, 74.7)),
        dot(p, vec3(269.5, 183.3, 246.1)),
        dot(p, vec3(113.5, 271.9, 124.6))
    )) * 43758.5453);
}

float worley(vec3 p) {
    float d = 1.0;
    for (int x = -1; x <= 1; x++) {
        for (int y = -1; y <= 1; y++) {
            for (int z = -1; z <= 1; z++) {
                vec3 cell = floor(p) + vec3(x, y, z);
                vec3 feature = cell + random3(cell);
                float dist = length(p - feature);
                d = min(d, dist);
            }
        }
    }
    return d;
}

void main() {
    // set d based on displacement, range from 0 to 1 for future use
    float d = clamp(fs_Displacement * 3.0, 0.0, 1.0);

    // bounce between red and yellow
    vec3 redColor = vec3(1.0, 0.2, 0.0);
    vec3 orangeColor = vec3(0.9, 0.5, 0.2);
    vec3 baseColor = mix(orangeColor, redColor, d);

    // Perlin Noise
    float perlinVal = perlin(fs_Pos.xyz * vec3(2.0, 6.0, 2.0) + vec3(sin(u_Time)));

    // Worley noise
    float worleyVal = worley(fs_Pos.xyz * 1.5 + 0.5 * sin(u_Time));
    float worleyContrast = smoothstep(0.0, 0.5, worleyVal);

    // Combine Perlin and Worley
    float combined = mix(perlinVal, 1.0 - worleyContrast, 0.5);

    // Make noisy color with combined noise
    vec3 noisyColor = baseColor * 0.8 + combined * 0.4;

    // Random Pulse through time
    float pulse = 0.3 * sin(u_Time * 2.0 + fs_Pos.y * 5.0 + fs_Displacement * 10.0);
    vec3 animatedColor = clamp(noisyColor + pulse, 0.0, 1.0);

    outColor = vec4(animatedColor, 1.0);
}

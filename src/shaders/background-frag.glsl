#version 300 es
precision highp float;

in vec4 fs_Nor;
in vec4 fs_Pos;

uniform float u_Den;
uniform float u_Time;

out vec4 out_Col;

float hash(vec3 p) {
    return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
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
    vec3 normal = normalize(fs_Nor.xyz);
    vec3 skyColor = vec3(0.02, 0.04, 0.1);

    // Scale space to control star density
    vec3 starSpace = normal * u_Den;

    // Worley noise returns distance to nearest feature point
    float d = worley(starSpace);

    // Sparse stars: only show clusters where distance is small
    float starCluster = smoothstep(0.1, 0.0, d);

    // Final color blend
    vec3 starColor = vec3(1.0);
    vec3 finalColor = mix(skyColor, starColor, starCluster);

    out_Col = vec4(finalColor, 1.0);
}
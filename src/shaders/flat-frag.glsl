#version 300 es
precision highp float;

uniform vec2 u_Dimensions;
uniform float u_Time;

in vec2 fs_Pos;
out vec4 out_Col;

const vec3 C_DEEP_OCEAN = vec3(10.0 / 255.0, 36.0 / 255.0, 99.0 / 255.0);
const vec3 C_MID_WATER  = vec3(62.0 / 255.0, 105.0 / 255.0, 144.0 / 255.0);
const vec3 C_AQUA_LIGHT = vec3(164.0 / 255.0, 212.0 / 255.0, 210.0 / 255.0);

vec2 random2(vec2 p) {
    return fract(sin(vec2(dot(p, vec2(127.1, 311.7)),
                          dot(p, vec2(269.5, 183.3)))) * 43758.5453);
}

float WorleyNoise(vec2 uv) {
    uv *= 10.0; // Now the space is 10x10 instead of 1x1. Change this to any number you want.
    vec2 uvInt = floor(uv);
    vec2 uvFract = fract(uv);
    float minDist = 1.0; // Minimum distance initialized to max.
    for(int y = -1; y <= 1; ++y) {
        for(int x = -1; x <= 1; ++x) {
            vec2 neighbor = vec2(float(x), float(y)); // Direction in which neighbor cell lies
            vec2 point = random2(uvInt + neighbor); // Get the Voronoi centerpoint for the neighboring cell
            vec2 diff = neighbor + point - uvFract; // Distance between fragment coord and neighbor’s Voronoi point
            float dist = length(diff);
            minDist = min(minDist, dist);
        }
    }
    return minDist;
}

vec3 gradient(float t) {
    if (t < 0.5) {
        return mix(C_DEEP_OCEAN, C_MID_WATER, t * 2.0);
    } else {
        return mix(C_MID_WATER, C_AQUA_LIGHT, (t - 0.5) * 2.0);
    }
}

void main() {
    vec2 uv = fs_Pos * vec2(u_Dimensions.x / u_Dimensions.y, 1.0);

    vec3 col = vec3(0.0);
    float gradientFactor = (uv.y + 1.0) * 0.5;

    vec3 gradientColor = gradient(gradientFactor);

    float noise = WorleyNoise(uv );
    float noiseFactor = clamp(noise, 0.0, 1.0);

    vec3 finalColor = mix(gradientColor, vec3(0.0), noiseFactor * .07) * .5;
    out_Col = vec4(col + finalColor, 1.0);
}
#version 300 es
precision highp float;

in vec3 fs_WorldPos;
out vec4 out_Col;

uniform vec4 u_Color;
uniform float u_Time;

float map(float value, float old_lo, float old_hi, float new_lo, float new_hi) {
    float old_range = old_hi - old_lo;
    if (old_range == 0.0) {
        return new_lo;
    } else {
        float new_range = new_hi - new_lo;
        return (((value - old_lo) * new_range) / old_range) + new_lo;
    }
}

float hash(float x) {
    return fract(sin(x) * 43758.5453123);
}

vec3 gradient(vec3 cell) {
    float h_i = hash(cell.x);
    float h_j = hash(cell.y + pow(h_i, 3.0));
    float h_k = hash(cell.z + pow(h_j, 5.0));
    float ii = map(fract(h_i + h_j + h_k), 0.0, 1.0, -1.0, 1.0);
    float jj = map(fract(h_j + h_k),        0.0, 1.0, -1.0, 1.0);
    float kk = map(h_k,                     0.0, 1.0, -1.0, 1.0);
    return normalize(vec3(ii, jj, kk));
}

float fade(float t) {
    float t3 = t * t * t;
    float t4 = t3 * t;
    float t5 = t4 * t;
    return (6.0 * t5) - (15.0 * t4) + (10.0 * t3);
}

float noise(in vec3 coord) {
    vec3 cell = floor(coord);
    vec3 unit = fract(coord);

    vec3 unit_000 = unit;
    vec3 unit_100 = unit - vec3(1.0, 0.0, 0.0);
    vec3 unit_001 = unit - vec3(0.0, 0.0, 1.0);
    vec3 unit_101 = unit - vec3(1.0, 0.0, 1.0);
    vec3 unit_010 = unit - vec3(0.0, 1.0, 0.0);
    vec3 unit_110 = unit - vec3(1.0, 1.0, 0.0);
    vec3 unit_011 = unit - vec3(0.0, 1.0, 1.0);
    vec3 unit_111 = unit - 1.0;

    vec3 c_000 = cell;
    vec3 c_100 = cell + vec3(1.0, 0.0, 0.0);
    vec3 c_001 = cell + vec3(0.0, 0.0, 1.0);
    vec3 c_101 = cell + vec3(1.0, 0.0, 1.0);
    vec3 c_010 = cell + vec3(0.0, 1.0, 0.0);
    vec3 c_110 = cell + vec3(1.0, 1.0, 0.0);
    vec3 c_011 = cell + vec3(0.0, 1.0, 1.0);
    vec3 c_111 = cell + 1.0;

    float wx = fade(unit.x);
    float wy = fade(unit.y);
    float wz = fade(unit.z);

    float x000 = dot(gradient(c_000), unit_000);
    float x100 = dot(gradient(c_100), unit_100);
    float x001 = dot(gradient(c_001), unit_001);
    float x101 = dot(gradient(c_101), unit_101);
    float x010 = dot(gradient(c_010), unit_010);
    float x110 = dot(gradient(c_110), unit_110);
    float x011 = dot(gradient(c_011), unit_011);
    float x111 = dot(gradient(c_111), unit_111);

    float y0 = mix(x000, x100, wx);
    float y1 = mix(x001, x101, wx);
    float y2 = mix(x010, x110, wx);
    float y3 = mix(x011, x111, wx);

    float z0 = mix(y0, y2, wy);
    float z1 = mix(y1, y3, wy);

    return mix(z0, z1, wz);
}

void main() {
    vec3 p = fs_WorldPos * 3.0;
    float t = u_Time * 0.01;

    float a = 0.25 * t;
    float ca = cos(a), sa = sin(a);
    mat3 rotY = mat3(
        ca,  0.0, sa,
        0.0, 1.0, 0.0,
       -sa,  0.0, ca
    );
    p = rotY * p;

    vec3 warpP = p * 0.25 + vec3(0.0, 0.0, 0.15 * t);
    vec3 warp = vec3(
        noise(warpP + vec3(11.7,  0.0,  0.0)),
        noise(warpP + vec3( 0.0, 23.9,  0.0)),
        noise(warpP + vec3( 0.0,  0.0, 37.1))
    );
    vec3 coord = p + 0.35 * warp;
    coord += vec3(0.0, 0.0, 0.05 * t);

    float v = noise(coord);
    float n = 0.5 + 0.5 * v;

    out_Col = vec4(u_Color.rgb * n, u_Color.a);
}


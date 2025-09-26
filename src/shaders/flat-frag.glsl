#version 300 es
precision highp float;

uniform vec3  u_Eye, u_Ref, u_Up; // unused here but kept for compatibility
uniform vec2  u_Dimensions;
uniform float u_Time;

in vec2 fs_Pos;        // clip-space [-1,1]
out vec4 out_Col;

float bias (float b, float t) {
    return pow(t, log(b) / log(0.5));
}

float gain (float g, float t) {
    if (t < 0.5) {
        return bias(1.0 - g, 2.0 * t) / 2.0;
    } else {
        return 1.0 - bias(1.0 - g, 2.0 - 2.0 * t) / 2.0;
    }
}

vec2 random2(vec2 xy){
  return vec2(
  fract(sin(dot(xy ,vec2(12.9898, 78.233))) * 43758.5453),
  fract(sin(dot(xy ,vec2(14.7921, 48.012))) * 39476.4739));
}

vec2 worley2D(vec2 xy) {
    float minDist = 100.0;
    float secondMinDist = 100.0;
    vec2 cellLocation = fract(xy);
    vec2 cell = floor(xy);
    for(int x = -1; x <= 1; x++) {
        for(int y = -1; y <= 1; y++) {
          vec2 adj = vec2(float(x), float(y));
          vec2 neighborCell = cell + adj;
          vec2 worleyPoint = random2(neighborCell);
          float dist = length(adj + worleyPoint - cellLocation);
          if (dist < minDist) {
              secondMinDist = minDist;
              minDist = dist;
          }
        }
    }
    return vec2(minDist, secondMinDist);
}

void main() {

  float t = u_Time / 200.0;
  vec2 uv = fs_Pos * 10.0;

  // make background move
  vec2 flow = vec2(0.6 * t, -0.4 * t);
  vec2 warp = .2 * vec2(sin(uv.y * 1.5 + 1.7 * t), cos(uv.x * 1.2 - 1.1 * t)) * 0.35;
  uv = uv + flow + warp;

  // quantify how close to an edge of a cell we are
  vec2 dist = worley2D(uv);
  float closest = dist.x;
  float secondClosest = dist.y;

  float scale = gain(0.8, closest / 1.41);

  vec3 water = vec3(0.05, 0.45, 0.75);

  // Add caustic lines and specular sparkle
  vec3 color = water + 0.35 * scale;

  out_Col = vec4(color, 1.0);
}

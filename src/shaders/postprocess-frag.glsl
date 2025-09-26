#version 300 es
precision highp float;


uniform sampler2D u_Texture;
uniform float u_OutlineScale;
uniform float u_OutlineSteps;
uniform float u_Time;
uniform float u_TimeScale;

uniform vec2 u_Dimensions;

in vec2 fs_UV;
out vec4 out_Col;


// also reusing from 5600 code
vec2 random2D( vec2 p ) {
    return fract(sin(vec2(dot(p, vec2(127.1, 311.7)),
                          dot(p, vec2(269.5,183.3))))
                     * 43758.5453);
}
float worley2D(vec2 pos, float scale, out vec2 targetPoint) {
    pos *= scale;
    vec2 posInt = floor(pos);
    vec2 posFract = fract(pos);
    float minDist = 1.0;
    for (int y = -1; y <= 1; ++y) {
        for (int x = -1; x <= 1; ++x) {
            vec2 neighbor = vec2(float(x), float(y));
            vec2 point = random2D(posInt + neighbor);
            vec2 diff = neighbor + point - posFract;
            float dist = length(diff);
            if(minDist > dist) {
                minDist = dist;
                targetPoint = (posInt + neighbor + point) / scale;
            }
        }
    }
    return minDist / scale;
}


vec3 random3D( vec3 p ) {
    return fract(sin(vec3(dot(p, vec3(127.1f, 311.7f, 191.999f)),
                          dot(p, vec3(269.5f, 183.3f, 773.2f)),
                          dot(p, vec3(103.37f, 217.83f, 523.7f)))) * 43758.5453f);
}
float worley3D( vec3 p, out vec3 targetPoint ) {
    vec3 pFloor = floor(p);
    float minDist = 1000.f;
    for (int dz = -1; dz <= 1; ++dz) {
        for (int dy = -1; dy <= 1; ++dy) {
            for (int dx = -1; dx <= 1; ++dx) {
                vec3 gridPoint = pFloor + vec3(dx,dy,dz);
                vec3 samplePoint = random3D(gridPoint) + gridPoint;

                float curDist = length(samplePoint - p);
                if (minDist > curDist) {
                    minDist = curDist;
                    targetPoint = samplePoint;
                }
            }
        }
    }
    return minDist;
}


float perlin3D( vec3 p ) {
    vec3 pFloor = floor(p);
    float sum = 0.f;
    for (int dz = 0; dz <= 1; ++dz) {
        for (int dy = 0; dy <= 1; ++dy) {
            for (int dx = 0; dx <= 1; ++dx) {
                vec3 distVec = p - (pFloor + vec3(dx,dy,dz));
                vec3 gradientVec = random3D(pFloor + vec3(dx,dy,dz)) * 2.f - 1.f;
                float influence = dot(gradientVec, distVec);
                // sum += influence;
                vec3 absDistVec = abs(distVec);
                vec3 scaleVec = 1.f - 6.f * pow(absDistVec, vec3(5.f)) + 15.f * pow(absDistVec, vec3(4.f)) - 10.f * pow(absDistVec, vec3(3.f));

                sum += scaleVec.x * scaleVec.y * scaleVec.z * influence;
            }
        }
    }
    return sum;
}

#define FBM_OCTAVES 8
float fbm( vec3 p ) {
  float total = 0.f;
  const float persistence = 0.5f;
  float frequency = 1.f;
  float amplitude = 1.f;
  for (int i = 0; i < FBM_OCTAVES; ++i) {
    total += perlin3D(p * frequency) * amplitude;
    frequency *= 2.f;
    amplitude *= persistence;
  }

  return total;
}


#define NINE_POINT_OUTLINE 1
#define OUTLINE_PERLIN 0
// #define STEP_PERLIN 0

#define CIRCLE_OUTLINE 1

#define TAU 6.283185307179586476925286f

void main() {

    vec4 accColor = vec4(0.f,0.f,0.f,0.f);

    // for (float dx = -u_OutlineScale; dx <= u_OutlineScale; ++dx) {
        // for (float dy = -u_OutlineScale; dy <= u_OutlineScale; ++dy) {
    // float stepCount = ceil(u_OutlineScale / 20.f);
#if CIRCLE_OUTLINE
    accColor = texelFetch(u_Texture, ivec2(gl_FragCoord), 0);

    if (accColor.a == 0.f && u_OutlineSteps > 0.f) {
        float step = u_OutlineSteps > 0.f ? TAU / u_OutlineSteps : TAU;
        for (float theta = 0.f; theta < TAU; theta += step) {
            vec2 sampleOffset = vec2(cos(theta), sin(theta));
            vec2 target = gl_FragCoord.xy + sampleOffset * u_OutlineScale;
            vec4 sampleColor = texelFetch(u_Texture, ivec2(target), 0);
            if (sampleColor.a > 0.f) {
                accColor = vec4(0.f, 0.f, 0.f, 1.f);
                break;
            }
        }
    }
#elif NINE_POINT_OUTLINE
    float step = u_OutlineScale > 0.f ? u_OutlineScale / stepCount : 1.f;

// #if STEP_PERLIN
    // for (float dx = -u_OutlineScale; dx <= u_OutlineScale; dx += step / stepCount * (1.f + 0.5f * (perlin3D(vec3(gl_FragCoord.xy + vec2(dx,0.f), u_Time * 0.02f))))) {
        // for (float dy = -u_OutlineScale; dy <= u_OutlineScale; dy += step / stepCount * (1.f + 0.5f * (perlin3D(vec3(gl_FragCoord.yx + vec2(dy,dx), u_Time * 0.02f))))) {
// #else
    for (float dx = -u_OutlineScale; dx <= u_OutlineScale; dx += step) {
        for (float dy = -u_OutlineScale; dy <= u_OutlineScale; dy += step) {
// #endif

#if OUTLINE_PERLIN
            vec2 target = gl_FragCoord.xy + vec2(dx,dy);
            if (abs(dx) >= 0.0001f || abs(dy) >= 0.0001f) {
                vec2 targetAdd = step * vec2(perlin3D(vec3(target.xy * 0.9f, u_Time * 0.02f)),
                                            perlin3D(vec3(target.yx * 0.9f + vec2(89123.f, 41351.f), u_Time * 0.02f)));
                target += targetAdd;

            }
            vec4 sampleColor = texelFetch(u_Texture, ivec2(target), 0);
#else
            // float dist = worley2D((gl_FragCoord.xy), u_OutlineScale * 1.f, target);
            vec4 sampleColor = texelFetch(u_Texture, ivec2(gl_FragCoord.xy + vec2(dx,dy)), 0);
#endif


            if (sampleColor.a > 0.f) {
                if (abs(dx) < 0.0001f && abs(dy) < 0.0001f) {
                    accColor = sampleColor;
                    break;
                } else if (accColor.a == 0.f) {
                    accColor = vec4(0.f, 0.f, 0.f, 1.f);
                }
            }

            // accColor.rgb = max(, accColor.rgb);
        }
    }
#else
    vec3 target;
    accColor = texture(u_Texture, fs_UV);
    if (accColor.a == 0.f) {
        // float dist = worley2D(fs_UV, u_OutlineScale * 1.f, target);
        float dist = worley3D(vec3(fs_UV * u_OutlineScale,u_Time * 0.01f), target);
        target /= u_OutlineScale;
        accColor = texture(u_Texture, target.xy);
        if (accColor.a > 0.f) {
            accColor = vec4(0.f,0.f,0.f,0.5f);
        }
    }
        
#endif
    

    // accColor.rgb > 
    // accColor.rgb /= 100.f;
    // vec4 texColor = texture(u_Texture, fs_UV);

    // texColor.a = fs_UV.x;
    out_Col = accColor;
}
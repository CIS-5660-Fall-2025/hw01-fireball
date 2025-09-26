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
uniform vec3 u_Eye;
uniform vec3 u_PosOrigin;
uniform float u_Radius;
uniform float u_Time;

uniform int u_SmokeMaxSteps;
uniform float u_SmokeStepSize;

// These are the interpolated values out of the rasterizer, so you can't know
// their specific values without knowing the vertices that contributed to them
in vec4 fs_Nor;
in vec4 fs_LightVec;
in vec4 fs_Col;
in vec4 fs_Pos;
// in vec4 fs_PosLocal;
// in vec4 fs_PosOrigin; // icosphere constructor actually doesn't change model matrix for displacement so passing this in as a uniform rather than calculating in shaders

uniform mat4 u_ModelInv;

out vec4 out_Col; // This is the final output color that you will see on your
                  // screen for the pixel that is currently being processed.



vec3 random3D( vec3 p ) {
    return fract(sin(vec3(dot(p, vec3(127.1f, 311.7f, 191.999f)),
                                         dot(p, vec3(269.5f, 183.3f, 773.2f)),
                                         dot(p, vec3(103.37f, 217.83f, 523.7f)))) * 43758.5453f);
}
float random3Dto1DTime( vec3 p ) {
    return fract(sin(dot(p, vec3(127.1f, 311.7f, 191.999f))) * 43758.5453f + u_Time * 26314.5235317f);
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



float getDensity(vec3 p) {
    // if (length(p.xyz) > 2.f) {
    vec3 pos = p - u_PosOrigin.xyz;
    float lp = length(pos.xz);
    if (lp - pos.y / 40.f > u_Radius) {
        return 0.f;
    }
    if (perlin3D(pos + vec3(0.f,u_Time * -0.05f, 0.f)) < 0.2 / lp) {
        return 0.f;
    }
    // if (perlin3D(pos + vec3(0.f,u_Time * -0.05f, 0.f)) < 0.2 / lp) {
    //     return 0.f;
    // }
    return 0.1;
    // return 0.015625f;
}

// #define MAX_STEPS 64
float accumulateDensity(vec3 pos, vec3 direction) {
    float acc = 0.f;
    for (int i = 0; i < u_SmokeMaxSteps; ++i) {
        acc += getDensity(pos);
        pos += direction * (0.5f + random3Dto1DTime(pos));
    }
    return acc;
}

void main()
{
    // Material base color (before shading)
        vec4 diffuseColor = u_Color;

        // Calculate the diffuse term for Lambert shading
        float diffuseTerm = dot(normalize(fs_Nor), normalize(fs_LightVec));
        // Avoid negative lighting values
        diffuseTerm = clamp(diffuseTerm, 0.f, 1.f);

        float ambientTerm = 0.2;

        float lightIntensity = diffuseTerm + ambientTerm;   //Add a small float value to the color multiplier
                                                            //to simulate ambient lighting. This ensures that faces that are not
                                                            //lit by our point light are not completely black.

        // diffuseColor.a = 0.1f;
        // vec4 modelEye = u_ModelInv * vec4(u_Eye,1.f);
        // vec3 eyeDir = normalize(fs_PosLocal.xyz - modelEye.xyz) * 0.03125;

        vec3 eyeDir = normalize(fs_Pos.xyz - u_Eye.xyz) * u_SmokeStepSize;
        float d = accumulateDensity(fs_Pos.xyz, eyeDir);
        // float d = accumulateDensity(fs_PosLocal.xyz, eyeDir);

        // diffuseColor = vec4(0.f, 0.f, 0.f, 1.f);
        
        diffuseColor.a = clamp(0.f, 1.f, d);
        // if (length(fs_PosOrigin.xyz) > 0.f) {
        //     diffuseColor = vec4(1.f);
        // }

        // diffuseColor.a = dot(, vec3(-1.f,0.f,0.f));
        // Compute final shaded color
        out_Col = vec4(diffuseColor.rgb, diffuseColor.a);
        // out_Col = vec4(diffuseColor.rgb * lightIntensity, diffuseColor.a);
}

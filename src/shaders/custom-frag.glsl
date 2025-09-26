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
precision highp int;
precision highp float;

uniform vec4 u_Color; // The color with which to render this instance of geometry.
uniform int u_Time;

// These are the interpolated values out of the rasterizer, so you can't know
// their specific values without knowing the vertices that contributed to them
in vec4 fs_Nor;
in vec4 fs_LightVec;
in vec4 fs_Col;

in vec4 fs_Pos;

out vec4 out_Col; // This is the final output color that you will see on your
                  // screen for the pixel that is currently being processed.


// reused from 5600
vec3 random3D( vec3 p ) {
    return fract(sin(vec3(dot(p, vec3(127.1f, 311.7f, 191.999f)),
                                         dot(p, vec3(269.5f, 183.3f, 773.2f)),
                                         dot(p, vec3(103.37f, 217.83f, 523.7f)))) * 43758.5453f);
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

float worley3D( vec3 p ) {
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
                }
            }
        }
    }
    return minDist;
}

float triangleWave( float x, float freq, float amplitude ) {
    return abs(mod(x * freq, amplitude) - (0.5 * amplitude));
}

void main()
{
    // Material base color (before shading)
        vec4 diffuseColor = u_Color;

        float worleyResult = worley3D(fs_Pos.xyz * 2.f);
        vec4 lightVec = fs_LightVec; 
        if (worleyResult < 0.4f) {
            // colorProd = vec3(1.f);
            // colorProd = vec3(1.f - lightIntensity * (colorProd.x + colorProd.y + colorProd.z) / 3.f);
            lightVec *= -1.f;
        }

        // Calculate the diffuse term for Lambert shading
        float diffuseTerm = dot(normalize(fs_Nor), normalize(lightVec));
        // Avoid negative lighting values
        diffuseTerm = clamp(diffuseTerm, 0.f, 1.f);

        // float ambientTerm = 0.6f;
        float ambientTerm = 0.2f;

        float lightIntensity = diffuseTerm + ambientTerm;   //Add a small float value to the color multiplier
                                                            //to simulate ambient lighting. This ensures that faces that are not
                                                            //lit by our point light are not completely black.

        // Compute final shaded color
        // diffuseColor = vec4(sin(gl_FragCoord.xyz), 1);
        // diffuseColor = vec4(sin(fs_Pos.xyz), 1);
        // diffuseColor = vec4(random3D(floor(fs_Pos.xyz * 10.f)), 1.f);
        // diffuseColor = vec4(random3D(gl_FragCoord.xyz), 1);
        // diffuseColor = vec4((perlin3D(fs_Pos.xyz * 5.f) + 1.f) * 0.5f, 0,0,1);


        // float offset = (sin(float(u_Time) * 0.017f) + 1.f) * 5.f;

        // float perlinResult = (perlin3D(fs_Pos.xyz * (3.f + triangleWave(offset, 0.2f, 5.f))) + 1.f) * 0.5f;
        // float perlinResult2 = (perlin3D(fs_Pos.xyz * (3.f + triangleWave(2.f + offset, 0.2f, 5.f))) + 1.f) * 0.5f;
        // float perlinResult3 = (perlin3D(fs_Pos.xyz * (3.f + triangleWave(4.f + offset, 0.2f, 5.f))) + 1.f) * 0.5f;

        float t = float(u_Time);

        float perlinResult = (perlin3D(fs_Pos.xyz * (5.f + 2.f * sin(t * 0.011))) + 1.f) * 0.5f;
        float perlinResult2 = (perlin3D(fs_Pos.xyz * (5.f + 2.f * sin(2.f + t * 0.015))) + 1.f) * 0.5f;
        float perlinResult3 = (perlin3D(fs_Pos.xyz * (5.f + 2.f * sin(4.f + t * 0.019))) + 1.f) * 0.5f;
        vec3 noiseColor = vec3(perlinResult, perlinResult2, perlinResult3);
        float spot = smoothstep(0.0f,0.9f,perlin3D(fs_Pos.xyz * 1.5f)); // aside: smoothstep not really necessary now I think since I ended up just using this as a threshold, so could just adjust what that threshold is
        float spot2 = smoothstep(0.0f,0.9f,perlin3D(fs_Pos.xyz * 3.f));
        float spot3 = smoothstep(0.0f,0.9f,perlin3D(fs_Pos.xyz * 0.75f));
        if (spot > 0.1f) {
            // noiseColor = vec3(1.f,1.f,1.f);
            // diffuseColor.rgb = vec3(1.f) - diffuseColor.rgb;
            // noiseColor = vec3(1.f) - noiseColor;
            noiseColor.r = 1.f - noiseColor.g;
        }
        if (spot2 > 0.1f) {
            // noiseColor = vec3(1.f) - noiseColor;
            noiseColor.g = 1.f - noiseColor.b;
        }
        if (spot3 > 0.1f) {
            // noiseColor = vec3(1.f) - noiseColor;
            noiseColor.b = 1.f - noiseColor.r;
        }


        vec3 colorProd = diffuseColor.rgb * noiseColor;
        // float worleyResult = worley3D(fs_Pos.xyz * 2.f);
        // if (worleyResult < 0.4f) {
        //     // colorProd = vec3(1.f);
        //     colorProd = vec3(1.f - lightIntensity * (colorProd.x + colorProd.y + colorProd.z) / 3.f);
        // }
        diffuseColor = vec4(colorProd, 1.f);
        out_Col = vec4(diffuseColor.rgb * lightIntensity, diffuseColor.a);
}

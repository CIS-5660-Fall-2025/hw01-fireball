#version 300 es
precision highp float;

// The vertex shader used to render the background of the scene

// in vec4 vs_Pos;
// out vec2 fs_Pos;

// void main() {
//   fs_Pos = vs_Pos.xy;
//   gl_Position = vs_Pos;
// }


uniform mat4 u_Model;      

uniform mat4 u_ModelInvTr; 

uniform mat4 u_ViewProj;   
uniform float u_Time;

uniform float u_TimeScale;
uniform float u_WorleyScale;

in vec4 vs_Pos;             // The array of vertex positions passed to the shader
in vec4 vs_Nor;             // The array of vertex normals passed to the shader
in vec4 vs_Col;             // The array of vertex colors passed to the shader.

out vec4 fs_Nor;            // The array of normals that has been transformed by u_ModelInvTr. This is implicitly passed to the fragment shader.
out vec4 fs_LightVec;       // The direction in which our virtual light lies, relative to each vertex. This is implicitly passed to the fragment shader.
out vec4 fs_Col;            // The color of each vertex. This is implicitly passed to the fragment shader.

out float fs_NormOffset;

out float fs_RoomDistance;

out vec4 fs_Pos;

const vec4 lightPos = vec4(5, 5, 3, 1); //The position of our virtual light, which is used to compute the shading of
                                        //the geometry in the fragment shader.


//from HW00
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

float bias (float b, float t) {
  return pow(t, log(b) / log(0.5f));
}


#define offsetInFrag 1

#if offsetInFrag

void main()
{
    fs_Col = vs_Col;                         // Pass the vertex colors to the fragment shader for interpolation

    mat3 invTranspose = mat3(u_ModelInvTr);
    vec4 normal = vec4(invTranspose * vec3(vs_Nor), 0);          // Pass the vertex normals to the fragment shader for interpolation.
                                                            // Transform the geometry's normals by the inverse transpose of the
                                                            // model matrix. This is necessary to ensure the normals remain
                                                            // perpendicular to the surface after the surface is transformed by
                                                            // the model matrix.

    fs_Nor = normal;

    vec4 modelPosition = u_Model * vs_Pos;   // Temporarily store the transformed vertex positions for use below

    // TODO not sure how I want mouse interaction to behave
    // modelPosition.xy -= (u_MouseCoords - 0.5f) / max(0.4f, distance(modelPosition.xy, u_MouseCoords));
    

    float normOffset = 0.f;
    // normOffset += (sin(vs_Pos.x*5.f - u_Time * 0.03f) + cos(vs_Pos.y*5.f - u_Time * 0.05f) * 2.f + sin(vs_Pos.z*5.f - u_Time * 0.07f) + 4.f) / 4.f * (1.f + vs_Pos.y);

    // normOffset += (perlin3D(vs_Pos.xyz * 25.f + vec3(u_Time * 0.023f, u_Time * 0.017f, u_Time * -0.047f)) + 1.f) * 0.2f;
    // normOffset += (perlin3D(vs_Pos.xyz * 5.f + vec3(u_Time * 0.017f, u_Time * 0.023f, u_Time * 0.047f)) + 1.f) * 0.5f;

    float t = u_Time * u_TimeScale;

    float wNoise = worley3D((vs_Pos.xyz * 4.f + vec3(0.f,t * -0.1f,0.f)) * u_WorleyScale);
    
    // sphere bounds (-1.f, 1.f)
    // if (vs_Pos.y > 0.9f) {
    //   normOffset += 1.f;
    // }

    normOffset += smoothstep((-vs_Pos.y + 0.6f) * 0.5f,1.f,wNoise);
    // normOffset += smoothstep(0.4 - vs_Pos.y * 0.5f,0.9,wNoise);
    // normOffset += 1.f - wNoise * wNoise;

    // normOffset *= random3D(vs_Pos.xyz * 0.0000001f).x > 0.5f ? 1.f : 0.f;


    // modelPosition += normal * vec4(vec3(normOffset),0.f);
    // modelPosition.y += normOffset;

    // float xzScale = (sin(modelPosition.y * 3.f - u_Time * 0.07f) + 1.f) * 0.2f + 0.8f;

    // float xzScale = (sin(modelPosition.y * 3.f - t * 0.0765f) + 1.f) * 0.1f;
    // xzScale *= sin(t * 0.0123f) + 1.f;
    // // xzScale *= u_XZAmplitude;
    // xzScale += 0.9f;
    // xzScale += 1.f;
    // xzScale += (sin(modelPosition.y * 5.f - u_Time * 0.013f) + 1.f) * 0.4 + 0.6f;
    // xzScale *= 0.5f;
    // float xzScale = (sin(vs_Pos.y * 3.f - u_Time * 0.07f) + 1.f) * 0.2f + 0.8f;
    // xzScale = bias(0.6f, xzScale);

    fs_NormOffset = normOffset;

    // modelPosition.xz *= xzScale;
    
    // vec3 fbmVal = (smoothstep(-0.8f,0.8f,
    //               vec3(fbm(modelPosition.xyz * 3.f),
    //                    fbm(modelPosition.yzx * 3.f),
    //                    fbm(modelPosition.zxy * 3.f))) - 0.5f) * 0.1f;
    // fbmVal *= (1.5f + vs_Pos.y);
    // modelPosition.xyz += fbmVal;

    modelPosition.xyz *= 80.f;

    fs_Pos = modelPosition;
    // modelPosition.xyz
    // modelPosition.y += normOffset * 0.4f * (sin(u_Time * 0.01f));
    
    // modelPosition += normal * vec4(2.f + sin(vs_Pos.y * 10.f)) / 3.f;
    // modelPosition += normal * vec4(2.f + sin(u_Time * 0.5f * vs_Pos.x * vs_Pos.y * vs_Pos.z)) / 3.f;
    // modelPosition += normal * vec4(2.f + sin(u_Time * 0.2f + 10.f * vs_Pos.x)) / 3.f;

    fs_LightVec = lightPos - modelPosition;  // Compute the direction in which the light source lies

    gl_Position = u_ViewProj * modelPosition;// gl_Position is a built-in variable of OpenGL which is
                                             // used to render the final positions of the geometry's vertices
}


#else

void main()
{
    fs_Col = vs_Col;                         // Pass the vertex colors to the fragment shader for interpolation

    mat3 invTranspose = mat3(u_ModelInvTr);
    vec4 normal = vec4(invTranspose * vec3(vs_Nor), 0);          // Pass the vertex normals to the fragment shader for interpolation.
                                                            // Transform the geometry's normals by the inverse transpose of the
                                                            // model matrix. This is necessary to ensure the normals remain
                                                            // perpendicular to the surface after the surface is transformed by
                                                            // the model matrix.

    fs_Nor = normal;

    vec4 modelPosition = u_Model * vs_Pos;   // Temporarily store the transformed vertex positions for use below

    // vec4 firePosition = modelPosition;
    // TODO project^ onto sphere?
    vec4 firePosition = vec4(normalize(modelPosition.xyz),1.f);

    float normOffset = 0.f;
    // normOffset += (sin(vs_Pos.x*5.f - u_Time * 0.03f) + cos(vs_Pos.y*5.f - u_Time * 0.05f) * 2.f + sin(vs_Pos.z*5.f - u_Time * 0.07f) + 4.f) / 4.f * (1.f + vs_Pos.y);

    // normOffset += (perlin3D(vs_Pos.xyz * 25.f + vec3(u_Time * 0.023f, u_Time * 0.017f, u_Time * -0.047f)) + 1.f) * 0.2f;
    // normOffset += (perlin3D(vs_Pos.xyz * 5.f + vec3(u_Time * 0.017f, u_Time * 0.023f, u_Time * 0.047f)) + 1.f) * 0.5f;

    float t = u_Time * u_TimeScale; // TODO add a controllable time scale term?

    float wNoise = worley3D(vs_Pos.xyz * 4.f + vec3(0.f,t * -0.1f,0.f));
    
    // sphere bounds (-1.f, 1.f)
    // if (vs_Pos.y > 0.9f) {
    //   normOffset += 1.f;
    // }

    normOffset += smoothstep((-vs_Pos.y + 0.6f) * 0.5f,1.f,wNoise);
    // normOffset += smoothstep(0.4 - vs_Pos.y * 0.5f,0.9,wNoise);
    // normOffset += 1.f - wNoise * wNoise;

    // normOffset *= random3D(vs_Pos.xyz * 0.0000001f).x > 0.5f ? 1.f : 0.f;


    firePosition += normal * vec4(vec3(normOffset),0.f);
    firePosition.y += normOffset;

    // float xzScale = (sin(modelPosition.y * 3.f - u_Time * 0.07f) + 1.f) * 0.2f + 0.8f;

    float xzScale = (sin(firePosition.y * 3.f - t * 0.0765f) + 1.f) * 0.1f;
    xzScale *= sin(t * 0.0123f) + 1.f;
    xzScale += 1.f;
    // xzScale += (sin(modelPosition.y * 5.f - u_Time * 0.013f) + 1.f) * 0.4 + 0.6f;
    // xzScale *= 0.5f;
    // float xzScale = (sin(vs_Pos.y * 3.f - u_Time * 0.07f) + 1.f) * 0.2f + 0.8f;
    // xzScale = bias(0.6f, xzScale);

    

    firePosition.xz *= xzScale;
    
    vec3 fbmVal = (smoothstep(-0.8f,0.8f,
                  vec3(fbm(firePosition.xyz * 3.f),
                       fbm(firePosition.yzx * 3.f),
                       fbm(firePosition.zxy * 3.f))) - 0.5f) * 0.1f;
    fbmVal *= (1.5f + vs_Pos.y);
    firePosition.xyz += fbmVal;

    modelPosition.xyz *= 20.f;

    float d = distance(firePosition,modelPosition);
    // normOffset *= 1.f / distance(firePosition,modelPosition)
    fs_RoomDistance = d;

    fs_NormOffset = normOffset;
    // modelPosition = u_Model * vs_Pos;
    // fs_Pos = modelPosition;
    fs_Pos = firePosition;
    // modelPosition.xyz
    // modelPosition.y += normOffset * 0.4f * (sin(u_Time * 0.01f));
    
    // modelPosition += normal * vec4(2.f + sin(vs_Pos.y * 10.f)) / 3.f;
    // modelPosition += normal * vec4(2.f + sin(u_Time * 0.5f * vs_Pos.x * vs_Pos.y * vs_Pos.z)) / 3.f;
    // modelPosition += normal * vec4(2.f + sin(u_Time * 0.2f + 10.f * vs_Pos.x)) / 3.f;

    fs_LightVec = lightPos - modelPosition;  // Compute the direction in which the light source lies

    gl_Position = u_ViewProj * modelPosition;// gl_Position is a built-in variable of OpenGL which is
                                             // used to render the final positions of the geometry's vertices
}

#endif
#version 300 es

//This is a vertex shader. While it is called a "shader" due to outdated conventions, this file
//is used to apply matrix transformations to the arrays of vertex data passed to it.
//Since this code is run on your GPU, each vertex is transformed simultaneously.
//If it were run on your CPU, each vertex would have to be processed in a FOR loop, one at a time.
//This simultaneous transformation allows your program to run much faster, especially when rendering
//geometry with millions of vertices.

uniform mat4 u_Model;       // The matrix that defines the transformation of the
                            // object we're rendering. In this assignment,
                            // this will be the result of traversing your scene graph.

uniform mat4 u_ModelInvTr;  // The inverse transpose of the model matrix.
                            // This allows us to transform the object's normals properly
                            // if the object has been non-uniformly scaled.

uniform mat4 u_ViewProj;    // The matrix that defines the camera's transformation.
                            // We've written a static matrix for you to use for HW2,
                            // but in HW3 you'll have to generate one yourself

// uniform vec3 u_Velocity;
// uniform float u_TailLength;

uniform float u_Time;

uniform float u_NoiseAmount; // How strong the surface displacement is
uniform float u_NoiseSpeed;  // How fast the surface churns
uniform float u_NoiseScale;  // The size/frequency of the noise pattern

uniform vec3 u_FireballVelocity;

in vec4 vs_Pos;             // The array of vertex positions passed to the shader

in vec4 vs_Nor;             // The array of vertex normals passed to the shader

in vec4 vs_Col;             // The array of vertex colors passed to the shader.

out vec4 fs_Pos;
out vec4 fs_Nor;            // The array of normals that has been transformed by u_ModelInvTr. This is implicitly passed to the fragment shader.
out vec4 fs_LightVec;       // The direction in which our virtual light lies, relative to each vertex. This is implicitly passed to the fragment shader.
out vec4 fs_Col;            // The color of each vertex. This is implicitly passed to the fragment shader.

out float fs_PullFactor;
out float fs_ShapeFactor;


const vec4 lightPos = vec4(-5, 3, 5, 1); //The position of our virtual light, which is used to compute the shading of
                                        //the geometry in the fragment shader.

// by Stefan Gustavson (https://github.com/stegu/webgl-noise)
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }



float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
                i.z + vec4(0.0, i1.z, i2.z, 1.0))
              + i.y + vec4(0.0, i1.y, i2.y, 1.0))
              + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3  ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

vec3 getDisplacement(vec3 pos) {
    float u_TailNoiseAmount = 0.05;
    float tLength = 1.0;
    vec3 velDir = normalize(u_FireballVelocity);

    float dotProduct = dot(normalize(pos.xyz), velDir);
    fs_PullFactor = pow(max(0.0, -dotProduct), 4.0);
    fs_ShapeFactor = (dotProduct + 1.0) * 0.5;

    float flicker = 1.0 + sin(u_Time * u_NoiseSpeed + pos.y * 5.0) * 0.1;
    vec3 tailDisplacement = - velDir * fs_PullFactor * tLength * flicker;
    
    vec3 noiseInput = pos.xyz * 0.6 + u_Time * u_NoiseSpeed * 1.0;
    float noiseValue = snoise(noiseInput);
    vec3 noiseDisplacement = normalize(pos.xyz) * noiseValue * u_NoiseAmount;

    vec3 tailNoiseInput = pos.xyz * 4.0 + u_Time * u_NoiseSpeed * 2.5;
    float tailNoiseValue = snoise(tailNoiseInput);


    vec3 tailTurbulence = normalize(pos.xyz) * tailNoiseValue * u_TailNoiseAmount;

    vec3 totalDisplacement = tailDisplacement + noiseDisplacement + tailTurbulence * fs_PullFactor;

    float maxDisplacementLength = 2.5;
    if(length(totalDisplacement) > maxDisplacementLength) {
        totalDisplacement = normalize(totalDisplacement) * maxDisplacementLength;
    }

    return totalDisplacement;
}

void main()
{
    fs_Col = vs_Col;


    const float epsilon = 0.01;


    vec3 P = vs_Pos.xyz + getDisplacement(vs_Pos.xyz);
    vec3 Px = (vs_Pos.xyz + vec3(epsilon, 0.0, 0.0)) + getDisplacement(vs_Pos.xyz + vec3(epsilon, 0.0, 0.0));
    vec3 Py = (vs_Pos.xyz + vec3(0.0, epsilon, 0.0)) + getDisplacement(vs_Pos.xyz + vec3(0.0, epsilon, 0.0));

    vec3 tangent = Px - P;
    vec3 bitangent = Py - P;

    //recalculate normal
    vec3 new_Nor = normalize(cross(tangent, bitangent));


    mat3 invTranspose = mat3(u_ModelInvTr);
    fs_Nor = vec4(invTranspose * new_Nor, 0);

    //fs_Nor = - vec4(getDisplacement(vs_Pos.xyz),1);
    vec4 new_Pos = vec4(P, 1.0);
    vec4 modelposition = u_Model * new_Pos;

    fs_LightVec = lightPos - modelposition;
    gl_Position = u_ViewProj * modelposition;
    fs_Pos = gl_Position;
}

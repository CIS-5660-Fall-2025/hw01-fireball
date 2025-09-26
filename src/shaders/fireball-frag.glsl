#version 300 es
precision highp float;

uniform vec3 u_Eye, u_Ref, u_Up;
uniform vec2 u_Dimensions;
uniform float u_Time;
uniform float u_TimeScale;
uniform float u_FragTimeScale;

// in vec2 fs_Pos;

// void main() {
//   out_Col = vec4(0.5 * (fs_Pos + vec2(1.0)), 0.5 * (sin(u_Time * 3.14159 * 0.01) + 1.0), 1.0);
// }

uniform vec4 u_Color; // The color with which to render this instance of geometry.

// These are the interpolated values out of the rasterizer, so you can't know
// their specific values without knowing the vertices that contributed to them
in vec4 fs_Nor;
in vec4 fs_LightVec;
in vec4 fs_Col;

in float fs_NormOffset;

in vec4 fs_Pos;

out vec4 out_Col; // This is the final output color that you will see on your
                  // screen for the pixel that is currently being processed.


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

float bias (float b, float t) {
  return pow(t, log(b) / log(0.5f));
}


void main()
{
    // Material base color (before shading)
        vec4 diffuseColor = u_Color;

        // Calculate the diffuse term for Lambert shading
        float diffuseTerm = dot(normalize(fs_Nor), normalize(fs_LightVec));
        // Avoid negative lighting values
        diffuseTerm = clamp(diffuseTerm, 0.f, 1.f);

        float ambientTerm = 0.3f;

        float lightIntensity = diffuseTerm + ambientTerm;   //Add a small float value to the color multiplier
                                                            //to simulate ambient lighting. This ensures that faces that are not
                                                            //lit by our point light are not completely black.

        float pertOffset = fs_NormOffset - 0.05f + perlin3D(fs_Pos.xyz * 100.f) * 0.1f * clamp(0.f,3.f,bias((1.f + fs_Pos.y + length(fs_Pos.xz) * 0.3f) * 0.5f, 0.4f));
        // pertOffset = fs_NormOffset;
        // float pertOffset = fs_NormOffset + perlin3D(fs_Pos.xyz * 100.f) * 0.1f * smoothstep(0.4f,1.9f,1.f + fs_Pos.y + length(fs_Pos.xz) * 0.3f);
        // pertOffset=fs_NormOffset;
        // TODO maybe have that perturbance also depend on time?
        vec3 baseColor = vec3(1.5f - pertOffset, 0.8f - pertOffset * 0.8f, 0.f);
        // baseColor.xyz = baseColor.zyx;

        // if (length(fs_Pos) > 3.f) {
        // if (1.f + fs_Pos.y + length(fs_Pos.xz) * 0.3f > 0.3f) {
        //   baseColor = vec3(0.f,0.f,1.f);
        // }
        // baseColor = vec3(0.f,0.f,(1.f + fs_Pos.y + fs_Pos.x * 0.2 + fs_Pos.z * 0.2) * 0.5f);
        // baseColor = vec3(0.f, 0.f,smoothstep(0.1f,1.9f ,1.f + fs_Pos.y + length(fs_Pos.xz) * 0.3f));

        // TODO should use time in this too, plus make some sort of more interesting pattern probably
        // TODO also ought to make sure to use more "toolbox" functions
        // other TODOs: interactivity; some variable controls but also I think I wanna do mouse moving the fireball. background maybe--I like idea of mapping the flame color onto a surface around it perhaps?
        // I'm also not totally satisfied on this effect yet so still WIP; might drastically redo
        //  Top looks odd right now I think
        //  perhaps some perturbations to the values used to set color?

        // I think some bucketing of colors could be neat. go for a cartoony sort of look
        // baseColor = mod(baseColor, 0.2f) + floor(baseColor * 5.f) * 0.2f;
        // vec3 spillColor = mod(baseColor, 0.2f);
        float shimmy = (sin(u_Time * 0.025f * u_FragTimeScale) + 1.f) * 0.5f;
        vec3 shimmyColor = vec3(shimmy, shimmy * 0.5f, 0.f);
        vec3 bucketedColor = floor(baseColor * 5.f - shimmyColor) * 0.2f + shimmyColor;

        // vec3 bucketedColor = floor(baseColor * 5.f) * 0.2f;
        // vec3 finalColor = spillColor * 0.5f + bucketedColor;
        // vec3 finalColor = bucketedColor;
        // if (fs_Pos.x < 0.f) {
        //   finalColor = bucketedColor * 0.5f + baseColor * 0.5f;
        // }
        // vec3 finalColor = bucketedColor;
        vec3 finalColor = bucketedColor * 0.5f + baseColor * 0.5f;
        // baseColor = floor(baseColor * 5.f) / 5.f;
        

        out_Col = vec4(finalColor, 1.f);
        // out_Col = vec4(baseColor, fs_Pos.y * -0.1f + 0.9f);
        
        // Compute final shaded color
        // out_Col = vec4(diffuseColor.rgb * lightIntensity, diffuseColor.a);
        // out_Col = vec4(fs_Nor.xyz, 1.f);
        // out_Col = vec4((fs_Nor.xyz + 1.f) * 0.5f, 1.f);
}
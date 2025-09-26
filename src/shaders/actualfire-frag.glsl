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
uniform float u_Time;
uniform float u_Tail;

// These are the interpolated values out of the rasterizer, so you can't know
// their specific values without knowing the vertices that contributed to them
in vec4 fs_Nor;
in vec4 fs_LightVec;
in vec4 fs_Col;
in vec4 fs_Pos;
in float fs_Disp;

out vec4 out_Col; // This is the final output color that you will see on your
                  // screen for the pixel that is currently being processed.


// START functions from https://www.shadertoy.com/view/lllSWr
const mat3 m = mat3( 0.00,  0.80,  0.60,
           		    -0.80,  0.36, -0.48,
             		-0.60, -0.48,  0.64 );

float hash( float n ) {
    return fract(sin(n)*43758.5453);
}

float noise( in vec3 x ) { // in [0,1]
    vec3 p = floor(x);
    vec3 f = fract(x);

    f = f*f*(3.-2.*f);

    float n = p.x + p.y*57. + 113.*p.z;

    float res = mix(mix(mix( hash(n+  0.), hash(n+  1.),f.x),
                        mix( hash(n+ 57.), hash(n+ 58.),f.x),f.y),
                    mix(mix( hash(n+113.), hash(n+114.),f.x),
                        mix( hash(n+170.), hash(n+171.),f.x),f.y),f.z);
    return res;
}

float fbm( vec3 p ) { // in [0,1]
    float f;
    f  = 0.5000*noise( p ); p = m*p*2.02;
    f += 0.2500*noise( p ); p = m*p*2.03;
    f += 0.1250*noise( p ); p = m*p*2.01;
    f += 0.0625*noise( p );
    return f;
}
// END

float sin3D(vec3 x, float freq)
{
    return (sin(x.x * freq) + sin(x.y * freq) + sin(x.z * freq)) / 3.0;
}

vec3 pow3D(vec3 x, float power)
{
    return vec3(pow(x.x, power), pow(x.y, power), pow(x.z, power));
}

float clip(float val, float mini, float maxi)
{
    float someval = clamp(val, mini, maxi) - mini;
    return someval / (maxi - mini);
   
}

float ease_in_quadratic(float t) {
    return t*t;
}

float ease_out_quadratic(float t) {
    return 1.0 - ease_in_quadratic(t);
} // toolbox function 2


void main()
{
    // Material base color (before shading)
        vec4 diffuseColor = u_Color;

        float displacement = fs_Disp;
        // Calculate the diffuse term for Lambert shading
        float diffuseTerm = dot(normalize(fs_Nor), normalize(fs_LightVec));
        // Avoid negative lighting values
        // diffuseTerm = clamp(diffuseTerm, 0, 1);

        float ambientTerm = 0.2;

        float lightIntensity = diffuseTerm + ambientTerm;   //Add a small float value to the color multiplier
                                                            //to simulate ambient lighting. This ensures that faces that are not
                                                            //lit by our point light are not completely black.
        float weight = fbm(vec3(fs_Pos.r - u_Time * 0.01,
                                fs_Pos.g - u_Time * 0.01,
                                fs_Pos.b));
        // Compute final shaded color
        // out_Col =   vec4(diffuseColor.rgb * lightIntensity * weight * sin(u_Time / 100.0)+ 
        //             vec3(0.375, 0.125, 0.5625) * (1.0 - weight) * (1.0 - sin(u_Time / 100.0)), diffuseColor.a);
        // out_Col = vec4(pow3D(vec3(1.0, 1.0, 0.5), (1.0 - fs_Disp)) +  pow3D(vec3(1.0, 0.5, 0.4), fs_Disp), 1.0);
        //out_Col = sin3D(vec3(fs_Pos.x, fs_Pos.y, fs_Pos.z), 20.0) * vec4(0.0, 0.0 ,0.0 ,1.0);
        // float perturb = (sin(u_Time * 0.03) + 3.0) / 5.0 * weight;

        vec4 ones_no_alpha = vec4(1.0, 1.0, 1.0, 0.0);
        vec4 alpha_no_rgb = vec4(0.0, 0.0, 0.0, 1.0);
        float noisevals = clip(weight, 0.3, 0.7);
        vec4 colorjitter = vec4(0.4 * fbm(vec3(fs_Pos.b, fs_Pos.g - u_Time * 0.05, fs_Pos.r - u_Time * 0.01)), 
                                0.4 * fbm(vec3(fs_Pos.r - u_Time * 0.02, fs_Pos.b, fs_Pos.g - u_Time * 0.005)),
                                0.1*weight,
                                0.0);
        out_Col = vec4(diffuseColor.r, diffuseColor.g, diffuseColor.b, 0.0)  
                + ones_no_alpha * weight * 0.2
                + ones_no_alpha * noisevals * 0.1
                + ones_no_alpha * ease_out_quadratic(displacement * 0.1+ 0.4) * 0.2
                + alpha_no_rgb * (- clamp(displacement * 3.0 + 0.4 * weight * displacement + noisevals, 0.1, 1.0))
                + colorjitter 
                + vec4( 0.0,
                        0.0,
                        0.0,
                        1.0);
        // out_Col = vec4( vec3(1.0, 1.0, 1.0), 0.0);
}

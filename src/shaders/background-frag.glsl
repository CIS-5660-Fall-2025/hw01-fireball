#version 300 es

precision highp float;

uniform float u_Time;

// These are the interpolated values out of the rasterizer, so you can't know
// their specific values without knowing the vertices that contributed to them
in vec4 fs_Col;


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
    f  = 0.5000*noise( p ); p = m*p*0.00000002;
    f += 0.2500*noise( p ); p = m*p*0.0000003;
    f += 0.1250*noise( p ); p = m*p*0.000000001;
    f += 0.0625*noise( p );
    return f;
}

float sin3D(vec3 x, float freq) // sine function - 
{
    return (sin(x.x * freq) + sin(x.y * freq) + sin(x.z * freq)) / 3.0;
} // toolbox function 1

float snap(float x, float thresh)
{
    // 1 if above thresh - if lower
    if (x > thresh) {
        return 1.0;
    } 
    return 0.0;
}
// END
void main() {
    float weight = fbm(vec3(fs_Col.x, fs_Col.y, fs_Col.z));
    out_Col = vec4(sin((fs_Col.x + fs_Col.y )* 0.0002) * 0.3, 0.2 * sin(fs_Col.x * 0.003),0.5* cos(fs_Col.z * 0.001), 1.0);
    out_Col += vec4(fs_Col.x * 0.001 * sin(u_Time * 0.01) + weight, 
                    0.1 * cos(u_Time * 0.01),
                     0.4 * sin3D(vec3(u_Time * 0.03, u_Time * 0.05, u_Time * 0.2), 0.09),
                     0.0) * (1.0 - weight) * sin3D(vec3(fs_Col.x, fs_Col.y, fs_Col.z), 0.005) ;
    out_Col += snap(weight, 0.48) * vec4(1.0, 1.0, 1.0, 0.0);
    // out_Col += vec4(, 0.0);
}
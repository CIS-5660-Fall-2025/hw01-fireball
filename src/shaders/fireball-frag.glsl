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
uniform vec3 u_CamPos;
uniform vec3 u_CamTarget;

// These are the interpolated values out of the rasterizer, so you can't know
// their specific values without knowing the vertices that contributed to them
in vec4 fs_Nor;
in vec4 fs_LightVec;
in vec4 fs_Col;
in vec4 fs_Pos;
in float fs_Disp;
in float fs_TopDisp;

out vec4 out_Col; // This is the final output color that you will see on your
                  // screen for the pixel that is currently being processed.

// From toolbox slides
float bias(float b, float t) {
    return pow(t, log(b) / log(.5));
}

float gain(float g, float t) {
    if(t < 0.5)
        return bias(1.-g, 2.*t) / 2.;
    else
        return 1. - bias(1.-g, 2.-2.*t) / 2.;
}

float cubicPulse(float c, float w, float x) {
    // c - center, w - taper length
    x = abs(x-c);
    if(x > w) return 0.;
    x /= w;
    return 1. - x*x*(3.-2.*x);
}
//

float hash31(vec3 p3) // From https://www.shadertoy.com/view/4djSRW
{
	p3  = fract(p3 * .1031);
    p3 += dot(p3, p3.zyx + 31.32);
    return fract((p3.x + p3.y) * p3.z);
}

mat3 rotZ(float o) {
    return mat3(cos(o), sin(o), 0., -sin(o), cos(o), 0., 0., 0., 1.);
}

mat3 rotX(float o) {
    return mat3(1., 0., 0., 0., cos(o), sin(o), 0., -sin(o), cos(o));
}

float noise(vec3 p) {
    vec3 lp = fract(p);
    vec3 id = floor(p);

    vec2 d = vec2(1.,0.);

    float r000 = hash31(id+d.yyy);
    float r001 = hash31(id+d.yyx);
    float r010 = hash31(id+d.yxy);
    float r011 = hash31(id+d.yxx);
    float r100 = hash31(id+d.xyy);
    float r101 = hash31(id+d.xyx);
    float r110 = hash31(id+d.xxy);
    float r111 = hash31(id+d.xxx);

    float r00 = mix(r000, r001, lp.z);
    float r01 = mix(r010, r011, lp.z);
    float r10 = mix(r100, r101, lp.z);
    float r11 = mix(r110, r111, lp.z);

    float r0 = mix(r00, r01, lp.y);
    float r1 = mix(r10, r11, lp.y);

    float r = mix(r0, r1, lp.x);

    return r;
}

float fbm(vec3 p) {
    p *= 5.;

    const int iterations = 4;
    mat3 rot = rotX(32.53) * rotZ(18.4) * rotX(41.2);

    float scaleMult = 2.;
    float decay = .5;
    
    float sum = 0.;
    float currMult = .5;

    vec3 q = p;
    for(int i=0; i<iterations; i++) {
        sum += noise(q)*currMult;

        q *= scaleMult;
        q += vec3(13.513,591.,219.);
        q *= rot;
        currMult *= decay;
    }

    return sum;
}
//
float getFresnelWeight(vec3 p, vec3 norm, float powAmt) {
    vec3 camFo = normalize(u_CamTarget - u_CamPos);
    return pow(1.-max(0., dot(norm, -camFo)), powAmt);
}

float getHotness(vec3 p, float disp, vec3 norm, float topDisp) {
    float fresnel = getFresnelWeight(p, norm, 1.);

    return 
        2.*bias(0.1, smoothstep(2.4, -2., p.y-disp*0.7-0.2*fresnel+0.4)) 
        + 0.2*(min(2.5,disp)-1.5)
        + .5*smoothstep(1.6, 3., p.y+0.*disp*.4+2.5*fresnel);
}

vec3 posterizeHotnessToCol(float hotness, float reps) {
    const vec3 colors[3] = vec3[] (
        vec3(0.),
        vec3(1.,0.3,0.),
        vec3(1.5)
    );

    hotness = clamp(hotness, 0., 1.9999);

    int ind = int(floor(hotness));
    float interpo = fract(hotness);
    //const float reps = 5.;
    interpo = floor(interpo*reps)/reps;

    return mix(colors[ind], colors[ind+1], interpo);
}

vec3 postMixHotToCol(float hotness) {
    return .6*posterizeHotnessToCol(hotness, 5.) + 0.4*posterizeHotnessToCol(hotness, 50.);
}

vec3 fresnel(vec3 p, vec3 norm) {
    float fresnel = getFresnelWeight(p, norm, 1.2);

    return vec3(1.)* fresnel * smoothstep(1.2, -0.5, p.y);
}

vec3 smoothYGlowLayer(vec3 p) {
    float val = 0.5*smoothstep(2., -1., p.y);
    return 1.5*val*vec3(1.4,0.5,0.1);
}

float noiseGlow(vec3 p) {
    return smoothstep(0.37, 0.6, fbm(p*.18+u_Time*vec3(0.,-.3,0.))) * smoothstep(1.75, .75, p.y);
}

float getHeatFlicker() {
    float t = u_Time;

    const float repTime = 1.;
    t = mod(t, repTime) - repTime*.5;

    float pulse = cubicPulse(0., 0.3, t);

    return mix(-.2, 0., pulse);
}

float getTotalLightFlicker() {
    return .9+.12*sin(u_Time*8.);
}

void main()
{
    vec3 p = fs_Pos.xyz;
    vec3 norm = normalize(fs_Nor.xyz);

    float heatFlicker = getHeatFlicker();

    vec3 col = getTotalLightFlicker()*postMixHotToCol(noiseGlow(p)+getHotness(p, fs_Disp, norm, fs_TopDisp)+heatFlicker) + smoothYGlowLayer(p) + fresnel(p, norm);

    out_Col = vec4(col, 1.);
}

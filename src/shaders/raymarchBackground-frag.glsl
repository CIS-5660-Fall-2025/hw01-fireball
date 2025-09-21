#version 300 es
precision highp float;

// uniform vec3 u_Eye, u_Ref, u_Up;
// uniform vec2 u_Dimensions;
uniform float u_Time;
uniform float u_Aspect;
uniform vec3 u_CamPos;
uniform vec3 u_CamTarget;
uniform vec3 u_CamUp;

in vec2 fs_Pos;
out vec4 out_Col;

///
#define PI 3.141592
#define TAU 6.283185

vec2 rot(vec2 v, float o) {
    return mat2(cos(o), sin(o), -sin(o), cos(o)) * v;
}

mat3 createFrame(vec3 fo, vec3 up) {
    vec3 ri = normalize(cross(fo, up));
    up = cross(ri, fo);
    return mat3(ri, up, fo);
}

vec3 sphericalToCartesian(vec3 spherical) {
    return spherical.x * vec3(sin(spherical.z) * cos(spherical.y), cos(spherical.z), sin(spherical.z) * sin(spherical.y));
}

vec2 toPolar(vec2 cart) {
    return vec2(length(cart), mod(atan(cart.y, cart.x), TAU));
}

vec2 toCartesian(vec2 polar) {
    return polar.x * vec2(cos(polar.y), sin(polar.y));
}

float hash31(vec3 p3) // From https://www.shadertoy.com/view/4djSRW
{
	p3  = fract(p3 * .1031);
    p3 += dot(p3, p3.zyx + 31.32);
    return fract((p3.x + p3.y) * p3.z);
}

//
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

float sampleNoise(vec3 p) {
    p *= 5.;
    return noise(p)*.5;
}
///

float sdScene(vec3 p) {
    p.z += u_Time;
    
    p += 0.05*sin((u_Time+p.zyx+p.yzx)*vec3(4.3,2.,3.2)); // 0.025
    vec2 polar = toPolar(p.xy);
    polar.y += 0.1*p.z;
    polar.x += 0.05*sin(polar.y*40.+p.z*5.);
    
    float s = 1.-polar.x;
    
    for(float n = 5.; n<10.; n += 1.)
        s -= 5.*max(0.,sampleNoise(p*0.5)-.1)*.0125*abs(dot(cos(20.*vec3(rot(p.xy, 31.34*n), p.z)*n*0.3), vec3(1.))) / n;
    
    return s;
}

vec3 render(vec2 p)
{
    // vec3 camPos = vec3(0.,0.,0.);
    // vec2 camRotAngles = vec2(PI*.5, PI*.5);
    // vec3 fo = sphericalToCartesian(vec3(1.,camRotAngles));
    // vec3 up = vec3(0.,1.,0.);
    vec3 camPos = u_CamPos*0.1*0.;
    vec3 fo = normalize(u_CamTarget - u_CamPos);
    vec3 up = u_CamUp;//vec3(0.,1.,0.);
    mat3 camFrame = createFrame(fo, up);
    
    //
    vec3 sunPos = vec3(0., 0., 4.);
    float v = 0.;

    //
    float fovY = PI*.5;
    vec2 sp = p*vec2(u_Aspect,1.);
    vec3 rd = camFrame*normalize(vec3(p*tan(fovY*.5)*vec2(u_Aspect, 1.), 1.));

    float e, e2, s, d = 0.;
    for(int i=0; i<140; i++) {
        vec3 marchPos = camPos + rd*d;

        vec3 fireballPos = camPos-((u_CamPos-u_CamTarget)*0.12+0.24*u_CamTarget);
        e2 = max(0.005, 0.9*(length((marchPos-fireballPos)*vec3(1.,1.,0.8))-.2));
        s = min(max(0.005, abs(sdScene(marchPos))), e=max(0.005, (length(marchPos-sunPos)-.7))); // .6
        s = min(s, e2);
        
        d += 0.25*s;
        v +=.5*.007/(4.*s+e*0.25);
        v += .001/(e2);
    }
    
    v *= v;
    // https://www.shadertoy.com/view/WXVGRG# energy to color mapping
    vec3 outCol = pow(vec3(v), vec3(1, 1.5, 12))*6.;
    
    outCol = tanh(outCol)*1.5;
    outCol *= vec3(1.,0.9,0.7);
    //outCol *= 2./max(0.05, length(sp)-.3);
    
    return outCol;
}

void main() {
  out_Col = vec4(render(fs_Pos), 1.0);//vec4(0.5 * (fs_Pos + vec2(1.0)), 0.5 * (sin(u_Time * 3.14159 * 0.01) + 1.0), 1.0);
}

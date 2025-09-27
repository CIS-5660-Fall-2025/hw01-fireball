import {vec2, vec3, vec4, mat4} from 'gl-matrix';
import Drawable from './Drawable';
import {gl} from '../../globals';

var activeProgram: WebGLProgram = null;

export class Shader {
  shader: WebGLShader;

  constructor(type: number, source: string) {
    this.shader = gl.createShader(type);
    gl.shaderSource(this.shader, source);
    gl.compileShader(this.shader);

    if (!gl.getShaderParameter(this.shader, gl.COMPILE_STATUS)) {
      throw gl.getShaderInfoLog(this.shader);
    }
  }
};

class ShaderProgram {
  prog: WebGLProgram;

  attrPos: number;
  attrNor: number;
  attrCol: number;

  unifModel: WebGLUniformLocation;
  unifModelInvTr: WebGLUniformLocation;
  unifViewProj: WebGLUniformLocation;
  unifShellColor: WebGLUniformLocation;



  unifNoiseAmount: WebGLUniformLocation;
  unifNoiseSpeed: WebGLUniformLocation;
  unifNoiseScale: WebGLUniformLocation;

  unifFireballVel: WebGLUniformLocation;

  unifRef: WebGLUniformLocation;
  unifEye: WebGLUniformLocation;
  unifUp: WebGLUniformLocation;
  unifDimensions: WebGLUniformLocation;
  unifTime: WebGLUniformLocation;

  unifSkyTexture: WebGLUniformLocation;

  unifResolution: WebGLUniformLocation;
  unifTexResolution: WebGLUniformLocation;

  unifTailLength: WebGLUniformLocation;
  unifFallSpeed : WebGLUniformLocation;

  constructor(shaders: Array<Shader>) {
    this.prog = gl.createProgram();

    for (let shader of shaders) {
      gl.attachShader(this.prog, shader.shader);
    }
    gl.linkProgram(this.prog);
    if (!gl.getProgramParameter(this.prog, gl.LINK_STATUS)) {
      throw gl.getProgramInfoLog(this.prog);
    }

    this.attrPos = gl.getAttribLocation(this.prog, "vs_Pos");
    this.unifEye   = gl.getUniformLocation(this.prog, "u_Eye");
    this.unifRef   = gl.getUniformLocation(this.prog, "u_Ref");
    this.unifUp   = gl.getUniformLocation(this.prog, "u_Up");
    this.unifDimensions   = gl.getUniformLocation(this.prog, "u_Dimensions");
    this.unifTime   = gl.getUniformLocation(this.prog, "u_Time");
    
    this.unifNoiseAmount  = gl.getUniformLocation(this.prog, "u_NoiseAmount");
    this.unifNoiseSpeed  = gl.getUniformLocation(this.prog, "u_NoiseSpeed");
    this.unifNoiseScale  = gl.getUniformLocation(this.prog, "u_NoiseScale");

    this.unifFireballVel = gl.getUniformLocation(this.prog, "u_FireballVelocity");

    this.attrNor = gl.getAttribLocation(this.prog, "vs_Nor");
    this.attrCol = gl.getAttribLocation(this.prog, "vs_Col");
    this.unifModel      = gl.getUniformLocation(this.prog, "u_Model");
    this.unifModelInvTr = gl.getUniformLocation(this.prog, "u_ModelInvTr");
    this.unifViewProj   = gl.getUniformLocation(this.prog, "u_ViewProj");
    this.unifShellColor = gl.getUniformLocation(this.prog, "u_ShellColor");

    this.unifSkyTexture = gl.getUniformLocation(this.prog, "u_SkyTexture");

    this.unifResolution = gl.getUniformLocation(this.prog, "u_Resolution");
    this.unifTexResolution = gl.getUniformLocation(this.prog, "u_TexResolution");
  
    this.unifTailLength = gl.getUniformLocation(this.prog, "u_TailLength");
    this.unifFallSpeed = gl.getUniformLocation(this.prog, "u_FallSpeed");
  }

  use() {
    if (activeProgram !== this.prog) {
      gl.useProgram(this.prog);
      activeProgram = this.prog;
    }
  }

  setTextureSampler(texture: WebGLTexture, textureUnit: number) {
    this.use();
    
    if (this.unifSkyTexture !== -1) {
      gl.activeTexture(gl.TEXTURE0 + textureUnit);
      
      gl.bindTexture(gl.TEXTURE_2D, texture);
      
      gl.uniform1i(this.unifSkyTexture, textureUnit);
    }
  }

  setResolution(width: number, height: number) {
    this.use();
    if (this.unifResolution !== -1) {
      gl.uniform2f(this.unifResolution, width, height);
    }
  }

  setTexResolution(width: number, height: number) {
    this.use();
    if (this.unifTexResolution !== -1) {
      gl.uniform2f(this.unifTexResolution, width, height);
    }
  }

  setModelMatrix(model: mat4) {
    this.use();
    if (this.unifModel !== -1) {
      gl.uniformMatrix4fv(this.unifModel, false, model);
    }

    if (this.unifModelInvTr !== -1) {
      let modelinvtr: mat4 = mat4.create();
      mat4.transpose(modelinvtr, model);
      mat4.invert(modelinvtr, modelinvtr);
      gl.uniformMatrix4fv(this.unifModelInvTr, false, modelinvtr);
    }
  }

  setViewProjMatrix(vp: mat4) {
    this.use();
    if (this.unifViewProj !== -1) {
      gl.uniformMatrix4fv(this.unifViewProj, false, vp);
    }
  }

  setFireballVel(vel: vec3) {
    this.use();
    if (this.unifFireballVel !== -1) {
      gl.uniform3fv(this.unifFireballVel, vel);
    }
  }

  setGeometryColor(color: vec4) {
    this.use();
    if (this.unifShellColor !== -1) {
      gl.uniform4fv(this.unifShellColor, color);
    }
  }

  setEyeRefUp(eye: vec3, ref: vec3, up: vec3) {
    this.use();
    if(this.unifEye !== -1) {
      gl.uniform3f(this.unifEye, eye[0], eye[1], eye[2]);
    }
    if(this.unifRef !== -1) {
      gl.uniform3f(this.unifRef, ref[0], ref[1], ref[2]);
    }
    if(this.unifUp !== -1) {
      gl.uniform3f(this.unifUp, up[0], up[1], up[2]);
    }
  }

  setDimensions(width: number, height: number) {
    this.use();
    if(this.unifDimensions !== -1) {
      gl.uniform2f(this.unifDimensions, width, height);
    }
  }

  setTime(t: number) {
    this.use();
    if(this.unifTime !== -1) {
      gl.uniform1f(this.unifTime, t);
    }
  }

  setNoiseAmount(a: number){
    this.use();
    if(this.unifNoiseAmount !== -1) {
      gl.uniform1f(this.unifNoiseAmount, a);
    }
  }

  setNoiseSpeed(s: number){
    this.use();
    if(this.unifNoiseSpeed !== -1) {
      gl.uniform1f(this.unifNoiseSpeed, s);
    }
  }

  setNoiseScale(s: number){
    this.use();
    if(this.unifNoiseScale !== -1) {
      gl.uniform1f(this.unifNoiseScale, s);
    }
  }

  setTailLength(l: number){
    this.use();
    if(this.unifTailLength !== -1) {
      gl.uniform1f(this.unifTailLength, l);
    }
  }
  
  setFallSpeed(s: number){
    this.use();
    if(this.unifFallSpeed !== -1) {
      gl.uniform1f(this.unifFallSpeed, s);
    }
  }

  draw(d: Drawable) {
    this.use();

    if (this.attrPos != -1 && d.bindPos()) {
      gl.enableVertexAttribArray(this.attrPos);
      gl.vertexAttribPointer(this.attrPos, 4, gl.FLOAT, false, 0, 0);
    }

    if (this.attrNor != -1 && d.bindNor()) {
      gl.enableVertexAttribArray(this.attrNor);
      gl.vertexAttribPointer(this.attrNor, 4, gl.FLOAT, false, 0, 0);
    }

    d.bindIdx()

    gl.drawElements(d.drawMode(), d.elemCount(), gl.UNSIGNED_INT, 0);

    if (this.attrPos != -1) gl.disableVertexAttribArray(this.attrPos);
    if (this.attrNor != -1) gl.disableVertexAttribArray(this.attrNor);
   }
};

export default ShaderProgram;

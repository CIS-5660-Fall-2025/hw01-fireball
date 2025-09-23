import {vec4, mat4, vec3} from 'gl-matrix';
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
  unifBodyColor: WebGLUniformLocation;
  unifOutlineColor: WebGLUniformLocation;
  unifTime: WebGLUniformLocation;
  unifCameraWorldPos: WebGLUniformLocation;

  unifNoiseScale: WebGLUniformLocation;
  unifAmplitude:  WebGLUniformLocation;
  unifSpeed:      WebGLUniformLocation;
  unifOctaves:    WebGLUniformLocation;

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
    this.attrNor = gl.getAttribLocation(this.prog, "vs_Nor");
    this.attrCol = gl.getAttribLocation(this.prog, "vs_Col");

    this.unifModel      = gl.getUniformLocation(this.prog, "u_Model");
    this.unifModelInvTr = gl.getUniformLocation(this.prog, "u_ModelInvTr");
    this.unifViewProj   = gl.getUniformLocation(this.prog, "u_ViewProj");
    this.unifBodyColor  = gl.getUniformLocation(this.prog, "u_BodyColor");
    this.unifOutlineColor = gl.getUniformLocation(this.prog, "u_OutlineColor");
    this.unifTime       = gl.getUniformLocation(this.prog, "u_Time");
    this.unifCameraWorldPos = gl.getUniformLocation(this.prog, "u_CameraWorldPos");

    this.unifNoiseScale = gl.getUniformLocation(this.prog, "u_NoiseScale");
    this.unifAmplitude  = gl.getUniformLocation(this.prog, "u_Amplitude");
    this.unifSpeed      = gl.getUniformLocation(this.prog, "u_Speed");
    this.unifOctaves    = gl.getUniformLocation(this.prog, "u_Octaves");
  }

  use() {
    if (activeProgram !== this.prog) {
      gl.useProgram(this.prog);
      activeProgram = this.prog;
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

  setBodyColor(color: vec4) {
    this.use();
    if (this.unifBodyColor !== -1) {
      gl.uniform4fv(this.unifBodyColor, color);
    }
  }

  setOutlineColor(color: vec4) {
    this.use();
    if (this.unifOutlineColor !== -1) {
      gl.uniform4fv(this.unifOutlineColor, color);
    }
  }

  setTime(time: GLfloat) {
    this.use(); 
    if (this.unifTime !== -1) {
      gl.uniform1f(this.unifTime, time);
    }
  }

  setCameraWorldPos(pos: vec3) {
    this.use();
    if (this.unifCameraWorldPos !== -1) {
      gl.uniform3fv(this.unifCameraWorldPos, pos);
    }
  }

  setTurbulence(noiseScale: number, amplitude: number, speed: number, octaves: number) {
    this.use();

    console.log("setting turbulence:", noiseScale, amplitude, speed, octaves);
    console.log(this.unifNoiseScale, this.unifAmplitude, this.unifSpeed, this.unifOctaves);

    if (this.unifNoiseScale) gl.uniform1f(this.unifNoiseScale, noiseScale);
    if (this.unifAmplitude)  gl.uniform1f(this.unifAmplitude, amplitude);
    if (this.unifSpeed)      gl.uniform1f(this.unifSpeed, speed);
    if (this.unifOctaves)    gl.uniform1i(this.unifOctaves, Math.floor(octaves));
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

    d.bindIdx();
    gl.drawElements(d.drawMode(), d.elemCount(), gl.UNSIGNED_INT, 0);

    if (this.attrPos != -1) gl.disableVertexAttribArray(this.attrPos);
    if (this.attrNor != -1) gl.disableVertexAttribArray(this.attrNor);
  }
};

export default ShaderProgram;

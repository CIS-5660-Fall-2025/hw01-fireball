import {vec4, mat4} from 'gl-matrix';
import Drawable from './Drawable';

var activeProgram: WebGLProgram = null;

export class Shader {
  shader: WebGLShader;

  constructor(type: number, source: string, public gl: WebGL2RenderingContext) {
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
  unifTime: WebGLUniformLocation;
  unifHueOffset: WebGLUniformLocation;
  unifNOctaves: WebGLUniformLocation;

  constructor(shaders: Array<Shader>, public gl: WebGL2RenderingContext) {
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
    this.unifTime = gl.getUniformLocation(this.prog, "u_Time");
    this.unifHueOffset = gl.getUniformLocation(this.prog, "u_HueOffset");
    this.unifNOctaves = gl.getUniformLocation(this.prog, "u_NOctaves");
  }

  use() {
    if (activeProgram !== this.prog) {
      this.gl.useProgram(this.prog);
      activeProgram = this.prog;
    }
  }

  setModelMatrix(model: mat4) {
    this.use();
    if (this.unifModel !== -1) {
      this.gl.uniformMatrix4fv(this.unifModel, false, model);
    }

    if (this.unifModelInvTr !== -1) {
      let modelinvtr: mat4 = mat4.create();
      mat4.transpose(modelinvtr, model);
      mat4.invert(modelinvtr, modelinvtr);
      this.gl.uniformMatrix4fv(this.unifModelInvTr, false, modelinvtr);
    }
  }

  setViewProjMatrix(vp: mat4) {
    this.use();
    if (this.unifViewProj !== -1) {
      this.gl.uniformMatrix4fv(this.unifViewProj, false, vp);
    }
  }

  setTime(time: number) {
    this.use();
    if (this.unifTime !== -1) {
      this.gl.uniform1f(this.unifTime, time);
    }
  }

  setHueOffset(offset: number) {
    this.use();
    if (this.unifHueOffset !== -1) {
      this.gl.uniform1f(this.unifHueOffset, offset);
    }
  }

  setNOctaves(nOctaves: number) {
    this.use();
    if (this.unifNOctaves !== -1) {
      this.gl.uniform1i(this.unifNOctaves, nOctaves);
    }
  }

  draw(d: Drawable) {
    this.use();

    if (this.attrPos != -1 && d.bindPos()) {
      this.gl.enableVertexAttribArray(this.attrPos);
      this.gl.vertexAttribPointer(this.attrPos, 4, this.gl.FLOAT, false, 0, 0);
    }

    if (this.attrNor != -1 && d.bindNor()) {
      this.gl.enableVertexAttribArray(this.attrNor);
      this.gl.vertexAttribPointer(this.attrNor, 4, this.gl.FLOAT, false, 0, 0);
    }

    d.bindIdx();
    this.gl.drawElements(d.drawMode(), d.elemCount(), this.gl.UNSIGNED_INT, 0);

    if (this.attrPos != -1) this.gl.disableVertexAttribArray(this.attrPos);
    if (this.attrNor != -1) this.gl.disableVertexAttribArray(this.attrNor);
  }
};

export default ShaderProgram;

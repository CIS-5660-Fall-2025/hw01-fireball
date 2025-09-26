import {vec4, mat4} from 'gl-matrix';
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
  const log = gl.getShaderInfoLog(this.shader);
  console.error('Shader compile error:', log);
  throw new Error(log as string);
    }
  }
};

class ShaderProgram {
  prog: WebGLProgram;

  attrPos: number;
  attrNor: number;
  attrCol: number;

  unifModel: WebGLUniformLocation | null;
  unifModelInvTr: WebGLUniformLocation | null;
  unifViewProj: WebGLUniformLocation | null;
  unifColor: WebGLUniformLocation | null;
  unifTime: WebGLUniformLocation | null;
  unifOctave: WebGLUniformLocation | null;
  unifTint: WebGLUniformLocation | null;
  unifEmissive: WebGLUniformLocation | null;

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
    this.unifColor      = gl.getUniformLocation(this.prog, "u_Color");
    this.unifTime       = gl.getUniformLocation(this.prog, "u_Time");
    this.unifOctave     = gl.getUniformLocation(this.prog, "u_Octave");
    this.unifTint       = gl.getUniformLocation(this.prog, "u_Tint");
    this.unifEmissive   = gl.getUniformLocation(this.prog, "u_Emissive");
  }

  use() {
    if (activeProgram !== this.prog) {
      gl.useProgram(this.prog);
      activeProgram = this.prog;
    }
  }

  setModelMatrix(model: mat4) {
    this.use();
    if (this.unifModel !== null) {
      gl.uniformMatrix4fv(this.unifModel, false, model);
    }

    if (this.unifModelInvTr !== null) {
      let modelinvtr: mat4 = mat4.create();
      mat4.transpose(modelinvtr, model);
      mat4.invert(modelinvtr, modelinvtr);
      gl.uniformMatrix4fv(this.unifModelInvTr, false, modelinvtr);
    }
  }

  setViewProjMatrix(vp: mat4) {
    this.use();
    if (this.unifViewProj !== null) {
      gl.uniformMatrix4fv(this.unifViewProj, false, vp);
    }
  }

  setGeometryColor(color: vec4) {
    this.use();
    if (this.unifColor !== null) {
      gl.uniform4fv(this.unifColor, color);
    }
  }

  setTime(t: number) {
    this.use();
    if (this.unifTime !== null) {
      gl.uniform1f(this.unifTime, t);
    }
  }

  setOctave(oct: number) {
    this.use();
    if (this.unifOctave !== null) {
      gl.uniform1i(this.unifOctave, oct);
    }
  }

  setTint(tint: vec4) {
    this.use();
    if (this.unifTint !== null) {
      gl.uniform4fv(this.unifTint, tint);
    }
  }

  setEmissive(emissive: number) {
    this.use();
    if (this.unifEmissive !== null) {
      gl.uniform1f(this.unifEmissive, emissive);
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

    d.bindIdx();
    gl.drawElements(d.drawMode(), d.elemCount(), gl.UNSIGNED_INT, 0);

    if (this.attrPos != -1) gl.disableVertexAttribArray(this.attrPos);
    if (this.attrNor != -1) gl.disableVertexAttribArray(this.attrNor);
  }
};

export default ShaderProgram;

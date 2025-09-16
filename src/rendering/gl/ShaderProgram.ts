import {vec2, vec4, mat4} from 'gl-matrix';
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
  unifColor: WebGLUniformLocation;
  unifTime: WebGLUniformLocation;
  unifCrack: WebGLUniformLocation;
  unifHeightScale: WebGLUniformLocation;
  unifMouseNDC: WebGLUniformLocation;
  unifMouseDown: WebGLUniformLocation;
  unifMouseRadiusNDC: WebGLUniformLocation;
  unifAspect: WebGLUniformLocation;

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
    this.unifModel       = gl.getUniformLocation(this.prog, "u_Model");
    this.unifModelInvTr  = gl.getUniformLocation(this.prog, "u_ModelInvTr");
    this.unifViewProj    = gl.getUniformLocation(this.prog, "u_ViewProj");
    this.unifColor       = gl.getUniformLocation(this.prog, "u_Color");
    this.unifTime        = gl.getUniformLocation(this.prog, "u_Time");
    this.unifCrack       = gl.getUniformLocation(this.prog, "u_Crack");
    this.unifHeightScale = gl.getUniformLocation(this.prog, "u_HeightScale");
    this.unifMouseNDC    = gl.getUniformLocation(this.prog, "u_MouseNDC");
    this.unifMouseDown   = gl.getUniformLocation(this.prog, "u_MouseDown");
    this.unifMouseRadiusNDC = gl.getUniformLocation(this.prog, "u_MouseRadiusNDC");
    this.unifAspect      = gl.getUniformLocation(this.prog, "u_Aspect");
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

  setGeometryColor(color: vec4) {
    this.use();
    if (this.unifColor !== -1) {
      gl.uniform4fv(this.unifColor, color);
    }
  }

  setTime(t: number) {
    this.use();
    if (this.unifTime !== -1) {
      gl.uniform1f(this.unifTime, t)
    };
  }

  setCrack(c: number) {
    this.use();
    if (this.unifCrack !== -1) {
      gl.uniform1f(this.unifCrack, c);
    }
  }

  setHeightScale(h: number) {
    this.use();
    if (this.unifHeightScale !== -1) {
      gl.uniform1f(this.unifHeightScale, h);
    }
  }

  setMouseNDC(m: vec2) {
    this.use();
    if (this.unifMouseNDC !== -1) {
      gl.uniform2fv(this.unifMouseNDC, m);
    }
  }

  setMouseDown(d: number) {
    this.use();
    if (this.unifMouseDown !== -1) {
      gl.uniform1i(this.unifMouseDown, d);
    }
  }

  setMouseRadiusNDC(r: number) {
    this.use();
    if (this.unifMouseRadiusNDC !== -1) {
      gl.uniform1f(this.unifMouseRadiusNDC, r);
    }
  }

  setAspect(a: number) {
    this.use();
    if (this.unifAspect !== -1) {
      gl.uniform1f(this.unifAspect, a);
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

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

  attrUV: number;

  unifModel: WebGLUniformLocation;
  unifModelInvTr: WebGLUniformLocation;
  unifModelInv: WebGLUniformLocation;
  unifViewProj: WebGLUniformLocation;
  unifColor: WebGLUniformLocation;

  unifRef: WebGLUniformLocation;
  unifEye: WebGLUniformLocation;
  unifUp: WebGLUniformLocation;
  unifDimensions: WebGLUniformLocation;
  unifTime: WebGLUniformLocation;
  unifTimeScale: WebGLUniformLocation;
  unifFragTimeScale: WebGLUniformLocation;
  unifWorleyScale: WebGLUniformLocation;
  unifXZAmplitude: WebGLUniformLocation;
  unifMouseCoords: WebGLUniformLocation;
  unifOutlineScale: WebGLUniformLocation;
  unifOutlineSteps: WebGLUniformLocation;

  unifRadius: WebGLUniformLocation;
  unifPosOrigin: WebGLUniformLocation;

  unifSmokeStepSize: WebGLUniformLocation;
  unifSmokeMaxSteps: WebGLUniformLocation;


  
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

    this.attrNor = gl.getAttribLocation(this.prog, "vs_Nor");
    this.attrCol = gl.getAttribLocation(this.prog, "vs_Col");
    this.attrUV = gl.getAttribLocation(this.prog, "vs_UV");
    this.unifModel      = gl.getUniformLocation(this.prog, "u_Model");
    this.unifModelInvTr = gl.getUniformLocation(this.prog, "u_ModelInvTr");
    this.unifModelInv = gl.getUniformLocation(this.prog, "u_ModelInv");
    this.unifViewProj   = gl.getUniformLocation(this.prog, "u_ViewProj");
    this.unifColor      = gl.getUniformLocation(this.prog, "u_Color");


    this.unifTime   = gl.getUniformLocation(this.prog, "u_Time");
    this.unifTimeScale = gl.getUniformLocation(this.prog, "u_TimeScale");
    this.unifFragTimeScale = gl.getUniformLocation(this.prog, "u_FragTimeScale");
    this.unifWorleyScale = gl.getUniformLocation(this.prog, "u_WorleyScale");
    this.unifXZAmplitude = gl.getUniformLocation(this.prog, "u_XZAmplitude");

    this.unifMouseCoords = gl.getUniformLocation(this.prog, "u_MouseCoords");
    this.unifOutlineScale = gl.getUniformLocation(this.prog, "u_OutlineScale");
    this.unifOutlineSteps = gl.getUniformLocation(this.prog, "u_OutlineSteps");

    this.unifPosOrigin = gl.getUniformLocation(this.prog, "u_PosOrigin");
    this.unifRadius = gl.getUniformLocation(this.prog, "u_Radius");

    this.unifSmokeStepSize = gl.getUniformLocation(this.prog, "u_SmokeStepSize");
    this.unifSmokeMaxSteps = gl.getUniformLocation(this.prog, "u_SmokeMaxSteps");
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
    if (this.unifModelInv !== -1) {
      let modelinv: mat4 = mat4.create();
      mat4.invert(modelinv, model);
      gl.uniformMatrix4fv(this.unifModelInv, false, modelinv);
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
  setTimeScale(t: number) {
    this.use();
    if(this.unifTimeScale !== -1) {
      gl.uniform1f(this.unifTimeScale, t);
    }
  }
  setFragTimeScale(t: number) {
    this.use();
    if(this.unifFragTimeScale !== -1) {
      gl.uniform1f(this.unifFragTimeScale, t);
    }
  }
  setWorleyScale(t: number) {
    this.use();
    if(this.unifWorleyScale !== -1) {
      gl.uniform1f(this.unifWorleyScale, t);
    }
  }
  setXZAmplitude(t: number) {
    this.use();
    if(this.unifXZAmplitude !== -1) {
      gl.uniform1f(this.unifXZAmplitude, t);
    }
  }
  setMouseCoords(x: number, y: number, z: number) {
    this.use();
    if(this.unifMouseCoords !== -1) {
      gl.uniform3f(this.unifMouseCoords, x, y, z);
    }
  }
  setOutlineScale(t: number) {
    this.use();
    if(this.unifOutlineScale !== -1) {
      gl.uniform1f(this.unifOutlineScale, t);
    }
  }
  setOutlineSteps(t: number) {
    this.use();
    if(this.unifOutlineSteps !== -1) {
      gl.uniform1f(this.unifOutlineSteps, t);
    }
  }
  setRadius(t: number) {
    this.use();
    if(this.unifRadius !== -1) {
      gl.uniform1f(this.unifRadius, t);
    }
  }
  setPosOrigin(x: number, y: number, z:number) {
    this.use();
    if(this.unifPosOrigin !== -1) {
      gl.uniform3f(this.unifPosOrigin, x, y, z);
    }
  }
  setSmokeStepSize(t:number) {
    this.use();
    if(this.unifSmokeStepSize !== -1) {
      gl.uniform1f(this.unifSmokeStepSize, t);
    }
  }
  setSmokeMaxSteps(t:number) {
    this.use();
    if(this.unifSmokeMaxSteps !== -1) {
      gl.uniform1i(this.unifSmokeMaxSteps, t);
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

    if (this.attrUV != -1 && d.bindUV()) {
      gl.enableVertexAttribArray(this.attrUV);
      gl.vertexAttribPointer(this.attrUV, 4, gl.FLOAT, false, 0, 0);
    }

    d.bindIdx();
    gl.drawElements(d.drawMode(), d.elemCount(), gl.UNSIGNED_INT, 0);

    if (this.attrPos != -1) gl.disableVertexAttribArray(this.attrPos);
    if (this.attrNor != -1) gl.disableVertexAttribArray(this.attrNor);
    if (this.attrUV != -1) gl.disableVertexAttribArray(this.attrUV);
  }
};

export default ShaderProgram;

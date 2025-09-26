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

  // Attribute locations
  attrPos: number;
  attrNor: number;
  attrCol: number;

  // Instance attribute locations for meteors
  attrInstanceData1: number;
  attrInstanceData2: number;

  // Uniform locations for flat shaders
  unifRef: WebGLUniformLocation;
  unifEye: WebGLUniformLocation;
  unifUp: WebGLUniformLocation;
  unifDimensions: WebGLUniformLocation;
  unifTime: WebGLUniformLocation;

  // Uniform locations for Lambert shaders
  unifModel: WebGLUniformLocation;
  unifModelInvTr: WebGLUniformLocation;
  unifViewProj: WebGLUniformLocation;
  unifColor: WebGLUniformLocation;

  // Dynamic uniforms object for easy access
  uniforms: {[key: string]: WebGLUniformLocation} = {};

  constructor(shaders: Array<Shader>) {
    this.prog = gl.createProgram();

    for (let shader of shaders) {
      gl.attachShader(this.prog, shader.shader);
    }
    gl.linkProgram(this.prog);
    if (!gl.getProgramParameter(this.prog, gl.LINK_STATUS)) {
      throw gl.getProgramInfoLog(this.prog);
    }

    // Get attribute locations
    this.attrPos = gl.getAttribLocation(this.prog, "vs_Pos");
    this.attrNor = gl.getAttribLocation(this.prog, "vs_Nor");
    this.attrCol = gl.getAttribLocation(this.prog, "vs_Col");

    // Get instance attribute locations for meteors
    this.attrInstanceData1 = gl.getAttribLocation(this.prog, "a_InstanceData1");
    this.attrInstanceData2 = gl.getAttribLocation(this.prog, "a_InstanceData2");

    // Get uniform locations for flat shaders
    this.unifEye = gl.getUniformLocation(this.prog, "u_Eye");
    this.unifRef = gl.getUniformLocation(this.prog, "u_Ref");
    this.unifUp = gl.getUniformLocation(this.prog, "u_Up");
    this.unifDimensions = gl.getUniformLocation(this.prog, "u_Dimensions");
    this.unifTime = gl.getUniformLocation(this.prog, "u_Time");

    // Get uniform locations for Lambert shaders
    this.unifModel = gl.getUniformLocation(this.prog, "u_Model");
    this.unifModelInvTr = gl.getUniformLocation(this.prog, "u_ModelInvTr");
    this.unifViewProj = gl.getUniformLocation(this.prog, "u_ViewProj");
    this.unifColor = gl.getUniformLocation(this.prog, "u_Color");

    // Populate uniforms object for easy access
    this.uniforms.u_Eye = this.unifEye;
    this.uniforms.u_Ref = this.unifRef;
    this.uniforms.u_Up = this.unifUp;
    this.uniforms.u_Dimensions = this.unifDimensions;
    this.uniforms.u_Time = this.unifTime;
    this.uniforms.u_Model = this.unifModel;
    this.uniforms.u_ModelInvTr = this.unifModelInvTr;
    this.uniforms.u_ViewProj = this.unifViewProj;
    this.uniforms.u_Color = this.unifColor;

    // Get additional fireball-specific uniforms
    this.uniforms.u_EmissionStrength = gl.getUniformLocation(this.prog, "u_EmissionStrength");
    this.uniforms.u_FlameSize = gl.getUniformLocation(this.prog, "u_FlameSize");
    this.uniforms.u_Scale = gl.getUniformLocation(this.prog, "u_Scale");
    this.uniforms.u_VoronoiScale = gl.getUniformLocation(this.prog, "u_VoronoiScale");
    this.uniforms.u_GradientStrength = gl.getUniformLocation(this.prog, "u_GradientStrength");
    this.uniforms.u_Resolution = gl.getUniformLocation(this.prog, "u_Resolution");
    // Get transparency uniforms 
    this.uniforms.u_AlphaClipThreshold = gl.getUniformLocation(this.prog, "u_AlphaClipThreshold");
    this.uniforms.u_TransparencyStrength = gl.getUniformLocation(this.prog, "u_TransparencyStrength");

    // ADDED: Get bloom-specific uniforms
    this.uniforms.u_Texture = gl.getUniformLocation(this.prog, "u_Texture");
    this.uniforms.u_Resolution = gl.getUniformLocation(this.prog, "u_Resolution");
    this.uniforms.u_Direction = gl.getUniformLocation(this.prog, "u_Direction");
    this.uniforms.u_BlurSize = gl.getUniformLocation(this.prog, "u_BlurSize");
    this.uniforms.u_BloomThreshold = gl.getUniformLocation(this.prog, "u_BloomThreshold");
    this.uniforms.u_OriginalTexture = gl.getUniformLocation(this.prog, "u_OriginalTexture");
    this.uniforms.u_BloomTexture = gl.getUniformLocation(this.prog, "u_BloomTexture");
    this.uniforms.u_BloomStrength = gl.getUniformLocation(this.prog, "u_BloomStrength");
  
  
  
  }

  use() {
    if (activeProgram !== this.prog) {
      gl.useProgram(this.prog);
      activeProgram = this.prog;
    }
  }

  // For flat shaders
  setEyeRefUp(eye: vec3, ref: vec3, up: vec3) {
    this.use();
    if(this.unifEye !== -1) {
      gl.uniform3f(this.unifEye, eye[0], eye[1], eye[2]);
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

  // For Lambert shaders
  setModelMatrix(model: mat4) {
    this.use();
    if(this.unifModel !== -1) {
      gl.uniformMatrix4fv(this.unifModel, false, model);
    }
  }

  setModelInvTrMatrix(modelInvTr: mat4) {
    this.use();
    if(this.unifModelInvTr !== -1) {
      gl.uniformMatrix4fv(this.unifModelInvTr, false, modelInvTr);
    }
  }

  setViewProjMatrix(viewProj: mat4) {
    this.use();
    if(this.unifViewProj !== -1) {
      gl.uniformMatrix4fv(this.unifViewProj, false, viewProj);
    }
  }

  setGeometryColor(color: vec4) {
    this.use();
    if(this.unifColor !== -1) {
      gl.uniform4fv(this.unifColor, color);
    }
  }

  draw(d: Drawable) {
    this.use();

    // Bind position attribute
    if (this.attrPos != -1 && d.bindPos()) {
      gl.enableVertexAttribArray(this.attrPos);
      gl.vertexAttribPointer(this.attrPos, 4, gl.FLOAT, false, 0, 0);
    }

    // Bind normal attribute if available
    if (this.attrNor != -1 && d.bindNor()) {
      gl.enableVertexAttribArray(this.attrNor);
      gl.vertexAttribPointer(this.attrNor, 4, gl.FLOAT, false, 0, 0);
    }

    // Draw the geometry
    d.bindIdx();
    gl.drawElements(d.drawMode(), d.elemCount(), gl.UNSIGNED_INT, 0);

    // Clean up
    if (this.attrPos != -1) gl.disableVertexAttribArray(this.attrPos);
    if (this.attrNor != -1) gl.disableVertexAttribArray(this.attrNor);
  }

  // New method for instanced drawing (for meteors)
  drawInstanced(d: any, instanceCount: number) {
    this.use();

    // Bind position attribute
    if (this.attrPos != -1 && d.bindPos()) {
      gl.enableVertexAttribArray(this.attrPos);
      gl.vertexAttribPointer(this.attrPos, 4, gl.FLOAT, false, 0, 0);
    }

    // Bind normal attribute if available
    if (this.attrNor != -1 && d.bindNor()) {
      gl.enableVertexAttribArray(this.attrNor);
      gl.vertexAttribPointer(this.attrNor, 4, gl.FLOAT, false, 0, 0);
    }

    // Bind instance data
    if (d.bindInstanceData) {
      d.bindInstanceData(this.attrInstanceData1, this.attrInstanceData2, -1);
    }

    // Draw instanced
    d.bindIdx();
    gl.drawElementsInstanced(d.drawMode(), d.elemCount(), gl.UNSIGNED_INT, 0, instanceCount);

    // Clean up
    if (this.attrPos != -1) gl.disableVertexAttribArray(this.attrPos);
    if (this.attrNor != -1) gl.disableVertexAttribArray(this.attrNor);
    if (this.attrInstanceData1 != -1) {
      gl.disableVertexAttribArray(this.attrInstanceData1);
      gl.vertexAttribDivisor(this.attrInstanceData1, 0);
    }
    if (this.attrInstanceData2 != -1) {
      gl.disableVertexAttribArray(this.attrInstanceData2);
      gl.vertexAttribDivisor(this.attrInstanceData2, 0);
    }
  }
};

export default ShaderProgram;
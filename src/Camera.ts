var CameraControls = require('3d-view-controls');
import {vec3, mat4} from 'gl-matrix';

class Camera {
  controls: any;
  projectionMatrix: mat4 = mat4.create();
  viewMatrix: mat4 = mat4.create();
  fovy = 45;
  aspectRatio = 1;
  near = 0.1;
  far = 1000;

  position: vec3 = vec3.create();
  target: vec3 = vec3.create();
  up: vec3 = vec3.fromValues(0, 1, 0);

  constructor(position: vec3, target: vec3) {
    this.controls = CameraControls(document.getElementById('canvas'), {
      eye: position,
      center: target,
    });

    // Initialize from inputs / controls
    vec3.copy(this.position, this.controls.eye);
    vec3.copy(this.target,   this.controls.center);
    vec3.copy(this.up,       this.controls.up);

    mat4.lookAt(this.viewMatrix, this.position, this.target, this.up);
  }

  setAspectRatio(ar: number) { this.aspectRatio = ar; }
  updateProjectionMatrix() {
    mat4.perspective(this.projectionMatrix, this.fovy, this.aspectRatio, this.near, this.far);
  }

  update() {
    this.controls.tick(); // updates controls.eye/center/up
    vec3.copy(this.position, this.controls.eye);
    vec3.copy(this.target,   this.controls.center);
    vec3.copy(this.up,       this.controls.up);
    mat4.lookAt(this.viewMatrix, this.position, this.target, this.up);
  }

  // handy getter that returns a COPY if you don’t want external mutation
  getEye(out?: vec3): vec3 {
    if (out) { return vec3.copy(out, this.position); }
    return vec3.clone(this.position);
  }
}
export default Camera;

import {mat4, vec4} from 'gl-matrix';
import Drawable from './Drawable';
import Camera from '../../Camera';
import {gl} from '../../globals';
import ShaderProgram from './ShaderProgram';

// In this file, `gl` is accessible because it is imported above
class OpenGLRenderer {
  constructor(public canvas: HTMLCanvasElement) {
  }

  setClearColor(r: number, g: number, b: number, a: number) {
    gl.clearColor(r, g, b, a);
  }

  setSize(width: number, height: number) {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  clear() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  }

  render(camera: Camera, prog: ShaderProgram, drawables: Array<Drawable>, time: number) {
    // Set time and camera parameters for both flat and Lambert shaders
    prog.setTime(time);
    prog.setEyeRefUp(camera.controls.eye, camera.controls.center, camera.controls.up);

    // Create matrices for Lambert shaders
    const model = mat4.create();
    mat4.identity(model);

    const view = mat4.create();
    mat4.lookAt(view, camera.controls.eye, camera.controls.center, camera.controls.up);

    const proj = mat4.create();
    mat4.perspective(proj, camera.fovy, camera.aspectRatio, camera.near, camera.far);

    const viewProj = mat4.create();
    mat4.multiply(viewProj, proj, view);

    const modelInvTr = mat4.create();
    mat4.invert(modelInvTr, model);
    mat4.transpose(modelInvTr, modelInvTr);

    // Set matrices for Lambert shaders (will be ignored by flat shaders)
    prog.setModelMatrix(model);
    prog.setModelInvTrMatrix(modelInvTr);
    prog.setViewProjMatrix(viewProj);



    // Draw all drawables
    for (let drawable of drawables) {
      prog.draw(drawable);
    }
  }
};

export default OpenGLRenderer;
import {mat4, vec4} from 'gl-matrix';
import Drawable from './Drawable';
import Camera from '../../Camera';
import {gl} from '../../globals';
import ShaderProgram from './ShaderProgram';
import Icosphere from '../../geometry/Icosphere';
import Cube from '../../geometry/Cube';

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

  // render(camera: Camera, prog: ShaderProgram, drawables: Array<Drawable>, inputColor: vec4) {
  render(camera: Camera, prog: ShaderProgram, drawables: Array<Drawable>, time: number, timeScale : number = 0.7, fragTimeScale : number = 0.7, worleyScale : number = 1.0, xzAmplitude : number = 1.0) {
    prog.setEyeRefUp(camera.controls.eye, camera.controls.center, camera.controls.up);

    let model = mat4.create();
    let viewProj = mat4.create();
    // let color = vec4.fromValues(inputColor[0] / 255, inputColor[1] / 255, inputColor[2] / 255, 1);
    let color = vec4.fromValues(250 / 255, 200 / 255, 200 / 255, 1);

    mat4.identity(model);
    mat4.multiply(viewProj, camera.projectionMatrix, camera.viewMatrix);
    prog.setModelMatrix(model);
    prog.setViewProjMatrix(viewProj);
    prog.setGeometryColor(color);
    prog.setTime(time);
    prog.setTimeScale(timeScale);
    prog.setFragTimeScale(fragTimeScale);
    prog.setWorleyScale(worleyScale);
    prog.setXZAmplitude(xzAmplitude);

    for (let drawable of drawables) {
      if (drawable instanceof Icosphere) {
        prog.setRadius(drawable.r);
        prog.setPosOrigin(drawable.center[0], drawable.center[1], drawable.center[2]);
      } else if (drawable instanceof Cube) {
        prog.setPosOrigin(drawable.center[0], drawable.center[1], drawable.center[2]);
        prog.setRadius(2);
        model = mat4.create();
        mat4.identity(model);
        mat4.translate(model,model,drawable.center);
        mat4.scale(model,model,drawable.scale);
        prog.setModelMatrix(model);

      }
      prog.draw(drawable);
    }
  }
};

export default OpenGLRenderer;

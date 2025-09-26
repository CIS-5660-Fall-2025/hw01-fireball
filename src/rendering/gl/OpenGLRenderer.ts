import {mat4, vec4} from 'gl-matrix';
import Drawable from './Drawable';
import Camera from '../../Camera';
import {gl} from '../../globals';
import ShaderProgram from './ShaderProgram';

// In this file, `gl` is accessible because it is imported above
class OpenGLRenderer {
  time: number = 0;
  taillength: number = 1.0;
  framerate: number = 8.0;
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

  hexToRgb(hex: number): { r: number; g: number; b: number } {
  return {
    r: (hex >> 16) & 0xff,
    g: (hex >> 8) & 0xff,
    b: hex & 0xff
  };
}

  render(camera: Camera, 
        progs: Array<ShaderProgram>,
        drawables: Array<Drawable>, 
        color: number,
        taillength: number,
        framerate: number) {
    let color_rgb = this.hexToRgb(color);
    let colorvec4 = vec4.fromValues(color_rgb.r / 255.0,
                                    color_rgb.g / 255.0,
                                    color_rgb.b/ 255.0,
                                    1.0);
    let model = mat4.create();
    let viewProj = mat4.create();
    this.time = this.time + 1;
    this.taillength = taillength;
    this.framerate = framerate;

    mat4.identity(model);
    mat4.multiply(viewProj, camera.projectionMatrix, camera.viewMatrix);
    var i;
    for (i = 0; i < progs.length; i++) {
      let prog = progs[i];
      let drawable = drawables[i];
      prog.setModelMatrix(model);
      prog.setViewProjMatrix(viewProj);
      prog.setGeometryColor(colorvec4);
      prog.setTime(this.time);
      prog.setTail(this.taillength);
      prog.setFrameRate(this.framerate);

      prog.draw(drawable);

    }
   
  }
};

export default OpenGLRenderer;

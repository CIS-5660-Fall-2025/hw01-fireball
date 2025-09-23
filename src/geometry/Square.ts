import {vec3, vec4} from 'gl-matrix';
import Drawable from '../rendering/gl/Drawable';

class Square extends Drawable {
  indices: Uint32Array;
  positions: Float32Array;
  center: vec4;

  constructor(center: vec3, public gl: WebGL2RenderingContext) {
    super(gl); // Call the constructor of the super class. This is required.
    this.center = vec4.fromValues(center[0], center[1], center[2], 1);
  }

  create() {

  this.indices = new Uint32Array([0, 1, 2,
                                  0, 2, 3]);
  this.positions = new Float32Array([-1, -1, 0.999, 1,
                                     1, -1, 0.999, 1,
                                     1, 1, 0.999, 1,
                                     -1, 1, 0.999, 1]);

    this.generateIdx();
    this.generatePos();

    this.count = this.indices.length;
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.bufIdx);
    this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, this.indices, this.gl.STATIC_DRAW);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.bufPos);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, this.positions, this.gl.STATIC_DRAW);

    console.log(`Created square`);
  }
};

export default Square;

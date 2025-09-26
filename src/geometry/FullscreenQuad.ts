import {gl} from '../globals';
import Drawable from '../rendering/gl/Drawable';

class FullscreenQuad extends Drawable {
  indices: Uint32Array;
  positions: Float32Array;
  normals: Float32Array;

  constructor() {
    super();
    
    // Fullscreen quad vertices 
    this.positions = new Float32Array([
      -1.0, -1.0, 0.0, 1.0, // Bottom-left
       1.0, -1.0, 0.0, 1.0, // Bottom-right
       1.0,  1.0, 0.0, 1.0, // Top-right
      -1.0,  1.0, 0.0, 1.0  // Top-left
    ]);

    // Dummy normals 
    this.normals = new Float32Array([
      0.0, 0.0, 1.0, 0.0,
      0.0, 0.0, 1.0, 0.0,
      0.0, 0.0, 1.0, 0.0,
      0.0, 0.0, 1.0, 0.0
    ]);

    // Two triangles forming a quad
    this.indices = new Uint32Array([
      0, 1, 2,
      2, 3, 0
    ]);
  }

  create() {
    this.generateIdx();
    this.generatePos();
    this.generateNor();

    this.count = this.indices.length;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.bufIdx);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufPos);
    gl.bufferData(gl.ARRAY_BUFFER, this.positions, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufNor);
    gl.bufferData(gl.ARRAY_BUFFER, this.normals, gl.STATIC_DRAW);

    console.log(`Created fullscreen quad`);
  }
}

export default FullscreenQuad;
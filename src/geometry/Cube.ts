import {vec3, vec4} from 'gl-matrix';
import Drawable from '../rendering/gl/Drawable';
import {gl} from '../globals';

class Cube extends Drawable {
  positions: Float32Array;
  normals: Float32Array;
  indices: Uint32Array;
  colors: Float32Array;
  color: number[];
  center: vec4;

  constructor(center: vec3, public size: number, base_color: number[]) {
    super();
    this.center = vec4.fromValues(center[0], center[1], center[2], 1);
    this.color = base_color;
  }

  create() {
    const half = this.size / 2.0;

    // Positions
    const posArr: number[] = [
      -half, -half,  half, 1,   // 0
       half, -half,  half, 1,   // 1
       half,  half,  half, 1,   // 2
      -half,  half,  half, 1,   // 3
      -half, -half, -half, 1,   // 4
       half, -half, -half, 1,   // 5
       half,  half, -half, 1,   // 6
      -half,  half, -half, 1    // 7
    ];

    // Indices
    const idxArr: number[] = [
      0,1,2,  0,2,3,   // Front
      1,5,6,  1,6,2,   // Right
      5,4,7,  5,7,6,   // Back
      4,0,3,  4,3,7,   // Left
      3,2,6,  3,6,7,   // Top
      4,5,1,  4,1,0    // Bottom
    ];

    // Normals
    const normArr: number[] = [
       0, 0, 1, 0,   // front
       0, 0, 1, 0,
       0, 0, 1, 0,
       0, 0, 1, 0,

       0, 0,-1, 0,   // back
       0, 0,-1, 0,
       0, 0,-1, 0,
       0, 0,-1, 0
    ];

    // Vertex colors
    const r = this.color[0] / 255;
    const g = this.color[1] / 255;
    const b = this.color[2] / 255;
    const a = 1.0;

    const colArr: number[] = [];
    for (let i = 0; i < 8; i++) {  // Push the same RGBA for each vertex
        colArr.push(r, g, b, a);
    }

    // Convert to typed arrays
    this.positions = new Float32Array(posArr);
    this.normals = new Float32Array(normArr);
    this.indices = new Uint32Array(idxArr);
    this.colors = new Float32Array(colArr);

    // Upload to GPU
    this.generateIdx();
    this.generatePos();
    this.generateNor();
    this.generateCol();

    this.count = this.indices.length;

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.bufIdx);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufPos);
    gl.bufferData(gl.ARRAY_BUFFER, this.positions, gl.DYNAMIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufNor);
    gl.bufferData(gl.ARRAY_BUFFER, this.normals, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufCol);
    gl.bufferData(gl.ARRAY_BUFFER, this.colors, gl.DYNAMIC_DRAW);

    console.log(`Created cube with ${this.positions.length / 4} vertices`);
  }
}

export default Cube;

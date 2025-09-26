import {gl} from '../globals';
import Drawable from '../rendering/gl/Drawable';
import {vec3, vec4} from 'gl-matrix';

class Cube extends Drawable {
  center: vec4;

  constructor(center: vec3 = vec3.fromValues(0, 0, 0)) {
    super(); 
    this.center = vec4.fromValues(center[0], center[1], center[2], 1);
  }

  create() {
    const halfSize = 1.0;
    const c = this.center;


    const vertices = [
      // Front face vertices
      vec4.fromValues(c[0] - halfSize, c[1] - halfSize, c[2] + halfSize, 1),
      vec4.fromValues(c[0] + halfSize, c[1] - halfSize, c[2] + halfSize, 1),
      vec4.fromValues(c[0] + halfSize, c[1] + halfSize, c[2] + halfSize, 1),
      vec4.fromValues(c[0] - halfSize, c[1] + halfSize, c[2] + halfSize, 1),
      // Back face vertices
      vec4.fromValues(c[0] - halfSize, c[1] - halfSize, c[2] - halfSize, 1),
      vec4.fromValues(c[0] + halfSize, c[1] - halfSize, c[2] - halfSize, 1),
      vec4.fromValues(c[0] + halfSize, c[1] + halfSize, c[2] - halfSize, 1),
      vec4.fromValues(c[0] - halfSize, c[1] + halfSize, c[2] - halfSize, 1)
    ];

    // Create position array (6 faces * 4 vertices * 4 components)
    const positions = new Float32Array([
      // Front face (z = +1)
      ...vertices[0], ...vertices[1], ...vertices[2], ...vertices[3],
      // Back face (z = -1)
      ...vertices[5], ...vertices[4], ...vertices[7], ...vertices[6],
      // Top face (y = +1)
      ...vertices[3], ...vertices[2], ...vertices[6], ...vertices[7],
      // Bottom face (y = -1)
      ...vertices[4], ...vertices[5], ...vertices[1], ...vertices[0],
      // Right face (x = +1)
      ...vertices[1], ...vertices[5], ...vertices[6], ...vertices[2],
      // Left face (x = -1)
      ...vertices[4], ...vertices[0], ...vertices[3], ...vertices[7]
    ]);


    const normals = new Float32Array([
      0, 0, 1, 0,  0, 0, 1, 0,  0, 0, 1, 0,  0, 0, 1, 0,
      0, 0, -1, 0,  0, 0, -1, 0,  0, 0, -1, 0,  0, 0, -1, 0,
      0, 1, 0, 0,  0, 1, 0, 0,  0, 1, 0, 0,  0, 1, 0, 0,
      0, -1, 0, 0,  0, -1, 0, 0,  0, -1, 0, 0,  0, -1, 0, 0,
      1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0,

      -1, 0, 0, 0,  -1, 0, 0, 0,  -1, 0, 0, 0,  -1, 0, 0, 0
    ]);

    const indices = new Uint32Array([
      // Front face
      0, 1, 2,    0, 2, 3,
      // Back face
      4, 5, 6,    4, 6, 7,
      // Top face
      8, 9, 10,   8, 10, 11,
      // Bottom face
      12, 13, 14, 12, 14, 15,
      // Right face
      16, 17, 18, 16, 18, 19,
      // Left face
      20, 21, 22, 20, 22, 23
    ]);


    this.generateIdx();
    this.generatePos();
    this.generateNor();

    // Upload index data
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.bufIdx);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    // Upload position data
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufPos);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufNor);
    gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);

    this.count = indices.length;

    console.log(`Created cube with ${positions.length / 4} vertices and ${indices.length / 3} triangles`);
  }
}

export default Cube;
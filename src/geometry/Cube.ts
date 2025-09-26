import {vec3, vec4} from 'gl-matrix';
import Drawable from '../rendering/gl/Drawable';
import {gl} from '../globals';

class Cube extends Drawable {
  indices: Uint32Array;
  positions: Float32Array;
  normals: Float32Array;
  center: vec4;
  scale: vec4;

  constructor(center: vec3, scale: vec3 = vec3.fromValues(1.0,1.0,1.0)) {
    super(); // Call the constructor of the super class. This is required.
    this.center = vec4.fromValues(center[0], center[1], center[2], 1);
    this.scale = vec4.fromValues(scale[0], scale[1], scale[2], 1.0);
  }

  create() {

    // TODO just hardcode? 
  // this.indices = new Uint32Array([0, 1, 2,
  //                                 0, 2, 3]);
  // this.normals = new Float32Array([0, 0, 1, 0,
  //                                  0, 0, 1, 0,
  //                                  0, 0, 1, 0,
  //                                  0, 0, 1, 0]);
  // this.positions = new Float32Array([-1, -1, 0, 1,
  //                                    1, -1, 0, 1,
  //                                    1, 1, 0, 1,
  //                                    -1, 1, 0, 1]);

    this.positions = new Float32Array(96);

    let i : number = 0;
    for (let j : number = 0; j < 3; ++j) {
      for (let z : number = -1; z < 2; z += 2) {
        for (let y : number = -1; y < 2; y += 2) {
          for (let x : number = -1; x < 2; x += 2) {
            // let i : number = ((x + 1) / 2 + 2 * (y + 1) / 2 + 4 * (z + 1) / 2 + j * 8)*4;
            this.positions[i] = x;
            this.positions[i+1] = y;
            this.positions[i+2] = z;
            this.positions[i+3] = 1;
            i += 4;
          }
        }
      }
    }

    this.indices = new Uint32Array([0, 1, 2,
                                    1, 2, 3,
                                  
                                    4, 5, 6,
                                    5, 6, 7,

                                    8,10,12,
                                    10,12,14,

                                    9,11,13,
                                    11,13,15,

                                    16,17,20,
                                    17,20,21,

                                    18,19,22,
                                    19,22,23
                                  ]);
    this.normals = new Float32Array([ 0, 0, -1, 0,
                                      0, 0, -1, 0,
                                      0, 0, -1, 0,
                                      0, 0, -1, 0,
                                      
                                      0, 0, 1, 0,
                                      0, 0, 1, 0,
                                      0, 0, 1, 0,
                                      0, 0, 1, 0,

                                      0, -1, 0, 0,
                                      0, 1, 0, 0,
                                      0, -1, 0, 0,
                                      0, 1, 0, 0,
                                      
                                      0, -1, 0, 0,
                                      0, 1, 0, 0,
                                      0, -1, 0, 0,
                                      0, 1, 0, 0,

                                      -1, 0, 0, 0,
                                      -1, 0, 0, 0,
                                      1, 0, 0, 0,
                                      1, 0, 0, 0,

                                      -1, 0, 0, 0,
                                      -1, 0, 0, 0,
                                      1, 0, 0, 0,
                                      1, 0, 0, 0,

                                    ]);


    this.generateIdx();
    this.generatePos();
    this.generateNor();

    this.count = this.indices.length;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.bufIdx);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufNor);
    gl.bufferData(gl.ARRAY_BUFFER, this.normals, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufPos);
    gl.bufferData(gl.ARRAY_BUFFER, this.positions, gl.STATIC_DRAW);


    // console.log(this.positions);
    console.log(`Created cube`);
  }
};

export default Cube;

import {vec3, vec4} from 'gl-matrix';
import Drawable from '../rendering/gl/Drawable';
import {gl} from '../globals';

class Cube extends Drawable {
    indices: Uint32Array;
    positions: Float32Array;
    normals: Float32Array;
    center: vec4;
    edgeLength: number;

    constructor(center: vec3, edgeLength: number) {
        super();
        this.center = vec4.fromValues(center[0], center[1], center[2], 1);
        this.edgeLength = edgeLength;
    }

    create() {
        const maxVertexCount = 8;
        this.indices = new Uint32Array([
            0, 1, 2, 
            0, 2, 3,
            0, 7, 3, 
            0, 4, 7,
            0, 5, 1,
            0, 4, 5,
            6, 5, 1, 
            6, 1, 2,
            6, 2, 3, 
            6, 3, 7,
            6, 7, 4, 
            6, 4, 5
        ])

        this.positions = new Float32Array([
            -1, -1, -1, 1,
             1, -1, -1, 1,
             1,  1, -1, 1,
            -1,  1, -1, 1,
            -1, -1,  1, 1,
             1, -1,  1, 1,
             1,  1,  1, 1,
            -1,  1,  1, 1
        ]);

        // Shift all the positions by the center and scale by edge length
        for (let i = 0; i < maxVertexCount; i++) {
            this.positions[i*4+0] = this.positions[i*4+0] * this.edgeLength/2 + this.center[0];
            this.positions[i*4+1] = this.positions[i*4+1] * this.edgeLength/2 + this.center[1];
            this.positions[i*4+2] = this.positions[i*4+2] * this.edgeLength/2 + this.center[2];
        }

        // normalized for each corner's normal to point outwards from the center
        const n = 1/Math.sqrt(3);
        this.normals = new Float32Array([
            -n, -n, -n, 0,
             n, -n, -n, 0,
             n,  n, -n, 0,
            -n,  n, -n, 0,
            -n, -n,  n, 0,
             n, -n,  n, 0,
             n,  n,  n, 0,
            -n,  n,  n, 0
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

        console.log(`Created cube`);
    }
}

export default Cube;
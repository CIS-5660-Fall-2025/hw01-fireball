import { vec3, vec4 } from 'gl-matrix';
import Drawable from '../rendering/gl/Drawable';
import { gl } from '../globals';

class Cube extends Drawable {
    indices: Uint32Array;
    positions: Float32Array;
    normals: Float32Array;
    center: vec4;
    sideLength: number;

    constructor(center: vec3, sideLength: number) {
        super(); // Call the constructor of the super class. This is required.
        this.center = vec4.fromValues(center[0], center[1], center[2], 1);
        this.sideLength = sideLength;
    }

    create() {
        let x = this.center[0];
        let y = this.center[1];
        let z = this.center[2];

        let halfSide = this.sideLength / 2.0;

        // vertex data
        const verts: vec4[] = [
            vec4.fromValues(x - halfSide, y - halfSide, z + halfSide, 1),
            vec4.fromValues(x + halfSide, y - halfSide, z + halfSide, 1),
            vec4.fromValues(x + halfSide, y + halfSide, z + halfSide, 1),
            vec4.fromValues(x - halfSide, y + halfSide, z + halfSide, 1),

            vec4.fromValues(x - halfSide, y - halfSide, z - halfSide, 1),
            vec4.fromValues(x + halfSide, y - halfSide, z - halfSide, 1),
            vec4.fromValues(x + halfSide, y + halfSide, z - halfSide, 1),
            vec4.fromValues(x - halfSide, y + halfSide, z - halfSide, 1)
        ];

        // Face normals
        const norms: vec4[] = [
            [0, 0, +1, 0],
            [0, 0, -1, 0],
            [-1, 0, 0, 0],
            [+1, 0, 0, 0],
            [0, +1, 0, 0],
            [0, -1, 0, 0]
        ];

        this.positions = new Float32Array([
            // Front
            verts[0][0], verts[0][1], verts[0][2], 1,
            verts[1][0], verts[1][1], verts[1][2], 1,
            verts[2][0], verts[2][1], verts[2][2], 1,
            verts[3][0], verts[3][1], verts[3][2], 1,

            // Back
            verts[7][0], verts[7][1], verts[7][2], 1,
            verts[6][0], verts[6][1], verts[6][2], 1,
            verts[5][0], verts[5][1], verts[5][2], 1,
            verts[4][0], verts[4][1], verts[4][2], 1,

            // Left
            verts[4][0], verts[4][1], verts[4][2], 1, 
            verts[0][0], verts[0][1], verts[0][2], 1,
            verts[3][0], verts[3][1], verts[3][2], 1,
            verts[7][0], verts[7][1], verts[7][2], 1,

            // Right
            verts[1][0], verts[1][1], verts[1][2], 1,
            verts[5][0], verts[5][1], verts[5][2], 1, 
            verts[6][0], verts[6][1], verts[6][2], 1,
            verts[2][0], verts[2][1], verts[2][2], 1,

            // Top
            verts[3][0], verts[3][1], verts[3][2], 1,
            verts[2][0], verts[2][1], verts[2][2], 1,
            verts[6][0], verts[6][1], verts[6][2], 1,
            verts[7][0], verts[7][1], verts[7][2], 1,

            // Bottom
            verts[4][0], verts[4][1], verts[4][2], 1,
            verts[5][0], verts[5][1], verts[5][2], 1,
            verts[1][0], verts[1][1], verts[1][2], 1,
            verts[0][0], verts[0][1], verts[0][2], 1
        ]);

        this.normals = new Float32Array([
            // Front
            norms[0][0], norms[0][1], norms[0][2], 0,
            norms[0][0], norms[0][1], norms[0][2], 0,
            norms[0][0], norms[0][1], norms[0][2], 0,
            norms[0][0], norms[0][1], norms[0][2], 0,

            // Back
            norms[1][0], norms[1][1], norms[1][2], 0,
            norms[1][0], norms[1][1], norms[1][2], 0,
            norms[1][0], norms[1][1], norms[1][2], 0,
            norms[1][0], norms[1][1], norms[1][2], 0,

            // Left 
            norms[2][0], norms[2][1], norms[2][2], 0,
            norms[2][0], norms[2][1], norms[2][2], 0,
            norms[2][0], norms[2][1], norms[2][2], 0,
            norms[2][0], norms[2][1], norms[2][2], 0,

            // Right
            norms[3][0], norms[3][1], norms[3][2], 0,
            norms[3][0], norms[3][1], norms[3][2], 0,
            norms[3][0], norms[3][1], norms[3][2], 0,
            norms[3][0], norms[3][1], norms[3][2], 0,

            // Top
            norms[4][0], norms[4][1], norms[4][2], 0,
            norms[4][0], norms[4][1], norms[4][2], 0,
            norms[4][0], norms[4][1], norms[4][2], 0,
            norms[4][0], norms[4][1], norms[4][2], 0,

            // Bottom
            norms[5][0], norms[5][1], norms[5][2], 0,
            norms[5][0], norms[5][1], norms[5][2], 0,
            norms[5][0], norms[5][1], norms[5][2], 0,
            norms[5][0], norms[5][1], norms[5][2], 0
        ]);

        this.indices = new Uint32Array([
            // Front
            0, 1, 2, 0, 2, 3,
            // Back
            4, 5, 6, 4, 6, 7,
            // Left 
            8, 9, 10, 8, 10, 11,
            // Right
            12, 13, 14, 12, 14, 15,
            // Top
            16, 17, 18, 16, 18, 19,
            // Bottom
            20, 21, 22, 20, 22, 23
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
};

export default Cube;

import { vec3, vec4 } from 'gl-matrix';
import Drawable from '../rendering/gl/Drawable';
import { gl } from '../globals';

class Cube extends Drawable {
    indices: Uint32Array;
    positions: Float32Array;
    normals: Float32Array;
    center: vec4;

    constructor(center: vec3) {
        super();
        this.center = vec4.fromValues(center[0], center[1], center[2], 1);
    }

    create() {

        this.positions = new Float32Array([
            // front 
            0.5, 0.5, 0.5, 1,
            - 0.5, 0.5, 0.5, 1,
            - 0.5, - 0.5, 0.5, 1,
            0.5, - 0.5, 0.5, 1,
            // back
            0.5, 0.5, - 0.5, 1,
            - 0.5, 0.5, - 0.5, 1,
            - 0.5, - 0.5, - 0.5, 1,
            0.5, - 0.5, - 0.5, 1,
            // right
            0.5, 0.5, -0.5, 1,
            0.5, 0.5, 0.5, 1,
            0.5, -0.5, 0.5, 1,
            0.5, -0.5, -0.5, 1,
            // left
            - 0.5, 0.5, -0.5, 1,
            - 0.5, 0.5, 0.5, 1,
            - 0.5, -0.5, 0.5, 1,
            - 0.5, -0.5, -0.5, 1,
            // top
            0.5, 0.5, -0.5, 1,
            - 0.5, 0.5, -0.5, 1,
            - 0.5, 0.5, 0.5, 1,
            0.5, 0.5, 0.5, 1,
            // bottom
            0.5, - 0.5, -0.5, 1,
            - 0.5, - 0.5, -0.5, 1,
            - 0.5, - 0.5, 0.5, 1,
            0.5, - 0.5, 0.5, 1

        ]);

        this.normals = new Float32Array([
            // front
            0, 0, 1, 0,
            0, 0, 1, 0,
            0, 0, 1, 0,
            0, 0, 1, 0,
            // back
            0, 0, -1, 0,
            0, 0, -1, 0,
            0, 0, -1, 0,
            0, 0, -1, 0,
            // right
            1, 0, 0, 0,
            1, 0, 0, 0,
            1, 0, 0, 0,
            1, 0, 0, 0,
            // left
            -1, 0, 0, 0,
            -1, 0, 0, 0,
            -1, 0, 0, 0,
            -1, 0, 0, 0,
            // top
            0, 1, 0, 0,
            0, 1, 0, 0,
            0, 1, 0, 0,
            0, 1, 0, 0,
            // bottom
            0, -1, 0, 0,
            0, -1, 0, 0,
            0, -1, 0, 0,
            0, -1, 0, 0
        ]);

        this.indices = new Uint32Array(36);
        for (let i = 0; i < 6; i++) {

            // two triangles per face, 
            //change index order(triangle orientation) for deformation in vert shader
            if (i == 0 || i == 3 || i == 5) {
                // front-0, left-3. bottom-5 
                this.indices[i * 6 + 0] = i * 4 + 0;
                this.indices[i * 6 + 1] = i * 4 + 1;
                this.indices[i * 6 + 2] = i * 4 + 3;
                this.indices[i * 6 + 3] = i * 4 + 1;
                this.indices[i * 6 + 4] = i * 4 + 2;
                this.indices[i * 6 + 5] = i * 4 + 3;
            }
            else {
                // back-1, right-2, top-4
                this.indices[i * 6 + 0] = i * 4 + 0;
                this.indices[i * 6 + 1] = i * 4 + 1;
                this.indices[i * 6 + 2] = i * 4 + 2;
                this.indices[i * 6 + 3] = i * 4 + 0;
                this.indices[i * 6 + 4] = i * 4 + 2;
                this.indices[i * 6 + 5] = i * 4 + 3;


            }            
        }

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
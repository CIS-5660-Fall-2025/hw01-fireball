import {vec3, vec4} from 'gl-matrix';
import Drawable from '../rendering/gl/Drawable';
import {gl} from '../globals';

class Icosphere extends Drawable {
  indices: Uint32Array;
  positions: Float32Array;
  normals: Float32Array;
  center: vec4;

  constructor(center: vec3, subdivisions: number = 2) {
    super();
    this.center = vec4.fromValues(center[0], center[1], center[2], 1);
    this.generateIcosphere(subdivisions);
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

    console.log(`Created icosphere with ${this.positions.length / 4} vertices`);
  }

  private generateIcosphere(subdivisions: number) {
    // Create initial icosahedron
    const t = (1.0 + Math.sqrt(5.0)) / 2.0;

    const vertices: vec3[] = [
      vec3.fromValues(-1, t, 0),
      vec3.fromValues(1, t, 0),
      vec3.fromValues(-1, -t, 0),
      vec3.fromValues(1, -t, 0),
      vec3.fromValues(0, -1, t),
      vec3.fromValues(0, 1, t),
      vec3.fromValues(0, -1, -t),
      vec3.fromValues(0, 1, -t),
      vec3.fromValues(t, 0, -1),
      vec3.fromValues(t, 0, 1),
      vec3.fromValues(-t, 0, -1),
      vec3.fromValues(-t, 0, 1)
    ];

    // Normalize vertices
    vertices.forEach(v => vec3.normalize(v, v));

    let triangles: number[][] = [
      [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
      [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
      [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
      [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]
    ];

    // Subdivide
    for (let i = 0; i < subdivisions; i++) {
      const newTriangles: number[][] = [];
      const midpointIndices = new Map<string, number>();

      const getMidpointIndex = (i1: number, i2: number): number => {
        const key = Math.min(i1, i2) + ',' + Math.max(i1, i2);
        
        if (midpointIndices.has(key)) {
          return midpointIndices.get(key)!;
        }

        const midpoint = vec3.create();
        vec3.add(midpoint, vertices[i1], vertices[i2]);
        vec3.scale(midpoint, midpoint, 0.5);
        vec3.normalize(midpoint, midpoint);

        const index = vertices.length;
        vertices.push(midpoint);
        midpointIndices.set(key, index);
        return index;
      };

      triangles.forEach(tri => {
        const [v1, v2, v3] = tri;
        const a = getMidpointIndex(v1, v2);
        const b = getMidpointIndex(v2, v3);
        const c = getMidpointIndex(v3, v1);

        newTriangles.push([v1, a, c]);
        newTriangles.push([v2, b, a]);
        newTriangles.push([v3, c, b]);
        newTriangles.push([a, b, c]);
      });

      triangles = newTriangles;
    }

    // Convert to typed arrays
    this.positions = new Float32Array(vertices.length * 4);
    this.normals = new Float32Array(vertices.length * 4);

    for (let i = 0; i < vertices.length; i++) {
      this.positions[i * 4] = vertices[i][0] + this.center[0];
      this.positions[i * 4 + 1] = vertices[i][1] + this.center[1];
      this.positions[i * 4 + 2] = vertices[i][2] + this.center[2];
      this.positions[i * 4 + 3] = 1.0;

      this.normals[i * 4] = vertices[i][0];
      this.normals[i * 4 + 1] = vertices[i][1];
      this.normals[i * 4 + 2] = vertices[i][2];
      this.normals[i * 4 + 3] = 0.0;
    }

    const indices: number[] = [];
    triangles.forEach(tri => {
      indices.push(tri[0], tri[1], tri[2]);
    });

    this.indices = new Uint32Array(indices);
  }
}

export default Icosphere;
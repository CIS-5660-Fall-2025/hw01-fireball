import {vec3} from 'gl-matrix';
import Drawable from '../rendering/gl/Drawable';
import {gl} from '../globals';

export default class Icosphere extends Drawable {
  indices: Uint32Array;
  positions: Float32Array;
  normals: Float32Array;
  bufNor: WebGLBuffer;
  basePositions: vec3[];
  baseNormals: vec3[];
  vertexCount: number;

  constructor(center: vec3, radius = 1, subdivisions = 1) {
    super();
    this.basePositions = [];
    this.baseNormals = [];
    this.vertexCount = 0;
    this.createBaseMesh(center, radius, subdivisions);
  }

  private random(x: number, y: number, z: number): number {
    return Math.abs(Math.sin(x * 12.0 + y * 78.0 + z * 45.0) * 43758.0) % 1;
  }

  private deformPosition(pos: vec3, growthFactor: number): vec3 {
    const r = this.random(pos[0], pos[1], pos[2]);
    const result = vec3.clone(pos);
    vec3.scale(result, result, 1.0 + (r - 0.5) * 0.3 * growthFactor * (0.5 + Math.max(0, pos[1])));
    return result;
  }

  private createBaseMesh(center: vec3, radius: number, subdivisions: number) {
    const t = (1.0 + Math.sqrt(5.0)) / 2.0;
    const vertices = [[-1,t,0], [1,t,0], [-1,-t,0], [1,-t,0], [0,-1,t], [0,1,t],
                     [0,-1,-t], [0,1,-t], [t,0,-1], [t,0,1], [-t,0,-1], [-t,0,1]];
    const faces = [[0,11,5], [0,5,1], [0,1,7], [0,7,10], [0,10,11], [1,5,9],
                  [5,11,4], [11,10,2], [10,7,6], [7,1,8], [3,9,4], [3,4,2],
                  [3,2,6], [3,6,8], [3,8,9], [4,9,5], [2,4,11], [6,2,10],
                  [8,6,7], [9,8,1]];

    const vertexMap = new Map<string, number>();
    const vertexList: vec3[] = [];
    const addVertex = (v: vec3) => {
      const key = `${v[0]},${v[1]},${v[2]}`;
      if (!vertexMap.has(key)) {
        vertexMap.set(key, vertexList.length);
        vertexList.push(vec3.clone(v));
      }
      return vertexMap.get(key)!;
    };

    vertices.forEach(v => {
      const pos = vec3.fromValues(v[0], v[1], v[2]);
      vec3.normalize(pos, pos);
      addVertex(pos);
    });

    let currentFaces = faces;
    for (let i = 0; i < subdivisions; i++) {
      const newFaces: number[][] = [];
      currentFaces.forEach(face => {
        const v1 = vertexList[face[0]], v2 = vertexList[face[1]], v3 = vertexList[face[2]];
        const a = addVertex(vec3.normalize(vec3.create(), vec3.add(vec3.create(), v1, v2)));
        const b = addVertex(vec3.normalize(vec3.create(), vec3.add(vec3.create(), v2, v3)));
        const c = addVertex(vec3.normalize(vec3.create(), vec3.add(vec3.create(), v3, v1)));
        newFaces.push([face[0],a,c], [face[1],b,a], [face[2],c,b], [a,b,c]);
      });
      currentFaces = newFaces;
    }

    this.basePositions = vertexList;
    this.baseNormals = vertexList.map(v => vec3.normalize(vec3.create(), v));
    this.indices = new Uint32Array(currentFaces.flat());
    this.vertexCount = vertexList.length;

    this.generateIdx();
    this.generatePos();
    this.generateNor();

    this.count = this.indices.length;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.bufIdx);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);
  }

  update(time: number) {
    const growthFactor = Math.pow(Math.sin((time * 0.001) % 10.0 * Math.PI / 10.0), 2.0);
    const positions: number[] = [];
    const normals: number[] = [];

    for (let i = 0; i < this.vertexCount; i++) {
      const deformedPos = this.deformPosition(this.basePositions[i], growthFactor);
      const normal = vec3.normalize(vec3.create(), deformedPos);
      positions.push(...deformedPos, 1.0);
      normals.push(...normal, 0.0);
    }

    this.positions = new Float32Array(positions);
    this.normals = new Float32Array(normals);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufPos);
    gl.bufferData(gl.ARRAY_BUFFER, this.positions, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufNor);
    gl.bufferData(gl.ARRAY_BUFFER, this.normals, gl.STATIC_DRAW);
  }

  create() { this.update(0); }
  generateNor() { this.bufNor = gl.createBuffer(); }
  bindNor() { gl.bindBuffer(gl.ARRAY_BUFFER, this.bufNor); return true; }
}
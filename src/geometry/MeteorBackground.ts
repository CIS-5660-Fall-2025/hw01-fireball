import {vec3, vec4} from 'gl-matrix';
import {gl} from '../globals';
import Drawable from '../rendering/gl/Drawable';

export default class MeteorBackground extends Drawable {
  private instanceBuffer: WebGLBuffer;
  private instanceCount: number = 50;
  private instanceData: Float32Array;
  
  private meteorParams = {
    count: 50,
    speed: 1.0,
    size: 0.15,
    brightness: 0.8,
    lifetime: 4.0
  };

  constructor() {
    super();
    this.generateInstanceData();
  }

  setParams(params: Partial<typeof this.meteorParams>) {
    Object.assign(this.meteorParams, params);
    if (params.count && params.count !== this.instanceCount) {
      this.instanceCount = params.count;
      this.generateInstanceData();
      this.updateInstanceBuffer();
    }
  }

  private generateInstanceData() {
    const floatsPerInstance = 8;
    this.instanceData = new Float32Array(this.instanceCount * floatsPerInstance);
    
    for (let i = 0; i < this.instanceCount; i++) {
      this.resetMeteor(i);
    }
  }

  private resetMeteor(index: number) {
    const offset = index * 8;
    
    // Random position across entire screen
    const startX = -1.0 + Math.random() * 2.0;
    const startY = -1.0 + Math.random() * 2.0;
    
    // 45-degree diagonal direction (top-left to bottom-right)
    const speed = (0.3 + Math.random() * 0.2) * this.meteorParams.speed;
    const velocityX = speed * 0.707;
    const velocityY = -speed * 0.707;
    
    const lifetime = this.meteorParams.lifetime * (0.8 + Math.random() * 0.4);
    const currentTime = 0.0; // Always start from time 0
    const size = this.meteorParams.size * (0.7 + Math.random() * 0.6);
    const brightness = this.meteorParams.brightness * (0.6 + Math.random() * 0.4);
    
    this.instanceData[offset + 0] = startX;
    this.instanceData[offset + 1] = startY;
    this.instanceData[offset + 2] = velocityX;
    this.instanceData[offset + 3] = velocityY;
    this.instanceData[offset + 4] = lifetime;
    this.instanceData[offset + 5] = currentTime;
    this.instanceData[offset + 6] = size;
    this.instanceData[offset + 7] = brightness;
  }

  private updateInstanceBuffer() {
    if (this.instanceBuffer) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, this.instanceData, gl.DYNAMIC_DRAW);
    }
  }

  create() {
    // Line geometry for meteor trail
    const positions = new Float32Array([
      0.0, 0.0, 0.0, 1.0,  // Head
      1.0, 0.0, 0.0, 1.0   // Tail
    ]);

    const normals = new Float32Array([
      0.0, 0.0, 1.0, 0.0,
      0.0, 0.0, 1.0, 0.0
    ]);

    const indices = new Uint32Array([0, 1]);

    this.generateIdx();
    this.bindIdx();
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    this.generatePos();
    this.bindPos();
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    this.generateNor();
    this.bindNor();
    gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);

    this.instanceBuffer = gl.createBuffer();
    this.updateInstanceBuffer();

    this.count = indices.length;
  }

  bindInstanceData(attrLocation1: number, attrLocation2: number, attrLocation3: number) {
    if (this.instanceBuffer) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuffer);
      
      if (attrLocation1 !== -1) {
        gl.enableVertexAttribArray(attrLocation1);
        gl.vertexAttribPointer(attrLocation1, 4, gl.FLOAT, false, 32, 0);
        gl.vertexAttribDivisor(attrLocation1, 1);
      }
      
      if (attrLocation2 !== -1) {
        gl.enableVertexAttribArray(attrLocation2);
        gl.vertexAttribPointer(attrLocation2, 4, gl.FLOAT, false, 32, 16);
        gl.vertexAttribDivisor(attrLocation2, 1);
      }
    }
  }

  drawMode(): GLenum {
    return gl.LINES;
  }

  updateTime(deltaTime: number) {
    let needsUpdate = false;
    
    for (let i = 0; i < this.instanceCount; i++) {
      const offset = i * 8;
      const lifetime = this.instanceData[offset + 4];
      let currentTime = this.instanceData[offset + 5];
      
      currentTime += deltaTime;
      
      if (currentTime > lifetime) {
        this.resetMeteor(i);
        needsUpdate = true;
      } else {
        this.instanceData[offset + 5] = currentTime;
        needsUpdate = true;
      }
    }
    
    if (needsUpdate) {
      this.updateInstanceBuffer();
    }
  }

  getInstanceCount(): number {
    return this.instanceCount;
  }

  destroy() {
    super.destory();
    if (this.instanceBuffer) {
      gl.deleteBuffer(this.instanceBuffer);
    }
  }
}
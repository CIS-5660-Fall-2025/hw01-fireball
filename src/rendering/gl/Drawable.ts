
abstract class Drawable {
  count: number = 0;

  bufIdx: WebGLBuffer;
  bufPos: WebGLBuffer;
  bufNor: WebGLBuffer;

  idxBound: boolean = false;
  posBound: boolean = false;
  norBound: boolean = false;

  constructor(public gl: WebGL2RenderingContext) {}

  abstract create() : void;

  destory() {
    this.gl.deleteBuffer(this.bufIdx);
    this.gl.deleteBuffer(this.bufPos);
    this.gl.deleteBuffer(this.bufNor);
  }

  generateIdx() {
    this.idxBound = true;
    this.bufIdx = this.gl.createBuffer();
  }

  generatePos() {
    this.posBound = true;
    this.bufPos = this.gl.createBuffer();
  }

  generateNor() {
    this.norBound = true;
    this.bufNor = this.gl.createBuffer();
  }

  bindIdx(): boolean {
    if (this.idxBound) {
      this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.bufIdx);
    }
    return this.idxBound;
  }

  bindPos(): boolean {
    if (this.posBound) {
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.bufPos);
    }
    return this.posBound;
  }

  bindNor(): boolean {
    if (this.norBound) {
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.bufNor);
    }
    return this.norBound;
  }

  elemCount(): number {
    return this.count;
  }

  drawMode(): GLenum {
    return this.gl.TRIANGLES;
  }
};

export default Drawable;

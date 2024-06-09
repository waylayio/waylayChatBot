class FIFOBuffer {
  constructor(maxSize) {
    this.maxSize = maxSize;
    this.buffer = [];
  }

  _discardExcessValues() {
    if (this.buffer.length > this.maxSize) {
      this.buffer.splice(0, this.buffer.length - this.maxSize);
    }    
  }

  push(item) {
    this.buffer.push(item);
    this._discardExcessValues();
  }

  pushMany(items) {
    this.buffer = this.buffer.concat(items);
    this._discardExcessValues();
  }

  replaceAll(items) {
    this.buffer = items;
    this._discardExcessValues();
  }

  getBuffer() {
    return this.buffer;
  }

  clearBuffer() {
    this.buffer = [];
  }

  getLatestValue() {
    return (this.buffer.length === 0) 
      ? null 
      : this.buffer[this.buffer.length - 1];
  }
}
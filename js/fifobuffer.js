class FIFOBuffer {
    constructor(maxSize) {
      this.maxSize = maxSize;
      this.buffer = [];
    }
  
    push(item) {
      this.buffer.push(item);
      if (this.buffer.length > this.maxSize) {
        this.buffer.shift();
      }
    }
    getBuffer() {
      return this.buffer;
    }
  
    clearBuffer() {
      this.buffer = [];
    }
  
    getLatestValue() {
      if (this.buffer.length === 0) {
        return null;
      }
      return this.buffer[this.buffer.length - 1];
    }
  }
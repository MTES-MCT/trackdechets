import { Transform, TransformCallback } from "node:stream";

// Custom Error for UTF-8 Validation
export class Utf8ValidationError extends Error {
  constructor() {
    super(
      "Le fichier ne semble pas être encodé en UTF-8. Veuillez vérifier l'encodage du fichier."
    );
    this.name = "Utf8ValidationError";
  }
}

const UTF8_CHECK_BYTES_THRESHOLD = 1024; // Check up to the first 1KB

export class Utf8ValidatorTransform extends Transform {
  private buffer: Buffer[] = [];
  private totalBytesBuffered = 0;
  private validationPerformed = false;

  // Using TextDecoder to validate UTF-8 encoding
  private readonly decoder = new TextDecoder("utf-8", { fatal: true });

  constructor(options?: import("stream").TransformOptions) {
    super(options);
  }

  _transform(
    chunk: Buffer,
    _encoding: BufferEncoding,
    callback: TransformCallback
  ): void {
    if (this.validationPerformed) {
      this.push(chunk);
      return callback();
    }

    this.buffer.push(chunk);
    this.totalBytesBuffered += chunk.length;

    if (this.totalBytesBuffered >= UTF8_CHECK_BYTES_THRESHOLD) {
      this.performValidation(callback);
    } else {
      // Not enough bytes yet, wait for more or for _flush
      callback();
    }
  }

  _flush(callback: TransformCallback): void {
    if (!this.validationPerformed) {
      this.performValidation(callback);
    } else {
      callback();
    }
  }

  private performValidation(callback: TransformCallback): void {
    const bufferConcat = Buffer.concat(this.buffer);

    if (this.validationPerformed) {
      if (this.buffer.length > 0) {
        this.push(bufferConcat);
        this.buffer = [];
      }
      return callback();
    }

    this.validationPerformed = true;

    // If no bytes were ever buffered, empty stream is considered valid.
    if (bufferConcat.length === 0) {
      return callback();
    }

    try {
      // This throws if the buffer is not valid UTF-8
      // Use stream: true to avoid failure when decoding partial buffers
      this.decoder.decode(bufferConcat, { stream: true });

      this.push(bufferConcat);
      this.buffer = [];
      this.totalBytesBuffered = 0;
      callback();
    } catch (_) {
      // Emit error via the callback, pipeline() will forward it
      callback(new Utf8ValidationError());
    }
  }
}

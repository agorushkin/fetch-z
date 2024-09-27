export class Reader {
  #buffer: Uint8Array;
  #offset: number = 0;

  constructor(buffer: Uint8Array) {
    this.#buffer = buffer;
  }

  read_uint = (size: number): number => {
    const value = this.#buffer.slice(this.#offset, this.#offset + size).reduce(
      (acc, byte, i) => acc + byte * 2 ** (8 * i),
      0,
    );
    this.#offset += size;
    return value;
  };

  read_uint8 = (): number => {
    const value = this.#buffer[this.#offset];
    this.#offset += 1;
    return value;
  };

  read_uint16 = (): number => {
    const value = new DataView(
      this.#buffer.buffer,
      this.#buffer.byteOffset,
      this.#buffer.byteLength,
    ).getUint16(this.#offset, true);
    this.#offset += 2;
    return value;
  };

  read_uint32 = (): number => {
    const value = new DataView(
      this.#buffer.buffer,
      this.#buffer.byteOffset,
      this.#buffer.byteLength,
    ).getUint32(this.#offset, true);
    this.#offset += 4;
    return value;
  };

  read_uint64 = (): bigint => {
    const value = new DataView(
      this.#buffer.buffer,
      this.#buffer.byteOffset,
      this.#buffer.byteLength,
    ).getBigInt64(this.#offset, true);
    this.#offset += 8;
    return value;
  };

  read_int16 = (): number => {
    const value = new DataView(
      this.#buffer.buffer,
      this.#buffer.byteOffset,
      this.#buffer.byteLength,
    ).getInt16(this.#offset, true);

    this.#offset += 2;
    return value;
  };

  read_string = (): string => {
    const end = this.#buffer.indexOf(0x00, this.#offset);
    const value = new TextDecoder().decode(
      this.#buffer.slice(this.#offset, end),
    );
    this.#offset = end + 1;
    return value;
  };

  read_dayz_byte = (): number => {
    const byte = this.read_uint8();
    if (byte === 1) {
      const byte2 = this.read_uint8();
      if (byte2 === 1) return 1;
      if (byte2 === 2) return 0;
      if (byte2 === 3) return 0xff;
      return 0;
    }
    return byte;
  };

  read_dayz_uint = (bytes: number): number => {
    const buffer = [];
    for (let i = 0; i < bytes; i++) {
      buffer.push(this.read_dayz_byte());
    }
    const reader = new Reader(Uint8Array.from(buffer));
    return reader.read_uint(bytes);
  };

  read_dayz_string = (): string => {
    const buffer = [];
    const length = this.read_dayz_byte();
    for (let i = 0; i < length; i++) {
      buffer.push(this.read_dayz_byte());
    }
    return new TextDecoder().decode(Uint8Array.from(buffer));
  };

  shift = (amount: number): void => {
    this.#offset += amount;
  };

  is_empty = (): boolean => {
    return this.#offset >= this.#buffer.length;
  };
}

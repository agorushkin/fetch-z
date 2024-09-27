import { createSocket, Socket } from 'node:dgram';
import { Buffer } from 'node:buffer';

import { fail, pass, Result } from './util.ts';

export class DatagramSocket {
  #socket: Socket;
  #timeout = 3000;

  constructor() {
    this.#socket = createSocket('udp4');
  }

  send = async (
    buffer: Uint8Array,
    host: string,
    port: number,
  ): Promise<Result<Uint8Array>> => {
    try {
      const message_buffer = await this.#send(
        buffer,
        host,
        port,
        this.#timeout,
      );
      return pass(message_buffer);
    } catch (err) {
      return fail(err as Error);
    }
  };

  close = () => {
    this.#socket.close();
  };

  #send = (
    buffer: Uint8Array,
    host: string,
    port: number,
    timeout: number,
  ): Promise<Uint8Array> => {
    return new Promise((resolve, reject) =>
      (() => {
        this.#socket.send(buffer, port, host, (err) => {
          if (err) reject(err.message);

          const message_listener = (buffer: Buffer) => {
            this.#socket.removeListener('message', message_listener);
            this.#socket.removeListener('error', error_listener);
            clearTimeout(counter);
            return resolve(Uint8Array.from(buffer));
          };

          const error_listener = (err: Error) => {
            this.#socket.removeListener('message', message_listener);
            this.#socket.removeListener('error', error_listener);
            clearTimeout(counter);
            return reject(err.message);
          };

          const counter = setTimeout(() => {
            this.#socket.removeListener('message', message_listener);
            this.#socket.removeListener('error', error_listener);
            return reject('Timeout');
          }, timeout);

          this.#socket.on('message', message_listener);
          this.#socket.on('error', error_listener);
        });
      })()
    );
  };
}

// Possible implementation using Deno in the future.
// Currently it throws an os error 10051 when trying to access another network.

/**
export class PromiseSocket {
  #socket: Deno.DatagramConn;

  constructor() {
    this.#socket = Deno.listenDatagram({
      port: 0,
      transport: 'udp',
    });
  }

  send = async (
    buffer: Uint8Array,
    host: string,
    port: number,
  ): Promise<Result<Uint8Array>> => {
    try {
      const message_buffer = await this.#send(buffer, host, port);
      return pass(message_buffer);
    } catch (err) {
      return fail(err);
    }
  };

  close = () => {
    this.#socket.close();
  };

  #send = async (
    buffer: Uint8Array,
    host: string,
    port: number,
  ): Promise<Uint8Array> => {
    const addr = {
      hostname: host,
      port,
      transport: 'udp',
    } satisfies Deno.NetAddr;

    await this.#socket.send(buffer, addr);
    const [message] = await this.#socket.receive();

    return message;
  };
}
*/

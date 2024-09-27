import { DatagramSocket } from './socket.ts';
import { GameServerInfo, GameServerRules } from '../types.ts';
import { fail, pass, Result } from './util.ts';
import { map_info_response, parse_info_buffer } from './parsers/info.ts';
import { parse_rules_buffer } from './parsers/rules.ts';

const query_gameserver = (
  gameserver: string,
): GameServerQuery => {
  const split_gameserver = gameserver.split(':');
  const host = split_gameserver[0];
  const port = parseInt(split_gameserver[1]);

  return new GameServerQuery(host, port);
};

export const query_gameserver_info = async (
  gameserver: string,
): Promise<Result<GameServerInfo>> => {
  const result = await query_gameserver(gameserver).info();
  return result;
};

export const query_gameserver_rules = async (
  gameserver: string,
): Promise<Result<GameServerRules>> => {
  const result = await query_gameserver(gameserver).rules();
  return result;
};

class GameServerQuery {
  #socket: DatagramSocket;

  #host: string;
  #port: number;

  constructor(
    host: string,
    private port: number,
  ) {
    this.#host = host;
    this.#port = port;

    this.#socket = new DatagramSocket();
  }

  info = async (): Promise<Result<GameServerInfo>> => {
    let buffer: Uint8Array;
    const response = await this.#socket.send(
      this.#build_info_packet(),
      this.#host,
      this.#port,
    );

    if (!response.ok) {
      this.#socket.close();
      return fail(response.error);
    } else {
      buffer = response.value;
    }

    if (this.#is_challenge_response(buffer)) {
      buffer = buffer.slice(5);
      const challenge = buffer;
      const response = await this.#socket.send(
        this.#build_info_packet(challenge),
        this.#host,
        this.#port,
      );

      if (!response.ok) {
        this.#socket.close();
        return fail(response.error);
      }

      buffer = response.value;
    }

    this.#socket.close();
    const parsed_buffer = parse_info_buffer(buffer);
    const mapped_info = map_info_response(parsed_buffer);

    return pass(mapped_info);
  };

  rules = async (): Promise<Result<GameServerRules>> => {
    const challenge_buffer_response = await this.#socket.send(
      this.#build_packet(Uint8Array.from([0x56])),
      this.#host,
      this.#port,
    );

    if (!challenge_buffer_response.ok) {
      this.#socket.close();
      return fail(challenge_buffer_response.error);
    }

    const challenge_buffer = challenge_buffer_response.value;
    const challenge = challenge_buffer.slice(5);

    const response = await this.#socket.send(
      this.#build_packet(Uint8Array.from([0x56]), challenge),
      this.#host,
      this.#port,
    );

    if (!response.ok) {
      this.#socket.close();
      return fail(response.error);
    }

    const buffer = response.value.slice(5);
    this.#socket.close();

    const parsed_rules = parse_rules_buffer(buffer);
    return pass(parsed_rules);
  };

  #build_info_packet = (challenge?: Uint8Array): Uint8Array => {
    const encoded = new TextEncoder().encode('Source Engine Query');
    let packet = Uint8Array.from([
      0xFF,
      0xFF,
      0xFF,
      0xFF,
      0x54,
      ...encoded,
      0x00,
    ]);

    if (challenge) packet = Uint8Array.from([...packet, ...challenge]);

    return packet;
  };

  #build_packet = (header: Uint8Array, challenge?: Uint8Array): Uint8Array => {
    let packet = Uint8Array.from([
      0xFF,
      0xFF,
      0xFF,
      0xFF,
      ...header,
    ]);

    packet = challenge
      ? Uint8Array.from([...packet, ...challenge])
      : Uint8Array.from([...packet, 0xFF, 0xFF, 0xFF, 0xFF]);
    return packet;
  };

  #is_challenge_response = (buffer: Uint8Array): boolean => {
    const challenge = new Uint8Array([0xFF, 0xFF, 0xFF, 0xFF, 0x41]);
    if (buffer.length < challenge.length) return false;

    for (let i = 0; i < challenge.length; i++) {
      if (buffer[i] !== challenge[i]) return false;
    }

    return true;
  };
}

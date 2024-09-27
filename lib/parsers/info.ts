import { GameServerInfo, RawGameserverInfo } from '../../types.ts';
import { Reader } from '../reader.ts';
import { parse_gamedata } from './gamedata.ts';

export const parse_info_buffer = (buffer: Uint8Array): RawGameserverInfo => {
  const info_response: Partial<RawGameserverInfo> = {};
  const reader = new Reader(buffer);
  reader.shift(5);
  info_response.protocol = reader.read_uint8();
  info_response.name = reader.read_string();
  info_response.map = reader.read_string();
  info_response.folder = reader.read_string();
  info_response.game = reader.read_string();
  info_response.app_id = reader.read_int16();
  info_response.players = reader.read_uint8();
  info_response.max_players = reader.read_uint8();
  info_response.bots = reader.read_uint8();

  info_response.server_type = String.fromCharCode(reader.read_uint8());
  info_response.environment = String.fromCharCode(reader.read_uint8());

  info_response.visibility = reader.read_uint8();
  info_response.vac = reader.read_uint8();
  info_response.version = reader.read_string();

  if (buffer.length > 1) {
    const edf = reader.read_uint8();
    if (edf & 0x80) info_response.port = reader.read_int16();
    if (edf & 0x10) reader.shift(8);
    if (edf & 0x40) {
      info_response.spectator_port = reader.read_uint16();
      info_response.spectator_name = reader.read_string();
    }
    if (edf & 0x20) {
      info_response.keywords = reader.read_string();
    }
    if (edf & 0x01) {
      info_response.game_id = reader.read_uint64();
      reader.shift(8);
    }
  }

  return info_response as RawGameserverInfo;
};

export const map_info_response = (
  response: RawGameserverInfo,
): GameServerInfo => {
  const mapped_response: Partial<GameServerInfo> = {};
  const gamedata = parse_gamedata(response.keywords || '');

  mapped_response.name = response.name;
  mapped_response.version = response.version;
  mapped_response.map = response.map;
  mapped_response.status = {
    players: response.players,
    queue: gamedata.queue,
    slots: response.max_players,
  };

  mapped_response.attributes = {
    mods: gamedata.mods,
    hive: gamedata.hive,
    dlcs: {
      enabled: false,
      livonia: false,
    },
    official: gamedata.official,
    password: response.visibility === 1,
    battleye: gamedata.battleye,
  };

  mapped_response.environment = {
    time: gamedata.time,
    acceleration: {
      general: gamedata.acceleration,
      night: gamedata.night_acceleration,
    },
    perspective: {
      first: true,
      third: !gamedata.no3rd,
    },
  };

  if (response.map === 'Enoch') {
    mapped_response.attributes.dlcs.enabled = true;
    mapped_response.attributes.dlcs.livonia = true;
  }

  return mapped_response as GameServerInfo;
};

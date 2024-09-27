export type ServerAttributes = {
  mods: boolean;
  hive: 'public' | 'private';
  acceleration: number;
  night_acceleration: number;
  no3rd: boolean;
  time: string;
  queue: number;
  official: boolean;
  battleye: boolean;
};

export const parse_gamedata = (gamedata: string): ServerAttributes => {
  const attributes: ServerAttributes = {
    mods: false,
    hive: 'public',
    acceleration: 1,
    no3rd: false,
    night_acceleration: 1,
    time: 'day',
    queue: 0,
    official: true,
    battleye: false,
  };

  for (const chunk of gamedata.split(',')) {
    if (chunk === 'battleye') attributes.battleye = true;
    else if (chunk === 'external') attributes.official = false;
    else if (chunk === 'privHive') attributes.hive = 'private';
    else if (chunk === 'no3rd') attributes.no3rd = true;
    else if (chunk.startsWith('lqs')) {
      attributes.queue = parseInt(chunk.slice(3));
    } else if (chunk.startsWith('etm')) {
      attributes.acceleration = parseFloat(chunk.slice(3));
    } else if (chunk.startsWith('entm')) {
      attributes.night_acceleration = parseFloat(chunk.slice(4));
    } else if (chunk === 'mod') attributes.mods = true;
    else if (/\d{1,2}:\d{1,2}/.test(chunk)) attributes.time = chunk;
  }

  return attributes;
};

export type RawGameserverInfo = {
  protocol: number;
  name: string;
  map: string;
  folder: string;
  game: string;
  app_id: number;
  players: number;
  max_players: number;
  bots: number;
  server_type: string;
  environment: string;
  visibility: number;
  vac: number;
  version: string;
  port?: number;
  server_id?: bigint;
  spectator_port?: number;
  spectator_name?: string;
  keywords?: string;
  game_id?: bigint;
};

export type GameServerInfo = {
  name: string;
  version: string;
  map: string;
  status: {
    players: number;
    queue: number;
    slots: number;
  };
  attributes: {
    mods: boolean;
    hive: 'public' | 'private';
    dlcs: {
      enabled: boolean;
      livonia: boolean;
    };
    official: boolean;
    password: boolean;
    battleye: boolean;
  };
  environment: {
    time: string;
    acceleration: {
      general: number;
      night: number;
    };
    perspective: {
      first: boolean;
      third: boolean;
    };
  };
};

export type Mod = {
  workshop_id: number;
  name: string;
};

export type Signature = string;

export type GameServerRules = {
  mods: Mod[];
  signatures: Signature[];
  rules: Record<string, string>;
};

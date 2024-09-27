import { GameServerRules, Mod, Signature } from '../../types.ts';
import { Reader } from '../reader.ts';

export const parse_rules_buffer = (buffer: Uint8Array): GameServerRules => {
  const rules_response: Partial<GameServerRules> = {};
  const reader = new Reader(buffer);

  const rules: Record<string, string> = {};
  const mods: Mod[] = [];
  const signatures: Signature[] = [];

  const dayz_payload = [];
  let dayz_payload_ended = false;

  // Server rules
  const rule_count = reader.read_uint16();
  for (let i = 0; i < rule_count; i++) {
    if (!dayz_payload_ended) {
      const one = reader.read_uint8();
      const two = reader.read_uint8();
      const three = reader.read_uint8();

      if (one !== 0x00 && two !== 0x00 && three === 0x00) {
        while (true) {
          const byte = reader.read_uint8();

          if (byte === 0x00) break;
          dayz_payload.push(byte);
        }
        continue;
      } else {
        dayz_payload_ended = true;
        reader.shift(-3);
      }
    }

    const key = reader.read_string();
    rules[key] = reader.read_string();
  }

  const dayz_reader = new Reader(Uint8Array.from(dayz_payload));

  // Version and Overflow
  dayz_reader.read_dayz_byte();
  dayz_reader.read_dayz_byte();

  // Checks for DLC1 and DLC2
  dayz_reader.read_dayz_byte() && dayz_reader.read_dayz_uint(4);
  dayz_reader.read_dayz_byte() && dayz_reader.read_dayz_uint(4);

  // Mods with headers, i.e. Workshop mods
  const mod_count = dayz_reader.read_dayz_byte();
  for (let i = 0; i < mod_count; i++) {
    const mod: Partial<Mod> = {};
    dayz_reader.read_dayz_uint(4);

    const flag = dayz_reader.read_dayz_byte();
    if (flag !== 4) dayz_reader.shift(-1);

    mod.workshop_id = dayz_reader.read_dayz_uint(4);
    mod.name = dayz_reader.read_dayz_string();
    mods.push(mod as Mod);
  }

  // Mods BIKey signatures
  const signature_count = dayz_reader.read_dayz_byte();
  for (let i = 0; i < signature_count; i++) {
    const signature = dayz_reader.read_dayz_string();
    signatures.push(signature);
  }

  rules_response.rules = rules;
  rules_response.mods = mods;
  rules_response.signatures = signatures;

  return rules_response as GameServerRules;
};

/**
 * Types mirroring the CONFIRMED sensor_data schema (see SQL definition
 * screenshot). Do not add fields that don't exist in the real table.
 *
 * IMPORTANT FIELD OWNERSHIP (derived from the actual firmware, not just the
 * spec — the two ESP32 sketches disagree slightly with the written spec):
 *
 *  - ESP32-B ("Weather_Station_Demo") writes ONLY:
 *      reading_slot, pressure, rain, wind_speed, wind_direction,
 *      lightning_warning, warning_found, warning_heading, system_status
 *    via POST .../sensor_data?on_conflict=reading_slot with
 *    Prefer: resolution=merge-duplicates — i.e. a real upsert keyed on the
 *    reading_slot unique index.
 *
 *  - ESP32-A ("Smart Pole" env/gas sketch) writes ONLY:
 *      temperature, humidity, light_level, co_ppm, status
 *    via a PLAIN POST INSERT with NO reading_slot and NO on_conflict/upsert.
 *    Every call creates a brand new row with reading_slot = NULL.
 *
 * Consequence: today's real data is NOT joinable by reading_slot, because
 * only one of the two boards participates in the reading_slot scheme. The
 * dashboard combines the latest ESP32-A row and latest ESP32-B row
 * independently (by created_at) rather than assuming a shared reading_slot.
 * This is documented in the audit as a firmware inconsistency, not silently
 * papered over.
 */

export interface SensorDataRow {
  id: number;
  created_at: string; // timestamptz
  temperature: number | null;
  humidity: number | null;
  light_level: number | null; // bigint
  status: string | null; // ESP32-A's own NORMAL/WARNING/DANGER text
  co_ppm: number | null; // legacy column, no longer displayed
  rain: boolean | null;
  wind_speed: number | null;
  wind_direction: number | null;
  lightning_warning: boolean | null;
  warning_found: string | null; // TEXT: "true" | "false" | "NOT CHECKED" | null
  system_status: string | null; // ESP32-B's own SAFE/WARNING text
  reading_slot: number | null; // bigint, unique when present
  pressure: number | null;
  warning_heading: string | null;

  // --- Xweather integration (added after the schema audit above; written
  // by ESP32-B / the weather sketch). Xweather is now the sole active
  // lightning source (METMalaysia's lightning_warning/warning_found path
  // is temporarily disabled on the firmware side, per user confirmation).
  //   xweather_lightning              -> active/inactive flag for the
  //                                       reading described by reading_type
  //   xweather_reading_type           -> "LIVE" | "LAST_KNOWN" |
  //                                       "UNAVAILABLE", set by firmware.
  //                                       LIVE = fresh read this cycle;
  //                                       LAST_KNOWN = firmware kept the
  //                                       previous good read because the
  //                                       latest Xweather request failed;
  //                                       UNAVAILABLE = no valid reading
  //                                       has ever been obtained.
  //   xweather_reading_timestamp      -> Unix epoch seconds for the
  //                                       underlying Xweather reading
  //                                       (distinct from created_at, which
  //                                       is when this Supabase row itself
  //                                       was written)
  //   xweather_lightning_distance_km  -> reported distance in km; a
  //                                       negative sentinel (e.g. -1)
  //                                       means "no distance", not a real
  //                                       measurement
  xweather_lightning: boolean | null;
  xweather_reading_type: string | null;
  xweather_reading_timestamp: number | null;
  xweather_lightning_distance_km: number | null;
}

export type Database = {
  public: {
    Tables: {
      sensor_data: {
        Row: SensorDataRow;
        Insert: Partial<SensorDataRow>;
        Update: Partial<SensorDataRow>;
      };
    };
  };
};

/** A row that plausibly came from ESP32-A (environmental/gas). */
export function isEnvironmentalRow(row: SensorDataRow): boolean {
  return (
    row.temperature !== null ||
    row.humidity !== null
  );
}

/** A row that plausibly came from ESP32-B (weather station). */
export function isWeatherRow(row: SensorDataRow): boolean {
  return (
    row.wind_speed !== null ||
    row.wind_direction !== null ||
    row.system_status !== null ||
    row.reading_slot !== null
  );
}

/** Combined, application-level "one Smart Pole reading" view. */
export interface CombinedReading {
  envRow: SensorDataRow | null;
  weatherRow: SensorDataRow | null;
  /** True once ESP32-A also writes a shared reading_slot (future firmware). */
  isTrulyCombined: boolean;
  latestTimestamp: string | null;
}
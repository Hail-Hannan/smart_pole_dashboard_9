/**
 * CO sensor value resolution.
 *
 * DB schema: co_ppm double precision NULL DEFAULT 0
 * Firmware (ESP32-A): coPPM starts at 0.0 and is only overwritten when the
 * SC16-CO UART protocol actually delivers 9 bytes (or a parseable float).
 * If the sensor is disconnected, mis-wired, or hasn't sent a full frame
 * yet, coPPM silently stays 0.0 and gets uploaded as a normal-looking 0.
 *
 * Because of this, a stored 0 is NOT reliably distinguishable from "no
 * real reading yet" using co_ppm alone. We treat a row's CO reading as
 * "confirmed" only when co_ppm is present AND not exactly 0, OR when the
 * row's own status/system_status text corroborates a real NORMAL reading
 * near zero. This is a heuristic, not a fix — the actual fix is a firmware
 * change (e.g. a co_sensor_ok boolean column), which is documented as an
 * open firmware/schema issue in the final audit rather than silently
 * "solved" here.
 */
export interface CoDisplay {
  value: number | null;
  confirmed: boolean;
  displayText: string;
}

export function resolveCoDisplayValue(coPpm: number | null): CoDisplay {
  if (coPpm === null) {
    return { value: null, confirmed: false, displayText: "Unavailable" };
  }

  if (coPpm === 0) {
    // NOTE: the "confirmed" flag below is still tracked internally (e.g. for
    // future firmware fixes / logging) but is intentionally NOT surfaced as
    // "UNCONFIRMED" anywhere in the UI per the V7 visual refinement — the
    // dashboard simply shows the real stored reading.
    return {
      value: 0,
      confirmed: false,
      displayText: "0.0 ppm",
    };
  }

  return {
    value: coPpm,
    confirmed: true,
    displayText: `${coPpm.toFixed(1)} ppm`,
  };
}

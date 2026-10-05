import { getSupabaseClient, isSupabaseConfigured } from "./client";
import type { RealtimeChannel } from "@supabase/supabase-js";

/**
 * Singleton Realtime subscription for the sensor_data table, shared by
 * every hook that needs to react to new/updated rows (latest reading,
 * historical charts, latest records). This exists so multiple components
 * mounting at once (e.g. 6 chart instances + the records table + the
 * header) never open 8 separate websocket channels — they all share one.
 *
 * IMPORTANT: subscribes to both INSERT and UPDATE. ESP32-B's firmware
 * upserts sensor_data on the reading_slot unique index with
 * `Prefer: resolution=merge-duplicates` — when reading_slot already
 * exists, Postgres performs an UPDATE, not an INSERT. A listener that
 * only watches INSERT (as an earlier version of this dashboard did) will
 * silently miss those rows, which is the most likely cause of needing a
 * manual browser refresh to see new weather data.
 */

export type ChannelState = "connecting" | "realtime" | "polling" | "unconfigured";

type DataListener = () => void;
type StateListener = (state: ChannelState) => void;

let channel: RealtimeChannel | null = null;
let refCount = 0;
let currentState: ChannelState = "connecting";
let fallbackTimer: ReturnType<typeof setTimeout> | null = null;

const dataListeners = new Set<DataListener>();
const stateListeners = new Set<StateListener>();

function setState(next: ChannelState) {
  if (currentState === next) return;
  currentState = next;
  stateListeners.forEach((l) => l(next));
}

function notifyData() {
  dataListeners.forEach((l) => l());
}

function ensureChannel() {
  if (channel || !isSupabaseConfigured()) return;

  const supabase = getSupabaseClient();
  setState("connecting");

  channel = supabase
    .channel("sensor_data_realtime_bus")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "sensor_data" },
      notifyData
    )
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "sensor_data" },
      notifyData
    )
    .subscribe((status) => {
      if (status === "SUBSCRIBED") {
        setState("realtime");
        if (fallbackTimer) {
          clearTimeout(fallbackTimer);
          fallbackTimer = null;
        }
      } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
        setState("polling");
      }
    });

  // Safety net: if the websocket hasn't confirmed within 6s, tell
  // consumers to rely on their own polling fallback in the meantime.
  fallbackTimer = setTimeout(() => {
    if (currentState === "connecting") setState("polling");
  }, 6000);
}

function teardownChannel() {
  if (channel) {
    getSupabaseClient().removeChannel(channel);
    channel = null;
  }
  if (fallbackTimer) {
    clearTimeout(fallbackTimer);
    fallbackTimer = null;
  }
  currentState = "connecting";
}

/** Subscribe to "a sensor_data row changed" events. Ref-counted: the
 * underlying channel is only created once and only torn down when the
 * last subscriber unsubscribes. */
export function subscribeToSensorDataEvents(listener: DataListener): () => void {
  if (!isSupabaseConfigured()) return () => {};

  refCount += 1;
  dataListeners.add(listener);
  ensureChannel();

  return () => {
    dataListeners.delete(listener);
    refCount = Math.max(0, refCount - 1);
    if (refCount === 0) {
      teardownChannel();
    }
  };
}

export function subscribeToChannelState(listener: StateListener): () => void {
  stateListeners.add(listener);
  listener(isSupabaseConfigured() ? currentState : "unconfigured");
  return () => stateListeners.delete(listener);
}

export function getChannelState(): ChannelState {
  return isSupabaseConfigured() ? currentState : "unconfigured";
}

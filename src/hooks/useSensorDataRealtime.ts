"use client";

import { useEffect, useState } from "react";
import {
  ChannelState,
  getChannelState,
  subscribeToChannelState,
  subscribeToSensorDataEvents,
} from "@/lib/supabase/realtimeBus";

interface UseSensorDataRealtimeResult {
  /** Bumps to Date.now() every time an INSERT or UPDATE fires on
   * sensor_data. Consumers should treat a change in this value as
   * "refetch now", not read it as a timestamp of the row itself. */
  lastEventAt: number;
  channelState: ChannelState;
}

export function useSensorDataRealtime(): UseSensorDataRealtimeResult {
  const [lastEventAt, setLastEventAt] = useState(0);
  const [channelState, setChannelState] = useState<ChannelState>(getChannelState());

  useEffect(() => {
    const unsubscribeData = subscribeToSensorDataEvents(() => {
      setLastEventAt(Date.now());
    });
    const unsubscribeState = subscribeToChannelState(setChannelState);

    return () => {
      unsubscribeData();
      unsubscribeState();
    };
  }, []);

  return { lastEventAt, channelState };
}

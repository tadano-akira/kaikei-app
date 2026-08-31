import { useEffect, useState } from 'react';
import { checkNetwork, getNetworkState, networkEventName, NetworkState } from '../lib/network';

export const useNetworkStatus = () => {
  const [networkState, setNetworkState] = useState<NetworkState>(getNetworkState());

  useEffect(() => {
    const update = (event: Event) => setNetworkState((event as CustomEvent<NetworkState>).detail);
    window.addEventListener(networkEventName, update);
    void checkNetwork();
    const timer = window.setInterval(() => { void checkNetwork(); }, 30_000);
    return () => {
      window.removeEventListener(networkEventName, update);
      window.clearInterval(timer);
    };
  }, []);

  return networkState;
};

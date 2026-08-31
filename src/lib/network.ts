export type NetworkState = 'online' | 'checking' | 'offline' | 'unstable';

const NETWORK_EVENT = 'kaikei-network-state';
const CHECK_TIMEOUT_MS = 3000;
let state: NetworkState = navigator.onLine ? 'online' : 'offline';
let mutationInProgress = false;

const publish = (next: NetworkState) => {
  state = next;
  window.dispatchEvent(new CustomEvent<NetworkState>(NETWORK_EVENT, { detail: next }));
};

export const getNetworkState = () => state;
export const networkEventName = NETWORK_EVENT;

export const checkNetwork = async (): Promise<boolean> => {
  if (!navigator.onLine) {
    publish('offline');
    return false;
  }

  publish('checking');
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS);
  try {
    const url = `${import.meta.env.BASE_URL}favicon.png?network-check=${Date.now()}`;
    const response = await fetch(url, {
      method: 'HEAD',
      cache: 'no-store',
      credentials: 'same-origin',
      signal: controller.signal,
    });
    publish(response.ok ? 'online' : 'unstable');
    return response.ok;
  } catch {
    publish('unstable');
    return false;
  } finally {
    window.clearTimeout(timer);
  }
};

export const runNetworkAction = async <T>(action: () => Promise<T>): Promise<T> => {
  if (mutationInProgress) {
    throw new Error('処理中です。完了するまでお待ちください。');
  }
  if (!(await checkNetwork())) {
    throw new Error('通信状態が不安定です。接続を確認してから、もう一度お試しください。');
  }

  mutationInProgress = true;
  try {
    return await action();
  } finally {
    mutationInProgress = false;
  }
};

window.addEventListener('online', () => { void checkNetwork(); });
window.addEventListener('offline', () => publish('offline'));

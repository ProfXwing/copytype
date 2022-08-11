export {};

interface Bridge {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [x: string]: any;
}

declare global {
  interface Window {
    electron: Bridge;
  }
}
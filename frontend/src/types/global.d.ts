export {};

declare global {
  const process: {
    env: {
      BACKEND_URL: string;
    };
  };

  interface Window {
    __MAYDAY_SELFCARE__: any;
  }
}

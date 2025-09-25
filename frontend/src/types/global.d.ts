export {};

declare global {
  const process: {
    env: {
      BACKEND_URL: string;
    };
  };
}

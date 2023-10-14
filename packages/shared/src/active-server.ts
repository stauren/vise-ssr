// shared package should not import from core, so use any instead of ViseDevServer
let activeServer: any;

function setActiveServer<T>(server: T) {
  activeServer = server;
}

function getActiveServer<T>() {
  return activeServer as T;
}

export {
  getActiveServer,
  setActiveServer,
};

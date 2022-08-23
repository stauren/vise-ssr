export default {
  isOSX: process.platform === 'darwin',
  isWindows: process.platform === 'win32' || process.platform === 'darwin',
  isWin32Like: process.platform === 'win32' || process.platform === 'darwin',
  isLinux: !(process.platform === 'win32' || process.platform === 'darwin'),
};

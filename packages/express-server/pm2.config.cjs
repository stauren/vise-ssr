// @ts-check

module.exports = {
  apps: [
    {
      name: 'vise-intros',
      script: './bin/vise-express.js',
      args: 'start -b ./bundles',
      watch: true,
      env: {
        NODE_ENV: 'production',
        VISE_INTRO: true, // 供应用读取以便区分正式 vise.com 环境
        NODE_PORT: 80,
      },
    },
  ],
};

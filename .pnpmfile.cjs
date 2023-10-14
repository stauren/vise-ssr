module.exports = {
  hooks: {
    readPackage: (pkg) => {
      if (pkg.name === "@vue/test-utils") {
        pkg.dependencies['@vue/compiler-dom'] = '^3.3.4';
      }
      return pkg;
    }
  }
};

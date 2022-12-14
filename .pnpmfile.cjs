module.exports = {
  hooks: {
    readPackage: (pkg) => {
      if (pkg.name === "@vue/test-utils") {
        pkg.dependencies['@vue/compiler-dom'] = '^3.2.25';
      }
      return pkg;
    }
  }
};

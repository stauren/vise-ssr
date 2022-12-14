---
layout: page
title: "单元测试"
permalink: /unit-test.html
lang: en
---
translation in progress

Vise app 目前使用全套 typescript + esm 配置进行单元测试。使用的工具如下：
```JSON
  "@vue/test-utils": "^2.0.0",
  "vitest": "^0.25.7"
```
测试配置文件请参考 [vitest 文档](https://vitest.dev/).

## 单元测试规范
### 全面 typescript 及 esm
Vise 强制源码使用 typescript 及 esmodule 方式管理，包括单元测试代码。

### 测试代码命名规范
测试代码文件名应为 `${modulename}.spec.ts`，位于被测试模块同级的 `__test__` 文件夹中。
示例：
```shell
├── modules
│   ├── module-a.ts
│   ├── module-b.ts
│   ├── __test__
│   │   ├── module-a.spec.ts
│   │   └── module-b.spec.ts
```

### 单元测试技巧及要求
- 单元测试应该尽可能覆盖代码可能的主要分支。在实现模块逻辑的时候，应该以 TDD 思想为指导，尽量编写[易于测试的代码](https://next.vue-test-utils.vuejs.org/guide/essentials/easy-to-test.html)。
- 尽量少在测试 vue 组件时，覆盖大量代码，应该使用 composition API，将组件主要逻辑放入 `src/composable` 目录，并单独为 composable function 编写单元测试
- 应当为 Vuex store 中的 mutations 及 actions 单独编写单元测试

### esm 的坑
目前 Vise 及底层的 vite 使用了 `import.meta.url` 等 meta 信息，这部分源码在 ts-jest 等工具中尚不支持，目前的解决方案是把这部分代码的单独放入 `src/data/env.ts`，并在测试的时候 mock。

### 覆盖率要求
新增代码覆盖率至少 60%，在代码提交、合入主干、流水线构建时会自动检查单元测试是否通过，是否满足覆盖率要求。

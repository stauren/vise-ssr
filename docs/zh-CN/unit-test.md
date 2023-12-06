---
layout: page
title: "单元测试"
permalink: /zh-CN/unit-test.html
---
Vise app 目前使用全套 typescript + esm 配置进行单元测试。使用的工具如下：
```JSON
  "@vue/test-utils": "^2.0.0",
  "vitest": "^0.34.6"
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

### esm 的坑
目前 Vise 及底层的 vite 使用了 `import.meta.url` 等 meta 信息，这部分源码在 ts-jest 等工具中尚不支持，目前的解决方案是把这部分代码的单独放入 `src/data/env.ts`，并在测试的时候 mock。

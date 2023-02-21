---
layout: page
title: "Unit Test"
permalink: /unit-test.html
lang: en
---

Vise apps currently use [vitest](https://vitest.dev/) to do unit test.
Visit [vitest website](https://vitest.dev/) for the detail of 'vitest.config.ts'.

## Unit test convention
### Comprehensive TypeScript & ESModule
All source code should use TypeScript & ESModule, including unit test code.

### Unit test file convention
Unit test files should have a name like `${modulename}.spec.ts` and locate in `__test__` folder where the tested module existed.

Example:

```shell
├── modules
│   ├── module-a.ts
│   ├── module-b.ts
│   ├── __test__
│   │   ├── module-a.spec.ts
│   │   └── module-b.spec.ts
```

### Caveat
Some meta data such as `import.meta.url` used by Vise and vite is not supported by tools like ts-jest. Currently the solution is putting them in a single file such as `src/data/ent.ts` and mock it during test.

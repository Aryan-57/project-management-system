# Implementation references

Checked during implementation on 8 October 2026. The lockfile and Expo-installed compatibility matrix record the actual dependencies. Context7 returned official-source examples for Expo SDK 56 monorepos/SecureStore, Nest guards/Swagger and Prisma 7 PostgreSQL adapters/configuration. Expo MCP tools were not exposed; no Expo MCP authentication or device automation is claimed.

- [React reference](https://react.dev/reference/react)
- [Vite 8 setup/build guide](https://vite.dev/guide/)
- [Tailwind 4 Vite integration](https://tailwindcss.com/docs/installation/using-vite)
- [shadcn/ui Vite setup](https://ui.shadcn.com/docs/installation/vite)
- [Nest authentication and guards](https://docs.nestjs.com/security/authentication)
- [Nest OpenAPI](https://docs.nestjs.com/openapi/introduction)
- [Prisma 7 PostgreSQL adapter](https://www.prisma.io/docs/orm/v7/core-concepts/supported-databases/postgresql)
- [Prisma transactions](https://www.prisma.io/docs/orm/prisma-client/queries/transactions)
- [Expo SDK version compatibility](https://docs.expo.dev/versions/latest/)
- [Expo SDK 56 monorepos](https://github.com/expo/expo/blob/sdk-56/docs/pages/guides/monorepos.mdx)
- [Expo SecureStore](https://docs.expo.dev/versions/v56.0.0/sdk/securestore/)
- [Expo Android APK configuration](https://docs.expo.dev/build-reference/apk/)

Selected stable supported lines rather than accepting Prisma's `latest` tag pointing to a release candidate. Expo package compatibility is checked with the installed `expo install --check`; Prisma migration syntax is taken from installed CLI help. These are build/configuration references, not a test report.

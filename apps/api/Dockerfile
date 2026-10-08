FROM node:22-alpine AS build
WORKDIR /app
RUN npm install --global pnpm@11.18.0
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json ./
COPY packages ./packages
COPY apps/api ./apps/api
COPY apps/web/package.json ./apps/web/package.json
COPY apps/mobile/package.json ./apps/mobile/package.json
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @still/contracts build && pnpm --filter @still/api build
ENV NODE_ENV=production
USER node
EXPOSE 3001
WORKDIR /app/apps/api
CMD ["node", "dist/main.js"]

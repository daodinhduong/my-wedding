FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
COPY --from=build /app/.output ./.output
# Nuxt 4.0/Nitro resolves bundled public assets relative to the chunks directory.
# Keep a copy there so client bundles and audio are available at runtime.
COPY --from=build /app/.output/public ./.output/server/chunks/public
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]

# Built by .github/workflows/deploy.yml (context ., file Dockerfile) and pushed
# to Artifact Registry. Adapted from the fleet's node stack pack.
#
# Express needs no build step: one stage installs production deps from the
# lockfile, a second copies them next to the source and runs `node ./bin/www`
# as the image's non-root `node` user. bin/www reads $PORT AT RUNTIME and
# server.listen(port) binds every interface (0.0.0.0).

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:22-alpine AS runtime
ARG BUILD_ID=""
WORKDIR /app
ENV NODE_ENV=production PORT=3000 BUILD_ID=$BUILD_ID
COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node . .
USER node
EXPOSE 3000
CMD ["node", "./bin/www"]

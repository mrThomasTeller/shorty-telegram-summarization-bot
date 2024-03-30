# Preparation: Remove package.json version for efficient caching
FROM node:20-slim AS deps

COPY package.json pnpm-lock.yaml ./
RUN npm version --allow-same-version 1.0.0

# Building
FROM node:20-slim
RUN apt-get update -y && apt-get install -y openssl
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
RUN npm install -g pm2@^5.3.0

WORKDIR /root/app

COPY .husky .
COPY --from=deps package.json pnpm-lock.yaml ./

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm prod:install

COPY . .

RUN pnpm db:gen-types

CMD pnpm db:migrate && pnpm server:start
FROM node:18-slim
RUN apt-get update -y && apt-get install -y openssl
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
RUN npm install -g pm2@^5.3.0

WORKDIR /root/app

COPY package.json .
COPY pnpm-lock.yaml .

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm prod:install

COPY . .

RUN pnpm prod:prepare-db

CMD pnpm server:start
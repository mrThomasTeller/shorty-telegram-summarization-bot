# Preparation: Remove package.json version for efficient caching
# todo fix it
# FROM oven/bun:slim AS deps

# COPY package.json bun.lockb ./
# RUN bun version --allow-same-version 1.0.0

# Building
FROM oven/bun:slim
RUN apt-get update -y && apt-get install -y openssl

WORKDIR /root/app

COPY .husky .
# COPY --from=deps package.json bun.lockb ./
COPY package.json bun.lockb ./

RUN bun prod:install

COPY . .

RUN bun db:gen-types

CMD bun db:migrate && bun start
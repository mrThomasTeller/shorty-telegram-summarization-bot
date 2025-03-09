# Preparation: Remove package.json version for efficient caching
# todo fix it
# FROM oven/bun:slim AS deps

# COPY package.json bun.lock ./
# RUN bun version --allow-same-version 1.0.0

# Building
FROM node:20-slim
RUN apt-get update -y
RUN apt-get install -y openssl
RUN apt-get install -y curl
RUN apt-get install -y unzip
RUN curl -fsSL https://bun.sh/install | bash -s "bun-v1.2.1"
ENV PATH="/root/.bun/bin:${PATH}"

WORKDIR /root/app

COPY .husky .
# COPY --from=deps package.json bun.lock ./
COPY package.json bun.lock ./

RUN bun prod:install

COPY . .

RUN bun db:gen-types

CMD bun db:migrate && bun start

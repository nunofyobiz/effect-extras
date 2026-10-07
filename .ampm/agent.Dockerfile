FROM node:24.15.0-bookworm

ENV COREPACK_HOME=/usr/local/share/corepack

RUN corepack enable pnpm \
  && corepack install --global pnpm@10.33.4 \
  && chmod -R a+rX "$COREPACK_HOME"

USER node

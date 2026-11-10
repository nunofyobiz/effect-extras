# Refining-step image: the default agent image plus the Mermaid CLI and a pinned headless Chrome,
# so diagrams can be rendered to images. Node and pnpm pins must match agent.Dockerfile, `.nvmrc`
# and package.json's `packageManager`.
FROM node:24.15.0-bookworm

ENV COREPACK_HOME=/usr/local/share/corepack

RUN corepack enable pnpm \
  && corepack install --global pnpm@10.33.4 \
  && chmod -R a+rX "$COREPACK_HOME"

# Image-level so the runtime Puppeteer finds the browser installed below.
ENV PUPPETEER_CACHE_DIR=/opt/puppeteer-cache

# mermaid-cli declares puppeteer only as a peer dependency (^25.0.0), so both are installed together
# with exact versions into one prefix: bumping the Puppeteer pin is the only way to change the
# browser. This is a system tool install outside the repository, so npm is used here; the pnpm-only
# rule governs the repository's own dependencies.
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    fonts-dejavu-core fonts-liberation \
    libasound2 libatk-bridge2.0-0 libatk1.0-0 libcairo2 libcups2 libdbus-1-3 libdrm2 libgbm1 \
    libnspr4 libnss3 libpango-1.0-0 libx11-6 libxcb1 libxcomposite1 libxdamage1 libxext6 \
    libxfixes3 libxkbcommon0 libxrandr2 \
  && PUPPETEER_SKIP_DOWNLOAD=true npm install --prefix /opt/mermaid-cli --save-exact \
    @mermaid-js/mermaid-cli@12.0.0 puppeteer@25.13.0 \
  && /opt/mermaid-cli/node_modules/.bin/puppeteer browsers install chrome-headless-shell \
  && rm -rf /var/lib/apt/lists/* /root/.npm \
  && chmod -R a+rX /opt/mermaid-cli /opt/puppeteer-cache

COPY .ampm/mermaid/puppeteer-config.json /etc/mermaid-cli/puppeteer-config.json
COPY .ampm/mermaid/mmdc.sh /usr/local/bin/mmdc
COPY .ampm/mermaid/check-mmdc.sh /usr/local/bin/ampm-check-mmdc
RUN chmod 755 /usr/local/bin/mmdc /usr/local/bin/ampm-check-mmdc

USER node

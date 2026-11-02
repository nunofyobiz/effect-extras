#!/bin/sh
# Runs mermaid-cli with the container's browser settings so a plain `mmdc -i a.mmd -o a.png` works.
# Docker's seccomp profile and host AppArmor block Chrome's user-namespace sandbox, so the container
# is the isolation boundary and the config passes --no-sandbox. A caller-supplied `-p` replaces it.
exec /opt/mermaid-cli/node_modules/.bin/mmdc -p /etc/mermaid-cli/puppeteer-config.json "$@"

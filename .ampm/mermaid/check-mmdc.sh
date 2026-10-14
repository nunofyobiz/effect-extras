#!/bin/sh
# Startup check: render a tiny diagram with plain `mmdc` and require a real PNG, which proves the
# browser launches (a version check would not).
set -eu

dir=$(mktemp -d)
trap 'rm -rf "$dir"' EXIT

printf 'flowchart LR\n  A --> B\n' >"$dir/in.mmd"

mmdc -i "$dir/in.mmd" -o "$dir/out.png" >/dev/null

if [ ! -s "$dir/out.png" ]; then
  echo "mmdc produced no output image" >&2
  exit 1
fi

if [ "$(head -c 8 "$dir/out.png" | od -An -tx1 | tr -d ' \n')" != "89504e470d0a1a0a" ]; then
  echo "mmdc output is not a PNG" >&2
  exit 1
fi

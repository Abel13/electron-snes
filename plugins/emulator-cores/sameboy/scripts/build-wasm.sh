#!/bin/sh
set -eu

mkdir -p wasm

docker run --rm \
  --platform linux/amd64 \
  -v "$PWD:/workspace" \
  -w /workspace \
  emscripten/emsdk:4.0.12 \
  emcc \
    -O3 \
    -std=gnu2x \
    -D_GNU_SOURCE \
    '-DGB_VERSION="1.0.3"' \
    '-DGB_COPYRIGHT_YEAR="2026"' \
    -DGB_DISABLE_DEBUGGER \
    -DGB_DISABLE_REWIND \
    -DGB_DISABLE_CHEATS \
    -DGB_DISABLE_CHEAT_SEARCH \
    -DGB_INTERNAL \
    -Ivendor/sameboy-core \
    src/sameboy-bridge.c \
    $(find vendor/sameboy-core -maxdepth 1 -type f -name '*.c' \
      ! -name 'cheats.c' \
      ! -name 'cheat_search.c' \
      ! -name 'debugger.c' \
      ! -name 'rewind.c' \
      ! -name 'sm83_disassembler.c' \
      ! -name 'symbol_hash.c') \
    -s STANDALONE_WASM=1 \
    -s EXPORTED_FUNCTIONS='["_malloc","_free"]' \
    -Wl,--no-entry \
    -o wasm/sameboy.wasm

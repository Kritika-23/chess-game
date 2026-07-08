/* eslint-disable no-restricted-globals */

// Stockfish ships several builds. The ASM build is larger/slower than WASM,
// but it is the most reliable inside Create React App workers because it does
// not require copying a paired .wasm asset into the final build output.
importScripts(new URL('stockfish/bin/stockfish-18-asm.js', import.meta.url));

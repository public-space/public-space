# Public Space

Donovan Martinez — music, games, Linux, writing, and small software experiments.

This repository contains my **C64-style web computer**: a file browser, pages as disk files, and a small working BASIC interpreter. It is browser-native code, not a full Commodore 64 emulator.

- [Build it yourself: 12-session tutorial](docs/TUTORIAL.md)
- [How the code works](docs/ARCHITECTURE.md)
- [Making-of and design decisions](docs/MAKING-OF.md)
- [Website setup and editing](docs/WEBSITE.md)
- [BASIC commands and examples](docs/BASIC.md)
- [Connecting real DOS/C64 clients](docs/RETRO-CLIENTS.md)
- [The separate Field0notes Markdown project](https://github.com/public-space/field0notes)

Run locally with `python3 -m http.server 8000 --directory dist`, then visit `http://localhost:8000`. Type `HELP`, or press F1 to browse.

Built with OpenAI Codex as an editable starting point. The original Agada application is not bundled. Project code uses the repository's existing GPL-2.0 license; the embedded STYLE font has its own license in `dist/assets/license.txt`.

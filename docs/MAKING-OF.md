# Making Public Space

Public Space began with Donovan's request for a personal website that visitors could operate like a Commodore 64: pages as files, simple commands, arrow-key browsing, and small programs they could actually write and run. The implementation and initial documentation were generated with OpenAI Codex, then checked and revised through code review, tests, and browser checks. The project is intended to be read, changed, and learned from.

This is a practical account of the implementation and observable design decisions, not a claim to reproduce an exact keystroke-by-keystroke development history.

## The central choice: a browser-native computer

A full emulator would need to reproduce the CPU, memory map, video, sound, and software-loading behavior. That would be useful for running original software, but publishing personal web pages inside it would require another content bridge.

This project instead implements the requested interaction directly in HTML, CSS, and JavaScript. Visitors can genuinely browse files, issue commands, edit source, and run a supported language. Original games and binary disk images belong in the linked real emulators.

The C64 visual character comes from a 40×25 character grid, an embedded C64 font, blue foreground/background colors, a broad border, reverse-video selection, disk-like listings, and a block cursor. Colors and border proportions are an interpretation; the result is not electrically or cycle accurate.

## How the pieces were assembled

1. **Define the display.** A canvas and a cell buffer establish fixed character positions. CSS enlarges the canvas while preserving its pixel-style appearance.
2. **Make it usable as a website.** A real input field, keyboard shortcuts, buttons, clickable rows, text pagination, and a readable transcript make the computer operable beyond its visual effect.
3. **Separate content from behavior.** A JSON manifest points to ordinary text and BASIC files. New pages therefore do not require modifications to the screen engine.
4. **Implement the language separately.** `basic.js` stores numbered lines, parses expressions, dispatches statements, tracks jumps/loops, and calls injected I/O functions. No JavaScript eval is used.
5. **Add recoverable local work.** Workspace persistence, named browser saves, and text export let visitors keep small programs. These saves are local to each browser origin.
6. **Make content portable.** A small Node script validates the disk and generates an ASCII/CRLF feed suitable for a future simple client.
7. **Document and check the boundaries.** Tests check language behavior. Browser checks exercise the user interface. Documentation lists compatibility limits and separates future ideas from finished features.
8. **Prepare ordinary static hosting.** The same files can be served locally, on GitHub Pages, or on another static host. The GitHub workflow tests and uploads the website directory.

## Why these tools

| Choice | Reason and tradeoff |
| --- | --- |
| Plain JavaScript modules | Direct browser support and few moving parts; less framework structure as the app grows |
| Canvas display | Precise cell positioning; needs a separate readable HTML view |
| Local font asset | Consistent character shapes without a font CDN; keep its separate license |
| Plain text content + JSON manifest | Easy to inspect and publish; no automatic Markdown/Obsidian conversion |
| A custom BASIC subset | Small enough to study; intentionally incomplete compatibility |
| Injected interpreter I/O | Same language engine can run in browser UI or Node tests |
| localStorage | Simple browser-local saves; not account sync or durable remote storage |
| Node build helper | Uses standard-library APIs; generates only the text feed |
| Python preview server | Familiar local command; not an application backend |

The current source is compact, and several functions are densely formatted. The tutorial provides a reading order and named entry points. Reformatting a single module on an experiment branch would itself be a useful learning exercise; compare behavior before and after.

## What verification established

The original work included interpreter tests and a headless browser pass covering navigation, full-text search, reading, BASIC input/run, local saves, stop behavior, colors, pagination, links, and a narrow-screen layout. Desktop and mobile screenshots were retained and inspected. On the resumed build, the ten interpreter tests and content build passed again, but the repeated browser launch crashed in that environment. That second browser pass is not claimed as successful.

Physical C64/DOS hardware and the optional native WebMCP integration were not tested. See [VALIDATION.md](VALIDATION.md) for the recorded limits. Passing a small test suite is useful evidence, not proof of full BASIC compatibility or accessibility across every browser.

## Authorship, licenses, and independence

The implementation and tutorial were produced using OpenAI Codex for Donovan's project. No exact underlying model identifier is asserted here: the build record does not reliably establish one. AI was used to create the files; the running application does not require an AI model or make an OpenAI API request.

The repository's existing GPL-2.0 license is retained for project code. C64 Pro Mono is by STYLE and uses its own included license. It is kept under its original filename. Read `dist/assets/license.txt` before redistributing or adapting font use.

A private hosted copy may require the owner's login because of that host's access policy. The website files contain no ChatGPT login dependency. GitHub Pages and a self-hosted copy can operate independently.

## What to make yours first

Write the first real journal entry. Replace starter project descriptions with your own words. Add one BASIC program that does something amusing or useful to you. Then follow [TUTORIAL.md](TUTORIAL.md) to understand and change the machinery beneath it.

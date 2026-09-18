# Public Space: your computer on the web

## What works

A 40-column, 25-row screen, with an unmodified C64 Pro Mono font by STYLE. The logical display is 320×200 pixels inside a colored border. It is scaled with nearest-neighbor rendering. Different real C64 monitors and video standards have different colors and border proportions; this uses a consistent blue-screen interpretation, not cycle-accurate video emulation.

The visitor can browse with arrow keys, Return, and mouse clicks; read paginated text; search titles and file contents; and enter programs into a small BASIC interpreter. Working source is automatically saved locally when edited. Named saves and program exports are supported. No programs are uploaded to a server.

The RAM/ROM boot text is visual homage. The computer does **not** execute arbitrary C64 software, load binary PRG/D64 images, reproduce SID sound, or emulate the 6510/VIC-II. Links to real emulators are on its disk. This is an operating website with its own interpreter, not merely a terminal decoration.

## Start it

```bash
git clone https://github.com/public-space/public-space.git
cd public-space
python3 -m http.server 8000 --bind 127.0.0.1 --directory dist
```

Open http://127.0.0.1:8000. Use an HTTP server rather than double-clicking index.html: the computer fetches its disk files. No dependencies or bundler are required to run it. If you have Node installed, `npm test` checks the interpreter and `npm run build` refreshes the plain-text feed.

## Know the files

| File | Job |
| --- | --- |
| `dist/index.html` | Canvas, command input, buttons, accessible text view |
| `dist/screen.css` | Page layout and C64 font |
| `dist/computer.js` | Screen, keyboard, commands, file browser, local saves |
| `dist/basic.js` | Expression parser and BASIC interpreter |
| `dist/disk.json` | Directory of published pages/programs/links |
| `dist/pages/*.txt` | Plain-text page content |
| `dist/programs/*.bas` | Sample BASIC source |
| `dist/feed/` | Generated plain-text files for simple clients |
| `build.mjs` | Validates disk entries and creates the feed |
| `tests/` | Interpreter regression tests |

**Here `dist/` is the authored website**, except for its generated `feed/` subfolder. This differs from Field0notes, where all of `dist/` is generated. Editing the HTML/CSS/JS in this repo is intentional.

## Add a page or post

1. Write `dist/pages/first-kyoto-session.txt` in a text editor.
2. Add an entry to the array in `dist/disk.json`:

```json
{"name":"KYOTO 01","title":"FIRST KYOTO SESSION","type":"SEQ","path":"pages/first-kyoto-session.txt"}
```

3. Put a comma between adjacent JSON entries, but not after the last one.
4. Refresh the browser. F1 lists your file; `SEARCH KYOTO` finds it.
5. Run `node build.mjs` before uploading so the text feed also contains it.

Names are unique uppercase strings of at most 16 characters (letters, digits, spaces, underscores, hyphens). They become the OPEN/LOAD command names. Write paragraphs normally; the screen wraps them and paginates them. Blank lines are preserved. Content is treated as plain text, so pasted HTML is displayed rather than executed. Everything in `dist/` is public once hosted. Keep drafts outside it.

To add a browser app or a video link, add a URL entry with `text`, `url`, and optional `links`:

```json
{
  "name":"AGADA DEMO",
  "title":"PLAY THE BROWSER BUILD",
  "type":"URL",
  "text":"PRESS RETURN TO OPEN THE DEMO.",
  "url":"https://your-domain.example/agada/",
  "links":[{"title":"Open Agada","url":"https://your-domain.example/agada/"}]
}
```

Use your actual URL. URLs must use HTTPS. File metadata is authored by you; the site is not a public file uploader. A URL opens in a new tab from a visitor's action. The readable section also offers normal links if a browser blocks a popup.

## Customize it one piece at a time

- Start with the text files and `disk.json`.
- Change the name/boot greeting in `drawMenu` in `computer.js`.
- Change palette colors at the top of that file; the canvas colors are separate from the CSS around it.
- `render` draws each of the 1,000 cells. `lineAt` sets one row; `print` writes and scrolls.
- `execute` dispatches commands. A new site command belongs here, not in the BASIC interpreter.
- `basic.js` tokenizes and evaluates a restricted language. It never calls `eval` or `Function`.
- Mobile visitors can use the command field; desktop visitors can type directly after focusing the screen.
- The readable view gives normal selectable text and links. The authentic low-contrast palette is kept on the canvas; the readable view uses a higher-contrast font/color.

Try one change and reload. Use `git diff` before committing. Start an experiment with `git switch -c experiment/your-idea`.

## Hosting

Serve the contents of `dist/` from any static web host. No backend or rewrite rules are needed. Relative paths support both a domain root and a project subdirectory. Keep the repository source outside your public document root; publish only `dist/`.

For GitHub Pages, the included workflow builds/checks the disk and deploys `dist/`. Select **Settings → Pages → Source → GitHub Actions**, then run the **Publish computer** workflow or push to main. That one repository setting requires repository administration access; adding a workflow alone is not proof that Pages is enabled. The project Pages URL, after successful deployment, is normally `https://public-space.github.io/public-space/` (not the profile URL). The repository README also appears on your GitHub profile because the repository name matches your account name.

The `.openai/hosting.json` manifest belongs to the separate hosted preview of this site. It does not configure GitHub Pages. The same static files can be hosted yourself without that manifest.

## Local saves and privacy

Workspace edits and `SAVE NAME` live in `localStorage` for the current browser origin. Named saves overwrite the same name when you issue SAVE again. Site disk names are reserved. Loading a sample or saved program replaces the current workspace; use SAVE or EXPORT first if you want to keep it. Clearing browser data removes local saves. A different domain or browser has separate saves. Browser-private modes may reject storage; the command screen reports failures.

EXPORT creates a plain-text `.bas` file. It is not a tokenized Commodore PRG. Browser key shortcuts and mobile keyboards differ; the visible command form is the fallback.

The optional, feature-detected WebMCP command tool calls the same command dispatcher. It is not needed to use the site and ordinary browsers ignore it. It has the same local-save/export effects as visible commands. The full tool protocol needs a supporting browser to validate.

## Attribution

Font: C64 Pro Mono by STYLE, unmodified and kept under its original filename. Embedded in this freely provided software package under STYLE's terms. See `dist/assets/license.txt` and https://style64.org/c64-truetype. Do not treat that font as GPL project code or redistribute it as a font collection.

Project implementation and sample copy: OpenAI Codex, for Donovan Martinez. Existing repository GPL-2.0 license retained. Read and adapt the code; the limitations are documented in BASIC.md.

# Build and understand your own web computer

This is a hands-on course through Public Space, from a blank HTML page to a small programmable computer. You can follow it slowly, one session at a time. The finished implementation is in this repository; the smaller examples below teach individual pieces rather than replacing the finished files wholesale.

Start with 20–40 minutes per session. The interpreter sessions may take longer. Keep a paper notebook or an Obsidian note with three headings: **prediction / observation / next experiment**. No deadline or extra course commitment required.

## Choose your route

- **I want to publish a note today:** do sessions 1 and 4, then 12.
- **I want to understand the website:** do sessions 1–6 and read [ARCHITECTURE.md](ARCHITECTURE.md).
- **I want to build a language:** do sessions 7–10 with `dist/basic.js` open beside you.
- **I want the story of the build:** read [MAKING-OF.md](MAKING-OF.md).

You need a text editor, browser, Python 3 for local serving, and Git for saving experiments. Node is needed for the existing tests and feed generator. The site itself has no npm runtime dependencies. Python is only serving files here; the application runs in JavaScript in the browser.

## 1. Start the finished machine and map the files

Clone after the website has been merged into main:

```bash
git clone https://github.com/public-space/public-space.git
cd public-space
python3 -m http.server 8000 --bind 127.0.0.1 --directory dist
```

Visit http://127.0.0.1:8000. Leave the terminal running; Ctrl+C stops it. In another terminal in the same project, create your experiment branch:

```bash
git switch -c learning/first-experiments
```

Do these things before reading the implementation:

- [ ] Open ABOUT with the arrows and Return.
- [ ] Type `SEARCH MUSIC`.
- [ ] Type `LOAD HELLO`, then `RUN`.
- [ ] Answer the program's question.
- [ ] Type `LIST` and find the line responsible for the greeting.
- [ ] Open the readable screen beneath the display.

Now open `dist/index.html`, `dist/screen.css`, `dist/computer.js`, and `dist/basic.js`. HTML supplies the elements, CSS lays them out, `computer.js` operates the screen and interface, and `basic.js` understands the small programming language. Read [WEBSITE.md](WEBSITE.md) for the complete file map.

**Done when:** you can explain why Python serves the page but does not execute the BASIC program. Closing the server does not necessarily erase an already-loaded page; reloading it requires access to its files again.

## 2. Make a screen from a blank page

Create an `experiments/` directory at the repository root, outside `dist/`. Put the following complete example in `experiments/screen.html`:

```html
<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Screen experiment</title>
<style>
  body { background: #161322; margin: 24px; }
  canvas { width: min(100%, 768px); image-rendering: pixelated; }
</style>
<canvas id="screen" width="384" height="272"></canvas>
<script>
  const canvas = document.querySelector('#screen');
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#7b71d6';
  ctx.fillRect(0, 0, 384, 272);
  ctx.fillStyle = '#352b79';
  ctx.fillRect(32, 36, 320, 200);
  ctx.fillStyle = '#7b71d6';
  ctx.font = '8px monospace';
  ctx.textBaseline = 'top';
  ctx.fillText('READY.', 32, 36);
</script>
</html>
```

Serve this separate directory from a second terminal:

```bash
python3 -m http.server 8001 --bind 127.0.0.1 --directory experiments
```

Open http://127.0.0.1:8001/screen.html. The generic monospace font is deliberately only a placeholder in this exercise. The completed site uses the locally embedded C64 Pro Mono font; inspect its `@font-face` rule in `screen.css` and retain the font's license and filename if you reuse it.

The canvas has two sizes: its internal drawing resolution and the size at which CSS displays it. Increasing CSS width magnifies the existing drawing. Changing the HTML `width` changes its drawing coordinate system. Keeping these concepts separate makes pixel-style graphics manageable.

The useful screen is 320×200 pixels. Dividing it into 8×8 cells gives 40 columns and 25 rows. The surrounding border makes the full canvas 384×272. Those dimensions are this project's presentation choice, not a simulation of every C64 video standard.

**Experiment:** change the inner rectangle's color, then its x coordinate. Predict the result before reloading. **Done when:** you can point to the screen area and border in the drawing code.

## 3. Store characters before drawing them

Drawing a character immediately is easy. Editing, scrolling, reverse selection, and redrawing are easier if the display first exists as data.

The finished project keeps an array of rows containing cell objects:

```js
const rows = Array.from({ length: 25 }, () =>
  Array.from({ length: 40 }, () => ({
    c: ' ', color: 14, reverse: false
  }))
);
rows[5][10] = { c: 'A', color: 14, reverse: true };
```

The indices start at zero. `rows[5][10]` means the sixth row and eleventh column. Each cell stores a character, a palette index, and whether foreground and background should be reversed.

Avoid `Array(40).fill({c: ' '})`: each position would refer to the same object. `Array.from` with a function creates a separate object each time.

Read these functions in `computer.js`, in order:

1. `fresh`: make a row of blank cells.
2. `lineAt`: write to a particular row, clipping at 40 characters.
3. `newline`: move down; discard the oldest row when the screen fills.
4. `print`: write characters and wrap to a new row.
5. `render`: paint the border, background, and every cell.

Inside `render`, a cell's drawing coordinates are `32 + x * 8` and `36 + y * 8`. A reversed cell gets a filled rectangle behind its character. The blinking cursor is a separate overlay; it does not become part of the stored program or page text.

**Exercise:** change one menu heading in `drawMenu`, refresh, and restore it with your editor's undo. Next, find which `lineAt` call reverses the selected file row. **Done when:** you understand the difference between changing data and drawing data.

## 4. Turn text files into a disk

`disk.json` is a manifest: an explicit list of files the computer knows about. It is not a disk image. Each entry has a command name, descriptive title, type, and either a file path or inline text.

Create `dist/pages/first-note.txt`:

```text
FIRST NOTE

TRIED: Opening the web computer on Linux.
NOTICED: A page can behave like a file.
NEXT: Add a screenshot link.
```

Add this object to the existing array in `dist/disk.json`, separated from its neighbor by a comma:

```json
{
  "name": "FIRST NOTE",
  "title": "MY FIRST SESSION LOG",
  "type": "SEQ",
  "path": "pages/first-note.txt"
}
```

Save and reload. Use `OPEN FIRST NOTE`, `SEARCH SESSION`, or F1. The manifest's paths are relative to `dist/`. The browser loads the manifest and then fetches each referenced file. Search checks file names, titles, and loaded text.

A `SEQ` entry is readable text. A `PRG` entry loads BASIC source. A `URL` entry can open an external HTTPS destination after a visitor's action. These are website conventions inspired by disk listings.

Pages are plain text, not Markdown. Do not copy your whole private vault into `dist/`. The separate Field0notes project handles selected Markdown notes. Connecting its output to this disk would be a future importer, not a feature already present.

**Exercise:** add a `.bas` file containing `10 PRINT "MY FIRST DISK PROGRAM"`, register it as a PRG with a unique name, and load/run it. **Done when:** both your note and program appear on the disk without editing the renderer.

## 5. Understand input and modes

A key's meaning depends on the current activity. Arrow Down selects a file in the menu; Left/Right turn pages in the reader. The command field also supports history. This is a small state machine.

| Mode | Meaning | Relevant state |
| --- | --- | --- |
| `menu` | Choose a disk file | `menuFiles`, `selected` |
| `page` | Read text or open a link | `active`, `pageLines`, `pageIndex` |
| `command` | Enter commands or numbered source | command field, history |
| `input` | Answer a running BASIC program | `inputResolve` |

Find `key`, `execute`, and the `command-form` submit listener. A form submission calls the same dispatcher as the keyboard shortcuts and visible buttons. The real HTML input gives you normal text editing and mobile keyboard support; the canvas supplies the computer display.

Trace `OPEN ABOUT` on paper: form → `execute` → `openFile` → `page` → `drawPage` → `render`. Trace `LOAD HELLO` separately: it loads editable program source and prints it, but RUN is a separate action.

To add a simple site command, insert this branch in `execute` after it has printed the command and before the final unknown-command response:

```js
if (upper === 'VERSION') {
  print('PUBLIC SPACE / MY FIRST MOD');
  ready();
  return;
}
```

This is a site command, not a new BASIC statement. Numbered `10 VERSION` would still be rejected by the interpreter.

**Done when:** VERSION works and you can explain why it belongs in `computer.js`.

## 6. Page wrapping, menus, and ordinary browser access

Read `wrap` and `drawPage`. The renderer cannot show an arbitrarily long document at once. `wrap` breaks paragraphs into lines of up to 38 characters, leaving room for page margins. `drawPage` shows 19 content lines plus headings and instructions. The next page starts at `pageIndex * 19`.

The menu uses groups of 11 entries. Its selected index is global, while `Math.floor(selected / 11) * 11` finds the first entry in the visible group. These two pagination systems are separate.

Canvas text is not ordinary selectable HTML. `render` also copies the rows into the readable `<pre>` element, and `showLinks` creates ordinary anchors. This preserves a useful alternative for reading and copying text. It is not a claim that all assistive-technology behavior has been comprehensively tested.

**Exercise:** give your note enough paragraphs for two pages. Confirm that blank lines survive, the reader can move in both directions, and the readable section follows the displayed page. Use a narrow browser window and try the visible command field.

## 7. A BASIC program is an ordered collection of lines

Now open `basic.js`. Its `Basic` class owns the language state and receives input/output functions from the screen code. It does not need a canvas itself.

`this.lines` is a JavaScript `Map`. Think of a Python dictionary from line number to source text:

```text
10 -> PRINT "HELLO"
30 -> END
```

`edit` extracts the number and source. Entering the same number replaces that line. Entering only a number deletes it. `list` sorts numerically and reconstructs readable source. `load` builds a replacement map and restores the old one if loading fails.

Why leave gaps such as 10, 20, 30? You can add line 15 without renumbering the rest. The interpreter sorts line numbers; entry order does not determine execution order.

In the site's BASIC workspace, try:

```basic
30 END
10 PRINT "FIRST"
20 PRINT "SECOND"
```

Run LIST, then RUN. Replace line 20. Delete line 30 by entering `30` alone.

**Done when:** you can predict LIST after any edit sequence. This is a useful first piece to reimplement in Python: store lines in a dict and list them with `sorted(lines)`.

## 8. Expressions: from text to meaning

The interpreter does not pass BASIC source to JavaScript `eval`. It recognizes a restricted grammar.

`tokenize` turns `2+3*4` into separate tokens: `2`, `+`, `3`, `*`, `4`. It recognizes numbers, quoted strings, identifiers, comparisons, punctuation, and arithmetic operators. Unknown input causes a syntax error.

`expression` then uses a precedence table. Multiplication binds more strongly than addition, so the result is 14 rather than 20. Parentheses override that ordering. Exponentiation is right-associative in this implementation: `2^3^2` means `2^(3^2)`.

Read `atom` first: it handles one basic value, a variable, unary sign, parentheses, or function call. Then read `parse(min)`: it keeps combining values while the next operator has sufficient precedence. This is a precedence-climbing parser.

| BASIC concept | JavaScript implementation | Python connection |
| --- | --- | --- |
| Variables | `Map` called `vars` | A dictionary |
| Number literal | `Number(token)` | `float(token)` |
| String literal | Strip surrounding quotes | String slicing |
| Operator priority | `precedence` object | Dictionary of priorities |
| Unsupported source | `BasicError` | Custom exception |
| `SIN(x)` | A named function in `functions` | A dispatch dictionary of callables |

Try `PRINT 2+3*4`, `PRINT (2+3)*4`, and `PRINT "HELLO "+"WORLD"`. Try `PRINT 1/0` and read the error. String and numeric variables have distinct types; a trailing `$` marks string variables.

**Exercise:** trace the tokens and expected evaluation order for `(8-2)/3`. Do not start by expanding the language; understanding the existing parser is already a substantial lesson.

## 9. Running a program: the program counter and stacks

`run` sorts the source lines and splits statements at colons outside quotes and parentheses. IF and REM need special handling because they own the remaining physical line. It creates a map from line numbers to statement positions.

`pc` is the program counter: the index of the next statement. Normal execution moves it forward. `GOTO` sets it to another location. `GOSUB` remembers a return position on a stack before jumping. `RETURN` retrieves that position.

Try:

```basic
10 PRINT "BEFORE"
20 GOSUB 100
30 PRINT "AFTER"
40 END
100 PRINT "INSIDE"
110 RETURN
```

Predict the output first. In your notebook, record `pc` and the return stack as execution proceeds. Line 40 prevents normal execution from falling into the subroutine a second time.

FOR/NEXT uses a separate loop stack. Each frame records the variable name, end value, step, and return position. NEXT increments the variable and either jumps back or removes the finished loop frame.

The runtime counts top-level statements and stops after its 20,000-step budget. Every 64 such steps it yields with a timer so browser events can be processed. This is cooperative scheduling: a long program must leave opportunities for RUN/STOP to take effect. It is not C64 CPU timing.

**Exercise:** write a loop that prints the first ten square numbers. Then try `10 GOTO 10` and stop it or observe the limit. See [BASIC.md](BASIC.md) for supported syntax and compatibility limits.

## 10. INPUT, virtual memory, and saved programs

INPUT crosses an asynchronous boundary. The interpreter asks its `io.input` callback for a value. The screen changes to `input` mode and returns a Promise. The next submitted answer resolves that Promise, allowing the interpreter to continue. `async`/`await` expresses this waiting without blocking the browser's entire interface.

Run:

```basic
10 INPUT "YOUR NAME";N$
20 PRINT "HELLO ";N$
```

Find `inputResolve` in `computer.js` and follow where it is created, called, and cleared. Notice that an answer to INPUT is handled before normal site-command parsing.

POKE is another callback. The interpreter validates the address/value and writes a `Uint8Array(65536)`. The screen adapter gives a few addresses visual effects:

```basic
POKE 53280,0
POKE 53281,0
POKE 646,1
PRINT "HELLO FROM A BLACK SCREEN"
```

Type RESTORE to return to the blue display. This memory array is not a complete emulated C64 bus: printing normal text does not synchronize screen memory, and most addresses have no hardware effect.

`SAVE NAME` serializes program source into browser `localStorage`. It is not a Git commit and does not edit the site's disk files. EXPORT downloads ordinary `.bas` text, not a tokenized Commodore binary.

**Exercise:** save a program, reload the page, and load it. Export a backup. A different origin—such as localhost versus GitHub Pages—has separate browser storage, so export before moving between hosts.

## 11. Verify changes and save experiments with Git

From the repository root:

```bash
npm test
npm run build
git diff --check
git diff
```

The tests exercise language behavior such as arithmetic, nested loops, jumps, inputs, errors, interruption, and sample programs. The build validates disk entries and generates the plain-text feed. Neither command proves that the layout looks right; open the site too.

A focused manual check after a change:

- [ ] Reload without a disk error.
- [ ] Open the new or changed page.
- [ ] Search a word from its text.
- [ ] Run a sample program and stop a loop.
- [ ] Check readable text and links.
- [ ] Check a narrow window if layout changed.

For a real change to the language, add a behavior test using the existing `machine()` helper in `tests/basic.test.mjs`. Assert an observable result, such as printed output or a useful error, rather than copying the parser's internal implementation.

For example, an existing-language test can be written as:

```js
test('prints a multiplication result', async () => {
  const { b, out } = machine();
  b.load('10 A=6\n20 PRINT A*7');
  await b.run();
  assert.deepEqual(out, ['42']);
});
```

When you like your changes, stage only the files you intended to change, inspect the staged diff, and commit. Push your experiment branch and open a pull request when ready to publish it. You do not need a separate branch for every typo, but branches make larger experiments easy to compare and set aside.

**Done when:** you can name what you changed, why it works, and which check supports that conclusion.

## 12. Publish to GitHub Pages or your own server

The application is static HTML, CSS, JavaScript, a font, JSON, and text. There is no application login, OpenAI API key, subscription check, or server-side BASIC process. A hosting service can independently protect its copy of these files; that protection is not embedded in the application.

For this repository's existing workflow:

1. Open the repository's **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **GitHub Actions**.
3. The workflow already exists; you do not need to add another template.
4. Open **Actions → Publish computer → Run workflow** and choose `main`, or push a subsequent change to main.
5. Wait for a successful deployment and use the URL shown by GitHub.

The expected project URL is `https://public-space.github.io/public-space/`, unless you configure another domain. A URL is not confirmed live merely because the code is on main. The workflow runs the tests and feed build, then uploads only `dist/`. Selecting branch-root publication would publish the wrong directory for this layout.

For your own static server, copy the contents of `dist/` into its dedicated document root. Keep paths relative; `fetch('disk.json')` works beneath the GitHub project path, whereas `fetch('/disk.json')` would request the domain root. [WEBSITE.md](WEBSITE.md) has more hosting details.

The generated feed in `dist/feed/` is also public content. Rebuilding removes obsolete generated text copies, but your upload process must also remove stale files from the destination. A retro client could read that feed; a shared BBS or live chat would need a separate service. See [RETRO-CLIENTS.md](RETRO-CLIENTS.md).

**Done when:** a visitor can load the published page, open a file, and run HELLO. Use a fresh browser session when checking public access.

## A small final project

Make a three-file personal disk: one session note, one project description, and one original BASIC program. Add one new site command. Keep each change in a readable commit and write a short explanation of how an input becomes a screen update.

Possible later projects, one at a time:

- A read-only exporter from selected public Markdown notes to disk text.
- A better line editor with a deliberate save-before-replace flow.
- Sound implemented with browser audio, clearly separate from SID emulation.
- A Python terminal client for the text feed.
- A real C64 terminal bridge after the read-only feed works.

## Further reading

- [MDN Canvas tutorial](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial)
- [MDN JavaScript guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide)
- [MDN Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map)
- [MDN Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
- [MDN async functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function)
- [MDN localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- [GitHub Pages publishing sources](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

These are optional references. The main reading is the code you can run and change in this repository.

# Public Space BASIC

This is an educational BASIC subset written for this website. It is not a drop-in Commodore BASIC V2 implementation. Source files are text; there is no tokenized binary program loader.

## First program

Type or paste these lines into the command field:

```basic
10 FOR I=1 TO 5
20 PRINT "HELLO ";I
30 NEXT I
```

Type RUN. Type LIST to see the source. Enter `10 FOR I=1 TO 10` to replace line 10; enter `20` alone to delete line 20. NEW clears the workspace. SAVE MYPROGRAM saves it on this browser; LOAD MYPROGRAM loads it; EXPORT downloads it.

## Implemented language

| Feature | Example |
| --- | --- |
| Numeric variables | `A=12` or `LET A=12` |
| String variables | `NAME$="DONOVAN"` |
| Arithmetic | `PRINT (2+3)*4`, `PRINT 2^3` |
| Comparison | `IF A>=10 THEN 100` |
| Bitwise AND/OR/NOT | `PRINT 3 AND 1` |
| Print strings/numbers | `PRINT "COUNT: ";A` |
| Print separators | Semicolon joins; comma advances to a 10-character zone |
| Counted loops | `FOR I=10 TO 1 STEP -1` / `NEXT I` |
| Conditional commands | `IF A=1 THEN PRINT "YES":GOTO 100` |
| Jumps and subroutines | `GOTO 100`, `GOSUB 200`, `RETURN` |
| Input | `INPUT "YOUR NAME";N$` |
| Comments/end | `REM A COMMENT`, `END`, `STOP` |
| Clear screen | `CLS` or `PRINT CHR$(147)` |
| Virtual registers | `POKE 53280,0`, `PRINT PEEK(53280)` |
| Functions | `INT`, `ABS`, `SIN`, `COS`, `SQR`, `RND`, `LEN`, `CHR$`, `STR$`, `VAL`, `PEEK` |

Names are case-insensitive. Strings retain their values but the screen displays uppercase. Variables ending `$` hold strings; others hold numbers. Comparisons return -1 for true and 0 for false. PRINT does not exactly reproduce Commodore numeric padding. RND's argument is accepted but the function always returns a new browser random value; it does not implement Commodore's negative/zero argument seed behavior.

Numbered programs reset variables on RUN. Immediate PRINT, assignments, and POKE use the current variables. Colons separate statements outside quotes. IF and REM own the remainder of their physical program line. An IF's colon-separated tail runs only if its condition is true. Each FOR should have a matching NEXT; supported loops are properly nested. There is no NEXT I,J shorthand.

INPUT waits for the visible command field and supports one variable. Numeric input must be a finite number; invalid input reports an error rather than automatically reprompting. Escape or RUN/STOP cancels a running program, including INPUT. The browser yields periodically during execution, and a 20,000-statement budget stops infinite loops.

Limits: 500 stored lines, line numbers 0–63999, up to 240 source characters per line, 100 nested FOR or GOSUB frames, and bounded expression token counts. These are website limits, not original C64 memory limits. Numbers use JavaScript floating-point arithmetic.

## The virtual memory effects

- 53280: border color, palette index modulo 16.
- 53281: background color, palette index modulo 16.
- 646: color for subsequently written text.
- 1024–2023: basic screen-code character writes to the 1,000 cells, including reverse flag. Only basic character mapping is provided, not the complete PETSCII graphics set.
- 55296–56295: cell colors.

Other POKE addresses are stored in a 64 KiB array without hardware effects. PEEK reads that array; it is not a coherent emulated bus, and normal text printing does not update it. Keyboard scanning, SID registers, raster interrupts, sprites, ROM calls, and SYS are not implemented.

## Not implemented

Arrays/DIM, DATA/READ, DEF FN, GET, file I/O inside BASIC, WAIT, ON GOTO, full PETSCII controls, binary PRG/D64/TAP loading, sound, hardware timing, and most Commodore abbreviations. IF, INPUT, FOR, and GOTO are intended for numbered programs rather than immediate mode. No ELSE. Unsupported statements report an error; use the real-emulator links to run original software.

## Small exercises

1. Open HELLO, change line 30, and run it again.
2. Write a multiplication table using nested FOR loops.
3. Open GUESS and add a tries counter.
4. Open COLORS and try palette values 0–15.
5. Save a program, reload the browser, LOAD it, then EXPORT a backup.

# Could real DOS or C64 software connect to this?

Yes. The useful design is to share content, not make the old machine understand a modern web page. The browser runs HTML/JavaScript; a retro client reads text or speaks a terminal protocol to a bridge. Both can draw from the same published files.

## What this repo already provides

`node build.mjs` generates `dist/feed/index.txt`, `dist/feed/catalog.json`, and one plain-text file per disk item. The text uses ASCII and CRLF line endings. A simple client can fetch an index and then a selected file. This is a **read-only, build-time snapshot**: updates appear after rebuilding and deploying. It is not a live chat server, BBS, WebSocket endpoint, or PLATO server.

These generated files also include source for the sample BASIC programs, but the website's interpreter is not guaranteed to match every behavior of real Commodore BASIC. Review and adapt a program before moving it to hardware.

## DOS: the smallest useful next project

A DOS client can use an emulated or physical network card, an appropriate packet driver, and a TCP/IP stack such as mTCP. The mTCP suite includes HTGet and Telnet. A menu program could download an index, let you choose an item, download that text, and display it.

The original 16-bit environment is not a modern HTTPS browser. Plan for a plain HTTP endpoint on your own network, or a modern proxy that handles HTTPS upstream. A private hosted preview also requires modern authentication, so it is not a direct DOS endpoint. A publicly hosted text feed or a LAN copy is the practical starting point.

**First milestone:** serve `dist/feed/` over HTTP on a local Linux machine, fetch `index.txt` from DOS, and display it. No accounts, posting, or terminal server required. Test on a LAN before designing an Internet-facing service.

## C64: a serial terminal and a bridge

A C64 can use a suitable serial/Wi-Fi modem and terminal software. ZiModem exposes Hayes-style AT commands and provides serial-to-network connections, including Telnet mode. The machine would connect to a server that sends a 40-column menu and text in the right character encoding.

A future Python bridge could:

1. Read the same catalog and text files used by the website.
2. Accept connections from a terminal client.
3. Implement LIST, OPEN, SEARCH, and NEXT.
4. Wrap text for 40 columns and convert ASCII to appropriate PETSCII.
5. Add per-connection session state and sensible connection limits.

That bridge needs a process on your own server and a TCP port. A static GitHub Pages site cannot accept those terminal connections. No such listener has been deployed in this project. Telnet's option negotiation and PETSCII conversion are real implementation work, not just replacing an HTTPS URL with a port number.

**First milestone:** connect from an emulator/terminal to a local bridge and read one file. Later, test the actual hardware and modem combination. A custom C64 BASIC or C client is possible, but using an existing terminal first separates networking problems from client-code problems.

## PLATO is a separate possibility

You remembered correctly: PLATO services and clients exist for retro computers. IRATA.ONLINE documents PLATOTERM for the C64 and MS-DOS, among other systems. PLATO has its own terminal protocol and server environment. This C64-looking website is not automatically a PLATO application.

If you want that route, first explore IRATA/PLATOTERM, then decide whether the project should be a PLATO lesson/application or a simpler read-only BBS-style content service. For your own notebook, a text feed is the smaller first step.

## Possible architecture later

- **Browser:** C64-style web interface → published disk/feed files.
- **DOS:** network stack + reader → HTTP feed or LAN proxy.
- **C64:** terminal + Wi-Fi modem → TCP bridge → the same feed.
- **Future shared activity:** a separate service with persistent data and a protocol suitable for each client.

“Live” could mean fetching the newest published note, or it could mean shared chat and simultaneous activity. The first needs only fresh content requests; the second needs a running backend. Keeping those separate will keep the project manageable.

## Primary references

- [FreeDOS networking documentation: mTCP](https://help.fdos.org/en/hhstndrd/network/mtcp.htm)
- [FreeDOS mTCP package listing, including HTGet](https://www.ibiblio.org/pub/micro/pc-stuff/freedos/files/repositories/unstable/pkg-html/mtcp.html)
- [ZiModem source and documentation](https://github.com/bozimmerman/Zimodem)
- [IRATA.ONLINE and its platform-specific PLATOTERM clients](https://www.irata.online/)
- [C64 BASIC in an actual browser emulator](https://stigc.dk/c64/basic/)
- [Apple ][js](https://www.scullinsteel.com/apple2/)
- [js-dos](https://js-dos.com/)

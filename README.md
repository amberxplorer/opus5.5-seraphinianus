# Codicillus Seraphinianus

A ninety-second audiovisual homage to Luigi Serafini's *Codex Seraphinianus* (1981), made for Amber.

A closed book lies on a desk at night. It opens, and for a minute and a half it writes, draws and sings itself through the chapters of an encyclopedia of an imagined world: plants that walk away, a fish that swims out of its own description, a clockwork scribe, two lovers who become an alligator, an alphabet sung one note at a time, a goose game that plays itself, a lagoon city at dusk. At the end the writing lifts off the page, the book closes, and for a moment the unreadable script gathers into the only legible words in the piece.

*Codicillus* is Latin for a little codex, and also the word for a postscript added to a will.

## Opening it

Everything is static files. Serve the folder and open `index.html`:

```sh
npx http-server . -p 8080
# then visit http://localhost:8080
```

Opening `index.html` straight from disk also works in most browsers. Sound starts when you press **Open the book**. Headphones help. While the book waits on the landing screen, the eye of the gilt seraph on its cover follows your pointer.

| Key | Action |
| --- | --- |
| Space or K | Pause and resume |
| M | Mute |
| F | Full screen |
| R | Start again |
| ← → | Step back or forward five seconds |

The thin line along the bottom of the screen is a timeline: click or drag it to wander through the book. The **About the Codex** panel lists the chapters and jumps to any of them.

## How it is made

Nothing in the piece is taken from the Codex. There are no images, no fonts for the script, and no audio recordings. Every drawing and every sound is generated in code, live, each time the book opens.

- **The script** (`js/core/asemic.js`) is an invented, asemic alphabet: twenty-four looping, knotted letters drawn as single pen strokes, six capitals, diacritics and word-final tails. Words come from a lexicon sampled with Zipf frequencies, so short words recur the way they do in a real language. None of it means anything.
- **The page numbers** count in base 21, after the numbering system in the Codex that Allan C. Wechsler and Ivan Derzhanski worked out.
- **Ink, pencil and watercolour** (`js/core/ink.js`) are strokes with pressure and taper, hatching, coloured-pencil shading in two passes, and washes with pale centres, darker rims and granulated pigment. Marks are baked into each page as they finish, so only the pen's current stroke is redrawn each frame.
- **The paper, the walnut desk, the book cloth and the gilt** are procedural textures (`js/core/paper.js`). The marbled endpapers use mathematical marbling: every pixel is traced back through the combs and ink drops to the drop it came from.
- **The book** (`js/core/book.js`, `js/core/show.js`) is rendered in 2D with a perspective camera. Page turns are curling sheets drawn as lit, perspective-projected strips. At each new chapter a few leaves riffle past before the page settles, and the chapter's number and title are written in once it lands. Drawings that come alive are "ink sprites" that peel off the page as paper cut-outs and cast shadows under the lamp.
- **The score** (`js/audio/`) is synthesized with the Web Audio API: an FM celesta, a Karplus–Strong harp, a choir of formant filters, a glass flute, a reed, bass, marimba, clockwork ticks, timpani and bells, plus foley for page turns, the pen nib, ink drops, bubbles, dice and an alligator's gulps. It is in D at 96 beats a minute in 12/8, thirty-six bars, four to a chapter. The harmony moves through the flat sixth and flat seventh before coming home. Picture and sound share one clock, so letters, gear ticks and pawn hops land on the beat.

### The chapters

| Time | Chapter | What happens |
| --- | --- | --- |
| 0:00 | Overture | The gilt cover, the marbled endpaper and a six-winged seraph on the title page |
| 0:10 | I · Flora | An eye-flower grows, pulls up its roots and walks off the page; a sapling is trained into a chair |
| 0:20 | II · Fauna | A fish swims out of its own description, and the words follow it |
| 0:30 | IV–V · Physics & Machines | A pendulum draws in red ink; a rainbow sags; a clockwork scribe on threads writes |
| 0:40 | VI · Humankind | Lovers under a blanket become an alligator, which eats the facing page |
| 0:50 | VIII · Writing | The alphabet, one note per letter; a caterpillar writes a spiral and hatches a moth |
| 1:00 | IX–X · Food, Garments & Games | A goose game plays itself; spaghetti made of handwriting; a coat with six sleeves |
| 1:10 | XI · Architecture | A lagoon city rises and dusk falls |
| 1:20 | Coda | The words fly off, the book closes, the title appears |

## About the Codex

The *Codex Seraphinianus* is an illustrated encyclopedia of an imaginary world, written in an invented script. Luigi Serafini, an Italian artist and architect born in Rome in 1949, made it between 1976 and 1978, and Franco Maria Ricci published it in Milan in 1981. In 2009, speaking at the Oxford University Society of Bibliophiles, Serafini said the script has no meaning; he wanted readers to feel what children feel in front of books they cannot yet understand. More: [Codex Seraphinianus on Wikipedia](https://en.wikipedia.org/wiki/Codex_Seraphinianus).

## Files

```
index.html            the page
css/style.css         the interface
js/core/              utilities, ink, paper, script, book, drawing kit, director
js/scenes/            one file per chapter, in running order
js/audio/             the synthesizers and the score
js/ui.js, js/main.js  interface and render loop
tools/                development helpers (headless screenshots, offline audio render, profiling)
```

The `tools/` scripts expect Playwright and a local server on port 8123, for example `npx http-server . -p 8123`. `node tools/frames.mjs out 1600 900 "10,20,30"` renders moments of the piece; `node tools/render-audio.mjs score.wav` renders the whole score offline.

## Credits

Made by Claude, for Amber, 2026. With gratitude to Luigi Serafini, whose book has been making readers feel like children in front of a page since 1981.

// Every world's theme, hand-composed for the chiptune engine in Audio.js.
//
// Notation (written in C major / A minor, then moved by `key` semitones):
//   mel     bars separated by '|'. Each token is one 8th note:
//             C5   a note (C4 is middle C)      -   hold the previous note
//             .    rest                         C5+D5  two 16ths in one 8th
//   chords  one chord per bar ("Am7", "F", "G7", "Caug"...); "Am,G" splits
//           a bar in two halves
//   lead    wave: p12 / p25 / p50 (pulse duty), tri, saw, sine
//           vib: vibrato depth in semitones, gate: note length 0..1,
//           echo: send to the dotted-8th echo
//   harm    arp (fast chord arpeggio), stab (off-beat chord hits),
//           echo (lead copied 3 sixteenths late, NES style), third (a
//           harmony under the lead), pad (slow sustained chord), waltz
//   bass    octave, drive, drive16, walk, gallop, root, waltz
//   drums   rock, four, break, half, shuffle, march, sparse, taiko, waltz
//   beats   4 (default) or 3 for a waltz
//   order   which parts play, in order, then loop

export const SONGS = {
  // bright, bouncy, the first taste of colour
  forest: {
    bpm: 150, key: -5, order: 'AABB',
    lead: { wave: 'p25', vol: 0.12, vib: 0.2, echo: true },
    harm: { mode: 'arp', wave: 'p12', vol: 0.045 },
    bass: { mode: 'octave', vol: 0.3 },
    drums: 'rock',
    parts: {
      A: {
        chords: 'C G Am F C G F G',
        mel: `E5 . G5 . C6 - B5 A5 | G5 - D5 - B4 . D5 . | C5 . E5 . A5 - G5 E5 | F5 - - . A5 . G5 F5 |
              E5 . G5 . C6 - D6 E6 | D6 - B5 . G5 . A5 B5 | C6 . A5 . F5 . A5 C6 | B5 - - - G5 A5 B5 .`,
      },
      B: {
        chords: 'F G Em Am F G C C',
        mel: `A5 . A5 C6 . A5 G5 F5 | G5 . G5 B5 . G5 F5 E5 | E5 . G5 . B5 - A5 G5 | A5 - - - . . E5 G5 |
              A5 . A5 C6 . F6 E6 D6 | D6 . B5 . G5 . D6 . | C6 - - - G5 . E5 . | C5+E5 G5+C6 . . . . . .`,
      },
    },
  },

  // driving, phrygian, all fire
  volcano: {
    bpm: 168, key: -5, order: 'AABB',
    lead: { wave: 'p12', vol: 0.12, vib: 0.15, echo: true },
    harm: { mode: 'echo', wave: 'p25', vol: 0.05 },
    bass: { mode: 'drive16', vol: 0.28 },
    drums: 'break',
    parts: {
      A: {
        chords: 'Am Am Bb Am Am Am G Bb',
        mel: `A4 . A4 C5 . A4 E5 . | D5 C5 A4 . G4 A4 . . | Bb4 . Bb4 D5 . Bb4 F5 . | E5 - - . D5 C5 B4 A4 |
              A5 . A5 G5 . E5 G5 . | A5 . C6 B5 A5 G5 E5 . | G5 - F5 - E5 - D5 - | Bb5 - A5 - G5 - E5 F5`,
      },
      B: {
        chords: 'Dm Dm Am Am F G Am E',
        mel: `D5 - F5 - A5 - D6 - | C6 - A5 - F5 - D5 - | E5 - A5 - C6 - E6 - | D6 C6 B5 A5 G5 E5 C5 B4 |
              A4 C5 F5 A5 C6 - A5 - | B4 D5 G5 B5 D6 - B5 - | C6 - B5 - A5 - C6 - | B5 - - - G#5 - E5 -`,
      },
    },
  },

  // floaty lydian lullaby
  moon: {
    bpm: 112, key: 2, order: 'AB',
    lead: { wave: 'tri', vol: 0.2, vib: 0.3, echo: true },
    harm: { mode: 'arp', wave: 'p50', vol: 0.03, slow: true },
    bass: { mode: 'root', vol: 0.26 },
    drums: 'sparse',
    parts: {
      A: {
        chords: 'C D C D Em D C D',
        mel: `E5 - - - G5 - F#5 - | A5 - - - - - D5 - | E5 - - - G5 - B5 - | A5 - - - - - . . |
              B5 - - - A5 - G5 - | F#5 - - - D5 - E5 F#5 | G5 - - - E5 - C5 - | D5 - - - - - - -`,
      },
      B: {
        chords: 'Am Bm C D Am Bm Em D',
        mel: `C6 - B5 - A5 - E5 - | D5 - F#5 - B5 - A5 - | G5 - E5 - C5 - G5 - | F#5 - A5 - D6 - - - |
              E6 - D6 - C6 - A5 - | B5 - F#5 - D5 - F#5 - | G5 - B5 - E6 - D6 - | A5 - - - - - - -`,
      },
    },
  },

  // chunky square-wave stomp
  blocky: {
    bpm: 140, key: 5, order: 'AABB',
    lead: { wave: 'p50', vol: 0.1, gate: 0.7 },
    harm: { mode: 'stab', wave: 'p25', vol: 0.04 },
    bass: { mode: 'octave', vol: 0.3 },
    drums: 'four',
    parts: {
      A: {
        chords: 'C Am F G C Am Dm G',
        mel: `C5 . C5 . E5 . G5 . | A5 . G5 . E5 . C5 . | D5 . D5 . F5 . A5 . | G5 - - . E5 . D5 . |
              C5 . C5 . E5 . G5 . | C6 . A5 . G5 . E5 . | F5 . E5 . D5 . F5 . | G5 - - - . . . .`,
      },
      B: {
        chords: 'F G Em Am F G C C',
        mel: `A5 A5 . A5 . G5 A5 . | B5 B5 . B5 . A5 G5 . | G5 . E5 . B4 . E5 . | A5 - - . C6 . A5 . |
              F5 . A5 . C6 . A5 . | D6 . B5 . G5 . B5 . | C6 . G5 . E5 . G5 . | C6 - - - . . . .`,
      },
    },
  },

  // swaying dorian, a little swing
  reef: {
    bpm: 112, key: 0, swing: 0.18, order: 'AB',
    lead: { wave: 'sine', vol: 0.2, vib: 0.35, echo: true },
    harm: { mode: 'arp', wave: 'tri', vol: 0.07, slow: true },
    bass: { mode: 'walk', vol: 0.28 },
    drums: 'half',
    parts: {
      A: {
        chords: 'Am7 D Am7 D Em G D Am',
        mel: `E5 - - . A5 - G5 - | F#5 - D5 - - - . . | E5 - G5 - A5 - C6 - | B5 - A5 - F#5 - - - |
              G5 - E5 - B4 - E5 - | G5 - - - B5 - A5 G5 | F#5 - A5 - D6 - C6 - | A5 - - - - - - -`,
      },
      B: {
        chords: 'C G D Am C G D E',
        mel: `E6 - D6 - C6 - G5 - | B5 - - - D6 - B5 - | A5 - F#5 - D5 - A5 - | E5 - - - - - . . |
              G5 - C6 - E6 - D6 - | D6 - B5 - G5 - B5 - | A5 - D6 - F#5 - A5 - | G#5 - - - B5 - - -`,
      },
    },
  },

  // dark, sparkly, echoing off the walls
  cave: {
    bpm: 126, key: 4, order: 'AABB',
    lead: { wave: 'p12', vol: 0.11, vib: 0.25, echo: true },
    harm: { mode: 'arp', wave: 'p25', vol: 0.035, fast: true },
    bass: { mode: 'drive', vol: 0.28 },
    drums: 'half',
    parts: {
      A: {
        chords: 'Am F Dm E Am F Dm E',
        mel: `A4 - C5 - E5 - A5 - | G5 - F5 - - - C5 - | D5 - F5 - A5 - G#5 - | B5 - - - G#5 - E5 - |
              A5 - B5 - C6 - E6 - | D6 - C6 - A5 - F5 - | F5 - E5 - D5 - F5 - | E5 - - - - - - -`,
      },
      B: {
        chords: 'F G Em Am F G E E',
        mel: `C6 . C6 . A5 . F5 . | D6 . D6 . B5 . G5 . | B5 . G5 . E5 . B5 . | C6 - - - A5 - - - |
              A5 . C6 . F6 . E6 . | D6 . B5 . G5 . D6 . | E6 - D6 - C6 - B5 - | G#5 - - - E5 - - -`,
      },
    },
  },

  // supermarket muzak with a jazzy shuffle
  store: {
    bpm: 120, key: -2, swing: 0.3, order: 'AB',
    lead: { wave: 'p50', vol: 0.08, vib: 0.2, gate: 0.8 },
    harm: { mode: 'stab', wave: 'tri', vol: 0.09 },
    bass: { mode: 'walk', vol: 0.3 },
    drums: 'shuffle',
    parts: {
      A: {
        chords: 'Cmaj7 Am7 Dm7 G7 Cmaj7 Am7 Dm7 G7',
        mel: `E5 . G5 . B5 - A5 G5 | A5 - - - E5 . . . | F5 . A5 . C6 - B5 A5 | G5 - - - D5 . . . |
              E5 . G5 . B5 - D6 C6 | C6 - A5 . E5 . G5 . | F5 . E5 . D5 . F5 . | B4 - - - . . . .`,
      },
      B: {
        chords: 'Fmaj7 Em7 Dm7 Cmaj7 Fmaj7 Em7 Dm7 G7',
        mel: `A5 - C6 - E6 - D6 C6 | B5 - - - G5 . . . | A5 - F5 - D5 - F5 - | E5 - - - G5 . . . |
              A5 - C6 - E6 - F6 E6 | D6 - B5 - G5 - E5 - | F5 . A5 . C6 . A5 . | G5 - - - B5 - D6 -`,
      },
    },
  },

  // hyper bubblegum
  candy: {
    bpm: 176, key: 2, order: 'AABB',
    lead: { wave: 'p25', vol: 0.11, vib: 0.2 },
    harm: { mode: 'arp', wave: 'p12', vol: 0.04, fast: true },
    bass: { mode: 'octave', vol: 0.3 },
    drums: 'four',
    parts: {
      A: {
        chords: 'C G Am F C G F G',
        mel: `C6 C6 G5 C6 E6 . D6 C6 | D6 . B5 G5 D6 . B5 . | C6 C6 A5 C6 E6 . D6 C6 | A5 - - - F5 . G5 A5 |
              C6 C6 G5 C6 E6 . G6 E6 | D6 . G6 . D6 . B5 . | C6+D6 C6 A5 F5 C6 . A5 . | B5+C6 B5 G5 . D6 . . .`,
      },
      B: {
        chords: 'F C G Am F C G G',
        mel: `A5 . C6 . F6 . E6 D6 | C6 . G5 . E5 . G5 . | B5 . D6 . G6 . F6 E6 | E6 - C6 - A5 - - - |
              A5 . C6 . F6 . A6 G6 | G6 . E6 . C6 . E6 . | D6 . G6 . D6 . B5 . | D6+E6 D6 C6 B5 A5 B5 C6 D6`,
      },
    },
  },

  // galloping adventure on the slopes
  tundra: {
    bpm: 156, key: 3, order: 'AABB',
    lead: { wave: 'tri', vol: 0.2, vib: 0.2, echo: true },
    harm: { mode: 'echo', wave: 'p12', vol: 0.05 },
    bass: { mode: 'gallop', vol: 0.3 },
    drums: 'rock',
    parts: {
      A: {
        chords: 'C Em F G Am Em F G',
        mel: `G5 . C6 . E6 - D6 C6 | B5 - - - G5 - E5 - | A5 . C6 . F6 - E6 D6 | D6 - - - B5 - G5 - |
              A5 . B5 . C6 - E6 - | B5 . A5 . G5 - E5 - | F5 . G5 . A5 . C6 . | D6 - - - - - . .`,
      },
      B: {
        chords: 'F G C Am F G Am G',
        mel: `C6 - A5 - F5 - A5 C6 | D6 - B5 - G5 - B5 D6 | E6 - C6 - G5 - C6 E6 | E6 - - - D6 - C6 - |
              A5 - C6 - F6 - E6 - | D6 - B5 - G6 - F6 - | E6 - D6 - C6 - A5 - | B5 - - - D6 - - -`,
      },
    },
  },

  // outrun synthwave
  neon: {
    bpm: 118, key: -3, order: 'AABB',
    lead: { wave: 'saw', vol: 0.07, vib: 0.3, echo: true },
    harm: { mode: 'pad', wave: 'p50', vol: 0.025 },
    bass: { mode: 'drive16', vol: 0.3 },
    drums: 'four',
    parts: {
      A: {
        chords: 'Am F C G Am F G E',
        mel: `A5 - - - C6 - B5 - | A5 - - - E5 - - - | G5 - - - E5 - G5 - | B5 - - - D6 - - - |
              C6 - B5 - A5 - E6 - | D6 - C6 - A5 - - - | B5 - C6 - D6 - E6 - | G#5 - - - - - - -`,
      },
      B: {
        chords: 'F G Am Am F G E E',
        mel: `A5 . A5 . C6 . F6 . | G6 . F6 . E6 . D6 . | E6 - - - C6 - A5 - | B5 - C6 - B5 - A5 - |
              A5 . A5 . C6 . F6 . | G6 . F6 . G6 . B6 . | G#6 - - - E6 - - - | B5 - - - G#5 - - -`,
      },
    },
  },

  // heroic, a boss fight among the stars
  space: {
    bpm: 160, key: -1, order: 'AABB',
    lead: { wave: 'p25', vol: 0.11, vib: 0.25, echo: true },
    harm: { mode: 'arp', wave: 'p12', vol: 0.04, fast: true },
    bass: { mode: 'octave', vol: 0.3 },
    drums: 'break',
    parts: {
      A: {
        chords: 'Am F C G Am F G G',
        mel: `E5 - A5 - B5 - C6 - | C6 - - - A5 - F5 - | G5 - - - E5 - C6 - | B5 - - - G5 - D5 - |
              E5 - A5 - B5 - C6 - | F6 - - - E6 - C6 - | D6 - - - C6 - B5 - | B5 - - - - - . .`,
      },
      B: {
        chords: 'F G Em Am F G C E',
        mel: `A5 . C6 . F6 - E6 - | D6 . B5 . G5 - D6 - | B5 . G5 . E6 - D6 - | C6 - - - A5 - - - |
              A5 . C6 . F6 - A6 - | G6 . D6 . B5 - G6 - | G6 - - - E6 - C6 - | G#5 - - - B5 - E6 -`,
      },
    },
  },

  // noir spy riff, walking bass, rain on the window
  city: {
    bpm: 132, key: 5, swing: 0.16, order: 'AABB',
    lead: { wave: 'p12', vol: 0.11, vib: 0.3, echo: true },
    harm: { mode: 'stab', wave: 'p25', vol: 0.035 },
    bass: { mode: 'walk', vol: 0.32 },
    drums: 'shuffle',
    parts: {
      A: {
        chords: 'Am Am Dm E Am Am F E',
        mel: `A4 . C5 . D5 D#5 E5 . | G5 . E5 . D5 . C5 . | D5 . F5 . A5 . G#5 . | B5 - - - G#5 . E5 . |
              A4 . C5 . D5 D#5 E5 . | A5 . G5 . E5 . C5 . | F5 . E5 . D#5 . E5 . | E5 - - - . . . .`,
      },
      B: {
        chords: 'Dm Am Dm E F C Dm E',
        mel: `F5 - - . D5 . A5 . | E5 - - . C5 . A4 . | F5 . G5 . A5 . D6 . | C6 - B5 - G#5 - E5 - |
              A5 - - . F5 . C6 . | G5 - - . E5 . C5 . | D5 . F5 . A5 . C6 . | B5 - - - G#5 - - -`,
      },
    },
  },

  // wobbly whole-tone weirdness
  alien: {
    bpm: 138, key: 1, order: 'AABB',
    lead: { wave: 'p25', vol: 0.1, vib: 0.6, echo: true },
    harm: { mode: 'arp', wave: 'p12', vol: 0.04, fast: true },
    bass: { mode: 'octave', vol: 0.3 },
    drums: 'break',
    parts: {
      A: {
        chords: 'C D Bb C Ab Bb C D',
        mel: `C5 D5 E5 F#5 G#5 - - - | A5 - F#5 - D5 - . . | D5 F5 Bb5 - A5 - F5 - | G5 - - - E5 - C5 - |
              Eb5 - C5 - Ab5 - G5 - | F5 - D5 - Bb5 - A5 - | G5 . E5 . C6 . B5 . | A5 - F#5 - D6 - - -`,
      },
      B: {
        chords: 'Fm C Fm C Ab Bb C C',
        mel: `Ab5 - G5 - F5 - C5 - | E5 - G5 - C6 - - - | Ab5 - C6 - F6 - Eb6 - | E6 - - - G5 - - - |
              C6 . Ab5 . Eb5 . Ab5 . | D6 . Bb5 . F5 . Bb5 . | C6 D6 E6 F#6 G6 - - - | G6 - E6 - C6 - - -`,
      },
    },
  },

  // a spooky waltz in 3/4
  haunted: {
    bpm: 150, key: 5, beats: 3, order: 'AABB',
    lead: { wave: 'p25', vol: 0.1, vib: 0.45, echo: true },
    harm: { mode: 'waltz', wave: 'p12', vol: 0.045 },
    bass: { mode: 'waltz', vol: 0.32 },
    drums: 'waltz',
    parts: {
      A: {
        chords: 'Am Am Dm E Am F E Am',
        mel: `E5 - - A5 - C6 | B5 - A5 G#5 - A5 | F5 - - D6 - C6 | B5 - - G#5 - - |
              E5 - - A5 - C6 | D6 - C6 A5 - F5 | E5 - - G#5 - B5 | A5 - - - - -`,
      },
      B: {
        chords: 'F C Dm E F C E E',
        mel: `A5 - C6 F6 - E6 | E6 - D6 C6 - G5 | F5 - A5 D6 - C6 | B5 - - - - - |
              A5 - C6 F6 - A6 | G6 - E6 C6 - E6 | D6 - C6 B5 - G#5 | B5 - - E5 - -`,
      },
    },
  },

  // soaring over the clouds
  sky: {
    bpm: 144, key: -3, order: 'AABB',
    lead: { wave: 'p50', vol: 0.09, vib: 0.3, echo: true },
    harm: { mode: 'third', wave: 'p25', vol: 0.045 },
    bass: { mode: 'octave', vol: 0.3 },
    drums: 'march',
    parts: {
      A: {
        chords: 'C F C G Am Em F G',
        mel: `G5 - - - C6 - D6 - | E6 - - - D6 C6 A5 - | G5 - - - E6 - D6 - | D6 - - - B5 - G5 - |
              A5 - - - C6 - E6 - | G6 - - - E6 - B5 - | C6 - A5 - F5 - A5 - | B5 - - - - - . .`,
      },
      B: {
        chords: 'F G Em Am Dm G C C',
        mel: `A5 . A5 . C6 . F6 . | D6 . B5 . G5 . D6 . | E6 - D6 - B5 - G5 - | A5 - - - E6 - - - |
              F6 - E6 - D6 - A5 - | B5 - D6 - G6 - F6 - | E6 - - - D6 - C6 - | C6 - - - - - - -`,
      },
    },
  },

  // plucky pentatonic, taiko drums
  dojo: {
    bpm: 152, key: 2, order: 'AABB',
    lead: { wave: 'p12', vol: 0.12, vib: 0.15, gate: 0.55, echo: true },
    harm: { mode: 'echo', wave: 'p25', vol: 0.045 },
    bass: { mode: 'drive', vol: 0.3 },
    drums: 'taiko',
    parts: {
      A: {
        chords: 'Am Am Dm Am F G Am E',
        mel: `A5 . E5 . A5 Bb5 A5 . | E5 . D5 . E5 - - . | D5 . F5 . A5 . Bb5 . | A5 - - . E5 . D5 . |
              A5 . C6 . D6 . E6 . | D6 . C6 . A5 . E5 . | F5 . E5 . D5 . E5 . | E5 - - - . . . .`,
      },
      B: {
        chords: 'Dm Dm Am Am Bb Bb E E',
        mel: `D6 . F6 . E6 . D6 . | A5 - - - F5 . A5 . | E6 . C6 . A5 . E5 . | A5 - - - . . E5 F5 |
              Bb5 . D6 . F6 . E6 . | D6 . Bb5 . F5 . D5 . | E5 . G#5 . B5 . D6 . | E6 - - - - - - -`,
      },
    },
  },

  // a wind-up music box march
  toybox: {
    bpm: 132, key: 0, order: 'AABB',
    lead: { wave: 'tri', vol: 0.2, gate: 0.6, oct: -1 },
    harm: { mode: 'arp', wave: 'p12', vol: 0.035 },
    bass: { mode: 'octave', vol: 0.28 },
    drums: 'march',
    parts: {
      A: {
        chords: 'C G7 C G7 F C G7 C',
        mel: `C6 . E6 . G6 . E6 . | F6 . D6 . B5 . G5 . | C6 . E6 . G6 . C7 . | B6 - - . G6 . . . |
              A6 . F6 . C6 . A5 . | G6 . E6 . C6 . G5 . | F6 . D6 . B5 . D6 . | C6 - - - . . . .`,
      },
      B: {
        chords: 'Am Em F C Dm G C G',
        mel: `E6 . E6 . A6 . E6 . | G6 . E6 . B5 . E6 . | F6 . F6 . A6 . F6 . | E6 - - . C6 . . . |
              D6 . F6 . A6 . F6 . | G6 . D6 . B5 . D6 . | E6 . G6 . C7 . G6 . | D6 - - - G5 . . .`,
      },
    },
  },

  // surf rock in the sun
  lagoon: {
    bpm: 168, key: 2, order: 'AABB',
    lead: { wave: 'p50', vol: 0.1, vib: 0.3, echo: true },
    harm: { mode: 'stab', wave: 'p25', vol: 0.04 },
    bass: { mode: 'gallop', vol: 0.3 },
    drums: 'rock',
    parts: {
      A: {
        chords: 'C C F G C Am F G',
        mel: `E5 . G5 . A5 . G5 E5 | C5 - - . E5 . G5 . | A5 . C6 . A5 . F5 . | G5 - - - D5 . . . |
              E5 . G5 . C6 . B5 A5 | A5 - E5 - C5 - E5 - | F5 . A5 . C6 . A5 . | B5 - - - G5 . . .`,
      },
      B: {
        chords: 'F G Em Am F G C C',
        mel: `A5 - A5 . C6 . A5 . | B5 - B5 . D6 . B5 . | G5 . E5 . B5 - G5 . | A5 - - - . . . . |
              A5 . C6 . F6 - E6 D6 | D6 . B5 . G5 . D6 . | E6 - - - C6 - G5 - | C6 - - - . . . .`,
      },
    },
  },
};

// Drum patterns, one character per 16th: x hit, o open hat.
export const DRUMS = {
  rock: { k: 'x.......x.x.....', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.' },
  four: { k: 'x...x...x...x...', s: '....x.......x...', h: '..x...x...x...x.' },
  break: { k: 'x.....x...x.....', s: '....x.......x..x', h: 'x.xxx.x.x.xxx.x.' },
  half: { k: 'x.........x.....', s: '........x.......', h: 'x...x...x...x...' },
  shuffle: { k: 'x.....x.x.......', s: '....x.......x...', h: 'x.x.x.x.x.x.x.xo' },
  march: { k: 'x.......x.......', s: '....x..x....x.xx', h: 'x...x...x...x...' },
  sparse: { k: 'x...............', s: '', h: '........x.......' },
  taiko: { k: 'x..x..x.x.....x.', s: '....x.......x...', h: 'x...x...x...x...' },
  waltz: { k: 'x...........', s: '....x...x...', h: '..x...x...x.' },
};

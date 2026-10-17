# Audio credits

Web copies of the two owner-supplied recordings in `audio-source/` (originals kept unchanged there).
Each sound is served in three encodings; the browser downloads only the first it can play
(Opus, then AAC, then MP3).

| File | Source file | Processing | Size |
|---|---|---|---|
| `background-sound.opus` | `audio-source/Background Sound.opus` | byte-for-byte copy (Ogg Opus, 48 kHz) | 1,702,943 B |
| `background-sound.m4a` | `audio-source/Background Sound.aac` | raw ADTS AAC-LC rewrapped into MP4, no re-encoding | 2,046,673 B |
| `background-sound.mp3` | `audio-source/Background Sound.WAV` | MP3 (LAME VBR q2, 44.1 kHz) | 2,399,763 B |
| `clicking-sound.opus` | `audio-source/clicking-sound.opus` | byte-for-byte copy (Ogg Opus, 48 kHz) | 22,006 B |
| `clicking-sound.m4a` | `audio-source/clicking-sound.aac` | rewrapped into MP4, no re-encoding | 22,785 B |
| `clicking-sound.mp3` | `audio-source/clicking-sound.mp3` | byte-for-byte copy | 53,978 B |

The ambience loops over the recording's steady body (12 s to 119 s) with a 6 s equal-power splice
computed in memory at playback (src/lib/audio/loop.ts); the files themselves are not edited.

## Origin (as identified from the owner's earlier selection)

- **CD_PLENITUDE_006_EXP01.wav** by kevp888 (Kevin Luce), https://freesound.org/people/kevp888/sounds/623034/, licensed CC BY-NC 4.0 (https://creativecommons.org/licenses/by-nc/4.0/). The supplied WAV matches it in duration (2:06.44), format and size.
- **UIBeep_Futuristic Interface Interacting Response 1_EM** by newlocknew, https://freesound.org/people/newlocknew/sounds/865623/, licensed CC BY-NC 4.0. The supplied click is a 1.28 s edit (the published file is 2.53 s); its origin is as stated by the owner, not verified from the file.

CC BY-NC 4.0 requires visible attribution and non-commercial use; the raw files must not be redistributed as standalone assets.

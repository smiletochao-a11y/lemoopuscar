// timeline.js → voice/lines.json (TTS + ASR) and timeline.json (for mix.py, cues)
import fs from 'fs'; import path from 'path'; import { fileURLToPath, pathToFileURL } from 'url';
const D = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const { LINES, SHOTS, HIT, DUR, BPM } = await import(pathToFileURL(path.join(D, 'timeline.js')));
fs.mkdirSync(path.join(D, 'voice'), { recursive: true });
const strip = s => s.replace(/[“”]/g, '');
fs.writeFileSync(path.join(D, 'voice/lines.json'), JSON.stringify(LINES.map(l => ({ id: l.id, text: strip(l.zh), say: l.say ? strip(l.say) : undefined, context: l.ctx, rate: l.rate || 0 })), null, 1));
fs.writeFileSync(path.join(D, 'timeline.json'), JSON.stringify({ DUR, BPM, SHOTS, HIT, LINES: LINES.map(l => ({ id: l.id, t: l.at, zh: l.zh })) }, null, 1));
console.log(LINES.length, 'lines');

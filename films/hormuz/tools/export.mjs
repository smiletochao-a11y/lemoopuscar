// timeline.js -> voice/lines.json (TTS + speech check) and timeline.json (score, mixer)
import fs from 'fs'; import path from 'path'; import { pathToFileURL } from 'url';
const D = process.argv[2];
const T = await import(pathToFileURL(path.join(D, 'timeline.js')).href);
fs.mkdirSync(path.join(D, 'voice'), { recursive: true });
fs.writeFileSync(path.join(D, 'voice/lines.json'), JSON.stringify(T.LINES.map(l => ({ id: l.id, text: l.zh, say: l.say, voice: 'zh-CN-YunyangNeural', rate: '-6%', ...(l.asr ? { asr: l.asr } : {}) })), null, 1));
fs.writeFileSync(path.join(D, 'timeline.json'), JSON.stringify({ BPM: T.BPM, BEAT: T.BEAT, BAR: T.BAR, DUR: T.DUR, SEC: T.SEC, HIT: T.HIT, LINES: T.LINES }, null, 1));
console.log('exported', T.LINES.length, 'lines');

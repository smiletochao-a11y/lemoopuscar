// Shot list: each start anchored to the timeline (timeline.js); in = entrance transition
import * as s1 from './s1_windows.js';
import * as s3 from './s3_grid.js';
import * as s5 from './s5_atoms.js';
import * as s6 from './s6_layers.js';
import * as s7 from './s7_number.js';
import * as s8 from './s8_out.js';
import * as s9 from './s9_end.js';
export function SHOTS(C, HIT, DUR) {
  return [
    { id: 'S1', start: 0, build: s1.build },                                                   // two windows; curtain closes at the end
    { id: 'S3', start: HIT.mosaic1 + .6, build: s3.build },                                     // the curtain opens on the grid
    { id: 'S5', start: HIT.atoms - .4, in: { type: 'dissolve', dur: .8 }, build: s5.build },
    { id: 'S6', start: HIT.zoom - .2, in: { type: 'dissolve', dur: .8 }, build: s6.build },
    { id: 'S7', start: HIT.number - .3, in: { type: 'dissolve', dur: .8 }, build: s7.build },
    { id: 'S8', start: HIT.drop1 - .3, in: { type: 'dissolve', dur: .6 }, build: s8.build },
    { id: 'S9', start: HIT.flood - .6, build: s9.build },                                       // from black: a cut no one sees
  ];
}

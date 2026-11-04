import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import {
  initial,
  readState,
  saveState,
  parseBackup,
  renderPrompt,
  defaultTemplate,
  localDate,
  type State,
} from './model';
describe('local studio workflow', () => {
  it('persists a character with references, prompt history, and calendar entries in IndexedDB', async () => {
    const s: State = structuredClone(initial);
    s.characters.push({
      id: 'alex',
      name: 'Alex',
      role: 'Creator',
      bio: 'A traveler',
      identity: 'Brown eyes, short curls',
      personality: 'Thoughtful',
      color: '#a4b1a2',
      references: [
        {
          id: 'face',
          name: 'face.png',
          kind: 'Face',
          data: 'data:image/png;base64,aGVsbG8=',
          prompt: '',
        },
      ],
    });
    const text = renderPrompt(defaultTemplate, {
      name: 'Alex',
      identity: s.characters[0].identity,
      personality: 'Thoughtful',
      outfit: 'Linen suit',
      location: 'Courtyard',
      lighting: 'Golden hour',
      pose: 'Walking',
      details: '85mm lens',
    });
    expect(text).toContain('Brown eyes, short curls');
    expect(text).toContain('Linen suit');
    expect(text).not.toContain('{{');
    s.history.push({
      id: 'prompt',
      text,
      date: new Date().toISOString(),
      character: 'Alex',
    });
    s.calendar.push({
      id: 'post',
      date: '2026-11-05',
      title: 'Portrait',
      platform: 'Instagram',
      character: 'Alex',
    });
    await saveState(s);
    expect(await readState()).toEqual(s);
    expect(parseBackup(JSON.stringify(await readState()))).toEqual(s);
  });
  it('rejects incompatible or malformed backups before replacing any local data', () => {
    for (const value of [
      {},
      { ...initial, version: 2 },
      { ...initial, characters: [{ name: 'Missing fields' }] },
      { ...initial, history: [{}] },
      { ...initial, presets: {} },
    ])
      expect(() => parseBackup(JSON.stringify(value))).toThrow();
  });
  it('rejects unsafe reference URLs and duplicate character IDs', () => {
    const c = {
      id: 'one',
      name: 'Test',
      role: '',
      bio: '',
      identity: '',
      personality: '',
      color: '#fff',
      references: [],
    };
    expect(() =>
      parseBackup(JSON.stringify({ ...initial, characters: [c, c] })),
    ).toThrow();
    expect(() =>
      parseBackup(
        JSON.stringify({
          ...initial,
          characters: [
            {
              ...c,
              references: [
                {
                  id: 'a',
                  name: 'x',
                  kind: 'Face',
                  data: 'https://example.com/x.png',
                  prompt: '',
                },
              ],
            },
          ],
        }),
      ),
    ).toThrow();
  });
  it('leaves unknown template variables editable and preserves literal user text', () => {
    expect(renderPrompt('{{name}} / {{unknown}}', { name: '$& Alex' })).toBe(
      '$& Alex / {{unknown}}',
    );
  });
});

describe('backup validation regressions', () => {
  it('rejects unknown preset categories that would crash the preset screen', () => {
    expect(() =>
      parseBackup(
        JSON.stringify({
          ...initial,
          presets: { ...initial.presets, Broken: 123 },
        }),
      ),
    ).toThrow(/preset/);
    expect(() =>
      parseBackup(
        JSON.stringify({
          ...initial,
          presets: { ...initial.presets, Outfit: ['Duplicate', 'Duplicate'] },
        }),
      ),
    ).toThrow(/preset/);
  });
  it('rejects null records, invalid calendar dates, and duplicate history IDs', () => {
    expect(() =>
      parseBackup(JSON.stringify({ ...initial, characters: [null] })),
    ).toThrow(/character/);
    const entry = {
      id: 'one',
      date: '2026-02-30',
      title: 'Portrait',
      platform: 'Instagram',
      character: '',
    };
    expect(() =>
      parseBackup(JSON.stringify({ ...initial, calendar: [entry] })),
    ).toThrow(/calendar/);
    const history = {
      id: 'one',
      date: '2026-11-04T00:00:00Z',
      text: 'Portrait',
      character: '',
    };
    expect(() =>
      parseBackup(JSON.stringify({ ...initial, history: [history, history] })),
    ).toThrow(/duplicate/);
  });
  it('rejects external CSS image URLs in character colors', () => {
    const character = {
      id: 'one',
      name: 'Test',
      role: '',
      bio: '',
      identity: '',
      personality: '',
      color: 'url(https://example.com/tracker)',
      references: [],
    };
    expect(() =>
      parseBackup(JSON.stringify({ ...initial, characters: [character] })),
    ).toThrow(/character/);
  });
  it('does not substitute inherited object properties in templates', () => {
    expect(renderPrompt('{{toString}} {{name}}', { name: 'Alex' })).toBe(
      '{{toString}} Alex',
    );
  });
});

describe('calendar date formatting', () => {
  it('uses local calendar fields in a locale-independent input format', () => {
    expect(localDate(new Date(2026, 0, 5, 0, 30))).toBe('2026-01-05');
    expect(localDate(new Date(2026, 10, 14, 23, 30))).toBe('2026-11-14');
  });
});

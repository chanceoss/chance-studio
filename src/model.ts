import { openDB } from 'idb';
export type Reference = {
  id: string;
  name: string;
  kind: 'Face' | 'Body' | 'Gallery';
  data: string;
  prompt: string;
};
export type Character = {
  id: string;
  name: string;
  role: string;
  bio: string;
  identity: string;
  personality: string;
  color: string;
  references: Reference[];
};
export type Entry = {
  id: string;
  date: string;
  title: string;
  platform: string;
  character: string;
};
export type State = {
  version: 1;
  template?: string;
  characters: Character[];
  history: { id: string; text: string; date: string; character: string }[];
  calendar: Entry[];
  presets: Record<string, string[]>;
};
export const initial: State = {
  version: 1,
  characters: [],
  history: [],
  calendar: [],
  presets: {
    Outfit: [
      'Ivory linen suit',
      'Black silk evening dress',
      'Relaxed denim and white tee',
    ],
    Location: [
      'Sunlit architectural courtyard',
      'Minimalist studio, warm gray backdrop',
      'Rainy city street at blue hour',
    ],
    Lighting: [
      'Soft window light, gentle falloff',
      'Golden hour, warm rim light',
      'Dramatic Rembrandt lighting',
    ],
    Pose: [
      'Candid over-the-shoulder glance',
      'Seated, relaxed hands, direct gaze',
      'Walking naturally, mid-stride',
    ],
  },
};
const db = () =>
  openDB('character-studio', 1, {
    upgrade(db) {
      db.createObjectStore('studio');
    },
  });
export async function readState(): Promise<State> {
  return (
    (await (await db()).get('studio', 'state')) ?? structuredClone(initial)
  );
}
export async function saveState(state: State) {
  await (await db()).put('studio', state, 'state');
}
const categories = ['Outfit', 'Location', 'Lighting', 'Pose'] as const;
const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const string = (value: unknown): value is string => typeof value === 'string';
const id = (value: unknown): value is string =>
  string(value) && value.trim().length > 0;
const uniqueIds = (items: { id: string }[]) =>
  new Set(items.map((item) => item.id)).size === items.length;
const validDate = (value: unknown): value is string => {
  if (!string(value) || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + 'T12:00:00Z');
  return (
    !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value
  );
};
export function localDate(date = new Date()): string {
  return [
    String(date.getFullYear()).padStart(4, '0'),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}
export function parseBackup(text: string): State {
  const s: unknown = JSON.parse(text);
  if (
    !record(s) ||
    s.version !== 1 ||
    (s.template !== undefined && !string(s.template)) ||
    !Array.isArray(s.characters) ||
    !Array.isArray(s.history) ||
    !Array.isArray(s.calendar) ||
    !record(s.presets)
  ) {
    throw Error('This is not a supported Character Studio backup.');
  }
  const presets = s.presets;
  if (
    Object.keys(presets).length !== categories.length ||
    !categories.every(
      (category) =>
        Object.hasOwn(presets, category) &&
        Array.isArray(presets[category]) &&
        presets[category].every(
          (value) => string(value) && value.trim().length > 0,
        ) &&
        new Set(presets[category]).size === presets[category].length,
    )
  ) {
    throw Error('Backup contains invalid preset categories or values.');
  }
  for (const character of s.characters) {
    if (
      !record(character) ||
      !id(character.id) ||
      !string(character.name) ||
      !character.name.trim() ||
      ![
        character.role,
        character.bio,
        character.identity,
        character.personality,
      ].every(string) ||
      !string(character.color) ||
      !/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(character.color) ||
      !Array.isArray(character.references)
    ) {
      throw Error('Backup contains an invalid character.');
    }
    for (const reference of character.references) {
      if (
        !record(reference) ||
        !id(reference.id) ||
        !string(reference.name) ||
        !string(reference.prompt) ||
        !['Face', 'Body', 'Gallery'].includes(String(reference.kind)) ||
        !string(reference.data) ||
        !/^data:image\/(png|jpeg|webp|gif);base64,(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(
          reference.data,
        ) ||
        reference.data.endsWith(',')
      ) {
        throw Error('Backup contains an invalid image reference.');
      }
    }
    if (!uniqueIds(character.references))
      throw Error('Backup contains duplicate image IDs.');
  }
  if (
    !s.history.every(
      (h) =>
        record(h) &&
        id(h.id) &&
        [h.text, h.character].every(string) &&
        string(h.date) &&
        /^\d{4}-\d{2}-\d{2}T/.test(h.date) &&
        Number.isFinite(Date.parse(h.date)),
    ) ||
    !s.calendar.every(
      (e) =>
        record(e) &&
        id(e.id) &&
        string(e.title) &&
        e.title.trim() &&
        [e.platform, e.character].every(string) &&
        validDate(e.date),
    )
  ) {
    throw Error('Backup contains invalid history or calendar entries.');
  }
  if (![s.characters, s.history, s.calendar].every(uniqueIds))
    throw Error('Backup contains duplicate record IDs.');
  // Copy only supported fields; unknown top-level data never enters application state.
  return {
    version: 1,
    ...(string(s.template) ? { template: s.template } : {}),
    characters: s.characters as Character[],
    history: s.history as State['history'],
    calendar: s.calendar as Entry[],
    presets: Object.fromEntries(
      categories.map((category) => [category, presets[category]]),
    ) as State['presets'],
  };
}
export const defaultTemplate = `Create a photorealistic editorial photograph of {{name}}.\n\nIDENTITY LOCK\n{{identity}}\nPreserve the exact facial structure, proportions, skin tone, and distinguishing features from the attached face and body references. Keep the same person; do not beautify or alter their identity.\n\nART DIRECTION\nOutfit: {{outfit}}\nLocation: {{location}}\nLighting: {{lighting}}\nPose: {{pose}}\nMood and personality: {{personality}}\n\n{{details}}\nNatural skin texture, believable anatomy, refined editorial composition. No text, watermarks, or extra fingers.`;
export function renderPrompt(template: string, values: Record<string, string>) {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) =>
    Object.hasOwn(values, key) ? values[key] : match,
  );
}

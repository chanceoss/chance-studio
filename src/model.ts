import { openDB } from 'idb';
export type Reference = { id: string; name: string; kind: 'Face' | 'Body' | 'Gallery'; data: string; prompt: string };
export type Character = { id: string; name: string; role: string; bio: string; identity: string; personality: string; color: string; references: Reference[] };
export type Entry = { id: string; date: string; title: string; platform: string; character: string };
export type State = { version: 1; template?: string; characters: Character[]; history: {id: string; text: string; date: string; character: string}[]; calendar: Entry[]; presets: Record<string,string[]> };
export const initial: State = { version: 1, characters: [], history: [], calendar: [], presets: { Outfit: ['Ivory linen suit', 'Black silk evening dress', 'Relaxed denim and white tee'], Location: ['Sunlit architectural courtyard', 'Minimalist studio, warm gray backdrop', 'Rainy city street at blue hour'], Lighting: ['Soft window light, gentle falloff', 'Golden hour, warm rim light', 'Dramatic Rembrandt lighting'], Pose: ['Candid over-the-shoulder glance', 'Seated, relaxed hands, direct gaze', 'Walking naturally, mid-stride'] } };
const db = () => openDB('character-studio', 1, { upgrade(db) { db.createObjectStore('studio'); } });
export async function readState(): Promise<State> { return (await (await db()).get('studio', 'state')) ?? structuredClone(initial); }
export async function saveState(state: State) { await (await db()).put('studio', state, 'state'); }
export function parseBackup(text: string): State {
 const s = JSON.parse(text);
 const strings = (v: unknown) => Array.isArray(v) && v.every(x => typeof x === 'string');
 const str = (v: unknown) => typeof v === 'string';
 if ((s?.template !== undefined && typeof s.template !== 'string') || s?.version !== 1 || !Array.isArray(s.characters) || !Array.isArray(s.history) || !Array.isArray(s.calendar) || !s.presets || !['Outfit','Location','Lighting','Pose'].every(k=>strings(s.presets[k]))) throw Error('This is not a supported Character Studio backup.');
 if (!s.characters.every((c: Character)=>[c.id,c.name,c.role,c.bio,c.identity,c.personality,c.color].every(str) && Array.isArray(c.references) && c.references.every(r=>[r.id,r.name,r.kind,r.data,r.prompt].every(str) && ['Face','Body','Gallery'].includes(r.kind) && /^data:image\/(png|jpeg|webp|gif);base64,/.test(r.data)))) throw Error('Backup contains invalid characters or images.');
 if (!s.history.every((h: State['history'][number])=>[h.id,h.text,h.date,h.character].every(str)) || !s.calendar.every((e: Entry)=>[e.id,e.date,e.title,e.platform,e.character].every(str))) throw Error('Backup contains invalid history or calendar entries.');
 if (new Set(s.characters.map((c: Character)=>c.id)).size !== s.characters.length) throw Error('Duplicate character IDs in backup.');
 return s;
}
export const defaultTemplate = `Create a photorealistic editorial photograph of {{name}}.\n\nIDENTITY LOCK\n{{identity}}\nPreserve the exact facial structure, proportions, skin tone, and distinguishing features from the attached face and body references. Keep the same person; do not beautify or alter their identity.\n\nART DIRECTION\nOutfit: {{outfit}}\nLocation: {{location}}\nLighting: {{lighting}}\nPose: {{pose}}\nMood and personality: {{personality}}\n\n{{details}}\nNatural skin texture, believable anatomy, refined editorial composition. No text, watermarks, or extra fingers.`;
export function renderPrompt(template: string, values: Record<string,string>) { return template.replace(/\{\{(\w+)\}\}/g, (match,key)=> values[key] ?? match); }

import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { initial, readState, saveState, parseBackup, renderPrompt, defaultTemplate, type State } from './model';
describe('local studio workflow',()=>{
 it('persists a character with references, prompt history, and calendar entries in IndexedDB',async()=>{
 const s:State=structuredClone(initial);
 s.characters.push({id:'alex',name:'Alex',role:'Creator',bio:'A traveler',identity:'Brown eyes, short curls',personality:'Thoughtful',color:'#a4b1a2',references:[{id:'face',name:'face.png',kind:'Face',data:'data:image/png;base64,aGVsbG8=',prompt:''}]});
 const text=renderPrompt(defaultTemplate,{name:'Alex',identity:s.characters[0].identity,personality:'Thoughtful',outfit:'Linen suit',location:'Courtyard',lighting:'Golden hour',pose:'Walking',details:'85mm lens'});
 expect(text).toContain('Brown eyes, short curls');expect(text).toContain('Linen suit');expect(text).not.toContain('{{');
 s.history.push({id:'prompt',text,date:new Date().toISOString(),character:'Alex'});
 s.calendar.push({id:'post',date:'2026-11-05',title:'Portrait',platform:'Instagram',character:'Alex'});
 await saveState(s);expect(await readState()).toEqual(s);
 expect(parseBackup(JSON.stringify(await readState()))).toEqual(s);
 });
 it('rejects incompatible or malformed backups before replacing any local data',()=>{
 for(const value of [{}, {...initial,version:2}, {...initial,characters:[{name:'Missing fields'}]}, {...initial,history:[{}]}, {...initial,presets:{}}]) expect(()=>parseBackup(JSON.stringify(value))).toThrow();
 });
 it('rejects unsafe reference URLs and duplicate character IDs',()=>{
 const c={id:'one',name:'Test',role:'',bio:'',identity:'',personality:'',color:'#fff',references:[]};
 expect(()=>parseBackup(JSON.stringify({...initial,characters:[c,c]}))).toThrow();
 expect(()=>parseBackup(JSON.stringify({...initial,characters:[{...c,references:[{id:'a',name:'x',kind:'Face',data:'https://example.com/x.png',prompt:''}]}]}))).toThrow();
 });
 it('leaves unknown template variables editable and preserves literal user text',()=>{
 expect(renderPrompt('{{name}} / {{unknown}}',{name:'$& Alex'})).toBe('$& Alex / {{unknown}}');
 });
});

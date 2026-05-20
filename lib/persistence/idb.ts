import { openDB, type IDBPDatabase } from "idb";

const DB_NAME = "code-davidloor";
const DB_VERSION = 1;
const CODE_STORE = "code";
const NOTES_STORE = "notes";
const PROGRESS_STORE = "progress";

let dbPromise: Promise<IDBPDatabase> | null = null;
function db() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(d) {
        if (!d.objectStoreNames.contains(CODE_STORE)) d.createObjectStore(CODE_STORE);
        if (!d.objectStoreNames.contains(NOTES_STORE)) d.createObjectStore(NOTES_STORE);
        if (!d.objectStoreNames.contains(PROGRESS_STORE)) d.createObjectStore(PROGRESS_STORE);
      },
    });
  }
  return dbPromise;
}
const codeKey = (id: string, lang: "python" | "javascript") => `${id}:${lang}`;

export async function saveCode(id: string, lang: "python" | "javascript", code: string) {
  (await db()).put(CODE_STORE, code, codeKey(id, lang));
}
export async function loadCode(id: string, lang: "python" | "javascript"): Promise<string | undefined> {
  return (await db()).get(CODE_STORE, codeKey(id, lang));
}
export async function saveNotes(id: string, notes: string) { (await db()).put(NOTES_STORE, notes, id); }
export async function loadNotes(id: string): Promise<string | undefined> { return (await db()).get(NOTES_STORE, id); }
export async function markComplete(id: string) { (await db()).put(PROGRESS_STORE, { completed: true, at: Date.now() }, id); }
export async function isComplete(id: string): Promise<boolean> {
  const v = await (await db()).get(PROGRESS_STORE, id);
  return !!(v && v.completed);
}

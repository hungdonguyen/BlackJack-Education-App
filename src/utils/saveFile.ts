// ============================================
// Tauri File Save System
// Saves player data to OS AppData directory
// Save:    AppConfig/save.json    (bankroll, claims)
// History: AppConfig/history.json (max 10,000 rounds)
// ============================================

import type { MatchRecord } from '@/types/game';

const SAVE_FILE = 'save.json';
const HISTORY_FILE = 'history.json';
const MAX_HISTORY = 10_000;

/** True when running inside Tauri desktop app */
export function isTauriEnv(): boolean {
    return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

/** Lazily import Tauri FS to avoid crashes in Next.js SSR / browser dev */
async function getFs() {
    const mod = await import('@tauri-apps/plugin-fs');
    return mod;
}

async function ensureDir() {
    const { mkdir, exists, BaseDirectory } = await getFs();
    try {
        const ok = await exists('.', { baseDir: BaseDirectory.AppConfig });
        if (!ok) {
            await mkdir('.', { baseDir: BaseDirectory.AppConfig, recursive: true });
        }
    } catch {
        // Directory may already exist — ignore
    }
}

// ─── Save File (Zustand persist storage) ───────────────────────────────

export async function readSaveFile(): Promise<string | null> {
    if (!isTauriEnv()) return null;
    try {
        const { readTextFile, exists, BaseDirectory } = await getFs();
        const ok = await exists(SAVE_FILE, { baseDir: BaseDirectory.AppConfig });
        if (!ok) return null;
        return await readTextFile(SAVE_FILE, { baseDir: BaseDirectory.AppConfig });
    } catch (err) {
        console.warn('[SaveFile] readSaveFile failed:', err);
        return null;
    }
}

export async function writeSaveFile(content: string): Promise<void> {
    if (!isTauriEnv()) return;
    try {
        const { writeTextFile, BaseDirectory } = await getFs();
        await ensureDir();
        await writeTextFile(SAVE_FILE, content, { baseDir: BaseDirectory.AppConfig });
    } catch (err) {
        console.warn('[SaveFile] writeSaveFile failed:', err);
    }
}



// ─── History File ───────────────────────────────────────────────────────

export async function loadHistory(): Promise<MatchRecord[]> {
    if (!isTauriEnv()) return [];
    try {
        const { readTextFile, exists, BaseDirectory } = await getFs();
        const ok = await exists(HISTORY_FILE, { baseDir: BaseDirectory.AppConfig });
        if (!ok) return [];
        const content = await readTextFile(HISTORY_FILE, { baseDir: BaseDirectory.AppConfig });
        return JSON.parse(content) as MatchRecord[];
    } catch (err) {
        console.warn('[SaveFile] loadHistory failed:', err);
        return [];
    }
}

export async function writeHistoryFile(records: MatchRecord[]): Promise<void> {
    if (!isTauriEnv()) return;
    try {
        const { writeTextFile, BaseDirectory } = await getFs();
        await ensureDir();
        // Trim oldest entries if over the limit
        const trimmed = records.length > MAX_HISTORY
            ? records.slice(records.length - MAX_HISTORY)
            : records;
        await writeTextFile(HISTORY_FILE, JSON.stringify(trimmed), { baseDir: BaseDirectory.AppConfig });
    } catch (err) {
        console.warn('[SaveFile] writeHistoryFile failed:', err);
    }
}

export async function deleteHistory(): Promise<void> {
    if (!isTauriEnv()) return;
    try {
        const { remove, exists, BaseDirectory } = await getFs();
        const ok = await exists(HISTORY_FILE, { baseDir: BaseDirectory.AppConfig });
        if (ok) await remove(HISTORY_FILE, { baseDir: BaseDirectory.AppConfig });
    } catch { /* ignore */ }
}

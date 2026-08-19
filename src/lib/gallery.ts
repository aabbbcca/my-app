import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directory, File, Paths } from 'expo-file-system';

import { base64ToBytes } from './base64';
import type { Backend, GalleryItem } from './types';

const INDEX_KEY = 'bgone.gallery.v1';

function dir(): Directory {
  const directory = new Directory(Paths.document, 'cutouts');
  if (!directory.exists) directory.create({ intermediates: true, idempotent: true });
  return directory;
}

/**
 * Absolute URI for a saved cutout.
 *
 * Built on demand rather than stored: on iOS the app container path changes between
 * installs and updates, so a persisted absolute URI goes stale while the file name
 * stays valid.
 */
export function uriFor(item: GalleryItem): string {
  return new File(dir(), item.fileName).uri;
}

async function readIndex(): Promise<GalleryItem[]> {
  try {
    const raw = await AsyncStorage.getItem(INDEX_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as GalleryItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeIndex(items: GalleryItem[]): Promise<void> {
  await AsyncStorage.setItem(INDEX_KEY, JSON.stringify(items));
}

/** Newest first, with any rows whose file went missing pruned from the index. */
export async function listCutouts(): Promise<GalleryItem[]> {
  const items = await readIndex();
  const directory = dir();

  const alive = items.filter((item) => new File(directory, item.fileName).exists);
  if (alive.length !== items.length) {
    console.warn(
      `[bgone] gallery index had ${items.length} rows but only ${alive.length} files exist; pruning`
    );
    await writeIndex(alive);
  }
  console.log(`[bgone] gallery list: ${alive.length} item(s) in ${directory.uri}`);

  return alive.sort((a, b) => b.createdAt - a.createdAt);
}

export async function saveCutout(
  pngBase64: string,
  meta: { width: number; height: number; inferenceMs: number; backend: Backend }
): Promise<GalleryItem> {
  const directory = dir();
  const id = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  const fileName = `cutout-${id}.png`;

  const file = new File(directory, fileName);
  file.create({ overwrite: true, intermediates: true });
  // Bytes, not base64-with-options — see base64ToBytes for why.
  file.write(base64ToBytes(pngBase64));

  const item: GalleryItem = {
    id,
    fileName,
    createdAt: Date.now(),
    width: meta.width,
    height: meta.height,
    inferenceMs: meta.inferenceMs,
    backend: meta.backend,
  };

  const items = await readIndex();
  await writeIndex([item, ...items]);

  console.log(`[bgone] gallery save: ${fileName} (${file.size} bytes), index now ${items.length + 1}`);

  return item;
}

export async function deleteCutout(id: string): Promise<void> {
  const items = await readIndex();
  const target = items.find((item) => item.id === id);

  if (target) {
    const file = new File(dir(), target.fileName);
    if (file.exists) {
      try {
        file.delete();
      } catch (e) {
        console.warn('[bgone] could not delete a cutout file', e);
      }
    }
  }

  await writeIndex(items.filter((item) => item.id !== id));
}

const STORAGE_KEY = 'talent-villages';

export interface SavedVillage {
  villageId: string;
  villageName: string;
  description: string;
  leadName: string;
  createdAt: string;
}

export function getSavedVillages(): SavedVillage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveVillage(village: SavedVillage): void {
  const villages = getSavedVillages();
  const existing = villages.findIndex((v) => v.villageId === village.villageId);
  const updated =
    existing >= 0
      ? villages.map((v, i) => (i === existing ? village : v))
      : [village, ...villages];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated.slice(0, 20)));
}

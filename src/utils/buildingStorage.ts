import { SavedBuilding, BuildingDraft, BuildingTypeKey, RoofItem, StorageTankItem } from '../types';
import { normalizeRoofs, normalizeTanks, getBuildingWaterSummary } from './calculations';

const STORAGE_KEY = 'rainwise_saved_buildings_v2';
const DRAFT_STORAGE_KEY = 'rainwise_building_draft_v2';
const LEGACY_STORAGE_KEY = 'rainwise_saved_buildings';

/**
 * Migrates any raw building object to the current SavedBuilding schema (v2)
 * Ensures older buildings without buildingType get 'custom' with 'Not specified'
 */
export function migrateBuilding(raw: any): SavedBuilding {
  const id = raw.id || `bldg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const name = (raw.name || raw.nickname || 'Untitled Building').trim();
  
  // Migrate buildingType: if missing, set to 'custom' with 'Not specified'
  let buildingTypeKey: BuildingTypeKey = 'custom';
  let customTypeName = raw.customTypeName || undefined;

  if (raw.buildingTypeKey) {
    buildingTypeKey = raw.buildingTypeKey;
  } else if (raw.buildingType) {
    buildingTypeKey = raw.buildingType;
  } else {
    buildingTypeKey = 'custom';
    customTypeName = customTypeName || 'Not specified';
  }

  // Normalize roofs
  const roofs: RoofItem[] = normalizeRoofs(raw.roofs, raw.directRoofArea, raw.roofType);

  // Normalize tanks
  const { tanks, noTankYet } = normalizeTanks(raw.tanks, raw.tankCapacity, raw.noTankYet);

  // Normalize location
  const location = raw.location || (raw.locationLabel ? {
    name: raw.locationLabel,
    latitude: raw.latitude,
    longitude: raw.longitude,
  } : undefined);

  // People & demand
  const people = typeof raw.people === 'number' ? raw.people : (parseInt(raw.householdSize, 10) || 4);
  const householdDailyLPerPerson = typeof raw.householdDailyLPerPerson === 'number' ? raw.householdDailyLPerPerson : 40;

  const now = new Date().toISOString();
  const createdAt = raw.createdAt || now;
  const updatedAt = raw.updatedAt || now;

  return {
    id,
    name,
    buildingTypeKey,
    customTypeName,
    location,
    roofs,
    tanks,
    noTankYet,
    people,
    householdDailyLPerPerson,
    createdAt,
    updatedAt,
    version: 2,
    // legacy mirrors
    nickname: name,
    locationLabel: location?.name,
  };
}

/**
 * Scans saved buildings and silently fixes any bad zero snapshots or missing rainfall fields
 */
export function sanitizeAndMigrateBuildings(buildings: SavedBuilding[]): SavedBuilding[] {
  let hasUpdated = false;

  const sanitized = buildings.map((building) => {
    const roofs = normalizeRoofs(building.roofs, building.directRoofArea, building.roofType);
    const totalRoofArea = roofs.reduce((acc, r) => acc + (parseFloat(r.area) || 0), 0);

    if (totalRoofArea <= 0) return building;

    const snapshot = building.summarySnapshot?.summary;
    const isSnapshotBad =
      !snapshot ||
      (snapshot.year.kept + snapshot.year.wasted === 0 && snapshot.week.kept + snapshot.week.wasted === 0) ||
      (snapshot.year.rainOnRoof === 0 && Boolean(building.location?.name));

    if (isSnapshotBad) {
      const freshSummary = getBuildingWaterSummary(building, 'metric');
      if (freshSummary.year.rainOnRoof > 0 || freshSummary.year.kept + freshSummary.year.wasted > 0) {
        hasUpdated = true;
        return {
          ...building,
          monthlyRainfallMm: building.monthlyRainfallMm || freshSummary.monthlyBreakdown?.map((m) => m.rainfallMm),
          weeklyRainfallMm: building.weeklyRainfallMm || freshSummary.week.rainfallMm,
          rainfallFetchedAt: building.rainfallFetchedAt || new Date().toISOString(),
          summarySnapshot: {
            calculatedAt: new Date().toISOString(),
            summary: freshSummary,
          },
        };
      }
    }
    return building;
  });

  if (hasUpdated) {
    persistBuildings(sanitized);
  }

  return sanitized;
}

/**
 * Loads all saved buildings from localStorage with error handling and automatic migration
 */
export function loadSavedBuildings(): SavedBuilding[] {
  if (typeof window === 'undefined') return [];

  try {
    let rawList: any[] = [];
    const stored = localStorage.getItem(STORAGE_KEY);
    
    if (stored) {
      rawList = JSON.parse(stored);
    } else {
      // Check legacy key
      const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacy) {
        rawList = JSON.parse(legacy);
      }
    }

    if (!Array.isArray(rawList)) return [];

    const migrated = rawList.map(migrateBuilding);
    return sanitizeAndMigrateBuildings(migrated);
  } catch (err) {
    console.error('Failed to load saved buildings from localStorage:', err);
    return [];
  }
}

/**
 * Saves the full list of buildings to localStorage and verifies the write by reading back
 */
export function persistBuildings(buildings: SavedBuilding[]): { success: boolean; error?: string } {
  if (typeof window === 'undefined') return { success: false, error: 'Window not available' };

  try {
    const serialized = JSON.stringify(buildings);
    localStorage.setItem(STORAGE_KEY, serialized);

    // Verify write by reading it back
    const verifyRead = localStorage.getItem(STORAGE_KEY);
    if (!verifyRead || verifyRead !== serialized) {
      throw new Error('Verification failed: Written data does not match stored content.');
    }

    return { success: true };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown storage write error';
    console.error('Failed to persist buildings:', errorMsg);
    return { success: false, error: errorMsg };
  }
}

/**
 * Saves or inserts a building into the local store
 */
export function saveBuildingToStorage(building: SavedBuilding): { success: boolean; error?: string } {
  try {
    const current = loadSavedBuildings();
    const existingIndex = current.findIndex((b) => b.id === building.id);
    
    const preparedBuilding = {
      ...building,
      updatedAt: new Date().toISOString(),
      version: 2,
    };

    let updatedList: SavedBuilding[];
    if (existingIndex >= 0) {
      updatedList = [...current];
      updatedList[existingIndex] = preparedBuilding;
    } else {
      updatedList = [preparedBuilding, ...current];
    }

    return persistBuildings(updatedList);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Error saving building';
    return { success: false, error: errorMsg };
  }
}

/**
 * Deletes a building from storage by ID
 */
export function deleteBuildingFromStorage(buildingId: string): { success: boolean; deletedBuilding?: SavedBuilding; error?: string } {
  try {
    const current = loadSavedBuildings();
    const target = current.find((b) => b.id === buildingId);
    if (!target) return { success: true };

    const filtered = current.filter((b) => b.id !== buildingId);
    const res = persistBuildings(filtered);
    if (res.success) {
      return { success: true, deletedBuilding: target };
    }
    return res;
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Delete error' };
  }
}

/**
 * Duplicates a building in storage
 */
export function duplicateBuildingInStorage(buildingId: string): { success: boolean; newBuilding?: SavedBuilding; error?: string } {
  try {
    const current = loadSavedBuildings();
    const target = current.find((b) => b.id === buildingId);
    if (!target) return { success: false, error: 'Building not found' };

    const now = new Date().toISOString();
    const cloned: SavedBuilding = {
      ...target,
      id: `bldg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: `${target.name} (Copy)`,
      nickname: `${target.name} (Copy)`,
      createdAt: now,
      updatedAt: now,
    };

    const res = persistBuildings([cloned, ...current]);
    if (res.success) {
      return { success: true, newBuilding: cloned };
    }
    return res;
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Duplicate error' };
  }
}

/**
 * Checks if a building name already exists (case-insensitive, ignoring self)
 */
export function isBuildingNameDuplicate(name: string, excludeId?: string): boolean {
  const trimmed = name.trim().toLowerCase();
  if (!trimmed) return false;

  const current = loadSavedBuildings();
  return current.some((b) => {
    if (excludeId && b.id === excludeId) return false;
    return b.name.trim().toLowerCase() === trimmed;
  });
}

/**
 * Draft Management in Memory / Session Storage
 * For autosaving the unfinished building without polluting My Buildings
 */
export interface UnfinishedDraftState {
  stage: 'stage1_setup' | 'stage2_calculate';
  draftInfo: BuildingDraft;
  inputs: any;
  timestamp: number;
}

export function saveUnfinishedDraft(state: UnfinishedDraftState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    // Ignore memory/storage limit
  }
}

export function loadUnfinishedDraft(): UnfinishedDraftState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.draftInfo && parsed.draftInfo.name) {
      return parsed;
    }
    return null;
  } catch (e) {
    return null;
  }
}

export function clearUnfinishedDraft(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch (e) {
    // Ignore
  }
}

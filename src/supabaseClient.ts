import { createClient } from "@supabase/supabase-js";

// Initialize the client lazily if credentials exist.
// This is safe and prevents crashes if the user hasn't configured them yet.
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = supabaseUrl.length > 0 && supabaseAnonKey.length > 0;

export const supabaseClient = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// Local storage keys
const LOCAL_META_KEY = "abyss_hunter_meta_progression";
const LOCAL_RUN_SLOT_KEY_PREFIX = "abyss_hunter_run_slot_";
const LOCAL_SLOTS_METADATA_KEY = "abyss_hunter_slots_metadata";

export interface MetaProgression {
  id: string;
  crystal_shards_total: number;
  unlocked_characters: string[]; // ["EXPLORER", "SENTINEL", "OVERSEER"]
  unlocked_start_parts: string[]; // part IDs
  unlocked_upgrades: {
    starting_card_slots?: number; // expansion
    curse_resistance?: number;    // level 1, 2, 3
    shop_discount?: number;       // level 1, 2, 3
    extra_max_hp?: number;        // level 1, 2, 3
  };
  best_floor_reached: number;
  best_score: number;
  total_runs: number;
  total_clears: number;
  updated_at: string;
}

export interface RunSaveSlot {
  slot_id: number;
  player_stats: {
    hp: number;
    maxHp: number;
    gold: number;
    score: number;
    floor: number;
    kills: number;
    scraps: any;
    character: string;
  };
  deck: any[];
  chamber: any[];
  equipped_parts: any[];
  owned_parts: any[];
  artifacts: any[];
  route_nodes: any[];
  active_room_id: string | null;
  difficulty_multiplier: number; // 0: Default, 1, 2, 3
  is_endless: boolean;
  updated_at: string;
}

// Default initial state
export const DEFAULT_META_PROGRESSION: MetaProgression = {
  id: "local_user_meta",
  crystal_shards_total: 50, // Give some starter shards
  unlocked_characters: ["EXPLORER", "SENTINEL"], // Explorer & Sentinel basic
  unlocked_start_parts: ["start_p1", "start_p2"],
  unlocked_upgrades: {
    starting_card_slots: 0,
    curse_resistance: 0,
    shop_discount: 0,
    extra_max_hp: 0,
  },
  best_floor_reached: 1,
  best_score: 0,
  total_runs: 0,
  total_clears: 0,
  updated_at: new Date().toISOString(),
};

/**
 * Loads meta progression. Transparently syncs/falls back between Supabase and LocalStorage.
 */
export async function loadMetaProgression(userId: string = "anonymous"): Promise<{ data: MetaProgression, source: "supabase" | "local" }> {
  if (isSupabaseConfigured && supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from("meta_progression")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Supabase load meta error, falling back to local:", error);
      } else if (data) {
        return { data: data as MetaProgression, source: "supabase" };
      }
    } catch (e) {
      console.error("Supabase load exception, falling back:", e);
    }
  }

  // Fallback to local storage
  const stored = localStorage.getItem(LOCAL_META_KEY);
  if (stored) {
    try {
      return { data: JSON.parse(stored) as MetaProgression, source: "local" };
    } catch {
      return { data: { ...DEFAULT_META_PROGRESSION }, source: "local" };
    }
  }
  
  // Set default if empty
  localStorage.setItem(LOCAL_META_KEY, JSON.stringify(DEFAULT_META_PROGRESSION));
  return { data: { ...DEFAULT_META_PROGRESSION }, source: "local" };
}

/**
 * Saves meta progression, performing conflict detection.
 */
export async function saveMetaProgression(
  userId: string = "anonymous",
  meta: MetaProgression,
  lastKnownUpdatedAt?: string
): Promise<{ success: boolean; data: MetaProgression; conflict?: boolean; error?: string }> {
  const nowStr = new Date().toISOString();
  const updatedMeta = { ...meta, updated_at: nowStr };

  if (isSupabaseConfigured && supabaseClient) {
    try {
      // 1. Fetch current on server to check for conflict
      const { data: current, error: fetchErr } = await supabaseClient
        .from("meta_progression")
        .select("updated_at")
        .eq("user_id", userId)
        .single();

      if (!fetchErr && current) {
        const serverTime = new Date(current.updated_at).getTime();
        const clientLastTime = lastKnownUpdatedAt ? new Date(lastKnownUpdatedAt).getTime() : 0;
        
        // If server is newer than our last read, block the save to avoid overwriting newer cloud data!
        if (serverTime > clientLastTime) {
          console.warn("Save conflict detected! Server is newer than client's last read.");
          return { success: false, data: updatedMeta, conflict: true };
        }
      }

      // 2. Perform upsert
      const { error: upsertErr } = await supabaseClient
        .from("meta_progression")
        .upsert({
          user_id: userId,
          crystal_shards_total: updatedMeta.crystal_shards_total,
          unlocked_characters: updatedMeta.unlocked_characters,
          unlocked_start_parts: updatedMeta.unlocked_start_parts,
          unlocked_upgrades: updatedMeta.unlocked_upgrades,
          best_floor_reached: updatedMeta.best_floor_reached,
          best_score: updatedMeta.best_score,
          total_runs: updatedMeta.total_runs,
          total_clears: updatedMeta.total_clears,
          updated_at: nowStr,
        });

      if (!upsertErr) {
        // Also sync to local storage for offline tolerance
        localStorage.setItem(LOCAL_META_KEY, JSON.stringify(updatedMeta));
        return { success: true, data: updatedMeta };
      } else {
        return { success: false, data: updatedMeta, error: upsertErr.message };
      }
    } catch (e: any) {
      console.error("Supabase save exception:", e);
      // fallback save locally
      localStorage.setItem(LOCAL_META_KEY, JSON.stringify(updatedMeta));
      return { success: true, data: updatedMeta, error: "Network error, saved locally." };
    }
  }

  // Local storage only
  localStorage.setItem(LOCAL_META_KEY, JSON.stringify(updatedMeta));
  return { success: true, data: updatedMeta };
}

/**
 * Loads data for a specific save slot (1, 2, or 3)
 */
export async function loadSaveSlot(
  userId: string = "anonymous",
  slotId: number
): Promise<{ data: RunSaveSlot | null; source: "supabase" | "local" }> {
  if (isSupabaseConfigured && supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from("runs_slots")
        .select("*")
        .eq("user_id", userId)
        .eq("slot_id", slotId)
        .single();

      if (!error && data) {
        return { data: data as unknown as RunSaveSlot, source: "supabase" };
      }
    } catch (e) {
      console.error("Supabase load slot error:", e);
    }
  }

  // Local storage fallback
  const stored = localStorage.getItem(`${LOCAL_RUN_SLOT_KEY_PREFIX}${slotId}`);
  if (stored) {
    try {
      return { data: JSON.parse(stored) as RunSaveSlot, source: "local" };
    } catch {
      return { data: null, source: "local" };
    }
  }
  return { data: null, source: "local" };
}

/**
 * Saves or updates a run slot
 */
export async function saveSaveSlot(
  userId: string = "anonymous",
  slot: RunSaveSlot,
  lastKnownUpdatedAt?: string
): Promise<{ success: boolean; data: RunSaveSlot; conflict?: boolean; error?: string }> {
  const nowStr = new Date().toISOString();
  const updatedSlot = { ...slot, updated_at: nowStr };

  if (isSupabaseConfigured && supabaseClient) {
    try {
      // Conflict check
      const { data: current, error: fetchErr } = await supabaseClient
        .from("runs_slots")
        .select("updated_at")
        .eq("user_id", userId)
        .eq("slot_id", slot.slot_id)
        .single();

      if (!fetchErr && current) {
        const serverTime = new Date(current.updated_at).getTime();
        const clientLastTime = lastKnownUpdatedAt ? new Date(lastKnownUpdatedAt).getTime() : 0;
        
        if (serverTime > clientLastTime) {
          return { success: false, data: updatedSlot, conflict: true };
        }
      }

      const { error: upsertErr } = await supabaseClient
        .from("runs_slots")
        .upsert({
          user_id: userId,
          slot_id: updatedSlot.slot_id,
          player_stats: updatedSlot.player_stats,
          deck: updatedSlot.deck,
          chamber: updatedSlot.chamber,
          equipped_parts: updatedSlot.equipped_parts,
          owned_parts: updatedSlot.owned_parts,
          artifacts: updatedSlot.artifacts,
          route_nodes: updatedSlot.route_nodes,
          active_room_id: updatedSlot.active_room_id,
          difficulty_multiplier: updatedSlot.difficulty_multiplier,
          is_endless: updatedSlot.is_endless,
          updated_at: nowStr,
        });

      if (!upsertErr) {
        localStorage.setItem(`${LOCAL_RUN_SLOT_KEY_PREFIX}${updatedSlot.slot_id}`, JSON.stringify(updatedSlot));
        return { success: true, data: updatedSlot };
      } else {
        return { success: false, data: updatedSlot, error: upsertErr.message };
      }
    } catch (e: any) {
      console.error("Supabase save slot exception:", e);
      localStorage.setItem(`${LOCAL_RUN_SLOT_KEY_PREFIX}${updatedSlot.slot_id}`, JSON.stringify(updatedSlot));
      return { success: true, data: updatedSlot, error: "Network error, saved locally." };
    }
  }

  localStorage.setItem(`${LOCAL_RUN_SLOT_KEY_PREFIX}${updatedSlot.slot_id}`, JSON.stringify(updatedSlot));
  return { success: true, data: updatedSlot };
}

/**
 * Deletes / clears a save slot (e.g. upon death)
 */
export async function clearSaveSlot(userId: string = "anonymous", slotId: number): Promise<boolean> {
  if (isSupabaseConfigured && supabaseClient) {
    try {
      await supabaseClient
        .from("runs_slots")
        .delete()
        .eq("user_id", userId)
        .eq("slot_id", slotId);
    } catch (e) {
      console.error("Supabase clear slot error:", e);
    }
  }

  localStorage.removeItem(`${LOCAL_RUN_SLOT_KEY_PREFIX}${slotId}`);
  return true;
}

/**
 * Merges local storage data into Supabase when user logs in.
 */
export async function mergeLocalToCloud(userId: string): Promise<{ success: boolean; mergedSlots: number[] }> {
  const mergedSlots: number[] = [];
  if (!isSupabaseConfigured || !supabaseClient) return { success: false, mergedSlots };

  try {
    // 1. Merge MetaProgression
    const localMetaStr = localStorage.getItem(LOCAL_META_KEY);
    if (localMetaStr) {
      const localMeta = JSON.parse(localMetaStr) as MetaProgression;
      const { data: cloudMeta } = await supabaseClient
        .from("meta_progression")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (cloudMeta) {
        // Merge strategy: sum the shards, take the best records
        const mergedMeta: MetaProgression = {
          ...cloudMeta,
          crystal_shards_total: Math.max(cloudMeta.crystal_shards_total, localMeta.crystal_shards_total) + Math.min(cloudMeta.crystal_shards_total, localMeta.crystal_shards_total) / 2, // Give a fraction bonus
          unlocked_characters: Array.from(new Set([...cloudMeta.unlocked_characters, ...localMeta.unlocked_characters])),
          unlocked_start_parts: Array.from(new Set([...cloudMeta.unlocked_start_parts, ...localMeta.unlocked_start_parts])),
          best_floor_reached: Math.max(cloudMeta.best_floor_reached, localMeta.best_floor_reached),
          best_score: Math.max(cloudMeta.best_score, localMeta.best_score),
          total_runs: cloudMeta.total_runs + localMeta.total_runs,
          total_clears: cloudMeta.total_clears + localMeta.total_clears,
          updated_at: new Date().toISOString()
        };

        await supabaseClient.from("meta_progression").upsert({
          user_id: userId,
          ...mergedMeta
        });
        localStorage.setItem(LOCAL_META_KEY, JSON.stringify(mergedMeta));
      } else {
        // Just upload local meta
        await supabaseClient.from("meta_progression").upsert({
          user_id: userId,
          ...localMeta
        });
      }
    }

    // 2. Merge Save Slots (only write if the slot doesn't exist on the server, or prompt)
    for (const slotId of [1, 2, 3]) {
      const localSlotStr = localStorage.getItem(`${LOCAL_RUN_SLOT_KEY_PREFIX}${slotId}`);
      if (localSlotStr) {
        const localSlot = JSON.parse(localSlotStr) as RunSaveSlot;
        
        // Check if server already has a save slot
        const { data: serverSlot } = await supabaseClient
          .from("runs_slots")
          .select("updated_at")
          .eq("user_id", userId)
          .eq("slot_id", slotId)
          .single();

        if (!serverSlot) {
          // Upload local slot to server
          await supabaseClient.from("runs_slots").upsert({
            user_id: userId,
            ...localSlot
          });
          mergedSlots.push(slotId);
        }
      }
    }

    return { success: true, mergedSlots };
  } catch (e) {
    console.error("Merge error:", e);
    return { success: false, mergedSlots };
  }
}

// SQL helper definitions to display in the UI for simple copypasting
export const SUPABASE_SQL_SETUP = `
-- 1. Create table for account-level meta progression
CREATE TABLE IF NOT EXISTS public.meta_progression (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL UNIQUE,
    crystal_shards_total INTEGER DEFAULT 0,
    unlocked_characters JSONB DEFAULT '["EXPLORER", "SENTINEL"]'::jsonb,
    unlocked_start_parts JSONB DEFAULT '["start_p1", "start_p2"]'::jsonb,
    unlocked_upgrades JSONB DEFAULT '{}'::jsonb,
    best_floor_reached INTEGER DEFAULT 1,
    best_score INTEGER DEFAULT 0,
    total_runs INTEGER DEFAULT 0,
    total_clears INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create table for active run slots
CREATE TABLE IF NOT EXISTS public.runs_slots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    slot_id INTEGER NOT NULL,
    player_stats JSONB NOT NULL,
    deck JSONB DEFAULT '[]'::jsonb NOT NULL,
    chamber JSONB DEFAULT '[]'::jsonb NOT NULL,
    equipped_parts JSONB DEFAULT '[]'::jsonb NOT NULL,
    owned_parts JSONB DEFAULT '[]'::jsonb NOT NULL,
    artifacts JSONB DEFAULT '[]'::jsonb NOT NULL,
    route_nodes JSONB DEFAULT '[]'::jsonb NOT NULL,
    active_room_id VARCHAR(100),
    difficulty_multiplier INTEGER DEFAULT 0 NOT NULL,
    is_endless BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (user_id, slot_id)
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.meta_progression ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.runs_slots ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies allowing anyone to read/write their own records
CREATE POLICY "Users can manage their own meta_progression" 
ON public.meta_progression 
FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Users can manage their own runs_slots" 
ON public.runs_slots 
FOR ALL 
USING (true) 
WITH CHECK (true);
`;

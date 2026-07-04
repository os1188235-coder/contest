/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  BulletCard, 
  ShotgunPart, 
  Artifact, 
  RoomNode, 
  RoomType, 
  ElementType, 
  Rarity, 
  SlotType, 
  PlayerStats 
} from "./types";
import { BASE_CARDS, BASE_PARTS, BASE_ARTIFACTS } from "./data";
import GameCanvas from "./components/GameCanvas";
import DungeonMap from "./components/DungeonMap";
import BlacksmithForge from "./components/BlacksmithForge";
import AdventureShop from "./components/AdventureShop";
import AdventureEvent from "./components/AdventureEvent";
import StartGuideModal from "./components/StartGuideModal";
import { 
  Skull, 
  Trophy, 
  Heart, 
  Wrench, 
  ShoppingBag, 
  Milestone, 
  Activity, 
  Coins, 
  Sparkles, 
  RefreshCw,
  Gift,
  PlusCircle,
  Award,
  Shield,
  Zap,
  BookOpen,
  User,
  Lock,
  Settings,
  Database,
  Sword,
  Flame,
  Gamepad2,
  Bookmark,
  CheckCircle2
} from "lucide-react";
import { 
  loadMetaProgression, 
  saveMetaProgression, 
  loadSaveSlot, 
  saveSaveSlot, 
  clearSaveSlot, 
  isSupabaseConfigured, 
  MetaProgression, 
  RunSaveSlot,
  DEFAULT_META_PROGRESSION 
} from "./supabaseClient";

export default function App() {
  
  // Immersive single screen routing controller: START, GAMEPLAY, GAME_OVER, VICTORY
  const [screen, setScreen] = useState<"START" | "GAMEPLAY" | "GAME_OVER" | "VICTORY">("START");
  const [showGuide, setShowGuide] = useState(true);

  // Save slots & Meta progression states
  const [selectedSlot, setSelectedSlot] = useState<number>(1);
  const [metaProgression, setMetaProgression] = useState<MetaProgression>(DEFAULT_META_PROGRESSION);
  const [isDbLoading, setIsDbLoading] = useState<boolean>(false);
  const [dbStatus, setDbStatus] = useState<string>("");
  const [activeSlotData, setActiveSlotData] = useState<RunSaveSlot | null>(null);

  // Character selection, Difficulty levels, Tutorial state
  const [selectedCharacter, setSelectedCharacter] = useState<"EXPLORER" | "SENTINEL" | "OVERSEER">("EXPLORER");
  const [difficultyLevel, setDifficultyLevel] = useState<"NORMAL" | "HARD" | "ABYSS" | "CHAOS">("NORMAL");
  const [isTutorial, setIsTutorial] = useState<boolean>(false);
  const [isEndless, setIsEndless] = useState<boolean>(false);

  // Raw immersive Player Statistics state
  const [playerStats, setPlayerStats] = useState<PlayerStats>({
    hp: 100,
    maxHp: 100,
    gold: 35,
    score: 0,
    floor: 1,
    kills: 0,
    scraps: {
      metal: 10,
      crystal: 15,
      core: 1,
      rune: 0,
      wood: 2,
      timeCrystal: 0,
      powder: 3
    }
  });

  // Action inventory decks lists
  const [deck, setDeck] = useState<BulletCard[]>([]);
  const [chamber, setChamber] = useState<BulletCard[]>([]);
  const [equippedParts, setEquippedParts] = useState<ShotgunPart[]>([]);
  const [ownedParts, setOwnedParts] = useState<ShotgunPart[]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);

  // Active Routing state
  const [routeNodes, setRouteNodes] = useState<RoomNode[]>([]);
  const [activeRoom, setActiveRoom] = useState<RoomNode | null>(null);
  const [isBulletTime, setIsBulletTime] = useState(false);

  // Modals / Overlays triggers within GAMEPLAY
  const [activeStation, setActiveStation] = useState<null | "shop" | "forge" | "event">(null);
  const [dungeonMapOpen, setDungeonMapOpen] = useState(false);

  // Chamber slot dimensions parameters
  const [chamberCapacity, setChamberCapacity] = useState(10);

  // Load meta progression and active slot info on mount or slot change
  useEffect(() => {
    async function initData() {
      setIsDbLoading(true);
      setDbStatus("데이터를 로딩 중입니다...");
      
      try {
        const metaRes = await loadMetaProgression();
        setMetaProgression(metaRes.data);
        
        const slotRes = await loadSaveSlot("anonymous", selectedSlot);
        setActiveSlotData(slotRes.data);
        
        setDbStatus(
          isSupabaseConfigured 
            ? `클라우드 동기화 완료 (슬롯 ${selectedSlot})` 
            : `오프라인 브라우저 저장소 연동 (슬롯 ${selectedSlot})`
        );
      } catch (e) {
        console.error("Error loading data:", e);
        setDbStatus("데이터 로드 중 오류가 발생했습니다.");
      } finally {
        setIsDbLoading(false);
      }
    }
    initData();
  }, [selectedSlot]);

  // Initialize fresh run configuration
  const startNewExploration = () => {
    // Determine upgrade multipliers
    const extraHpLevel = metaProgression.unlocked_upgrades.extra_max_hp || 0;
    const goldBonusLevel = metaProgression.unlocked_upgrades.shop_discount || 0;
    const materialBonusLevel = metaProgression.unlocked_upgrades.starting_card_slots || 0; // extra materials find rate level

    // Character base HP adjustments
    let characterHp = 100;
    if (selectedCharacter === "SENTINEL") {
      characterHp = 125; // Sentinel has extra durability
    } else if (selectedCharacter === "OVERSEER") {
      characterHp = 90; // Overseer has lower HP but high mobility
    }

    const startMaxHp = characterHp + (extraHpLevel * 10);
    const startGold = 50 + (goldBonusLevel * 15);
    const startMaterialBonus = materialBonusLevel * 3;

    // 1. Reset Stats
    setPlayerStats({
      hp: startMaxHp,
      maxHp: startMaxHp,
      gold: startGold,
      score: 0,
      floor: 1,
      kills: 0,
      scraps: {
        metal: 12 + startMaterialBonus,
        crystal: 18 + startMaterialBonus,
        core: selectedCharacter === "OVERSEER" ? 2 : 1, // Overseer starts with more parts core
        rune: 1 + startMaterialBonus,
        wood: 2 + startMaterialBonus,
        timeCrystal: 0,
        powder: 3 + startMaterialBonus
      }
    });

    // 2. Setup standard deck containing basic functional bullet card matrix
    const startingDeck: BulletCard[] = [
      { ...BASE_CARDS[0], id: "start_c1" }, // Fire
      { ...BASE_CARDS[0], id: "start_c2" }, // Fire
      { ...BASE_CARDS[1], id: "start_c3" }, // Ice
      { ...BASE_CARDS[1], id: "start_c4" }, // Ice
      { ...BASE_CARDS[6], id: "start_c5" }, // Knockback
      { ...BASE_CARDS[6], id: "start_c6" }, // Knockback
      { ...BASE_CARDS[7], id: "start_c7" }, // Pierce
      { ...BASE_CARDS[9], id: "start_c8" }, // Boost
    ];
    setDeck(startingDeck);

    // 3. Chamber pre-loading values (FIFO queue loading)
    setChamber([
      startingDeck[0],
      startingDeck[2],
      startingDeck[4],
    ]);

    // 4. Equipped weapon parts starting synergies
    setEquippedParts([
      { ...BASE_PARTS[5], id: "start_p1" }, // flare spreading barrel
    ]);
    
    // spare equipment invent list
    setOwnedParts([
      { ...BASE_PARTS[0], id: "start_p2" }, // rapid trigger
    ]);

    // Initial relics list (결정 나침반 - Crystal Compass)
    setArtifacts([
      { ...BASE_ARTIFACTS[0], id: "start_a1" }
    ]);

    // 5. Build routing nodes
    setIsEndless(false);

    if (isTutorial) {
      // Dedicated Room-by-Room Tutorial Flow
      const tutorialNodes: RoomNode[] = [
        {
          id: "tutorial_room_1",
          type: RoomType.COMBAT,
          x: 20,
          y: 50,
          depth: 0,
          connections: ["tutorial_room_2"],
          parentConnections: [],
          visited: true,
          clear: false
        },
        {
          id: "tutorial_room_2",
          type: RoomType.EVENT,
          x: 55,
          y: 50,
          depth: 1,
          connections: ["tutorial_boss"],
          parentConnections: ["tutorial_room_1"],
          visited: false,
          clear: false
        },
        {
          id: "tutorial_boss",
          type: RoomType.BOSS,
          x: 90,
          y: 50,
          depth: 2,
          connections: [],
          parentConnections: ["tutorial_room_2"],
          visited: false,
          clear: false
        }
      ];
      setRouteNodes(tutorialNodes);
      setActiveRoom(tutorialNodes[0]);
    } else {
      const nodes = generateMapRouting();
      const firstRoom = { ...nodes[0], visited: true };
      const updatedNodes = nodes.map(n => n.id === firstRoom.id ? firstRoom : n);
      setRouteNodes(updatedNodes);
      setActiveRoom(firstRoom);
    }

    setIsBulletTime(false);
    setActiveStation(null);
    setDungeonMapOpen(false);

    setScreen("GAMEPLAY");
  };

  // Saves active run slot to Cloud/LocalStorage
  const saveActiveRun = async (
    currentStats: PlayerStats,
    currentDeck: BulletCard[],
    currentChamber: BulletCard[],
    currentEquippedParts: ShotgunPart[],
    currentOwnedParts: ShotgunPart[],
    currentArtifacts: Artifact[],
    currentRouteNodes: RoomNode[],
    currentActiveRoomId: string | null
  ) => {
    let diffMult = 1.0;
    if (difficultyLevel === "HARD") diffMult = 1.5;
    else if (difficultyLevel === "ABYSS") diffMult = 2.2;
    else if (difficultyLevel === "CHAOS") diffMult = 3.5;

    const slotPayload: RunSaveSlot = {
      slot_id: selectedSlot,
      player_stats: {
        hp: currentStats.hp,
        maxHp: currentStats.maxHp,
        gold: currentStats.gold,
        score: currentStats.score,
        floor: currentStats.floor,
        kills: currentStats.kills,
        scraps: currentStats.scraps,
        character: selectedCharacter
      },
      deck: currentDeck,
      chamber: currentChamber,
      equipped_parts: currentEquippedParts,
      owned_parts: currentOwnedParts,
      artifacts: currentArtifacts,
      route_nodes: currentRouteNodes,
      active_room_id: currentActiveRoomId,
      difficulty_multiplier: diffMult,
      is_endless: isEndless,
      updated_at: new Date().toISOString()
    };

    try {
      const res = await saveSaveSlot("anonymous", slotPayload);
      if (res.success) {
        setActiveSlotData(res.data);
      }
    } catch (e) {
      console.error("Failed to save run:", e);
    }
  };

  // Loads run from active slot
  const loadActiveRunFromSlot = () => {
    if (!activeSlotData) return;
    
    const d = activeSlotData;
    if (d.player_stats.character === "SENTINEL" || d.player_stats.character === "OVERSEER" || d.player_stats.character === "EXPLORER") {
      setSelectedCharacter(d.player_stats.character as any);
    }
    
    if (d.difficulty_multiplier === 1.5) setDifficultyLevel("HARD");
    else if (d.difficulty_multiplier === 2.2) setDifficultyLevel("ABYSS");
    else if (d.difficulty_multiplier === 3.5) setDifficultyLevel("CHAOS");
    else setDifficultyLevel("NORMAL");

    setPlayerStats({
      hp: d.player_stats.hp,
      maxHp: d.player_stats.maxHp,
      gold: d.player_stats.gold,
      score: d.player_stats.score,
      floor: d.player_stats.floor,
      kills: d.player_stats.kills,
      scraps: d.player_stats.scraps
    });

    setDeck(d.deck);
    setChamber(d.chamber);
    setEquippedParts(d.equipped_parts);
    setOwnedParts(d.owned_parts);
    setArtifacts(d.artifacts);
    setRouteNodes(d.route_nodes);
    
    const currentActive = d.route_nodes.find(n => n.id === d.active_room_id) || d.route_nodes[0];
    setActiveRoom(currentActive);
    
    setIsEndless(d.is_endless);
    setIsTutorial(false);
    setIsBulletTime(false);
    setActiveStation(null);
    setDungeonMapOpen(false);

    setScreen("GAMEPLAY");
  };

  // Legacy Upgrade Purchaser
  const buyPermanentUpgrade = async (type: "extra_max_hp" | "shop_discount" | "starting_card_slots" | "curse_resistance") => {
    const currentLvl = metaProgression.unlocked_upgrades[type] || 0;
    if (currentLvl >= 5) {
      alert("최대 레벨에 도달했습니다!");
      return;
    }

    let cost = (currentLvl + 1) * 20;
    if (type === "extra_max_hp") cost = (currentLvl + 1) * 30;
    else if (type === "shop_discount") cost = (currentLvl + 1) * 25;
    else if (type === "starting_card_slots") cost = (currentLvl + 1) * 50;

    if (metaProgression.crystal_shards_total < cost) {
      alert("결정 파편이 부족합니다!");
      return;
    }

    const nextMeta: MetaProgression = {
      ...metaProgression,
      crystal_shards_total: metaProgression.crystal_shards_total - cost,
      unlocked_upgrades: {
        ...metaProgression.unlocked_upgrades,
        [type]: currentLvl + 1
      },
      updated_at: new Date().toISOString()
    };

    const res = await saveMetaProgression("anonymous", nextMeta);
    if (res.success) {
      setMetaProgression(res.data);
    }
  };

  // Build Slay the Spire connections flow nodes
  const generateMapRouting = (): RoomNode[] => {
    const list: RoomNode[] = [];
    
    // Depth 0: Standard Combats choices
    list.push({
      id: "combat_1", type: RoomType.COMBAT, x: 20, y: 30, depth: 0,
      connections: ["elite_1", "event_1"], parentConnections: [], visited: false, clear: false
    });
    list.push({
      id: "combat_2", type: RoomType.COMBAT, x: 20, y: 70, depth: 0,
      connections: ["event_1", "shop_1"], parentConnections: [], visited: false, clear: false
    });

    // Depth 1: Elite hazard or Shop merchants, or Event anomalies
    list.push({
      id: "elite_1", type: RoomType.ELITE, x: 45, y: 25, depth: 1,
      connections: ["forge_1"], parentConnections: ["combat_1"], visited: false, clear: false
    });
    list.push({
      id: "event_1", type: RoomType.EVENT, x: 45, y: 50, depth: 1,
      connections: ["forge_1", "treasure_1"], parentConnections: ["combat_1", "combat_2"], visited: false, clear: false
    });
    list.push({
      id: "shop_1", type: RoomType.SHOP, x: 45, y: 75, depth: 1,
      connections: ["treasure_1"], parentConnections: ["combat_2"], visited: false, clear: false
    });

    // Depth 2: Forge hardware upgrade or chest rewards
    list.push({
      id: "forge_1", type: RoomType.FORGE, x: 70, y: 35, depth: 2,
      connections: ["boss_final"], parentConnections: ["elite_1", "event_1"], visited: false, clear: false
    });
    list.push({
      id: "treasure_1", type: RoomType.TREASURE, x: 70, y: 65, depth: 2,
      connections: ["boss_final"], parentConnections: ["event_1", "shop_1"], visited: false, clear: false
    });

    // Depth 3: Ultimate boss room (Imperial Archdemon)
    list.push({
      id: "boss_final", type: RoomType.BOSS, x: 92, y: 50, depth: 3,
      connections: [], parentConnections: ["forge_1", "treasure_1"], visited: false, clear: false
    });

    return list;
  };

  // Adjust maximum chamber capacity based on artifacts (Ancient Bandolier = +2 space) and parts (Compressed chamber = +4 space)
  useEffect(() => {
    let baseCap = 10;
    const hasSling = artifacts.some(a => a.effectType === "BANDOLIER");
    if (hasSling) baseCap += 2;

    const hasCompressedChamber = equippedParts.some(p => p.id.includes("compressed"));
    if (hasCompressedChamber) baseCap += 4;

    setChamberCapacity(baseCap);
  }, [equippedParts, artifacts]);

  const handlePlayerDied = async () => {
    setScreen("GAME_OVER");

    let mult = 1.0;
    if (difficultyLevel === "HARD") mult = 1.15;
    else if (difficultyLevel === "ABYSS") mult = 1.35;
    else if (difficultyLevel === "CHAOS") mult = 1.60;

    let earnedShards = Math.floor(playerStats.score / 100) + Math.floor(playerStats.gold / 4);
    earnedShards = Math.max(5, Math.floor(earnedShards * mult));

    const nextBestFloor = Math.max(metaProgression.best_floor_reached || 1, playerStats.floor);
    const nextBestScore = Math.max(metaProgression.best_score || 0, playerStats.score);

    const updatedMeta: MetaProgression = {
      ...metaProgression,
      crystal_shards_total: (metaProgression.crystal_shards_total || 0) + earnedShards,
      best_floor_reached: nextBestFloor,
      best_score: nextBestScore,
      total_runs: (metaProgression.total_runs || 0) + 1,
      updated_at: new Date().toISOString()
    };

    await clearSaveSlot("anonymous", selectedSlot);
    setActiveSlotData(null);

    const res = await saveMetaProgression("anonymous", updatedMeta);
    if (res.success) {
      setMetaProgression(res.data);
    }
  };

  const handlePlayerVictory = async () => {
    setScreen("VICTORY");

    let mult = 1.0;
    if (difficultyLevel === "HARD") mult = 1.15;
    else if (difficultyLevel === "ABYSS") mult = 1.35;
    else if (difficultyLevel === "CHAOS") mult = 1.60;

    let earnedShards = Math.floor(playerStats.score / 100) + Math.floor(playerStats.gold / 4) + 50;
    earnedShards = Math.max(20, Math.floor(earnedShards * mult));

    const nextBestFloor = Math.max(metaProgression.best_floor_reached || 1, playerStats.floor);
    const nextBestScore = Math.max(metaProgression.best_score || 0, playerStats.score + 5000);

    const updatedMeta: MetaProgression = {
      ...metaProgression,
      crystal_shards_total: (metaProgression.crystal_shards_total || 0) + earnedShards,
      best_floor_reached: nextBestFloor,
      best_score: nextBestScore,
      total_runs: (metaProgression.total_runs || 0) + 1,
      total_clears: (metaProgression.total_clears || 0) + 1,
      updated_at: new Date().toISOString()
    };

    await clearSaveSlot("anonymous", selectedSlot);
    setActiveSlotData(null);

    const res = await saveMetaProgression("anonymous", updatedMeta);
    if (res.success) {
      setMetaProgression(res.data);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0a0502] text-gray-100 flex flex-col relative overflow-x-hidden selection:bg-purple-900 selection:text-purple-200 font-sans">
      
      {/* Immersive background layer: Dungeon Grid & atmospheric noise */}
      <div className="absolute inset-0 opacity-20 pointer-events-none immersive-dungeon-grid" />
      <div className="absolute inset-0 pointer-events-none immersive-vignette" />
      <div className="absolute inset-x-0 top-0 h-96 bg-gradient-to-b from-[#4a3075]/10 to-transparent pointer-events-none" />

      {/* Main header navbar HUD */}
      {screen !== "GAMEPLAY" && (
        <header className="w-full border-b border-white/5 bg-black/60 backdrop-blur-md px-6 py-4 flex items-center justify-between relative z-30">
          <div className="flex items-center gap-3">
            <Skull className="w-5 h-5 text-neon-orange drop-shadow-[0_0_8px_#ff4e00] animate-pulse" />
            <div>
              <h1 className="text-sm font-black tracking-[0.16em] text-white font-heading">Abyss Shotgun Knight</h1>
              <span className="text-[10px] text-neon-purple/80 font-mono tracking-wider">단일 플레이 실시간 마력 샷건 액션 // SINGLE SCREEN EXPEDITION</span>
            </div>
          </div>
        </header>
      )}

      {/* App main client section router */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 flex flex-col gap-6 relative z-10">
        
        {screen === "START" && (
          <div className="flex-1 flex flex-col gap-8 py-8 px-4 max-w-6xl mx-auto relative select-none">
            
            {/* Ambient Background Glow Badge */}
            <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[450px] h-[400px] bg-purple-500/10 blur-[130px] rounded-full pointer-events-none -z-10" />
            
            {/* Main Header Row */}
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-black/50 border border-purple-500/30 rounded-2xl flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(168,85,247,0.2)] animate-pulse relative">
                <Skull className="w-10 h-10 text-purple-400 drop-shadow-[0_0_8px_#c084fc]" />
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-white tracking-[0.12em] uppercase leading-tight font-sans">
                심연의 결정 사냥꾼
              </h1>
              <h2 className="text-[#a855f7] text-xs font-mono font-bold tracking-[0.3em] mt-1.5 uppercase flex items-center gap-1.5">
                <span>Abyss Crystal Hunter</span>
                <span className="text-gray-600 font-sans">•</span>
                <span className="text-[#0ea5e9]">Legacy Edition</span>
              </h2>
              {/* DB Status Badge */}
              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-black/60 border border-white/5 rounded-full text-[9px] font-mono text-gray-400">
                <Database className="w-3 h-3 text-emerald-400" />
                <span>{dbStatus || "시스템 준비 완료"}</span>
              </div>
            </div>

            {/* Core Game Dashboard Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch w-full">
              
              {/* COLUMN 1: Save Slots Manager */}
              <div className="flex flex-col bg-black/60 border border-white/5 p-5 rounded-2xl shadow-xl backdrop-blur-md justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-2">
                    <Bookmark className="w-4 h-4 text-purple-400" />
                    <h3 className="font-sans font-black text-xs text-purple-300 tracking-wider uppercase">💾 저장 기록 슬롯 (Save Slots)</h3>
                  </div>

                  <p className="text-[10px] text-gray-500 mb-4 font-mono leading-relaxed">
                    작전을 수행하고 있는 캐릭터의 상태 및 던전 정보를 안전하게 보관합니다. 이어하기 또는 신규 작전을 선택하세요.
                  </p>

                  <div className="space-y-2.5">
                    {[1, 2, 3].map((slot) => {
                      const isSelected = selectedSlot === slot;
                      return (
                        <button
                          key={slot}
                          onClick={() => setSelectedSlot(slot)}
                          className={`w-full text-left p-3.5 rounded-xl border transition-all flex flex-col gap-1.5 cursor-pointer ${
                            isSelected 
                              ? "bg-purple-950/30 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.15)] text-white" 
                              : "bg-black/40 border-white/5 hover:border-white/10 text-gray-400"
                          }`}
                        >
                          <div className="flex justify-between items-center w-full">
                            <span className="font-mono font-bold text-xs">SLOT {slot}</span>
                            {isSelected && <span className="text-[8px] bg-purple-500 text-white font-sans font-bold px-1.5 rounded uppercase">SELECTED</span>}
                          </div>
                          <div className="text-[9.5px] font-mono">
                            {isSelected && isDbLoading ? (
                              <span className="text-gray-500 italic">로딩 중...</span>
                            ) : activeSlotData ? (
                              <div className="space-y-0.5">
                                <div className="text-white font-bold flex items-center gap-1">
                                  <span>🎭 {activeSlotData.player_stats.character === "SENTINEL" ? "파수꾼" : activeSlotData.player_stats.character === "OVERSEER" ? "감시자" : "탐험가"}</span>
                                  <span className="text-gray-500">•</span>
                                  <span className="text-purple-300">Floor {activeSlotData.player_stats.floor}</span>
                                </div>
                                <div className="text-gray-500 text-[8.5px]">
                                  체력: {activeSlotData.player_stats.hp}/{activeSlotData.player_stats.maxHp} | 💰 {activeSlotData.player_stats.gold} | ⚔️ {activeSlotData.player_stats.kills}처치
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-600 italic">저장된 작전 기록이 없습니다.</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-white/5 space-y-2.5">
                  {activeSlotData && (
                    <button
                      onClick={loadActiveRunFromSlot}
                      className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-mono font-black text-xs uppercase tracking-widest rounded-lg transition-all shadow-md cursor-pointer hover:scale-[1.02]"
                    >
                      ▶️ 기존 작전 이어하기 (Resume)
                    </button>
                  )}
                  
                  <button
                    onClick={startNewExploration}
                    className="w-full py-3 bg-gradient-to-r from-orange-600 to-[#ff4e00] hover:from-orange-500 hover:to-[#ff5c14] text-white font-mono font-black text-xs uppercase tracking-widest rounded-lg transition-all shadow-[0_0_20px_rgba(255,78,0,0.25)] border border-white/10 cursor-pointer hover:scale-[1.02]"
                  >
                    🚀 새로운 사냥 개시 (Start New)
                  </button>
                </div>
              </div>

              {/* COLUMN 2: Archetypes & Difficulties Selector */}
              <div className="flex flex-col bg-black/60 border border-white/5 p-5 rounded-2xl shadow-xl backdrop-blur-md justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-2">
                    <Gamepad2 className="w-4 h-4 text-orange-400" />
                    <h3 className="font-sans font-black text-xs text-orange-300 tracking-wider uppercase">🎭 사냥꾼 및 위협 난이도 (Setup)</h3>
                  </div>

                  {/* Character Pickers */}
                  <div className="mb-4">
                    <span className="text-[10px] text-purple-400 font-mono font-black block mb-2 uppercase">1. 캐릭터 선택 (Archetype)</span>
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        { 
                          id: "EXPLORER", 
                          name: "탐험가 (Explorer)", 
                          desc: "균형 잡힌 기본 사냥꾼.", 
                          shardsReq: 0 
                        },
                        { 
                          id: "SENTINEL", 
                          name: "파수꾼 (Sentinel)", 
                          desc: "피해 입을 시 25% 확률로 완벽 방어.", 
                          shardsReq: 50 
                        },
                        { 
                          id: "OVERSEER", 
                          name: "감시자 (Overseer)", 
                          desc: "회피 구르기 후 1.5초간 이동속도 +45%.", 
                          shardsReq: 100 
                        }
                      ].map((char) => {
                        const totalShards = metaProgression.crystal_shards_total || 0;
                        const isUnlocked = totalShards >= char.shardsReq;
                        const isSelected = selectedCharacter === char.id;

                        return (
                          <div
                            key={char.id}
                            onClick={() => {
                              if (isUnlocked) setSelectedCharacter(char.id as any);
                            }}
                            className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                              !isUnlocked 
                                ? "bg-black/60 border-white/5 opacity-50 cursor-not-allowed" 
                                : isSelected 
                                  ? "bg-orange-950/20 border-orange-500/50 text-white cursor-pointer" 
                                  : "bg-black/40 border-white/5 hover:border-white/10 text-gray-400 cursor-pointer"
                            }`}
                          >
                            <div className="mt-1">
                              {!isUnlocked ? (
                                <Lock className="w-3.5 h-3.5 text-red-500 shrink-0" />
                              ) : (
                                <User className={`w-3.5 h-3.5 ${isSelected ? "text-orange-400" : "text-gray-500"} shrink-0`} />
                              )}
                            </div>
                            <div className="flex-1 font-mono">
                              <div className="flex justify-between items-center w-full">
                                <span className={`text-[10.5px] font-bold ${isSelected ? "text-orange-400" : "text-white"}`}>{char.name}</span>
                                {!isUnlocked && <span className="text-[7.5px] bg-red-950/80 text-red-400 px-1 rounded">Locked (파편 {char.shardsReq}개)</span>}
                              </div>
                              <p className="text-[8.5px] text-gray-500 mt-0.5 leading-relaxed">{char.desc}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Difficulty selector */}
                  <div className="mb-4">
                    <span className="text-[10px] text-purple-400 font-mono font-black block mb-2 uppercase">2. 난이도 등급 (Threat Level)</span>
                    <div className="grid grid-cols-2 gap-1.5 font-mono text-[9px]">
                      {[
                        { id: "NORMAL", name: "일반 (NORMAL)", mult: "x1.0", bg: "hover:bg-gray-900 border-gray-700/50" },
                        { id: "HARD", name: "정예 (HARD)", mult: "x1.5", bg: "hover:bg-amber-950/20 border-amber-800/40" },
                        { id: "ABYSS", name: "심연 (ABYSS)", mult: "x2.2", bg: "hover:bg-purple-950/30 border-purple-800/40" },
                        { id: "CHAOS", name: "혼돈 (CHAOS)", mult: "x3.5", bg: "hover:bg-red-950/30 border-red-800/40" }
                      ].map((diff) => {
                        const active = difficultyLevel === diff.id;
                        return (
                          <button
                            key={diff.id}
                            onClick={() => setDifficultyLevel(diff.id as any)}
                            className={`p-2 border rounded-lg cursor-pointer text-center flex flex-col justify-center items-center gap-0.5 transition-all ${
                              active 
                                ? "bg-orange-500/10 border-orange-500 text-orange-300 font-bold" 
                                : `bg-black/30 text-gray-400 ${diff.bg}`
                            }`}
                          >
                            <span>{diff.name}</span>
                            <span className="opacity-75 text-[8px]">배율 {diff.mult}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Tutorial selector */}
                <div className="pt-3 border-t border-white/5 flex items-center justify-between pointer-events-auto">
                  <div className="flex flex-col text-left">
                    <span className="text-[10.5px] font-bold text-white flex items-center gap-1 font-mono">
                      📚 초심자 훈련 미션
                    </span>
                    <span className="text-[8.5px] text-gray-500 font-mono">
                      조준 및 불릿타임 장전 방식을 학습합니다 (+40 파편 보너스)
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isTutorial}
                    onChange={(e) => setIsTutorial(e.target.checked)}
                    className="w-4.5 h-4.5 accent-purple-500 rounded cursor-pointer shrink-0"
                  />
                </div>
              </div>

              {/* COLUMN 3: Legacies Shop */}
              <div className="flex flex-col bg-black/60 border border-[#a855f7]/15 p-5 rounded-2xl shadow-xl backdrop-blur-md justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-purple-400" />
                      <h3 className="font-sans font-black text-xs text-purple-300 tracking-wider uppercase">🔮 영구 아키펙트 유산 (Permanent)</h3>
                    </div>
                  </div>

                  {/* Crystal Shards Board */}
                  <div className="mb-4 px-4 py-2 bg-[#191129] border border-purple-500/30 rounded-xl flex items-center justify-between shadow-[0_0_15px_rgba(168,85,247,0.15)]">
                    <span className="text-[9.5px] font-bold font-sans text-purple-300 tracking-wider">보유 결정 파편 (Shards):</span>
                    <strong className="text-base text-yellow-300 font-mono animate-pulse">💎 {metaProgression.crystal_shards_total || 0}</strong>
                  </div>

                  <p className="text-[10px] text-gray-500 mb-4 font-mono leading-relaxed">
                    괴수를 물리쳐 획득한 결정 파편을 고대의 제단에 바쳐 영구적인 능력치를 개조하십시오. (레벨당 최대 5레벨)
                  </p>

                  <div className="space-y-3 font-mono text-[9px]">
                    {[
                      { 
                        key: "extra_max_hp", 
                        name: "체력 코어 증폭 (HP Core)", 
                        desc: "모든 런의 시작 생명력을 영구 확장 (+10 HP / lvl)", 
                        costBase: 30,
                        maxLvl: 5
                      },
                      { 
                        key: "shop_discount", 
                        name: "대장간 금화 공수 (Starter Gold)", 
                        desc: "모든 모험 돌파 시 시작 골드를 더 많이 보장 (+15 Gold / lvl)", 
                        costBase: 25,
                        maxLvl: 5
                      },
                      { 
                        key: "starting_card_slots", 
                        name: "결정 가루 자원 채굴 (Bonus Scraps)", 
                        desc: "모든 런 시작 시 영구 재공 급원 제공 (+3 모든 자원 / lvl)", 
                        costBase: 50,
                        maxLvl: 5
                      }
                    ].map((up) => {
                      const lvl = metaProgression.unlocked_upgrades[up.key as any] || 0;
                      const nextCost = (lvl + 1) * up.costBase;
                      const canBuy = (metaProgression.crystal_shards_total || 0) >= nextCost && lvl < up.maxLvl;

                      return (
                        <div key={up.key} className="p-2.5 rounded-lg border border-white/5 bg-black/40 flex flex-col gap-1.5 text-left">
                          <div className="flex justify-between items-center w-full">
                            <span className="text-white font-bold">{up.name}</span>
                            <span className="text-[8.5px] text-purple-400 font-bold">Lvl {lvl}/{up.maxLvl}</span>
                          </div>
                          <p className="text-[8.5px] text-gray-500 leading-tight">{up.desc}</p>
                          
                          {/* Visual progress gauge */}
                          <div className="w-full h-1 bg-black rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-purple-500 rounded-full"
                              style={{ width: `${(lvl / up.maxLvl) * 100}%` }}
                            />
                          </div>

                          <div className="flex justify-between items-center w-full pt-1">
                            <span className="text-[8px] text-gray-600">
                              {lvl >= up.maxLvl ? "MAX LEVEL" : `비용: 💎 ${nextCost} 파편`}
                            </span>
                            {lvl < up.maxLvl && (
                              <button
                                onClick={() => buyPermanentUpgrade(up.key as any)}
                                className={`px-2.5 py-0.5 rounded text-[8.5px] font-bold cursor-pointer transition-all ${
                                  canBuy 
                                    ? "bg-purple-900 hover:bg-purple-800 text-white border border-purple-500/30" 
                                    : "bg-gray-900 text-gray-600 border-transparent cursor-not-allowed"
                                }`}
                              >
                                능력 증폭
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="text-[8px] text-gray-600 font-mono text-center pt-3 mt-3 border-t border-white/5 leading-normal">
                  아키펙트 파편은 사망하거나 던전을 클리어할 때 누적 득점에 비례하여 지급됩니다.
                </div>
              </div>

            </div>

          </div>
        )}

        {screen === "GAMEPLAY" && activeRoom && (
          <div className="flex flex-col gap-4 animate-fade-in relative select-none">
            
            {/* Game viewport wrapper hosting GameCanvas and Absolute Hover Panels */}
            <div className="relative w-full rounded-2xl border-2 border-purple-950/70 bg-[#0e0a1a] shadow-[0_0_40px_rgba(103,58,183,0.25)] overflow-hidden min-h-[480px]">
              
              <GameCanvas 
                playerStats={playerStats}
                setPlayerStats={setPlayerStats}
                deck={deck}
                setDeck={setDeck}
                chamber={chamber}
                setChamber={setChamber}
                equippedParts={equippedParts}
                setEquippedParts={setEquippedParts}
                ownedParts={ownedParts}
                setOwnedParts={setOwnedParts}
                artifacts={artifacts}
                setArtifacts={setArtifacts}
                routeNodes={routeNodes}
                setRouteNodes={setRouteNodes}
                activeRoom={activeRoom}
                setActiveRoom={setActiveRoom}
                isBulletTime={isBulletTime}
                setIsBulletTime={setIsBulletTime}
                chamberCapacity={chamberCapacity}
                onPlayerDeath={handlePlayerDied}
                onVictory={handlePlayerVictory}
                activeStation={activeStation}
                setActiveStation={setActiveStation}
                dungeonMapOpen={dungeonMapOpen}
                setDungeonMapOpen={setDungeonMapOpen}
                selectedCharacter={selectedCharacter}
                difficultyLevel={difficultyLevel}
                isTutorial={isTutorial}
                isEndless={isEndless}
                setIsEndless={setIsEndless}
                saveActiveRun={saveActiveRun}
              />

              {/* Station Overlay: Whimsical Shop Merchant catalog pop-up */}
              {activeStation === "shop" && (
                <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-40 flex items-center justify-center p-4 animate-fade-in">
                  <div className="w-full max-w-3xl max-h-[92%] overflow-y-auto rounded-xl border border-teal-900 bg-[#06040a] p-2 shadow-2xl relative">
                    <button
                      onClick={() => setActiveStation(null)}
                      className="absolute top-4 right-4 z-50 px-3 py-1 bg-red-950 hover:bg-red-900 border border-red-700/50 text-red-100 text-xs font-mono font-bold rounded cursor-pointer transition-all"
                    >
                      거래 중단 (Close X)
                    </button>
                    <AdventureShop 
                      playerStats={playerStats}
                      setPlayerStats={setPlayerStats}
                      deck={deck}
                      setDeck={setDeck}
                      ownedParts={ownedParts}
                      setOwnedParts={setOwnedParts}
                      onCloseShop={() => setActiveStation(null)}
                    />
                  </div>
                </div>
              )}

              {/* Station Overlay: Ancient Weapon anvil Forge crafting pop-up */}
              {activeStation === "forge" && (
                <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-40 flex items-center justify-center p-4 animate-fade-in">
                  <div className="w-full max-w-3xl max-h-[92%] overflow-y-auto rounded-xl border border-yellow-900 bg-[#08050e] p-2 shadow-2xl relative">
                    <button
                      onClick={() => setActiveStation(null)}
                      className="absolute top-4 right-4 z-50 px-3 py-1 bg-red-950 hover:bg-red-900 border border-red-700/50 text-red-100 text-xs font-mono font-bold rounded cursor-pointer transition-all"
                    >
                      작업 중단 (Close X)
                    </button>
                    <BlacksmithForge 
                      playerStats={playerStats}
                      setPlayerStats={setPlayerStats}
                      equippedParts={equippedParts}
                      setEquippedParts={setEquippedParts}
                      ownedParts={ownedParts}
                      setOwnedParts={setOwnedParts}
                      artifacts={artifacts}
                      setArtifacts={setArtifacts}
                      onCloseForge={() => setActiveStation(null)}
                    />
                  </div>
                </div>
              )}

              {/* Station Overlay: Lore Tablet Runestone event panel dialog */}
              {activeStation === "event" && (
                <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-40 flex items-center justify-center p-4 animate-fade-in">
                  <div className="w-full max-w-xl max-h-[92%] overflow-y-auto rounded-xl border border-purple-900 bg-[#0c0514] p-4 shadow-2xl relative">
                    <AdventureEvent 
                      playerStats={playerStats}
                      setPlayerStats={setPlayerStats}
                      ownedParts={ownedParts}
                      setOwnedParts={setOwnedParts}
                      deck={deck}
                      setDeck={setDeck}
                      onCloseEvent={() => setActiveStation(null)}
                    />
                  </div>
                </div>
              )}

              {/* Concept Map Overlay modal: Toggled by pressing TAB or clicking HUD */}
              {dungeonMapOpen && (
                <div className="absolute inset-0 bg-black/90 backdrop-blur-sm z-40 flex flex-col items-center justify-center p-4 animate-fade-in">
                  <div className="w-full max-w-4xl max-h-[92%] overflow-y-auto rounded-xl border border-purple-500/20 bg-[#0a0614]/95 p-4 shadow-2xl relative">
                    
                    <button
                      onClick={() => setDungeonMapOpen(false)}
                      className="absolute top-4 right-4 z-50 px-3 py-1.5 bg-red-950 border border-red-800 text-red-100 font-mono font-black text-xs rounded hover:bg-red-900 transition-colors cursor-pointer"
                    >
                      지도 닫기 (TAB / ESC)
                    </button>

                    <div className="mb-4 text-center">
                      <span className="text-yellow-400 font-bold text-xs uppercase tracking-wide font-mono block">
                        🗺️ 실시간 결정 지리도 (Translucent Overlay)
                      </span>
                      <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                        경지 순간이동은 금화 균열 오류로 불가능합니다. 방 출구 대문(Gateway)으로 직접 캐릭터를 이동하십시오!
                      </p>
                    </div>

                    <DungeonMap 
                      rooms={routeNodes}
                      currentFloor={playerStats.floor}
                      selectedRoomId={activeRoom?.id || null}
                      onSelectRoom={(node) => {
                        // Notify player that click-teleporting is retired!
                        alert("방 사이는 순간이동하는 것이 아니라 연결 통로를 통해 직접 걸어가야 합니다. 전투 종료 후 생성되는 출구(Gateway)로 이동하십시오!");
                      }}
                    />
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {screen === "GAME_OVER" && (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-16 px-4 max-w-lg mx-auto font-mono">
            <div className="w-16 h-16 bg-red-950/40 border border-red-800 rounded-full flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-bounce">
              <Skull className="w-8 h-8 text-red-500" />
            </div>

            <h1 className="text-2xl font-black text-red-500 uppercase tracking-wider">심연의 융해패배 (Run Terminated)</h1>
            <p className="text-xs text-gray-500 mt-1 mb-6 uppercase">결정압을 견디지 못하고 마력 샷건 약실이 붕괴되었습니다.</p>
            
            {/* Elegant personal run record */}
            <div className="w-full bg-[#1c0e0b] border border-red-900/40 rounded-xl p-5 mb-8 text-left text-xs text-gray-300 space-y-2.5">
              <h3 className="text-red-400 font-black text-sm tracking-widest border-b border-red-950 pb-2 flex justify-between">
                <span>📊 이번 탐험 개인 기록</span>
                <span className="text-xs font-mono text-gray-500">Abyss Report</span>
              </h3>
              <div className="flex justify-between"><span>최종 누적 점수 (Score):</span><strong className="text-white text-sm">{playerStats.score} pts</strong></div>
              <div className="flex justify-between"><span>괴수 처치 수 (Kills):</span><strong className="text-white text-sm">{playerStats.kills}마리</strong></div>
              <div className="flex justify-between"><span>진입 게이트 (Floor):</span><strong className="text-white text-sm">Gate {playerStats.floor}</strong></div>
              <div className="flex justify-between"><span>최종 보유 크리스탈:</span><strong className="text-yellow-500 text-sm">{playerStats.gold} Crystals</strong></div>
            </div>

            <button
              onClick={startNewExploration}
              className="px-8 py-3.5 bg-red-950 border border-red-700 hover:bg-red-900 transition-all text-red-100 font-extrabold text-xs tracking-wider uppercase rounded-lg shadow-md cursor-pointer hover:scale-[1.03]"
            >
              새로운 사냥 작전 재개하기 (Restart Expedition)
            </button>
          </div>
        )}

        {screen === "VICTORY" && (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-16 px-4 max-w-xl mx-auto font-mono">
            <div className="w-16 h-16 bg-[#ea80fc]/20 border border-[#ea80fc] rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(234,128,252,0.4)] animate-bounce">
              <Sparkles className="w-8 h-8 text-pink-300" />
            </div>

            <h1 className="text-2xl md:text-3xl font-black text-purple-300 uppercase tracking-widest">🏆 전설적인 마령 황제 완전 토벌!</h1>
            <p className="text-xs text-gray-500 mt-1 mb-6 uppercase">GUARDIAN DECIMATED - IMMORTAL expedition COMPLETE!</p>
            
            <p className="text-gray-300 text-xs leading-relaxed mb-6 bg-[#090615] p-4 rounded-lg border border-purple-950">
              축하합니다! 당신은 마령 황제를 제압하고 심연의 핵 결정을 영구 정화하는데 성공했습니다. 
              유계 평원은 복구되었으며, 당신이 설계한 샷건 약실 FIFO 구성 시너지는 고대 영웅 명예의 전당 석판에 영구 기록됩니다.
            </p>

            {/* Victory personal run report */}
            <div className="w-full bg-[#0d091a] border border-purple-900/60 rounded-xl p-5 mb-8 text-left text-xs text-purple-200 space-y-2.5 shadow-2xl">
              <h3 className="text-[#c084fc] font-black text-sm tracking-widest border-b border-purple-950 pb-2 flex justify-between">
                <span>👑 위대한 탐정 개인 수립 기록</span>
                <span className="text-xs font-mono text-gray-500">Legendary Stats</span>
              </h3>
              <div className="flex justify-between"><span>최종 누적 전설 점수 (Score):</span><strong className="text-white text-sm">{playerStats.score} pts (클리어 보너스 +5000!)</strong></div>
              <div className="flex justify-between"><span>토벌한 괴수 수 (Kills):</span><strong className="text-white text-sm">{playerStats.kills}마리</strong></div>
              <div className="flex justify-between"><span>돌파한 게이트 수 (Floors):</span><strong className="text-white text-sm">Gate {playerStats.floor} (All Cleared)</strong></div>
              <div className="flex justify-between"><span>최종 소지 골드 크리스탈:</span><strong className="text-yellow-400 text-sm">{playerStats.gold} Crystals</strong></div>
            </div>

            <button
              onClick={startNewExploration}
              className="px-8 py-3.5 bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs tracking-wider uppercase rounded-lg transition-all shadow-md cursor-pointer hover:scale-[1.03]"
            >
              더 높은 차원으로 재도전하기 (Another Run)
            </button>
          </div>
        )}

      </main>

      {/* Manual startups onboarding guide */}
      {showGuide && (
        <StartGuideModal onClose={() => setShowGuide(false)} />
      )}
    </div>
  );
}

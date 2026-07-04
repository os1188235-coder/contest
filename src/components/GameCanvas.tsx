/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState } from "react";
import { 
  BulletCard, 
  ShotgunPart, 
  ElementType,
  Rarity, 
  SlotType, 
  PlayerStats,
  RoomNode,
  RoomType,
  Artifact
} from "../types";
import { BASE_CARDS, BASE_PARTS, BASE_ARTIFACTS } from "../data";
import { Play, Sparkles, Shield, Compass, Swords, HelpCircle, ShoppingBag, Wrench, Gem, Coffee, X, Flame, Snowflake, Zap, Coins, Heart, Milestone, Activity, RotateCcw, BookOpen } from "lucide-react";

const shuffleArray = <T,>(array: T[]): T[] => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};
import ReloadDeck from "./ReloadDeck";

interface GameCanvasProps {
  playerStats: PlayerStats;
  setPlayerStats: React.Dispatch<React.SetStateAction<PlayerStats>>;
  deck: BulletCard[];
  setDeck: React.Dispatch<React.SetStateAction<BulletCard[]>>;
  chamber: BulletCard[];
  setChamber: React.Dispatch<React.SetStateAction<BulletCard[]>>;
  equippedParts: ShotgunPart[];
  setEquippedParts: React.Dispatch<React.SetStateAction<ShotgunPart[]>>;
  ownedParts: ShotgunPart[];
  setOwnedParts: React.Dispatch<React.SetStateAction<ShotgunPart[]>>;
  artifacts: Artifact[];
  setArtifacts: React.Dispatch<React.SetStateAction<Artifact[]>>;
  routeNodes: RoomNode[];
  setRouteNodes: React.Dispatch<React.SetStateAction<RoomNode[]>>;
  activeRoom: RoomNode;
  setActiveRoom: (room: RoomNode | null) => void;
  isBulletTime: boolean;
  setIsBulletTime: (active: boolean) => void;
  chamberCapacity: number;
  onPlayerDeath: () => void;
  onVictory: () => void;
  activeStation: null | "shop" | "forge" | "event";
  setActiveStation: (st: null | "shop" | "forge" | "event") => void;
  dungeonMapOpen: boolean;
  setDungeonMapOpen: (open: boolean) => void;
  selectedCharacter: "EXPLORER" | "SENTINEL" | "OVERSEER";
  difficultyLevel: number;
  isTutorial: boolean;
  isEndless: boolean;
  setIsEndless: (val: boolean) => void;
  saveActiveRun: (updatedStats: PlayerStats, currentChamber: BulletCard[], currentDeck: BulletCard[], currentEquipped: ShotgunPart[], currentOwned: ShotgunPart[], currentArtifacts: Artifact[], currentNodes: RoomNode[], currentRoomId: string | null) => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  isShellCasing?: boolean;
  angle?: number;
}

interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  vy: number;
  life: number;
}

interface Obstacle {
  x: number;
  y: number;
  w: number;
  h: number;
  type: "rock" | "crate" | "crystal_wall" | "torch" | "gold_node" | "explosive_crystal" | "poison_pool" | "magic_circle";
  hp?: number;
}

interface GameEnemy {
  id: string;
  type: "melee" | "charger" | "archer" | "caster" | "kamikaze" | "shield" | "summoner" | "summoned_bug" | "boss";
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  speed: number;
  radius: number;
  color: string;
  shootCooldown: number;
  hitFlashFrames?: number;
  chargeTimer?: number;
  chargeCooldown?: number;
  isCharging?: boolean;
  targetChargeX?: number;
  targetChargeY?: number;
  summonCount?: number;
  shieldAngle?: number;
}

interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  damage: number;
  isEnemy: boolean;
  element: ElementType;
}

interface GroundItem {
  id: string;
  x: number;
  y: number;
  radius: number;
  type: "gold" | "scrap" | "heal" | "card" | "part" | "relic";
  name: string;
  color: string;
  description?: string;
  cardPayload?: BulletCard;
  partPayload?: ShotgunPart;
  relicPayload?: Artifact;
  cardGroup?: string;
}

interface Station {
  id: string;
  x: number;
  y: number;
  radius: number;
  type: "chest" | "merchant" | "anvil" | "runestone";
  name: string;
  color: string;
  opened?: boolean;
}

interface Gateway {
  id: string;
  x: number;
  y: number;
  radius: number;
  targetNode: RoomNode;
  name: string;
  color: string;
}

export default function GameCanvas({
  playerStats,
  setPlayerStats,
  deck,
  setDeck,
  chamber,
  setChamber,
  equippedParts,
  setEquippedParts,
  ownedParts,
  setOwnedParts,
  artifacts,
  setArtifacts,
  routeNodes,
  setRouteNodes,
  activeRoom,
  setActiveRoom,
  isBulletTime,
  setIsBulletTime,
  chamberCapacity,
  onPlayerDeath,
  onVictory,
  activeStation,
  setActiveStation,
  dungeonMapOpen,
  setDungeonMapOpen,
  selectedCharacter,
  difficultyLevel,
  isTutorial,
  isEndless,
  setIsEndless,
  saveActiveRun
}: GameCanvasProps) {
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const ZOOM_FACTOR = 0.9;

  // Dynamic canvas width and height matching outer container
  const [dimensions, setDimensions] = useState({ width: 900, height: 520 });

  // Game Feel Options
  const [screenShakeOption, setScreenShakeOption] = useState<"NONE" | "LOW" | "NORMAL" | "HIGH">("NORMAL");
  const [hitStopEnabled, setHitStopEnabled] = useState<boolean>(true);

  // Victory / Cleared overlay typographic announcements
  const [showClearBanner, setShowClearBanner] = useState<boolean>(false);
  const [clearBannerType, setClearBannerType] = useState<string>("");

  // Delayed yellow HP decay state
  const [delayedHpPct, setDelayedHpPct] = useState<number>(100);

  useEffect(() => {
    const targetPct = (playerStats.hp / playerStats.maxHp) * 100;
    const timer = setTimeout(() => {
      if (delayedHpPct > targetPct) {
        setDelayedHpPct(Math.max(targetPct, delayedHpPct - 0.75));
      } else if (delayedHpPct < targetPct) {
        setDelayedHpPct(targetPct); // snap upwards on heal
      }
    }, 20);
    return () => clearTimeout(timer);
  }, [playerStats.hp, playerStats.maxHp, delayedHpPct]);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const width = entries[0].contentRect.width || 900;
      const height = 520; // Expanded height for combat field-of-view gameplay
      setDimensions({
        width: Math.floor(width),
        height: Math.floor(height)
      });
    });
    observer.observe(containerRef.current);
    return () => {
      observer.disconnect();
    };
  }, []);

  // Corridor travel state
  const [isCorridor, setIsCorridor] = useState(false);
  const [corridorTarget, setCorridorTarget] = useState<RoomNode | null>(null);

  // In-Room item comparison details states
  const [inspectingItem, setInspectingItem] = useState<GroundItem | null>(null);

  // Interactive label tooltips
  const [tooltip, setTooltip] = useState<string>("");

  // Slay the Spire Deck Systems
  const [hand, setHand] = useState<BulletCard[]>([]);

  // Draw hand cards when bullet time/reloading mode starts
  useEffect(() => {
    if (isBulletTime) {
      const s = stateRef.current;
      s.mouse.isDown = false; // Reset mouse down state upon entering reload phase to prevent stuck autofire
      const countNeeded = 5 - hand.length;
      if (countNeeded > 0) {
        let currentDraw = [...s.drawPile];
        let currentDiscard = [...s.discardPile];
        const drawn: BulletCard[] = [];

        for (let i = 0; i < countNeeded; i++) {
          if (currentDraw.length === 0) {
            if (currentDiscard.length === 0) {
              break;
            }
            currentDraw = shuffleArray(currentDiscard);
            currentDiscard = [];

            s.floatingTexts.push({
              id: "rs_" + Math.random(),
              x: s.player.x,
              y: s.player.y - 35,
              text: "🔄 버린 패 셔플 완료! (Deck Recycled)",
              color: "#c084fc",
              vy: -1.2,
              life: 75
            });
          }
          const card = currentDraw.pop();
          if (card) {
            drawn.push(card);
          }
        }
        s.drawPile = currentDraw;
        s.discardPile = currentDiscard;
        setHand((prev) => [...prev, ...drawn]);
      }
    }
  }, [isBulletTime]);

  const loadCardFromHandIdx = (index: number) => {
    const card = hand[index];
    const s = stateRef.current;
    
    // Check space constraints in the barrel chamber queue
    const currentSpace = chamber.reduce((sum, c) => sum + c.space, 0);
    if (currentSpace + card.space > chamberCapacity) {
      s.floatingTexts.push({
        id: `full_${Math.random()}`,
        x: s.player.x,
        y: s.player.y - 30,
        text: `⚠️ 약실 공간 부족! [필요: ${card.space}칸, 잔여: ${chamberCapacity - currentSpace}칸]`,
        color: "#f87171",
        vy: -1.0,
        life: 65
      });
      return;
    }

    // Load to shotgun chamber FIFO array
    setChamber((prev) => [...prev, { ...card, id: card.id + "_" + Math.random() }]);

    // Remove from active hand array
    setHand((prev) => {
      const next = [...prev];
      next.splice(index, 1);
      return next;
    });
  };

  const autoReloadChamber = () => {
    const s = stateRef.current;
    let tempChamber = [...chamber];
    let tempHand = [...hand];
    let added = false;
    
    // 1. Load from hand first
    for (let i = 0; i < tempHand.length; i++) {
      const card = tempHand[i];
      const currentSpace = tempChamber.reduce((sum, c) => sum + c.space, 0);
      if (currentSpace + card.space <= chamberCapacity) {
        tempChamber.push({ ...card, id: card.id + "_" + Math.random() });
        tempHand.splice(i, 1);
        i--;
        added = true;
      }
    }
    
    // 2. Load from draw pile
    let currentDraw = [...s.drawPile];
    let currentDiscard = [...s.discardPile];
    while (tempChamber.reduce((sum, c) => sum + c.space, 0) < chamberCapacity) {
      if (currentDraw.length === 0) {
        if (currentDiscard.length === 0) break;
        currentDraw = shuffleArray(currentDiscard);
        currentDiscard = [];
      }
      const card = currentDraw.pop();
      if (card) {
        const currentSpace = tempChamber.reduce((sum, c) => sum + c.space, 0);
        if (currentSpace + card.space <= chamberCapacity) {
          tempChamber.push({ ...card, id: card.id + "_" + Math.random() });
          added = true;
        } else {
          currentDraw.push(card);
          break;
        }
      } else {
        break;
      }
    }
    
    s.drawPile = currentDraw;
    s.discardPile = currentDiscard;
    setChamber(tempChamber);
    setHand(tempHand);
    
    if (added) {
      s.floatingTexts.push({
        id: "auto_load_" + Math.random(),
        x: s.player.x,
        y: s.player.y - 40,
        text: "⚡ 일괄 신속 장전 완료! (Auto Filled)",
        color: "#10b981",
        vy: -1.3,
        life: 50
      });
    }
  };

  const discardAndRedrawHand = () => {
    const s = stateRef.current;

    // Send active hand to discard pile
    s.discardPile = [...s.discardPile, ...hand];

    // Redraw a fresh set of 5 cards
    let currentDraw = [...s.drawPile];
    let currentDiscard = [...s.discardPile];
    const drawn: BulletCard[] = [];

    const drawCount = 5;
    for (let i = 0; i < drawCount; i++) {
      if (currentDraw.length === 0) {
        if (currentDiscard.length === 0) {
          break;
        }
        currentDraw = shuffleArray(currentDiscard);
        currentDiscard = [];

        s.floatingTexts.push({
          id: "rs_redraw_" + Math.random(),
          x: s.player.x,
          y: s.player.y - 35,
          text: "🔄 버린 패를 모아 덱 셔플! (Deck Recycled)",
          color: "#c084fc",
          vy: -1.2,
          life: 75
        });
      }
      const card = currentDraw.pop();
      if (card) {
        drawn.push(card);
      }
    }

    s.drawPile = currentDraw;
    s.discardPile = currentDiscard;
    setHand(drawn);
  };

  // Game Engine State stored in Ref for direct 60fps loop callback performance
  const stateRef = useRef({
    player: {
      x: 400,
      y: 350,
      vx: 0,
      vy: 0,
      radius: 11,
      direction: 1, // 1: Right, -1: Left
      angle: 0, // gun aim angle
      rollCooldown: 0,
      rollDuration: 0,
      rollSpeed: 8,
      rollVx: 0,
      rollVy: 0,
      isInvulnerable: false,
      fireCooldown: 0,
      speedBuffDuration: 0
    },
    camera: { x: 0, y: 0 },
    keys: { w: false, a: false, s: false, d: false, Space: false },
    mouse: { x: 0, y: 0, isDown: false },
    projectiles: [] as Projectile[],
    enemies: [] as GameEnemy[],
    particles: [] as Particle[],
    floatingTexts: [] as FloatingText[],
    obstacles: [] as Obstacle[],
    groundItems: [] as GroundItem[],
    stations: [] as Station[],
    gateways: [] as Gateway[],
    roomBounds: { w: 1200, h: 1000 },
    enemiesKilledInThisRoom: 0,
    totalEnemiesSpawned: 0,
    waveCount: 0,
    maxWaves: 2,
    nextWaveTimer: 0,
    combatStart: false,
    combatClearedTriggered: false,
    drawPile: [] as BulletCard[],
    discardPile: [] as BulletCard[],
    lastFiredElement: null as ElementType | null,
    comboCount: 0,
    screenShake: 0,
    hitStopFrames: 0,
    recoilOffset: 0,
    lastHitTime: 0
  });

  const getShotgunStats = () => {
    let damageMult = 1.0;
    let fireRateMult = 1.0;
    let spreadMult = 1.0;
    let recoilMult = 1.0;
    equippedParts.forEach((p) => {
      if (p.statsMultiplier.damage) damageMult *= p.statsMultiplier.damage;
      if (p.statsMultiplier.fireRate) fireRateMult *= p.statsMultiplier.fireRate;
      if (p.statsMultiplier.spread) spreadMult *= p.statsMultiplier.spread;
      if (p.statsMultiplier.recoil) recoilMult *= p.statsMultiplier.recoil;
    });
    return { damageMult, fireRateMult, spreadMult, recoilMult };
  };

  const generateDungeonObstacles = (w: number, h: number, type: RoomType) => {
    const obs: Obstacle[] = [];
    
    // Density calculation:
    // Small: 6-9 obstacles, Medium: 10-14, Large/Elite/Boss: 15-20 obstacles
    let targetCount = 12;
    if (type === RoomType.BOSS) {
      targetCount = 7; // slightly fewer for boss battle area clearance
    } else {
      const area = w * h;
      if (area < 600000) targetCount = 6 + Math.floor(Math.random() * 4);
      else if (area < 900000) targetCount = 10 + Math.floor(Math.random() * 5);
      else targetCount = 15 + Math.floor(Math.random() * 6);
    }
    
    // 1. Central Obstacle (Rule: at least 1-2 medium pillars near center)
    const centerX = w / 2;
    const centerY = h / 2;
    obs.push({
      x: centerX - 25,
      y: centerY - 25,
      w: 50,
      h: 50,
      type: "crystal_wall" // Blocks bullets (Full Cover)
    });
    
    if (type !== RoomType.BOSS && Math.random() < 0.65) {
      obs.push({
        x: centerX + 120,
        y: centerY - 70,
        w: 45,
        h: 45,
        type: "rock" // Partial Cover
      });
      obs.push({
        x: centerX - 165,
        y: centerY + 60,
        w: 45,
        h: 45,
        type: "rock"
      });
    }

    // Generate remaining obstacles procedurally
    let spawned = obs.length;
    let attempts = 0;
    while (spawned < targetCount && attempts < 150) {
      attempts++;
      const ox = 100 + Math.random() * (w - 200);
      const oy = 100 + Math.random() * (h - 200);
      let ow = 35 + Math.floor(Math.random() * 20);
      let oh = 35 + Math.floor(Math.random() * 20);
      
      // Select type: crystal_wall (full cover), rock/crate (partial cover), or hazard nodes
      let otype: "rock" | "crate" | "crystal_wall" | "explosive_crystal" | "poison_pool" | "magic_circle" = "rock";
      const roll = Math.random();
      if (roll < 0.25) {
        otype = "crystal_wall";
      } else if (roll < 0.50) {
        otype = "crate";
      } else if (roll < 0.65) {
        otype = "explosive_crystal";
      } else if (roll < 0.82) {
        otype = "poison_pool";
      } else {
        otype = "magic_circle";
      }

      if (otype === "poison_pool" || otype === "magic_circle") {
        ow = 48;
        oh = 48;
      } else if (otype === "explosive_crystal") {
        ow = 28;
        oh = 28;
      }

      // Check distance from player initial spawn (500, 550) to prevent stuck
      const distToSpawn = Math.sqrt(Math.pow(ox + ow/2 - 500, 2) + Math.pow(oy + oh/2 - 550, 2));
      if (distToSpawn < 110) continue;

      // Check spacing with existing obstacles (ensure zigzag clear pathways)
      let overlap = false;
      for (const existing of obs) {
        if (!(ox + ow + 35 < existing.x || ox > existing.x + existing.w + 35 ||
              oy + oh + 35 < existing.y || oy > existing.y + existing.h + 35)) {
          overlap = true;
          break;
        }
      }

      if (!overlap) {
        obs.push({
          x: ox,
          y: oy,
          w: ow,
          h: oh,
          type: otype,
          hp: otype === "explosive_crystal" ? 15 : undefined
        });
        spawned++;
      }
    }

    return obs;
  };

  const setupRoom = () => {
    const s = stateRef.current;
    s.projectiles = [];
    s.enemies = [];
    s.particles = [];
    s.floatingTexts = [];
    s.obstacles = [];
    s.groundItems = [];
    s.stations = [];
    s.gateways = [];
    s.enemiesKilledInThisRoom = 0;
    s.totalEnemiesSpawned = 0;
    s.combatStart = false;
    s.combatClearedTriggered = false;

    // Slay the Spire Deck Initial Setup
    s.drawPile = shuffleArray(deck);
    s.discardPile = [];
    setHand([]);

    setIsCorridor(false);
    setInspectingItem(null);

    if (isCorridor) {
      // Setup corridor hallway bounds
      s.roomBounds = { w: 1200, h: 320 };
      s.player.x = 80;
      s.player.y = 160;
      s.player.vx = 0;
      s.player.vy = 0;

      // Spawn some corridor lights/torches and crystal geodes
      s.obstacles.push({ x: 200, y: 15, w: 20, h: 10, type: "torch" });
      s.obstacles.push({ x: 500, y: 15, w: 20, h: 10, type: "torch" });
      s.obstacles.push({ x: 800, y: 15, w: 20, h: 10, type: "torch" });

      s.obstacles.push({ x: 300, y: 180, w: 30, h: 30, type: "rock" });
      s.obstacles.push({ x: 700, y: 80, w: 30, h: 30, type: "rock" });

      // Spawn breakable ore block
      s.obstacles.push({ x: 450, y: 220, w: 25, h: 25, type: "gold_node", hp: 10 });
      s.obstacles.push({ x: 880, y: 60, w: 25, h: 25, type: "gold_node", hp: 10 });

      // Spawn gateway portal at end of corridor!
      if (corridorTarget) {
        s.gateways.push({
          id: "corridor_portal",
          x: 1140,
          y: 160,
          radius: 35,
          targetNode: corridorTarget,
          name: corridorTarget.type === RoomType.BOSS ? "⚠️ 보스 결전장" : `➡️ 다음 구역 [${corridorTarget.type}]`,
          color: "#9c27b0"
        });
      }
      return;
    }

    // Standard Room Setup based on active room type
    s.roomBounds = { w: 1000, h: 800 };
    s.player.x = 500;
    s.player.y = 550;
    s.player.vx = 0;
    s.player.vy = 0;

    // Procedural obstacle layout generation!
    s.obstacles = generateDungeonObstacles(1000, 800, activeRoom.type);

    // Room specific creations
    if (activeRoom.type === RoomType.TREASURE) {
      s.stations.push({
        id: "room_chest",
        x: 500,
        y: 300,
        radius: 25,
        type: "chest",
        name: "🎁 보물 봉고상자",
        color: "#ffd700",
        opened: false
      });
    } else if (activeRoom.type === RoomType.SHOP) {
      s.stations.push({
        id: "room_merchant",
        x: 500,
        y: 280,
        radius: 20,
        type: "merchant",
        name: "🛒 방랑 마력 정령 (상인)",
        color: "#4caf50"
      });
      spawnPassiveGates();
    } else if (activeRoom.type === RoomType.FORGE) {
      s.stations.push({
        id: "room_anvil",
        x: 500,
        y: 280,
        radius: 25,
        type: "anvil",
        name: "⚙️ 대장간 제단 (Anvil)",
        color: "#ffc107"
      });
      spawnPassiveGates();
    } else if (activeRoom.type === RoomType.EVENT) {
      s.stations.push({
        id: "room_runestone",
        x: 500,
        y: 280,
        radius: 22,
        type: "runestone",
        name: "🔮 미지의 결정 룬레이",
        color: "#9c27b0"
      });
      spawnPassiveGates();
    } else {
      // COMBAT / ELITE / BOSS rooms
      s.combatStart = true;
      s.waveCount = 0;
      s.maxWaves = activeRoom.type === RoomType.BOSS ? 1 : activeRoom.type === RoomType.ELITE ? 2 : 2;
      spawnMonsterWave();
    }
  };

  const spawnPassiveGates = () => {
    const s = stateRef.current;
    // For non-hostile rooms, doors are instantly open!
    activeRoom.connections.forEach((targetId, idx) => {
      const targetNode = routeNodes.find((n) => n.id === targetId);
      if (!targetNode) return;

      const doorX = activeRoom.connections.length === 1 ? 500 : 350 + idx * 300;
      s.gateways.push({
        id: "gate_" + targetId,
        x: doorX,
        y: 80,
        radius: 30,
        targetNode,
        name: getRoomNameKorean(targetNode.type),
        color: getRoomColor(targetNode.type)
      });
    });
  };

  const getRoomNameKorean = (type: RoomType) => {
    switch (type) {
      case RoomType.COMBAT: return "⚔️ 일반 전투방 Entry";
      case RoomType.ELITE: return "😈 정예 엘리트 Entry";
      case RoomType.BOSS: return "💀 수호자 거인 BOSS";
      case RoomType.TREASURE: return "🎁 고대 보물 가락";
      case RoomType.SHOP: return "🛒 마벽 정령 상선";
      case RoomType.FORGE: return "⚙️ 무기 세공 연마";
      case RoomType.EVENT: return "🔮 모종 미지의 룬";
    }
  };

  const getRoomColor = (type: RoomType) => {
    switch (type) {
      case RoomType.COMBAT: return "#c084fc";
      case RoomType.ELITE: return "#e879f9";
      case RoomType.BOSS: return "#f87171";
      case RoomType.TREASURE: return "#facc15";
      case RoomType.SHOP: return "#34d399";
      case RoomType.FORGE: return "#fb923c";
      case RoomType.EVENT: return "#f472b6";
    }
  };

  const spawnMonsterWave = () => {
    const s = stateRef.current;
    s.waveCount++;
    if (s.waveCount > s.maxWaves) {
      triggerRoomDungeonClear();
      return;
    }

    const isBoss = activeRoom.type === RoomType.BOSS;
    const isElite = activeRoom.type === RoomType.ELITE;
    const count = isBoss ? 1 : isElite ? 4 + playerStats.floor * 2 : 3 + playerStats.floor;

    s.totalEnemiesSpawned += count;

    let difficultyHpMult = 1.0;
    let difficultySpeedMult = 1.0;
    if (difficultyLevel === 1) {
      difficultyHpMult = 1.25;
      difficultySpeedMult = 1.1;
    } else if (difficultyLevel === 2) {
      difficultyHpMult = 1.6;
      difficultySpeedMult = 1.25;
    } else if (difficultyLevel === 3) {
      difficultyHpMult = 2.1;
      difficultySpeedMult = 1.4;
    }

    if (isBoss) {
      const bHp = Math.round((300 + playerStats.floor * 220) * difficultyHpMult);
      s.enemies.push({
        id: "boss_mob",
        type: "boss",
        x: 500,
        y: 200,
        vx: 0,
        vy: 0,
        hp: bHp,
        maxHp: bHp,
        speed: 1.0 * difficultySpeedMult,
        radius: 45,
        color: "#f87171",
        shootCooldown: 80,
        hitFlashFrames: 0
      });
    } else {
      for (let i = 0; i < count; i++) {
        const side = Math.random() < 0.5;
        const ex = side ? 100 + Math.random() * 200 : 700 + Math.random() * 200;
        const ey = 150 + Math.random() * 200;
        
        // Randomly roll between: melee (25%), archer (20%), charger (15%), caster (15%), kamikaze (15%), shield (10%)
        let etype: "melee" | "charger" | "archer" | "caster" | "kamikaze" | "shield" | "summoner" = "melee";
        const roll = Math.random();
        if (roll < 0.25) {
          etype = "melee";
        } else if (roll < 0.45) {
          etype = "archer";
        } else if (roll < 0.60) {
          etype = "charger";
        } else if (roll < 0.75) {
          etype = "caster";
        } else if (roll < 0.85) {
          etype = "kamikaze";
        } else if (roll < 0.93) {
          etype = "shield";
        } else {
          etype = "summoner";
        }

        // Limit advanced mages on Floor 1 to keep it accessible
        if (playerStats.floor === 1 && (etype === "caster" || etype === "summoner")) {
          etype = Math.random() < 0.6 ? "melee" : "archer";
        }

        const eHp = Math.round((20 + playerStats.floor * 15) * difficultyHpMult);
        
        // Custom stats and colors based on type
        let rColor = "#a855f7";
        let radius = 14;
        let baseSpeed = 1.6;
        if (etype === "melee") {
          rColor = "#c084fc"; // purple beast
          radius = 15;
          baseSpeed = 1.15; // 75% speed
        } else if (etype === "archer") {
          rColor = "#3b82f6"; // blue marksman
          radius = 13;
          baseSpeed = 1.0; // 65% speed
        } else if (etype === "charger") {
          rColor = "#f43f5e"; // red charging bull
          radius = 17;
          baseSpeed = 1.05; // 70% speed
        } else if (etype === "caster") {
          rColor = "#ec4899"; // pink wizard
          radius = 13;
          baseSpeed = 0.9; // 60% speed
        } else if (etype === "kamikaze") {
          rColor = "#fb923c"; // orange firebug
          radius = 11;
          baseSpeed = 1.25; // 80% speed
        } else if (etype === "shield") {
          rColor = "#64748b"; // steel shield monster
          radius = 16;
          baseSpeed = 1.0; // 65% speed
        } else if (etype === "summoner") {
          rColor = "#10b981"; // green bug breeder
          radius = 15;
          baseSpeed = 0.8; // 55% speed
        }

        s.enemies.push({
          id: `m_${s.waveCount}_${i}`,
          type: etype,
          x: ex,
          y: ey,
          vx: 0,
          vy: 0,
          hp: eHp,
          maxHp: eHp,
          speed: baseSpeed * difficultySpeedMult,
          radius: radius,
          color: rColor,
          shootCooldown: 40 + Math.random() * 60,
          hitFlashFrames: 0
        });
      }
    }
  };

  const triggerRoomDungeonClear = () => {
    const s = stateRef.current;
    s.combatClearedTriggered = true;
    
    // Update routeNodes state so this room is clear
    setRouteNodes((prev) => prev.map((n) => n.id === activeRoom.id ? { ...n, clear: true } : n));

    // Show beautiful typographic room clear alert banner!
    if (activeRoom.type === RoomType.BOSS || activeRoom.type === RoomType.ELITE) {
      setClearBannerType(activeRoom.type === RoomType.BOSS ? "💀 BOSS CONQUERED" : "😈 ELITE CONQUERED");
      setShowClearBanner(true);
      setTimeout(() => setShowClearBanner(false), 3200);
    } else {
      setClearBannerType("⚔️ AREA CLEARED");
      setShowClearBanner(true);
      setTimeout(() => setShowClearBanner(false), 2400);
    }

    // Scatter small bonus Gold and scrap directly in room!
    const itemsCount = 3 + Math.floor(Math.random() * 3);
    for (let c = 0; c < itemsCount; c++) {
      s.groundItems.push({
        id: `g_gold_${c}_${Math.random()}`,
        x: 350 + Math.random() * 300,
        y: 350 + Math.random() * 150,
        radius: 8,
        type: "gold",
        name: "금화 크리스탈 (Crystal Gold)",
        color: "#fbbf24"
      });
    }
    // Drop card rewards in the center (Choose 1 out of 3, picking one vanishes others)
    const cardGroupToken = "combat_reward_" + Math.random();
    for (let k = 0; k < 3; k++) {
      const rolledCard = BASE_CARDS[Math.floor(Math.random() * BASE_CARDS.length)];
      s.groundItems.push({
        id: `reward_card_${k}`,
        x: 350 + k * 150,
        y: 400,
        radius: 12,
        type: "card",
        name: `${rolledCard.name}`,
        color: rolledCard.color,
        description: rolledCard.description,
        cardPayload: rolledCard,
        cardGroup: cardGroupToken
      });
    }

    s.floatingTexts.push({
      id: "rm_cl",
      x: 500,
      y: 250,
      text: "✨ 구역 점령 성공! 결정물 수집!",
      color: "#4ade80",
      vy: -0.5,
      life: 80
    });
  };

  // Trigger doors when card choice is claimed
  const handleCardLootedAndOpenExits = () => {
    const s = stateRef.current;
    
    // Check if boss was cleared! If so, trigger Victory screen directly!
    if (activeRoom.type === RoomType.BOSS) {
      onVictory();
      return;
    }

    // Open gateways
    activeRoom.connections.forEach((targetId, idx) => {
      const targetNode = routeNodes.find((n) => n.id === targetId);
      if (!targetNode) return;

      const doorX = activeRoom.connections.length === 1 ? 550 : 350 + idx * 300;
      s.gateways.push({
        id: "combat_gate_" + targetId,
        x: doorX,
        y: 80,
        radius: 30,
        targetNode,
        name: getRoomNameKorean(targetNode.type),
        color: getRoomColor(targetNode.type)
      });
    });

    s.floatingTexts.push({
      id: "door_op",
      x: 500,
      y: 200,
      text: "🚪 심연으로 향하는 게이트 대문이 기어이 열렸습니다!",
      color: "#c084fc",
      vy: -0.6,
      life: 80
    });
  };

  // Open Treasure chest
  const triggerOpenChest = (st: Station) => {
    const s = stateRef.current;
    st.opened = true;
    st.color = "#451a03"; // darkened empty chest
    
    // Splatter loot
    const bonusGold = 40 + Math.floor(Math.random() * 40);
    s.groundItems.push({
      id: `chest_pot_${Math.random()}`,
      x: st.x - 60,
      y: st.y + 60,
      radius: 9,
      type: "gold",
      name: `대형 크리스탈 골드 (+${bonusGold})`,
      color: "#f59e0b"
    });

    // Splatter 1 high tier card
    const rolledCard = BASE_CARDS[2 + Math.floor(Math.random() * (BASE_CARDS.length - 2))];
    s.groundItems.push({
      id: `chest_card_${Math.random()}`,
      x: st.x,
      y: st.y + 70,
      radius: 12,
      type: "card",
      name: rolledCard.name,
      color: rolledCard.color,
      description: rolledCard.description,
      cardPayload: rolledCard
    });

    // Splatter 1 high tier part
    const rolledPart = BASE_PARTS[Math.floor(Math.random() * BASE_PARTS.length)];
    s.groundItems.push({
      id: `chest_part_${Math.random()}`,
      x: st.x + 60,
      y: st.y + 60,
      radius: 12,
      type: "part",
      name: rolledPart.name,
      color: "#06b6d4",
      description: rolledPart.description,
      partPayload: rolledPart
    });

    // Splatter random relic
    const rolledRelic = BASE_ARTIFACTS[Math.floor(Math.random() * BASE_ARTIFACTS.length)];
    s.groundItems.push({
      id: `chest_relic_${Math.random()}`,
      x: st.x + 100,
      y: st.y + 30,
      radius: 12,
      type: "relic",
      name: rolledRelic.name,
      color: "#ca8a04",
      description: rolledRelic.description,
      relicPayload: rolledRelic
    });

    // Mark room clear as soon as chest is broken open
    setRouteNodes((prev) => prev.map((n) => n.id === activeRoom.id ? { ...n, clear: true } : n));
    spawnPassiveGates();

    s.floatingTexts.push({
      id: "chest_tr",
      x: st.x,
      y: st.y - 40,
      text: "💥 유물 봉인 해제! 전리품 살포!",
      color: "#fbbf24",
      vy: -1.0,
      life: 70
    });
  };

  // Shoot projectile!
  const fireShotgun = () => {
    const s = stateRef.current;
    if (s.player.fireCooldown > 0) return;
    if (chamber.length === 0) {
      // dry fire trigger bullet time reload immediately!
      setIsBulletTime(true);
      return;
    }

    const { damageMult, fireRateMult, spreadMult, recoilMult } = getShotgunStats();

    // Consume bullet FIFO queue
    const activeBullet = chamber[0];
    const remainingChamber = chamber.slice(1);
    setChamber(remainingChamber);

    // Push fired cartridge to Slay the Spire discard pile
    s.discardPile.push(activeBullet);

    // Element combo calculation!
    let comboBonusText = "";
    let comboDamageMultiplier = 1.0;
    
    // Check if same element
    if (s.lastFiredElement === activeBullet.element) {
      s.comboCount++;
    } else {
      // Different element! Check for hybrid combo reaction before resetting!
      if (s.lastFiredElement) {
        const e1 = s.lastFiredElement;
        const e2 = activeBullet.element;
        
        // 1. Thermal Shock (FIRE + ICE)
        if ((e1 === ElementType.FIRE && e2 === ElementType.ICE) || (e1 === ElementType.ICE && e2 === ElementType.FIRE)) {
          comboBonusText = "💥 열충격! (Thermal Shock) +60 고정피해";
          s.enemies.forEach((enemy) => {
            enemy.hp -= 60;
            s.floatingTexts.push({
              id: `shock_${Math.random()}`,
              x: enemy.x,
              y: enemy.y - 30,
              text: "열충격 -60",
              color: "#f43f5e",
              vy: -1.2,
              life: 40
            });
            for (let q = 0; q < 4; q++) {
              s.particles.push({
                x: enemy.x, y: enemy.y, vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6,
                color: "#ff4e00", size: 3, life: 20, maxLife: 20
              });
              s.particles.push({
                x: enemy.x, y: enemy.y, vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6,
                color: "#06b6d4", size: 3, life: 20, maxLife: 20
              });
            }
          });
        }
        // 2. Void Spark (LIGHTNING + VOID)
        else if ((e1 === ElementType.LIGHTNING && e2 === ElementType.VOID) || (e1 === ElementType.VOID && e2 === ElementType.LIGHTNING)) {
          comboBonusText = "⚡ 공허 감전! (Void Spark) -45 전격피해";
          s.enemies.forEach((enemy) => {
            enemy.hp -= 45;
            // pull enemies toward center
            const dx = s.player.x - enemy.x;
            const dy = s.player.y - enemy.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist > 10) {
              enemy.x += (dx / dist) * 35;
              enemy.y += (dy / dist) * 35;
            }
            s.floatingTexts.push({
              id: `elec_${Math.random()}`,
              x: enemy.x,
              y: enemy.y - 30,
              text: "공허 감전 -45",
              color: "#a855f7",
              vy: -1.2,
              life: 40
            });
            for (let q = 0; q < 5; q++) {
              s.particles.push({
                x: enemy.x, y: enemy.y, vx: (Math.random() - 0.5) * 7, vy: (Math.random() - 0.5) * 7,
                color: "#e9d5ff", size: 3, life: 15, maxLife: 15
              });
            }
          });
        }
      }
      s.comboCount = 1;
    }
    s.lastFiredElement = activeBullet.element;

    // Single Element Combo continuous bonuses (>= 3 consecutive shots of same element)
    if (s.comboCount >= 3) {
      if (activeBullet.element === ElementType.FIRE) {
        comboBonusText = `🔥 화염 과부하 ${s.comboCount}단계! +35% 피해`;
        comboDamageMultiplier = 1.35;
        for (let q = 0; q < 8; q++) {
          s.particles.push({
            x: s.player.x, y: s.player.y, vx: (Math.random() - 0.5) * 8, vy: (Math.random() - 0.5) * 8,
            color: "#ff0000", size: 3, life: 20, maxLife: 20
          });
        }
      } else if (activeBullet.element === ElementType.ICE) {
        comboBonusText = `❄️ 빙결 한파 ${s.comboCount}단계! 광역 적 둔화`;
        s.enemies.forEach((enemy) => {
          enemy.speed = Math.max(0.4, enemy.speed - 0.5);
          s.floatingTexts.push({
            id: `slow_${Math.random()}`,
            x: enemy.x,
            y: enemy.y - 20,
            text: "둔화 50%",
            color: "#60a5fa",
            vy: -0.8,
            life: 30
          });
        });
      } else if (activeBullet.element === ElementType.LIGHTNING) {
        comboBonusText = `⚡ 번개 폭풍 ${s.comboCount}단계! 낙뢰 벼락`;
        s.enemies.forEach((enemy) => {
          enemy.hp -= 25;
          s.floatingTexts.push({
            id: `lightning_strike_${Math.random()}`,
            x: enemy.x,
            y: enemy.y - 25,
            text: "낙뢰 -25",
            color: "#facc15",
            vy: -1.0,
            life: 30
          });
        });
      } else if (activeBullet.element === ElementType.VOID) {
        comboBonusText = `🌌 공허 차원 ${s.comboCount}단계! +50% 피해`;
        comboDamageMultiplier = 1.5;
      }
    }

    if (comboBonusText) {
      s.floatingTexts.push({
        id: `combo_txt_${Math.random()}`,
        x: s.player.x,
        y: s.player.y - 45,
        text: comboBonusText,
        color: "#c084fc",
        vy: -1.5,
        life: 60
      });
    }

    // Apply recoil
    const recoilSpeed = activeBullet.space * 4.0 * recoilMult;
    s.player.vx -= Math.cos(s.player.angle) * recoilSpeed;
    s.player.vy -= Math.sin(s.player.angle) * recoilSpeed;

    // Trigger visual-only weapon recoil offsets
    s.recoilOffset = 14 * activeBullet.space;

    // Calculate Screen Shake intensity based on card rarity and space
    let shakeIntensity = 4;
    if (activeBullet.rarity === Rarity.LEGENDARY) shakeIntensity = 11;
    else if (activeBullet.rarity === Rarity.EPIC) shakeIntensity = 8;
    else if (activeBullet.rarity === Rarity.RARE) shakeIntensity = 5.5;
    shakeIntensity *= activeBullet.space * 0.85;

    if (screenShakeOption === "NONE") shakeIntensity = 0;
    else if (screenShakeOption === "LOW") shakeIntensity *= 0.4;
    else if (screenShakeOption === "HIGH") shakeIntensity *= 1.6;

    s.screenShake = shakeIntensity;

    // Trigger brief hit-stop/freeze frame on high-rarity firing
    if (hitStopEnabled && activeBullet.rarity === Rarity.LEGENDARY) {
      s.hitStopFrames = 4;
    } else if (hitStopEnabled && activeBullet.rarity === Rarity.EPIC) {
      s.hitStopFrames = 2;
    }

    // Fire bullet projectiles!
    const pelletCount = activeBullet.space >= 2 ? 5 : 3;
    const baseDamage = activeBullet.damage * damageMult * comboDamageMultiplier;
    const spreadLimit = 0.28 * spreadMult;

    // Spawn pellets
    for (let i = 0; i < pelletCount; i++) {
      const offsetAngle = ((i - (pelletCount - 1) / 2) / (pelletCount - 1)) * spreadLimit;
      const speed = 13 + Math.random() * 3 - (activeBullet.space * 0.5);
      const personalAngle = s.player.angle + offsetAngle;
      
      s.projectiles.push({
        x: s.player.x,
        y: s.player.y,
        vx: Math.cos(personalAngle) * speed,
        vy: Math.sin(personalAngle) * speed,
        radius: activeBullet.element === ElementType.VOID ? 8 : 4,
        color: activeBullet.color,
        damage: Math.round(baseDamage / (pelletCount * 0.7)),
        isEnemy: false,
        element: activeBullet.element
      });

      // Sparks and flash effects
      for (let pIdx = 0; pIdx < 3; pIdx++) {
        s.particles.push({
          x: s.player.x + Math.cos(s.player.angle) * 15,
          y: s.player.y + Math.sin(s.player.angle) * 15,
          vx: Math.cos(personalAngle + (Math.random() - 0.5) * 0.4) * (6 + Math.random() * 5),
          vy: Math.sin(personalAngle + (Math.random() - 0.5) * 0.4) * (6 + Math.random() * 5),
          color: activeBullet.color,
          size: 2.5 + Math.random() * 2,
          life: 15 + Math.random() * 12,
          maxLife: 25
        });
      }
    }

    // Spawn brass shell casing particle with angle
    s.particles.push({
      x: s.player.x,
      y: s.player.y,
      vx: Math.cos(s.player.angle - Math.PI / 1.8) * 3.5 + (Math.random() - 0.5) * 1.5,
      vy: Math.sin(s.player.angle - Math.PI / 1.8) * 3.5 - 1.2 + (Math.random() - 0.5) * 1.5,
      color: "#f59e0b",
      size: 3.5,
      life: 60,
      maxLife: 60,
      isShellCasing: true,
      angle: Math.random() * Math.PI * 2
    });

    s.player.fireCooldown = Math.round(25 / fireRateMult);
  };

  // Collisions logic
  const checkCircleCollision = (x1: number, y1: number, r1: number, x2: number, y2: number, r2: number) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return dx * dx + dy * dy < (r1 + r2) * (r1 + r2);
  };

  const handleInteract = () => {
    const s = stateRef.current;
    
    // Check if near any loot ground item
    let nearestLoot: GroundItem | null = null;
    let minLootDist = 50; // interact range
    s.groundItems.forEach((loot) => {
      const dist = Math.sqrt((loot.x - s.player.x) ** 2 + (loot.y - s.player.y) ** 2);
      if (dist < minLootDist) {
        minLootDist = dist;
        nearestLoot = loot;
      }
    });

    if (nearestLoot) {
      const loot: GroundItem = nearestLoot;
      if (loot.type === "gold") {
        setPlayerStats((prev) => ({ ...prev, gold: prev.gold + 12 }));
        s.floatingTexts.push({
          id: `f_gold_${Math.random()}`,
          x: loot.x,
          y: loot.y - 20,
          text: "+12 Gold!",
          color: "#fbbf24",
          vy: -1.0,
          life: 50
        });
        s.groundItems = s.groundItems.filter((i) => i.id !== loot.id);
      } else if (loot.type === "heal") {
        setPlayerStats((prev) => ({ ...prev, hp: Math.min(prev.maxHp, prev.hp + 20) }));
        s.floatingTexts.push({
          id: `f_heal_${Math.random()}`,
          x: loot.x,
          y: loot.y - 20,
          text: "+20 HP Heal!",
          color: "#4ade80",
          vy: -1.0,
          life: 50
        });
        s.groundItems = s.groundItems.filter((i) => i.id !== loot.id);
      } else if (loot.type === "card" && loot.cardPayload) {
        // Collect card choice! Add to deck.
        const claimed = loot.cardPayload;
        setDeck((prev) => [...prev, { ...claimed, id: "c_" + Math.random() }]);

        s.floatingTexts.push({
          id: `loot_c_${Math.random()}`,
          x: s.player.x,
          y: s.player.y - 35,
          text: `🎴 [${claimed.name}] 탄환 획득! (덱 장작완료)`,
          color: "#a855f7",
          vy: -1.2,
          life: 60
        });

        // If part of 3-card choices group, delete other choices cards!
        if (loot.cardGroup) {
          s.groundItems = s.groundItems.filter((item) => item.cardGroup !== loot.cardGroup);
          handleCardLootedAndOpenExits();
        } else {
          s.groundItems = s.groundItems.filter((i) => i.id !== loot.id);
        }
      } else if (loot.type === "part" || loot.type === "relic") {
        // open compare overlay on screen
        setInspectingItem(loot);
      }
      return;
    }

    // Check if near any main interactable station
    let nearestStation: Station | null = null;
    let minStationDist = 60;
    s.stations.forEach((st) => {
      const dist = Math.sqrt((st.x - s.player.x) ** 2 + (st.y - s.player.y) ** 2);
      if (dist < minStationDist) {
        minStationDist = dist;
        nearestStation = st;
      }
    });

    if (nearestStation) {
      const st: Station = nearestStation;
      if (st.type === "chest") {
        if (!st.opened) {
          triggerOpenChest(st);
        }
      } else if (st.type === "merchant") {
        setActiveStation("shop");
      } else if (st.type === "anvil") {
        setActiveStation("forge");
      } else if (st.type === "runestone") {
        setActiveStation("event");
      }
    }
  };

  // Keyboard and mouse bindings
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const s = stateRef.current;
      const k = e.key.toLowerCase();
      if (k === "w") s.keys.w = true;
      if (k === "a") s.keys.a = true;
      if (k === "s") s.keys.s = true;
      if (k === "d") s.keys.d = true;

      if (e.key === " " || k === "spacebar") {
        e.preventDefault();
        // roll dodge
        if (s.player.rollCooldown === 0) {
          s.player.rollDuration = 15;
          s.player.rollCooldown = 40;
          s.player.rollVx = s.player.vx * 1.5 + (s.keys.d ? 6 : s.keys.a ? -6 : 0);
          s.player.rollVy = s.player.vy * 1.5 + (s.keys.s ? 6 : s.keys.w ? -6 : 0);
          if (s.player.rollVx === 0 && s.player.rollVy === 0) {
            s.player.rollVx = 6 * s.player.direction;
          }
          s.player.isInvulnerable = true;

          // Overseer Passive speed buff activation
          if (selectedCharacter === "OVERSEER") {
            s.player.speedBuffDuration = 90; // 90 physics updates (1.5 seconds) of speed boost
            s.floatingTexts.push({
              id: `overseer_speed_${Math.random()}`,
              x: s.player.x,
              y: s.player.y - 25,
              text: "⚡ AGILITY BOOST! +45% Speed",
              color: "#fbbf24",
              vy: -1.0,
              life: 40
            });
          }
        }
      }

      if (k === "r") {
        e.preventDefault();
        setIsBulletTime(!isBulletTime);
      }

      if (k === "tab") {
        e.preventDefault();
        setDungeonMapOpen(!dungeonMapOpen);
      }

      if (k === "e") {
        handleInteract();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const s = stateRef.current;
      const k = e.key.toLowerCase();
      if (k === "w") s.keys.w = false;
      if (k === "a") s.keys.a = false;
      if (k === "s") s.keys.s = false;
      if (k === "d") s.keys.d = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [chamber, activeRoom, routeNodes, isBulletTime, dungeonMapOpen]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    s.mouse.x = mx;
    s.mouse.y = my;

    // Calculate angle relative to player screen coordinates
    const sx = (s.player.x - s.camera.x) * ZOOM_FACTOR;
    const sy = (s.player.y - s.camera.y) * ZOOM_FACTOR;
    s.player.angle = Math.atan2(my - sy, mx - sx);
    s.player.direction = mx >= sx ? 1 : -1;
  };

  const handleMouseDown = () => {
    stateRef.current.mouse.isDown = true;
  };
  const handleMouseUp = () => {
    stateRef.current.mouse.isDown = false;
  };

  // Re-setup room upon active room / floor changes
  useEffect(() => {
    setupRoom();
  }, [activeRoom.id, playerStats.floor]);

  // Main tick loop
  useEffect(() => {
    let frameId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const tick = () => {
      if (!activeStation && !dungeonMapOpen && !inspectingItem) {
        updatePhysics();
      }
      drawGame(ctx);
      frameId = requestAnimationFrame(tick);
    };

    const updatePhysics = () => {
      const s = stateRef.current;

      // 0. Hit stop logic (briefly freezes gameplay for maximum combat impacts)
      if (s.hitStopFrames > 0) {
        s.hitStopFrames--;
        return;
      }

      // Decay screen shake & weapon recoil offsets
      if (s.screenShake > 0) {
        s.screenShake *= 0.88;
        if (s.screenShake < 0.25) s.screenShake = 0;
      }
      if (s.recoilOffset > 0) {
        s.recoilOffset -= 1.4;
        if (s.recoilOffset < 0) s.recoilOffset = 0;
      }

      // Decrement hit flashes for hit feedback coloring
      s.enemies.forEach((enemy) => {
        if (enemy.hitFlashFrames !== undefined && enemy.hitFlashFrames > 0) {
          enemy.hitFlashFrames--;
        }
      });

      // Slowmo time factor during card loading reload bullettime!
      const dt = isBulletTime ? 0.20 : 1.0;

      // 1. Roll / Dash Physics
      if (s.player.rollDuration > 0) {
        s.player.x += s.player.rollVx;
        s.player.y += s.player.rollVy;
        s.player.rollDuration--;
        if (s.player.rollDuration === 0) {
          s.player.isInvulnerable = false;
        }

        // Spawn roll dash trails particles
        s.particles.push({
          x: s.player.x,
          y: s.player.y,
          vx: (Math.random() - 0.5) * 1.5,
          vy: (Math.random() - 0.5) * 1.5,
          color: selectedCharacter === "OVERSEER" ? "#fbbf24" : selectedCharacter === "SENTINEL" ? "#60a5fa" : "#c084fc",
          size: 4,
          life: 20,
          maxLife: 20
        });
      } else {
        // Normal move controls
        let dx = 0;
        let dy = 0;
        if (s.keys.w) dy -= 1;
        if (s.keys.s) dy += 1;
        if (s.keys.a) dx -= 1;
        if (s.keys.d) dx += 1;

        if (dx !== 0 && dy !== 0) {
          dx *= 0.7071;
          dy *= 0.7071;
        }

        let moveSpeed = 3.6;
        if (selectedCharacter === "OVERSEER" && s.player.speedBuffDuration > 0) {
          moveSpeed *= 1.45; // 45% speed multiplier!
          s.player.speedBuffDuration--;
        }
        s.player.vx += dx * moveSpeed * 0.15;
        s.player.vy += dy * moveSpeed * 0.15;

        // Apply friction
        s.player.vx *= 0.8;
        s.player.vy *= 0.8;

        s.player.x += s.player.vx;
        s.player.y += s.player.vy;
      }

      // Restrict bounds
      s.player.x = Math.max(s.player.radius, Math.min(s.roomBounds.w - s.player.radius, s.player.x));
      s.player.y = Math.max(s.player.radius, Math.min(s.roomBounds.h - s.player.radius, s.player.y));

      if (s.player.rollCooldown > 0) s.player.rollCooldown--;
      if (s.player.fireCooldown > 0) s.player.fireCooldown--;

      // Shoot action (only outside of reload screen)
      if (s.mouse.isDown && s.player.fireCooldown === 0 && !isBulletTime) {
        fireShotgun();
      }

      // Move camera
      const cameraFollowStrength = 0.08;
      const visibleW = canvas.width / ZOOM_FACTOR;
      const visibleH = canvas.height / ZOOM_FACTOR;
      const targetCamX = Math.max(0, Math.min(s.roomBounds.w - visibleW, s.player.x - visibleW / 2));
      const targetCamY = Math.max(0, Math.min(s.roomBounds.h - visibleH, s.player.y - visibleH / 2));
      s.camera.x += (targetCamX - s.camera.x) * cameraFollowStrength;
      s.camera.y += (targetCamY - s.camera.y) * cameraFollowStrength;

      // 2. Projectiles Physics updating
      s.projectiles = s.projectiles.filter((proj) => {
        proj.x += proj.vx * dt;
        proj.y += proj.vy * dt;

        // Wall collisions of projectile
        let collidedWall = false;
        s.obstacles.forEach((ob) => {
          if (proj.x > ob.x && proj.x < ob.x + ob.w && proj.y > ob.y && proj.y < ob.y + ob.h) {
            if (ob.type === "poison_pool" || ob.type === "magic_circle") return; // walk through non-solid hazards

            collidedWall = true;
            // Draw damage to breakable nodes inside corridor
            if (ob.type === "gold_node" && !proj.isEnemy) {
              if (ob.hp !== undefined) ob.hp -= proj.damage;
            }

            // Handle explosive crystal reactive obstacles chain reaction!
            if (ob.type === "explosive_crystal") {
              if (ob.hp !== undefined) {
                ob.hp -= proj.damage;
                if (ob.hp <= 0) {
                  const obCenterX = ob.x + ob.w / 2;
                  const obCenterY = ob.y + ob.h / 2;
                  
                  // damage player
                  const pDist = Math.sqrt(Math.pow(s.player.x - obCenterX, 2) + Math.pow(s.player.y - obCenterY, 2));
                  if (pDist < 120 && !s.player.isInvulnerable) {
                    damagePlayer(20);
                  }
                  
                  // damage enemies
                  s.enemies.forEach((enemy) => {
                    const eDist = Math.sqrt(Math.pow(enemy.x - obCenterX, 2) + Math.pow(enemy.y - obCenterY, 2));
                    if (eDist < 125) {
                      enemy.hp -= 50;
                      enemy.hitFlashFrames = 12;
                      s.floatingTexts.push({
                        id: `exp_ob_${Math.random()}`,
                        x: enemy.x, y: enemy.y - 20,
                        text: "💥 결정 대폭발 -50", color: "#f97316", vy: -1.5, life: 40
                      });
                    }
                  });

                  // Spawn big blast ring particles
                  for (let k = 0; k < 18; k++) {
                    s.particles.push({
                      x: obCenterX, y: obCenterY, vx: (Math.random() - 0.5) * 8.5, vy: (Math.random() - 0.5) * 8.5,
                      color: "#c084fc", size: 4.5, life: 25, maxLife: 25
                    });
                  }
                  s.screenShake = 14;
                }
              }
            }
          }
        });

        if (collidedWall) {
          // splash shards particles
          for (let p = 0; p < 3; p++) {
            s.particles.push({
              x: proj.x, y: proj.y, vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4,
              color: proj.color, size: 2, life: 10, maxLife: 10
            });
          }
          return false;
        }

        // Projectiles Vs Entities checks
        if (proj.isEnemy) {
          // Hits Player
          if (checkCircleCollision(proj.x, proj.y, proj.radius, s.player.x, s.player.y, s.player.radius)) {
            if (!s.player.isInvulnerable) {
              damagePlayer(proj.damage);
            }
            return false;
          }
        } else {
          // Hits Enemy
          let enemyHit = false;
          s.enemies.forEach((enemy) => {
            if (enemyHit) return;
            if (checkCircleCollision(proj.x, proj.y, proj.radius, enemy.x, enemy.y, enemy.radius)) {
              
              // Shield enemy blocking logic (from front shield angle)
              if (enemy.type === "shield" && enemy.shieldAngle !== undefined) {
                const projAngle = Math.atan2(proj.vy, proj.vx);
                let diff = Math.abs(projAngle - (enemy.shieldAngle + Math.PI));
                while (diff > Math.PI * 2) diff -= Math.PI * 2;
                if (diff > Math.PI) diff = Math.PI * 2 - diff;
                
                if (diff < 1.1) { // roughly 60 degrees blocking cone from front
                  enemyHit = true;
                  s.floatingTexts.push({
                    id: `blocked_${Math.random()}`,
                    x: enemy.x, y: enemy.y - 15,
                    text: "🛡️ BLOCKED", color: "#64748b", vy: -0.8, life: 25
                  });
                  // metal sparks
                  for (let q = 0; q < 5; q++) {
                    s.particles.push({
                      x: enemy.x, y: enemy.y, vx: -proj.vx * 0.3 + (Math.random() - 0.5) * 4, vy: -proj.vy * 0.3 + (Math.random() - 0.5) * 4,
                      color: "#cbd5e1", size: 2.5, life: 12, maxLife: 12
                    });
                  }
                  return;
                }
              }

              enemy.hp -= proj.damage;
              enemyHit = true;
              enemy.hitFlashFrames = 6; // Hit Flash Trigger

              // Push/Knockback enemy
              const knockBackForce = proj.radius >= 8 ? 4.5 : 2.0;
              const angle = Math.atan2(proj.vy, proj.vx);
              enemy.vx += Math.cos(angle) * knockBackForce;
              enemy.vy += Math.sin(angle) * knockBackForce;

              // floating numbers
              s.floatingTexts.push({
                id: `txt_${Math.random()}`,
                x: enemy.x,
                y: enemy.y - 12,
                text: `${proj.damage}`,
                color: proj.color,
                vy: -1.2,
                life: 30
              });

              // tiny particles splash
              for (let q = 0; q < 4; q++) {
                s.particles.push({
                  x: enemy.x, y: enemy.y, vx: proj.vx * 0.2 + (Math.random() - 0.5) * 3, vy: proj.vy * 0.2 + (Math.random() - 0.5) * 3,
                  color: proj.color, size: 2, life: 15, maxLife: 15
                });
              }

              if (enemy.hp <= 0) {
                // Kill unit
                s.enemiesKilledInThisRoom++;
                setPlayerStats((prev) => ({
                  ...prev,
                  score: prev.score + (enemy.type === "boss" ? 5000 : enemy.type === "summoned_bug" ? 10 : 150),
                  gold: prev.gold + (enemy.type === "boss" ? 60 : enemy.type === "summoned_bug" ? 0 : 6),
                  kills: prev.kills + 1
                }));
              }
            }
          });

          if (enemyHit) return false;
        }

        // Keep inside room boundaries check
        return proj.x >= 0 && proj.x <= s.roomBounds.w && proj.y >= 0 && proj.y <= s.roomBounds.h;
      });

      // Filter dead monsters
      s.enemies = s.enemies.filter((enemy) => enemy.hp > 0);

      // Check combat room clear
      if (s.combatStart && !s.combatClearedTriggered && s.enemies.length === 0) {
        if (s.waveCount < s.maxWaves) {
          s.nextWaveTimer = 90; // Wait 1.5s
          s.combatStart = false; // block checks
        } else {
          triggerRoomDungeonClear();
        }
      }

      // Next wave logic countdown
      if (s.nextWaveTimer > 0) {
        s.nextWaveTimer--;
        if (s.nextWaveTimer === 0) {
          s.combatStart = true;
          spawnMonsterWave();
        }
      }

      // 3. Enemies Chase Combat artificial intelligence with obstacle steering avoidance
      s.enemies.forEach((enemy) => {
        const pdx = s.player.x - enemy.x;
        const pdy = s.player.y - enemy.y;
        const dist = Math.sqrt(pdx * pdx + pdy * pdy);

        // Apply friction to enemy velocity/knockback
        enemy.vx *= 0.75;
        enemy.vy *= 0.75;
        enemy.x += enemy.vx;
        enemy.y += enemy.vy;

        // Steering Obstacle Avoidance Vector calculation
        let steerForceX = 0;
        let steerForceY = 0;
        s.obstacles.forEach((ob) => {
          if (ob.type === "poison_pool" || ob.type === "magic_circle") return; // walkthrough hazards
          const obCenterX = ob.x + ob.w / 2;
          const obCenterY = ob.y + ob.h / 2;
          const odx = enemy.x - obCenterX;
          const ody = enemy.y - obCenterY;
          const odist = Math.sqrt(odx * odx + ody * ody);
          const influenceRange = Math.max(ob.w, ob.h) + 25;
          if (odist < influenceRange && odist > 0) {
            const force = (influenceRange - odist) / influenceRange;
            steerForceX += (odx / odist) * force * 1.6;
            steerForceY += (ody / odist) * force * 1.6;
          }
        });

        // Unique Enemy Behavior state machines
        if (enemy.type === "boss") {
          // Boss emits waves of bullets!
          enemy.shootCooldown -= dt;
          if (enemy.shootCooldown <= 0) {
            enemy.shootCooldown = 90;
            // 8-directional shots spark
            for (let angleDir = 0; angleDir < 360; angleDir += 45) {
              const rad = (angleDir * Math.PI) / 180;
              s.projectiles.push({
                x: enemy.x, y: enemy.y,
                vx: Math.cos(rad) * 4.2, vy: Math.sin(rad) * 4.2,
                radius: 7, color: "#ef4444", damage: 15, isEnemy: true, element: ElementType.PHYSICAL
              });
            }
          }
          // Slow approach
          if (dist > 150) {
            enemy.x += ((pdx / dist) + steerForceX) * enemy.speed * dt;
            enemy.y += ((pdy / dist) + steerForceY) * enemy.speed * dt;
          }
        } else if (enemy.type === "charger") {
          if (!enemy.chargeCooldown) enemy.chargeCooldown = 150;
          if (enemy.isCharging) {
            // High speed lock dash
            const tdx = (enemy.targetChargeX || s.player.x) - enemy.x;
            const tdy = (enemy.targetChargeY || s.player.y) - enemy.y;
            const tdist = Math.sqrt(tdx * tdx + tdy * tdy);
            if (tdist > 12) {
              enemy.x += (tdx / tdist) * enemy.speed * 4.5 * dt;
              enemy.y += (tdy / tdist) * enemy.speed * 4.5 * dt;
              // Spawn dust particles
              s.particles.push({
                x: enemy.x, y: enemy.y, vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2,
                color: "#ff3366", size: 3, life: 12, maxLife: 12
              });
            } else {
              enemy.isCharging = false;
              enemy.chargeCooldown = 140; // recharge duration
            }
            if (dist < enemy.radius + s.player.radius && !s.player.isInvulnerable) {
              damagePlayer(15);
              enemy.isCharging = false;
              enemy.chargeCooldown = 180;
            }
          } else {
            enemy.chargeCooldown -= dt;
            if (dist < 200 && enemy.chargeCooldown <= 0) {
              enemy.isCharging = true;
              enemy.targetChargeX = s.player.x + (s.player.vx * 15); // predict player direction!
              enemy.targetChargeY = s.player.y + (s.player.vy * 15);
              s.floatingTexts.push({
                id: `charge_${enemy.id}`,
                x: enemy.x, y: enemy.y - 20,
                text: "⚠️ CHARGE!", color: "#ff2255", vy: -1.5, life: 40
              });
            } else {
              enemy.x += ((pdx / dist) + steerForceX) * enemy.speed * dt;
              enemy.y += ((pdy / dist) + steerForceY) * enemy.speed * dt;
            }
          }
        } else if (enemy.type === "caster") {
          enemy.shootCooldown -= dt;
          if (enemy.shootCooldown <= 0) {
            enemy.shootCooldown = 130 + Math.random() * 50;
            s.projectiles.push({
              x: enemy.x, y: enemy.y,
              vx: (pdx / dist) * 4.0, vy: (pdy / dist) * 4.0,
              radius: 6, color: "#ec4899", damage: 11, isEnemy: true, element: ElementType.PHYSICAL
            });
          }
          if (dist > 220) {
            enemy.x += ((pdx / dist) + steerForceX) * enemy.speed * dt;
            enemy.y += ((pdy / dist) + steerForceY) * enemy.speed * dt;
          } else {
            // back pedal away
            enemy.x -= ((pdx / dist) - steerForceX) * enemy.speed * 0.5 * dt;
            enemy.y -= ((pdy / dist) - steerForceY) * enemy.speed * 0.5 * dt;
          }
        } else if (enemy.type === "kamikaze") {
          if (dist < 45) {
            damagePlayer(25);
            enemy.hp = 0; // dies
            for (let k = 0; k < 15; k++) {
              s.particles.push({
                x: enemy.x, y: enemy.y, vx: (Math.random() - 0.5) * 9, vy: (Math.random() - 0.5) * 9,
                color: "#f97316", size: 4, life: 25, maxLife: 25
              });
            }
            s.screenShake = 12;
            s.floatingTexts.push({
              id: `exp_${enemy.id}`,
              x: enemy.x, y: enemy.y - 20,
              text: "💥 DETONATED!", color: "#f97316", vy: -2.0, life: 40
            });
          } else {
            enemy.x += ((pdx / dist) + steerForceX) * enemy.speed * dt;
            enemy.y += ((pdy / dist) + steerForceY) * enemy.speed * dt;
          }
        } else if (enemy.type === "shield") {
          enemy.shieldAngle = Math.atan2(pdy, pdx);
          enemy.x += ((pdx / dist) + steerForceX) * enemy.speed * dt;
          enemy.y += ((pdy / dist) + steerForceY) * enemy.speed * dt;
          if (dist < enemy.radius + s.player.radius && !s.player.isInvulnerable) {
            damagePlayer(8);
          }
        } else if (enemy.type === "summoner") {
          if (enemy.summonCount === undefined) enemy.summonCount = 0;
          enemy.shootCooldown -= dt;
          if (enemy.shootCooldown <= 0 && enemy.summonCount < 3) {
            enemy.shootCooldown = 220 + Math.random() * 80;
            enemy.summonCount++;
            s.enemies.push({
              id: `bug_${Math.random()}`,
              type: "summoned_bug",
              x: enemy.x + (Math.random() - 0.5) * 45,
              y: enemy.y + (Math.random() - 0.5) * 45,
              vx: 0, vy: 0,
              hp: 12, maxHp: 12,
              speed: 2.2,
              radius: 8,
              color: "#34d399",
              shootCooldown: 9999,
              hitFlashFrames: 0
            });
            s.floatingTexts.push({
              id: `spawn_${enemy.id}`,
              x: enemy.x, y: enemy.y - 15,
              text: "🕷️ Parasite Spawned!", color: "#34d399", vy: -0.8, life: 30
            });
          }
          if (dist > 300) {
            enemy.x += ((pdx / dist) + steerForceX) * enemy.speed * dt;
            enemy.y += ((pdy / dist) + steerForceY) * enemy.speed * dt;
          } else {
            enemy.x -= ((pdx / dist) - steerForceX) * enemy.speed * 0.7 * dt;
            enemy.y -= ((pdy / dist) - steerForceY) * enemy.speed * 0.7 * dt;
          }
        } else if (enemy.type === "summoned_bug") {
          enemy.x += ((pdx / dist) + steerForceX) * enemy.speed * dt;
          enemy.y += ((pdy / dist) + steerForceY) * enemy.speed * dt;
          if (dist < enemy.radius + s.player.radius && !s.player.isInvulnerable) {
            damagePlayer(5);
            enemy.hp = 0; // self-destruct upon biting
          }
        } else if (enemy.type === "melee") {
          enemy.x += ((pdx / dist) + steerForceX) * enemy.speed * dt;
          enemy.y += ((pdy / dist) + steerForceY) * enemy.speed * dt;
          if (dist < enemy.radius + s.player.radius && !s.player.isInvulnerable) {
            damagePlayer(10);
          }
        } else if (enemy.type === "archer") {
          enemy.shootCooldown -= dt;
          if (enemy.shootCooldown <= 0) {
            enemy.shootCooldown = 120 + Math.random() * 60;
            s.projectiles.push({
              x: enemy.x, y: enemy.y,
              vx: (pdx / dist) * 5.5, vy: (pdy / dist) * 5.5,
              radius: 4, color: "#3b82f6", damage: 8, isEnemy: true, element: ElementType.PHYSICAL
            });
          }
          if (dist > 200) {
            enemy.x += ((pdx / dist) + steerForceX) * enemy.speed * dt;
            enemy.y += ((pdy / dist) + steerForceY) * enemy.speed * dt;
          } else {
            // strafe around obstacles
            enemy.x += steerForceX * enemy.speed * dt;
            enemy.y += steerForceY * enemy.speed * dt;
          }
        }
      });

      // 4. Resolve breakable ore nodes
      s.obstacles = s.obstacles.filter((ob) => {
        if (ob.type === "gold_node" && ob.hp !== undefined && ob.hp <= 0) {
          // Burst gold items!
          s.groundItems.push({
            id: `gold_ore_${Math.random()}`,
            x: ob.x + 10,
            y: ob.y + 10,
            radius: 8,
            type: "gold",
            name: "결정 원석 파편 (Scrap Mine)",
            color: "#fbbf24"
          });
          // Also spawn small sparkles particles
          for (let k = 0; k < 10; k++) {
            s.particles.push({
              x: ob.x + 10, y: ob.y + 10, vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6,
              color: "#fbbf24", size: 3, life: 20, maxLife: 20
            });
          }
          return false;
        }
        return true;
      });

      // 5. Ground items loot magnet / highlight tooltips!
      let currentTooltip = "";
      s.groundItems.forEach((loot) => {
        const pdx = loot.x - s.player.x;
        const pdy = loot.y - s.player.y;
        const dist = Math.sqrt(pdx * pdx + pdy * pdy);
        if (dist < 60) {
          loot.hovered = true;
          currentTooltip = `[E] 습득: ${loot.name} ${loot.description ? `(${loot.description})` : ""}`;
        } else {
          loot.hovered = false;
        }
      });

      // Show station tooltips
      s.stations.forEach((st) => {
        const pdx = st.x - s.player.x;
        const pdy = st.y - s.player.y;
        const dist = Math.sqrt(pdx * pdx + pdy * pdy);
        if (dist < 60) {
          if (st.type === "chest" && !st.opened) {
            currentTooltip = `[E] 개봉: ${st.name}`;
          } else if (st.type === "merchant") {
            currentTooltip = `[E] 거래: ${st.name}`;
          } else if (st.type === "anvil") {
            currentTooltip = `[E] 세공: ${st.name}`;
          } else if (st.type === "runestone") {
            currentTooltip = `[E] 상호작용: ${st.name}`;
          }
        }
      });

      // Check Gate collision (leads to transition!)
      s.gateways.forEach((gate) => {
        const pdx = gate.x - s.player.x;
        const pdy = gate.y - s.player.y;
        const dist = Math.sqrt(pdx * pdx + pdy * pdy);
        if (dist < 32) {
          // If physically in Corridor, transition to next room!
          if (isCorridor) {
            handleEnterNextRoom(gate.targetNode);
          } else {
            // Trigger transition into corridor hallway
            s.player.x = 80;
            s.player.y = 160;
            setCorridorTarget(gate.targetNode);
            setIsCorridor(true);
            s.gateways = []; // clean active room doors
          }
        } else if (dist < 80) {
          currentTooltip = `➡️ 통로 진입 [${gate.name}]`;
        }
      });

      setTooltip(currentTooltip);

      // Move particles
      s.particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
      });
      s.particles = s.particles.filter((p) => p.life > 0);

      // Move text
      s.floatingTexts.forEach((t) => {
        t.y += t.vy;
        t.life--;
      });
      s.floatingTexts = s.floatingTexts.filter((t) => t.life > 0);
    };

    const damagePlayer = (amt: number) => {
      const s = stateRef.current;

      // Sentinel Passive: 25% chance to block damage completely
      if (selectedCharacter === "SENTINEL" && Math.random() < 0.25) {
        s.floatingTexts.push({
          id: `shield_block_${Math.random()}`,
          x: s.player.x,
          y: s.player.y - 30,
          text: "🛡️ SHIELD BLOCK! (무효)",
          color: "#38bdf8",
          vy: -1.2,
          life: 50
        });
        // Spark defensive blue shield particles
        for (let i = 0; i < 12; i++) {
          s.particles.push({
            x: s.player.x,
            y: s.player.y,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            color: "#0ea5e9",
            size: 4,
            life: 25,
            maxLife: 25
          });
        }
        return;
      }

      s.player.isInvulnerable = true;
      setTimeout(() => {
        stateRef.current.player.isInvulnerable = false;
      }, 800);

      setPlayerStats((prev) => {
        const nextHp = Math.max(0, prev.hp - amt);
        if (nextHp <= 0) {
          setTimeout(() => onPlayerDeath(), 200);
        }
        return { ...prev, hp: nextHp };
      });

      s.floatingTexts.push({
        id: `dmg_${Math.random()}`,
        x: s.player.x,
        y: s.player.y - 25,
        text: `-${amt}`,
        color: "#fb7185",
        vy: -1.4,
        life: 40
      });

      // red dash particles splat
      for (let i = 0; i < 8; i++) {
        s.particles.push({
          x: s.player.x, y: s.player.y, vx: (Math.random() - 0.5) * 5, vy: (Math.random() - 0.5) * 5,
          color: "#f43f5e", size: 3, life: 20, maxLife: 20
        });
      }
    };

    const drawGame = (c: CanvasRenderingContext2D) => {
      const s = stateRef.current;
      
      // Clear canvas
      c.clearRect(0, 0, canvas.width, canvas.height);

      c.save();
      
      // Momentary hit-flash screen desaturation filter
      const timeSinceHit = Date.now() - s.lastHitTime;
      if (timeSinceHit < 250) {
        c.filter = `saturate(${Math.max(0.15, timeSinceHit / 250)})`;
      } else {
        c.filter = "none";
      }

      // Calculate dynamic camera offsets with screen shake jitter!
      let shakeOffsetX = 0;
      let shakeOffsetY = 0;
      if (s.screenShake > 0) {
        shakeOffsetX = (Math.random() - 0.5) * s.screenShake;
        shakeOffsetY = (Math.random() - 0.5) * s.screenShake;
      }

      c.scale(ZOOM_FACTOR, ZOOM_FACTOR);
      c.translate(-s.camera.x + shakeOffsetX, -s.camera.y + shakeOffsetY);

      // Draw ground shadow helper
      const drawGroundShadow = (cx: number, cy: number, radius: number) => {
        c.fillStyle = "rgba(0, 0, 0, 0.35)";
        c.beginPath();
        c.ellipse(cx, cy + radius * 0.85, radius * 0.9, radius * 0.35, 0, 0, Math.PI * 2);
        c.fill();
      };

      // 1. Draw Ground Floor Grid
      const bounds = s.roomBounds;
      c.fillStyle = isCorridor ? "#110c1f" : "#0f0b1a";
      c.fillRect(0, 0, bounds.w, bounds.h);

      // brick outlines
      c.strokeStyle = isCorridor ? "#1f183c" : "#1a1230";
      c.lineWidth = 1;
      const step = 64;
      for (let x = 0; x < bounds.w; x += step) {
        c.beginPath(); c.moveTo(x, 0); c.lineTo(x, bounds.h); c.stroke();
      }
      for (let y = 0; y < bounds.h; y += step) {
        c.beginPath(); c.moveTo(0, y); c.lineTo(bounds.w, y); c.stroke();
      }

      // 2. Draw Obstacles (procedural / cover rocks & explosive crystals)
      s.obstacles.forEach((ob) => {
        if (ob.type === "torch") {
          // Draw wall mount torch
          c.fillStyle = "#854d0e";
          c.fillRect(ob.x + 8, ob.y, 4, 15);
          // flickering light particles smoke
          c.fillStyle = Math.random() < 0.5 ? "#ef4444" : "#f59e0b";
          c.beginPath();
          c.arc(ob.x + 10, ob.y, 6 + Math.sin(Date.now() * 0.01) * 2, 0, Math.PI * 2);
          c.fill();
        } else if (ob.type === "gold_node") {
          // Draw sparkling ore block
          c.fillStyle = "#ca8a04";
          c.fillRect(ob.x, ob.y, ob.w, ob.h);
          c.strokeStyle = "#eab308";
          c.lineWidth = 2;
          c.strokeRect(ob.x, ob.y, ob.w, ob.h);
          // spark label
          c.fillStyle = "#ffffff";
          c.font = "8px monospace";
          c.fillText("ORE", ob.x + 4, ob.y - 4);
        } else if (ob.type === "crystal_wall") {
          // Blocks bullets (Full Cover)
          c.fillStyle = "#701a75";
          c.fillRect(ob.x, ob.y, ob.w, ob.h);
          c.strokeStyle = "#d946ef";
          c.lineWidth = 2;
          c.strokeRect(ob.x, ob.y, ob.w, ob.h);
        } else if (ob.type === "explosive_crystal") {
          // Purple glowing explosive spire (Chain reaction trigger!)
          c.save();
          c.shadowColor = "#c084fc";
          c.shadowBlur = 8;
          c.fillStyle = "#86198f";
          c.beginPath();
          c.moveTo(ob.x + ob.w/2, ob.y);
          c.lineTo(ob.x + ob.w, ob.y + ob.h/2);
          c.lineTo(ob.x + ob.w * 0.7, ob.y + ob.h);
          c.lineTo(ob.x + ob.w * 0.3, ob.y + ob.h);
          c.lineTo(ob.x, ob.y + ob.h/2);
          c.closePath();
          c.fill();
          
          c.strokeStyle = "#e879f9";
          c.lineWidth = 1.5;
          c.stroke();
          
          c.fillStyle = "#f472b6";
          c.font = "bold 8px monospace";
          c.fillText("💥", ob.x + ob.w/2 - 4, ob.y + ob.h/2 + 3);
          c.restore();
        } else if (ob.type === "poison_pool") {
          c.fillStyle = "rgba(34, 197, 94, 0.22)";
          c.strokeStyle = "#22c55e";
          c.lineWidth = 2;
          c.beginPath();
          c.ellipse(ob.x + ob.w/2, ob.y + ob.h/2, ob.w/2, ob.h/3, 0, 0, Math.PI*2);
          c.fill();
          c.stroke();
        } else if (ob.type === "magic_circle") {
          c.fillStyle = "rgba(6, 182, 212, 0.12)";
          c.strokeStyle = "rgba(6, 182, 212, 0.4)";
          c.lineWidth = 1.5;
          c.beginPath();
          c.arc(ob.x + ob.w/2, ob.y + ob.h/2, ob.w/2, 0, Math.PI*2);
          c.fill();
          c.stroke();
        } else {
          // Normal partial cover (rocks/crates)
          c.fillStyle = "#334155";
          c.fillRect(ob.x, ob.y, ob.w, ob.h);
          c.strokeStyle = "#475569";
          c.lineWidth = 1.5;
          c.strokeRect(ob.x, ob.y, ob.w, ob.h);
        }
      });

      // 3. Draw Gateways Doorways
      s.gateways.forEach((gate) => {
        // glowing runic circles
        const stepPulse = Math.sin(Date.now() * 0.005) * 4;
        c.fillStyle = "rgba(168, 85, 247, 0.25)";
        c.strokeStyle = gate.color;
        c.lineWidth = 3;
        c.beginPath();
        c.arc(gate.x, gate.y, gate.radius + stepPulse, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        // draw portal banner label
        c.fillStyle = "#ffffff";
        c.font = "bold 9px Arial";
        c.textAlign = "center";
        c.fillText(gate.name, gate.x, gate.y - 4);
      });

      // 4. Draw Stations
      s.stations.forEach((st) => {
        c.save();
        c.shadowColor = st.color;
        c.shadowBlur = 10;
        
        c.fillStyle = st.color;
        c.beginPath();
        c.arc(st.x, st.y, st.radius, 0, Math.PI * 2);
        c.fill();

        // Details text overlay
        c.fillStyle = "#ffffff";
        c.font = "bold 10px monospace";
        c.textAlign = "center";
        c.fillText(st.name, st.x, st.y - st.radius - 8);
        c.restore();
      });

      // 5. Draw Ground Loot cards or coins
      s.groundItems.forEach((loot) => {
        c.save();
        if (loot.hovered) {
          c.shadowBlur = 12;
          c.shadowColor = loot.color;
        }

        c.fillStyle = loot.color;
        c.beginPath();
        c.arc(loot.x, loot.y, loot.radius, 0, Math.PI * 2);
        c.fill();

        // name tag popup
        if (loot.hovered) {
          c.fillStyle = "#ffffff";
          c.font = "bold 9px sans-serif";
          c.textAlign = "center";
          c.fillText(loot.name, loot.x, loot.y - 16);
        }
        c.restore();
      });

      // 6. Draw Enemies with distinct custom sprites / silhouettes & shadows
      s.enemies.forEach((enemy) => {
        // Ground shadow first
        drawGroundShadow(enemy.x, enemy.y, enemy.radius);

        c.save();
        
        // Brief white flash on hit
        if (enemy.hitFlashFrames && enemy.hitFlashFrames > 0) {
          c.shadowBlur = 15;
          c.shadowColor = "#ffffff";
          c.fillStyle = "#ffffff";
        } else {
          c.fillStyle = enemy.color;
        }

        // Distinct enemy types silhouettes
        if (enemy.type === "boss") {
          // Spiked behemoth boss
          c.beginPath();
          c.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
          c.fill();
          
          c.fillStyle = "#fb923c"; // glowing orange crown spikes
          c.beginPath();
          c.moveTo(enemy.x - 30, enemy.y - 35);
          c.lineTo(enemy.x - 12, enemy.y - 52);
          c.lineTo(enemy.x - 14, enemy.y - 32);
          c.fill();
          
          c.beginPath();
          c.moveTo(enemy.x + 30, enemy.y - 35);
          c.lineTo(enemy.x + 12, enemy.y - 52);
          c.lineTo(enemy.x + 14, enemy.y - 32);
          c.fill();
        } else if (enemy.type === "charger") {
          // Sharp bull triangular shape
          c.beginPath();
          const angle = Math.atan2(s.player.y - enemy.y, s.player.x - enemy.x);
          c.moveTo(enemy.x + Math.cos(angle) * enemy.radius * 1.4, enemy.y + Math.sin(angle) * enemy.radius * 1.4);
          c.lineTo(enemy.x + Math.cos(angle + 2.3) * enemy.radius, enemy.y + Math.sin(angle + 2.3) * enemy.radius);
          c.lineTo(enemy.x + Math.cos(angle - 2.3) * enemy.radius, enemy.y + Math.sin(angle - 2.3) * enemy.radius);
          c.closePath();
          c.fill();
          
          // Charge laser-sight warning path line
          if (enemy.isCharging) {
            c.strokeStyle = "rgba(244, 63, 94, 0.5)";
            c.lineWidth = 1.5;
            c.beginPath();
            c.moveTo(enemy.x, enemy.y);
            c.lineTo(enemy.targetChargeX || s.player.x, enemy.targetChargeY || s.player.y);
            c.stroke();
          }
        } else if (enemy.type === "shield") {
          c.beginPath();
          c.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
          c.fill();
          
          // heavy steel front shield segment
          if (enemy.shieldAngle !== undefined) {
            c.strokeStyle = "#94a3b8";
            c.lineWidth = 5;
            c.beginPath();
            c.arc(enemy.x, enemy.y, enemy.radius + 3.5, enemy.shieldAngle - 0.75, enemy.shieldAngle + 0.75);
            c.stroke();
          }
        } else if (enemy.type === "caster") {
          // diamond hover wizard
          c.beginPath();
          c.moveTo(enemy.x, enemy.y - enemy.radius * 1.35);
          c.lineTo(enemy.x + enemy.radius, enemy.y);
          c.lineTo(enemy.x, enemy.y + enemy.radius * 1.35);
          c.lineTo(enemy.x - enemy.radius, enemy.y);
          c.closePath();
          c.fill();
          // magical cyan core
          c.fillStyle = "#ffffff";
          c.beginPath();
          c.arc(enemy.x, enemy.y, 4, 0, Math.PI*2);
          c.fill();
        } else if (enemy.type === "summoner") {
          c.beginPath();
          c.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
          c.fill();
          // Green glowing antennas
          c.strokeStyle = "#34d399";
          c.lineWidth = 2.5;
          c.beginPath();
          c.moveTo(enemy.x - 4, enemy.y - 8);
          c.lineTo(enemy.x - 11, enemy.y - 20);
          c.moveTo(enemy.x + 4, enemy.y - 8);
          c.lineTo(enemy.x + 11, enemy.y - 20);
          c.stroke();
        } else {
          // melee / archer / bug
          c.beginPath();
          c.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
          c.fill();
        }
        c.restore();

        // HP bar red
        const barW = enemy.radius * 1.5;
        c.fillStyle = "#7f1d1d";
        c.fillRect(enemy.x - barW / 2, enemy.y - enemy.radius - 8, barW, 3);
        c.fillStyle = "#22c55e";
        c.fillRect(enemy.x - barW / 2, enemy.y - enemy.radius - 8, barW * (enemy.hp / enemy.maxHp), 3);
      });

      // 7. Draw Projectiles
      s.projectiles.forEach((proj) => {
        c.fillStyle = proj.color;
        c.beginPath();
        c.arc(proj.x, proj.y, proj.radius, 0, Math.PI * 2);
        c.fill();
      });

      // 8. Draw particles with rotating shell casing support
      s.particles.forEach((p) => {
        if (p.isShellCasing && p.angle !== undefined) {
          c.save();
          c.translate(p.x, p.y);
          c.rotate(p.angle);
          c.fillStyle = p.color;
          c.fillRect(-2.5, -1.25, 5, 2.5); // long brass cylinder
          c.restore();
          p.angle += 0.08; // dynamic casing tumble rotation
        } else {
          c.fillStyle = p.color;
          c.beginPath();
          c.arc(p.x, p.y, p.size * (p.life / p.maxLife), 0, Math.PI * 2);
          c.fill();
        }
      });

      // 9. Draw floating numbers texts
      s.floatingTexts.forEach((t) => {
        c.fillStyle = t.color;
        c.font = "bold 10px Courier New";
        c.textAlign = "center";
        c.fillText(t.text, t.x, t.y);
      });

      // 10. Draw Player Unit Circle & weapon part overlays
      drawGroundShadow(s.player.x, s.player.y, s.player.radius);

      c.save();
      if (s.player.isInvulnerable) {
        c.strokeStyle = "#10b981";
        c.lineWidth = 2.5;
        c.beginPath();
        c.arc(s.player.x, s.player.y, s.player.radius + 6, 0, Math.PI * 2);
        c.stroke();
      }

      let playerColor = "#c084fc"; // default Explorer purple
      if (selectedCharacter === "SENTINEL") {
        playerColor = "#0ea5e9"; // crystal cobalt blue
      } else if (selectedCharacter === "OVERSEER") {
        playerColor = "#fbbf24"; // golden amber
      }

      c.fillStyle = playerColor;
      c.beginPath();
      c.arc(s.player.x, s.player.y, s.player.radius, 0, Math.PI * 2);
      c.fill();

      // Add a small decorative central glowing core inside the player
      c.fillStyle = "#ffffff";
      c.beginPath();
      c.arc(s.player.x, s.player.y, s.player.radius * 0.42, 0, Math.PI * 2);
      c.fill();

      // Draw custom-styled weapon part overlays attached directly to gun pointing line!
      const gunAngle = s.player.angle;
      // Recoil visual kickback factor!
      const finalRecoilX = -Math.cos(gunAngle) * s.recoilOffset;
      const finalRecoilY = -Math.sin(gunAngle) * s.recoilOffset;

      const barrelLength = 26;
      const muzzleX = s.player.x + finalRecoilX + Math.cos(gunAngle) * barrelLength;
      const muzzleY = s.player.y + finalRecoilY + Math.sin(gunAngle) * barrelLength;

      // Draw customizable visual gun representation
      c.strokeStyle = "#334155";
      c.lineWidth = 5.0;
      c.beginPath();
      c.moveTo(s.player.x + finalRecoilX, s.player.y + finalRecoilY);
      c.lineTo(muzzleX, muzzleY);
      c.stroke();

      // Draw parts modifiers visually
      // 1. Grip/Pump Part: Green segment under the barrel
      if (equippedParts.some((p) => p.slot === SlotType.PUMP)) {
        c.strokeStyle = "#10b981";
        c.lineWidth = 3.0;
        c.beginPath();
        c.moveTo(s.player.x + finalRecoilX + Math.cos(gunAngle) * 8, s.player.y + finalRecoilY + Math.sin(gunAngle) * 8);
        c.lineTo(s.player.x + finalRecoilX + Math.cos(gunAngle) * 16, s.player.y + finalRecoilY + Math.sin(gunAngle) * 16);
        c.stroke();
      }

      // 2. Muzzle Break Part: cyan flashing rings at muzzle tip!
      if (equippedParts.some((p) => p.slot === SlotType.BARREL)) {
        c.fillStyle = "#22d3ee";
        c.beginPath();
        c.arc(muzzleX, muzzleY, 4.5, 0, Math.PI * 2);
        c.fill();
      }

      // 3. Aux Sight Part: Yellow dot above the player's core
      if (equippedParts.some((p) => p.slot === SlotType.AUXILIARY)) {
        c.fillStyle = "#f59e0b";
        c.beginPath();
        c.arc(s.player.x + finalRecoilX + Math.cos(gunAngle + 0.35) * 10, s.player.y + finalRecoilY + Math.sin(gunAngle + 0.35) * 10, 2.5, 0, Math.PI * 2);
        c.fill();
      }

      // 4. Stock Part: rear dark backing plate on shotgun
      if (equippedParts.some((p) => p.slot === SlotType.STOCK)) {
        c.strokeStyle = "#475569";
        c.lineWidth = 6;
        c.beginPath();
        c.moveTo(s.player.x + finalRecoilX - Math.cos(gunAngle) * 6, s.player.y + finalRecoilY - Math.sin(gunAngle) * 6);
        c.lineTo(s.player.x + finalRecoilX - Math.cos(gunAngle) * 11, s.player.y + finalRecoilY - Math.sin(gunAngle) * 11);
        c.stroke();
      }

      c.restore();

      c.restore(); // camera restore
    };

    tick();
    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [chamber, activeRoom, isCorridor, activeStation, dungeonMapOpen, inspectingItem]);

  // Handle real transition updates between room depth nodes
  const handleEnterNextRoom = (targetNode: RoomNode) => {
    setActiveRoom(targetNode);
    setRouteNodes((prev) => prev.map((n) => n.id === targetNode.id ? { ...n, visited: true } : n));
    setIsCorridor(false);
  };

  // Claim/Equip newly inspected ground item Part
  const confirmEquipInspectedPart = () => {
    if (!inspectingItem || !inspectingItem.partPayload) return;
    const nextPart = inspectingItem.partPayload;

    // Remove old part on same Slot type, place in raw storage ownedParts list
    const matchedOld = equippedParts.find((p) => p.slot === nextPart.slot);
    if (matchedOld) {
      setEquippedParts((prev) => prev.filter((p) => p.id !== matchedOld.id).concat(nextPart));
      setOwnedParts((prev) => [...prev, matchedOld]);
    } else {
      setEquippedParts((prev) => [...prev, nextPart]);
    }

    // remove ground item in ref list
    const s = stateRef.current;
    s.groundItems = s.groundItems.filter((i) => i.id !== inspectingItem.id);
    setInspectingItem(null);
  };

  // Grind item down to Ancient Metals or Raw materials scraps
  const confirmSalvageScrapItem = () => {
    if (!inspectingItem) return;
    
    // Add Scraps to stats
    setPlayerStats((prev) => {
      const scr = { ...prev.scraps };
      scr.crystal += 10;
      scr.metal += 6;
      return { ...prev, scraps: scr, gold: prev.gold + 15 };
    });

    const s = stateRef.current;
    s.groundItems = s.groundItems.filter((i) => i.id !== inspectingItem.id);
    
    s.floatingTexts.push({
      id: "salv_" + Math.random(),
      x: s.player.x,
      y: s.player.y - 45,
      text: "🔘 분해 성공! (+10 결정 수록 +15 금화)",
      color: "#38bdf8",
      vy: -1.0,
      life: 60
    });

    setInspectingItem(null);
  };

  const confirmBagOwnedStoredPart = () => {
    if (!inspectingItem) return;
    if (inspectingItem.partPayload) {
      setOwnedParts((prev) => [...prev, inspectingItem.partPayload!]);
    } else if (inspectingItem.relicPayload) {
      setArtifacts((prev) => [...prev, inspectingItem.relicPayload!]);
    }

    const s = stateRef.current;
    s.groundItems = s.groundItems.filter((i) => i.id !== inspectingItem.id);
    setInspectingItem(null);
  };

  return (
    <div className="relative w-full overflow-hidden flex flex-col bg-[#050409] min-h-[580px] select-none" ref={containerRef}>
      
      {/* Floating Glassmorphic In-Game HUD: Top Left */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-1.5 pointer-events-none">
        {/* HP Vitals board */}
        <div className="flex flex-col gap-1 px-4 py-2 bg-black/80 backdrop-blur-md rounded-xl border border-white/10 shadow-lg min-w-[210px]">
          <div className="flex items-center gap-1.5 justify-between">
            <div className="flex items-center gap-1">
              <Heart className="w-4 h-4 text-red-500 fill-red-500 animate-pulse shrink-0" />
              <span className="font-sans font-black text-[9px] text-gray-300 tracking-wider">VITALITY</span>
            </div>
            <span className="font-mono text-xs font-black text-[#f87171]">{playerStats.hp} <span className="text-gray-500 text-[10px]">/ {playerStats.maxHp}</span></span>
          </div>
          <div className="w-full h-1.5 bg-black/80 rounded-full overflow-hidden border border-white/5">
            <div 
              className="h-full bg-gradient-to-r from-red-600 via-orange-500 to-red-500 rounded-full transition-all duration-300"
              style={{ width: `${Math.max(0, Math.min(100, (playerStats.hp / playerStats.maxHp) * 100))}%` }}
            />
          </div>
        </div>

        {/* Crystals/Gold display */}
        <div className="flex items-center justify-between px-4 py-1.5 bg-black/80 backdrop-blur-md rounded-xl border border-white/10 shadow-md min-w-[210px]">
          <div className="flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
            <span className="font-sans font-black text-[8.5px] text-yellow-400 tracking-wider">CRYSTALS</span>
          </div>
          <span className="font-mono text-xs font-black text-yellow-400">💰 {playerStats.gold}</span>
        </div>

        {/* Score tracker */}
        <div className="flex items-center justify-between px-4 py-1.5 bg-black/80 backdrop-blur-md rounded-xl border border-white/10 shadow-md min-w-[210px]">
          <div className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span className="font-sans font-black text-[8.5px] text-purple-300 tracking-wider">SCORE</span>
          </div>
          <span className="font-mono text-xs font-bold text-purple-300">{playerStats.score}</span>
        </div>
      </div>

      {/* Floating Materials Sidebar Panel */}
      <div className="absolute top-32 left-4 z-20 flex flex-col gap-1 p-2.5 px-3.5 bg-black/60 backdrop-blur-sm rounded-xl border border-white/5 pointer-events-none text-[9.5px] font-mono text-gray-400 min-w-[210px]">
        <span className="text-[8px] font-sans font-black text-[#a855f7] tracking-wider mb-1 uppercase">⛏️ Materials Scraps</span>
        <div className="grid grid-cols-2 gap-y-1 gap-x-4">
          <div className="flex justify-between border-b border-white/5 pb-0.5"><span>🛡️ Metal</span><strong className="text-white font-bold">{playerStats.scraps.metal}</strong></div>
          <div className="flex justify-between border-b border-white/5 pb-0.5"><span>💎 Crystal</span><strong className="text-white font-bold">{playerStats.scraps.crystal}</strong></div>
          <div className="flex justify-between border-b border-white/5 pb-0.5"><span>🔮 Core</span><strong className="text-white font-bold">{playerStats.scraps.core}</strong></div>
          <div className="flex justify-between border-b border-white/5 pb-0.5"><span>⚡ Rune</span><strong className="text-white font-bold">{playerStats.scraps.rune}</strong></div>
          <div className="flex justify-between border-b border-white/5 pb-0.5"><span>🪵 Wood</span><strong className="text-white font-bold">{playerStats.scraps.wood}</strong></div>
          <div className="flex justify-between border-b border-white/5 pb-0.5"><span>🧨 Powder</span><strong className="text-white font-bold">{playerStats.scraps.powder}</strong></div>
        </div>
      </div>

      {/* Floating Room Badge & Map Controller: Top Right */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 items-end">
        {/* Active room status badge */}
        <div className="flex items-center gap-2 px-4 py-2 bg-black/80 backdrop-blur-md rounded-xl border border-white/10 shadow-lg text-[10px] pointer-events-none hover:border-purple-500/30 transition-all text-right min-w-[180px] justify-end">
          <Milestone className="w-4 h-4 text-sky-400 animate-pulse shrink-0" />
          <div className="font-mono">
            <div className="text-[7.5px] text-sky-400/80 font-bold tracking-wider uppercase">Gate Floor {playerStats.floor}</div>
            <strong className="text-white font-sans text-[11.5px] tracking-wide">
              {isCorridor ? (
                <span className="text-[#a855f7] animate-pulse">🚶 연결 횡로 통과</span>
              ) : (
                <>
                  {activeRoom.type === RoomType.COMBAT && "⚔️ 일반 전투실"}
                  {activeRoom.type === RoomType.ELITE && "😈 정예 수호실"}
                  {activeRoom.type === RoomType.BOSS && "💀 최종 황제실"}
                  {activeRoom.type === RoomType.TREASURE && "💎 크리스탈 묘"}
                  {activeRoom.type === RoomType.SHOP && "🛒 정령 상인실"}
                  {activeRoom.type === RoomType.FORGE && "⚙️ 대장간 제단"}
                  {activeRoom.type === RoomType.EVENT && "🔮 신비 고고실"}
                </>
              )}
            </strong>
          </div>
        </div>

        {/* Map activator */}
        <button
          onClick={() => setDungeonMapOpen(!dungeonMapOpen)}
          className="px-4 py-1.5 bg-purple-950/90 hover:bg-purple-900 border border-purple-500/30 hover:border-purple-400 text-white font-mono text-[9.5px] font-bold rounded-lg cursor-pointer flex items-center gap-1.5 hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all shrink-0"
        >
          <Compass className="w-3.5 h-3.5 text-purple-400" />
          <span>지적도 (TAB)</span>
        </button>
      </div>

      {/* Floor and corridor checkpoints track marker: Float top center */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-3.5 py-1.5 rounded-full bg-black/80 border border-white/5 shadow-md flex items-center gap-2 text-[9px] font-mono text-gray-400 pointer-events-none uppercase">
        <Compass className="w-3 h-3 text-purple-400 inline" />
        <span>FLOW MATRIX:</span>
        {routeNodes.slice(0, 4).map((node, i) => (
          <span
            key={i}
            className={`w-2 h-2 rounded-full inline-block border ${
              activeRoom.id === node.id ? "bg-teal-400 border-teal-200 animate-pulse" : node.clear ? "bg-purple-950 border-purple-700" : "bg-gray-900 border-gray-700"
            }`}
          />
        ))}
        <span className="text-[9.5px] font-bold text-white tracking-widest">... GATE {playerStats.floor}</span>
      </div>

      {/* Floating Action interaction Prompt Tooltip */}
      {tooltip && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 px-4 py-1.5 rounded-full border border-yellow-500/40 bg-black/90 text-yellow-400 text-[10px] font-mono font-bold shadow-lg animate-bounce uppercase">
          {tooltip}
        </div>
      )}

      {/* Primary HTML5 Canvas Renderer with Vampire Survivors expanded aspect ratio */}
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        style={{ width: "100%", height: `${dimensions.height}px` }}
        className="w-full cursor-crosshair select-none block transition-all bg-[#040306]"
      />

      {/* Horizontal Chamber Bottom Action utility Bar */}
      <div className="w-full border-t border-purple-900/10 bg-[#06050b] px-4 py-2.5 flex flex-col sm:flex-row gap-2.5 items-center justify-between font-mono text-[10.5px] select-none text-gray-400 z-10">
        {/* Chamber indicators block */}
        <div className="flex items-center gap-2 flex-wrap">
          <strong className="text-purple-400 text-[10px] uppercase tracking-wider">Loaded Chamber:</strong>
          {chamber.length === 0 ? (
            <span className="text-red-500 italic text-[10px] animate-pulse">CHAMBER DRY! Press [R] to reload Cards hand!</span>
          ) : (
            chamber.slice(0, 5).map((bullet, index) => (
              <span
                key={index}
                style={{ backgroundColor: bullet.color + "18", borderColor: bullet.color }}
                className="px-2 py-0.5 rounded border text-[9.5px] text-white flex items-center gap-1 shrink-0 font-bold"
              >
                {index === 0 ? "👉 READY" : `[${index + 1}]`} {bullet.name.split(" ")[0]}
              </span>
            ))
          )}
          {chamber.length > 5 && (
            <span className="text-[10px] text-gray-500 font-bold font-mono shrink-0">+{chamber.length - 5} 쉘</span>
          )}
        </div>

        {/* Reload button helper */}
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setIsBulletTime(true)}
            className="px-4 py-1 bg-purple-950/50 hover:bg-purple-900/70 border border-purple-800/40 rounded text-purple-300 font-bold text-[10px] uppercase cursor-pointer transition-colors"
          >
            장전 패 열기 (Reload [R])
          </button>
        </div>
      </div>

      {/* Slay the Spire Beautiful Fanned-Out Hand Reload Overlay */}
      {isBulletTime && (
        <div className="absolute inset-0 pointer-events-none z-40 select-none flex flex-col justify-end overflow-visible pb-12">
          
          {/* Lightened, subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none -z-10" />

          {/* Centered Bullet-Time Header banner */}
          <div className="absolute top-4 inset-x-0 flex flex-col items-center gap-0.5 text-center pointer-events-none">
            <span className="inline-flex items-center gap-2 px-3.5 py-1 bg-[#1e152a]/95 border border-purple-500/35 text-purple-200 text-[10px] font-mono font-black uppercase tracking-wider animate-pulse rounded shadow-lg">
              ⏳ 슬레이 더 스파이어 마력 장전 제어장치 (Reloading Tactical Board)
            </span>
            <p className="text-[9px] text-gray-300 font-mono tracking-wide mt-1 max-w-sm drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.8)]">
              손에 쥔 카드를 클릭하거나 아래 자동 버튼을 통해 탄창을 충전하세요!
            </p>
          </div>

          {/* Floating Attribute Type Combo Guide Panel on the top left */}
          <div className="absolute top-4 left-4 z-50 p-2.5 bg-black/95 rounded-lg border border-purple-500/35 font-mono text-[8px] text-gray-400 max-w-[200px] pointer-events-none shadow-md">
            <span className="text-[8.5px] font-black text-purple-400 block mb-1">🧪 속성 융합 반응 가이드 (Combo Charts)</span>
            <div className="space-y-1">
              <div><strong className="text-orange-400">🔥 화염 + ❄️ 빙결</strong>: <span className="text-white">열충격 (+60 광역 고정피해)</span></div>
              <div><strong className="text-yellow-400">⚡ 번개 + 🌌 공허</strong>: <span className="text-white">공허 감전 (-45 인력 자석감전)</span></div>
              <div className="border-t border-white/10 pt-1 mt-1 text-gray-500">
                동일 속성 3회 연속 격발 시 <span className="text-yellow-300">화염 과부하(+35%), 한파(둔화 50%), 낙뢰 타격(-25), 공허 뒤틀림(+50%)</span> 발동!
              </div>
            </div>
          </div>

          {/* Active Chamber visual queue gauge */}
          <div className="absolute top-18 inset-x-0 flex flex-col items-center gap-1.5 pb-2 pointer-events-auto">
            <div className="flex items-center gap-2 bg-black/90 px-4 py-1.5 rounded-lg border border-purple-500/20 text-[10px] font-mono text-gray-400">
              <span className="text-[#a855f7] font-black uppercase tracking-widest">
                약실 상태 (Gauge): {chamber.reduce((sum, c) => sum + c.space, 0)} / {chamberCapacity} 칸
              </span>
              <button 
                onClick={() => setChamber([])} 
                className="px-2 py-0.5 bg-red-950 hover:bg-red-900 text-red-400 border border-red-800/30 text-[9px] rounded font-bold cursor-pointer transition-all"
              >
                비우기
              </button>
              <button 
                onClick={autoReloadChamber} 
                className="px-2.5 py-0.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-400 border border-emerald-800/30 text-[9px] rounded font-bold cursor-pointer transition-all ml-1 font-mono"
              >
                ⚡ 자동 일괄 장전 (Auto Fill)
              </button>
            </div>
            {/* Visual block queue representation */}
            <div className="flex items-center gap-1.5 px-3 py-2 bg-black/40 backdrop-blur-md rounded-xl border border-white/5 max-w-md overflow-x-auto">
              {chamber.map((bullet, idx) => (
                <span 
                  key={idx}
                  style={{ borderColor: bullet.color, backgroundColor: bullet.color + "20" }}
                  className="px-2.5 py-0.5 border text-[9.5px] text-white rounded font-bold shrink-0 shadow-sm flex items-center gap-1"
                >
                  ✨ {bullet.name.split(" ")[0]} ({bullet.space})
                </span>
              ))}
              {Array.from({ length: Math.max(0, chamberCapacity - chamber.reduce((sum, c) => sum + c.space, 0)) }).map((_, idx) => (
                <span key={`empty_${idx}`} className="w-3.5 h-3.5 border border-dashed border-gray-700 rounded-full flex items-center justify-center text-[8px] text-gray-600 font-mono">
                  •
                </span>
              ))}
            </div>
          </div>

          {/* Slay the Spire Draw deck pile on the far left */}
          <div className="absolute bottom-10 left-12 p-3 bg-[#0c0817]/95 border border-purple-900/55 rounded-xl flex flex-col items-center justify-center gap-1 pointer-events-auto shadow-[0_0_20px_rgba(168,85,247,0.15)] w-24 select-none">
            <div className="relative w-12 h-16 border-2 border-[#a855f7]/60 bg-purple-950/20 rounded shadow-md flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-purple-400" />
              <span className="absolute -top-1.5 -right-1.5 bg-[#a855f7] text-white text-[9.5px] font-black px-1.5 rounded-full shadow">{stateRef.current.drawPile.length}</span>
            </div>
            <span className="text-[9.5px] font-mono font-black text-purple-300 mt-1.5">덱 ({stateRef.current.drawPile.length})</span>
          </div>

          {/* Redraw and control widget left side */}
          <div className="absolute bottom-10 left-40 flex flex-col gap-2 pointer-events-auto">
            <button
              onClick={discardAndRedrawHand}
              className="px-3.5 py-2 bg-purple-950 hover:bg-purple-905 border border-purple-700/50 hover:border-purple-600 text-purple-300 hover:text-white font-mono font-black text-[9.5px] uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all shadow-md hover:shadow-[0_0_15px_rgba(168,85,247,0.25)] rounded-lg"
            >
              🔄 패 교체 (Redraw)
            </button>
          </div>

          {/* Slay the Spire Discard deck pile on the far right */}
          <div className="absolute bottom-10 right-12 p-3 bg-[#120707]/95 border border-red-900/55 rounded-xl flex flex-col items-center justify-center gap-1 pointer-events-auto shadow-[0_0_20px_rgba(239,68,68,0.15)] w-24 select-none">
            <div className="relative w-12 h-16 border-2 border-red-900/60 bg-red-950/20 rounded shadow-md flex items-center justify-center">
              <RotateCcw className="w-5 h-5 text-red-500" />
              <span className="absolute -top-1.5 -right-1.5 bg-red-700 text-white text-[9.5px] font-black px-1.5 rounded-full shadow">{stateRef.current.discardPile.length}</span>
            </div>
            <span className="text-[9.5px] font-mono font-black text-red-400 mt-1.5">버림 ({stateRef.current.discardPile.length})</span>
          </div>

          {/* Resume firing control widget right side */}
          <div className="absolute bottom-10 right-40 flex flex-col gap-2 pointer-events-auto">
            <button
              onClick={() => setIsBulletTime(false)}
              className="px-4 py-2.5 bg-gradient-to-r from-orange-600 to-[#ff4e00] hover:from-orange-500 hover:to-[#ff621f] rounded-lg border border-white/10 text-white font-mono font-black text-[10px] uppercase tracking-widest cursor-pointer transition-all shadow-[0_0_15px_rgba(255,78,0,0.3)] hover:scale-105"
            >
              ⚔️ 사격 개시 (Resume)
            </button>
          </div>

          {/* Centered pile counts and the visual fan layout cards list */}
          <div className="w-full max-w-xl mx-auto flex justify-center items-end relative h-56 pb-2 pointer-events-auto overflow-visible">
            {hand.map((card, index) => {
              const N = hand.length;
              const centerIndex = (N - 1) / 2;
              
              // Smooth, circular arc fan parameters
              const angle = (index - centerIndex) * 9.5; 
              const translateX = (index - centerIndex) * 62; 
              const translateY = Math.abs(index - centerIndex) * 6; 
              
              const lowerName = card.name.toLowerCase();
              let elemColor = "from-purple-950/90 to-black/95 border-purple-500/50 text-purple-300 shadow-[0_4px_15px_rgba(168,85,247,0.15)]";
              let elementIcon = <Shield className="w-5 h-5 text-purple-400" />;
              if (lowerName.includes("화염") || card.element === "FIRE") {
                elemColor = "from-orange-950/95 to-black/95 border-orange-500/50 text-orange-200 shadow-[0_4px_15px_rgba(249,115,22,0.15)]";
                elementIcon = <Flame className="w-5 h-5 text-orange-400 animate-pulse" />;
              } else if (lowerName.includes("빙결") || card.element === "ICE") {
                elemColor = "from-sky-950/95 to-black/95 border-blue-500/40 text-blue-200 shadow-[0_4px_15px_rgba(59,130,246,0.15)]";
                elementIcon = <Snowflake className="w-5 h-5 text-blue-400" />;
              } else if (lowerName.includes("전격") || card.element === "LIGHTNING") {
                elemColor = "from-yellow-950/95 to-black/95 border-yellow-500/50 text-yellow-200 shadow-[0_4px_15px_rgba(234,179,8,0.15)]";
                elementIcon = <Zap className="w-5 h-5 text-yellow-400 animate-pulse" />;
              } else if (lowerName.includes("폭발") || card.element === "EXPLOSIVE") {
                elemColor = "from-red-950/95 to-black/95 border-red-500/50 text-red-100 shadow-[0_4px_15px_rgba(239,68,68,0.15)]";
                elementIcon = <Sparkles className="w-5 h-5 text-red-500 animate-pulse" />;
              }
              
              return (
                <div
                  key={`${card.id}_hand_${index}`}
                  onClick={() => loadCardFromHandIdx(index)}
                  style={{
                    transform: `translateX(${translateX}px) translateY(${translateY}px) rotate(${angle}deg)`,
                    zIndex: 10 + index,
                    transition: "all 0.22s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
                  }}
                  className={`absolute bottom-0 w-32 h-44 rounded-xl border border-white/10 bg-gradient-to-b p-3.5 flex flex-col justify-between cursor-pointer select-none
                    hover:-translate-y-20 hover:scale-125 hover:rotate-0 hover:z-50 hover:border-white hover:text-white hover:shadow-[0_12px_32px_rgba(255,255,255,0.45)]
                    ${elemColor} transition-transform duration-150`}
                >
                  <div className="flex items-center justify-between w-full font-mono text-[9px]">
                    <span className="font-bold opacity-80 text-orange-400">{card.space}칸 소모</span>
                    <span className="text-[8px] bg-black/40 px-1 rounded opacity-90">{card.rarity.substring(0, 3)}</span>
                  </div>

                  <div className="flex flex-col items-center justify-center gap-1 my-auto text-center w-full">
                    <div className="flex justify-center">{elementIcon}</div>
                    <span className="text-[10px] font-black tracking-wide leading-tight mt-1.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">{card.name}</span>
                    <p className="text-[8px] text-gray-400 leading-normal mt-1 opacity-75">{card.effect}</p>
                  </div>

                  <div className="pt-1.5 border-t border-white/5 flex justify-between items-center text-[9px] font-mono opacity-85">
                    <span className="text-yellow-400 font-bold">피해: {card.damage}</span>
                    <span className="text-gray-400 text-[8.5px]">{card.element}</span>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* Interactive inspect comparison Dialog overlays */}
      {inspectingItem && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-xl border border-teal-500/30 bg-[#08050e] p-5 shadow-2xl relative font-mono text-xs text-gray-100 flex flex-col gap-4 animate-fade-in animate-slide-up">
            
            <div className="flex items-center justify-between border-b border-purple-950 pb-2">
              <span className="text-teal-400 font-black tracking-wider uppercase">🔍 지상 유물 식별 (Verify Loot)</span>
              <button onClick={() => setInspectingItem(null)} className="text-gray-500 hover:text-white cursor-pointer"><X className="w-4 h-4"/></button>
            </div>

            <div className="p-3 bg-black/60 rounded border border-white/5 space-y-1.5">
              <div className="flex justify-between"><strong>명칭 (Name):</strong><span className="text-yellow-400 font-bold">{inspectingItem.name}</span></div>
              <div className="flex justify-between"><strong>품종 (Type):</strong><span className="text-sky-300 font-bold">{inspectingItem.type.toUpperCase()}</span></div>
              <p className="text-gray-400 text-[10px] leading-relaxed pt-1 border-t border-white/5">{inspectingItem.description}</p>
            </div>

            {/* If inspecting gun module, compare with currently matched slot! */}
            {inspectingItem.partPayload && (
              <div className="p-2.5 bg-[#120b24] rounded border border-purple-950 text-[10px] space-y-1 text-purple-300">
                <h4 className="font-extrabold text-[#c084fc]">🔄 마운트 슬롯 비교 (Slot: {inspectingItem.partPayload.slot})</h4>
                {equippedParts.find((p) => p.slot === inspectingItem.partPayload!.slot) ? (
                  <div>장착 중: <strong className="text-white">{equippedParts.find((p) => p.slot === inspectingItem.partPayload!.slot)!.name}</strong> (이 부품 장착 시 탈착되어 대장간 예비 보관함 가방으로 들어감)</div>
                ) : (
                  <div className="text-gray-500 italic">현재 이 슬롯에 장착된 파트 장치가 없습니다. 즉각 장착 가능!</div>
                )}
              </div>
            )}

            {/* Actions choosing */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-purple-950">
              {inspectingItem.partPayload ? (
                <button
                  onClick={confirmEquipInspectedPart}
                  className="py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded font-extrabold cursor-pointer border border-teal-500 text-center"
                >
                  기어 장착 (Equip)
                </button>
              ) : (
                <button
                  onClick={confirmBagOwnedStoredPart}
                  className="py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded font-extrabold cursor-pointer border border-purple-500 text-center col-span-1"
                >
                  유물 획득 (Loot)
                </button>
              )}

              {inspectingItem.partPayload && (
                <button
                  onClick={confirmBagOwnedStoredPart}
                  className="py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded font-bold cursor-pointer border border-gray-700 text-center"
                >
                  보관 (Bag)
                </button>
              )}

              <button
                onClick={confirmSalvageScrapItem}
                className="py-2.5 bg-red-950/40 hover:bg-red-900/60 text-red-300 rounded font-bold cursor-pointer border border-red-900/40 text-center"
              >
                분해 (Salvage)
              </button>
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
}

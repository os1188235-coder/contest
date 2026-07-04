/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum ElementType {
  FIRE = "FIRE",
  ICE = "ICE",
  LIGHTNING = "LIGHTNING",
  VOID = "VOID",
  EXPLOSIVE = "EXPLOSIVE",
  GRENADE = "GRENADE",
  PHYSICAL = "PHYSICAL",
  UTILITY = "UTILITY",
  NORMAL = "NORMAL",
}

export enum Rarity {
  COMMON = "COMMON",
  RARE = "RARE",
  EPIC = "EPIC",
  LEGENDARY = "LEGENDARY",
  MYTHIC = "MYTHIC",
}

export enum SlotType {
  BARREL = "BARREL",       // 총열: 탄 퍼짐, 사거리, 피해 방식
  CHAMBER = "CHAMBER",     // 약실: 장전 가능 공간, 탄환 처리 방식
  PUMP = "PUMP",           // 펌프: 발사 속도, 장전 속도
  TRIGGER = "TRIGGER",     // 방아쇠: 연사, 점사, 특수 격발
  STOCK = "STOCK",         // 개머리판: 반동, 이동 사격 안정성
  CORE = "CORE",           // 마력 코어: 원소 피해, 특수 효과
  AUXILIARY = "AUXILIARY", // 보조 장치: 유탄, 지뢰, 보호막 등 특수 기능
}

export enum RoomType {
  COMBAT = "COMBAT",
  ELITE = "ELITE",
  BOSS = "BOSS",
  TREASURE = "TREASURE",
  SHOP = "SHOP",
  FORGE = "FORGE",
  EVENT = "EVENT",
}

export interface BulletCard {
  id: string;
  name: string;
  element: ElementType;
  effect: string;
  space: number;
  damage: number;
  rarity: Rarity;
  upgraded: boolean;
  cost: number; // For shop buying
  description: string;
  color: string;
}

export interface ShotgunPart {
  id: string;
  name: string;
  slot: SlotType;
  rarity: Rarity;
  level: number;
  description: string;
  statsMultiplier: {
    damage?: number;
    fireRate?: number;
    spread?: number;
    recoil?: number;
    reloadSpeed?: number;
    bulletTimeSpeed?: number;
    barrelKnockback?: number;
    chamberBonusSpace?: number;
    auxShield?: number;
  };
  scrapPrice: number;
}

export interface Artifact {
  id: string;
  name: string;
  description: string;
  rarity: Rarity;
  effectType: "COMPASS" | "HEART" | "BANDOLIER" | "CLOCK" | "CHALICE";
  scrapMaterials: {
    metal: number;
    crystal: number;
    core: number;
  };
}

export interface ScrapMaterials {
  metal: number;       // 고대 금속
  crystal: number;     // 결정 파편
  core: number;        // 마력 코어
  rune: number;        // 탄도 룬
  wood: number;        // 강화 목재
  timeCrystal: number; // 시간 결정
  powder: number;      // 폭발 가루
}

export interface RoomNode {
  id: string;
  type: RoomType;
  x: number; // visual coordinate
  y: number; // visual coordinate
  depth: number; // flow rank (floor level)
  connections: string[]; // next room IDs
  parentConnections: string[]; // previous room IDs
  visited: boolean;
  clear: boolean;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  floor: number;
  kills: number;
  date: string;
}

export interface PlayerStats {
  hp: number;
  maxHp: number;
  gold: number;
  score: number;
  floor: number;
  kills: number;
  scraps: ScrapMaterials;
}

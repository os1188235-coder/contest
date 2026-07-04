/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BulletCard, ElementType, Rarity, ShotgunPart, SlotType, Artifact } from "./types";

export const BASE_CARDS: BulletCard[] = [
  {
    id: "fire_bullet",
    name: "화염탄 (Fire Bullet)",
    element: ElementType.FIRE,
    effect: "burn",
    space: 1,
    damage: 15,
    rarity: Rarity.COMMON,
    upgraded: false,
    cost: 15,
    description: "적중 시 디버프 부여: 주황빛 불꽃으로 적에게 매초 지속적인 추가 화상 피해를 입힙니다.",
    color: "#ff5722",
  },
  {
    id: "ice_bullet",
    name: "빙결탄 (Ice Bullet)",
    element: ElementType.ICE,
    effect: "freeze",
    space: 1,
    damage: 12,
    rarity: Rarity.COMMON,
    upgraded: false,
    cost: 15,
    description: "서리 속성: 피격된 적을 느려지게 만들고, 일정 확률로 단시간 동안 완전히 얼려 행동을 중단합니다.",
    color: "#2196f3",
  },
  {
    id: "volt_bullet",
    name: "전격탄 (Lightning Bullet)",
    element: ElementType.LIGHTNING,
    effect: "chain",
    space: 1,
    damage: 10,
    rarity: Rarity.RARE,
    upgraded: false,
    cost: 25,
    description: "유도성 전격 전도: 피격 지점에서 가장 가까운 주변 다른 적들로 푸른 전류가 퍼져 나가 동시 타격을 가합니다.",
    color: "#ffeb3b",
  },
  {
    id: "void_bullet",
    name: "공허탄 (Void Bullet)",
    element: ElementType.VOID,
    effect: "pierce_shield",
    space: 2,
    damage: 25,
    rarity: Rarity.EPIC,
    upgraded: false,
    cost: 40,
    description: "흑색 마력 응축: 적의 정면 물막 및 원소 방어막을 무시하며, 엘리트와 보스급 적에게 엄청난 관통 배율을 적용합니다.",
    color: "#9c27b0",
  },
  {
    id: "explosive_bullet",
    name: "폭발탄 (Explosive Bullet)",
    element: ElementType.EXPLOSIVE,
    effect: "aoe",
    space: 2,
    damage: 22,
    rarity: Rarity.RARE,
    upgraded: false,
    cost: 30,
    description: "화약 격발: 탄착점 중심 넓은 범위의 폭발 충격을 일으켜 다수의 약한 적을 동시에 대량 분쇄합니다.",
    color: "#f44336",
  },
  {
    id: "grenade_bullet",
    name: "유탄 (Grenade Shell)",
    element: ElementType.GRENADE,
    effect: "lob_aoe",
    space: 3,
    damage: 35,
    rarity: Rarity.EPIC,
    upgraded: false,
    cost: 50,
    description: "도색 곡사 투사체: 바위 등 지형 장애물을 포물선으로 가볍게 넘어가, 착탄 수초 혹은 적 접촉 시 폭발합니다.",
    color: "#e91e63",
  },
  {
    id: "knockback_bullet",
    name: "넉백탄 (Impact Shell)",
    element: ElementType.PHYSICAL,
    effect: "heavy_knockback",
    space: 2,
    damage: 18,
    rarity: Rarity.COMMON,
    upgraded: false,
    cost: 18,
    description: "중량 가압 충격: 강력한 물리 충격을 동반하여 돌진해오는 기괴한 괴수 무리를 멀리 밀어내 안전 거리를 확보합니다.",
    color: "#9e9e9e",
  },
  {
    id: "pierce_bullet",
    name: "관통탄 (Pierce Shot)",
    element: ElementType.PHYSICAL,
    effect: "pierce_enemies",
    space: 2,
    damage: 16,
    rarity: Rarity.COMMON,
    upgraded: false,
    cost: 18,
    description: "강철 바늘: 탄환이 파괴되지 않고 최대 4마리의 모든 일렬 괴수를 관통하여 다굴 상황에서 우수합니다.",
    color: "#607d8b",
  },
  {
    id: "draw_bullet",
    name: "드로우탄 (Draw Shell)",
    element: ElementType.UTILITY,
    effect: "draw_two",
    space: 1,
    damage: 8,
    rarity: Rarity.EPIC,
    upgraded: false,
    cost: 35,
    description: "연쇄 순환: 발사하는 즉시 탄환 덱에서 임의의 유용한 장전 대기 카드 2장을 플레이어 손패로 드로우합니다.",
    color: "#009688",
  },
  {
    id: "boost_bullet",
    name: "강화탄 (Overcharge Bullet)",
    element: ElementType.UTILITY,
    effect: "buff_next",
    space: 1,
    damage: 5,
    rarity: Rarity.RARE,
    upgraded: false,
    cost: 25,
    description: "마력 집속: 자기 자신은 매우 약하지만, 샷건 약실의 다음 순번 탄환 피해량을 1.8배로 대폭 오버필 전력 증폭합니다.",
    color: "#ff9800",
  },
  {
    id: "rapid_bullet",
    name: "연사탄 (Splitfire Bullet)",
    element: ElementType.PHYSICAL,
    effect: "burst_fire",
    space: 2,
    damage: 24,
    rarity: Rarity.RARE,
    upgraded: false,
    cost: 28,
    description: "고속 분할: 1회 사격 시 짧은 간격으로 3발의 미니 충격탄을 전방으로 연달아 끊어 쪼개 격발 사격합니다.",
    color: "#795548",
  },
];

export const BASE_PARTS: ShotgunPart[] = [
  {
    id: "trigger_rapid",
    name: "연사형 조속 방아쇠 (Rapid Trigger)",
    slot: SlotType.TRIGGER,
    rarity: Rarity.COMMON,
    level: 1,
    description: "자동 연발: 마우스를 누르고 있어도 대기 딜레이를 절반으로 낮추며 탄환을 고속 배출합니다. (대신 개별 피해 -15%)",
    statsMultiplier: { fireRate: 1.8, damage: 0.85 },
    scrapPrice: 20
  },
  {
    id: "barrel_grenade",
    name: "곡선 투사 유탄총열 (Grenade Barrel)",
    slot: SlotType.BARREL,
    rarity: Rarity.EPIC,
    level: 1,
    description: "곡사 연계: 모든 일반 탄환 발사 시 25% 확률로 전방에 폭발성 포물선 보조 유탄을 추가 투척합니다.",
    statsMultiplier: { damage: 1.1, spread: 1.2 },
    scrapPrice: 45
  },
  {
    id: "barrel_shock",
    name: "파동형 넉백 특강총열 (Shockwave Barrel)",
    slot: SlotType.BARREL,
    rarity: Rarity.RARE,
    level: 1,
    description: "압력 파동: 모든 격발 탄환의 충격 마찰 배율을 늘려 적을 무조건 1.5배 이상 멀리 시원하게 날려버립니다.",
    statsMultiplier: { barrelKnockback: 1.8, spread: 0.9 },
    scrapPrice: 30
  },
  {
    id: "core_amplifier",
    name: "원소 범위 증폭 코어 (Scope Core)",
    slot: SlotType.CORE,
    rarity: Rarity.RARE,
    level: 1,
    description: "원소 증폭: 폭발탄, 유탄, 전격 충격, 화염 폭발 등 모든 범위형 속성의 타격 이펙트 범위를 40% 구형 확장합니다.",
    statsMultiplier: { damage: 1.15, spread: 1.3 },
    scrapPrice: 30
  },
  {
    id: "chamber_compressed",
    name: "고중량 가압 가스압 축실 (Compressed Chamber)",
    slot: SlotType.CHAMBER,
    rarity: Rarity.EPIC,
    level: 1,
    description: "초대형 탄띠: 장전 약실 슬롯 가용 한도 공간을 +4 칸만큼 추가 개조합니다. 단, 무기가 무거워져 장전 기동력 -10%.",
    statsMultiplier: { chamberBonusSpace: 4, reloadSpeed: 0.9 },
    scrapPrice: 40
  },
  {
    id: "barrel_flare",
    name: "광폭형 전방 확산총열 (Wide Spread Barrel)",
    slot: SlotType.BARREL,
    rarity: Rarity.COMMON,
    level: 1,
    description: "부채꼴 방출: 전방 탄막 퍼짐 궤적이 30% 증가하여 아주 넓은 각도로 폭넓은 포화를 날려 자폭 벌레를 싹쓸이합니다.",
    statsMultiplier: { spread: 1.5, damage: 1.05 },
    scrapPrice: 15
  },
  {
    id: "barrel_snipe",
    name: "초인장 정밀 초크총열 (Choked Choke)",
    slot: SlotType.BARREL,
    rarity: Rarity.RARE,
    level: 1,
    description: "송곳 화망: 탄막 집탄율이 극대화되어 극단적으로 좁은 각도로 곧게 비집고 나갑니다. 보스전 원거리 조준 사격 명품.",
    statsMultiplier: { spread: 0.35, damage: 1.25 },
    scrapPrice: 25
  },
  {
    id: "pump_automatic",
    name: "유압식 자동 왕복 펌프 (Hydraulic Pump)",
    slot: SlotType.PUMP,
    rarity: Rarity.LEGENDARY,
    level: 1,
    description: "퀵 슬라이드: 샷건 격발 딜레이가 즉시 0.3초 감소하여 눈부시게 빠른 기동식 속사를 실현합니다.",
    statsMultiplier: { fireRate: 1.5, reloadSpeed: 1.3 },
    scrapPrice: 60
  },
  {
    id: "auxiliary_blast",
    name: "충격파 배출 압풍 장치 (Impact Discharger)",
    slot: SlotType.AUXILIARY,
    rarity: Rarity.EPIC,
    level: 1,
    description: "수동 장막: 샷건 탄을 발사할 때마다 플레이어 주변 원형 반경으로 적 미세 투사체를 지우는 충격파를 발사합니다.",
    statsMultiplier: { auxShield: 1.0, damage: 0.95 },
    scrapPrice: 35
  },
  {
    id: "core_supercharge",
    name: "화령 마속 마력 과충전 코어 (Supercharger)",
    slot: SlotType.CORE,
    rarity: Rarity.LEGENDARY,
    level: 1,
    description: "원자로: 샷건의 총 피해량이 1.45배 비약설 증가합니다. 단, 탄환이 과적되어 불릿타임 회수 감쇠 배율이 소폭 가중됩니다.",
    statsMultiplier: { damage: 1.45, bulletTimeSpeed: 0.8 },
    scrapPrice: 55
  }
];

export const BASE_ARTIFACTS: Artifact[] = [
  {
    id: "art_compass",
    name: "심연의 결정 나침반 (Crystal Compass)",
    description: "유적 공명: 지도(Map) 스크린에서 일반 물음표 이벤트 방이나 대장간 뒤에 숨겨진 보물방(Treasure)의 심층 위치를 완벽 감지해 표시합니다.",
    rarity: Rarity.COMMON,
    effectType: "COMPASS",
    scrapMaterials: { metal: 20, crystal: 50, core: 5 }
  },
  {
    id: "art_heart",
    name: "유적 심연의 박동 심장 (Abyss Heart)",
    description: "사투 본능: 플레이어의 현재 생명력 체력 퍼센테이지가 낮아질수록, 샷건의 격발 탄환 공격 피해량이 최대 +60%만큼 선형 비례 상승합니다.",
    rarity: Rarity.EPIC,
    effectType: "HEART",
    scrapMaterials: { metal: 40, crystal: 120, core: 30 }
  },
  {
    id: "art_bandolier",
    name: "고대 전사의 사슬 탄띠 (Ancient Bandolier)",
    description: "약설 배선: 탄환 약실의 기본 장용한계를 기가급으로 늘려, 무조건 약실 최대 가용 용량 슬롯을 +2칸 추가 획득합니다.",
    rarity: Rarity.RARE,
    effectType: "BANDOLIER",
    scrapMaterials: { metal: 50, crystal: 60, core: 15 }
  },
  {
    id: "art_clock",
    name: "고장난 마력 톱니 시계 (Broken Magic Clock)",
    description: "영겁 지치: 불릿타임 장전을 활성화했을 때 주변 시간 왜곡 효율이 35% 증대되어 적들이 더욱 느려지고 플레이어는 빠르게 엄폐합니다.",
    rarity: Rarity.RARE,
    effectType: "CLOCK",
    scrapMaterials: { metal: 30, crystal: 80, core: 22 }
  },
  {
    id: "art_chalice",
    name: "성혈의 결정 붉은 성배 (Crimson Chalice)",
    description: "흡혈 수확: 심연의 괴수나 엘리트를 소멸 처리할 때마다 12%의 확률로 마력 피흡 효과가 발생하여 피를 3씩 회복시켜 줍니다.",
    rarity: Rarity.LEGENDARY,
    effectType: "CHALICE",
    scrapMaterials: { metal: 100, crystal: 200, core: 80 }
  }
];

export const MOCK_LEADERBOARD: { name: string; score: number; floor: number; kills: number; date: string }[] = [
  { name: "도트사냥꾼", score: 12400, floor: 12, kills: 142, date: "2026-06-18" },
  { name: "결정의지배자", score: 9850, floor: 9, kills: 110, date: "2026-06-19" },
  { name: "AbyssMaster", score: 8600, floor: 8, kills: 94, date: "2026-06-17" },
  { name: "샷건의신", score: 7100, floor: 7, kills: 81, date: "2026-06-19" },
  { name: "슬레이어", score: 5500, floor: 5, kills: 63, date: "2026-06-15" }
];

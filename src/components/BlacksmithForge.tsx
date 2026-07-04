/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  ShotgunPart, 
  Artifact, 
  ScrapMaterials, 
  SlotType, 
  Rarity,
  PlayerStats
} from "../types";
import { 
  Wrench, 
  Hammer, 
  Shuffle, 
  ShieldCheck, 
  Flame, 
  Coins, 
  Dna,
  Sliders,
  Trash2,
  TrendingUp
} from "lucide-react";

interface BlacksmithForgeProps {
  playerStats: PlayerStats;
  setPlayerStats: React.Dispatch<React.SetStateAction<PlayerStats>>;
  equippedParts: ShotgunPart[];
  setEquippedParts: React.Dispatch<React.SetStateAction<ShotgunPart[]>>;
  ownedParts: ShotgunPart[];
  setOwnedParts: React.Dispatch<React.SetStateAction<ShotgunPart[]>>;
  artifacts: Artifact[];
  setArtifacts: React.Dispatch<React.SetStateAction<Artifact[]>>;
  onCloseForge: () => void;
}

export default function BlacksmithForge({
  playerStats,
  setPlayerStats,
  equippedParts,
  setEquippedParts,
  ownedParts,
  setOwnedParts,
  artifacts,
  setArtifacts,
  onCloseForge,
}: BlacksmithForgeProps) {
  
  const [activeSlot, setActiveSlot] = useState<SlotType | null>(null);

  // Compute stats multipliers based on parts equipped
  const getSimulatedStats = () => {
    let damage = 1.0;
    let rate = 1.0;
    let spread = 1.0;
    let recoil = 1.0;
    let reload = 1.0;
    let knockback = 1.0;

    equippedParts.forEach((part) => {
      // Scale percentages slightly by part levels
      const levelBonus = 1 + (part.level - 1) * 0.15;
      
      if (part.statsMultiplier.damage) {
        damage *= (1 + (part.statsMultiplier.damage - 1) * levelBonus);
      }
      if (part.statsMultiplier.fireRate) {
        rate *= (1 + (part.statsMultiplier.fireRate - 1) * levelBonus);
      }
      if (part.statsMultiplier.spread) {
        spread *= (1 + (part.statsMultiplier.spread - 1) * levelBonus);
      }
      if (part.statsMultiplier.recoil) {
        recoil *= (1 + (part.statsMultiplier.recoil - 1) * levelBonus);
      }
      if (part.statsMultiplier.reloadSpeed) {
        reload *= (1 + (part.statsMultiplier.reloadSpeed - 1) * levelBonus);
      }
      if (part.statsMultiplier.barrelKnockback) {
        knockback *= (1 + (part.statsMultiplier.barrelKnockback - 1) * levelBonus);
      }
    });

    return {
      damage: damage.toFixed(2),
      fireRate: rate.toFixed(2),
      spread: spread.toFixed(2),
      recoil: recoil.toFixed(2),
      reloadSpeed: reload.toFixed(2),
      knockback: knockback.toFixed(2)
    };
  };

  const currentStats = getSimulatedStats();

  const handleEquipPart = (part: ShotgunPart) => {
    // Unequip currently slotted part of the same slot
    const alreadySlotted = equippedParts.find((p) => p.slot === part.slot);
    let nextEquipped = equippedParts.filter((p) => p.slot !== part.slot);

    nextEquipped.push(part);
    setEquippedParts(nextEquipped);

    // Swap inventory
    let nextOwned = ownedParts.filter((p) => p.id !== part.id);
    if (alreadySlotted) {
      nextOwned.push(alreadySlotted);
    }
    setOwnedParts(nextOwned);
  };

  const handleUnequipPart = (part: ShotgunPart) => {
    setEquippedParts(equippedParts.filter((p) => p.id !== part.id));
    setOwnedParts([...ownedParts, part]);
  };

  // Hard Scrapping / Dismantling Artifact to acquire materials! (유물 분해)
  const handleScrapArtifact = (artifact: Artifact) => {
    if (!confirm(`스크랩 경고: [${artifact.name}] 유물을 영구 분해하시겠습니까? 대량의 강화 재료를 정류 획득하게 됩니다.`)) {
      return;
    }

    // Material yields
    const yieldMetal = artifact.scrapMaterials.metal;
    const yieldCrystal = artifact.scrapMaterials.crystal;
    const yieldCore = artifact.scrapMaterials.core;

    setArtifacts(artifacts.filter((a) => a.id !== artifact.id));

    setPlayerStats((prev) => {
      const scraps = { ...prev.scraps };
      scraps.metal += yieldMetal;
      scraps.crystal += yieldCrystal;
      scraps.core += yieldCore;
      // also give other random raw catalysts
      scraps.rune += 1;
      scraps.wood += 2;
      scraps.powder += 1;

      return {
        ...prev,
        scraps,
        score: prev.score + 300, // rewarded score on smithing
      };
    });
  };

  // Upgrade weapons elements parts levels! Costs scraps! (부품 강화)
  const getUpgradeCost = (part: ShotgunPart) => {
    // Costs increase exponentially by tier and rare tier
    const multiplier = part.rarity === Rarity.LEGENDARY ? 3 : part.rarity === Rarity.EPIC ? 2 : 1;
    return {
      metal: Math.round(15 * part.level * multiplier),
      crystal: Math.round(25 * part.level * multiplier),
      core: part.level > 1 ? Math.round(2 * part.level * multiplier) : 0,
    };
  };

  const handleUpgradePart = (part: ShotgunPart, isSlotted: boolean) => {
    const cost = getUpgradeCost(part);
    const s = playerStats.scraps;
    
    if (s.metal < cost.metal || s.crystal < cost.crystal || s.core < cost.core) {
      alert("강화 부품 원자재 부족! 유물을 분해하거나 전리품 상자를 격파하여 고대 금속과 결정을 모으십시오.");
      return;
    }

    // Spend materials
    setPlayerStats((prev) => {
      const nextScraps = { ...prev.scraps };
      nextScraps.metal -= cost.metal;
      nextScraps.crystal -= cost.crystal;
      nextScraps.core -= cost.core;
      return { ...prev, scraps: nextScraps };
    });

    const levelUp = (p: ShotgunPart) => {
      if (p.id === part.id) {
        return { ...p, level: p.level + 1 };
      }
      return p;
    };

    if (isSlotted) {
      setEquippedParts(equippedParts.map(levelUp));
    } else {
      setOwnedParts(ownedParts.map(levelUp));
    }
  };

  const getSlotTypeLabel = (slot: SlotType) => {
    switch (slot) {
      case SlotType.BARREL: return "총열 (Barrel)";
      case SlotType.CHAMBER: return "약실 (Chamber)";
      case SlotType.PUMP: return "펌프 (Pump)";
      case SlotType.TRIGGER: return "방아쇠 (Trigger)";
      case SlotType.STOCK: return "개머리판 (Stock)";
      case SlotType.CORE: return "마력 코어 (Magic Core)";
      case SlotType.AUXILIARY: return "보조 장치 (Aux Device)";
    }
  };

  const getRarityColor = (rarity: Rarity) => {
    switch (rarity) {
      case Rarity.COMMON: return "text-gray-400 border-gray-800";
      case Rarity.RARE: return "text-blue-400 border-blue-900";
      case Rarity.EPIC: return "text-purple-400 border-purple-900";
      case Rarity.LEGENDARY: return "text-yellow-400 border-yellow-800";
      case Rarity.MYTHIC: return "text-red-400 border-red-900";
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 p-6 rounded-xl border border-white/5 bg-black/65 backdrop-blur-md text-white font-sans shadow-2xl relative overflow-hidden">
      
      {/* Background aesthetic grid overlay */}
      <div className="absolute inset-0 opacity-10 pointer-events-none immersive-dungeon-grid" />

      {/* Header and Close */}
      <div className="flex flex-col md:flex-row items-center justify-between border-b border-white/5 pb-4 gap-4 relative z-10 font-sans">
        <div className="flex items-center gap-3">
          <Hammer className="w-6 h-6 text-yellow-500 animate-pulse" />
          <div>
            <h2 className="text-base font-black text-white px-0.5 tracking-wider font-heading uppercase">
              고대 심연 대장간 (Crucible Forgery)
            </h2>
            <p className="text-[10px] text-gray-400 mt-0.5 font-mono">
              샷건 부품을 장착/추가하고 유물을 분해하여 고성능 화기를 개조하십시오 // CRUCIBLE ARMORY
            </p>
          </div>
        </div>
        <button 
          onClick={onCloseForge}
          className="px-6 py-2 bg-[#ff4e00] hover:bg-[#ff621f] text-white font-extrabold text-xs transition-colors rounded-lg shadow-md border border-white/10 cursor-pointer"
        >
          대장간 나가기
        </button>
      </div>

      {/* Materials Dashboard Row */}
      <div className="bg-black/40 p-4 rounded-lg border border-white/5 flex flex-wrap gap-4 items-center justify-around text-xs font-mono relative z-10 shadow-inner">
        <span className="font-extrabold tracking-widest text-[#ff4e00] text-[10px]">MATERIAL QUANTITIES:</span>
        <div className="flex items-center gap-1.5 text-gray-300">
          <span className="text-yellow-500 font-bold font-sans">🔘 고대 금속:</span>
          <span>{playerStats.scraps.metal}</span>
        </div>
        <div className="flex items-center gap-1.5 text-gray-300">
          <span className="text-sky-400 font-bold font-sans">✨ 결정 파편:</span>
          <span>{playerStats.scraps.crystal}</span>
        </div>
        <div className="flex items-center gap-1.5 text-gray-300">
          <span className="text-purple-400 font-bold font-sans">🔮 마력 코어:</span>
          <span>{playerStats.scraps.core}</span>
        </div>
        <div className="flex items-center gap-1.5 text-gray-300">
          <span className="text-emerald-400 font-sans">🌀 탄도 룬:</span>
          <span>{playerStats.scraps.rune}</span>
        </div>
        <div className="flex items-center gap-1.5 text-gray-300">
          <span className="text-amber-600 font-sans">🪵 강화 목재:</span>
          <span>{playerStats.scraps.wood}</span>
        </div>
        <div className="flex items-center gap-1.5 text-gray-300">
          <span className="text-red-400 font-sans">💥 폭발 가루:</span>
          <span>{playerStats.scraps.powder}</span>
        </div>
      </div>

      {/* Primary Layout splits content: Left stats & equipped. Right Upgrades & Scraps */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        
        {/* Box Left: Shotgun Slotted Parts Setup */}
        <div className="lg:col-span-7 flex flex-col gap-4 bg-black/40 p-4 rounded-xl border border-white/5">
          <div className="flex justify-between items-center pb-2 border-b border-white/5 font-mono">
            <h3 className="text-xs font-bold text-yellow-400 flex items-center gap-1.5 uppercase font-sans">
              <Sliders className="w-3.5 h-3.5" /> 샷건 파츠 구성 (Equipped Modular Hardware)
            </h3>
            <span className="text-[10px] text-gray-400">클릭하면 부품을 탈거합니다.</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {Object.values(SlotType).map((slot) => {
              const part = equippedParts.find((p) => p.slot === slot);
              return (
                <div 
                  key={slot}
                  className="p-3.5 border border-white/5 bg-black/40 rounded-xl min-h-[110px] flex flex-col relative group hover:border-yellow-500/30 transition-all font-mono"
                >
                  <span className="text-[9px] text-[#a855f7] font-black uppercase tracking-wider">{getSlotTypeLabel(slot)}</span>
                  
                  {part ? (
                    <div className="mt-2 text-xs flex flex-col h-full font-sans">
                      <div className="flex justify-between w-full font-mono">
                        <strong className={`font-black ${getRarityColor(part.rarity)}`}>{part.name}</strong>
                        <span className="text-[10px] text-yellow-400 font-extrabold pl-1.5">LV.{part.level}</span>
                      </div>
                      <span className="text-[10px] text-gray-400 mt-1 lines-clamp-2 leading-relaxed">{part.description}</span>
                      
                      <div className="mt-auto pt-3 flex gap-2 font-mono">
                        <button 
                          onClick={() => handleUnequipPart(part)}
                          className="px-2.5 py-1 border border-white/10 hover:border-red-500 hover:text-red-400 text-[#a855f7] hover:bg-red-950/20 text-[9px] font-bold rounded-md transition-colors cursor-pointer"
                        >
                          탈거 (Strip)
                        </button>
                        <button 
                          onClick={() => handleUpgradePart(part, true)}
                          className="px-2.5 py-1 border border-yellow-500/30 text-yellow-300 hover:bg-yellow-950/30 text-[9px] font-bold rounded-md flex items-center gap-0.5 transition-colors cursor-pointer"
                        >
                          <TrendingUp className="w-2.5 h-2.5" /> 강화
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 text-[10px] text-gray-600 italic">
                      빈 슬롯
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Calculated hardware stats */}
          <div className="mt-2 p-3 bg-[#0a0502]/90 rounded-lg border border-white/5 text-[11px] font-mono grid grid-cols-2 md:grid-cols-3 gap-2.5 text-gray-400">
            <div>🔥 피해량 계수: <strong className="text-white">x{currentStats.damage}</strong></div>
            <div>⏱️ 사격속도 계수: <strong className="text-white">x{currentStats.fireRate}</strong></div>
            <div>📐 탄 퍼짐 폭: <strong className="text-white">x{currentStats.spread}</strong></div>
            <div>💢 반동 계수: <strong className="text-white">x{currentStats.recoil}</strong></div>
            <div>🔄 재장전 계수: <strong className="text-white">x{currentStats.reloadSpeed}</strong></div>
            <div>🤛 넉백 마찰: <strong className="text-white">x{currentStats.knockback}</strong></div>
          </div>
        </div>

        {/* Box Right: Inventory Slots and Relic Salvaging */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          
          {/* Section: Swapping Hardware Inventory */}
          <div className="bg-black/40 p-4 rounded-xl border border-white/5 flex flex-col gap-3">
            <h3 className="text-xs font-bold text-cyan-400 flex items-center gap-1.5 uppercase font-mono">
              <Shuffle className="w-3.5 h-3.5" /> 보유 부품 목록 (Unequipped Spares)
            </h3>

            <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
              {ownedParts.length === 0 ? (
                <div className="text-[10px] text-gray-500 italic p-3 text-center bg-black/40 border border-white/5 rounded-lg">
                  보유한 여유 무기 부품이 없습니다.
                </div>
              ) : (
                ownedParts.map((part) => (
                  <div key={part.id} className="p-2 border border-white/5 bg-black/30 rounded-lg flex justify-between items-center text-xs hover:border-neon-purple/30 transition-all">
                    <div>
                      <div className="flex gap-1.5 items-center font-mono">
                        <strong className={`font-black ${getRarityColor(part.rarity)}`}>{part.name}</strong>
                        <span className="text-[9px] bg-[#2e1d42] border border-neon-purple/20 px-1 py-0.2 rounded text-neon-purple">LV.{part.level}</span>
                      </div>
                      <p className="text-[10px] text-gray-400 line-clamp-1 leading-relaxed">{part.description}</p>
                    </div>
                    <div className="flex gap-1.5 font-mono">
                      <button 
                        onClick={() => handleEquipPart(part)}
                        className="px-2.5 py-1 bg-purple-900 border border-purple-700 hover:bg-purple-800 text-white font-extrabold text-[10px] rounded transition-colors cursor-pointer"
                      >
                        장착
                      </button>
                      <button 
                        onClick={() => handleUpgradePart(part, false)}
                        className="px-2 py-1 border border-yellow-500/30 text-yellow-300 hover:bg-yellow-950/20 text-[10px] rounded transition-colors cursor-pointer"
                        title="업그레이드 완료"
                      >
                        강화
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Section: Dismantle Relics Scrapper */}
          <div className="bg-black/40 p-4 rounded-xl border border-white/5 flex flex-col gap-3">
            <div className="flex justify-between items-center font-mono">
              <h3 className="text-xs font-bold text-red-400 flex items-center gap-1.5 uppercase font-sans">
                <Trash2 className="w-3.5 h-3.5" /> 결정 유물 분해기 (Relic Salvaging Unit)
              </h3>
              <span className="text-[8px] bg-red-950 text-red-300 font-bold px-1.5 py-0.5 rounded border border-red-500/20">주의: 파괴</span>
            </div>

            <div className="flex flex-col gap-2 max-h-[190px] overflow-y-auto pr-1">
              {artifacts.length === 0 ? (
                <div className="text-[10px] text-gray-500 italic p-3 text-center bg-black/40 border border-white/5 rounded-lg">
                  분해 가능한 결정 유물이 없습니다.
                </div>
              ) : (
                artifacts.map((art) => (
                  <div key={art.id} className="p-2 border border-red-950/20 bg-red-950/5 rounded-lg flex justify-between items-center text-xs gap-3">
                    <div className="flex-1">
                      <strong className="text-purple-300 font-bold">{art.name}</strong>
                      <p className="text-[10px] text-gray-400 line-clamp-1 mt-0.5">{art.description}</p>
                    </div>
                    <button 
                      onClick={() => handleScrapArtifact(art)}
                      className="px-3 py-1 bg-red-950 text-red-300 border border-red-800 hover:bg-red-900/30 font-bold text-[10px] rounded transition-all cursor-pointer"
                    >
                      <span>분해</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
          
        </div>

      </div>

    </div>
  );
}

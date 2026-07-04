/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { BulletCard, ElementType, Rarity } from "../types";
import { Sparkles, Shield, RefreshCw, Zap, Flame, Snowflake, AlertOctagon, HelpCircle } from "lucide-react";

interface ReloadDeckProps {
  deck: BulletCard[];
  chamber: BulletCard[];
  setChamber: React.Dispatch<React.SetStateAction<BulletCard[]>>;
  chamberCapacity: number;
  onFinishReload: () => void;
}

export default function ReloadDeck({
  deck,
  chamber,
  setChamber,
  chamberCapacity,
  onFinishReload,
}: ReloadDeckProps) {
  
  // Local active staging buffer for loading selection
  const [stagedChamber, setStagedChamber] = useState<BulletCard[]>([...chamber]);
  
  const getStagedSpace = () => stagedChamber.reduce((sum, c) => sum + c.space, 0);

  const handleAddBullet = (card: BulletCard) => {
    const currentSpace = getStagedSpace();
    if (currentSpace + card.space > chamberCapacity) {
      alert(`약실 공간 부족! 현재 남은 수용량: ${chamberCapacity - currentSpace}칸 / 이 카드 크기: ${card.space}칸`);
      return;
    }
    // append to staged chamber (FIFO queue)
    setStagedChamber([...stagedChamber, { ...card, id: card.id + "_" + Math.random() }]);
  };

  const handleRemoveBullet = (index: number) => {
    const next = [...stagedChamber];
    next.splice(index, 1);
    setStagedChamber(next);
  };

  const handleClearChamber = () => {
    setStagedChamber([]);
  };

  const handleConfirmReload = () => {
    setChamber(stagedChamber);
    onFinishReload();
  };

  const getCardIcon = (el: ElementType) => {
    switch (el) {
      case ElementType.FIRE: return <Flame className="w-4 h-4 text-orange-500" />;
      case ElementType.ICE: return <Snowflake className="w-4 h-4 text-sky-400" />;
      case ElementType.LIGHTNING: return <Zap className="w-4 h-4 text-yellow-400" />;
      case ElementType.EXPLOSIVE: return <Sparkles className="w-4 h-4 text-red-500" />;
      case ElementType.VOID: return <Shield className="w-4 h-4 text-purple-400" />;
      default: return <RefreshCw className="w-4 h-4 text-gray-400" />;
    }
  };

  const getRarityBadge = (rarity: Rarity) => {
    switch (rarity) {
      case Rarity.COMMON: return <span className="text-[9px] px-1 bg-gray-800 text-gray-300 rounded font-bold">일반 (Common)</span>;
      case Rarity.RARE: return <span className="text-[9px] px-1 bg-blue-950 text-blue-300 rounded font-bold">희귀 (Rare)</span>;
      case Rarity.EPIC: return <span className="text-[9px] px-1 bg-purple-950 text-purple-300 rounded font-bold">영웅 (Epic)</span>;
      case Rarity.LEGENDARY: return <span className="text-[9px] px-1 bg-yellow-950 text-yellow-300 rounded font-bold">전설 (Legend)</span>;
      case Rarity.MYTHIC: return <span className="text-[9px] px-1 bg-red-950 text-red-300 rounded font-bold animate-pulse">신화 (Mythic)</span>;
    }
  };

  const getBulletBgColor = (element: ElementType) => {
    switch (element) {
      case ElementType.FIRE: return "bg-orange-950/20 shadow-orange-950/40 hover:bg-orange-950/30 border-orange-950";
      case ElementType.ICE: return "bg-sky-950/20 shadow-sky-950/40 hover:bg-sky-950/30 border-sky-950";
      case ElementType.LIGHTNING: return "bg-yellow-950/20 shadow-yellow-950/40 hover:bg-yellow-950/30 border-yellow-950";
      case ElementType.VOID: return "bg-purple-950/20 shadow-purple-950/40 hover:bg-purple-950/30 border-purple-950";
      case ElementType.EXPLOSIVE: return "bg-red-950/20 shadow-red-950/40 hover:bg-red-950/30 border-red-950";
      default: return "bg-gray-950/20 shadow-gray-950/30 hover:bg-gray-950/30 border-gray-900";
    }
  };

  const currentSpace = getStagedSpace();
  const spacePct = Math.min(100, (currentSpace / chamberCapacity) * 100);

  return (
    <div className="w-full flex flex-col gap-6 p-6 rounded-xl border border-white/5 bg-black/75 backdrop-blur-md text-white font-sans shadow-2xl animate-fade-in relative z-20 overflow-hidden">
      
      {/* Background radial overlay */}
      <div className="absolute inset-0 opacity-10 pointer-events-none immersive-dungeon-grid" />

      {/* Bullet Time Indicator */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff4e00] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-[#ff4e00]"></span>
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider font-heading">
              ⏳ 불릿타임 장전 모드 활성화 (Slowing Time...)
            </h3>
            <p className="text-[10px] text-gray-400 mt-0.5 font-mono">
              선입선출(FIFO) 방식으로 수집한 주술 카드를 샷건 약실에 결합주입 하십시오.
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={handleClearChamber}
            className="px-3 py-1.5 text-xs font-bold border border-red-500/30 bg-red-950/20 hover:bg-red-900/30 transition-all rounded text-red-400 cursor-pointer"
          >
            약실 비우기
          </button>
          <button 
            onClick={handleConfirmReload}
            className="px-4 py-2 text-xs bg-[#ff4e00] hover:bg-[#ff621f] text-white font-extrabold transition-all rounded-lg shadow-lg border border-white/10 tracking-wide cursor-pointer"
          >
            장전 완료 & 격발준비
          </button>
        </div>
      </div>

      {/* Chamber Occupied Bar Indicator */}
      <div className="bg-black/50 border border-white/5 p-4 rounded-lg flex flex-col gap-2 relative z-10">
        <div className="flex justify-between items-center text-xs font-mono">
          <span className="text-gray-400">총 약실 충전 용량 (CHAMBER SLOT GAUGE):</span>
          <span className={`font-black ${currentSpace >= chamberCapacity ? 'text-red-400' : 'text-[#a855f7]'}`}>
            {currentSpace} / {chamberCapacity} SPACES FILLED
          </span>
        </div>
        
        {/* Progress gauge */}
        <div className="w-full h-3 bg-black/80 rounded-full overflow-hidden border border-white/5">
          <div 
            className="h-full bg-gradient-to-r from-[#ff4e00] to-[#a855f7] rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(255,78,0,0.5)]"
            style={{ width: `${spacePct}%` }}
          />
        </div>

        {/* Real-time staged bullet list with clickable delete buttons */}
        <div className="flex flex-wrap gap-2.5 items-center mt-2 min-h-[46px] p-2.5 rounded-lg border border-dashed border-white/10 bg-black/40">
          {stagedChamber.length === 0 ? (
            <span className="text-[10px] text-gray-500 pl-2 font-mono">약실에 결합 장전된 카드가 없습니다. 하단의 탄환 카드를 누르면 약실에 장전됩니다.</span>
          ) : (
            stagedChamber.map((card, idx) => {
              const lowerName = card.name.toLowerCase();
              let indicatorColor = "border-neon-purple/30 bg-[#2e1d42]/30 text-purple-200";
              if (lowerName.includes("화염") || card.element === "FIRE") indicatorColor = "border-orange-500/30 bg-orange-950/20 text-orange-200";
              else if (lowerName.includes("빙결") || card.element === "ICE") indicatorColor = "border-blue-500/30 bg-blue-950/20 text-blue-200";

              return (
                <div 
                  key={`${card.id}_staged_${idx}`}
                  onClick={() => handleRemoveBullet(idx)}
                  className={`group relative cursor-pointer px-3 py-1.5 text-xs rounded border text-purple-200 hover:bg-red-950 hover:border-red-500 hover:text-red-400 flex items-center gap-2 transition-all font-mono ${indicatorColor}`}
                >
                  {getCardIcon(card.element)}
                  <span className="font-bold">[{idx + 1}] {card.name.split(" ")[0]}</span>
                  <span className="text-[8px] bg-black/40 px-1 py-0.5 rounded font-black">{card.space}칸</span>
                  
                  {/* Delete hint icon */}
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[7px] w-3 h-3 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 font-sans">
                    x
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Available Hand Cards Select Block (Slay the Spire Fan array layout) */}
      <div className="flex flex-col gap-2 relative z-10">
        <h4 className="text-xs font-bold text-gray-400 px-1 font-mono tracking-wider">장전 대기 카드 보유 목록 (Your Ammo Magazine)</h4>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[290px] overflow-y-auto pr-1 scrollbar-thin select-none">
          {deck.map((card, idx) => {
            const bgClass = getBulletBgColor(card.element);
            const lowerName = card.name.toLowerCase();
            let borderHoverColor = "hover:border-[#ff4e00] hover:shadow-[0_0_15px_rgba(255,78,0,0.15)]";
            if (lowerName.includes("빙결") || card.element === "ICE") borderHoverColor = "hover:border-blue-500 hover:shadow-[0_0_15px_rgba(59,130,246,0.15)]";
            else if (lowerName.includes("전격") || card.element === "LIGHTNING") borderHoverColor = "hover:border-purple-500 hover:shadow-[0_0_15px_rgba(168,85,247,0.15)]";

            return (
              <button
                key={`${card.id}_deck_${idx}`}
                onClick={() => handleAddBullet(card)}
                className={`p-2.5 border border-white/5 rounded-xl flex flex-col text-left transition-all duration-150 shadow-md bg-black/40 backdrop-blur-md cursor-pointer ${borderHoverColor} ${bgClass}`}
              >
                <div className="flex items-center justify-between mb-1 w-full font-mono">
                  <div className="flex items-center gap-1.5">
                    {getCardIcon(card.element)}
                    <span className="text-[11px] font-black text-white tracking-wide">{card.name}</span>
                  </div>
                  {getRarityBadge(card.rarity)}
                </div>

                <div className="text-[10px] text-gray-400 mb-2 leading-relaxed">
                  {card.description}
                </div>

                <div className="w-full mt-auto pt-1.5 border-t border-white/5 flex justify-between items-center text-[9px] text-gray-500 font-mono">
                  <span className="text-[#ff4e00] font-bold">피해: {card.damage}</span>
                  <span className="px-1.5 py-0.5 bg-black/30 text-neon-purple rounded border border-white/5 font-bold">
                    {card.space} 칸 소모
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

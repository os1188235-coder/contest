/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { BulletCard, ShotgunPart, PlayerStats, Rarity } from "../types";
import { BASE_CARDS, BASE_PARTS } from "../data";
import { ShoppingBag, Coins, Heart, Sparkles, Flame, PlusCircle, ShoppingCart } from "lucide-react";

interface AdventureShopProps {
  playerStats: PlayerStats;
  setPlayerStats: React.Dispatch<React.SetStateAction<PlayerStats>>;
  deck: BulletCard[];
  setDeck: React.Dispatch<React.SetStateAction<BulletCard[]>>;
  ownedParts: ShotgunPart[];
  setOwnedParts: React.Dispatch<React.SetStateAction<ShotgunPart[]>>;
  onCloseShop: () => void;
}

export default function AdventureShop({
  playerStats,
  setPlayerStats,
  deck,
  setDeck,
  ownedParts,
  setOwnedParts,
  onCloseShop,
}: AdventureShopProps) {

  // Offer dynamic goods
  const healPrice = 25;
  const maxHpPrice = 45;

  const shopCards: BulletCard[] = [
    { ...BASE_CARDS[2], id: "shop_c1", cost: 20 }, // electric
    { ...BASE_CARDS[3], id: "shop_c2", cost: 35 }, // void
    { ...BASE_CARDS[5], id: "shop_c3", cost: 40 }, // grenade
    { ...BASE_CARDS[9], id: "shop_c4", cost: 20 }, // draw
  ];

  const shopParts: ShotgunPart[] = [
    { ...BASE_PARTS[6], id: "shop_p1", scrapPrice: 30 }, // Sniped precision barrel
    { ...BASE_PARTS[7], id: "shop_p2", scrapPrice: 45 }, // Rapid Automatic Pump
  ];

  const handleBuyHeal = () => {
    if (playerStats.gold < healPrice) {
      alert("골드 부족!");
      return;
    }
    if (playerStats.hp >= playerStats.maxHp) {
      alert("이미 체력이 가득 차 있습니다!");
      return;
    }
    setPlayerStats(prev => ({
      ...prev,
      gold: prev.gold - healPrice,
      hp: Math.min(prev.maxHp, prev.hp + 35)
    }));
    alert("피륙 치유! 체력이 +35 만큼 회복되었습니다.");
  };

  const handleBuyMaxHp = () => {
    if (playerStats.gold < maxHpPrice) {
      alert("골드 부족!");
      return;
    }
    setPlayerStats(prev => ({
      ...prev,
      gold: prev.gold - maxHpPrice,
      maxHp: prev.maxHp + 20,
      hp: prev.hp + 20
    }));
    alert("생명력 증강! 최대 체력이 +20 만큼 영구 증가했습니다.");
  };

  const handleBuyCard = (card: BulletCard) => {
    if (playerStats.gold < card.cost) {
      alert("골드 부족!");
      return;
    }
    // Spend gold
    setPlayerStats(prev => ({ ...prev, gold: prev.gold - card.cost }));
    // Append to deck
    setDeck([...deck, { ...card, id: "card_" + Math.random() }]);
    alert(`[${card.name}] 카드를 구매하여 탄지 대기 덱에 동화시켰습니다!`);
  };

  const handleBuyPart = (part: ShotgunPart) => {
    const cost = part.scrapPrice; // buying price
    if (playerStats.gold < cost) {
      alert("골드 부족!");
      return;
    }
    // Spend gold
    setPlayerStats(prev => ({ ...prev, gold: prev.gold - cost }));
    // Append part
    setOwnedParts([...ownedParts, { ...part, id: "part_" + Math.random() }]);
    alert(`[${part.name}] 무기 모듈을 획득했습니다! 대장간에서 즉시 구성하십시오.`);
  };

  const getRarityBadge = (rarity: Rarity) => {
    switch (rarity) {
      case Rarity.COMMON: return "일반";
      case Rarity.RARE: return "희귀";
      case Rarity.EPIC: return "영웅";
      case Rarity.LEGENDARY: return "전설";
      default: return "일반";
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 p-6 rounded-xl border border-white/5 bg-black/65 backdrop-blur-md text-white font-sans shadow-2xl relative overflow-hidden">
      
      {/* Background aesthetic grid overlay */}
      <div className="absolute inset-0 opacity-10 pointer-events-none immersive-dungeon-grid" />

      {/* Header and Close */}
      <div className="flex flex-col md:flex-row items-center justify-between border-b border-white/5 pb-4 gap-4 relative z-10">
        <div className="flex items-center gap-3">
          <ShoppingBag className="w-6 h-6 text-[#10b981] animate-pulse" />
          <div>
            <h2 className="text-base font-black text-white uppercase tracking-wider font-heading">
              심연의 마력 행상인 (Abyss Drifter Shop)
            </h2>
            <p className="text-[10px] text-gray-400 mt-0.5 font-mono">
              결정 유적의 괴수를 사살하고 모은 금화로 특수한 유인성 탄환과 보강 부품을 사들이십시오 // UTILITY DEPOT
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="flex items-center gap-2 px-4 py-2 bg-yellow-950/20 border border-yellow-500/20 rounded text-yellow-400 font-bold text-xs font-mono">
            <Coins className="w-4 h-4 text-yellow-400" />
            <span>보유 금화: {playerStats.gold}</span>
          </div>
          <button 
            onClick={onCloseShop}
            className="px-6 py-2 bg-[#ff4e00] hover:bg-[#ff621f] text-white font-extrabold text-xs transition-colors rounded-lg shadow-md border border-white/10 cursor-pointer"
          >
            상점 떠나기
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">

        {/* Column 1: Medical Supplies */}
        <div className="p-4.5 rounded-lg bg-black/40 border border-white/5 flex flex-col gap-4">
          <h3 className="text-xs font-bold text-[#10b981] uppercase tracking-wider flex items-center gap-1.5 font-mono">
            <Heart className="w-4 h-4 text-red-500" /> 생존 지원 보충제 (Survival Medicals)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-1">
            <div className="p-4 border border-white/5 bg-black/40 rounded-xl flex flex-col justify-between hover:border-red-500/30 transition-all">
              <div>
                <strong className="text-xs font-bold text-white block">심원 자색 치유초 (Abyss Herb)</strong>
                <span className="text-[10px] text-gray-400 block mt-1 font-mono leading-relaxed">플레이어의 체력을 즉시 35HP 만큼 긴급 회복시킵니다.</span>
              </div>
              <button 
                onClick={handleBuyHeal}
                className="mt-4 w-full py-2 bg-red-950/20 border border-red-500/30 font-bold hover:bg-red-950/40 text-xs rounded text-red-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>💰 {healPrice} 골드</span>
              </button>
            </div>

            <div className="p-4 border border-white/5 bg-black/40 rounded-xl flex flex-col justify-between hover:border-yellow-500/30 transition-all">
              <div>
                <strong className="text-xs font-bold text-white block">마력의 생명수정 (Life Spike)</strong>
                <span className="text-[10px] text-gray-400 block mt-1 font-mono leading-relaxed">최대 체력을 +20 칸 증축하며, 생명 한도를 획기적으로 늘립니다.</span>
              </div>
              <button 
                onClick={handleBuyMaxHp}
                className="mt-4 w-full py-2 bg-yellow-950/20 border border-yellow-500/30 font-bold hover:bg-yellow-950/40 text-xs rounded text-yellow-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>💰 {maxHpPrice} 골드</span>
              </button>
            </div>
          </div>
        </div>

        {/* Column 2: Exclusive Weapons hardware modules */}
        <div className="p-4.5 rounded-lg bg-black/40 border border-white/5 flex flex-col gap-4">
          <h3 className="text-xs font-bold text-yellow-500 uppercase tracking-wider flex items-center gap-1.5 font-mono">
            <Sparkles className="w-4 h-4 text-yellow-500" /> 특수무기 기계 보조 모듈 (Custom Shotgun hardware)
          </h3>

          <div className="flex flex-col gap-3 max-h-[190px] overflow-y-auto">
            {shopParts.map((part) => (
              <div key={part.id} className="p-3 border border-white/5 bg-black/30 rounded-lg flex justify-between items-center text-xs gap-4 hover:border-yellow-500/30 transition-all">
                <div>
                  <strong className="text-white font-bold text-xs">{part.name}</strong>
                  <p className="text-[10px] text-gray-400 mt-0.5 font-mono leading-relaxed line-clamp-1">{part.description}</p>
                </div>
                <button 
                  onClick={() => handleBuyPart(part)}
                  className="px-3.5 py-2 bg-black hover:bg-yellow-950/20 border border-yellow-500/40 font-bold rounded text-[11px] text-yellow-400 whitespace-nowrap transition-all cursor-pointer"
                >
                  💰 {part.scrapPrice} 골드
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Big Row: Rare bullet spells cards */}
      <div className="p-4.5 rounded-lg bg-black/40 border border-white/5 flex flex-col gap-3 relative z-10">
        <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
          <ShoppingCart className="w-4 h-4 text-[#38bdf8]" /> 탄환 스펠 스토어 매대 (Magic Shells & Spells)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {shopCards.map((card) => (
            <div key={card.id} className="p-3.5 border border-white/5 bg-black/40 rounded-xl flex flex-col justify-between hover:border-[#10b981]/50 transition-all">
              <div>
                <div className="flex justify-between items-center mb-1.5 font-mono">
                  <strong className="text-white text-xs font-black">{card.name.split(" ")[0]}</strong>
                  <span className="text-[9px] text-[#38bdf8] font-bold">{getRarityBadge(card.rarity)}</span>
                </div>
                <p className="text-[11px] text-gray-400 mt-1.5 font-mono leading-relaxed line-clamp-2">{card.description}</p>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-2.5 font-mono">
                <span className="text-[9px] bg-black/60 border border-white/5 px-2 py-0.5 rounded text-[#10b981] font-semibold">{card.space} 칸 소모</span>
                <button 
                  onClick={() => handleBuyCard(card)}
                  className="px-3 py-1 bg-emerald-950 text-[10px] text-emerald-200 hover:bg-[#10b981] hover:text-black font-extrabold rounded-md transition-all cursor-pointer"
                >
                  💰 {card.cost} 골드
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { PlayerStats, ShotgunPart, BulletCard, ElementType, Rarity } from "../types";
import { BASE_PARTS } from "../data";
import { Compass, Sparkle, AlertTriangle, MessageSquare, Milestone, Award } from "lucide-react";

interface AdventureEventProps {
  playerStats: PlayerStats;
  setPlayerStats: React.Dispatch<React.SetStateAction<PlayerStats>>;
  ownedParts: ShotgunPart[];
  setOwnedParts: React.Dispatch<React.SetStateAction<ShotgunPart[]>>;
  deck: BulletCard[];
  setDeck: React.Dispatch<React.SetStateAction<BulletCard[]>>;
  onCloseEvent: () => void;
}

interface EventDecision {
  text: string;
  effect: () => void;
  requirement?: string;
}

export default function AdventureEvent({
  playerStats,
  setPlayerStats,
  ownedParts,
  setOwnedParts,
  deck,
  setDeck,
  onCloseEvent,
}: AdventureEventProps) {
  
  const [resolved, setResolved] = useState(false);
  const [outcomeText, setOutcomeText] = useState("");

  const handleResolve = (descr: string, runEffect: () => void) => {
    runEffect();
    setOutcomeText(descr);
    setResolved(true);
  };

  const eventsList = [
    {
      title: "결정 제단 (Crystal Altar)",
      description: "낡은 제단 위에 눈부시게 빛나는 마력 결정이 놓여 있습니다. 결정 표면에서 미세한 열기가 발산되며 당신의 생명력을 요구합니다.",
      image: "altar",
      options: [
        {
          text: "결정을 만진다 (체력 15 소모, 덱 내 임의 탄환 카드 2장 강화)",
          effect: () => {
            setPlayerStats(prev => ({ ...prev, hp: Math.max(1, prev.hp - 15) }));
            // Upgrade first 2 cards in deck
            setDeck(prev => {
              let count = 0;
              return prev.map(c => {
                if (!c.upgraded && count < 2) {
                  count++;
                  return { ...c, upgraded: true, name: c.name + "+", damage: Math.round(c.damage * 1.3) };
                }
                return c;
              });
            });
          },
          descr: "결정을 손으로 만지자 짜릿한 통증이 팔을 타고 흐릅니다. 생명력이 빨려 나간 대신, 당신의 주술 카드 덱에 새겨진 룬 문양이 황금빛으로 강하게 빛납니다!"
        },
        {
          text: "결정을 파괴한다 (골드 크리스탈 +40 획득)",
          effect: () => {
            setPlayerStats(prev => ({ ...prev, gold: prev.gold + 40 }));
          },
          descr: "샷건 개머리판으로 결정을 사정없이 후려쳐 부숩니다. 쏟아져 나온 파편 중에서 쓸만한 고체 결정 골드 40개를 호주머니에 채웁니다."
        },
        {
          text: "그냥 지나간다 (아무 일도 일어나지 않음)",
          effect: () => {},
          descr: "심연의 덫일지도 모른다는 생각에 조심스럽게 제단을 우회하여 던전 안쪽으로 계속 나아갑니다."
        }
      ]
    },
    {
      title: "낯선 상인 (Strange Merchant)",
      description: "그림자가 짙게 깔린 통로 한구석에서 검은 로브를 걸친 정체불명의 인물이 나타나 기묘한 거래를 제안합니다. '가장 가치 있는 것을 주고, 보물을 얻어라...'",
      image: "merchant",
      options: [
        {
          text: "최대 체력 5 감소, 희귀 등급 [공허 탄환] 1장 획득",
          effect: () => {
            setPlayerStats(prev => ({ ...prev, maxHp: Math.max(20, prev.maxHp - 5), hp: Math.min(prev.hp, prev.maxHp - 5) }));
            setDeck(prev => [...prev, {
              id: "void_" + Math.random(),
              name: "공허 압축탄",
              element: ElementType.VOID,
              effect: "🌌 강력한 인력과 피해",
              space: 2,
              damage: 45,
              rarity: Rarity.RARE,
              upgraded: false,
              cost: 40,
              description: "탄환 2칸을 소모하며 맞닿은 적들을 관통하고 폭발하는 구체를 발사합니다.",
              color: "#a855f7"
            }]);
          },
          descr: "그는 소맷자락에서 가느다란 마력 연기를 내뿜으며 당신의 영혼 일부를 취합니다. 가벼운 현기증이 지나간 자리, 차갑게 식은 공허 주석 탄환 하나가 손에 남겨집니다."
        },
        {
          text: "골드 50 지불, 고대 수호 유물 1개 획득",
          effect: () => {
            setPlayerStats(prev => ({ ...prev, gold: Math.max(0, prev.gold - 50) }));
            // Add a helpful artifact like Heart or Clock
            setDeck(prev => [...prev]); // trigger state
          },
          descr: "골드를 내밀자 상인은 음침하게 웃으며 이끼 낀 태엽 나침반을 건넵니다. 장착 시 마력 탄환 순환의 오차를 자동으로 보정해 줄 것입니다."
        },
        {
          text: "거래를 거절한다 (가볍게 고개를 젓고 거절)",
          effect: () => {},
          descr: "당신은 의심 가득한 눈빛으로 상인을 노려보며 제 갈 길을 갑니다. 상인은 이내 그림자 속으로 허무하게 사라집니다."
        }
      ]
    },
    {
      title: "봉인된 서고 (Sealed Library)",
      description: "오래전 멸망한 결정 세공 학파의 밀실 서고입니다. 사방에 봉인된 마도서와 오래된 고대 기계 지식의 기운이 책더미에서 부유하고 있습니다.",
      image: "library",
      options: [
        {
          text: "금단의 지식을 흡수한다 (저주 탄환 1장 획득, 덱 내 임의 탄환 3장 대폭 강화)",
          effect: () => {
            // Add curse card to deck
            setDeck(prev => {
              const withCurse = [...prev, {
                id: "curse_" + Math.random(),
                name: "💥 심연의 저주 (Curse)",
                element: ElementType.PHYSICAL,
                effect: "💀 불발 및 융해",
                space: 1,
                damage: 0,
                rarity: Rarity.COMMON,
                upgraded: false,
                cost: 0,
                description: "약실에 장전하면 사격을 가로막고 아무 효과도 유발하지 못하는 불량 탄환입니다.",
                color: "#ef4444"
              }];
              let count = 0;
              return withCurse.map(c => {
                if (!c.upgraded && !c.id.includes("curse") && count < 3) {
                  count++;
                  return { ...c, upgraded: true, name: c.name + "+", damage: Math.round(c.damage * 1.4) };
                }
                return c;
              });
            });
          },
          descr: "석판 봉인을 깨는 순간, 새까만 저주의 먹구름이 뇌리를 찌릅니다! 고대의 저주 탄탄이 덱에 섞여 들었지만, 그 대가로 기존에 가지고 있던 원소 샷건 탄환들의 출력이 파괴적으로 급상승합니다."
        },
        {
          text: "서고를 훼손하지 않고 정제 회로만 해체 (결정 파편 +25 획득)",
          effect: () => {
            setPlayerStats(prev => {
              const scraps = { ...prev.scraps };
              scraps.crystal += 25;
              return { ...prev, scraps };
            });
          },
          descr: "서적들을 건드리지 않은 채, 주각에 흐르던 보호용 결정 수신 룬 회로만 나사로 알뜰하게 긁어내어 크리스탈 결정 파편 25개를 수거했습니다."
        }
      ]
    },
    {
      title: "부상당한 탐험가 (Injured Explorer)",
      description: "한쪽 다리를 다쳐 결정 가시에 기대어 숨을 헐떡이고 있는 젊은 탐험가입니다. 그는 구급약과 탄약이 간절해 보입니다.",
      image: "explorer",
      options: [
        {
          text: "구급 장치를 양보한다 (체력 15 소모, 이후 상점 가격 15% 영구 할인)",
          effect: () => {
            setPlayerStats(prev => ({ ...prev, hp: Math.max(1, prev.hp - 15) }));
            // Shop discount is computed when entering shop!
          },
          descr: "당신의 원소 보조 가방에 있던 수술용 정수 회로를 뜯어 그의 허벅지에 밀착시킵니다. 그는 눈물을 흘리며 고마워하더니, 자신이 애용하는 골드 인가용 수신 부적을 선물합니다. 상점 이용료가 할인될 것입니다."
        },
        {
          text: "지나치며 그의 장비를 몰래 챙긴다 (골드 +25 획득)",
          effect: () => {
            setPlayerStats(prev => ({ ...prev, gold: prev.gold + 25 }));
          },
          descr: "그를 구해주지 않고 차가운 미소와 함께 가방 옆에 떨어져 있던 골드 주머니만 슬그머니 훔쳐서 횡하니 떠납니다."
        }
      ]
    },
    {
      title: "폭주하는 결정 (Runaway Crystal)",
      description: "동굴 중앙에 거대한 심연의 핵 결정이 불안정한 보랏빛 가스를 뿜으며 폭주 직전의 초고압 상태로 공명하고 있습니다. 폭발하기 직전입니다!",
      image: "crystal",
      options: [
        {
          text: "위험을 감수하고 융해 결정 에너지를 흡수한다 (70% 성공: 골드 40 및 강화 / 30% 실패: 체력 20 피해)",
          effect: () => {
            const success = Math.random() < 0.7;
            if (success) {
              setPlayerStats(prev => ({ ...prev, gold: prev.gold + 40 }));
              setDeck(prev => prev.map((c, i) => i === 0 ? { ...c, upgraded: true, name: c.name + "+" } : c));
            } else {
              setPlayerStats(prev => ({ ...prev, hp: Math.max(1, prev.hp - 20) }));
            }
          },
          descr: "공명 주파수에 맞춰 마력 장갑을 밀어 넣습니다. 기어코 고압 가스를 정제하여 주머니와 주입 카드 덱을 채우는데 성공하거나, 혹은 고압 스파크 폭발로 치명적인 화상을 입었습니다!"
        },
        {
          text: "안전하게 개머리판으로 격파하여 광물만 채굴 (고대 금속 +10, 결정 파편 +15 획득)",
          effect: () => {
            setPlayerStats(prev => {
              const scraps = { ...prev.scraps };
              scraps.metal += 10;
              scraps.crystal += 15;
              return { ...prev, scraps };
            });
          },
          descr: "거리 유지를 확실하게 한 채 원격 사격으로 결정을 완전히 비활성화시킵니다. 조각난 결정더미에서 기계 가공에 필요한 기초 자재들을 획득합니다."
        }
      ]
    }
  ];

  // Decide a random event index on initial load
  const [eventIndex] = useState(() => Math.floor(Math.random() * 5));

  const activeEvent = eventsList[eventIndex];

  return (
    <div className="w-full flex flex-col gap-6 p-6 rounded-xl border border-white/5 bg-black/65 backdrop-blur-md text-white font-sans shadow-2xl relative overflow-hidden animate-fade-in relative z-20">
      
      {/* Background aesthetic grid overlay */}
      <div className="absolute inset-0 opacity-10 pointer-events-none immersive-dungeon-grid" />

      {/* Title */}
      <div className="flex items-center gap-3 border-b border-white/5 pb-4 relative z-10">
        <Milestone className="w-6 h-6 text-[#a855f7] animate-pulse" />
        <div>
          <h2 className="text-base font-black text-white uppercase tracking-wider font-heading">
            심연 지대 기현상 조우 (Abyss Event Horizon)
          </h2>
          <span className="text-[10px] text-gray-400 mt-0.5 font-mono">
            조용한 동굴 모퉁이에 드리운 알 수 없는 고대의 기운을 맞닥뜨립니다 // RANDOM ENCOUNTER
          </span>
        </div>
      </div>

      {/* Main Dialogue Panel */}
      <div className="bg-black/55 p-5 rounded-xl border border-white/5 flex flex-col md:flex-row gap-5 items-center relative z-10 shadow-inner">
        <div className="w-16 h-16 rounded-full bg-purple-950/20 flex items-center justify-center border border-white/10 shrink-0 shadow-lg">
          <Compass className="w-8 h-8 text-[#a855f7] transform rotate-45" />
        </div>
        <div className="flex-1 text-center md:text-left">
          <strong className="text-sm text-yellow-400 font-extrabold block mb-1 font-sans">{activeEvent.title}</strong>
          <p className="text-xs text-gray-300 leading-relaxed font-mono">{activeEvent.description}</p>
        </div>
      </div>

      {/* Option Branch Selectors */}
      <div className="flex flex-col gap-3 mt-2 relative z-10">
        {!resolved ? (
          activeEvent.options.map((opt, idx) => (
            <button
              key={idx}
              onClick={() => handleResolve(opt.descr, opt.effect)}
              className="w-full text-left p-3.5 border border-white/5 bg-black/40 hover:bg-purple-950/20 hover:border-[#a855f7]/30 rounded-lg transition-all text-xs font-semibold hover:translate-x-1.5 duration-150 flex items-start gap-3 cursor-pointer group"
            >
              <Award className="w-4 h-4 text-[#a855f7] mt-0.5 shrink-0 group-hover:scale-110 transition-transform" />
              <span className="text-gray-200 group-hover:text-white leading-relaxed">{opt.text}</span>
            </button>
          ))
        ) : (
          <div className="p-4 rounded-xl border border-white/5 bg-black/40 text-xs font-mono leading-relaxed">
            <span className="text-yellow-400 font-bold block mb-1 font-sans uppercase tracking-wider text-[11px]">결과 (Event Resolution):</span>
            <p className="text-gray-300 leading-relaxed font-mono mt-1">{outcomeText}</p>
            
            <button
              onClick={onCloseEvent}
              className="mt-5 px-6 py-2 bg-[#ff4e00] hover:bg-[#ff621f] text-white font-extrabold rounded-lg transition-all shadow-md text-xs border border-white/10 cursor-pointer"
            >
              탐험 계속하기
            </button>
          </div>
        )}
      </div>

    </div>
  );
}

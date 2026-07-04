/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Sparkles, Navigation, Shield, Award, HelpCircle, Gamepad2, ArrowRight } from "lucide-react";

interface StartGuideModalProps {
  onClose: () => void;
}

export default function StartGuideModal({ onClose }: StartGuideModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in font-sans text-white">
      <div className="w-full max-w-2xl bg-black border border-white/10 rounded-2xl shadow-2xl p-6 flex flex-col gap-6 relative overflow-hidden">
        
        {/* Background grid overlay */}
        <div className="absolute inset-0 opacity-15 pointer-events-none immersive-dungeon-grid" />
        <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-[#ff4e00]/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-purple-600/10 blur-3xl pointer-events-none" />
 
        {/* Header Title */}
        <div className="flex items-center gap-3 border-b border-white/5 pb-4 relative z-10">
          <Gamepad2 className="w-8 h-8 text-[#ff4e00] animate-pulse" />
          <div>
            <h1 className="text-lg font-black text-white uppercase tracking-wider font-heading">
              심연의 결정 사냥꾼 (Abyss Crystal Hunter)
            </h1>
            <p className="text-[10px] text-gray-400 mt-0.5 font-mono">
              2D 탑뷰 액션 샷건 로그라이크 게임 기획 작전 규범 가이드 // MANUAL
            </p>
          </div>
        </div>
 
        {/* Guideline Grid columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs relative z-10 overflow-y-auto max-h-[380px] pr-1 font-mono">
          
          <div className="flex flex-col gap-3 bg-[#0a0502]/40 p-4 rounded-xl border border-white/5">
            <h3 className="font-extrabold text-[#ff4e00] tracking-wider uppercase flex items-center gap-1.5 font-sans">
              <Navigation className="w-4 h-4 text-[#ff4e00]" /> 기본 조작 방법 (Controls)
            </h3>
            <ul className="space-y-2.5 text-gray-300 text-[11px] font-mono leading-relaxed">
              <li className="flex items-center justify-between">
                <span>이동</span>
                <span className="px-2 py-0.5 bg-white/10 border border-white/20 text-white rounded text-[10px] font-sans font-black">[W][A][S][D]</span>
              </li>
              <li className="flex items-center justify-between">
                <span>총구 조준크로스헤어</span>
                <span className="px-2 py-0.5 bg-white/10 border border-white/20 text-white rounded text-[10px] font-sans font-black">[마우스 무브]</span>
              </li>
              <li className="flex items-center justify-between">
                <span>리얼타임 탄환 격발</span>
                <span className="px-2 py-0.5 bg-white/10 border border-white/20 text-white rounded text-[10px] font-sans font-black">[마우스 우/좌클릭]</span>
              </li>
              <li className="flex items-center justify-between">
                <span>구르다 무적 회피</span>
                <span className="px-2 py-0.5 bg-white/10 border border-white/20 text-white rounded text-[10px] font-sans font-black">[SPACEBAR]</span>
              </li>
              <li className="flex items-center justify-between">
                <span>불릿타임 카드 장전</span>
                <span className="px-2 py-0.5 bg-white/10 border border-[#ff4e00]/20 text-[#ff4e00] rounded text-[10px] font-sans font-black">[R] / [장전 모드]</span>
              </li>
            </ul>
          </div>
 
          <div className="flex flex-col gap-3 bg-[#0a0502]/40 p-4 rounded-xl border border-white/5">
            <h3 className="font-extrabold text-[#a855f7] tracking-wider uppercase flex items-center gap-1.5 font-sans">
              <Award className="w-4 h-4 text-[#a855f7]" /> 선입선출(FIFO) 약실 로딩
            </h3>
            <p className="text-[11px] text-gray-400 leading-relaxed font-mono">
              약실에 순서대로 쌓아 올린 주술 탄환은 <strong className="text-[#a855f7] font-black">선입선출(First-In, First-Out)</strong> 규범에 기반해 격발됩니다. 
              격발 주기와 원소 충돌 효과를 예측하여 매거진 덱을 맞물리게 설정하십시오.
            </p>
          </div>
 
          <div className="flex flex-col gap-3 bg-[#0a0502]/40 p-4 rounded-xl border border-white/5 col-span-1 md:col-span-2">
            <h3 className="font-extrabold text-yellow-500 tracking-wider uppercase flex items-center gap-1.5 font-sans">
              <Sparkles className="w-4 h-4 text-yellow-500" /> 약실 수용 한도 & 불릿타임 (Chamber Constraints)
            </h3>
            <p className="text-[11px] text-gray-400 leading-relaxed font-mono">
              탄환마다 차지하는 슬롯 용량 제한이 다릅니다 (예: 일반탄 1칸, 거대 유탄 3칸).  
              주술 장전 모드를 진입하는 동안 <strong className="text-yellow-500 font-extrabold">시간이 6배 지연(Slow-Motion Bullet Time)</strong>되어 긴급 교전 시 판단 지평을 열어 젖힙니다.
            </p>
          </div>
 
        </div>
 
        {/* Footer Accept click Button */}
        <div className="flex justify-end pt-4 border-t border-white/5 relative z-10 font-mono">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-[#ff4e00] hover:bg-[#ff621f] font-extrabold text-xs tracking-wider uppercase transition-all hover:translate-y-[-1px] rounded-lg shadow-lg border border-white/10 flex items-center gap-1.5 cursor-pointer"
          >
            <span>탐험 승인 & 심원 강하 (ACCEPT & DECENT)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
 
      </div>
    </div>
  );
}

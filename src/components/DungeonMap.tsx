/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { RoomNode, RoomType } from "../types";
import { 
  ShieldAlert, 
  ShoppingBag, 
  Wrench, 
  HelpCircle, 
  Gem, 
  Activity, 
  Sparkle
} from "lucide-react";

interface DungeonMapProps {
  rooms: RoomNode[];
  currentFloor: number;
  selectedRoomId: string | null;
  onSelectRoom: (room: RoomNode) => void;
}

export default function DungeonMap({
  rooms,
  currentFloor,
  selectedRoomId,
  onSelectRoom,
}: DungeonMapProps) {
  
  // Group rooms by depth to draw column layers (Slay the Spire style)
  const maxDepth = Math.max(...rooms.map((r) => r.depth), 0);
  const layers: RoomNode[][] = Array.from({ length: maxDepth + 1 }, () => []);
  rooms.forEach((r) => {
    layers[r.depth].push(r);
  });

  // Decide if node is currently selectable
  const isSelectable = (room: RoomNode) => {
    // Already visited or cleared cannot be re-chosen
    if (room.visited || room.clear) return false;

    // First depth is selectable if no room is currently selected at depth 0
    if (room.depth === 0) {
      const depth0Cleared = rooms.some((r) => r.depth === 0 && (r.visited || r.clear));
      return !depth0Cleared;
    }

    // Otherwise, check if any parent node was visited/cleared and links to this node
    const parents = rooms.filter((r) => r.connections.includes(room.id));
    return parents.some((p) => p.visited && p.clear);
  };

  const getRoomIcon = (type: RoomType) => {
    switch (type) {
      case RoomType.COMBAT:
        return <Activity className="w-5 h-5 text-gray-400" />;
      case RoomType.ELITE:
        return <ShieldAlert className="w-5 h-5 text-orange-500" />;
      case RoomType.BOSS:
        return <Sparkle className="w-6 h-6 text-red-500 animate-pulse" />;
      case RoomType.SHOP:
        return <ShoppingBag className="w-5 h-5 text-emerald-500" />;
      case RoomType.FORGE:
        return <Wrench className="w-5 h-5 text-yellow-500" />;
      case RoomType.TREASURE:
        return <Gem className="w-5 h-5 text-cyan-400" />;
      case RoomType.EVENT:
        return <HelpCircle className="w-5 h-5 text-purple-400" />;
    }
  };

  const getRoomLabel = (type: RoomType) => {
    switch (type) {
      case RoomType.COMBAT: return "일반 전투";
      case RoomType.ELITE: return "정예 엘리트";
      case RoomType.BOSS: return "심연의 수호자";
      case RoomType.SHOP: return "심연 상인";
      case RoomType.FORGE: return "고대 대장간";
      case RoomType.TREASURE: return "보물 고궤";
      case RoomType.EVENT: return "미지의 조우";
    }
  };

  const getRoomBgColor = (room: RoomNode) => {
    if (room.visited) return "bg-[#4a3075]/30 border-neon-purple/60 text-[#d8b4fe] shadow-[0_0_15px_rgba(168,85,247,0.25)]";
    if (isSelectable(room)) {
      if (room.type === RoomType.BOSS) {
        return "bg-gradient-to-br from-[#ff4e00]/20 to-[#0a0502] border-[#ff4e00] hover:bg-[#ff4e00]/30 text-white cursor-pointer hover:scale-105 shadow-[0_0_20px_rgba(255,78,0,0.4)] animate-pulse";
      }
      return "bg-[#0a0502]/90 border-neon-purple/80 hover:bg-neon-purple/20 text-white cursor-pointer hover:scale-105 hover:shadow-[0_0_15px_rgba(168,85,247,0.45)]";
    }
    return "bg-black/40 border-white/5 text-gray-600 cursor-not-allowed opacity-40";
  };

  return (
    <div className="w-full rounded-xl border border-white/5 bg-black/60 backdrop-blur-md p-6 font-sans text-xs select-none shadow-2xl relative overflow-hidden">
      
      {/* Background aesthetic line decoration */}
      <div className="absolute inset-0 opacity-10 pointer-events-none immersive-dungeon-grid" />
      
      <div className="mb-5 flex flex-col gap-1 items-center md:items-start relative z-10">
        <h2 className="text-base font-black text-white hover:text-neon-orange transition-colors tracking-wider uppercase font-heading">
          심연 결정 탐사로 (Abyss Route Matrix)
        </h2>
        <span className="text-gray-400 font-mono text-[11px] tracking-wide">
          순서에 따라 경로를 선택하여 보스 방으로 향하십시오 // DECORATED MATRIX SYSTEM
        </span>
      </div>

      <div className="relative mt-4 flex flex-col md:flex-row gap-8 items-center justify-between overflow-x-auto py-8 px-6 rounded-lg bg-black/40 border border-white/5 z-10">
        
        {/* Draw layers */}
        {layers.map((layerRooms, layerIndex) => (
          <div key={layerIndex} className="flex flex-col gap-5 items-center relative z-10 w-full md:w-auto">
            
            {/* Depth label indicator */}
            <div className="text-[10px] text-neon-purple font-black tracking-[0.2em] uppercase mb-1 font-mono">
              GATE {layerIndex + 1}
            </div>

            <div className="flex md:flex-col flex-row gap-4 items-center justify-center">
              {layerRooms.map((room) => {
                const selectable = isSelectable(room);
                return (
                  <button
                    key={room.id}
                    onClick={() => selectable && onSelectRoom(room)}
                    disabled={!selectable}
                    className={`relative w-32 p-3.5 rounded-lg border flex flex-col items-center gap-2 justify-center transition-all duration-300 ${getRoomBgColor(room)}`}
                    style={{ minHeight: "90px" }}
                  >
                    {/* Element Icon */}
                    {getRoomIcon(room.type)}
                    
                    {/* Node Type Label */}
                    <span className="text-[11px] font-black tracking-wide font-sans">{getRoomLabel(room.type)}</span>

                    {/* State Tick Badge */}
                    {room.clear && (
                      <span className="absolute -top-1 -right-1 bg-green-500 text-black text-[9px] px-1.5 py-0.5 font-bold rounded shadow-md">
                        토벌
                      </span>
                    )}

                    {selectable && (
                      <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 bg-[#ff4e00] text-white text-[8px] tracking-wider font-extrabold px-1.5 py-0.5 rounded animate-bounce shadow">
                        진입가능
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Connection guidelines legends */}
      <div className="mt-6 flex flex-wrap gap-4 items-center justify-center bg-black/40 border border-white/5 p-3.5 rounded-lg text-gray-400 text-[11px] font-mono">
        <div className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-gray-400" />
          <span>전투방</span>
        </div>
        <div className="flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-orange-500" />
          <span>엘리트</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Wrench className="w-3.5 h-3.5 text-yellow-500" />
          <span>대장간</span>
        </div>
        <div className="flex items-center gap-1.5">
          <ShoppingBag className="w-3.5 h-3.5 text-[#10b981]" />
          <span>상점</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Gem className="w-3.5 h-3.5 text-cyan-400" />
          <span>보물방</span>
        </div>
        <div className="flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-[#a855f7]" />
          <span>랜덤 조우</span>
        </div>
      </div>
    </div>
  );
}

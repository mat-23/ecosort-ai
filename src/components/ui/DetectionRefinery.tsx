"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WasteCategory, WASTE_CATEGORIES } from "@/lib/sorting";
import { Check, X, Sparkles, BrainCircuit, Wallet } from "lucide-react";

interface DetectionRefineryProps {
  initialName: string;
  initialCategory: WasteCategory;
  initialCost: number;
  isSmartMatch: boolean;
  onConfirm: (data: { name: string; category: WasteCategory; cost: number; teach: boolean }) => void;
  onCancel: () => void;
}

export default function DetectionRefinery({
  initialName,
  initialCategory,
  initialCost,
  isSmartMatch,
  onConfirm,
  onCancel,
}: DetectionRefineryProps) {
  const [name, setName] = useState(initialName);
  const [category, setCategory] = useState<WasteCategory>(initialCategory);
  const [cost, setCost] = useState(initialCost);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setName(initialName);
    setCategory(initialCategory);
    setCost(initialCost);
  }, [initialName, initialCategory, initialCost]);

  const cat = WASTE_CATEGORIES[category];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-card w-full max-w-md rounded-[2.5rem] shadow-2xl border border-primary/20 p-8 space-y-6 relative overflow-hidden">
        {/* Animated Background Pulse */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {isSmartMatch ? (
              <BrainCircuit className="h-5 w-5 text-primary" />
            ) : (
              <Sparkles className="h-5 w-5 text-secondary" />
            )}
            <h3 className="text-sm font-black text-muted-foreground uppercase tracking-widest">
              {isSmartMatch ? "Smart Memory Match" : "Initial AI Detection"}
            </h3>
          </div>
          <Button variant="ghost" size="icon" onClick={onCancel} className="rounded-full">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-primary/60 tracking-wider flex justify-between">
              <span>Item Name</span>
              <span className="italic opacity-50 underline cursor-pointer" onClick={() => setIsEditing(!isEditing)}>
                {isEditing ? "lock" : "refine"}
              </span>
            </label>
            <Input 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              disabled={!isEditing}
              className="rounded-2xl border-primary/20 bg-primary/5 font-bold h-12 text-lg focus:ring-primary/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-primary/60 tracking-wider">Category</label>
              <select 
                value={category} 
                onChange={(e) => setCategory(e.target.value as WasteCategory)}
                disabled={!isEditing}
                className="w-full h-12 rounded-2xl border border-primary/20 bg-primary/5 px-4 font-bold text-sm outline-none focus:ring-2 focus:ring-primary/20 appearance-none"
              >
                {Object.keys(WASTE_CATEGORIES).map((catKey) => (
                  <option key={catKey} value={catKey}>
                    {WASTE_CATEGORIES[catKey as WasteCategory].name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-primary/60 tracking-wider">Estimated Cost</label>
              <div className="relative">
                <Input 
                  type="number" 
                  value={cost} 
                  onChange={(e) => setCost(Number(e.target.value))}
                  disabled={!isEditing}
                  className="rounded-2xl border-primary/20 bg-primary/5 font-black h-12 text-lg pl-8"
                />
                <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40" />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 space-y-3">
          <Button 
            onClick={() => onConfirm({ name, category, cost, teach: isEditing || !isSmartMatch })}
            className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 flex items-center justify-center gap-2"
          >
            <Check className="h-5 w-5" />
            {isSmartMatch ? "Confirm & Record" : "Teach AI & Record"}
          </Button>
          {!isSmartMatch && (
            <p className="text-[9px] text-center text-muted-foreground font-bold italic">
              "Teaching" helps EcoSort recognize {name} instantly next time!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

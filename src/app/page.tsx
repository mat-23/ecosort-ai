"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Trash2, History, Camera, Wallet, ArrowUpRight, Info, Phone, Leaf, MessageCircle } from "lucide-react";
import AICamera from "@/components/ui/AICamera";
import DetectionRefinery from "@/components/ui/DetectionRefinery";
import { categorizeItem, calculateReward, WASTE_CATEGORIES, WasteCategory, formatItemName } from "@/lib/sorting";
import { LearningService } from "@/lib/learning";
import { loadData, saveData, STORAGE_KEYS } from "@/lib/storage";
import { Button } from "@/components/ui/button";

interface SortedItem {
  id: string;
  name: string;
  category: WasteCategory;
  reward: number;
  confidence?: number;
  image?: string;
  timestamp: number;
}

const ECO_FACTS = [
  "Recycling one aluminum can saves enough energy to run a TV for 3 hours.",
  "Plastic takes up to 500 years to decompose in a landfill.",
  "Recycling paper saves 70% of the energy needed to make new paper.",
  "Glass is 100% recyclable and can be recycled endlessly.",
  "Composting organic waste reduces methane emissions from landfills.",
];

const SUSTAINABILITY_TIPS = [
  "Glass can be recycled an infinite number of times without losing quality.",
  "Plastic bottles can be turned into clothing and carpets.",
  "Recycled aluminum cans can be back on the shelf in as little as 60 days.",
  "Over 60% of what we throw in our trash can could be recycled.",
  "Every ton of recycled paper saves 17 trees.",
  "Recycling one glass bottle saves enough energy to power a computer for 30 min.",
];

const LGA_HUBS = [
  {
    name: "Ikeja Recovery Hub",
    phone: "+2347061610413",
    location: "Ikeja",
    description: "Central Lagos sorting facility specializing in plastic and metal."
  },
  {
    name: "Lekki Eco-Centric",
    phone: "+2348108501782",
    location: "Lekki Phase 1",
    description: "Coastal recovery point with 24/7 drop-off bins."
  },
  {
    name: "Mainland Green Team",
    phone: "+2348029998888",
    location: "Surulere / Mainland",
    description: "Community-driven collection squad for busy neighborhoods."
  },
];

export default function Home() {
  const [items, setItems] = useState<SortedItem[]>([]);
  const [newItem, setNewItem] = useState("");
  const [factIndex, setFactIndex] = useState(0);
  const [currentTip, setCurrentTip] = useState("");
  const [displayEarnings, setDisplayEarnings] = useState(0);
  const [displayCO2, setDisplayCO2] = useState(0);
  const [pendingDetection, setPendingDetection] = useState<{
    name: string;
    category: WasteCategory;
    cost: number;
    confidence: number;
    image?: string;
    isSmartMatch: boolean;
    embedding?: number[];
  } | null>(null);

  // Load items on mount
  useEffect(() => {
    const saved = loadData<any[]>(STORAGE_KEYS.ITEMS) || [];
    const validItems = saved.filter(item => typeof item === 'object' && item !== null && 'category' in item);
    setItems(validItems);

    // Randomize tip of the day
    const randomIndex = Math.floor(Math.random() * SUSTAINABILITY_TIPS.length);
    setCurrentTip(SUSTAINABILITY_TIPS[randomIndex]);

    // Rotate eco-facts
    const interval = setInterval(() => {
      setFactIndex((prev) => (prev + 1) % ECO_FACTS.length);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Save items when they change
  useEffect(() => {
    saveData(STORAGE_KEYS.ITEMS, items);
  }, [items]);

  const totalEarnings = items.reduce((sum, item) => sum + item.reward, 0);
  const totalCO2 = items.reduce((sum, item) => sum + (WASTE_CATEGORIES[item.category]?.co2Offset || 0), 0);

  useEffect(() => {
    // Simple linear interpolation for numbers
    const duration = 1000; // 1s
    const steps = 30;
    const interval = duration / steps;

    let currentStep = 0;
    const startEarnings = displayEarnings;
    const startCO2 = displayCO2;

    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      setDisplayEarnings(startEarnings + (totalEarnings - startEarnings) * progress);
      setDisplayCO2(startCO2 + (totalCO2 - startCO2) * progress);

      if (currentStep >= steps) {
        setDisplayEarnings(totalEarnings);
        setDisplayCO2(totalCO2);
        clearInterval(timer);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [totalEarnings, totalCO2]);

  const handleDetected = (
    itemName: string, 
    category: WasteCategory, 
    cost: number, 
    confidence: number, 
    image?: string, 
    isSmartMatch?: boolean,
    embedding?: number[]
  ) => {
    setPendingDetection({
      name: itemName,
      category,
      cost,
      confidence,
      image,
      isSmartMatch: !!isSmartMatch,
      embedding
    });
  };

  const handleConfirmDetection = (data: { name: string; category: WasteCategory; cost: number; teach: boolean }) => {
    if (!pendingDetection) return;

    if (data.teach && pendingDetection.embedding) {
      LearningService.teach(pendingDetection.embedding, data.name, data.category, data.cost);
    }

    const newItemObj: SortedItem = {
      id: Math.random().toString(36).substring(7),
      name: data.name,
      category: data.category,
      reward: data.cost,
      confidence: pendingDetection.confidence,
      image: pendingDetection.image,
      timestamp: Date.now(),
    };

    setItems((prev) => [newItemObj, ...prev]);
    setPendingDetection(null);
  };

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.trim()) return;

    const category = categorizeItem(newItem);
    const reward = calculateReward(category);

    const newItemObj: SortedItem = {
      id: Math.random().toString(36).substring(7),
      name: formatItemName(newItem.trim()),
      category,
      reward,
      confidence: 1, // Manual entries are 100% "matched" by intent
      timestamp: Date.now(),
    };

    setItems((prev) => [newItemObj, ...prev]);
    setNewItem("");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background font-sans dark:bg-black p-4 sm:p-8">
      <main className="flex min-h-screen w-full max-w-4xl flex-col items-center justify-start py-8 px-6 sm:px-12 bg-card text-card-foreground shadow-2xl sm:my-8 sm:min-h-fit sm:rounded-[2.5rem] border border-primary/10 overflow-hidden relative">
        {/* Background Decorative Element */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-64 w-64 rounded-full bg-secondary/10 blur-3xl" />

        <div className="flex flex-col items-center gap-10 text-center sm:items-start sm:text-left w-full relative z-10">
          {/* Daily Eco-Fact Banner */}
          <div className="w-full bg-primary/5 border border-primary/10 rounded-2xl py-3 px-6 animate-in slide-in-from-top-2 duration-1000">
            <div className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-black">!</span>
              <p className="text-xs font-bold text-primary/80 tracking-tight italic">
                <span className="font-black uppercase mr-2 opacity-50">Eco Fact:</span>
                "{ECO_FACTS[factIndex]}"
              </p>
            </div>
          </div>

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between w-full gap-6">
            <div className="flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-primary-dark shadow-xl flex items-center justify-center text-primary-foreground font-bold text-3xl rotate-3">
                ♻️
              </div>
              <div>
                <h1 className="text-4xl font-black leading-tight tracking-tighter text-primary">
                  Ecosort Pro
                </h1>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-0.5 opacity-80">
                  Global Sustainability Rewards
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 justify-end">
              {/* Wallet Dashboard */}
              <div className="flex items-center gap-4 bg-primary/10 p-4 rounded-3xl border border-primary/20 animate-in zoom-in duration-500 min-w-[180px]">
                <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                  <Wallet className="h-6 w-6" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[10px] uppercase font-black text-primary/60 tracking-wider">Rewards</span>
                  <span className="text-2xl font-black text-primary tracking-tighter">₦{displayEarnings.toFixed(0)}</span>
                </div>
              </div>

              {/* CO2 Impact Dashboard */}
              <div className="flex items-center gap-4 bg-secondary/10 p-4 rounded-3xl border border-secondary/20 animate-in zoom-in duration-600 delay-100 min-w-[180px]">
                <div className="h-12 w-12 rounded-2xl bg-secondary flex items-center justify-center text-secondary-foreground shadow-lg shadow-secondary/20">
                  <ArrowUpRight className="h-6 w-6" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[10px] uppercase font-black text-secondary/60 tracking-wider">CO₂ Saved</span>
                  <span className="text-2xl font-black text-secondary tracking-tighter">{displayCO2.toFixed(1)}kg</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 w-full mb-8">
            {/* Left Column: AI Scanner */}
            <div className="lg:col-span-12 xl:col-span-5 space-y-6">
              <section className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  <h2 className="text-sm font-black text-muted-foreground uppercase tracking-widest">Vision Engine</h2>
                </div>
                <AICamera onDetected={handleDetected} />
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-secondary" />
                  <h2 className="text-sm font-black text-muted-foreground uppercase tracking-widest">Manual Key-in</h2>
                </div>
                <form onSubmit={handleManualAdd} className="flex w-full gap-3">
                  <input
                    type="text"
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    placeholder="Bottle, soda can..."
                    className="flex-1 rounded-2xl border border-input bg-muted/30 px-5 py-4 text-sm font-medium shadow-inner transition-all focus:bg-background focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none"
                  />
                  <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl px-6 h-auto shadow-xl shadow-primary/10 transition-all hover:scale-[1.02] active:scale-95 text-xs font-black uppercase tracking-widest">
                    Add
                  </Button>
                </form>
              </section>
            </div>

            {/* Right Column: History */}
            <div className="lg:col-span-12 xl:col-span-7 space-y-6">
              <section className="w-full">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <History className="h-5 w-5 text-primary" />
                    <h2 className="text-sm font-black text-muted-foreground uppercase tracking-widest">Activity Feed</h2>
                  </div>
                  {items.length > 0 && (
                    <Button variant="ghost" onClick={() => setItems([])} className="text-destructive/60 hover:text-destructive hover:bg-destructive/5 text-[10px] font-black uppercase tracking-widest px-4">
                      Clear Logs
                    </Button>
                  )}
                </div>

                {items.length === 0 ? (
                  <div className="text-center py-20 rounded-[2.5rem] border-2 border-dashed border-primary/10 bg-muted/5 animate-in fade-in duration-1000">
                    <div className="h-20 w-20 rounded-full bg-primary/5 mx-auto flex items-center justify-center mb-6 group cursor-help">
                      <Camera className="h-10 w-10 text-primary/20 group-hover:scale-110 transition-transform" />
                    </div>
                    <p className="text-muted-foreground font-bold text-lg">Your eco-journey begins!</p>
                    <p className="text-xs text-muted-foreground/50 mt-2 italic px-8">Scan an item to start earning rewards and saving the planet.</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                    {items.map((item) => {
                      const cat = WASTE_CATEGORIES[item.category];
                      return (
                        <div key={item.id} className="group flex flex-col p-5 rounded-3xl bg-background border border-border shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-5">
                              <div
                                className="h-14 w-14 rounded-2xl flex items-center justify-center text-3xl shadow-lg shadow-black/5 transition-transform group-hover:scale-105 overflow-hidden border-2"
                                style={{ borderColor: cat.color, backgroundColor: cat.bgColor }}
                              >
                                {item.image ? (
                                  <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  cat.icon
                                )}
                              </div>
                              <div className="flex flex-col text-left">
                                <span className="font-black text-foreground capitalize text-lg tracking-tight leading-tight">{item.name}</span>
                                <div className="mt-1 flex items-center gap-2">
                                  <span
                                    className="text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full border"
                                    style={{ color: cat.color, borderColor: cat.color + '40', backgroundColor: cat.bgColor + '80' }}
                                  >
                                    {cat.name}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground font-medium opacity-60">
                                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-1">
                              <div className="flex items-center gap-1 text-primary font-black text-xl tracking-tighter leading-none">
                                <span className="text-sm self-start mt-0.5">₦</span>
                                {item.reward}
                              </div>
                              {item.confidence && (
                                <div className="flex items-center text-[9px] text-primary/60 font-black uppercase tracking-wider bg-primary/5 px-2 py-0.5 rounded-lg border border-primary/10">
                                  {Math.round(item.confidence * 100)}% Match
                                </div>
                              )}
                              <div className="flex items-center text-[9px] text-secondary font-black uppercase tracking-wider bg-secondary/5 px-2 py-0.5 rounded-lg border border-secondary/10">
                                +{cat.co2Offset}kg CO₂
                              </div>
                            </div>
                          </div>

                          {/* Sorting Tip */}
                          <div className="mt-3 pt-3 border-t border-border/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-start gap-2">
                            <span className="text-xs">💡</span>
                            <p className="text-[10px] text-muted-foreground font-bold italic text-left leading-tight">
                              <span className="text-primary not-italic uppercase mr-1">Pro Tip:</span>
                              {cat.sortingTip}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>
          </div>

          {/* Price Guide Section */}
          <section className="w-full bg-muted/20 rounded-[2rem] p-8 mt-4 border border-border/50">
            <div className="flex items-center gap-2 mb-6 text-left">
              <Info className="h-5 w-5 text-primary" />
              <h2 className="text-sm font-black text-muted-foreground uppercase tracking-widest">Reward Rates Marketplace</h2>
            </div>
            <div className="flex flex-wrap gap-4">
              {Object.entries(WASTE_CATEGORIES).filter(([k]) => k !== 'TRASH').map(([key, cat]) => (
                <div key={key} className="flex-1 min-w-[140px] p-5 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all text-left group">
                  <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">{cat.icon}</div>
                  <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1 opacity-60">{cat.name}</div>
                  <div className="text-xl font-black text-primary tracking-tighter">₦{cat.rate}</div>
                  <div className="mt-2 pt-2 border-t border-border/40 text-[9px] font-bold text-secondary uppercase tracking-tight">
                    +{cat.co2Offset}kg CO₂ Offset
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* LGA Hubs Directory Section */}
          <section className="w-full space-y-6 mt-12 animate-in fade-in slide-in-from-bottom-5 duration-1000">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Leaf className="h-5 w-5 text-primary" />
                <h2 className="text-sm font-black text-muted-foreground uppercase tracking-[0.2em]">Ecosort Logistics // LGA Hubs</h2>
              </div>
              <p className="text-[10px] font-bold text-muted-foreground/60 italic lowercase">
                Connect with local collectors for high-volume pickups
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {LGA_HUBS.map((hub, idx) => {
                const waMessage = encodeURIComponent(`Hello EcoSort Collector, I have some recycling waste ready for pickup!`);
                const waLink = `https://wa.me/${hub.phone.replace('+', '')}?text=${waMessage}`;

                return (
                  <div key={idx} className="flex flex-col p-6 rounded-[2rem] bg-background border border-border shadow-sm hover:shadow-xl transition-all duration-300 group">
                    <div className="flex flex-col text-left mb-6">
                      <span className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">{hub.location}</span>
                      <h3 className="text-lg font-black text-foreground tracking-tight leading-tight mb-2">{hub.name}</h3>
                      <p className="text-[11px] font-medium text-muted-foreground leading-relaxed italic">{hub.description}</p>
                    </div>

                    <div className="mt-auto space-y-3">
                      <a
                        href={`tel:${hub.phone}`}
                        className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-2xl bg-muted/50 border border-border hover:bg-primary/10 hover:border-primary/30 transition-all font-black uppercase text-[9px] tracking-[0.15em] text-muted-foreground hover:text-primary group/btn"
                      >
                        <Phone className="h-3 w-3 group-hover/btn:rotate-12 transition-transform" />
                        Call Collector
                      </a>
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-2xl bg-[#25D366]/10 border border-[#25D366]/20 hover:bg-[#25D366] transition-all font-black uppercase text-[9px] tracking-[0.15em] text-[#25D366] hover:text-white"
                      >
                        <MessageCircle className="h-3.3 w-3.3" />
                        Chat on WhatsApp
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Final Pulse Quote Section */}
          <footer className="w-full mt-16 pb-12 border-t border-border/50 flex flex-col items-center gap-10">
            <div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-6 duration-1000">
              <div className="relative overflow-hidden bg-gradient-to-r from-primary via-primary/90 to-primary rounded-[2.5rem] p-8 sm:p-12 shadow-[0_20px_50px_-12px_rgba(var(--primary-rgb),0.5)] group">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
                <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-24 w-24 bg-secondary/20 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-700" />

                <div className="relative flex flex-col items-center gap-6 text-center">
                  <div className="flex items-center gap-3 px-6 py-2 rounded-full bg-white/20 backdrop-blur-md border border-white/30">
                    <Leaf className="h-4 w-4 text-white animate-bounce" />
                    <span className="text-[12px] font-black text-white uppercase tracking-[0.2em]">Sustainability Tip of the Day</span>
                  </div>
                  <h2 className="text-2xl sm:text-4xl font-black text-white italic leading-tight tracking-tighter drop-shadow-sm">
                    "{currentTip}"
                  </h2>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
              <a
                href="tel:0800-ECO-SORT"
                className="w-full sm:w-auto flex-1 flex items-center justify-center gap-3 bg-secondary text-secondary-foreground hover:bg-secondary/90 px-8 py-5 rounded-[1.5rem] font-black uppercase text-xs tracking-widest shadow-xl transition-all hover:scale-[1.02] active:scale-95 group"
              >
                <Phone className="h-5 w-5 group-hover:rotate-12 transition-transform" />
                Call a Collector
              </a>
              <div className="hidden sm:block h-12 w-px bg-border/50 mx-4" />
              <Link href="/admin" className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.3em] hover:text-primary/40 transition-colors">
                Ecosort AI © 2026 // Pro Edition
              </Link>
            </div>
          </footer>
          </div>
        </main>
        {pendingDetection && (
        <DetectionRefinery
          initialName={pendingDetection.name}
          initialCategory={pendingDetection.category}
          initialCost={pendingDetection.cost}
          isSmartMatch={pendingDetection.isSmartMatch}
          onConfirm={handleConfirmDetection}
          onCancel={() => setPendingDetection(null)}
        />
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: oklch(0.55 0.15 150 / 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: oklch(0.55 0.15 150 / 0.3);
        }
      `}</style>
    </div>
  );
}

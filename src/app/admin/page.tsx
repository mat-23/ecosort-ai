"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  BarChart3, 
  ArrowLeft, 
  Database, 
  Leaf, 
  Coins, 
  Boxes,
  TrendingUp,
  Percent
} from "lucide-react";
import { WASTE_CATEGORIES, WasteCategory } from "@/lib/sorting";
import { loadData, STORAGE_KEYS } from "@/lib/storage";

interface SortedItem {
  id: string;
  name: string;
  category: WasteCategory;
  reward: number;
  timestamp: number;
}

export default function AdminDashboard() {
  const [items, setItems] = useState<SortedItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = loadData<any[]>(STORAGE_KEYS.ITEMS) || [];
    setItems(saved);
    setIsLoaded(true);
  }, []);

  // Aggregations
  const totalVolume = items.length;
  const totalWealth = items.reduce((sum, item) => sum + item.reward, 0);
  
  // Total weight for CO2 formula: Total kg * 2.5
  const totalWeight = items.reduce((sum, item) => {
    return sum + (WASTE_CATEGORIES[item.category]?.weight || 0.1);
  }, 0);
  
  const totalCO2Saved = totalWeight * 2.5;

  // Material Breakdown
  const breakdown = items.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const breakdownData = Object.entries(WASTE_CATEGORIES).map(([key, cat]) => ({
    name: cat.name,
    count: breakdown[key] || 0,
    percentage: totalVolume > 0 ? ((breakdown[key] || 0) / totalVolume) * 100 : 0,
    color: cat.color
  })).filter(d => d.count > 0);

  if (!isLoaded) return null;

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-6">
          <div className="flex items-center gap-4">
            <Link 
              href="/" 
              className="h-10 w-10 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-black tracking-tighter text-primary flex items-center gap-2">
                <BarChart3 className="h-8 w-8" />
                Admin Dashboard
              </h1>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1 opacity-70">
                Live Product Metrics & Global Impact
              </p>
            </div>
          </div>
          <div className="bg-primary/5 border border-primary/20 px-4 py-2 rounded-2xl flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-primary/80">Real-time Data Active</span>
          </div>
        </header>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard 
            title="Total Waste Volume" 
            value={totalVolume.toString()} 
            subValue="Items Scanned" 
            icon={<Boxes className="h-6 w-6 text-primary" />}
            bgColor="bg-primary/10"
          />
          <MetricCard 
            title="Economic Impact" 
            value={`₦${totalWealth.toLocaleString()}`} 
            subValue="Wealth Generated" 
            icon={<Coins className="h-6 w-6 text-amber-500" />}
            bgColor="bg-amber-500/10"
          />
          <MetricCard 
            title="Environmental Impact" 
            value={`${totalCO2Saved.toFixed(2)}kg`} 
            subValue="CO₂ Saved (Global)" 
            icon={<Leaf className="h-6 w-6 text-secondary" />}
            bgColor="bg-secondary/10"
          />
          <MetricCard 
            title="Total Biomass" 
            value={`${totalWeight.toFixed(2)}kg`} 
            subValue="Collected Weight" 
            icon={<Database className="h-6 w-6 text-blue-500" />}
            bgColor="bg-blue-500/10"
          />
        </div>

        {/* Charts & Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Pie Chart Section */}
          <div className="lg:col-span-12 xl:col-span-5 bg-card border border-border rounded-[2.5rem] p-8 shadow-sm">
            <h2 className="text-sm font-black text-muted-foreground uppercase tracking-widest mb-8 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Material Breakdown
            </h2>
            
            <div className="flex flex-col items-center gap-8">
              {totalVolume > 0 ? (
                <>
                  <div className="relative h-64 w-64">
                    <SimplePieChart data={breakdownData} />
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-3xl font-black text-primary leading-none">{totalVolume}</span>
                      <span className="text-[9px] font-bold text-muted-foreground uppercase mt-1">Total items</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-x-8 gap-y-4 w-full mt-4">
                    {breakdownData.map((d, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: d.color }} />
                        <div className="flex flex-col">
                          <span className="text-xs font-black leading-none">{d.name}</span>
                          <span className="text-[10px] text-muted-foreground font-bold">{d.percentage.toFixed(1)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-center border-2 border-dashed border-border rounded-3xl w-full">
                  <p className="text-muted-foreground font-bold">No data captured yet</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1 uppercase tracking-widest px-8">Start scanning items to see analytics here</p>
                </div>
              )}
            </div>
          </div>

          {/* Detailed Stats */}
          <div className="lg:col-span-12 xl:col-span-7 bg-card border border-border rounded-[2.5rem] p-8 shadow-sm">
            <h2 className="text-sm font-black text-muted-foreground uppercase tracking-widest mb-8 flex items-center gap-2">
              <Percent className="h-4 w-4" />
              Performance Ledger
            </h2>
            
            <div className="space-y-4 overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Category</th>
                    <th className="pb-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-center">Scans</th>
                    <th className="pb-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right">Wealth (₦)</th>
                    <th className="pb-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right">Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {Object.entries(WASTE_CATEGORIES).map(([key, cat]) => {
                    const count = breakdown[key] || 0;
                    const wealth = count * (cat.rate || 0);
                    const progress = totalVolume > 0 ? (count / totalVolume) * 100 : 0;
                    
                    return (
                      <tr key={key} className="group transition-colors hover:bg-muted/30">
                        <td className="py-4 flex items-center gap-3">
                          <span className="text-xl">{cat.icon}</span>
                          <span className="font-bold text-sm">{cat.name}</span>
                        </td>
                        <td className="py-4 text-center font-black text-sm">{count}</td>
                        <td className="py-4 text-right font-black text-sm">₦{wealth.toLocaleString()}</td>
                        <td className="py-4 text-right pl-8">
                          <div className="h-2 w-24 bg-muted rounded-full overflow-hidden ml-auto">
                            <div 
                              className="h-full rounded-full transition-all duration-1000" 
                              style={{ backgroundColor: cat.color, width: `${progress}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, subValue, icon, bgColor }: { title: string, value: string, subValue: string, icon: React.ReactNode, bgColor: string }) {
  return (
    <div className="bg-card border border-border rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className={`h-12 w-12 rounded-2xl ${bgColor} flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      <div>
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{title}</p>
        <h3 className="text-2xl font-black text-foreground tracking-tighter mt-1">{value}</h3>
        <p className="text-[10px] font-bold text-muted-foreground/60 mt-0.5">{subValue}</p>
      </div>
    </div>
  );
}

function SimplePieChart({ data }: { data: any[] }) {
  // SVG drawing logic for a simple donut chart
  let currentPercentage = 0;
  
  return (
    <svg viewBox="0 0 100 100" className="transform -rotate-90">
      {data.length === 0 ? (
        <circle cx="50" cy="50" r="40" fill="transparent" stroke="var(--border)" strokeWidth="12" />
      ) : (
        data.map((segment, i) => {
          const strokeDasharray = `${segment.percentage} 100`;
          const strokeDashoffset = -currentPercentage;
          currentPercentage += segment.percentage;
          
          return (
            <circle
              key={i}
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              stroke={segment.color}
              strokeWidth="12"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000"
            />
          );
        })
      )}
      <circle cx="50" cy="50" r="30" fill="var(--card)" />
    </svg>
  );
}

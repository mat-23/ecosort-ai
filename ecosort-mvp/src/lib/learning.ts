import { WasteCategory, categorizeItem, calculateReward } from '@/lib/sorting';
import { loadData, saveData, STORAGE_KEYS } from '@/lib/storage';

export interface LearnedItem {
  id: string;
  embedding: number[];
  preciseName: string;
  category: WasteCategory;
  lastCost: number;
  useCount: number;
  timestamp: number;
}

const MEMORY_KEY = 'ecosort_neural_memory';

/**
 * Calculates cosine similarity between two vectors
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Service to manage AI "teaching" and neural lookups
 */
export const LearningService = {
  /**
   * Records a user-taught mapping
   */
  teach(embedding: number[], preciseName: string, category: WasteCategory, cost: number) {
    const memory = loadData<LearnedItem[]>(MEMORY_KEY) || [];
    
    // Check if we already have a very similar item to update instead of duplicate
    const existing = this.findMatch(embedding, 0.98);
    
    if (existing) {
      existing.preciseName = preciseName;
      existing.category = category;
      existing.lastCost = cost;
      existing.useCount++;
      existing.timestamp = Date.now();
      existing.embedding = embedding; // Update with latest scan
    } else {
      memory.push({
        id: Math.random().toString(36).substring(7),
        embedding,
        preciseName,
        category,
        lastCost: cost,
        useCount: 1,
        timestamp: Date.now()
      });
    }
    
    saveData(MEMORY_KEY, memory);
  },

  /**
   * Finds the closest learned match for an embedding
   */
  findMatch(embedding: number[], threshold = 0.85): LearnedItem | null {
    const memory = loadData<LearnedItem[]>(MEMORY_KEY) || [];
    let bestMatch: LearnedItem | null = null;
    let highestSim = -1;

    for (const item of memory) {
      const sim = cosineSimilarity(embedding, item.embedding);
      if (sim > highestSim && sim >= threshold) {
        highestSim = sim;
        bestMatch = item;
      }
    }

    return bestMatch;
  },

  /**
   * Predicts details based on previously learned data if available
   */
  predict(embedding: number[], fallbackName: string): { 
    name: string; 
    category: WasteCategory; 
    cost: number;
    isSmartMatch: boolean;
    confidence: number;
  } {
    const match = this.findMatch(embedding);
    
    if (match) {
      return {
        name: match.preciseName,
        category: match.category,
        cost: match.lastCost,
        isSmartMatch: true,
        confidence: 0.99
      };
    }

    // Default fallback logic
    const category = categorizeItem(fallbackName);
    return {
      name: fallbackName,
      category,
      cost: calculateReward(category),
      isSmartMatch: false,
      confidence: 0
    };
  }
};

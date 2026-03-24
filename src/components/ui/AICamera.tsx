"use client";

import { useRef, useState, useEffect } from "react";
import * as tf from "@tensorflow/tfjs";
import * as mobilenet from "@tensorflow-models/mobilenet";
import { Button } from "@/components/ui/button";
import { Loader2, Camera, RefreshCw } from "lucide-react";
import { formatItemName, WasteCategory, categorizeItem, calculateReward } from "@/lib/sorting";
import { LearningService } from "@/lib/learning";

interface AICameraProps {
  onDetected: (
    itemName: string, 
    category: WasteCategory, 
    cost: number, 
    confidence: number, 
    image?: string, 
    isSmartMatch?: boolean,
    embedding?: number[]
  ) => void;
}

export default function AICamera({ onDetected }: AICameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [model, setModel] = useState<mobilenet.MobileNet | null>(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastDetected, setLastDetected] = useState<string | null>(null);

  // Load MobileNet model on mount
  useEffect(() => {
    async function loadModel() {
      try {
        await tf.ready();
        const loadedModel = await mobilenet.load();
        setModel(loadedModel);
        setIsModelLoading(false);
      } catch (err) {
        console.error("Failed to load model:", err);
        setError("Failed to load AI model. Please check your internet connection.");
        setIsModelLoading(false);
      }
    }
    loadModel();
  }, []);

  const startCamera = async () => {
    setError(null);
    
    if (typeof navigator === "undefined" || !navigator.mediaDevices) {
      setError("Camera API is not supported in this browser or context (requires HTTPS or localhost).");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (err: any) {
      console.error("Error accessing camera:", err);
      if (err.name === "NotAllowedError") {
        setError("Camera permission denied. Please enable it in browser settings.");
      } else {
        setError("Could not access camera. Error: " + (err.message || "Unknown error"));
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraActive(false);
    }
  };

  const captureAndClassify = async () => {
    if (!model || !videoRef.current || isCapturing) return;

    setIsCapturing(true);
    try {
      const video = videoRef.current;
      
      // 1. Extract Neural Embedding (Feature Vector)
      // This is the "brain" of the operation—it describes the object's appearance mathematically
      const activation = tf.tidy(() => {
        const tensor = tf.browser.fromPixels(video)
          .resizeNearestNeighbor([224, 224])
          .toFloat()
          .expandDims();
        return model.infer(tensor, true);
      });
      
      const embedding = Array.from(activation.dataSync());
      activation.dispose();

      // 2. Standard MobileNet Classification
      const predictions = await model.classify(video);
      const topResult = predictions?.[0];
      const rawName = topResult?.className.split(",")[0] || "Unknown Object";
      
      // 3. Consult Neural Memory for a "Smart Match"
      // This allows the app to recognize objects it has seen before with extreme accuracy
      const prediction = LearningService.predict(embedding, rawName);
      
      // 4. Capture current frame for the UI
      let imageData = undefined;
      if (canvasRef.current && videoRef.current) {
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          imageData = canvas.toDataURL('image/jpeg', 0.6);
        }
      }
      
      // 5. Update UI and notify parent
      setLastDetected(`${prediction.name} (${Math.round((prediction.isSmartMatch ? 99 : (topResult?.probability || 0) * 100))}% Match)`);
      onDetected(
        prediction.name, 
        prediction.category, 
        prediction.cost, 
        prediction.isSmartMatch ? 0.99 : (topResult?.probability || 0), 
        imageData,
        prediction.isSmartMatch,
        embedding
      );
    } catch (err) {
      console.error("Error during classification:", err);
      setError("Vision system encountered an error. Please try again.");
    } finally {
      setIsCapturing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !model || isCapturing) return;

    setIsCapturing(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const img = new (window as any).Image();
      img.src = event.target?.result as string;
      img.onload = async () => {
        try {
          const predictions = await model.classify(img);
          if (predictions && predictions.length > 0) {
            const topResult = predictions[0];
            const rawName = topResult.className.split(",")[0];
            const itemName = formatItemName(rawName);
            const category = categorizeItem(itemName);
            const cost = calculateReward(category);
            const confidence = Math.round(topResult.probability * 100);
            
            setLastDetected(`${itemName} (${confidence}% Match)`);
            onDetected(itemName, category, cost, topResult.probability, event.target?.result as string);
          } else {
            setError("Could not identify item in the image.");
          }
        } catch (err) {
          console.error("Error during file classification:", err);
          setError("Image analysis failed.");
        } finally {
          setIsCapturing(false);
          // Reset file input so same file can be uploaded again
          if (fileInputRef.current) fileInputRef.current.value = "";
        }
      };
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  if (isModelLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-primary/20 rounded-2xl bg-primary/5">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground font-medium text-center">Loading AI Vision System...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      <style>{`
        @keyframes green-pulse {
          0% { box-shadow: 0 0 0 0 oklch(0.65 0.15 150 / 0.4); }
          70% { box-shadow: 0 0 0 15px oklch(0.65 0.15 150 / 0); }
          100% { box-shadow: 0 0 0 0 oklch(0.65 0.15 150 / 0); }
        }
        .animate-green-pulse {
          animation: green-pulse 2s infinite;
        }
      `}</style>
      <div className="relative aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border-2 border-primary/20 group">
        {!isCameraActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 bg-gradient-to-br from-primary/20 to-black/80">
            <Camera className="h-12 w-12 mb-4 opacity-50" />
            <p className="mb-6 text-center text-sm">Snap or upload a photo to automatically sort your item.</p>
            <div className="flex gap-3">
              <Button onClick={startCamera} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6">
                Open Camera
              </Button>
              <Button 
                variant="outline" 
                onClick={() => fileInputRef.current?.click()} 
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-full px-6"
              >
                Upload File
              </Button>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileUpload}
            />
          </div>
        )}
        
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${!isCameraActive ? 'hidden' : 'block'}`}
        />

        {lastDetected && isCameraActive && (
          <div className="absolute top-4 right-4 bg-primary/90 text-primary-foreground px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl animate-in fade-in slide-in-from-right-4 duration-500 flex items-center gap-2">
            <span className="opacity-60 italic">Detected:</span>
            {lastDetected}
          </div>
        )}

        {isCameraActive && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex bg-black/40 backdrop-blur-md p-2 rounded-full border border-white/20 gap-2">
              <Button 
                onClick={captureAndClassify} 
                disabled={isCapturing}
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6 py-6 h-auto animate-green-pulse"
              >
                {isCapturing ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                ) : (
                  <Camera className="h-5 w-5 mr-2" />
                )}
                {isCapturing ? "Identifying..." : "Snap & Sort"}
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={stopCamera}
                className="text-white hover:bg-white/20 rounded-full h-12 w-12"
              >
                <RefreshCw className="h-5 w-5" />
              </Button>
            </div>
          </div>
        )}
        
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg text-center animate-in zoom-in duration-300">
          {error}
        </div>
      )}
    </div>
  );
}

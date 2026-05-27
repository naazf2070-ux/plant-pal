import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Loader2, Stethoscope, Leaf, AlertTriangle, ShieldCheck, X, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface Diagnosis {
  is_plant: boolean;
  plant_guess: string | null;
  healthy: boolean;
  confidence: "low" | "medium" | "high";
  disease: { name: string; scientific_name: string | null; summary: string } | null;
  symptoms: string[];
  causes: string[];
  treatment: { immediate: string[]; ongoing: string[]; organic: string[]; chemical: string[] };
  prevention: string[];
  severity: "none" | "mild" | "moderate" | "severe";
  notes: string;
}

const MAX_BYTES = 8 * 1024 * 1024; // 8MB

const severityStyles: Record<Diagnosis["severity"], string> = {
  none: "bg-green-500/15 text-green-400 border-green-500/30",
  mild: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  moderate: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  severe: "bg-destructive/15 text-destructive border-destructive/30",
};

const Diagnose = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileMeta, setFileMeta] = useState<{ base64: string; mime: string } | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);

  if (!isLoading && !user) {
    navigate("/auth");
    return null;
  }

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Please upload an image", variant: "destructive" });
      return;
    }
    if (file.size > MAX_BYTES) {
      toast({ title: "Image too large", description: "Max 8MB.", variant: "destructive" });
      return;
    }
    const buf = await file.arrayBuffer();
    let bin = "";
    const bytes = new Uint8Array(buf);
    for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i]);
    const base64 = btoa(bin);
    setFileMeta({ base64, mime: file.type });
    setPreview(URL.createObjectURL(file));
    setDiagnosis(null);
  };

  const reset = () => {
    setPreview(null);
    setFileMeta(null);
    setDiagnosis(null);
    setNotes("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const diagnose = async () => {
    if (!fileMeta) return;
    setLoading(true);
    setDiagnosis(null);
    const { data, error } = await supabase.functions.invoke("diagnose-plant", {
      body: { imageBase64: fileMeta.base64, mimeType: fileMeta.mime, notes },
    });
    setLoading(false);
    if (error || (data as { error?: string })?.error) {
      toast({
        title: "Diagnosis failed",
        description: (data as { error?: string })?.error ?? error?.message ?? "Try again.",
        variant: "destructive",
      });
      return;
    }
    setDiagnosis((data as { diagnosis: Diagnosis }).diagnosis);
  };

  const renderList = (label: string, items: string[] | undefined) => {
    if (!items?.length) return null;
    return (
      <div>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-body mb-2">{label}</p>
        <ul className="space-y-1.5">
          {items.map((s, i) => (
            <li key={i} className="text-sm font-body text-foreground/90 flex gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>{s}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container px-6 md:px-12 lg:px-20 pt-28 pb-20 max-w-5xl">
        <header className="text-center mb-10">
          <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-primary font-body mb-4">
            <Sparkles className="w-3 h-3" /> AI Plant Doctor
          </div>
          <h1 className="font-display text-4xl md:text-5xl text-foreground mb-3">Diagnose your plant</h1>
          <p className="font-body text-sm text-muted-foreground max-w-xl mx-auto">
            Upload a clear photo of a leaf, stem, or the whole plant. Our AI will identify diseases, deficiencies, and pests — and tell you exactly how to treat them.
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Upload */}
          <div className="space-y-4">
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files?.[0];
                if (f) handleFile(f);
              }}
              className={cn(
                "relative aspect-square rounded-2xl border-2 border-dashed border-border/60 bg-card/40 backdrop-blur-sm cursor-pointer transition-all hover:border-primary/60 hover:bg-card/60 overflow-hidden group",
                preview && "border-solid border-border/80",
              )}
            >
              {preview ? (
                <>
                  <img src={preview} alt="Plant preview" className="absolute inset-0 w-full h-full object-cover" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      reset();
                    }}
                    className="absolute top-3 right-3 bg-background/80 backdrop-blur-md rounded-full p-1.5 text-foreground hover:bg-background"
                    aria-label="Remove image"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Upload className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-body text-sm text-foreground">Click or drag to upload</p>
                    <p className="font-body text-xs text-muted-foreground mt-1">JPG / PNG / WebP — max 8MB</p>
                  </div>
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
            </div>

            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={500}
              placeholder="Optional: describe symptoms, environment, how long it's been happening…"
              className="font-body text-sm bg-card/60 border-border/60 min-h-[80px]"
            />

            <Button
              onClick={diagnose}
              disabled={!fileMeta || loading}
              className="w-full font-body text-xs tracking-[0.2em] uppercase h-11"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing…
                </>
              ) : (
                <>
                  <Stethoscope className="w-4 h-4 mr-2" /> Diagnose plant
                </>
              )}
            </Button>
          </div>

          {/* Result */}
          <div className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm p-6 min-h-[400px]">
            <AnimatePresence mode="wait">
              {loading && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full min-h-[350px] flex flex-col items-center justify-center text-center gap-3"
                >
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  <p className="font-body text-sm text-muted-foreground">Our AI plant doctor is examining the photo…</p>
                </motion.div>
              )}

              {!loading && !diagnosis && (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full min-h-[350px] flex flex-col items-center justify-center text-center gap-3 text-muted-foreground/60"
                >
                  <Leaf className="w-10 h-10" />
                  <p className="font-body text-sm">Your diagnosis will appear here.</p>
                </motion.div>
              )}

              {!loading && diagnosis && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-5"
                >
                  {!diagnosis.is_plant ? (
                    <div className="flex items-start gap-2 text-yellow-400">
                      <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                      <p className="font-body text-sm">
                        We couldn't detect a plant in the image. Try uploading a clearer close-up.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-3 pb-4 border-b border-border/40">
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-body mb-1">
                            {diagnosis.plant_guess ?? "Plant"}
                          </p>
                          <h2 className="font-display text-xl text-foreground">
                            {diagnosis.healthy ? "Looks healthy 🌱" : diagnosis.disease?.name ?? "Issue detected"}
                          </h2>
                          {diagnosis.disease?.scientific_name && (
                            <p className="text-xs italic font-body text-muted-foreground mt-0.5">
                              {diagnosis.disease.scientific_name}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                          <span
                            className={cn(
                              "text-[10px] font-body px-2 py-0.5 rounded-full border uppercase tracking-wider",
                              severityStyles[diagnosis.severity],
                            )}
                          >
                            {diagnosis.severity}
                          </span>
                          <span className="text-[10px] font-body text-muted-foreground uppercase tracking-wider">
                            {diagnosis.confidence} confidence
                          </span>
                        </div>
                      </div>

                      {diagnosis.disease?.summary && (
                        <p className="font-body text-sm text-foreground/90 leading-relaxed">
                          {diagnosis.disease.summary}
                        </p>
                      )}

                      {renderList("Symptoms", diagnosis.symptoms)}
                      {renderList("Likely causes", diagnosis.causes)}
                      {renderList("Do now", diagnosis.treatment?.immediate)}
                      {renderList("Ongoing care", diagnosis.treatment?.ongoing)}
                      {renderList("Organic treatment", diagnosis.treatment?.organic)}
                      {renderList("Chemical options", diagnosis.treatment?.chemical)}
                      {renderList("Prevention", diagnosis.prevention)}

                      {diagnosis.notes && (
                        <div className="flex items-start gap-2 p-3 rounded-xl bg-muted/30 border border-border/40">
                          <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                          <p className="font-body text-xs text-muted-foreground leading-relaxed">{diagnosis.notes}</p>
                        </div>
                      )}
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Diagnose;

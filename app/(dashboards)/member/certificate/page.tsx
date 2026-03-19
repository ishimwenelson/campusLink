// app/(dashboards)/member/certificate/page.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/hooks/useAuth";
import { formatRF } from "@/lib/utils/format";
import { fireConfetti } from "@/lib/utils/confetti";
import { Shield, Download, Lock, Trophy, FileText, Image as ImageIcon, Loader2 } from "lucide-react";
import { PremiumCertificate } from "@/components/certificate/PremiumCertificate";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import { toast } from "sonner";

export default function CertificatePage() {
  const { profile } = useAuth();
  const [downloading, setDownloading] = useState<"pdf" | "png" | null>(null);
  const certRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scalingWrapperRef = useRef<HTMLDivElement>(null);

  // Responsive Scaling Logic
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && scalingWrapperRef.current) {
        const parentWidth = containerRef.current.clientWidth;
        const scale = Math.min((parentWidth - 48) / 1050, 1);
        scalingWrapperRef.current.style.setProperty('--cert-scale', scale.toString());
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [profile]);

  if (!profile) return null;

  const isComplete = profile.paidSoFar >= profile.totalShareValue;

  const handleDownload = async (type: "pdf" | "png") => {
    if (!certRef.current) return;
    setDownloading(type);
    
    try {
      // Small delay to ensure everything is rendered
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const dataUrl = await toPng(certRef.current, {
        quality: 1,
        pixelRatio: 2, // Higher resolution
      });

      if (type === "png") {
        const link = document.createElement('a');
        link.download = `CampusLink_Certificate_${profile.fullName.replace(/\s+/g, '_')}.png`;
        link.href = dataUrl;
        link.click();
      } else {
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'px',
          format: [1050, 740]
        });
        pdf.addImage(dataUrl, 'PNG', 0, 0, 1050, 740);
        pdf.save(`CampusLink_Certificate_${profile.fullName.replace(/\s+/g, '_')}.pdf`);
      }
      
      await fireConfetti();
      toast.success("Certificate downloaded successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate certificate.");
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Official <span className="text-amber-500">Certificate</span></h1>
          <p className="text-stone-500 font-medium mt-1">Institutional Recognition of Equity Completion</p>
        </div>
        
        {isComplete && (
          <div className="flex gap-3">
            <button
              onClick={() => handleDownload("png")}
              disabled={!!downloading}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-stone-800 text-stone-300 font-bold text-sm hover:text-white hover:bg-stone-700 transition-all disabled:opacity-50"
            >
              {downloading === "png" ? <Loader2 size={18} className="animate-spin" /> : <ImageIcon size={18} />}
              PNG Image
            </button>
            <button
              onClick={() => handleDownload("pdf")}
              disabled={!!downloading}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 text-stone-950 font-black text-sm hover:bg-amber-400 transition-all shadow-xl shadow-amber-500/20 disabled:opacity-50"
            >
              {downloading === "pdf" ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
              Standard PDF
            </button>
          </div>
        )}
      </div>

      {!isComplete ? (
        /* Locked state */
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-stone-900 border border-stone-800 rounded-[3rem] p-12 text-center space-y-6 max-w-2xl mx-auto"
        >
          <div className="w-24 h-24 rounded-full bg-stone-800 flex items-center justify-center mx-auto">
            <Lock size={40} className="text-stone-600" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white">Certificate Restricted</h2>
            <p className="text-stone-500 text-sm leading-relaxed">
              Your official completion certificate will be generated automatically once your total equity contributions match your institutional share commitment.
            </p>
          </div>
          
          <div className="bg-stone-950 rounded-[2rem] p-8 space-y-4">
            <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest">
              <span className="text-stone-500">Progress to Completion</span>
              <span className="text-amber-500">{Math.round((profile.paidSoFar / profile.totalShareValue) * 100)}%</span>
            </div>
            <div className="h-3 bg-stone-900 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(profile.paidSoFar / profile.totalShareValue) * 100}%` }}
                className="h-full bg-amber-500"
              />
            </div>
            <p className="text-[11px] font-bold text-stone-600">
              {formatRF(profile.paidSoFar)} / {formatRF(profile.totalShareValue)} RF
            </p>
          </div>
        </motion.div>
      ) : (
        /* Preview state */
        <div className="space-y-8 max-w-5xl mx-auto">
          <div 
            ref={containerRef}
            className="relative w-full overflow-hidden rounded-2xl shadow-2xl border border-stone-800 bg-stone-900/50"
          >
            {/* Aspect Ratio Box to reserve space */}
            <div className="w-full pb-[70.47%]" /> {/* 740 / 1050 = 0.7047 */}
            
            {/* Scaled Content Wrapped */}
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <div 
                ref={scalingWrapperRef}
                className="origin-center"
                style={{
                  width: '1050px',
                  height: '740px',
                  transform: 'scale(var(--cert-scale, 1))',
                }}
              >
                <PremiumCertificate profile={profile} ref={certRef} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <CertFeature icon={Shield} title="Verified" desc="Blockchain-linked QR verification" />
            <CertFeature icon={Trophy} title="Member" desc="Official recognition of status" />
            <CertFeature icon={FileText} title="High Quality" desc="Print-ready 300 DPI resolution" />
          </div>
        </div>
      )}
    </div>
  );
}

function CertFeature({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="flex items-center gap-4 p-5 rounded-2xl bg-stone-900/50 border border-stone-800">
      <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
        <Icon size={24} />
      </div>
      <div>
        <h4 className="font-bold text-white text-sm">{title}</h4>
        <p className="text-stone-500 text-xs">{desc}</p>
      </div>
    </div>
  );
}


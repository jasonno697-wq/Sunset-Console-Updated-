import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface ChromebookOverlayProps {
  isActive: boolean;
}

export const ChromebookOverlay: React.FC<ChromebookOverlayProps> = ({ isActive }) => {
  if (!isActive) return null;

  return (
    <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full">
      <ShieldCheck className="w-3 h-3 text-blue-400" />
      <span className="text-[10px] text-blue-400 font-bold uppercase tracking-tighter">Browser Sandbox Active</span>
    </div>
  );
};

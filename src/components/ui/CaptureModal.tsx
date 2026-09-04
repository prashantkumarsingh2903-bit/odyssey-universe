import React, { useState, useEffect } from 'react';
import { useGraphStore, type NodeType } from '../../store/useGraphStore';
import { X, CornerDownLeft, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const CaptureModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [input, setInput] = useState('');
  const { nodes, setNodes } = useGraphStore();

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newNode = {
      id: `node-${Date.now()}`,
      title: input,
      type: 'IDEA' as NodeType,
      tags: ['New'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      gravityScore: 50,
      connections: [],
      // Place it at outer orbit to fly in
      position: [(Math.random() - 0.5) * 40, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 40] as [number, number, number]
    };

    setNodes([...nodes, newNode]);
    setInput('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-2xl bg-surface/90 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-2xl overflow-hidden"
          >
            <form onSubmit={handleSubmit}>
              <div className="flex items-center gap-4 border-b border-white/10 pb-4">
                <Sparkles size={24} className="text-white/40" />
                <input
                  autoFocus
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Capture a thought, idea, or learning..."
                  className="w-full bg-transparent text-2xl font-light text-white outline-none placeholder:text-white/20"
                />
              </div>

              <div className="flex justify-between items-center mt-4">
                <div className="flex gap-2 text-xs font-mono">
                  <span className="px-2 py-1 bg-white/5 border border-white/10 rounded text-white/50 cursor-pointer hover:text-white">IDEA</span>
                  <span className="px-2 py-1 bg-transparent border border-white/5 rounded text-white/30 cursor-pointer hover:text-white">NOTE</span>
                  <span className="px-2 py-1 bg-transparent border border-white/5 rounded text-white/30 cursor-pointer hover:text-white">LEARNING</span>
                </div>
                
                <button 
                  type="submit"
                  className="flex items-center gap-2 text-xs uppercase tracking-widest bg-white text-black px-4 py-2 rounded font-medium hover:bg-white/90 transition-colors"
                >
                  Enter Orbit <CornerDownLeft size={14} />
                </button>
              </div>
            </form>
            
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 text-white/30 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

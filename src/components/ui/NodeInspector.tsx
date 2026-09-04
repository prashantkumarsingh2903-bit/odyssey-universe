import React from 'react';
import { useGraphStore } from '../../store/useGraphStore';
import { MOCK_NODES } from '../../data/mockData';
import { X, ExternalLink, Activity, Target, Brain, BookOpen } from 'lucide-react';

const typeIcons: Record<string, React.ReactNode> = {
  IDEA: <Brain size={14} />,
  KNOWLEDGE: <BookOpen size={14} />,
  ACTIVITY: <Activity size={14} />,
  GOAL: <Target size={14} />,
};

export const NodeInspector = () => {
  const { selectedNodeId, setSelectedNode } = useGraphStore();

  if (!selectedNodeId) return null;

  const node = MOCK_NODES.find(n => n.id === selectedNodeId);
  if (!node) return null;

  return (
    <div className="absolute top-8 right-8 w-80 bg-surface/80 backdrop-blur-xl border border-white/10 text-white rounded-2xl shadow-2xl overflow-hidden z-20 flex flex-col transition-all animate-in fade-in slide-in-from-right-8 duration-500">
      <div className="flex justify-between items-center p-4 border-b border-white/10">
        <div className="flex items-center gap-2 text-xs font-mono text-white/50 tracking-widest uppercase">
          {typeIcons[node.type] || <Brain size={14} />}
          {node.type}
        </div>
        <button 
          onClick={() => setSelectedNode(null)}
          className="text-white/50 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <div className="p-6">
        <h2 className="text-xl font-light mb-2">{node.title}</h2>
        <p className="text-sm text-white/60 font-light leading-relaxed mb-6">
          {node.description || 'This node represents a concept floating in your personal universe. Connections indicate semantic relationships or temporal proximity.'}
        </p>

        <div className="flex flex-wrap gap-2 mb-6">
          {node.tags.map(tag => (
            <span key={tag} className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px] uppercase tracking-wider text-white/70">
              {tag}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-black/20 rounded-lg p-3 border border-white/5">
            <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Gravity</div>
            <div className="text-lg font-light">{node.gravityScore}</div>
          </div>
          <div className="bg-black/20 rounded-lg p-3 border border-white/5">
            <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Orbit</div>
            <div className="text-lg font-light">{node.position ? Math.round(Math.sqrt(node.position[0]**2 + node.position[2]**2)) : 0} AU</div>
          </div>
        </div>
      </div>

      <div className="p-4 bg-white/5 border-t border-white/10 flex justify-between items-center">
        <span className="text-[10px] uppercase tracking-widest text-white/30">
          {new Date(node.createdAt).toLocaleDateString()}
        </span>
        <button className="flex items-center gap-1 text-xs text-white/70 hover:text-white transition-colors">
          Explore Thread <ExternalLink size={12} />
        </button>
      </div>
    </div>
  );
};

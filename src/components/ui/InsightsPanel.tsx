import React from 'react';
import { Lightbulb, TrendingUp, Compass } from 'lucide-react';

export const InsightsPanel = () => {
  return (
    <div className="absolute bottom-8 right-8 w-80 flex flex-col gap-4 z-10 pointer-events-none">
      <InsightCard 
        icon={<Lightbulb size={16} className="text-accent-idea" />}
        text="You have mentioned AI + education 7 times this month. Three unrelated ideas may form a potential project."
      />
      <InsightCard 
        icon={<TrendingUp size={16} className="text-accent-activity" />}
        text="Your UX research notes frequently connect with behavioral psychology."
      />
      <InsightCard 
        icon={<Compass size={16} className="text-accent-knowledge" />}
        text="You have not revisited your typography knowledge in 24 days."
      />
    </div>
  );
};

const InsightCard = ({ icon, text }: { icon: React.ReactNode, text: string }) => (
  <div className="bg-surface/60 backdrop-blur-md border border-white/10 rounded-xl p-4 flex gap-4 pointer-events-auto transition-transform hover:-translate-y-1 hover:bg-surface/80">
    <div className="mt-0.5">
      {icon}
    </div>
    <p className="text-xs font-light text-white/80 leading-relaxed">
      {text}
    </p>
  </div>
);

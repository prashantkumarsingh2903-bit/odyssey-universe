import React, { useEffect } from 'react';
import { gql, useQuery } from '@apollo/client';
import { motion } from 'framer-motion';
import { useTelemetryStore } from '../../store/useTelemetryStore';
import { AlertTriangle, Activity, Target } from 'lucide-react';

const GET_NEAR_EARTH_OBJECTS = gql`
  query GetNearEarthObjects($startDate: String!, $endDate: String!) {
    getNearEarthObjects(startDate: $startDate, endDate: $endDate) {
      id
      name
      absolute_magnitude_h
      estimated_diameter_max_km
      relative_velocity_km_per_s
      is_potentially_hazardous_asteroid
    }
  }
`;

export const TelemetryHUD = () => {
  const today = new Date().toISOString().split('T')[0];
  const { data, loading, error } = useQuery(GET_NEAR_EARTH_OBJECTS, {
    variables: { startDate: today, endDate: today },
  });
  
  const setAsteroids = useTelemetryStore(state => state.setAsteroids);

  useEffect(() => {
    if (data?.getNearEarthObjects) {
      setAsteroids(data.getNearEarthObjects);
    }
  }, [data, setAsteroids]);

  if (loading) return null;
  if (error) return (
    <div className="absolute top-8 right-8 z-20 bg-red-900/50 backdrop-blur-md border border-red-500/50 text-red-200 p-4 rounded-xl">
      Connection to Odyssey Gateway failed.
    </div>
  );

  const asteroids = data?.getNearEarthObjects || [];
  const hazardousCount = asteroids.filter((a: any) => a.is_potentially_hazardous_asteroid).length;

  return (
    <motion.div 
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut", delay: 0.5 }}
      className="absolute top-8 right-8 z-20 w-80 flex flex-col gap-4 pointer-events-none"
    >
      {/* Header */}
      <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-2xl">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-white/80 uppercase tracking-widest text-xs font-semibold flex items-center gap-2">
            <Target size={14} className="text-blue-400" />
            Telemetry Uplink
          </h2>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
        </div>
        <div className="text-2xl font-light tracking-wider text-white">
          {asteroids.length} <span className="text-sm text-white/50 tracking-normal">Near Earth Objects</span>
        </div>
        
        {hazardousCount > 0 && (
          <div className="mt-3 flex items-center gap-2 text-xs text-red-400 bg-red-900/20 border border-red-900/50 rounded px-2 py-1">
            <AlertTriangle size={12} />
            {hazardousCount} Hazardous Anomaly Detected
          </div>
        )}
      </div>

      {/* Data Stream */}
      <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-2xl max-h-[60vh] overflow-hidden flex flex-col pointer-events-auto">
        <h3 className="text-white/50 uppercase tracking-wider text-[10px] mb-3 flex items-center gap-2">
          <Activity size={12} />
          Live Threat Vector Stream
        </h3>
        <div className="flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar">
          {asteroids.map((ast: any) => (
            <div key={ast.id} className="border-l-2 border-white/20 pl-3 py-1 hover:border-blue-400 transition-colors">
              <div className="text-white font-medium text-sm mb-1">{ast.name}</div>
              <div className="grid grid-cols-2 gap-2 text-xs text-white/60">
                <div>
                  <div className="uppercase text-[9px] text-white/40">Magnitude</div>
                  {ast.absolute_magnitude_h.toFixed(2)} H
                </div>
                <div>
                  <div className="uppercase text-[9px] text-white/40">Velocity</div>
                  {parseFloat(ast.relative_velocity_km_per_s).toFixed(1)} km/s
                </div>
                <div className="col-span-2">
                  <div className="uppercase text-[9px] text-white/40">Est. Diameter</div>
                  {ast.estimated_diameter_max_km.toFixed(2)} km
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

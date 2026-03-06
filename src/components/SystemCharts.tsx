import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';

interface ChartProps {
  data: any[];
  color: string;
  title: string;
  dataKey: string;
}

export const SystemLineChart: React.FC<ChartProps> = ({ data, color, title, dataKey }) => {
  return (
    <div className="w-full h-32 bg-black/20 rounded-2xl border border-white/5 p-4 overflow-hidden group hover:border-white/10 transition-all">
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-[10px] text-white/30 uppercase font-black tracking-widest">{title}</h4>
        <span className="text-[10px] font-bold" style={{ color }}>{data[data.length - 1]?.[dataKey]?.toFixed(1)}%</span>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <Area 
            type="monotone" 
            dataKey={dataKey} 
            stroke={color} 
            fillOpacity={1} 
            fill={`url(#gradient-${dataKey})`} 
            strokeWidth={2}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

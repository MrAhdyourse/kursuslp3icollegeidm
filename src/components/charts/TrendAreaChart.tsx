import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ChartProps {
  data: any[];
}

export const TrendAreaChart: React.FC<ChartProps> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorNilai" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#0056b3" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#0056b3" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
        <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} domain={[0, 100]} />
        <Tooltip 
          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          cursor={{ stroke: '#0056b3', strokeWidth: 1, strokeDasharray: '4 4' }}
        />
        <Area 
          type="monotone" 
          dataKey="nilai" 
          stroke="#0056b3" 
          strokeWidth={3}
          fillOpacity={1} 
          fill="url(#colorNilai)" 
          activeDot={{ r: 6, strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

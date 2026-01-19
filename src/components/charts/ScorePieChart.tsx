import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useIsMobile } from '../../hooks/useIsMobile';

interface ChartProps {
  data: any[];
}

export const ScorePieChart: React.FC<ChartProps> = ({ data }) => {
  const isMobile = useIsMobile();

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie 
          data={data} 
          cx="50%" 
          cy="50%" 
          innerRadius={isMobile ? 50 : 60} 
          outerRadius={isMobile ? 70 : 80} 
          paddingAngle={5} 
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
        />
        <Legend 
          layout={isMobile ? 'horizontal' : 'vertical'} 
          verticalAlign={isMobile ? 'bottom' : 'middle'} 
          align={isMobile ? 'center' : 'right'}
          wrapperStyle={isMobile ? { paddingTop: '20px' } : {}}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

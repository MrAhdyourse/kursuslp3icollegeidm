import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ChartProps {
  data: any[];
}

export const ProgressLineChart: React.FC<ChartProps> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" />
        <YAxis domain={[0, 100]} />
        <Tooltip contentStyle={{borderRadius: '8px'}} />
        <Line type="monotone" dataKey="nilai" stroke="#d62828" strokeWidth={3} dot={{r: 4}} />
      </LineChart>
    </ResponsiveContainer>
  );
};

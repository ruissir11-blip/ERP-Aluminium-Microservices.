import React, { useEffect, useState } from 'react';
import { Card, Spin } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Line, ComposedChart, ResponsiveContainer } from 'recharts';
import { paretoApi } from '../../services/quality/qualityApi';
import { ParetoData } from '../../types/quality.types';

interface ParetoChartProps {
  height?: number;
  type?: 'defect' | 'machine' | 'operator';
  startDate?: Date;
  endDate?: Date;
}

const ParetoChart: React.FC<ParetoChartProps> = ({ 
  height = 300, 
  type = 'defect',
  startDate,
  endDate 
}) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ParetoData[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadParetoData();
  }, [type, startDate, endDate]);

  const loadParetoData = async () => {
    setLoading(true);
    setError(null);
    try {
      let response: ParetoData[];
      switch (type) {
        case 'machine':
          response = await paretoApi.getByMachine(startDate, endDate);
          break;
        case 'operator':
          response = await paretoApi.getByOperator(startDate, endDate);
          break;
        default:
          response = await paretoApi.getByDefectType(startDate, endDate);
      }
      setData(response);
    } catch (err: any) {
      setError(err.message || 'Failed to load Pareto data');
      // Use mock data for demo
      setData([
        { type: 'Surface Scratch', count: 40, percentage: 40, cumulativePercentage: 40 },
        { type: 'Dimensional Error', count: 25, percentage: 25, cumulativePercentage: 65 },
        { type: 'Color Variation', count: 15, percentage: 15, cumulativePercentage: 80 },
        { type: 'Other', count: 20, percentage: 20, cumulativePercentage: 100 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height }}>
        <Spin />
      </div>
    );
  }

  if (error && data.length === 0) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#ff4d4f' }}>Failed to load Pareto data</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="type" 
          tick={{ fontSize: 12 }}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis 
          yAxisId="left" 
          tick={{ fontSize: 12 }}
          label={{ value: 'Count', angle: -90, position: 'insideLeft' }}
        />
        <YAxis 
          yAxisId="right" 
          orientation="right" 
          tick={{ fontSize: 12 }}
          domain={[0, 100]}
          label={{ value: 'Cumulative %', angle: 90, position: 'insideRight' }}
        />
        <Tooltip 
          formatter={(value: number, name: string) => {
            if (name === 'cumulativePercentage') {
              return [`${value.toFixed(1)}%`, 'Cumulative %'];
            }
            return [value, 'Count'];
          }}
        />
        <Legend />
        <Bar 
          yAxisId="left" 
          dataKey="count" 
          name="Count" 
          fill="#1890ff" 
          barSize={40}
        />
        <Line 
          yAxisId="right" 
          type="monotone" 
          dataKey="cumulativePercentage" 
          name="Cumulative %" 
          stroke="#ff4d4f" 
          strokeWidth={2}
          dot={{ r: 4 }}
        />
        {/* 80% line reference */}
        <Line 
          yAxisId="right" 
          dataKey={() => 80} 
          stroke="#52c41a" 
          strokeDasharray="5 5" 
          strokeWidth={1}
          dot={false}
          name="80% Threshold"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
};

export default ParetoChart;

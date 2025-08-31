import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine, Tooltip, LabelList } from 'recharts';

interface MonthlyRentalsData {
  month: string;
  novas: number;
  usadas: number;
  projecao: number;
  total: number;
}

interface MonthlyRentalsChartProps {
  data: MonthlyRentalsData[];
  meta?: number;
}

export function MonthlyRentalsChart({ data, meta = 180 }: MonthlyRentalsChartProps) {
  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 20,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis 
            dataKey="month" 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#64748b' }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#64748b' }}
            dx={-10}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          />
          
          {/* Linha de meta */}
          <ReferenceLine 
            y={meta} 
            stroke="#22c55e" 
            strokeDasharray="5 5" 
            strokeWidth={2}
            label={{ value: `Meta: ${meta}`, position: "topRight", fill: "#22c55e", fontSize: 12 }}
          />
          
          {/* Barras empilhadas */}
          <Bar
            dataKey="novas"
            stackId="rentals"
            fill="#3b82f6"
            name="Novas"
            radius={[0, 0, 0, 0]}
          >
            <LabelList
              dataKey="novas"
              position="center"
              fill="white"
              fontSize={12}
              fontWeight="bold"
              formatter={(value: number) => value > 0 ? value : ''}
            />
          </Bar>
          <Bar
            dataKey="usadas"
            stackId="rentals"
            fill="#22c55e"
            name="Usadas"
            radius={[0, 0, 0, 0]}
          >
            <LabelList
              dataKey="usadas"
              position="center"
              fill="white"
              fontSize={12}
              fontWeight="bold"
              formatter={(value: number) => value > 0 ? value : ''}
            />
          </Bar>
          <Bar
            dataKey="projecao"
            stackId="rentals"
            fill="#a855f7"
            name="Projeção"
            fillOpacity={0.6}
            radius={[2, 2, 0, 0]}
          >
            <LabelList
              dataKey="projecao"
              position="center"
              fill="white"
              fontSize={12}
              fontWeight="bold"
              formatter={(value: number) => value > 0 ? value : ''}
            />
          </Bar>
          
          {/* Linha do total */}
          <Line
            type="monotone"
            dataKey="total"
            stroke="#f97316"
            strokeWidth={2}
            dot={{ fill: '#f97316', strokeWidth: 2, r: 4 }}
            name="Total"
          >
            <LabelList
              dataKey="total"
              position="top"
              fill="#374151"
              fontSize={12}
              fontWeight="bold"
              offset={8}
              formatter={(value: number) => value > 0 ? value : ''}
            />
          </Line>
        </ComposedChart>
      </ResponsiveContainer>
      
      {/* Legenda personalizada */}
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded"></div>
          <span className="text-sm text-gray-600">Novas</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span className="text-sm text-gray-600">Usadas</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-purple-500 rounded opacity-60"></div>
          <span className="text-sm text-gray-600">Projeção</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 border-2 border-orange-500 rounded-full"></div>
          <span className="text-sm text-gray-600">Total</span>
        </div>
      </div>
    </div>
  );
}

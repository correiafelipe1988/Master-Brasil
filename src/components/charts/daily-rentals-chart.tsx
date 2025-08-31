import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, LabelList } from 'recharts';

interface DailyRentalsData {
  day: string;
  novas: number;
  usadas: number;
  total: number;
}

interface DailyRentalsChartProps {
  data: DailyRentalsData[];
}

export function DailyRentalsChart({ data }: DailyRentalsChartProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      {/* Cabeçalho */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900">
          Análise Diária de Locações (Últimos 30 Dias)
        </h3>
      </div>
      
      <p className="text-sm text-gray-600 mb-6">
        Volume de motos alugadas e relocadas (barras) e o total de locações (linha).
      </p>

      {/* Gráfico */}
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart
          data={data}
          margin={{
            top: 30,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="day" 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#6b7280' }}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#6b7280' }}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
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
              fontSize={10}
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
              fontSize={10}
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
            dot={{ fill: '#f97316', strokeWidth: 2, r: 3 }}
            name="Total"
          >
            <LabelList 
              dataKey="total" 
              position="top" 
              fill="#374151" 
              fontSize={10}
              fontWeight="bold"
              offset={6}
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
          <div className="w-3 h-3 bg-orange-500 rounded"></div>
          <span className="text-sm text-gray-600">Total</span>
        </div>
      </div>
    </div>
  );
}

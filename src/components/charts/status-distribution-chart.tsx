import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface StatusDistributionData {
  name: string;
  count: number;
  value: number;
}

interface StatusDistributionChartProps {
  data: StatusDistributionData[];
}

// Cores baseadas na imagem de referência
const COLORS = {
  'Disponível': '#22c55e', // Verde
  'Alugada': '#3b82f6',    // Azul
  'Manutenção': '#f97316', // Laranja
  'Recolhida': '#8b5cf6',  // Roxo
  'Relocada': '#06b6d4',   // Ciano
};

export function StatusDistributionChart({ data }: StatusDistributionChartProps) {
  const getColor = (name: string) => {
    return COLORS[name as keyof typeof COLORS] || '#64748b';
  };

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={80}
            outerRadius={120}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={getColor(entry.name)}
                stroke={getColor(entry.name)}
                strokeWidth={2}
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      
      {/* Legenda personalizada como na imagem */}
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {data.map((entry) => (
          <div key={entry.name} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: getColor(entry.name) }}
            />
            <span className="text-sm text-gray-600">{entry.name}</span>
          </div>
        ))}
      </div>
      
      {/* Texto central como na imagem */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-800">
            {data.reduce((acc, item) => acc + item.count, 0)}
          </div>
          <div className="text-sm text-gray-500">Total</div>
        </div>
      </div>
    </div>
  );
}
import { Construction, ArrowLeft, Clock, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

interface UnderDevelopmentProps {
  title: string;
  description?: string;
  expectedFeatures?: string[];
  estimatedCompletion?: string;
}

export function UnderDevelopment({ 
  title, 
  description = "Esta funcionalidade está sendo desenvolvida pela nossa equipe.",
  expectedFeatures = [],
  estimatedCompletion = "Em breve"
}: UnderDevelopmentProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl mx-auto shadow-xl">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto mb-4 p-4 bg-orange-100 rounded-full w-20 h-20 flex items-center justify-center">
            <Construction className="h-10 w-10 text-orange-600" />
          </div>
          <CardTitle className="text-3xl font-bold text-gray-800 mb-2">
            {title}
          </CardTitle>
          <CardDescription className="text-lg text-gray-600">
            {description}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {expectedFeatures.length > 0 && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                Funcionalidades Planejadas:
              </h3>
              <ul className="space-y-2">
                {expectedFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-blue-700">
                    <span className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Previsão de Lançamento:
            </h3>
            <p className="text-green-700">{estimatedCompletion}</p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              onClick={() => navigate(-1)}
              variant="outline" 
              className="flex-1 flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <Button 
              onClick={() => navigate('/')}
              className="flex-1"
            >
              Ir para Dashboard
            </Button>
          </div>

          <div className="text-center pt-4 border-t">
            <p className="text-sm text-gray-500">
              Tem sugestões para esta funcionalidade? Entre em contato com nossa equipe de desenvolvimento.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

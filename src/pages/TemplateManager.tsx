import React from 'react';
import { UpdateRentalTemplate } from '@/components/UpdateRentalTemplate';

const TemplateManager: React.FC = () => {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gerenciador de Templates</h1>
        <p className="text-gray-600 mt-2">
          Ferramentas para gerenciar e atualizar os templates de contratos do sistema.
        </p>
      </div>
      
      <div className="space-y-8">
        <UpdateRentalTemplate />
      </div>
    </div>
  );
};

export default TemplateManager;
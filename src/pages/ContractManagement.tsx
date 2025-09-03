import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  ContractTemplateService, 
  ContractType, 
  ContractTemplate, 
  ContractClause,
  GeneratedContract 
} from '@/services/contractTemplateService';
import { 
  FileText, 
  Plus, 
  Edit, 
  Eye, 
  Download, 
  Settings, 
  Users, 
  BarChart3,
  Clock,
  CheckCircle,
  Send,
  XCircle
} from 'lucide-react';

export const ContractManagement: React.FC = () => {
  const [contractTypes, setContractTypes] = useState<ContractType[]>([]);
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [generatedContracts, setGeneratedContracts] = useState<GeneratedContract[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);
  const [clauses, setClauses] = useState<ContractClause[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [typesData, templatesData, contractsData] = await Promise.all([
        ContractTemplateService.getContractTypes(),
        ContractTemplateService.getTemplatesByType(''), // Buscar todos
        ContractTemplateService.getGeneratedContracts()
      ]);

      setContractTypes(typesData);
      setTemplates(templatesData);
      setGeneratedContracts(contractsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os dados dos contratos.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadTemplateClauses = async (templateId: string) => {
    try {
      const clausesData = await ContractTemplateService.getTemplateClauses(templateId);
      setClauses(clausesData);
    } catch (error) {
      console.error('Erro ao carregar cláusulas:', error);
    }
  };

  const getStatusBadge = (status: GeneratedContract['status']) => {
    const statusConfig = {
      draft: { label: 'Rascunho', variant: 'secondary' as const, icon: Clock },
      generated: { label: 'Gerado', variant: 'default' as const, icon: FileText },
      sent: { label: 'Enviado', variant: 'default' as const, icon: Send },
      signed: { label: 'Assinado', variant: 'default' as const, icon: CheckCircle },
      cancelled: { label: 'Cancelado', variant: 'destructive' as const, icon: XCircle }
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getContractStats = () => {
    const total = generatedContracts.length;
    const signed = generatedContracts.filter(c => c.status === 'signed').length;
    const pending = generatedContracts.filter(c => c.status === 'sent').length;
    const draft = generatedContracts.filter(c => c.status === 'draft').length;

    return { total, signed, pending, draft };
  };

  const stats = getContractStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestão de Contratos</h1>
          <p className="text-gray-600">Gerencie templates e contratos do sistema</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Configurações
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Novo Template
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Contratos</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Assinados</p>
                <p className="text-2xl font-bold text-green-600">{stats.signed}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rascunhos</p>
                <p className="text-2xl font-bold text-gray-600">{stats.draft}</p>
              </div>
              <Edit className="w-8 h-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="templates" className="space-y-4">
        <TabsList>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="contracts">Contratos Gerados</TabsTrigger>
          <TabsTrigger value="types">Tipos de Contrato</TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Lista de Templates */}
            <Card>
              <CardHeader>
                <CardTitle>Templates Disponíveis</CardTitle>
                <CardDescription>
                  Gerencie os templates de contratos do sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedTemplate?.id === template.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => {
                      setSelectedTemplate(template);
                      loadTemplateClauses(template.id);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{template.name}</h4>
                        <p className="text-sm text-gray-600">
                          v{template.version} - {template.contract_type?.name}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {template.is_default && (
                          <Badge variant="default">Padrão</Badge>
                        )}
                        <Badge variant={template.is_active ? "default" : "secondary"}>
                          {template.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
                
                {templates.length === 0 && (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">Nenhum template encontrado</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Detalhes do Template */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {selectedTemplate ? selectedTemplate.name : 'Selecione um Template'}
                </CardTitle>
                {selectedTemplate && (
                  <CardDescription>
                    {selectedTemplate.contract_type?.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                {selectedTemplate ? (
                  <div className="space-y-4">
                    {/* Informações do Template */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label className="font-medium">Versão</Label>
                        <p>{selectedTemplate.version}</p>
                      </div>
                      <div>
                        <Label className="font-medium">Categoria</Label>
                        <p>{selectedTemplate.contract_type?.category}</p>
                      </div>
                      <div>
                        <Label className="font-medium">Variáveis</Label>
                        <p>{selectedTemplate.variables.length} variáveis</p>
                      </div>
                      <div>
                        <Label className="font-medium">Cláusulas</Label>
                        <p>{clauses.length} cláusulas</p>
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </Button>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        Visualizar
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Exportar
                      </Button>
                    </div>

                    {/* Lista de Cláusulas */}
                    <div className="space-y-2">
                      <Label className="font-medium">Cláusulas</Label>
                      <div className="max-h-64 overflow-y-auto space-y-2">
                        {clauses.map((clause) => (
                          <div key={clause.id} className="p-2 border rounded text-sm">
                            <div className="font-medium">
                              Cláusula {clause.clause_number}ª - {clause.title}
                            </div>
                            <p className="text-gray-600 mt-1 line-clamp-2">
                              {clause.content.substring(0, 100)}...
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">Selecione um template para ver os detalhes</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Contratos Gerados Tab */}
        <TabsContent value="contracts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contratos Gerados</CardTitle>
              <CardDescription>
                Visualize e gerencie todos os contratos gerados no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {generatedContracts.map((contract) => (
                  <div key={contract.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{contract.contract_number}</h4>
                        {getStatusBadge(contract.status)}
                      </div>
                      <p className="text-sm text-gray-600">
                        {contract.template?.name} - {new Date(contract.created_at).toLocaleDateString('pt-BR')}
                      </p>
                      <p className="text-xs text-gray-500">
                        Cliente: {contract.contract_data.client_name}
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                      {contract.status === 'generated' && (
                        <Button size="sm">
                          <Send className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                
                {generatedContracts.length === 0 && (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">Nenhum contrato gerado ainda</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tipos de Contrato Tab */}
        <TabsContent value="types" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tipos de Contrato</CardTitle>
              <CardDescription>
                Gerencie os tipos de contratos disponíveis no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {contractTypes.map((type) => (
                  <Card key={type.id}>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{type.name}</h4>
                          <Badge variant={type.is_active ? "default" : "secondary"}>
                            {type.is_active ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{type.description}</p>
                        <p className="text-xs text-gray-500">Categoria: {type.category}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

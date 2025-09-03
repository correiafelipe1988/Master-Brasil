import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { DigitalSignatureService, SignatureRequest, Signer } from '@/services/digitalSignatureService';
import { PDFService } from '@/services/pdfService';
import { FileText, Send, Clock, CheckCircle, XCircle, Users, Mail, User } from 'lucide-react';
import BeSignSignature from './BeSignSignature';
import BeSignDocumentManager from './BeSignDocumentManager';

interface DigitalSignatureProps {
  rentalData: any;
  onSignatureRequested?: (signatureRequest: SignatureRequest) => void;
}

export const DigitalSignature: React.FC<DigitalSignatureProps> = ({ 
  rentalData, 
  onSignatureRequested 
}) => {
  const [activeTab, setActiveTab] = useState<'besign' | 'legacy'>('besign');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [signatureRequests, setSignatureRequests] = useState<SignatureRequest[]>([]);
  const [signers, setSigners] = useState<Signer[]>([
    {
      name: rentalData?.client_name || '',
      email: rentalData?.client_email || '',
      cpf: rentalData?.client_cpf || '',
      phone: rentalData?.client_phone || '',
      role: 'client'
    },
    {
      name: rentalData?.franchisee_name || 'Representante da Empresa',
      email: 'contrato@masterbrasil.com',
      cpf: '',
      phone: '',
      role: 'franchisee'
    }
  ]);
  const { toast } = useToast();

  useEffect(() => {
    if (rentalData?.id && activeTab === 'legacy') {
      loadSignatureRequests();
    }
  }, [rentalData?.id, activeTab]);

  const loadSignatureRequests = async () => {
    try {
      const requests = await DigitalSignatureService.getSignatureRequests(rentalData.id);
      setSignatureRequests(requests);
    } catch (error) {
      console.error('Erro ao carregar solicitações de assinatura:', error);
    }
  };

  const handleCreateSignatureRequest = async () => {
    setIsLoading(true);

    try {
      // Validar signatários
      const validSigners = signers.filter(signer =>
        signer.name && signer.email && signer.role
      );

      if (validSigners.length === 0) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Adicione pelo menos um signatário válido.",
        });
        return;
      }

      // Gerar contrato diretamente com os dados da locação
      console.log('📄 Gerando contrato para:', rentalData.client_name);
      
      const contractData = {
        // Dados do Cliente
        client_name: rentalData.client_name || 'Cliente',
        client_cpf: rentalData.client_cpf || '',
        client_email: rentalData.client_email || '',
        client_phone: rentalData.client_phone || '',
        client_address: rentalData.client_address || '',

        // Dados da Motocicleta
        motorcycle_model: rentalData.motorcycle_model || 'N/A',
        motorcycle_plate: rentalData.motorcycle_plate || '',
        motorcycle_year: rentalData.motorcycle_year || '',
        motorcycle_color: rentalData.motorcycle_color || '',

        // Dados do Franqueado
        franchisee_name: rentalData.franchisee_name || 'Master Brasil',
        franchisee_cnpj: rentalData.franchisee_cnpj || '',
        franchisee_address: rentalData.franchisee_address || '',
        franchisee_phone: rentalData.franchisee_phone || '',

        // Dados da Locação
        plan_name: rentalData.plan_name || 'Plano Padrão',
        plan_price: rentalData.plan_price || 0,
        start_date: rentalData.start_date || new Date().toISOString(),
        end_date: rentalData.end_date || '',
        km_inicial: rentalData.km_inicial || 0,
        km_final: rentalData.km_final || 0,
        deposit_value: rentalData.deposit_value || 0,
        observations: rentalData.observations || '',

        // Dados do Contrato
        contract_number: `CONT-${Date.now()}`,
        created_at: new Date().toISOString(),
      };

      const doc = PDFService.generateRentalContract(contractData);
      const pdfBlob = doc.output('blob');
      const fileName = `contrato_${contractData.contract_number}.pdf`;

      // Criar solicitação de assinatura
      const signatureRequest = await DigitalSignatureService.createSignatureRequest(
        pdfBlob,
        fileName,
        validSigners,
        contractData.contract_number,
        rentalData.id
      );

      toast({
        title: "Solicitação Criada",
        description: "Solicitação de assinatura enviada com sucesso!",
      });

      // Atualizar lista
      await loadSignatureRequests();
      
      // Callback para componente pai
      if (onSignatureRequested) {
        onSignatureRequested(signatureRequest);
      }

      setIsDialogOpen(false);

    } catch (error: any) {
      console.error('❌ [DigitalSignature] Erro ao criar solicitação de assinatura:', error);

      let errorMessage = "Não foi possível criar a solicitação de assinatura.";

      if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast({
        variant: "destructive",
        title: "Erro",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSignatureRequest = async (signatureRequestId: string) => {
    try {
      await DigitalSignatureService.cancelSignatureRequest(signatureRequestId);
      toast({
        title: "Solicitação Cancelada",
        description: "A solicitação de assinatura foi cancelada.",
      });
      await loadSignatureRequests();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível cancelar a solicitação.",
      });
    }
  };

  const updateSigner = (index: number, field: keyof Signer, value: string) => {
    setSigners(prev => prev.map((signer, i) => 
      i === index ? { ...signer, [field]: value } : signer
    ));
  };

  const addSigner = () => {
    setSigners(prev => [...prev, {
      name: '',
      email: '',
      cpf: '',
      phone: '',
      role: 'witness'
    }]);
  };

  const removeSigner = (index: number) => {
    setSigners(prev => prev.filter((_, i) => i !== index));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
      case 'signed':
        return <Badge variant="default" className="text-green-600"><CheckCircle className="w-3 h-3 mr-1" />Assinado</Badge>;
      case 'cancelled':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Cancelado</Badge>;
      case 'expired':
        return <Badge variant="secondary"><XCircle className="w-3 h-3 mr-1" />Expirado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'client':
        return 'Cliente';
      case 'franchisee':
        return 'Franqueado';
      case 'witness':
        return 'Testemunha';
      default:
        return role;
    }
  };

  const generateContractForBeSign = async () => {
    const contractData = {
      client_name: rentalData.client_name || 'Cliente',
      client_cpf: rentalData.client_cpf || '',
      client_email: rentalData.client_email || '',
      client_phone: rentalData.client_phone || '',
      client_address: rentalData.client_address || '',
      motorcycle_model: rentalData.motorcycle_model || 'N/A',
      motorcycle_plate: rentalData.motorcycle_plate || '',
      motorcycle_year: rentalData.motorcycle_year || '',
      motorcycle_color: rentalData.motorcycle_color || '',
      franchisee_name: rentalData.franchisee_name || 'Master Brasil',
      franchisee_cnpj: rentalData.franchisee_cnpj || '',
      franchisee_address: rentalData.franchisee_address || '',
      franchisee_phone: rentalData.franchisee_phone || '',
      plan_name: rentalData.plan_name || 'Plano Padrão',
      plan_price: rentalData.plan_price || 0,
      start_date: rentalData.start_date || new Date().toISOString(),
      end_date: rentalData.end_date || '',
      km_inicial: rentalData.km_inicial || 0,
      km_final: rentalData.km_final || 0,
      deposit_value: rentalData.deposit_value || 0,
      observations: rentalData.observations || '',
      contract_number: `CONT-${Date.now()}`,
      created_at: new Date().toISOString(),
    };

    const doc = PDFService.generateRentalContract(contractData);
    const pdfBlob = doc.output('blob');
    const fileName = `contrato_${contractData.contract_number}.pdf`;

    return { pdfBlob, fileName, contractNumber: contractData.contract_number };
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          <h3 className="text-lg font-semibold">Assinatura Eletrônica</h3>
        </div>
        
        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <Button
            variant={activeTab === 'besign' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('besign')}
            className="text-sm"
          >
            BeSign v2
          </Button>
          <Button
            variant={activeTab === 'legacy' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('legacy')}
            className="text-sm"
          >
            Sistema Legacy
          </Button>
        </div>
      </div>

      {/* BeSign v2 Tab */}
      {activeTab === 'besign' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">BeSign v2 - Assinatura Eletrônica</CardTitle>
              <CardDescription>
                Sistema integrado com BeSign v2 API para assinatura eletrônica de documentos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BeSignSignature
                documentName={`Contrato de Locação - ${rentalData?.client_name || 'Cliente'}`}
                contractNumber={`CONT-${Date.now()}`}
                rentalId={rentalData?.id}
                onSignatureRequest={(request) => {
                  toast({
                    title: "Documento Enviado",
                    description: "Documento enviado para assinatura via BeSign!",
                  });
                  if (onSignatureRequested) {
                    onSignatureRequested(request);
                  }
                }}
              />
            </CardContent>
          </Card>

          <BeSignDocumentManager
            rentalId={rentalData?.id}
            onDocumentUpdate={(document) => {
              toast({
                title: "Documento Atualizado",
                description: `Status do documento "${document.nome}" foi alterado`,
              });
            }}
          />
        </div>
      )}

      {/* Legacy Tab */}
      {activeTab === 'legacy' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  Nova Solicitação (Legacy)
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Criar Solicitação de Assinatura</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-6">
                  {/* Informações do Documento */}
                  <div className="space-y-2">
                    <h4 className="font-medium">Documento</h4>
                    <p className="text-sm text-gray-600">
                      Contrato de Locação - {rentalData?.client_name}
                    </p>
                  </div>

                  {/* Signatários */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Signatários</h4>
                      <Button variant="outline" size="sm" onClick={addSigner}>
                        <Users className="w-4 h-4 mr-2" />
                        Adicionar
                      </Button>
                    </div>
                    
                    {signers.map((signer, index) => (
                      <Card key={index} className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor={`name-${index}`}>Nome</Label>
                            <Input
                              id={`name-${index}`}
                              value={signer.name}
                              onChange={(e) => updateSigner(index, 'name', e.target.value)}
                              placeholder="Nome completo"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor={`email-${index}`}>Email</Label>
                            <Input
                              id={`email-${index}`}
                              type="email"
                              value={signer.email}
                              onChange={(e) => updateSigner(index, 'email', e.target.value)}
                              placeholder="email@exemplo.com"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor={`cpf-${index}`}>CPF</Label>
                            <Input
                              id={`cpf-${index}`}
                              value={signer.cpf}
                              onChange={(e) => updateSigner(index, 'cpf', e.target.value)}
                              placeholder="000.000.000-00"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor={`phone-${index}`}>Telefone</Label>
                            <Input
                              id={`phone-${index}`}
                              value={signer.phone}
                              onChange={(e) => updateSigner(index, 'phone', e.target.value)}
                              placeholder="(11) 99999-9999"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor={`role-${index}`}>Função</Label>
                            <select
                              id={`role-${index}`}
                              value={signer.role}
                              onChange={(e) => updateSigner(index, 'role', e.target.value as any)}
                              className="w-full p-2 border rounded-md"
                            >
                              <option value="client">Cliente</option>
                              <option value="franchisee">Franqueado</option>
                              <option value="witness">Testemunha</option>
                            </select>
                          </div>
                          
                          <div className="flex items-end">
                            {signers.length > 1 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeSigner(index)}
                                className="text-red-600"
                              >
                                Remover
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>

                  {/* Ações */}
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleCreateSignatureRequest}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Criando...' : 'Enviar para Assinatura'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Lista de Solicitações Legacy */}
          <div className="space-y-3">
            {signatureRequests.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">Nenhuma solicitação de assinatura encontrada</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Crie uma nova solicitação para enviar o contrato para assinatura
                  </p>
                </CardContent>
              </Card>
            ) : (
              signatureRequests.map((request) => (
                <Card key={request.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{request.document_name}</CardTitle>
                      {getStatusBadge(request.status)}
                    </div>
                    <CardDescription>
                      Criado em {new Date(request.created_at).toLocaleDateString('pt-BR')}
                      {request.expires_at && (
                        <> • Expira em {new Date(request.expires_at).toLocaleDateString('pt-BR')}</>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <h5 className="font-medium mb-2">Signatários:</h5>
                        <div className="space-y-2">
                          {request.signers.map((signer, index) => (
                            <div key={index} className="flex items-center gap-3 text-sm">
                              <User className="w-4 h-4 text-gray-400" />
                              <span className="font-medium">{signer.name}</span>
                              <span className="text-gray-600">({getRoleLabel(signer.role)})</span>
                              <Mail className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-600">{signer.email}</span>
                              {signer.signed_at && (
                                <Badge variant="default" className="text-xs">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Assinado
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {request.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelSignatureRequest(request.id)}
                          >
                            Cancelar Solicitação
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
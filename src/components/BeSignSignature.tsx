import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, FileText, Send, Clock, CheckCircle, XCircle } from 'lucide-react';
import { BeSignService, BeSignSignatario } from '@/services/beSignService';
import { DigitalSignatureService } from '@/services/digitalSignatureService';
import { toast } from 'sonner';

interface Signatario {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  cpf?: string;
  data_nascimento?: string;
  papel: BeSignSignatario['dados_assinatura']['papel'];
  tipo_documento: BeSignSignatario['dados_assinatura']['tipo_documento'];
}

interface BeSignSignatureProps {
  documentFile?: File;
  documentBlob?: Blob;
  documentName: string;
  contractNumber: string;
  rentalId?: string;
  onSignatureRequest?: (signatureRequest: any) => void;
}

export const BeSignSignature: React.FC<BeSignSignatureProps> = ({
  documentFile,
  documentBlob,
  documentName,
  contractNumber,
  rentalId,
  onSignatureRequest
}) => {
  const [signatarios, setSignatarios] = useState<Signatario[]>([
    {
      id: '1',
      nome: '',
      email: '',
      telefone: '',
      cpf: '',
      data_nascimento: '',
      papel: 'Contratante',
      tipo_documento: 'CPF'
    }
  ]);

  const [loading, setLoading] = useState(false);
  const [documentStatus, setDocumentStatus] = useState<'draft' | 'sent' | 'signed' | 'cancelled'>('draft');

  const papelOptions: Array<{ value: BeSignSignatario['dados_assinatura']['papel']; label: string }> = [
    { value: 'Contratante', label: 'Contratante' },
    { value: 'Contratada', label: 'Contratada' },
    { value: 'Testemunha', label: 'Testemunha' },
    { value: 'Avalista', label: 'Avalista' },
    { value: 'Representante Legal', label: 'Representante Legal' },
    { value: 'Procurador', label: 'Procurador' },
    { value: 'Parte', label: 'Parte' }
  ];

  const tipoDocumentoOptions: Array<{ value: BeSignSignatario['dados_assinatura']['tipo_documento']; label: string }> = [
    { value: 'CPF', label: 'CPF' },
    { value: 'RG', label: 'RG' },
    { value: 'CNH', label: 'CNH' },
    { value: 'Outros', label: 'Outros' }
  ];

  const adicionarSignatario = () => {
    const novoId = (signatarios.length + 1).toString();
    setSignatarios([...signatarios, {
      id: novoId,
      nome: '',
      email: '',
      telefone: '',
      cpf: '',
      data_nascimento: '',
      papel: 'Parte',
      tipo_documento: 'CPF'
    }]);
  };

  const removerSignatario = (id: string) => {
    if (signatarios.length > 1) {
      setSignatarios(signatarios.filter(s => s.id !== id));
    }
  };

  const atualizarSignatario = (id: string, campo: keyof Signatario, valor: string) => {
    setSignatarios(signatarios.map(s => 
      s.id === id ? { ...s, [campo]: valor } : s
    ));
  };

  const validarFormulario = (): boolean => {
    for (const signatario of signatarios) {
      if (!signatario.nome.trim()) {
        toast.error(`Nome é obrigatório para todos os signatários`);
        return false;
      }
      if (!signatario.email.trim()) {
        toast.error(`Email é obrigatório para todos os signatários`);
        return false;
      }
      if (!signatario.email.includes('@')) {
        toast.error(`Email inválido: ${signatario.email}`);
        return false;
      }
    }

    if (!documentFile && !documentBlob) {
      toast.error('Documento é obrigatório');
      return false;
    }

    return true;
  };

  const enviarParaAssinatura = async () => {
    if (!validarFormulario()) return;

    setLoading(true);
    try {
      toast.info('Enviando documento para assinatura...');

      // Converter File ou Blob para os signers do DigitalSignatureService
      const signers = signatarios.map(s => ({
        name: s.nome,
        email: s.email,
        cpf: s.cpf,
        phone: s.telefone,
        role: mapPapelToRole(s.papel) as 'client' | 'franchisee' | 'witness'
      }));

      // Usar o documento (File ou Blob)
      const document = documentFile || documentBlob;
      if (!document) {
        throw new Error('Documento não encontrado');
      }

      const signatureRequest = await DigitalSignatureService.createSignatureRequest(
        document,
        documentName,
        signers,
        contractNumber,
        rentalId
      );

      setDocumentStatus('sent');
      toast.success('Documento enviado para assinatura com sucesso!');
      
      if (onSignatureRequest) {
        onSignatureRequest(signatureRequest);
      }

    } catch (error) {
      console.error('Erro ao enviar para assinatura:', error);
      toast.error(`Erro ao enviar documento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  const mapPapelToRole = (papel: BeSignSignatario['dados_assinatura']['papel']): string => {
    switch (papel) {
      case 'Contratante':
        return 'client';
      case 'Contratada':
        return 'franchisee';
      case 'Testemunha':
        return 'witness';
      default:
        return 'client';
    }
  };

  const getStatusIcon = () => {
    switch (documentStatus) {
      case 'draft':
        return <FileText className="h-4 w-4 text-gray-500" />;
      case 'sent':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'signed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    switch (documentStatus) {
      case 'draft':
        return 'Rascunho';
      case 'sent':
        return 'Enviado para Assinatura';
      case 'signed':
        return 'Assinado';
      case 'cancelled':
        return 'Cancelado';
      default:
        return 'Rascunho';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon()}
            Assinatura Eletrônica - BeSign
          </CardTitle>
          <CardDescription>
            Configure os signatários e envie o documento para assinatura eletrônica
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">{documentName}</p>
                <p className="text-sm text-gray-600">Contrato: {contractNumber}</p>
                {rentalId && <p className="text-sm text-gray-600">Locação: {rentalId}</p>}
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon()}
                <span className="text-sm font-medium">{getStatusText()}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Signatários</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={adicionarSignatario}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Adicionar Signatário
              </Button>
            </div>

            {signatarios.map((signatario, index) => (
              <Card key={signatario.id} className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium">Signatário {index + 1}</h4>
                  {signatarios.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removerSignatario(signatario.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`nome-${signatario.id}`}>Nome Completo *</Label>
                    <Input
                      id={`nome-${signatario.id}`}
                      value={signatario.nome}
                      onChange={(e) => atualizarSignatario(signatario.id, 'nome', e.target.value)}
                      placeholder="Nome completo do signatário"
                    />
                  </div>

                  <div>
                    <Label htmlFor={`email-${signatario.id}`}>Email *</Label>
                    <Input
                      id={`email-${signatario.id}`}
                      type="email"
                      value={signatario.email}
                      onChange={(e) => atualizarSignatario(signatario.id, 'email', e.target.value)}
                      placeholder="email@exemplo.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor={`telefone-${signatario.id}`}>Telefone</Label>
                    <Input
                      id={`telefone-${signatario.id}`}
                      value={signatario.telefone}
                      onChange={(e) => atualizarSignatario(signatario.id, 'telefone', e.target.value)}
                      placeholder="(11) 99999-9999"
                    />
                  </div>

                  <div>
                    <Label htmlFor={`papel-${signatario.id}`}>Papel no Contrato</Label>
                    <Select
                      value={signatario.papel}
                      onValueChange={(value) => atualizarSignatario(signatario.id, 'papel', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o papel" />
                      </SelectTrigger>
                      <SelectContent>
                        {papelOptions.map((opcao) => (
                          <SelectItem key={opcao.value} value={opcao.value}>
                            {opcao.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor={`tipo_documento-${signatario.id}`}>Tipo de Documento</Label>
                    <Select
                      value={signatario.tipo_documento}
                      onValueChange={(value) => atualizarSignatario(signatario.id, 'tipo_documento', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {tipoDocumentoOptions.map((opcao) => (
                          <SelectItem key={opcao.value} value={opcao.value}>
                            {opcao.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor={`cpf-${signatario.id}`}>
                      {signatario.tipo_documento === 'CPF' ? 'CPF' : 'Número do Documento'}
                    </Label>
                    <Input
                      id={`cpf-${signatario.id}`}
                      value={signatario.cpf}
                      onChange={(e) => atualizarSignatario(signatario.id, 'cpf', e.target.value)}
                      placeholder={
                        signatario.tipo_documento === 'CPF' 
                          ? '000.000.000-00' 
                          : 'Número do documento'
                      }
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="flex gap-4 pt-6">
            <Button
              onClick={enviarParaAssinatura}
              disabled={loading || documentStatus !== 'draft'}
              className="flex-1 flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              {loading ? 'Enviando...' : 'Enviar para Assinatura'}
            </Button>

            {documentStatus === 'sent' && (
              <Button
                variant="outline"
                onClick={() => {
                  toast.info('Funcionalidade de cancelamento será implementada');
                }}
                className="flex items-center gap-2"
              >
                <XCircle className="h-4 w-4" />
                Cancelar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BeSignSignature;
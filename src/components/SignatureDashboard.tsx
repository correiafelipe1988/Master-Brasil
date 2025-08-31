import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { DigitalSignatureService, SignatureRequest } from '@/services/digitalSignatureService';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Users, 
  TrendingUp, 
  AlertTriangle,
  RefreshCw,
  Calendar,
  Mail
} from 'lucide-react';

interface SignatureDashboardProps {
  rentalId?: string;
  showAllRequests?: boolean;
}

export const SignatureDashboard: React.FC<SignatureDashboardProps> = ({ 
  rentalId, 
  showAllRequests = false 
}) => {
  const [signatureRequests, setSignatureRequests] = useState<SignatureRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    signed: 0,
    cancelled: 0,
    expired: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    loadSignatureRequests();
  }, [rentalId, showAllRequests]);

  const loadSignatureRequests = async () => {
    setIsLoading(true);
    try {
      const requests = await DigitalSignatureService.getSignatureRequests(
        showAllRequests ? undefined : rentalId
      );
      
      setSignatureRequests(requests);
      calculateStats(requests);
    } catch (error) {
      console.error('Erro ao carregar solicitações:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar as solicitações de assinatura.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (requests: SignatureRequest[]) => {
    const stats = {
      total: requests.length,
      pending: requests.filter(r => r.status === 'pending').length,
      signed: requests.filter(r => r.status === 'signed').length,
      cancelled: requests.filter(r => r.status === 'cancelled').length,
      expired: requests.filter(r => r.status === 'expired').length
    };
    setStats(stats);
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'signed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'expired':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      default:
        return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSigningProgress = (signers: any[]) => {
    const signedCount = signers.filter(s => s.signed_at).length;
    return (signedCount / signers.length) * 100;
  };

  const handleCancelRequest = async (requestId: string) => {
    try {
      await DigitalSignatureService.cancelSignatureRequest(requestId);
      toast({
        title: "Solicitação Cancelada",
        description: "A solicitação foi cancelada com sucesso.",
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

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Carregando solicitações...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          <h3 className="text-lg font-semibold">
            {showAllRequests ? 'Dashboard de Assinaturas' : 'Assinaturas da Locação'}
          </h3>
        </div>
        <Button variant="outline" size="sm" onClick={loadSignatureRequests}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Estatísticas */}
      {showAllRequests && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-gray-600">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                  <p className="text-xs text-gray-600">Pendentes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.signed}</p>
                  <p className="text-xs text-gray-600">Assinados</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.cancelled}</p>
                  <p className="text-xs text-gray-600">Cancelados</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.expired}</p>
                  <p className="text-xs text-gray-600">Expirados</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lista de Solicitações */}
      <div className="space-y-4">
        {signatureRequests.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h4 className="text-lg font-medium text-gray-600 mb-2">
                Nenhuma solicitação encontrada
              </h4>
              <p className="text-sm text-gray-500">
                {showAllRequests 
                  ? 'Não há solicitações de assinatura no sistema'
                  : 'Esta locação ainda não possui solicitações de assinatura'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          signatureRequests.map((request) => (
            <Card key={request.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(request.status)}
                    <div>
                      <CardTitle className="text-base">{request.document_name}</CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(request.created_at)}
                        </span>
                        {request.expires_at && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Expira: {formatDate(request.expires_at)}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  {getStatusBadge(request.status)}
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="space-y-4">
                  {/* Progresso de Assinatura */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Progresso das Assinaturas</span>
                      <span className="text-sm text-gray-600">
                        {request.signers.filter(s => s.signed_at).length} de {request.signers.length}
                      </span>
                    </div>
                    <Progress value={getSigningProgress(request.signers)} className="h-2" />
                  </div>

                  {/* Lista de Signatários */}
                  <div>
                    <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Signatários
                    </h5>
                    <div className="space-y-2">
                      {request.signers.map((signer, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-xs font-medium text-blue-600">
                                {signer.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium">{signer.name}</p>
                              <p className="text-xs text-gray-600 flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {signer.email}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            {signer.signed_at ? (
                              <div>
                                <Badge variant="default" className="text-xs mb-1">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Assinado
                                </Badge>
                                <p className="text-xs text-gray-500">
                                  {formatDate(signer.signed_at)}
                                </p>
                              </div>
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                <Clock className="w-3 h-3 mr-1" />
                                Pendente
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Ações */}
                  {request.status === 'pending' && (
                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancelRequest(request.id)}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Cancelar
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
  );
};

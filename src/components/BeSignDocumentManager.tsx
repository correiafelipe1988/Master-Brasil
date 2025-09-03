import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Download, 
  Eye, 
  Archive, 
  RotateCcw, 
  Trash2, 
  FileCheck, 
  Clock, 
  AlertCircle,
  Search,
  Filter,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { BeSignService, BeSignDocument } from '@/services/beSignService';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface BeSignDocumentManagerProps {
  rentalId?: string;
  onDocumentUpdate?: (document: BeSignDocument) => void;
}

export const BeSignDocumentManager: React.FC<BeSignDocumentManagerProps> = ({
  rentalId,
  onDocumentUpdate
}) => {
  const [documents, setDocuments] = useState<BeSignDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('TODOS');
  const [selectedDocument, setSelectedDocument] = useState<BeSignDocument | null>(null);
  const [actionType, setActionType] = useState<'archive' | 'unarchive' | 'cancel' | 'delete' | null>(null);

  useEffect(() => {
    carregarDocumentos();
  }, [rentalId]);

  const carregarDocumentos = async () => {
    setLoading(true);
    try {
      const response = await BeSignService.buscarDocumentos();
      let docs = response.content || [];
      
      // Filtrar por rental_id se fornecido
      if (rentalId) {
        docs = docs.filter(doc => doc.identificador?.includes(rentalId));
      }
      
      setDocuments(docs);
    } catch (error) {
      console.error('Erro ao carregar documentos:', error);
      toast.error('Erro ao carregar documentos');
      // Mock data para demonstração
      setDocuments([
        {
          identificador: 'doc_001',
          nome: 'Contrato de Locação - João Silva',
          data_inicio_vigencia: '01-01-2024',
          data_fim_vigencia: '31-12-2024',
          data_inicio_assinatura: '01-01-2024',
          data_fim_assinatura: '08-01-2024',
          status: 'PENDENTE'
        },
        {
          identificador: 'doc_002',
          nome: 'Contrato de Locação - Maria Santos',
          data_inicio_vigencia: '15-01-2024',
          data_fim_vigencia: '14-01-2025',
          data_inicio_assinatura: '15-01-2024',
          data_fim_assinatura: '22-01-2024',
          status: 'ASSINADO'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.identificador.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'TODOS' || doc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: BeSignDocument['status']) => {
    switch (status) {
      case 'PENDENTE':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'ASSINADO':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'FORMALIZADO':
        return <FileCheck className="h-4 w-4 text-blue-500" />;
      case 'CANCELADO':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'EXPIRADO':
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: BeSignDocument['status']) => {
    const variants = {
      PENDENTE: 'default',
      ASSINADO: 'default',
      FORMALIZADO: 'default', 
      CANCELADO: 'destructive',
      EXPIRADO: 'secondary'
    } as const;

    const colors = {
      PENDENTE: 'bg-yellow-100 text-yellow-800',
      ASSINADO: 'bg-green-100 text-green-800',
      FORMALIZADO: 'bg-blue-100 text-blue-800',
      CANCELADO: 'bg-red-100 text-red-800',
      EXPIRADO: 'bg-gray-100 text-gray-800'
    } as const;

    return (
      <Badge variant={variants[status]} className={colors[status]}>
        <span className="flex items-center gap-1">
          {getStatusIcon(status)}
          {status}
        </span>
      </Badge>
    );
  };

  const handleAction = async () => {
    if (!selectedDocument || !actionType) return;

    setLoading(true);
    try {
      switch (actionType) {
        case 'archive':
          await BeSignService.arquivarDocumento(selectedDocument.identificador);
          toast.success('Documento arquivado com sucesso');
          break;
        case 'unarchive':
          await BeSignService.desarquivarDocumento(selectedDocument.identificador);
          toast.success('Documento desarquivado com sucesso');
          break;
        case 'cancel':
          await BeSignService.cancelarDocumento(selectedDocument.identificador);
          toast.success('Documento cancelado com sucesso');
          break;
        case 'delete':
          await BeSignService.removerDocumento(selectedDocument.identificador);
          toast.success('Documento removido com sucesso');
          break;
      }
      
      await carregarDocumentos();
      if (onDocumentUpdate) {
        onDocumentUpdate(selectedDocument);
      }
    } catch (error) {
      console.error(`Erro ao ${actionType} documento:`, error);
      toast.error(`Erro ao ${actionType === 'delete' ? 'remover' : actionType} documento`);
    } finally {
      setLoading(false);
      setSelectedDocument(null);
      setActionType(null);
    }
  };

  const downloadDocument = async (documento: BeSignDocument, tipo: 'completo' | 'assinado' | 'impressao') => {
    try {
      let blob: Blob;
      let filename: string;

      switch (tipo) {
        case 'completo':
          blob = await BeSignService.downloadDocumento(documento.identificador);
          filename = `${documento.nome}-completo.zip`;
          break;
        case 'assinado':
          blob = await BeSignService.downloadDocumentoAssinado(documento.identificador);
          filename = `${documento.nome}-assinado.pdf`;
          break;
        case 'impressao':
          blob = await BeSignService.downloadDocumentoImpressao(documento.identificador);
          filename = `${documento.nome}-impressao.pdf`;
          break;
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Download iniciado');
    } catch (error) {
      console.error('Erro no download:', error);
      toast.error('Erro ao fazer download do documento');
    }
  };

  const formalizarDocumento = async (documento: BeSignDocument) => {
    try {
      setLoading(true);
      await BeSignService.formalizarDocumento(documento.identificador);
      toast.success('Documento formalizado com sucesso');
      await carregarDocumentos();
    } catch (error) {
      console.error('Erro ao formalizar documento:', error);
      toast.error('Erro ao formalizar documento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gerenciamento de Documentos BeSign</CardTitle>
          <CardDescription>
            Gerencie documentos enviados para assinatura eletrônica
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar documentos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos</SelectItem>
                  <SelectItem value="PENDENTE">Pendente</SelectItem>
                  <SelectItem value="ASSINADO">Assinado</SelectItem>
                  <SelectItem value="FORMALIZADO">Formalizado</SelectItem>
                  <SelectItem value="CANCELADO">Cancelado</SelectItem>
                  <SelectItem value="EXPIRADO">Expirado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={carregarDocumentos} disabled={loading}>
              <Filter className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>

          {/* Tabela de Documentos */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Documento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Vigência</TableHead>
                  <TableHead>Prazo Assinatura</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6">
                      Carregando documentos...
                    </TableCell>
                  </TableRow>
                ) : filteredDocuments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6">
                      Nenhum documento encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDocuments.map((documento) => (
                    <TableRow key={documento.identificador}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{documento.nome}</p>
                          <p className="text-sm text-gray-500">{documento.identificador}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(documento.status)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>Início: {documento.data_inicio_vigencia}</p>
                          {documento.data_fim_vigencia && (
                            <p>Fim: {documento.data_fim_vigencia}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>Início: {documento.data_inicio_assinatura}</p>
                          <p>Fim: {documento.data_fim_assinatura}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {/* Download Buttons */}
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadDocument(documento, 'completo')}
                              title="Download Completo (.zip)"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            
                            {documento.status === 'ASSINADO' || documento.status === 'FORMALIZADO' ? (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => downloadDocument(documento, 'assinado')}
                                  title="Download Assinado (.pdf)"
                                >
                                  <FileCheck className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => downloadDocument(documento, 'impressao')}
                                  title="Download para Impressão (.pdf)"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </>
                            ) : null}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-1">
                            {documento.status === 'ASSINADO' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => formalizarDocumento(documento)}
                                disabled={loading}
                                title="Formalizar Documento"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedDocument(documento);
                                setActionType('archive');
                              }}
                              title="Arquivar"
                            >
                              <Archive className="h-4 w-4" />
                            </Button>
                            
                            {documento.status === 'PENDENTE' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedDocument(documento);
                                  setActionType('cancel');
                                }}
                                title="Cancelar"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            )}
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedDocument(documento);
                                setActionType('delete');
                              }}
                              title="Remover"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Alert Dialog para Confirmação */}
      <AlertDialog open={!!selectedDocument && !!actionType} onOpenChange={() => {
        setSelectedDocument(null);
        setActionType(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === 'delete' ? 'Confirmar Remoção' : 
               actionType === 'cancel' ? 'Confirmar Cancelamento' :
               actionType === 'archive' ? 'Confirmar Arquivamento' :
               'Confirmar Desarquivamento'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === 'delete' ? 
                `Tem certeza que deseja remover o documento "${selectedDocument?.nome}"? Esta ação não pode ser desfeita.` :
               actionType === 'cancel' ?
                `Tem certeza que deseja cancelar o documento "${selectedDocument?.nome}"?` :
               actionType === 'archive' ?
                `Tem certeza que deseja arquivar o documento "${selectedDocument?.nome}"?` :
                `Tem certeza que deseja desarquivar o documento "${selectedDocument?.nome}"?`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleAction} disabled={loading}>
              {loading ? 'Processando...' : 'Confirmar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BeSignDocumentManager;
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, File, X, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DocumentUploadProps {
  label: string;
  currentUrl?: string;
  onUploadComplete: (url: string) => void;
  onRemove: () => void;
  accept?: string;
  maxSize?: number; // em MB
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  label,
  currentUrl,
  onUploadComplete,
  onRemove,
  accept = "image/*,application/pdf",
  maxSize = 10
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    // Validar tamanho do arquivo
    if (file.size > maxSize * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "Arquivo muito grande",
        description: `O arquivo deve ter no máximo ${maxSize}MB.`,
      });
      return;
    }

    // Validar tipo do arquivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        variant: "destructive",
        title: "Tipo de arquivo não permitido",
        description: "Apenas imagens (JPEG, PNG, WebP) e PDFs são permitidos.",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `documents/${fileName}`;

      // Upload do arquivo
      const { error: uploadError } = await supabase.storage
        .from('client-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Obter URL pública (mesmo sendo bucket privado, precisamos da URL para referência)
      const { data: { publicUrl } } = supabase.storage
        .from('client-documents')
        .getPublicUrl(filePath);

      onUploadComplete(filePath); // Salvar o path, não a URL pública

      toast({
        title: "Sucesso",
        description: "Documento enviado com sucesso.",
      });
    } catch (error: any) {
      console.error('Erro no upload:', error);
      toast({
        variant: "destructive",
        title: "Erro no upload",
        description: error.message || "Não foi possível enviar o documento.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const viewDocument = async () => {
    if (!currentUrl) return;

    try {
      // Obter URL assinada para visualização
      const { data, error } = await supabase.storage
        .from('client-documents')
        .createSignedUrl(currentUrl, 3600); // 1 hora

      if (error) throw error;

      // Abrir em nova aba
      window.open(data.signedUrl, '_blank');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível visualizar o documento.",
      });
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      
      {currentUrl ? (
        <div className="flex items-center space-x-2 p-3 border rounded-lg bg-gray-50">
          <File className="w-5 h-5 text-blue-600" />
          <span className="flex-1 text-sm text-gray-700">Documento enviado</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={viewDocument}
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRemove}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragOver 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
        >
          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600 mb-2">
            Arraste e solte o arquivo aqui ou clique para selecionar
          </p>
          <p className="text-xs text-gray-500 mb-4">
            Formatos aceitos: JPEG, PNG, WebP, PDF (máx. {maxSize}MB)
          </p>
          <Input
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            disabled={isUploading}
            className="hidden"
            id={`file-${label.replace(/\s+/g, '-').toLowerCase()}`}
          />
          <Button
            type="button"
            variant="outline"
            disabled={isUploading}
            onClick={() => {
              const input = document.getElementById(`file-${label.replace(/\s+/g, '-').toLowerCase()}`) as HTMLInputElement;
              input?.click();
            }}
          >
            {isUploading ? 'Enviando...' : 'Selecionar Arquivo'}
          </Button>
        </div>
      )}
    </div>
  );
};

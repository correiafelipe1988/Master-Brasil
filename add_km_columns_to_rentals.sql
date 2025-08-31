-- Adicionar colunas de quilometragem na tabela rentals
ALTER TABLE rentals 
ADD COLUMN km_inicial INTEGER DEFAULT 0,
ADD COLUMN km_final INTEGER DEFAULT 0;

-- Adicionar comentários para documentar as colunas
COMMENT ON COLUMN rentals.km_inicial IS 'Quilometragem inicial da motocicleta no momento da locação';
COMMENT ON COLUMN rentals.km_final IS 'Quilometragem final da motocicleta no momento da devolução';

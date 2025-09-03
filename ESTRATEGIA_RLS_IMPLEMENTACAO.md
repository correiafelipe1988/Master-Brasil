# 🔐 ESTRATÉGIA DE IMPLEMENTAÇÃO RLS - GRADUAL E SEGURA

## 📊 ANÁLISE ATUAL DO SISTEMA

### **Status RLS por Tabela:**
- ✅ **COM RLS**: `deals`, `franchisees`, `leads`, `motorcycles`
- ❌ **SEM RLS**: `app_users`, `cities`, `clients`, `contract_clauses`, `contract_templates`, `contract_types`, `generated_contracts`, `rental_plans`, `rentals`, `vendas`

### **Problemas Identificados:**
1. **Políticas Conflitantes**: Algumas tabelas têm múltiplas políticas que podem se sobrepor
2. **Políticas Temporárias**: Existem políticas "temp_" muito permissivas
3. **Inconsistências**: Diferentes padrões de verificação de roles
4. **Tabelas Críticas sem RLS**: `rentals` (locações) não tem RLS habilitado

---

## 🎯 ESTRATÉGIA DE IMPLEMENTAÇÃO

### **Fase 1: Preparação e Backup**
1. **Backup das Políticas Atuais**
2. **Documentação do Estado Atual**
3. **Criação de Scripts de Rollback**

### **Fase 2: Implementação Gradual por Prioridade**

#### **🔴 CRÍTICO - Tabelas Principais (Semana 1)**
1. **`rentals`** - Locações (mais crítica)
2. **`rental_plans`** - Planos de locação

#### **🟡 IMPORTANTE - Tabelas de Negócio (Semana 2)**
3. **`vendas`** - Vendas
4. **`clients`** - Clientes

#### **🟢 AUXILIARES - Tabelas de Suporte (Semana 3)**
5. **`cities`** - Cidades
6. **`contract_*`** - Contratos
7. **`generated_contracts`** - Contratos gerados

#### **🔵 SISTEMA - Tabelas de Sistema (Semana 4)**
8. **`app_users`** - Usuários (mais delicada)

---

## 📋 PLANO DETALHADO POR TABELA

### **1. TABELA `rentals` (PRIORIDADE MÁXIMA)**

#### **Situação Atual:**
- ❌ RLS: Desabilitado
- ❌ Políticas: Existem mas não funcionam (RLS off)
- ⚠️ Risco: Franqueados podem ver locações de outros

#### **Implementação:**
```sql
-- 1. Habilitar RLS
ALTER TABLE rentals ENABLE ROW LEVEL SECURITY;

-- 2. Manter políticas existentes (já estão corretas)
-- As políticas já existem e estão bem definidas:
-- - admin_manage_all_rentals
-- - franchisee_manage_own_rentals_only
-- - regional_manage_city_rentals
```

#### **Teste:**
- Verificar se franqueados veem apenas suas locações
- Verificar se regionais veem locações da cidade
- Verificar se admins veem todas

---

### **2. TABELA `rental_plans` (PRIORIDADE ALTA)**

#### **Situação Atual:**
- ❌ RLS: Desabilitado
- ✅ Política: Existe uma política para franqueados

#### **Implementação:**
```sql
-- 1. Habilitar RLS
ALTER TABLE rental_plans ENABLE ROW LEVEL SECURITY;

-- 2. Adicionar políticas faltantes
CREATE POLICY "admin_manage_all_rental_plans" ON rental_plans
FOR ALL TO public
USING (
  EXISTS (
    SELECT 1 FROM app_users
    WHERE id = auth.uid()
    AND role IN ('admin', 'master_br')
  )
);

CREATE POLICY "regional_manage_city_rental_plans" ON rental_plans
FOR ALL TO public
USING (
  EXISTS (
    SELECT 1 FROM app_users
    WHERE id = auth.uid()
    AND role = 'regional'
    AND city_id = rental_plans.city_id
  )
);

CREATE POLICY "global_plans_read" ON rental_plans
FOR SELECT TO public
USING (city_id IS NULL);
```

---

### **3. TABELA `cities` (PRIORIDADE MÉDIA)**

#### **Situação Atual:**
- ❌ RLS: Desabilitado
- ✅ Políticas: Existem mas não funcionam

#### **Implementação:**
```sql
-- 1. Habilitar RLS
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;

-- 2. As políticas já existem e estão corretas
-- Apenas habilitar RLS ativará as políticas existentes
```

---

## 🔧 SCRIPTS DE IMPLEMENTAÇÃO

### **Script 1: Backup e Preparação**
```sql
-- Criar tabela de backup das políticas
CREATE TABLE IF NOT EXISTS rls_backup_policies AS
SELECT * FROM pg_policies WHERE schemaname = 'public';

-- Criar tabela de backup do status RLS
CREATE TABLE IF NOT EXISTS rls_backup_status AS
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

### **Script 2: Implementação Fase 1 - Rentals**
```sql
-- FASE 1: RENTALS (MAIS CRÍTICA)
BEGIN;

-- Habilitar RLS na tabela rentals
ALTER TABLE rentals ENABLE ROW LEVEL SECURITY;

-- Verificar se as políticas estão funcionando
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'rentals';

COMMIT;
```

---

## 🧪 PROTOCOLO DE TESTE

### **Para Cada Tabela Implementada:**

1. **Teste Admin/Master BR:**
   - Deve ver todos os registros
   - Deve conseguir criar/editar/deletar

2. **Teste Regional:**
   - Deve ver apenas registros da sua cidade
   - Deve conseguir gerenciar registros da cidade

3. **Teste Franqueado:**
   - Deve ver apenas seus registros
   - Deve conseguir gerenciar apenas seus dados

4. **Teste de Isolamento:**
   - Franqueado A não deve ver dados do Franqueado B
   - Regional de Cidade A não deve ver dados da Cidade B

---

## 🚨 PLANO DE ROLLBACK

### **Em Caso de Problemas:**
```sql
-- Desabilitar RLS na tabela problemática
ALTER TABLE [nome_tabela] DISABLE ROW LEVEL SECURITY;

-- Ou restaurar estado anterior
UPDATE pg_tables
SET rowsecurity = false
WHERE tablename = '[nome_tabela]';
```

### **Rollback Completo:**
```sql
-- Script para restaurar estado original
-- (será criado antes da implementação)
```

---

## 📈 CRONOGRAMA DE IMPLEMENTAÇÃO

### **Semana 1: Tabelas Críticas**
- **Segunda**: `rentals` (locações)
- **Quarta**: `rental_plans` (planos)
- **Sexta**: Testes e validação

### **Semana 2: Tabelas de Negócio**
- **Segunda**: `vendas` (vendas)
- **Quarta**: `clients` (clientes)
- **Sexta**: Testes e validação

### **Semana 3: Tabelas Auxiliares**
- **Segunda**: `cities` (cidades)
- **Quarta**: Tabelas de contratos
- **Sexta**: Testes e validação

### **Semana 4: Tabelas de Sistema**
- **Segunda**: `app_users` (usuários)
- **Quarta**: Ajustes finais
- **Sexta**: Validação completa

---

## ✅ CRITÉRIOS DE SUCESSO

### **Para Cada Implementação:**
1. ✅ Sistema continua funcionando exatamente igual
2. ✅ Usuários mantêm as mesmas visões de dados
3. ✅ Performance não é afetada
4. ✅ Testes de isolamento passam
5. ✅ Logs não mostram erros de permissão

### **Para o Projeto Completo:**
1. ✅ Todas as tabelas com RLS habilitado
2. ✅ Políticas consistentes e organizadas
3. ✅ Documentação atualizada
4. ✅ Scripts de manutenção criados
5. ✅ Equipe treinada nos novos procedimentos

---

*Estratégia criada em: 2025-01-03*
*Versão: 1.0*
*Status: Pronta para implementação*
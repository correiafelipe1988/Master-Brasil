/**
 * Script de Teste para Webhook de Assinatura Eletrônica
 * Execute este script para testar a integração
 */

const WEBHOOK_URL = 'https://diopahhcwhdasextobav.supabase.co/functions/v1/signature-webhook';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpb3BhaGhjd2hkYXNleHRvYmF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NDQ2OTQsImV4cCI6MjA3MjEyMDY5NH0.zHmqOBR19B4uFlxtaGrtTAwtcFS7j7hydACGuTv0txg';

// Payloads de teste para diferentes eventos
const testPayloads = {
  // Eventos BeSign
  'document.created': {
    event: 'document.created',
    id: 'besign_doc_001',
    status: 'pending',
    document: {
      name: 'contrato_teste_001.pdf',
      url: 'https://example.com/doc.pdf'
    },
    metadata: {
      rental_id: 'rental_test_001',
      contract_id: 'contract_test_001',
      city_id: 'city_test_001'
    }
  },

  'document.sent': {
    event: 'document.sent',
    id: 'besign_doc_001',
    status: 'sent',
    document: {
      name: 'contrato_teste_001.pdf',
      url: 'https://example.com/doc.pdf'
    },
    metadata: {
      rental_id: 'rental_test_001',
      contract_id: 'contract_test_001'
    }
  },

  'document.signed': {
    event: 'document.signed',
    id: 'besign_doc_001',
    status: 'signed',
    signed_at: new Date().toISOString(),
    signer: {
      name: 'João Silva',
      email: 'joao@teste.com',
      document: '12345678901',
      signed_at: new Date().toISOString()
    },
    document: {
      name: 'contrato_teste_001.pdf',
      url: 'https://example.com/doc.pdf'
    }
  },

  'document.completed': {
    event: 'document.completed',
    id: 'besign_doc_001',
    status: 'completed',
    completed_at: new Date().toISOString(),
    document: {
      name: 'contrato_teste_001.pdf',
      url: 'https://example.com/doc.pdf',
      download_url: 'https://example.com/doc_signed.pdf'
    },
    metadata: {
      rental_id: 'rental_test_001',
      contract_id: 'contract_test_001'
    }
  },

  'document.rejected': {
    event: 'document.rejected',
    id: 'besign_doc_001',
    status: 'rejected',
    signer: {
      name: 'João Silva',
      email: 'joao@teste.com',
      document: '12345678901'
    },
    document: {
      name: 'contrato_teste_001.pdf',
      url: 'https://example.com/doc.pdf'
    }
  },

  'document.expired': {
    event: 'document.expired',
    id: 'besign_doc_001',
    status: 'expired',
    document: {
      name: 'contrato_teste_001.pdf',
      url: 'https://example.com/doc.pdf'
    }
  },

  // Eventos genéricos (compatibilidade)
  document_sent: {
    event: 'document_sent',
    document_id: 'test_doc_001',
    signature_request_id: 'test_req_001',
    status: 'pending',
    document: {
      name: 'contrato_teste_001.pdf',
      url: 'https://example.com/doc.pdf'
    },
    metadata: {
      rental_id: 'rental_test_001',
      contract_id: 'contract_test_001',
      city_id: 'city_test_001'
    }
  },

  signer_signed: {
    event: 'signer_signed',
    document_id: 'test_doc_001',
    signature_request_id: 'test_req_001',
    status: 'pending',
    signer: {
      name: 'João Silva',
      email: 'joao@teste.com',
      cpf: '12345678901',
      signed_at: new Date().toISOString()
    },
    document: {
      name: 'contrato_teste_001.pdf',
      url: 'https://example.com/doc.pdf'
    }
  },

  document_signed: {
    event: 'document_signed',
    document_id: 'test_doc_001',
    signature_request_id: 'test_req_001',
    status: 'signed',
    signed_at: new Date().toISOString(),
    document: {
      name: 'contrato_teste_001.pdf',
      url: 'https://example.com/doc.pdf',
      signed_url: 'https://example.com/doc_signed.pdf'
    },
    metadata: {
      rental_id: 'rental_test_001',
      contract_id: 'contract_test_001'
    }
  },

  document_rejected: {
    event: 'document_rejected',
    document_id: 'test_doc_001',
    signature_request_id: 'test_req_001',
    status: 'rejected',
    signer: {
      name: 'João Silva',
      email: 'joao@teste.com',
      cpf: '12345678901'
    },
    document: {
      name: 'contrato_teste_001.pdf',
      url: 'https://example.com/doc.pdf'
    }
  },

  document_expired: {
    event: 'document_expired',
    document_id: 'test_doc_001',
    signature_request_id: 'test_req_001',
    status: 'expired',
    document: {
      name: 'contrato_teste_001.pdf',
      url: 'https://example.com/doc.pdf'
    }
  }
};

async function testWebhook(eventType, payload) {
  console.log(`\n🧪 Testando evento: ${eventType}`);
  console.log('📤 Payload:', JSON.stringify(payload, null, 2));

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'x-client-info': 'webhook-test@1.0.0'
      },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    
    console.log(`📥 Status: ${response.status}`);
    console.log(`📥 Response:`, responseText);

    if (response.ok) {
      console.log('✅ Teste bem-sucedido!');
      return true;
    } else {
      console.log('❌ Teste falhou!');
      return false;
    }

  } catch (error) {
    console.error('❌ Erro na requisição:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Iniciando testes do webhook de assinatura eletrônica...');
  console.log(`🔗 URL: ${WEBHOOK_URL}`);

  const results = {};

  for (const [eventType, payload] of Object.entries(testPayloads)) {
    results[eventType] = await testWebhook(eventType, payload);
    
    // Aguardar um pouco entre os testes
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n📊 RESUMO DOS TESTES:');
  console.log('========================');
  
  let passed = 0;
  let total = 0;

  for (const [eventType, success] of Object.entries(results)) {
    total++;
    if (success) passed++;
    
    const status = success ? '✅' : '❌';
    console.log(`${status} ${eventType}: ${success ? 'PASSOU' : 'FALHOU'}`);
  }

  console.log('========================');
  console.log(`📈 Resultado: ${passed}/${total} testes passaram`);
  
  if (passed === total) {
    console.log('🎉 Todos os testes passaram! Webhook está funcionando corretamente.');
  } else {
    console.log('⚠️ Alguns testes falharam. Verifique os logs da função Edge.');
  }
}

// Função para testar um evento específico
async function testSpecificEvent(eventType) {
  if (!testPayloads[eventType]) {
    console.error(`❌ Evento '${eventType}' não encontrado. Eventos disponíveis:`, Object.keys(testPayloads));
    return;
  }

  await testWebhook(eventType, testPayloads[eventType]);
}

// Executar testes
if (typeof window === 'undefined') {
  // Node.js environment
  const eventType = process.argv[2];
  
  if (eventType) {
    testSpecificEvent(eventType);
  } else {
    runAllTests();
  }
} else {
  // Browser environment
  console.log('Para executar os testes, use:');
  console.log('- runAllTests() - Executar todos os testes');
  console.log('- testSpecificEvent("document_sent") - Testar evento específico');
  
  // Disponibilizar funções globalmente
  window.runAllTests = runAllTests;
  window.testSpecificEvent = testSpecificEvent;
  window.testWebhook = testWebhook;
}

// Exportar para uso em módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    runAllTests,
    testSpecificEvent,
    testWebhook,
    testPayloads
  };
}

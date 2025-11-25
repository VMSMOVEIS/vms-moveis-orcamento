/**
 * Script de Diagnóstico: Cole isto no Console do Navegador (F12 → Console)
 * Mostra em tempo real o estado de localStorage e estrutura de propostas
 */

console.log('%c=== DIAGNÓSTICO DE SINCRONIZAÇÃO FIREBASE ===', 'font-size: 14px; font-weight: bold; color: #4f46e5;');

// 1. Verificar device_id
const deviceId = localStorage.getItem('device_id');
console.log('%c✓ Device ID:', 'color: #10b981; font-weight: bold;', deviceId || '❌ NÃO CRIADO AINDA');

// 2. Verificar propostas em localStorage
const storeData = localStorage.getItem('moveispro_data_v1');
if (storeData) {
  try {
    const parsed = JSON.parse(storeData);
    const proposals = parsed.savedProposals || [];
    
    console.log('%c✓ Propostas em localStorage:', 'color: #10b981; font-weight: bold;', proposals.length);
    
    if (proposals.length > 0) {
      proposals.forEach((p, idx) => {
        console.group(`📋 Proposta ${idx + 1}: ${p.clientName}`);
        console.log('  ID Local:', p.id);
        console.log('  Número:', p.number);
        console.log('  Projeto:', p.projectName);
        console.log('  Valor:', 'R$ ' + p.finalValue.toLocaleString('pt-BR'));
        console.log('  Status:', p.status);
        console.log('  Firebase ID:', p.firebaseId || '⏳ Aguardando sincronização...');
        console.groupEnd();
      });
    } else {
      console.log('%c  ⚠️ Nenhuma proposta salva ainda', 'color: #f59e0b;');
    }
  } catch (e) {
    console.error('❌ Erro ao parsear dados:', e);
  }
} else {
  console.log('%c❌ localStorage vazio - nenhuma proposta salva', 'color: #ef4444;');
}

// 3. Verificar chaves de rastreamento Firebase
console.log('%c✓ Chaves de rastreamento (proposal_*_firebase):', 'color: #10b981; font-weight: bold;');
let foundAny = false;
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key && key.startsWith('proposal_') && key.endsWith('_firebase')) {
    const firebaseDocId = localStorage.getItem(key);
    console.log(`  ${key}:`, firebaseDocId);
    foundAny = true;
  }
}
if (!foundAny) {
  console.log('%c  ⏳ Nenhuma chave de rastreamento encontrada (aguardando sincronização 3s após salvar)', 'color: #f59e0b;');
}

// 4. Verificar se Firebase foi inicializado
if (window.db) {
  console.log('%c✓ Firebase Firestore inicializado', 'color: #10b981; font-weight: bold;');
} else {
  console.log('%c❌ Firebase Firestore NÃO disponível (verifique conexão/regras)', 'color: #ef4444;');
}

console.log('%c\n=== PRÓXIMOS PASSOS ===', 'font-size: 12px; color: #666;');
console.log('1. Salve uma proposta no app (Precificação → Salvar)');
console.log('2. Aguarde 3 segundos');
console.log('3. Digite novamente este script para ver as chaves de rastreamento');
console.log('4. Verifique no Firebase Console: https://console.firebase.google.com');

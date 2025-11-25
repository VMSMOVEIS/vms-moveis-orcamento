/**
 * SCRIPT DE DIAGNÓSTICO COMPLETO
 * Cole isto no Console do Navegador (F12 → Console tab)
 * Este script mostra o estado completo da sincronização
 */

(function() {
  const style = {
    title: 'font-size: 16px; font-weight: bold; color: #4f46e5; margin-top: 10px;',
    success: 'color: #10b981; font-weight: bold;',
    warning: 'color: #f59e0b;',
    error: 'color: #ef4444; font-weight: bold;',
    info: 'color: #3b82f6;'
  };

  console.clear();
  console.log('%c╔════════════════════════════════════════╗', 'color: #4f46e5; font-weight: bold;');
  console.log('%c║  🔍 DIAGNÓSTICO DE SYNC FIREBASE     ║', 'color: #4f46e5; font-weight: bold;');
  console.log('%c╚════════════════════════════════════════╝', 'color: #4f46e5; font-weight: bold;');

  // 1. Device ID
  console.log('%c\n📱 DISPOSITIVO', style.title);
  const deviceId = localStorage.getItem('device_id');
  if (deviceId) {
    console.log('%c✓ Device ID:', style.success, deviceId);
  } else {
    console.log('%c⏳ Device ID:', style.warning, 'Será criado ao primeira sincronização');
  }

  // 2. Propostas em localStorage
  console.log('%c\n💾 STORAGE LOCAL', style.title);
  const storeData = localStorage.getItem('moveispro_data_v1');
  if (!storeData) {
    console.log('%c❌ Nenhuma proposta em localStorage', style.error);
  } else {
    try {
      const parsed = JSON.parse(storeData);
      const proposals = parsed.savedProposals || [];
      console.log(`%c✓ Propostas armazenadas: ${proposals.length}`, style.success);

      if (proposals.length > 0) {
        proposals.forEach((p, idx) => {
          console.group(`  📋 #${idx + 1}: ${p.clientName} - ${p.projectName}`);
          console.log('ID:', p.id);
          console.log('Valor:', `R$ ${p.finalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
          console.log('Status:', p.status);
          console.log('Firebase ID:', p.firebaseId ? `✓ ${p.firebaseId}` : '⏳ (aguardando)');
          console.log('Criada em:', new Date(p.createdAt).toLocaleString('pt-BR'));
          console.groupEnd();
        });
      }
    } catch (e) {
      console.log('%c❌ Erro ao ler dados:', style.error, e.message);
    }
  }

  // 3. Rastreamento de Firebase
  console.log('%c\n🔗 RASTREAMENTO FIREBASE', style.title);
  let firebaseTracked = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('proposal_') && key.endsWith('_firebase')) {
      const docId = localStorage.getItem(key);
      console.log(`%c✓ ${key}`, style.success);
      console.log(`  → Firestore Doc: ${docId}`);
      firebaseTracked++;
    }
  }
  if (firebaseTracked === 0) {
    console.log('%c⏳ Nenhuma proposta sincronizada com Firebase ainda', style.warning);
    console.log('   Dica: Salve uma proposta e aguarde 3 segundos');
  }

  // 4. Status do Firebase
  console.log('%c\n🔥 FIREBASE', style.title);
  if (window.db) {
    console.log('%c✓ Firestore conectado', style.success);
  } else {
    console.log('%c⚠️  Firestore não inicializado', style.warning);
  }

  // 5. Resumo
  console.log('%c\n📊 RESUMO', style.title);
  const proposalCount = storeData ? JSON.parse(storeData).savedProposals?.length || 0 : 0;
  const syncedCount = firebaseTracked;
  console.log(`Total de propostas: ${proposalCount}`);
  console.log(`Sincronizadas com Firebase: ${syncedCount}`);
  if (syncedCount === proposalCount && proposalCount > 0) {
    console.log('%c✓ TUDO SINCRONIZADO!', style.success);
  } else if (proposalCount > 0) {
    console.log('%c⏳ Sincronizando... (aguarde 3-5 segundos)', style.warning);
  }

  // 6. Instruções
  console.log('%c\n📝 PRÓXIMAS AÇÕES', style.title);
  console.log('1. Salve uma proposta no app (Precificação → Salvar)');
  console.log('2. Aguarde 3 segundos');
  console.log('3. Cole este script novamente para ver as mudanças');
  console.log('4. Veja o documento no Firebase Console:\n   https://console.firebase.google.com/u/0/project/vms-orcamentos/firestore/data/proposals');

  console.log('%c\n✅ Diagnóstico concluído!', style.success);
})();

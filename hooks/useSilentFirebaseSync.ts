import { useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';

/**
 * Hook silencioso que sincroniza propostas com Firebase
 * Não mexe em nada da UI - apenas salva em background
 */
export const useSilentFirebaseSync = (savedProposals: any[]) => {
  // Auto-salvar propostas quando mudarem
  useEffect(() => {
    if (!db || !savedProposals.length) return;

    const syncProposals = async () => {
      try {
        // Gera um ID único para o navegador/dispositivo
        let deviceId = localStorage.getItem('device_id');
        if (!deviceId) {
          deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          localStorage.setItem('device_id', deviceId);
        }

        for (const proposal of savedProposals) {
          const proposalData = {
            ...proposal,
            deviceId,
            syncedAt: new Date().toISOString(),
          };

          try {
            if (proposal.firebaseId) {
              // Atualizar
              await updateDoc(doc(db, 'proposals', proposal.firebaseId), proposalData);
            } else {
              // Criar novo
              const docRef = await addDoc(collection(db, 'proposals'), proposalData);
              // Atualiza localStorage com o ID do Firebase
              localStorage.setItem(`proposal_${proposal.id}_firebase`, docRef.id);
            }
          } catch (err) {
            console.log('Sincronização em background...');
          }
        }
      } catch (error) {
        console.log('Firebase sync em background');
      }
    };

    // Sincroniza a cada mudança com debounce de 3 segundos
    const timer = setTimeout(syncProposals, 3000);
    return () => clearTimeout(timer);
  }, [savedProposals]);
};

import { useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';

/**
 * Hook silencioso que sincroniza propostas com Firebase
 * Não mexe em nada da UI - apenas salva em background
 */
export const useSilentFirebaseSync = (savedProposals: any[], updateSavedProposalMetaData?: (id: string, updates: Partial<any>) => void) => {
  // On mount: carregar propostas do Firestore e mesclar com local
  useEffect(() => {
    if (!db || !updateSavedProposalMetaData) return;

    const loadRemoteProposals = async () => {
      try {
        const snaps = await getDocs(collection(db, 'proposals'));
        for (const docSnap of snaps.docs) {
          const remote = docSnap.data() as any;
          const firebaseId = docSnap.id;
          const remoteId = remote.id || `remote_${firebaseId}`;

          // Se já existe mapeamento local, atualiza apenas o firebaseId se necessário
          const existingFirebaseKey = localStorage.getItem(`proposal_${remoteId}_firebase`);
          if (existingFirebaseKey === firebaseId) {
            // já está associado
            continue;
          }

          // Chama callback para mesclar/guardar no store
          try {
            updateSavedProposalMetaData(remoteId, { ...remote, firebaseId });
            // Marca mapeamento local para não duplicar
            localStorage.setItem(`proposal_${remoteId}_firebase`, firebaseId);
          } catch (e) {
            console.warn('Falha ao importar proposta remota', e);
          }
        }
      } catch (e) {
        console.debug('Falha ao carregar propostas remotas', e);
      }
    };

    loadRemoteProposals();
  }, [updateSavedProposalMetaData]);

  // Auto-salvar propostas quando mudarem
  useEffect(() => {
    if (!db || !savedProposals || savedProposals.length === 0) return;

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
            const proposalData = {
              ...proposal,
              deviceId,
              syncedAt: new Date().toISOString(),
            };

            // Verifica se já existe `firebaseId` no objeto ou em localStorage
            let firebaseId = proposal.firebaseId || localStorage.getItem(`proposal_${proposal.id}_firebase`);

            if (firebaseId) {
              // Atualiza documento existente
              await updateDoc(doc(db, 'proposals', firebaseId), proposalData);

              // Se o objeto local não tinha firebaseId, atualiza o state via callback
              if (!proposal.firebaseId && updateSavedProposalMetaData) {
                try {
                  updateSavedProposalMetaData(proposal.id, { firebaseId });
                } catch (e) {
                  console.warn('Falha ao atualizar meta local da proposta', e);
                }
              }
            } else {
              // Cria novo documento
              const docRef = await addDoc(collection(db, 'proposals'), proposalData);
              firebaseId = docRef.id;

              try {
                localStorage.setItem(`proposal_${proposal.id}_firebase`, firebaseId);
                if (updateSavedProposalMetaData) updateSavedProposalMetaData(proposal.id, { firebaseId });
              } catch (e) {
                console.warn('Falha ao gravar firebaseId localmente', e);
              }
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

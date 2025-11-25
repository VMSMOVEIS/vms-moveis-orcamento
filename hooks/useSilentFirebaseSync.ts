import { useEffect } from 'react';
import { collection, addDoc, updateDoc, doc, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';

// Use Airtable serverless endpoints when VITE_USE_AIRTABLE=true
const useAirtable = (import.meta as any).env?.VITE_USE_AIRTABLE === 'true';
const AIRTABLE_SAVE_ENDPOINT = '/api/airtable-save';
const AIRTABLE_LOAD_ENDPOINT = '/api/airtable-load';

/**
 * Hook silencioso que sincroniza propostas com Firebase
 * Não mexe em nada da UI - apenas salva em background
 */
export const useSilentFirebaseSync = (savedProposals: any[], updateSavedProposalMetaData?: (id: string, updates: Partial<any>) => void) => {
  // On mount: carregar propostas remotas (Firestore OR Airtable) e mesclar com local
  useEffect(() => {
    if (!updateSavedProposalMetaData) return;

    const loadRemoteProposals = async () => {
      try {
        if (useAirtable) {
          // Call serverless endpoint to fetch Airtable records
          try {
            const resp = await fetch(AIRTABLE_LOAD_ENDPOINT);
            if (!resp.ok) throw new Error('Airtable load failed');
            const json = await resp.json();
            for (const r of json.records || []) {
              const remote = r.payload || {};
              const recordId = r.recordId;
              const remoteId = remote.id || `remote_${recordId}`;

              const existingKey = localStorage.getItem(`proposal_${remoteId}_firebase`);
              if (existingKey === recordId) continue;

              try {
                updateSavedProposalMetaData(remoteId, { ...remote, firebaseId: recordId });
                localStorage.setItem(`proposal_${remoteId}_firebase`, recordId);
              } catch (e) {
                console.warn('Falha ao importar proposta remota (airtable)', e);
              }
            }
          } catch (e) {
            console.debug('Falha ao carregar propostas remotas (airtable)', e);
          }
        } else {
          // Firestore
          if (!db) return;
          const snaps = await getDocs(collection(db, 'proposals'));
          for (const docSnap of snaps.docs) {
            const remote = docSnap.data() as any;
            const firebaseId = docSnap.id;
            const remoteId = remote.id || `remote_${firebaseId}`;

            const existingFirebaseKey = localStorage.getItem(`proposal_${remoteId}_firebase`);
            if (existingFirebaseKey === firebaseId) continue;

            try {
              updateSavedProposalMetaData(remoteId, { ...remote, firebaseId });
              localStorage.setItem(`proposal_${remoteId}_firebase`, firebaseId);
            } catch (e) {
              console.warn('Falha ao importar proposta remota', e);
            }
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

              if (useAirtable) {
                // Send to serverless Airtable endpoint
                try {
                  const resp = await fetch(AIRTABLE_SAVE_ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(proposalData)
                  });
                  if (!resp.ok) throw new Error('airtable save failed');
                  const json = await resp.json();
                  const recordId = json.id || (json.record && json.record.id);
                  if (recordId) {
                    try {
                      localStorage.setItem(`proposal_${proposal.id}_firebase`, recordId);
                      if (updateSavedProposalMetaData) updateSavedProposalMetaData(proposal.id, { firebaseId: recordId });
                    } catch (e) { console.warn('Falha ao gravar id airtable localmente', e); }
                  }
                } catch (e) {
                  console.debug('Falha ao sincronizar com Airtable', e);
                }
              } else {
                // Firestore path
                let firebaseId = proposal.firebaseId || localStorage.getItem(`proposal_${proposal.id}_firebase`);

                if (firebaseId) {
                  await updateDoc(doc(db, 'proposals', firebaseId), proposalData);
                  if (!proposal.firebaseId && updateSavedProposalMetaData) {
                    try { updateSavedProposalMetaData(proposal.id, { firebaseId }); } catch (e) { console.warn('Falha ao atualizar meta local da proposta', e); }
                  }
                } else {
                  const docRef = await addDoc(collection(db, 'proposals'), proposalData);
                  firebaseId = docRef.id;
                  try { localStorage.setItem(`proposal_${proposal.id}_firebase`, firebaseId); if (updateSavedProposalMetaData) updateSavedProposalMetaData(proposal.id, { firebaseId }); } catch (e) { console.warn('Falha ao gravar firebaseId localmente', e); }
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

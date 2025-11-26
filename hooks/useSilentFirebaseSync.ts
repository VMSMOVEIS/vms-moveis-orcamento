import { useEffect } from 'react';
import { supabase } from '../supabaseConfig';

/**
 * Hook silencioso que sincroniza propostas com Supabase
 * Suporta fallback para localStorage se Supabase não estiver disponível
 * Não mexe em nada da UI - apenas salva em background
 */
export const useSilentFirebaseSync = (savedProposals: any[], updateSavedProposalMetaData?: (id: string, updates: Partial<any>) => void) => {
  // On mount: carregar propostas remotas (Supabase) e mesclar com local
  useEffect(() => {
    if (!supabase || !updateSavedProposalMetaData) return;

    const loadRemoteProposals = async () => {
      try {
        const { data, error } = await supabase.from('proposals').select('*');
        if (error) {
          console.debug('Erro ao carregar propostas do Supabase:', error);
          return;
        }

        for (const remote of data || []) {
          const remoteId = remote.id;
          const existingKey = localStorage.getItem(`proposal_${remoteId}_supabase`);
          if (existingKey === remoteId) continue; // já importado

          try {
            updateSavedProposalMetaData(remoteId, { ...remote, firebaseId: remoteId });
            localStorage.setItem(`proposal_${remoteId}_supabase`, remoteId);
          } catch (e) {
            console.warn('Falha ao importar proposta remota (Supabase)', e);
          }
        }
      } catch (e) {
        console.debug('Falha ao carregar propostas remotas (Supabase)', e);
      }
    };

    loadRemoteProposals();
  }, [updateSavedProposalMetaData]);

  // Auto-salvar propostas quando mudarem
  useEffect(() => {
    if (!supabase || !savedProposals || savedProposals.length === 0) return;

    const syncProposals = async () => {
      try {
        // Gera um ID único para o navegador/dispositivo
        let deviceId = localStorage.getItem('device_id');
        if (!deviceId) {
          deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          localStorage.setItem('device_id', deviceId);
        }

        for (const proposal of savedProposals) {
          try {
            const proposalData = {
              id: proposal.id,
              clientName: proposal.clientName || '',
              projectName: proposal.projectName || '',
              finalValue: proposal.finalValue || 0,
              status: proposal.status || 'Aguardando aprovação',
              deviceId,
              syncedAt: new Date().toISOString(),
              payload: JSON.stringify(proposal), // full proposal as JSON
              createdAt: proposal.createdAt || new Date().toISOString(),
            };

            const existingKey = localStorage.getItem(`proposal_${proposal.id}_supabase`);

            if (existingKey || proposal.firebaseId) {
              // Update existing
              const { error } = await supabase
                .from('proposals')
                .update(proposalData)
                .eq('id', proposal.id);

              if (error) {
                console.debug('Erro ao atualizar proposta no Supabase:', error);
              } else if (!proposal.firebaseId && updateSavedProposalMetaData) {
                try {
                  updateSavedProposalMetaData(proposal.id, { firebaseId: proposal.id });
                } catch (e) {
                  console.warn('Falha ao atualizar meta local', e);
                }
              }
            } else {
              // Create new
              const { error } = await supabase.from('proposals').insert([proposalData]);

              if (error) {
                console.debug('Erro ao criar proposta no Supabase:', error);
              } else {
                try {
                  localStorage.setItem(`proposal_${proposal.id}_supabase`, proposal.id);
                  if (updateSavedProposalMetaData) {
                    updateSavedProposalMetaData(proposal.id, { firebaseId: proposal.id });
                  }
                } catch (e) {
                  console.warn('Falha ao gravar id Supabase localmente', e);
                }
              }
            }
          } catch (err) {
            console.debug('Sincronização em background (Supabase)...', err);
          }
        }
      } catch (error) {
        console.debug('Erro no sync em background do Supabase', error);
      }
    };

    // Sincroniza a cada mudança com debounce de 3 segundos
    const timer = setTimeout(syncProposals, 3000);
    return () => clearTimeout(timer);
  }, [savedProposals, updateSavedProposalMetaData]);
};

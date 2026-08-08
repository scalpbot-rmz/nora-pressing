import { db, TableName, SyncStatus } from './db';
import { createClient } from './supabase/client';

const TABLES: TableName[] = ['pressings', 'offers', 'customers', 'orders', 'expenses'];

export class SyncEngine {
  private isSyncing = false;
  private realtimeSubscription: any = null;

  /**
   * Notification des abonnés (store React) en cas de changement DB
   */
  public notifyListeners() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('nora-db-change'));
    }
  }

  /**
   * Effectue une synchronisation complète (push local -> cloud, puis pull cloud -> local)
   */
  async syncAll(userId: string): Promise<void> {
    if (!userId || typeof window === 'undefined' || !navigator.onLine) return;
    if (this.isSyncing) return;

    this.isSyncing = true;
    try {
      const supabase = createClient();

      // 1. PUSH : Envoyer les modifications locales en attente vers Supabase
      for (const table of TABLES) {
        await this.pushTable(table, userId, supabase);
      }

      // 2. PULL : Récupérer les données modifiées sur Supabase
      for (const table of TABLES) {
        await this.pullTable(table, userId, supabase);
      }

      this.notifyListeners();
    } catch (err) {
      console.error('Erreur lors de la synchronisation:', err);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Push les données locales en statut 'pending' ou 'deleted' vers Supabase
   */
  private async pushTable(tableName: TableName, userId: string, supabase: any) {
    const dexieTable = (db as any)[tableName];
    if (!dexieTable) return;

    try {
      const pendingItems = await dexieTable
        .where('_syncStatus')
        .equals('pending')
        .toArray();

      const deletedItems = await dexieTable
        .where('_syncStatus')
        .equals('deleted')
        .toArray();

      // 1. Envoyer les nouveaux/modifiés
      for (const item of pendingItems) {
        const { _syncStatus, ...payload } = item;
        payload.user_id = userId;
        payload.updated_at = payload.updated_at || new Date().toISOString();

        // Protection Logo : si c'est la table pressings et que logo_url est vide/undefined, on ne l'écrase pas si existant sur Supabase
        if (tableName === 'pressings' && !payload.logo_url) {
          delete payload.logo_url;
        }

        const { error } = await supabase
          .from(tableName)
          .upsert(payload, { onConflict: 'id' });

        if (!error) {
          await dexieTable.update(item.id, { _syncStatus: 'synced' });
        } else {
          console.error(`Erreur Push ${tableName}:`, error);
        }
      }

      // 2. Traiter les suppressions
      for (const item of deletedItems) {
        if (item.deleted_at) {
          const { error } = await supabase
            .from(tableName)
            .update({ deleted_at: item.deleted_at, updated_at: new Date().toISOString() })
            .eq('id', item.id);

          if (!error) {
            await dexieTable.delete(item.id);
          }
        } else {
          const { error } = await supabase.from(tableName).delete().eq('id', item.id);
          if (!error) {
            await dexieTable.delete(item.id);
          }
        }
      }
    } catch (e) {
      console.warn(`[SyncEngine] Push table ${tableName} ignoré:`, e);
    }
  }

  /**
   * Pull les données depuis Supabase vers IndexedDB
   */
  private async pullTable(tableName: TableName, userId: string, supabase: any) {
    const dexieTable = (db as any)[tableName];
    if (!dexieTable) return;

    try {
      const { data: remoteItems, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('user_id', userId);

      if (error || !remoteItems) return;

      for (const remote of remoteItems) {
        const local = await dexieTable.get(remote.id);

        if (remote.deleted_at) {
          if (local) await dexieTable.delete(remote.id);
          continue;
        }

        if (!local) {
          await dexieTable.put({ ...remote, _syncStatus: 'synced' });
        } else if (local._syncStatus !== 'pending') {
          const localTime = new Date(local.updated_at || 0).getTime();
          const remoteTime = new Date(remote.updated_at || 0).getTime();

          if (remoteTime >= localTime) {
            // Conserver le logo local si le remote n'en a pas
            const patch = { ...remote, _syncStatus: 'synced' };
            if (tableName === 'pressings' && !remote.logo_url && local.logo_url) {
              patch.logo_url = local.logo_url;
            }
            await dexieTable.put(patch);
          }
        }
      }
    } catch (e) {
      console.warn(`[SyncEngine] Pull table ${tableName} ignoré:`, e);
    }
  }

  /**
   * Active la synchronisation en temps réel avec Supabase Realtime
   */
  subscribeRealtime(userId: string, onUpdate?: () => void) {
    if (!userId || typeof window === 'undefined') return;

    const supabase = createClient();
    if (this.realtimeSubscription) {
      supabase.removeChannel(this.realtimeSubscription);
    }

    this.realtimeSubscription = supabase
      .channel(`nora-realtime-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        async (payload: any) => {
          const newItem = payload.new || payload.old;
          if (newItem && (newItem.user_id === userId || !newItem.user_id)) {
            const table = payload.table as TableName;
            if (TABLES.includes(table)) {
              const dexieTable = (db as any)[table];
              if (!dexieTable) return;

              if (payload.eventType === 'DELETE' || (payload.new && payload.new.deleted_at)) {
                await dexieTable.delete(newItem.id);
              } else if (payload.new) {
                const local = await dexieTable.get(payload.new.id);
                // Ne pas écraser si l'utilisateur local a une modif en attente non synchronisée
                if (!local || local._syncStatus !== 'pending') {
                  const patch = { ...payload.new, _syncStatus: 'synced' };
                  if (table === 'pressings' && !payload.new.logo_url && local?.logo_url) {
                    patch.logo_url = local.logo_url;
                  }
                  await dexieTable.put(patch);
                }
              }

              this.notifyListeners();
              if (onUpdate) onUpdate();
            }
          }
        }
      )
      .subscribe();
  }

  unsubscribeRealtime() {
    if (this.realtimeSubscription) {
      const supabase = createClient();
      supabase.removeChannel(this.realtimeSubscription);
      this.realtimeSubscription = null;
    }
  }
}

export const syncEngine = new SyncEngine();

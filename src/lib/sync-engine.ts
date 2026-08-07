import { db, SyncStatus } from './db';
import { createClient } from './supabase/client';

const TABLES = ['pressings', 'offers', 'customers', 'orders', 'expenses'] as const;
type TableName = (typeof TABLES)[number];

export class SyncEngine {
  private isSyncing = false;
  private realtimeSubscription: any = null;

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

    // Trouver tous les enregistrements locaux avec _syncStatus pending ou deleted
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
        // Soft delete sur Supabase
        const { error } = await supabase
          .from(tableName)
          .update({ deleted_at: item.deleted_at, updated_at: new Date().toISOString() })
          .eq('id', item.id);

        if (!error) {
          await dexieTable.delete(item.id);
        }
      } else {
        // Hard delete si pas de deleted_at
        const { error } = await supabase.from(tableName).delete().eq('id', item.id);
        if (!error) {
          await dexieTable.delete(item.id);
        }
      }
    }
  }

  /**
   * Pull les données depuis Supabase vers IndexedDB
   */
  private async pullTable(tableName: TableName, userId: string, supabase: any) {
    const dexieTable = (db as any)[tableName];

    const { data: remoteItems, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('user_id', userId);

    if (error || !remoteItems) {
      if (error) console.error(`Erreur Pull ${tableName}:`, error);
      return;
    }

    for (const remote of remoteItems) {
      const local = await dexieTable.get(remote.id);

      // Si l'élément est marqué comme supprimé à distance
      if (remote.deleted_at) {
        if (local) {
          await dexieTable.delete(remote.id);
        }
        continue;
      }

      // Si local n'existe pas ou remote est plus récent et pas localement 'pending'
      if (!local) {
        await dexieTable.put({ ...remote, _syncStatus: 'synced' });
      } else if (local._syncStatus !== 'pending') {
        const localTime = new Date(local.updated_at || 0).getTime();
        const remoteTime = new Date(remote.updated_at || 0).getTime();

        if (remoteTime >= localTime) {
          await dexieTable.put({ ...remote, _syncStatus: 'synced' });
        }
      }
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
      .channel('nora-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        async (payload: any) => {
          if (payload.new && payload.new.user_id === userId) {
            const table = payload.table as TableName;
            if (TABLES.includes(table)) {
              const dexieTable = (db as any)[table];
              if (payload.new.deleted_at) {
                await dexieTable.delete(payload.new.id);
              } else {
                await dexieTable.put({ ...payload.new, _syncStatus: 'synced' });
              }
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

import { Box } from '@/components/ui/box';
import { useOrders } from '@/contexts/ProductionOrdersContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as NavigationBar from 'expo-navigation-bar';
import { Link, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function CheckingList() {
  const { checking, loadOrders } = useOrders();
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [localPendingUids, setLocalPendingUids] = useState<string[]>([]);

  useEffect(() => {
    NavigationBar.setVisibilityAsync('hidden');
    NavigationBar.setBehaviorAsync('overlay-swipe');
  }, []);

  useFocusEffect(
    useCallback(() => {
      checkLocalPendingQueue();
      loadOrders()
    }, [])
  );

  const checkLocalPendingQueue = async () => {
    try {
      const saved = await AsyncStorage.getItem('checking_queue');
      console.log('[Checking List] Leitura da checking_queue:', saved ? `${saved.length} caracteres` : 'chave inexistente');
      if (saved) {
        const parsed = JSON.parse(saved);
        const pendingOps = parsed.map((item: any) => String(item.op));
        console.log('[Checking List] Pendências reconhecidas:', {
          total: Array.isArray(parsed) ? parsed.length : 'fila inválida',
          ops: pendingOps,
          itens: Array.isArray(parsed) ? parsed.map((item: any) => ({ uid: item?.uid, op: item?.op, status: item?.status })) : [],
        });
        setLocalPendingUids(pendingOps);
      } else {
        console.log('[Checking List] Nenhuma pendência local encontrada.');
        setLocalPendingUids([]);
      }
    } catch (err) {
      console.log('[Checking List] Erro ao ler/interpretar checking_queue:', err);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    await checkLocalPendingQueue();
    setRefreshing(false);
  };

  const filteredOrders = checking.filter(order =>
    String(order.order_code).toLowerCase().includes(search.toLowerCase())
  );

  const EmptyChecking = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name='clipboard-check-outline' size={80} color="#cbd5e1" />
      <Text style={styles.emptyTitle}>Nada para conferir</Text>
      <Text style={styles.emptySubtitle}>
        Todas as ordens já foram conferidas ou não há novas O.Ps na fila de conferência.
      </Text>
      <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
        <Text style={styles.refreshButtonText}>Atualizar lista</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <StatusBar hidden />
      <TextInput
        placeholder="Buscar O.P para conferência..."
        value={search}
        onChangeText={setSearch}
        keyboardType="numeric"
        style={styles.search}
        placeholderTextColor={'#afafaf'}
      />

      <Box className="rounded-lg overflow-hidden flex-1">
        <View style={styles.header}>
          <Text style={[styles.cell, styles.headerText]}>O.P</Text>
          <Text style={[styles.cell, styles.headerText]}>Quantidade</Text>
          <Text style={[styles.cell, styles.headerText]}>Ação</Text>
        </View>

        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => String(item.id)}
          onRefresh={onRefresh}
          refreshing={refreshing}
          ListEmptyComponent={<EmptyChecking />}
          contentContainerStyle={filteredOrders.length === 0 ? { flex: 1 } : { paddingBottom: 100 }}
          renderItem={({ item }) => {
            // 🧠 Valida se esta linha atual bate com alguma OP salva localmente esperando internet
            const currentOpString = !item.isReq ? String(item.order_code) : `REQ-${item.id}`;
            const isOfflinePending = localPendingUids.includes(currentOpString);
            if (isOfflinePending) {
              console.log('[Checking List] OP reconhecida como pendente:', {
                orderId: item.id,
                currentOpString,
                localPendingUids,
              });
            }

            return (
              <View style={[styles.row, isOfflinePending && styles.rowPending]}>
                <View style={styles.cell}>
                  <Text style={{ fontWeight: 'bold', color: isOfflinePending ? '#d97706' : '#0abb87' }}>
                    {!item.isReq ? item.order_code : `REQ-${item.id.toString().padStart(5, '0')}`}
                  </Text>
                  
                  {/* ⚡ BADGE VISUAL DE ALERTA SE ESTIVER OFFLINE */}
                  {isOfflinePending && (
                    <View style={styles.badgePending}>
                      <MaterialCommunityIcons name="cloud-off-outline" size={10} color="#fff" />
                      <Text style={styles.badgeText}>Aguardando Rede</Text>
                    </View>
                  )}
                </View>

                <View style={styles.cell}>
                  <Text style={{ fontSize: 12, color: isOfflinePending ? '#78350f' : '#000' }}>
                    {!item.isReq ? Number(item.amount).toFixed(0) : item.items.length}
                  </Text>
                </View>

                <View style={styles.cell}>
                  {isOfflinePending ? (
                    
                    <View style={[styles.actionButton, { backgroundColor: '#94a3b8', opacity: 0.7 }]}>
                      <Text style={styles.actionText}>Concluída</Text>
                    </View>
                  ) : (
                    <Link href={{ pathname: '/(protected)/warehouse/conf/[conferenceOp]', params: { conferenceOp: !item.isReq ? item.order_code : item.id } }} asChild>
                      <TouchableOpacity style={styles.actionButton}>
                        <Text style={styles.actionText}>Conferir</Text>
                      </TouchableOpacity>
                    </Link>
                  )}
                </View>
              </View>
            );
          }}
        />
      </Box>
    </View>
  );
}

const styles = StyleSheet.create({
  search: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    margin: 10,
    backgroundColor: '#f8fafc'
  },
  header: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    alignItems: 'center',
    backgroundColor: '#f1f5f9'
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    alignItems: 'center',
    backgroundColor: '#e8e8e8'
  },
  rowPending: {
    backgroundColor: '#fef3c7',
    borderBottomColor: '#fde68a',
  },
  badgePending: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d97706',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
    gap: 3
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  cell: {
    flex: 1,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#475569'
  },
  actionButton: {
    backgroundColor: '#3b3b57',
    paddingVertical: 6,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  actionText: {
    color: 'ghostwhite',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 12
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#334155',
    marginTop: 15,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 20,
  },
  refreshButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  refreshButtonText: {
    color: '#3b3b57',
    fontWeight: '700',
  }
});
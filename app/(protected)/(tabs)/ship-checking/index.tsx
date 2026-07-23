import { Box } from '@/components/ui/box';
import { useSalesOrders } from '@/contexts/salesOrdersContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as NavigationBar from 'expo-navigation-bar';
import { Link, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function ShipmentCheckingList() {
  const { saleChecking, loadSalesOrders } = useSalesOrders();
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [localPendingUids, setLocalPendingUids] = useState<string[]>([]);
  const [page, setPage] = useState<number>(1);

  const itemsPerPage = 4;

  useEffect(() => {
    NavigationBar.setVisibilityAsync('hidden');
    NavigationBar.setBehaviorAsync('overlay-swipe');
  }, []);

  useFocusEffect(
    useCallback(() => {
      checkLocalPendingQueue();
      loadSalesOrders()
    }, [])
  );

  const checkLocalPendingQueue = async () => {
    try {
      const saved = await AsyncStorage.getItem('shipment_checking_queue');
      console.log('[Shipment Checking List] Leitura da shipment_checking_queue:', saved ? `${saved.length} caracteres` : 'chave inexistente');
      if (saved) {
        const parsed = JSON.parse(saved);
        const pendingOrders = parsed.map((item: any) => String(item.order));
        console.log('[Shipment Checking List] Pendências reconhecidas:', {
          total: Array.isArray(parsed) ? parsed.length : 'fila inválida',
          orders: pendingOrders,
          itens: Array.isArray(parsed) ? parsed.map((item: any) => ({ uid: item?.uid, order: item?.order, status: item?.status })) : [],
        });
        setLocalPendingUids(pendingOrders);
      } else {
        console.log('[Shipment Checking List] Nenhuma pendência local encontrada.');
        setLocalPendingUids([]);
      }
    } catch (err) {
      console.log('[Shipment Checking List] Erro ao ler/interpretar shipment_checking_queue:', err);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSalesOrders();
    await checkLocalPendingQueue();
    setRefreshing(false);
  };

  const filteredOrders = saleChecking.filter(order =>
    String(order.order_code).toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1;

  const paginated = filteredOrders.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const EmptyChecking = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name='clipboard-check-outline' size={80} color="#cbd5e1" />
      <Text style={styles.emptyTitle}>Nada para conferir</Text>
      <Text style={styles.emptySubtitle}>
        Todos os pedidos já foram conferidos ou não há novos pedidos na fila de conferência.
      </Text>
      <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
        <Text style={styles.refreshButtonText}>Atualizar Lista</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <StatusBar hidden />
      <TextInput
        placeholder="Buscar pedido para conferência..."
        value={search}
        onChangeText={(text) => {
          setSearch(text);
          setPage(1);
        }}
        keyboardType="numeric"
        style={styles.search}
        placeholderTextColor={'#afafaf'}
      />

      <Box className="rounded-lg overflow-hidden flex-1">
        <View style={styles.header}>
          <Text style={[styles.cell, styles.headerText]}>Pedido</Text>
          <Text style={[styles.cell, styles.headerText]}>Quantidade</Text>
          <Text style={[styles.cell, styles.headerText]}>Ação</Text>
        </View>

        <FlatList
          data={paginated}
          keyExtractor={(item) => String(item.id)}
          onRefresh={onRefresh}
          refreshing={refreshing}
          ListEmptyComponent={<EmptyChecking />}
          contentContainerStyle={filteredOrders.length === 0 ? { flex: 1 } : { paddingBottom: 100 }}
          renderItem={({ item }) => {
            const currentOrderString = String(item.order_code);
            const isOfflinePending = localPendingUids.includes(currentOrderString);

            return (
              <View style={[styles.row, isOfflinePending && styles.rowPending]}>
                <View style={styles.cell}>
                  <Text style={{ fontWeight: 'bold', color: isOfflinePending ? '#d97706' : '#0abb87' }}>
                    {item.order_code}
                  </Text>
                  
                  {isOfflinePending && (
                    <View style={styles.badgePending}>
                      <MaterialCommunityIcons name="cloud-off-outline" size={10} color="#fff" />
                      <Text style={styles.badgeText}>Aguardando Rede</Text>
                    </View>
                  )}
                    <Text style={{ color: '#666', fontSize: 10, top: 5 }}>{item.transp}</Text>
                </View>

                <View style={styles.cell}>
                  <Text style={{ fontSize: 12, color: isOfflinePending ? '#78350f' : '#000' }}>
                    {item.items.length}
                  </Text>
                </View>

                <View style={styles.cell}>
                  {isOfflinePending ? (
                    <View style={[styles.actionButton, { backgroundColor: '#94a3b8', opacity: 0.7 }]}>
                      <Text style={styles.actionText}>Concluída</Text>
                    </View>
                  ) : (
                    <Link href={{ pathname: '/(protected)/shipment/conf/[sale]', params: { sale: String(item.order_code) } }} asChild>
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

      {filteredOrders.length > 0 && totalPages > 1 && (
        <View style={styles.pagination}>
          <Pressable disabled={page === 1} onPress={() => setPage(page - 1)}>
            <Text style={page === 1 ? styles.disabled : styles.button}>Anterior</Text>
          </Pressable>
          <Text style={styles.pageInfo}>
            {page} de {totalPages}
          </Text>
          <Pressable disabled={page === totalPages} onPress={() => setPage(page + 1)}>
            <Text style={page === totalPages ? styles.disabled : styles.button}>Próximo</Text>
          </Pressable>
        </View>
      )}
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
    marginTop: 25,
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 25,
    backgroundColor: '#3b3b57',
  },
  refreshButtonText: {
    color: 'ghostwhite',
    fontWeight: '700'
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  button: {
    color: '#0abb87',
    fontWeight: '600',
  },
  disabled: {
    color: '#cbd5e1',
    fontWeight: '600',
  },
  pageInfo: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
});

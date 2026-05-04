import { Box } from '@/components/ui/box';
import { useOrders } from '@/contexts/ProductionOrdersContext';
import * as NavigationBar from 'expo-navigation-bar';
import { Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function CheckingList() {
  const { checking, loadOrders } = useOrders();
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    NavigationBar.setVisibilityAsync('hidden');
    NavigationBar.setBehaviorAsync('overlay-swipe');
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  const filteredOrders = checking.filter(order =>
    String(order.order_code).toLowerCase().includes(search.toLowerCase())
  );

  const EmptyChecking = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="clipboard-check-outline" size={80} color="#cbd5e1" />
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
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={styles.cell}>
                <Text style={{ fontWeight: 'bold', color: '#0abb87' }}>
                  {!item.isReq ? item.order_code : `REQ-${item.id.toString().padStart(5, '0')}`}
                </Text>
              </View>
              <View style={styles.cell}>
                <Text style={{ fontSize: 12 }}>
                  {!item.isReq ? Number(item.amount).toFixed(0) : item.items.length}
                </Text>
              </View>
              <View style={styles.cell}>
                <Link href={{ pathname: '/checking/[confereceOp]', params: { confereceOp: !item.isReq ? item.order_code : item.id } }} asChild>
                  <TouchableOpacity style={styles.actionButton}>
                    <Text style={styles.actionText}>Conferir</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </View>
          )}
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
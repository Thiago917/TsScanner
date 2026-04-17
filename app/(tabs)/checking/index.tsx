import { Box } from '@/components/ui/box';
import { useOrders } from '@/contexts/ProductionOrdersContext';
import * as NavigationBar from 'expo-navigation-bar';
import { Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

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

  return (
    <View style={{ flex: 1 }}>
      <StatusBar hidden />
      <TextInput
        placeholder="Buscar O.P para conferência..."
        value={search}
        onChangeText={setSearch}
        keyboardType="numeric"
        style={styles.search}
      />

      <Box className="rounded-lg overflow-hidden">
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
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={styles.cell}>
                <Text style={{ fontWeight: 'bold', color: '#0abb87' }}>{!item.isReq ? item.order_code : `REQ-${item.id.toString().padStart(5, '0')}`}</Text>
              </View>
              <View style={styles.cell}>
                <Text style={{ fontSize: 12 }}>{!item.isReq ? item.amount : item.items.length}</Text>
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
          contentContainerStyle={{ paddingBottom: 100 }}
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
  },
  header: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    alignItems: 'center',
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
});
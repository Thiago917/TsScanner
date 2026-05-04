import { Box } from '@/components/ui/box';
import { useSalesOrders } from '@/contexts/salesOrdersContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as NavigationBar from 'expo-navigation-bar';
import { Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function Home() {
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);

  const { salesOrders = [], loadSalesOrders } = useSalesOrders() || {};
  const inputRef = useRef<TextInput | null>(null);

  const itemsPerPage = 4;

  useEffect(() => {
    NavigationBar.setVisibilityAsync('hidden');
    NavigationBar.setBehaviorAsync('overlay-swipe');

    const loadData = async () => {
      setLoading(true);
      if (loadSalesOrders) await loadSalesOrders();
      setLoading(false);
    };

    loadData();
  }, []);

  const filtered = useMemo(() => {
    const data = Array.isArray(salesOrders) ? salesOrders : [];
    return data.filter((item) =>
      String(item.order_code || "").toLowerCase().includes(search.toLowerCase())
    );
  }, [salesOrders, search]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;

  const paginated = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, page]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (loadSalesOrders) await loadSalesOrders();
    setRefreshing(false);
  };

  const EmptyExpedicao = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="truck-check-outline" size={80} color="#cbd5e1" />
      <Text style={styles.emptyTitle}>Expedição limpa!</Text>
      <Text style={styles.emptySubtitle}>
        Não há pedidos de vendas aguardando separação no momento.
      </Text>
      <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
        <Text style={styles.refreshButtonText}>Atualizar Pedidos</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={process.env.EXPO_PUBLIC_MAIN_COLOR || '#3b3b57'} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <StatusBar hidden />
      <TextInput
        placeholder="Buscar pedido..."
        ref={inputRef}
        keyboardType={'numeric'}
        value={search}
        onChangeText={(text) => {
          setSearch(text);
          setPage(1);
        }}
        style={styles.search}
      />

      <Box className="rounded-lg overflow-hidden flex-1 mx-2">
        <View style={styles.header}>
          <Text style={[styles.cell, styles.headerText]}>Produto</Text>
          <Text style={[styles.cell, styles.headerText]}>Quantidade</Text>
          <Text style={[styles.cell, styles.headerText]}>Separar</Text>
        </View>

        <FlatList
          data={paginated}
          keyExtractor={(item) => String(item.id)}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListEmptyComponent={!loading && <EmptyExpedicao />}
          contentContainerStyle={filtered.length === 0 ? { flex: 1 } : { paddingBottom: 20 }}
          renderItem={({ item }) => {
            const total = Number(item.items_sum_quantity || 0);
            const sep = Number(item.items_sum_separated || 0);
            const percent = total > 0 ? ((sep / total) * 100).toFixed(0) : 0;

            return (
              <View style={styles.row}>
                <View style={styles.cell}>
                  <Text style={{ fontWeight: 'bold', color: '#0abb87' }}>{item.order_code}</Text>
                  <Text style={{ fontSize: 12, color: '#666' }}>{percent}%</Text>
                </View>

                <View style={styles.cell}>
                  <Text style={{ fontSize: 13 }}>Total: {total.toFixed(0)}</Text>
                  <Text style={{ fontSize: 13 }}>Sep: {sep.toFixed(0)}</Text>
                </View>

                <View style={styles.cell}>
                  {sep > 0 && sep >= total && total > 0 ? (
                    <View style={[styles.bipButton, styles.disabledButton]}>
                      <Text style={styles.bipText}>OK</Text>
                    </View>
                  ) : (
                    <Link href={{
                      pathname: '/shipment/bip/[order]', params: {
                        order: String(item.order_code),
                        amount: total
                      }
                    }} asChild>
                      <TouchableOpacity style={styles.bipButton}>
                        <Text style={styles.bipText}>{sep > 0 ? 'Retomar' : 'Iniciar'}</Text>
                      </TouchableOpacity>
                    </Link>
                  )}
                </View>
              </View>
            )
          }}
        />
      </Box>

      {filtered.length > 0 && (
        <View style={styles.pagination}>
          <Pressable disabled={page === 1} onPress={() => setPage(page - 1)}>
            <Text style={page === 1 ? styles.disabled : styles.button}>Anterior</Text>
          </Pressable>
          <Text>Página {page} de {totalPages}</Text>
          <Pressable disabled={page === totalPages} onPress={() => setPage(page + 1)}>
            <Text style={page === totalPages ? styles.disabled : styles.button}>Próxima</Text>
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
    backgroundColor: '#fff',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: 40,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee'
  },
  button: {
    color: '#3b3b57',
    fontWeight: 'bold',
  },
  disabled: {
    color: '#aaa',
  },
  header: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
    backgroundColor: '#f8f9fa'
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
    backgroundColor: '#fff'
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
    color: '#333'
  },
  bipButton: {
    backgroundColor: '#3b3b57',
    width: '80%',
    padding: 8,
    borderRadius: 5,
  },
  bipText: {
    color: 'ghostwhite',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 12
  },
  disabledButton: {
    backgroundColor: '#0abb87',
    opacity: 0.8
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
    color: '#fff',
    fontWeight: 'bold',
  }
});
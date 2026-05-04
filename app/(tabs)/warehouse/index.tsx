import { Box } from '@/components/ui/box';
import { useOrders } from '@/contexts/ProductionOrdersContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as NavigationBar from 'expo-navigation-bar';
import { Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function Warehouse() {
  
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const { orders, loadOrders } = useOrders();

  const inputRef = useRef<TextInput | null>(null);
  const itemsPerPage = 4;

  useEffect(() => {
    NavigationBar.setVisibilityAsync('hidden');
    NavigationBar.setBehaviorAsync('overlay-swipe');
    
    const loadData = async () => {
      setLoading(true);
      await loadOrders();
      setLoading(false);
    }
    loadData();
  }, []);
  
  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };
  
  const filtered = orders.filter((item) => String(item.order_code).toLowerCase().includes(search.toLowerCase()));
  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;

  const paginatedData = filtered.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const EmptyList = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="package-variant" size={80} color="#ccc" />
      <Text style={styles.emptyTitle}>Tudo em dia!</Text>
      <Text style={styles.emptySubtitle}>
        Não há pedidos pendentes para separação no momento.
      </Text>
      <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
        <Text style={styles.refreshButtonText}>Atualizar lista</Text>
      </TouchableOpacity>
    </View>
  );

  if(loading){
    return(
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
            <ActivityIndicator color={process.env.EXPO_PUBLIC_MAIN_COLOR}/>
        </View>
    )
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

        <Box className="rounded-lg overflow-hidden flex-1">
            <View style={styles.header}>
              <Text style={[styles.cell, styles.headerText]}>O.P</Text>
              <Text style={[styles.cell, styles.headerText]}>Quantidade</Text>
              <Text style={[styles.cell, styles.headerText]}>Separar</Text>
            </View>
            
            <FlatList
                data={paginatedData}
                keyExtractor={(item) => String(item.id)}
                refreshing={refreshing}
                onRefresh={onRefresh}
                ListEmptyComponent={<EmptyList />}
                contentContainerStyle={paginatedData.length === 0 ? { flex: 1 } : null}
                renderItem={({item}) => (
                    <View style={styles.row}>
                        <View style={styles.cell}>
                            <Text style={{fontWeight: 'bold', color: '#0abb87'}}>
                                {!item.isReq ? item.order_code : `REQ-${item.id.toString().padStart(5, '0')}`}
                            </Text>
                        </View>

                        <View style={styles.cell}>
                            <Text>Total: {!item.isReq ? Number(item.amount).toFixed(0) : item.items.length}</Text>
                        </View>

                        <View style={styles.cell}>
                            <Link href={{pathname:'/warehouse/bip/[productionOrder]', params:{
                                productionOrder: !item.isReq ? String(item.order_code) : item.id,
                            }}} asChild>
                                <TouchableOpacity style={styles.bipButton}>
                                    <Text style={styles.bipText}>
                                        {item.status === 1 ? 'Iniciar' : 'Retomar'}
                                    </Text>
                                </TouchableOpacity>
                            </Link>
                        </View>
                    </View>
                )} 
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
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: 40 
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
    backgroundColor: '#f9f9f9'
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
  bipButton: {
    backgroundColor: '#3b3b57',
    width: '70%',
    padding: 8,
    borderRadius: 5,
  },
  bipText: {
    color: 'ghostwhite',
    textAlign: 'center',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 8,
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
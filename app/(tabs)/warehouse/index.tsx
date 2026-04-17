import { Box } from '@/components/ui/box';
import { useOrders } from '@/contexts/ProductionOrdersContext';
import * as NavigationBar from 'expo-navigation-bar';
import { Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function Warehouse() {

  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const {orders, loadOrders} = useOrders()

  const inputRef = useRef<TextInput | null>(null);

  const itemsPerPage = 4;

  useEffect(() => {
    NavigationBar.setVisibilityAsync('hidden');
    NavigationBar.setBehaviorAsync('overlay-swipe');
    setLoading(false);
  }, [orders]);
  
  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };
  
  const filtered = orders.filter((item) => String(item.order_code).toLowerCase().includes(search.toLowerCase()))
  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;

  const paginatedData = filtered.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  if(loading){
    return(
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
            <ActivityIndicator color={process.env.EXPO_PUBLIC_MAIN_COLOR}/>
        </View>
    )
  }

  return (

      <View style={{ flex: 1}}>
        <StatusBar hidden />
        
        {/* SEARCH */}
        <TextInput
          placeholder="Buscar pedido..."
          ref={inputRef}
          keyboardType={'numeric'}
          value={search}
          onChangeText={(text) => {
            setSearch(text);
            setPage(1); // reset página ao buscar
          }}
          style={styles.search}
        />

        <Box className="rounded-lg overflow-hidden">
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
                renderItem={({item}) => {

                    if(!paginatedData){
                        return(
                            <View>
                                <ActivityIndicator color={process.env.EXPO_PUBLIC_MAIN_COLOR}/>
                            </View>
                        )
                    }

                    return(
                    <View style={styles.row}>

                        <View style={styles.cell}>
                        <Text style={{fontWeight: 'bold', color: '#0abb87'}}>{!item.isReq ? item.order_code : `REQ-${item.id.toString().padStart(5, '0')}`}</Text>
                        </View>

                        <View style={styles.cell}>
                        <Text>Total: {!item.isReq ? Number(item.amount).toFixed(0) : item.items.length}</Text>
                        </View>

                        <View style={styles.cell}>
                            <Link href={{pathname:'/warehouse/bip/[productionOrder]', params:{
                                productionOrder: !item.isReq ? String(item.order_code) : item.id,
                            }}} asChild>
                                <TouchableOpacity style={styles.bipButton}>
                                    {item.status === 1 ? (
                                        <Text style={styles.bipText}>Iniciar</Text>
                                    ):(
                                        <Text style={styles.bipText}>Retomar</Text>
                                    )}
                                </TouchableOpacity>
                            </Link>
                        </View>
                    </View>

                    )
                } 
            }
            />
        </Box>

        <View style={styles.pagination}>
          <Pressable
            disabled={page === 1}
            onPress={() => setPage(page - 1)}
          >
            <Text style={page === 1 ? styles.disabled : styles.button}>
              Anterior
            </Text>
          </Pressable>

          <Text>
            Página {page} de {totalPages}
          </Text>

          <Pressable
            disabled={page === totalPages}
            onPress={() => setPage(page + 1)}
          >
            <Text
              style={
                page === totalPages ? styles.disabled : styles.button
              }
            >
              Próxima
            </Text>
          </Pressable>
        </View>
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
    paddingBottom: 200
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
  action: {
    color: '#2563eb',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  bipButton: {
    backgroundColor: '#3b3b57',
    width: '50%',
    padding: 5,
    borderRadius: 5,
  },
  bipText: {
    color: 'ghostwhite',
    textAlign: 'center',
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.4
  }
});
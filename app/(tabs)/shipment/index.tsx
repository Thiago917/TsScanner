import { Box } from '@/components/ui/box';
import { useSalesOrders } from '@/contexts/salesOrdersContext';
import * as NavigationBar from 'expo-navigation-bar';
import { Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const api_url = process.env.EXPO_PUBLIC_API_URL;

export default function Home() {

  const [data, setData] = useState<any[]>([]);
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [refreshing, setRefreshing] = useState(false);

  const {salesOrders, loadSalesOrders} = useSalesOrders();
  const inputRef = useRef<TextInput | null>(null);

  const itemsPerPage = 4;

  useEffect(() => {
    NavigationBar.setVisibilityAsync('hidden')
    NavigationBar.setBehaviorAsync('overlay-swipe')

    loadSalesOrders();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSalesOrders();
    setRefreshing(false);
  };
  const filteredData = salesOrders.filter((item) =>
    String(item.order_code)
      .includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const paginatedData = filteredData.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

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
            setPage(1); 
          }}
          style={styles.search}
        />

        <Box className="rounded-lg overflow-hidden">
            <View style={styles.header}>
              <Text style={[styles.cell, styles.headerText]}>Produto</Text>
              <Text style={[styles.cell, styles.headerText]}>Quantidade</Text>
              <Text style={[styles.cell, styles.headerText]}>Separar</Text>
            </View>
              <FlatList
                data={paginatedData}
                keyExtractor={(item) => String(item.id)}
                refreshing={refreshing}
                onRefresh={onRefresh}
                renderItem={({item}) => (
                  <View style={styles.row}>

                    <View style={styles.cell}>
                      <Text style={{fontWeight: 'bold', color: '#0abb87'}}>{item.order_code}</Text>
                      <Text>
                        {item.items_sum_quantity > 0
                          ? (
                              (Number(item.items_sum_separated) /
                                Number(item.items_sum_quantity)) *
                              100
                            ).toFixed(0)
                          : 0}
                        %
                      </Text>
                    </View>

                    <View style={styles.cell}>
                      <Text>Total: {Number(item.items_sum_quantity).toFixed(0)}</Text>
                      <Text>Separado: {Number(item.items_sum_separated).toFixed(0)}</Text>
                    </View>

                    <View style={styles.cell}>
                      {
                      Number(item.items_sum_separated) > 0 && Number(item.items_sum_separated) < Number(item.items_sum_quantity) ? (
                          <Link href={{pathname:'/shipment/bip/[order]', params:{
                            order: String(item.order_code),
                            amount: Number(item.items_sum_quantity)
                          }}} asChild>
                            <TouchableOpacity style={styles.bipButton}>
                                <Text style={styles.bipText}>Retomar</Text>
                            </TouchableOpacity>
                          </Link>
                        ) : Number(item.items_sum_separated) > 0 && Number(item.items_sum_separated) >= Number(item.items_sum_quantity) ? (
                          <TouchableOpacity disabled style={[styles.bipButton, styles.disabledButton]}>
                            <Text style={styles.bipText}>Ok</Text>
                          </TouchableOpacity>
                        ) : (
                          <Link href={{pathname:'/shipment/bip/[order]', params:{
                            order: String(item.order_code),
                            amount: Number(item.items_sum_quantity)
                          }}} asChild>
                            <TouchableOpacity style={styles.bipButton}>
                                <Text style={styles.bipText}>Iniciar</Text>
                            </TouchableOpacity>
                          </Link>
                        )
                      }
                    </View>
                  </View>
                )}
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
import { Box } from '@/components/ui/box';
import { useSalesOrders } from '@/contexts/salesOrdersContext';
import { Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const api_url = process.env.EXPO_PUBLIC_API_URL;
export default function Home() {
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [refreshing, setRefreshing] = useState(false);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [totalPages, setPages] = useState<number>(1);
  const [paginated, setPaginated] = useState<any[]>([]);

  // Blindagem contra contexto undefined
  const { salesOrders = [], loadSalesOrders } = useSalesOrders() || {};
  const inputRef = useRef<TextInput | null>(null);

  const itemsPerPage = 4;

  useEffect(() => {
    // Garante que salesOrders é um array antes de filtrar
    const dataToFilter = Array.isArray(salesOrders) ? salesOrders : [];

    const filteredData = dataToFilter.filter((item) =>
      String(item.order_code || "")
        .toLowerCase()
        .includes(search.toLowerCase())
    );

    setFiltered(filteredData);
    setPages(Math.ceil(filteredData.length / itemsPerPage) || 1);

    // Paginação baseada nos dados filtrados
    const start = (page - 1) * itemsPerPage;
    const paginatedData = filteredData.slice(start, start + itemsPerPage);
    setPaginated(paginatedData);

  }, [salesOrders, search, page]); // Adicionei page aqui para a paginação funcionar

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSalesOrders();
    setRefreshing(false);
  };

  return (
      <View style={{ flex: 1}}>
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

        <Box className="rounded-lg overflow-hidden">
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
                renderItem={({item}) => {
                  // TRATAMENTO DE VALORES NULL PARA O CÁLCULO
                  const total = Number(item.items_sum_quantity || 0);
                  const sep = Number(item.items_sum_separated || 0);
                  const percent = total > 0 ? ((sep / total) * 100).toFixed(0) : 0;

                  return (
                    <View style={styles.row}>
                      <View style={styles.cell}>
                        <Text style={{fontWeight: 'bold', color: '#0abb87'}}>{item.order_code}</Text>
                        <Text>{percent}%</Text>
                      </View>

                      <View style={styles.cell}>
                        <Text>Total: {total.toFixed(0)}</Text>
                        <Text>Separado: {sep.toFixed(0)}</Text>
                      </View>

                      <View style={styles.cell}>
                        {sep > 0 && sep >= total && total > 0 ? (
                            <TouchableOpacity disabled style={[styles.bipButton, styles.disabledButton]}>
                              <Text style={styles.bipText}>Ok</Text>
                            </TouchableOpacity>
                          ) : (
                            <Link href={{pathname:'/shipment/bip/[order]', params:{
                              order: String(item.order_code),
                              amount: total
                            }}} asChild>
                              <TouchableOpacity style={styles.bipButton}>
                                  <Text style={styles.bipText}>{sep > 0 ? 'Retomar' : 'Iniciar'}</Text>
                              </TouchableOpacity>
                            </Link>
                          )
                        }
                      </View>
                    </View>
                  )
                }}
              />
        </Box>

        <View style={styles.pagination}>
          <Pressable disabled={page === 1} onPress={() => setPage(page - 1)}>
            <Text style={page === 1 ? styles.disabled : styles.button}>Anterior</Text>
          </Pressable>
          <Text>Página {page} de {totalPages}</Text>
          <Pressable disabled={page === totalPages} onPress={() => setPage(page + 1)}>
            <Text style={page === totalPages ? styles.disabled : styles.button}>Próxima</Text>
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
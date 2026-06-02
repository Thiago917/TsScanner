import { useSalesOrders } from '@/contexts/salesOrdersContext';
import { Ionicons } from '@expo/vector-icons';
import { HeaderBackButton } from '@react-navigation/elements';
import * as NavigationBar from 'expo-navigation-bar';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, BackHandler, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const api_url = process.env.EXPO_PUBLIC_API_URL;
const main_color = process.env.EXPO_PUBLIC_MAIN_COLOR;

export default function ShipmentConferenceDetail() {
  const { sale } = useLocalSearchParams<{ sale: string }>();
  const router = useRouter();
  const navigation = useNavigation();

  const [items, setItems] = useState<any[]>([]);
  const [current, setCurrent] = useState<any>({});
  const [loading, setLoading] = useState<boolean>(false);
  const { saleChecking, updateSalesOrders } = useSalesOrders();

  useEffect(() => {
    NavigationBar.setVisibilityAsync('hidden');
    NavigationBar.setBehaviorAsync('overlay-swipe');
    loadOrderDetails();
  }, []);

  useEffect(() => {
    navigation.setOptions({
      headerLeft: (props: any) => (
        <HeaderBackButton {...props} onPress={handleBackAttempt} />
      ),
    });

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      handleBackAttempt
    );

    return () => {
      backHandler.remove();
    };
  }, [navigation]);

  const handleBackAttempt = (): boolean => {
    Alert.alert('Aviso de Saída', 'Você tem certeza que deseja sair?', [
      {
        text: 'Continuar separando', style: 'cancel', onPress: () => {}
      },
      {
        text: 'Sair', style: 'destructive', onPress: () => {router.back()}
      }
    ])
    return true;
  }

  const getDate = async (now: Date) => {
    const mysqlDateTime = now.getFullYear() + '-' +
        String(now.getMonth() + 1).padStart(2, '0') + '-' +
        String(now.getDate()).padStart(2, '0') + ' ' +
        String(now.getHours()).padStart(2, '0') + ':' +
        String(now.getMinutes()).padStart(2, '0') + ':' +
        String(now.getSeconds()).padStart(2, '0');
    return mysqlDateTime;        
  }

  const loadOrderDetails = async () => {
    setLoading(true);
    try {
      const filter = saleChecking.find((so) => String(so.order_code) === String(sale) || String(so.id) === String(sale));
      
      if (filter) {
        const itemsWithCheck = filter.items.map((i: any) => ({ ...i, checked: false }));
        setItems(itemsWithCheck);
        setCurrent(filter);

        if(filter.checking_at === null){
            const now = await getDate(new Date())
            updateSalesOrders(sale, {"checking_at": now})
        }
      } else {
        setItems([]);
        Alert.alert('Erro', `Pedido ${sale} não encontrado.`);
      }

    } catch (err) {
      console.log(err);
      Alert.alert('Erro', `Erro ao carregar itens do pedido ${sale}.`);
    } finally {
      setLoading(false);
    }
  };

  const toggleCheck = (index: number) => {
    const updated = [...items];
    updated[index].checked = !updated[index].checked;
    setItems(updated);
  };

  const handleSendData = async () => {
    const allChecked = items.every(item => item.checked);
    if (!allChecked) {
      Alert.alert('Pendência', 'Existem itens que ainda não foram marcados como OK.');
      return;
    }
    try{
        const now = await getDate(new Date())
        updateSalesOrders(sale, {"checked_at": now, "status": 2})
        Alert.alert('Sucesso', 'Parabéns, conferência realizada com sucesso! ✅')
        router.replace('/ship-checking')
    }
    catch(err){
        Alert.alert('Erro', `${err}`)
        return;
    }
  }

  const renderItem = ({ item, index }: { item: any; index: number }) => (
    <View style={[styles.card, item.checked && styles.cardChecked]}>
      <View style={styles.cell}>
        <Text style={styles.subText}>Item</Text>
        <Text style={styles.bold}>{item.product_code}</Text>
      </View>

      <View style={[styles.cell, { alignItems: 'center' }]}>
        <Text style={styles.qtyText}>
          Qtd. Pedida: {Number(item.quantity).toFixed(0)}
        </Text>
        <Text style={[styles.pickedText, [Number(item.separated) < Number(item.quantity) ? { color: '#e62222' } : { color: '#0abb87' }]]}>
          Separado: {Number(item.separated).toFixed(0)}
        </Text>
      </View>

      <TouchableOpacity style={styles.checkArea} onPress={() => toggleCheck(index)} activeOpacity={0.7}>
        <Ionicons 
          name={item.checked ? "checkmark-circle" : "radio-button-off"} 
          size={30} 
          color={item.checked ? "#0abb87" : "#3b3b57"} 
        />
        <Text style={[styles.checkLabel, { color: item.checked ? "#0abb87" : "#3b3b57" }]}>
          {item.checked ? "OK" : "Conferir"}
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && items.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3b3b57" />
        <Text style={{ marginTop: 10 }}>Carregando itens do pedido...</Text>
      </View>
    );
  }

  const allChecked = items.length > 0 && items.every(item => item.checked);

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      
      <View style={styles.headerTitle}>
        <Text style={styles.h1}>
          Pedido: <Text style={{ color: '#0abb87' }}>{sale}</Text>
        </Text>
      </View>

      <FlatList data={items} keyExtractor={(item, index) => String(item.id || index)} renderItem={renderItem} contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Nenhum item encontrado.</Text>
        }/>

      <View style={styles.footer}>
        <TouchableOpacity key={allChecked ? 'ready-to-go' : 'not-ready'} activeOpacity={0.8} onPress={() => {if (allChecked && !loading) {handleSendData();}}}
          style={{
            padding: 16,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            width: '95%',
            backgroundColor: allChecked ? main_color : '#3b3b57',
            opacity: allChecked ? 1.0 : 0.5,
            elevation: allChecked ? 4 : 0, 
          }}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{fontWeight: 'bold', color: '#fff', fontSize: 16, opacity: allChecked ? 1 : 0.6}}>Finalizar Conferência</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    paddingHorizontal: 20,
    paddingVertical: 25,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  h1: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3b3b57',
  },
  listContainer: {
    padding: 15,
    paddingBottom: 120,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#888',
  },
  card: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
    elevation: 2,
  },
  cardChecked: {
    borderColor: '#0abb87',
    backgroundColor: '#f6fffb',
  },
  cell: {
    flex: 1,
    justifyContent: 'center',
  },
  subText: {
    fontSize: 10,
    color: '#aaa',
  },
  qtyText: {
    fontSize: 13,
    color: '#444',
  },
  pickedText: {
    fontSize: 13,
    color: '#0abb87',
    fontWeight: 'bold',
    marginTop: 2,
  },
  checkArea: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
  },
  checkLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    marginTop: 4,
  },
  bold: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#3b3b57',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    alignItems: 'center',
  },
});

import { useOrders } from '@/contexts/ProductionOrdersContext';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { HeaderBackButton } from '@react-navigation/elements';
import axios from 'axios';
import * as Crypto from 'expo-crypto';
import * as NavigationBar from 'expo-navigation-bar';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, BackHandler, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const api_url = process.env.EXPO_PUBLIC_API_URL;
const main_color = process.env.EXPO_PUBLIC_MAIN_COLOR;

export default function ConferenceDetail() {
  const router = useRouter();
  const navigation = useNavigation();

  const [items, setItems] = useState<any[]>([]);
  const [current, setCurrent] = useState<any>({});
  const [loading, setLoading] = useState<boolean>(false);
  const {checking, setOrders} = useOrders()
  const { conferenceOp } = useLocalSearchParams<{ conferenceOp: string }>();

  useEffect(() => {
    NavigationBar.setVisibilityAsync('hidden');
    NavigationBar.setBehaviorAsync('overlay-swipe');
    loadOpDetails();
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
  
  const getDate = async (now: Date) => {
    const mysqlDateTime = now.getFullYear() + '-' +
        String(now.getMonth() + 1).padStart(2, '0') + '-' +
        String(now.getDate()).padStart(2, '0') + ' ' +
        String(now.getHours()).padStart(2, '0') + ':' +
        String(now.getMinutes()).padStart(2, '0') + ':' +
        String(now.getSeconds()).padStart(2, '0');
    return mysqlDateTime;        
  }

  const handleBackAttempt = (): boolean => {
    Alert.alert('Aviso de Saída', 'Você tem certeza que deseja sair?', [
      {
        text: 'Continuar conferindo', style: 'cancel', onPress: () => {}
      },
      {
        text: 'Sair', style: 'destructive', onPress: () => {router.back()}
      }
    ])
    return true;
  }

  const loadOpDetails = async () => {
    setLoading(true);
    try {
      const filter = checking.find((op) => !op.isReq ? String(op.order_code) === String(conferenceOp) : String(op.id) === String(conferenceOp));
      
      if (filter) {
        setCurrent(filter);
        if(filter.checking_at === null){
          const now = await getDate(new Date());
          const orderId = !filter.isReq ? filter.order_code : `REQ-${filter.id}`;
          await setOrders(orderId, { "status": 7 , 'checking_at': now });
        }        

        if (items.length === 0) {
          const itemsWithCheck = filter.items.map((i: any) => ({ ...i, checked: false }));
          setItems(itemsWithCheck);
          console.log("Itens de conferência carregados pela primeira vez.");
        }

      } else {
        setItems([]);
      }

    } catch (err) {
      console.log(err);
      Alert.alert('Erro', `Erro ao carregar itens da O.P ${conferenceOp}.`);
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

    const newConf = {
      op: !current.isReq ? current.order_code : `REQ-${current.id}`,
      prods: items.map((item) => ({
        code: item.product_code,
        picked: item.separated,
        measure: item.measure
      })),
      uid: Crypto.randomUUID(),
      status: 'pending'
    }

    try{
      const saved = await AsyncStorage.getItem('checking_queue');
      const parsed = saved ? JSON.parse(saved) : [];
      parsed.push(newConf);
      await AsyncStorage.setItem('checking_queue', JSON.stringify(parsed));

      const conn = await NetInfo.fetch();
      
      if(conn.isConnected){
        finalizeChecking(newConf);
      }
      else{
        setTimeout(() => {
          setLoading(true)
          Alert.alert('Sem conexão', 'Não se preocupe, a conferência será enviada automaticamente quando a conexão for restabelecida.', [
            {
              'text': 'Entendi',
              'onPress': () => {
                router.replace('/warehouse')
              }
            }
          ]);
          setLoading(false)
        }, 1000)
      }
    }
    catch(err){
      console.log('Erro no fluxo do Offline-first:', err)
    }
  }

  const finalizeChecking = async (data: any) => {
    setLoading(true);
    try {

      const response = await axios.post(`${api_url}/warehouse/move-to-slot`, data);
      const res = response.data

      if(res.error){
        Alert.alert("Erro", res.message);
        return;
      }

      const saved = await AsyncStorage.getItem('checking_queue');
      if(saved){
        const parsed = JSON.parse(saved);
        const filtered = parsed.filter((item: any) => item.uid !== data.uid);
        await AsyncStorage.setItem('checking_queue', JSON.stringify(filtered));
      }

      const now = await getDate(new Date())
      const orderId = !current.isReq ? current.order_code : `REQ-${current.id}`;
      setOrders(orderId, {"checked_at": now });
      Alert.alert('Sucesso!', 'Conferência finalizada e produtos despachados!', [
        { text: 'Ok', onPress: () => router.replace('/(protected)/(tabs)/checking') }
      ]);
    } 

    catch (err) {
      console.log(err);
      Alert.alert(
        'Instabilidade de Rede', 
        'Não conseguimos sincronizar com o servidor agora, mas fique tranquilo: sua conferência está salva no aparelho e será reenviada assim que a conexão for reestabelecida.',
        [{ text: 'Entendi', onPress: () => router.replace('/warehouse') }]
      );
    } 
    finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item, index }: { item: any; index: number }) => (
    <View style={[styles.card, item.checked && styles.cardChecked]}>
      <View style={styles.cell}>
        <Text style={styles.subText}>Item</Text>
        <Text style={styles.bold}>{item.product_code || item.cod}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{fontSize: 10, color: '#666', flex: 1}} numberOfLines={1} ellipsizeMode="tail">{item.description || item.family_desc}</Text>
          {(item.description && item.description.length >= 22) ? (
            <>
                <TouchableOpacity onPress={() => Alert.alert('Descrição', item.description)}>
                  <Text style={{fontSize: 10, color: '#666', flex: 1}} numberOfLines={1} ellipsizeMode="tail">{item.description}</Text>
                </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={{fontSize: 10, color: '#666', flex: 1}} numberOfLines={1} ellipsizeMode="tail">{item.description}</Text>
            </>
          )}
        </View>
      </View>

      <View style={[styles.cell, { alignItems: 'center' }]}>
        <Text style={styles.qtyText}>
          Qtd. Pedida: {Number(item.quantity).toFixed(0)}
        </Text>
        <Text style={[styles.pickedText, [Number(item.separated) !== Number(item.quantity) ? { color: '#e62222' } : { color: '#0abb87' }]]}>
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
        <Text style={{ marginTop: 10 }}>Carregando itens da separação...</Text>
      </View>
    );
  }

  const allChecked = items.length > 0 && items.every(item => item.checked);

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      
      <View style={styles.headerTitle}>
        <Text style={styles.h1} onPress={() => Alert.alert('Detalhes do Item', `${current.manufacture_cod} - ${current.manufacture_desc}`)}>
          {!current.isReq ? 'OP:': ''} <Text style={{ color: '#0abb87' }}>#{!current.isReq ? conferenceOp : `REQ-${current.id.toString().padStart(5, '0')}`}</Text>
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
            <Text style={{fontWeight: 'bold', color: '#fff', fontSize: 16, opacity: allChecked ? 1 : 0.6}}>Finalizar e Despachar</Text>
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
  mainButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontWeight: 'bold',
    color: '#fff',
    fontSize: 16,
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
  disabledButton: {
    opacity: 0.5,
  },
});


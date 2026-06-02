import { useUser } from "@/contexts/UserContext";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Profile() {
  const {user} = useUser()
  const [dept, setDept] = useState<string>('Colaborador')

  useEffect(() => {
    const loadInfo = async () => {
      const role = user?.departments_id;
      
      if (role === 12) setDept("Expedição");
      else if (role === 6) setDept("Almoxarifado");
      else if (role === -1) setDept("Administrador");

    };
    loadInfo();
  }, []);


  const handleLogout = () => {
    Alert.alert("Sair", "Deseja realmente encerrar sua sessão?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.clear();
          router.replace("/login");
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarCircle}>
          <Ionicons name="person" size={50} color="ghostwhite" />
        </View>
        <Text style={styles.title}>{user?.name}</Text>
      </View>

      <View style={styles.infoCard}>
        <View style={styles.row}>
          <Text style={styles.label}>Departamento</Text>
          <Text style={styles.value}>{dept}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>ID de Acesso</Text>
          <Text style={styles.value}>#{user?.departments_id}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="ghostwhite" style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Encerrar Sessão</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 30,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#3b3b57",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#3b3b57",
  },
  infoCard: {
    backgroundColor: "#e8e8e8",
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#ccc",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  label: {
    fontWeight: "bold",
    color: "#3b3b57",
  },
  value: {
    color: "#666",
  },
  footer: {
    marginTop: "auto",
    marginBottom: 20,
    alignItems: "center",
  },
  logoutButton: {
    backgroundColor: "#3b3b57",
    flexDirection: "row",
    width: "100%",
    padding: 15,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  logoutText: {
    color: "ghostwhite",
    fontWeight: "bold",
    fontSize: 16,
  },
});
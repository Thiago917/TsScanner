import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity, // Adicionado para poder fechar o teclado ao tocar fora
  View
} from 'react-native';

export default function Login() {

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const emailRef = useRef<TextInput>(null); 
  const passwordRef = useRef<TextInput>(null); 
  const [loading, setLoading] = useState<boolean>(false)

  const api_url = process.env.EXPO_PUBLIC_API_URL;

  const handleLogin = async () => {

    setLoading(true)
    
    const {error, message, data} = await validLogin(email)

    if(error) Alert.alert('Erro', `${message}`)
    
    try{
      // Alert.alert(`Ta chamando a rota ${api_url}/login com os parametros: email: ${data}, password: ${password}`)
      const response = await axios.post(`${api_url}/login`, {
        email: data,
        password: password
      })

      const res = response.data

      if(res.error){
        Alert.alert('Erro', `${res.message}`);
        return;
      }

      setEmail('');
      setPassword('');  

      await AsyncStorage.setItem('@userToken', res.token)
      await AsyncStorage.setItem('@userRole', String(res.user.departments_id))

      switch(res.user.departments_id){
        case 12:
          router.replace('/shipment')
          break;
        case 6:
          router.replace('/warehouse')
          break;
        default:
          router.replace('/shipment')
          break;
      }
    }
    catch(err){
      console.log(`Error: ${err}`)
    }
    finally{
      setLoading(false)
    }
  };

  const validLogin = async (email: string) => {

    if(email === '') return {message: 'Email inválido', error: true}

    const mail = email.includes('@') ? email : `${email}@tsshara.com.br`;

    return {message: 'Email válido', error: false, data: mail}
  }

  // Foca no input de email quando a tela é focada
  useFocusEffect(
    React.useCallback(() => {
      emailRef.current?.focus();
    }, [])
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.logoBox}><Text style={styles.logoText}>TS Scanner</Text></View>
          <Text style={styles.title}>Bem-vindo de volta</Text>
          <Text style={styles.subtitle}>Acesse sua conta para continuar</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>E-mail</Text>
            <TextInput
              ref={emailRef} 
              style={styles.input}
              placeholder="@tsshara.com.br"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false} 
              returnKeyType="next"
              placeholderTextColor={'#afafaf'}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Senha</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                ref={passwordRef} // Adicionado ref
                style={styles.passwordInput}
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
                placeholderTextColor={'#afafaf'}
              />
              <TouchableOpacity 
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons 
                  name={showPassword ? "eye-off-outline" : "eye-outline"} 
                  size={22} 
                  color={showPassword ? "#343447bb" : "#343447"} 
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.forgotPassword} onPress={() => Alert.alert('Esqueceu a senha?', 'Funcionalidade ainda não implementada.')}>
            <Text style={styles.forgotPasswordText}>Esqueceu sua senha?</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Botão de Login e Rodapé movidos para fora do ScrollView */}
      <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={loading}>
        {loading ? (
          <ActivityIndicator color={'#fff'} />
        ) : (
          <Text style={styles.loginButtonText}>Entrar na conta</Text>
        )}
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoBox: {
    height: 60,
    width: 120,
    backgroundColor: '#3b3b57', // Cor que você usou nos botões
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    marginTop: 70,
  },
  logoText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3b3b57',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b3b57',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc', // Mesma cor de borda que você usou no search
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#343447'

  },
  eyeIcon: {
    paddingHorizontal: 12,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 30,
  },
  forgotPasswordText: {
    color: '#3b3b57',
    fontSize: 14,
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: '#3b3b57', // Azul escuro padrão do seu app
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    marginBottom: 20, 
    elevation: 3,
    width: '80%',
    alignSelf: 'center'
  },
  loginButtonText: {
    color: 'ghostwhite',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  footerText: {
    color: '#666',
    fontSize: 14,
  },
  signUpText: {
    color: '#0abb87', // Verde padrão de destaque do seu app
    fontSize: 14,
    fontWeight: 'bold',
  },
});
           
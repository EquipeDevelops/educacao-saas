import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function LoginScreen() {
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");

  function handleLogin() {
    console.log("Usuário:", usuario);
    console.log("Senha:", senha);
    // aqui você chama sua API / navegação
  }

  function handleVisitorAccess() {
    console.log("Entrar como visitante");
  }

  return (
    <LinearGradient colors={["#20C997", "#0EA5E9"]} style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoWrapper}>
          <Text style={styles.logoIcon}>✚</Text>
        </View>

        {/* Título */}
        <Text style={styles.title}>Conquista Diária</Text>
        <Text style={styles.subtitle}>
          Transforme pequenos hábitos em grandes conquistas
        </Text>

        {/* Card de login */}
        <View style={styles.card}>
          {/* Usuário */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Usuário</Text>
            <TextInput
              style={styles.input}
              placeholder="Digite seu usuário"
              placeholderTextColor="#A0AEC0"
              value={usuario}
              onChangeText={setUsuario}
            />
          </View>

          {/* Senha */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Senha</Text>
            <TextInput
              style={styles.input}
              placeholder="Digite sua senha"
              placeholderTextColor="#A0AEC0"
              secureTextEntry
              value={senha}
              onChangeText={setSenha}
            />
          </View>

          {/* Botão entrar */}
          <TouchableOpacity onPress={handleLogin} activeOpacity={0.8}>
            <LinearGradient
              colors={["#22C55E", "#0EA5E9"]}
              style={styles.loginButton}
            >
              <Text style={styles.loginButtonText}>Entrar na Plataforma</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Acesso demo */}
          <Text style={styles.demoText}>
            Acesso demo: <Text style={styles.demoLink}>demo</Text> •{" "}
            <Text style={styles.demoLink}>demo</Text>
          </Text>
        </View>

        {/* Botão visitante */}
        <TouchableOpacity
          style={styles.visitorButton}
          onPress={handleVisitorAccess}
          activeOpacity={0.8}
        >
          <Text style={styles.visitorButtonText}>
            ⚡ Acesso Rápido como Visitante
          </Text>
        </TouchableOpacity>

        {/* Rodapé */}
        <Text style={styles.footer}>
          © 2024 Conquista Diária • Desenvolvido com ❤️ para o seu crescimento
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 32,
    alignItems: "center",
  },
  logoWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  logoIcon: {
    fontSize: 32,
    color: "#FFFFFF",
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    marginTop: 4,
    marginBottom: 24,
  },
  card: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 24,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4A5568",
    marginBottom: 6,
  },
  input: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 12,
    fontSize: 14,
    color: "#1A202C",
    backgroundColor: "#F7FAFC",
  },
  loginButton: {
    marginTop: 8,
    height: 46,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 15,
  },
  demoText: {
    marginTop: 12,
    fontSize: 12,
    textAlign: "center",
    color: "#A0AEC0",
  },
  demoLink: {
    color: "#0EA5E9",
    fontWeight: "600",
  },
  visitorButton: {
    width: "100%",
    height: 46,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.7)",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  visitorButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  footer: {
    marginTop: "auto",
    fontSize: 11,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
  },
});

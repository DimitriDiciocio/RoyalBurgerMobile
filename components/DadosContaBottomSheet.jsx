import React, { useState } from "react";
import { View, StyleSheet, Text, ScrollView, Alert } from "react-native";
import BottomSheet from "./BottomSheet";
import BotaoCheck from "./BotaoCheck";
import { updateProfile } from "../services";

// SVG do ícone de edição (pen.svg)
const penSvg = `<svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M11.0744 2.26332L9.88173 3.45598L13.5447 7.11895L14.7373 5.92629C15.0986 5.5677 15.3005 5.07895 15.3005 4.56895C15.3005 4.05895 15.0986 3.5702 14.7373 3.2116L13.7891 2.26332C13.4305 1.90207 12.9417 1.7002 12.4317 1.7002C11.9217 1.7002 11.433 1.90207 11.0744 2.26332ZM8.98126 4.35645L3.26501 10.07C2.98079 10.3543 2.7736 10.7102 2.66469 11.098L1.72438 14.4927C1.66329 14.7132 1.72438 14.9522 1.88907 15.1143C2.05376 15.2763 2.29016 15.34 2.51063 15.2789L5.90532 14.336C6.29313 14.2271 6.64641 14.0225 6.93329 13.7357L12.6442 8.01941L8.98126 4.35645Z" fill="white"/>
</svg>`;

export default function DadosContaBottomSheet({
  visible,
  onClose,
  userData,
  onUserDataUpdate,
}) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleEditName = () => {
    Alert.prompt(
      "Editar Nome",
      "Digite seu nome completo:",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Salvar",
          onPress: async (newName) => {
            if (newName && newName.trim()) {
              await updateUserField("full_name", newName.trim());
            }
          },
        },
      ],
      "plain-text",
      userData?.full_name || userData?.name || ""
    );
  };

  const handleEditCPF = () => {
    Alert.prompt(
      "Editar CPF",
      "Digite seu CPF (apenas números):",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Salvar",
          onPress: async (newCPF) => {
            if (newCPF && newCPF.replace(/\D/g, "").length === 11) {
              await updateUserField("cpf", newCPF.replace(/\D/g, ""));
            } else {
              Alert.alert("Erro", "CPF deve ter 11 dígitos");
            }
          },
        },
      ],
      "plain-text",
      userData?.cpf || ""
    );
  };

  const handleEditBirthdate = () => {
    Alert.prompt(
      "Editar Data de Nascimento",
      "Digite sua data de nascimento (DD/MM/AAAA):",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Salvar",
          onPress: async (newDate) => {
            if (newDate && newDate.trim()) {
              // Converte DD/MM/AAAA para DD-MM-AAAA (formato da API)
              const formattedDate = newDate.replace(/\//g, "-");
              await updateUserField("date_of_birth", formattedDate);
            }
          },
        },
      ],
      "plain-text",
      userData?.date_of_birth || ""
    );
  };

  const handleEditEmail = () => {
    Alert.prompt(
      "Editar Email",
      "Digite seu novo email:",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Salvar",
          onPress: async (newEmail) => {
            if (newEmail && newEmail.trim()) {
              await updateUserField("email", newEmail.trim());
            }
          },
        },
      ],
      "email-address",
      userData?.email || ""
    );
  };

  const handleEditPhone = () => {
    Alert.prompt(
      "Editar Telefone",
      "Digite seu telefone:",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Salvar",
          onPress: async (newPhone) => {
            if (newPhone && newPhone.trim()) {
              await updateUserField("phone", newPhone.replace(/\D/g, ""));
            }
          },
        },
      ],
      "phone-pad",
      userData?.phone || ""
    );
  };

  const updateUserField = async (field, value) => {
    if (isUpdating) return;

    setIsUpdating(true);
    try {
      await updateProfile({ [field]: value });
      Alert.alert("Sucesso", "Dados atualizados com sucesso!");

      // Notifica o componente pai para atualizar os dados
      if (onUserDataUpdate) {
        onUserDataUpdate();
      }
    } catch (error) {
      const errorMessage =
        error?.response?.data?.error ||
        error?.message ||
        "Erro ao atualizar dados";
      Alert.alert("Erro", errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  // Função para formatar CPF
  const formatCPF = (cpf) => {
    if (!cpf) return "CPF não informado.";
    const cleaned = cpf.replace(/\D/g, "");
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    }
    return cpf;
  };

  // Função para formatar telefone
  const formatPhone = (phone) => {
    if (!phone) return "Telefone não informado.";
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    } else if (cleaned.length === 10) {
      return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
    }
    return phone;
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} heightPercentage={0.75}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Seção: Informações do usuário */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações do usuário</Text>

          <BotaoCheck
            title="Nome Completo"
            description={
              userData?.full_name || userData?.name || "Nome não informado."
            }
            iconSvg={penSvg}
            onPress={handleEditName}
          />

          <BotaoCheck
            title="CPF"
            description={formatCPF(userData?.cpf)}
            iconSvg={penSvg}
            onPress={handleEditCPF}
          />

          <BotaoCheck
            title="Data de nascimento"
            description={
              userData?.date_of_birth || "Data de nascimento não informada."
            }
            iconSvg={penSvg}
            onPress={handleEditBirthdate}
          />
        </View>

        {/* Seção: Informações de contato */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações de contato</Text>

          <BotaoCheck
            title="Email"
            description={userData?.email || "Email não informado."}
            iconSvg={penSvg}
            onPress={handleEditEmail}
          />

          <BotaoCheck
            title="Telefone"
            description={formatPhone(userData?.phone)}
            iconSvg={penSvg}
            onPress={handleEditPhone}
          />
        </View>
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 25,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 15,
  },
});

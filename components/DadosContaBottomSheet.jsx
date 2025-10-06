import React, { useState } from "react";
import { View, StyleSheet, Text, ScrollView, Alert } from "react-native";
import BottomSheet from "./BottomSheet";
import BotaoCheck from "./BotaoCheck";
import EditarDadoBottomSheet from "./EditarDadoBottomSheet";
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
  const [showEditSheet, setShowEditSheet] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [editingValue, setEditingValue] = useState("");
  const [editingTitle, setEditingTitle] = useState("");
  const [editingPlaceholder, setEditingPlaceholder] = useState("");
  const [editingKeyboardType, setEditingKeyboardType] = useState("default");
  const [editingMaxLength, setEditingMaxLength] = useState(null);

  const openEditSheet = (field, title, placeholder, keyboardType = "default", maxLength = null) => {
    const currentValue = userData?.[field] || "";
    setEditingField(field);
    setEditingValue(currentValue);
    setEditingTitle(title);
    setEditingPlaceholder(placeholder);
    setEditingKeyboardType(keyboardType);
    setEditingMaxLength(maxLength);
    setShowEditSheet(true);
  };

  const handleEditName = () => {
    openEditSheet("full_name", "Editar Nome", "Digite seu nome completo");
  };

  const handleEditCPF = () => {
    openEditSheet("cpf", "Editar CPF", "Digite seu CPF (apenas números)", "numeric", 11);
  };

  const handleEditBirthdate = () => {
    openEditSheet("date_of_birth", "Editar Data de Nascimento", "Digite sua data de nascimento", "numeric", 10);
  };

  const handleEditEmail = () => {
    openEditSheet("email", "Editar Email", "Digite seu novo email", "email-address");
  };

  const handleEditPhone = () => {
    openEditSheet("phone", "Editar Telefone", "Digite seu telefone", "phone-pad");
  };

  const handleSaveEdit = (newValue) => {
    // Notifica o componente pai para atualizar os dados
    if (onUserDataUpdate) {
      onUserDataUpdate();
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

  // Função para formatar data de nascimento
  const formatBirthdate = (date) => {
    if (!date) return "Data de nascimento não informada.";
    
    // Se está no formato AAAA-MM-DD, converte para DD/MM/AAAA
    if (date.includes('-')) {
      const parts = date.split('-');
      if (parts.length === 3) {
        // Verifica se é formato AAAA-MM-DD (ano com 4 dígitos no início)
        if (parts[0].length === 4) {
          const [year, month, day] = parts;
          return `${day}/${month}/${year}`;
        } else {
          // Se é DD-MM-AAAA, converte para DD/MM/AAAA
          const [day, month, year] = parts;
          return `${day}/${month}/${year}`;
        }
      }
    }
    
    // Se já está no formato DD/MM/AAAA, retorna como está
    if (date.includes('/')) {
      return date;
    }
    
    return date;
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
            description={formatBirthdate(userData?.date_of_birth)}
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

      {/* Bottom Sheet de Edição */}
      <EditarDadoBottomSheet
        visible={showEditSheet}
        onClose={() => setShowEditSheet(false)}
        field={editingField}
        currentValue={editingValue}
        onSave={handleSaveEdit}
        title={editingTitle}
        placeholder={editingPlaceholder}
        keyboardType={editingKeyboardType}
        maxLength={editingMaxLength}
      />
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

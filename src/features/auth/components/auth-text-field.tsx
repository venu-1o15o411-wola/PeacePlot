import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { TextInput, View } from "react-native";

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  placeholderTextColor: string;
  iconColor: string;
  styles: ReturnType<typeof import("@/features/auth/styles/auth-form-styles").createAuthStyles>;
  keyboardType?: "default" | "email-address";
  secureTextEntry?: boolean;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  autoCorrect?: boolean;
  rightNode?: React.ReactNode;
};

export function AuthTextField({
  icon,
  value,
  onChangeText,
  placeholder,
  placeholderTextColor,
  iconColor,
  styles,
  rightNode,
  ...inputProps
}: Props) {
  return (
    <View style={styles.field}>
      <View style={styles.inputRow}>
        <View style={styles.iconBox}>
          <Ionicons name={icon} size={20} color={iconColor} />
        </View>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={placeholderTextColor}
          style={styles.input}
          {...inputProps}
        />
        {rightNode}
      </View>
    </View>
  );
}

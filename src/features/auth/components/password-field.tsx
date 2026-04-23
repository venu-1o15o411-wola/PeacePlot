import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable } from "react-native";

import { AuthTextField } from "@/features/auth/components/auth-text-field";

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  secure: boolean;
  onToggleSecure: () => void;
  colors: { primary: string; textMuted: string; authInputIconFg: string };
  styles: ReturnType<typeof import("@/features/auth/styles/auth-form-styles").createAuthStyles>;
};

export function PasswordField({
  value,
  onChangeText,
  secure,
  onToggleSecure,
  colors,
  styles,
}: Props) {
  return (
    <AuthTextField
      icon="lock-closed"
      value={value}
      onChangeText={onChangeText}
      placeholder="Password"
      placeholderTextColor={colors.textMuted}
      iconColor={colors.authInputIconFg}
      secureTextEntry={secure}
      styles={styles}
      rightNode={
        <Pressable onPress={onToggleSecure} style={styles.eyeBtn} hitSlop={8}>
          <Ionicons name={secure ? "eye-off" : "eye"} size={22} color={colors.primary} />
        </Pressable>
      }
    />
  );
}

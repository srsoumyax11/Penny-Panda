import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';

interface ButtonProps {
  onPress: () => void;
  title: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  onPress,
  title,
  variant = 'primary',
  disabled = false,
  style,
  textStyle,
}: ButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[styles.button, styles[variant], disabled && styles.disabled, style]}
      activeOpacity={0.7}
    >
      <Text style={[styles.text, styles[`${variant}Text`], textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  primary: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  secondary: {
    backgroundColor: '#FFFFFF',
    borderColor: '#000000',
  },
  danger: {
    backgroundColor: '#FF0000',
    borderColor: '#FF0000',
  },
  outline: {
    backgroundColor: 'transparent',
    borderColor: '#000000',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
  },
  primaryText: {
    color: '#FFFFFF',
  },
  secondaryText: {
    color: '#000000',
  },
  dangerText: {
    color: '#FFFFFF',
  },
  outlineText: {
    color: '#000000',
  },
});

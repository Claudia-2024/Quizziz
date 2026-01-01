import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Image,
} from 'react-native';
import { useTheme } from '../../theme/global';

type ButtonVariant = 'primary' | 'secondary' | 'outline';

interface ButtonProps {
  title: string;
  onPress?: () => void;
  icon?: any;                       // require(...)
  iconPosition?: 'left' | 'right';
}

export default function IconButton({
  title,
  onPress,
  icon,
  iconPosition = 'left',
}: ButtonProps) {
  const theme = useTheme();
  const { colors, typography } = theme;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.button]}
    >
      {/* LEFT ICON */}
      {icon && iconPosition === 'left' && (
        <Image
          source={icon}
          style={[styles.icon, { marginRight: 10 }]}
          resizeMode="contain"
        />
      )}

      {/* TEXT */}
      <Text
        style={[
          styles.text,
          {
            color: colors.muted,
            fontFamily: typography.fontFamily.buttonText,
            fontSize: typography.fontSize.sm,
            paddingTop:5
          },
        ]}
      >
        {title}
      </Text>

      {/* RIGHT ICON */}
      {icon && iconPosition === 'right' && (
        <Image
          source={icon}
          style={[styles.icon, { marginLeft: 10 }]}
          resizeMode="contain"
        />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    fontWeight: '600',
  },
  icon: {
    width: 20,
    height: 20,
  },
});

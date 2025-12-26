import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  ViewStyle, 
  TextStyle, 
  Image 
} from 'react-native';
import { useTheme } from '../../theme/global'; 


type ButtonVariant = 'primary' | 'secondary' | 'outline';

interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: any;                  // image source (require())
  iconPosition?: 'left' | 'right';
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
  iconPosition = 'left',
}: ButtonProps) {

  const theme = useTheme();
  const { colors, typography, spacing, radius } = theme;

  const backgroundColor =
    variant === 'primary'
      ? colors.primary
      : variant === 'secondary'
      ? colors.secondary
      : 'transparent';

  const borderColor =
    variant === 'outline' ? colors.boxBorder : backgroundColor;

  const textColor =
    variant === 'outline' ? colors.primary : '#fff';


  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.button,
        {
          backgroundColor: disabled ? colors.muted : backgroundColor,
          borderColor: borderColor,
          borderWidth: variant === 'outline' ? 3 : 0,
          borderRadius: radius.sm,
          paddingVertical: 12,
          paddingHorizontal: 80,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <>
          {/* LEFT ICON */}
          {icon && iconPosition === 'left' && (
            <Image
              source={icon}
              style={[
                styles.icon,
                { tintColor: textColor, marginRight: 10 } // auto spacing 10
              ]}
              resizeMode="contain"
            />
          )}

          {/* TEXT */}
          <Text
            style={[
              styles.text,
              {
                color: textColor,
                fontFamily: typography.fontFamily.buttonText,
                fontSize: typography.fontSize.sm,
              },
              textStyle,
            ]}
          >
            {title}
          </Text>

          {/* RIGHT ICON */}
          {icon && iconPosition === 'right' && (
            <Image
              source={icon}
              style={[
                styles.icon,
                { tintColor: textColor, marginLeft: 10 } // auto spacing 10
              ]}
              resizeMode="contain"
            />
          )}
        </>
      )}
    </TouchableOpacity>
  );
}


const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',        // important: icon + text appear inline
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontWeight: '600',
  },
  icon: {
    width: 40,
    height: 30,
  },
});

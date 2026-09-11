import { forwardRef } from 'react';
import { Text as RNText, TextInput as RNTextInput, type TextInputProps, type TextProps } from 'react-native';

import { currentLocale, isRtlLocale } from '@/lib/i18n';

type ClassNameProps = { className?: string };

function rtlActive(): boolean {
  return isRtlLocale(currentLocale());
}

/**
 * Drop-in replacement for React Native's Text that writes right-to-left when
 * the app language is Arabic. Explicit alignment classes (text-center,
 * text-left, text-right) still win because writingDirection only changes the
 * meaning of the default "auto" alignment.
 */
export const Text = forwardRef<RNText, TextProps & ClassNameProps>(function Text({ style, ...rest }, ref) {
  return <RNText ref={ref} {...rest} style={rtlActive() ? [{ writingDirection: 'rtl' }, style] : style} />;
});

/** TextInput that types right-to-left in Arabic. */
export const TextInput = forwardRef<RNTextInput, TextInputProps & ClassNameProps>(function TextInput({ style, ...rest }, ref) {
  return <RNTextInput ref={ref} {...rest} style={rtlActive() ? [{ writingDirection: 'rtl', textAlign: 'right' }, style] : style} />;
});

import { forwardRef, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '@/constants/theme';
import { t } from '@/lib/i18n';
import { normalizeName } from '@/lib/utils';

interface QuickAddBarProps {
  onAdd: (name: string) => void;
  placeholder?: string;
  accessibilityLabel?: string;
  buttonLabel?: string;
}

/** Single-line input for quickly adding an ingredient by name. */
export const QuickAddBar = forwardRef<TextInput, QuickAddBarProps>(function QuickAddBar(
  { onAdd, placeholder, accessibilityLabel, buttonLabel },
  ref,
) {
  const [value, setValue] = useState('');
  const canSubmit = normalizeName(value).length > 0;

  const submit = () => {
    const name = normalizeName(value);
    if (!name) {
      // Pressing return on an empty field closes the keyboard.
      if (ref && typeof ref !== 'function') ref.current?.blur();
      return;
    }
    onAdd(name);
    setValue('');
  };

  return (
    <View className="mx-5 mb-3 flex-row items-center rounded-full border border-cream-300 bg-white pl-4 pr-1.5">
      <Ionicons name="add-circle-outline" size={20} color={colors.ink400} />
      <TextInput
        ref={ref}
        value={value}
        onChangeText={setValue}
        onSubmitEditing={submit}
        placeholder={placeholder ?? t('pantry.quickAddPlaceholder')}
        placeholderTextColor={colors.ink400}
        returnKeyType="done"
        submitBehavior={canSubmit ? 'submit' : 'blurAndSubmit'}
        autoCapitalize="sentences"
        autoCorrect
        accessibilityLabel={accessibilityLabel ?? t('pantry.quickAddLabel')}
        className="h-12 flex-1 px-3 text-base text-ink-900"
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={buttonLabel ?? t('pantry.quickAddButton')}
        disabled={!canSubmit}
        onPress={submit}
        className={`h-9 w-9 items-center justify-center rounded-full ${canSubmit ? 'bg-sage-600 active:bg-sage-700' : 'bg-cream-200'}`}
      >
        <Ionicons name="arrow-up" size={18} color={canSubmit ? '#ffffff' : colors.ink400} />
      </Pressable>
    </View>
  );
});

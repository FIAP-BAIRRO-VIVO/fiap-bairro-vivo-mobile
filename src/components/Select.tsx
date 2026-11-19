import { Check, ChevronDown } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleProp, Text, View, ViewStyle } from 'react-native';

import { colors, fonts, radius, type } from '@/theme';

import { BottomSheet } from './BottomSheet';

export interface SelectOption<T extends string> {
  value: T;
  label: string;
}

interface OptionSheetProps<T extends string> {
  visible: boolean;
  title: string;
  options: SelectOption<T>[];
  value: T;
  onSelect: (value: T) => void;
  onClose: () => void;
}

export function OptionSheet<T extends string>({
  visible,
  title,
  options,
  value,
  onSelect,
  onClose,
}: OptionSheetProps<T>) {
  return (
    <BottomSheet visible={visible} onClose={onClose} accessibilityLabel={title}>
      <Text style={[type.h2, { fontFamily: fonts.titulo }]}>{title}</Text>
      <View>
        {options.map((o) => {
          const selected = o.value === value;
          return (
            <Pressable
              key={o.value}
              onPress={() => {
                onSelect(o.value);
                onClose();
              }}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              style={{
                minHeight: 52,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottomWidth: 1,
                borderBottomColor: colors.linha,
              }}
            >
              <Text
                style={{
                  fontFamily: selected ? fonts.negrito : fonts.medio,
                  fontSize: 15,
                  color: selected ? colors.verdeEscuro : colors.asfalto,
                }}
              >
                {o.label}
              </Text>
              {selected ? <Check size={20} color={colors.verde} strokeWidth={2.4} /> : null}
            </Pressable>
          );
        })}
      </View>
    </BottomSheet>
  );
}

interface SelectFieldProps<T extends string> {
  label: string;
  options: SelectOption<T>[];
  value: T;
  onChange: (value: T) => void;
  error?: string;
  placeholder?: string;
  style?: StyleProp<ViewStyle>;
}

/** Campo de seleção no estilo dos formulários (52 px, cantos 14 px). */
export function SelectField<T extends string>({
  label,
  options,
  value,
  onChange,
  error,
  placeholder = 'Selecione',
  style,
}: SelectFieldProps<T>) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);
  return (
    <View style={[{ gap: 6 }, style]}>
      <Text style={{ fontFamily: fonts.semi, fontSize: 13, color: colors.asfalto }}>{label}</Text>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${current?.label ?? placeholder}`}
        style={{
          height: 52,
          paddingHorizontal: 14,
          borderWidth: 1.5,
          borderColor: error ? colors.sinal : colors.linha,
          borderRadius: radius.campo,
          backgroundColor: colors.superficie,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Text
          style={{
            fontFamily: fonts.regular,
            fontSize: 15,
            color: current ? colors.asfalto : colors.concreto,
          }}
        >
          {current?.label ?? placeholder}
        </Text>
        <ChevronDown size={18} color={colors.concreto} strokeWidth={2} />
      </Pressable>
      {error ? (
        <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: colors.sinalEscuro }}>
          {error}
        </Text>
      ) : null}
      <OptionSheet
        visible={open}
        title={label}
        options={options}
        value={value}
        onSelect={onChange}
        onClose={() => setOpen(false)}
      />
    </View>
  );
}

interface FilterSelectProps<T extends string> {
  /** Título do painel de opções. */
  title: string;
  /** Texto do botão quando o valor é o padrão ("Categoria", "Município"...). */
  placeholder: string;
  options: SelectOption<T>[];
  value: T;
  /** Valor que representa "sem filtro". */
  emptyValue?: T;
  onChange: (value: T) => void;
}

/** Botão compacto de filtro (44 px, cantos 12 px) que abre um painel de opções. */
export function FilterSelect<T extends string>({
  title,
  placeholder,
  options,
  value,
  emptyValue,
  onChange,
}: FilterSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);
  const showing = value === emptyValue || !current ? placeholder : current.label;
  const active = value !== emptyValue && !!current;
  return (
    <View style={{ flex: 1, minWidth: 0 }}>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`${title}: ${current?.label ?? placeholder}`}
        style={{
          height: 44,
          paddingHorizontal: 10,
          borderWidth: 1,
          borderColor: active ? colors.verde : colors.linha,
          borderRadius: 12,
          backgroundColor: active ? colors.broto : colors.superficie,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 4,
        }}
      >
        <Text
          numberOfLines={1}
          style={{
            flexShrink: 1,
            fontFamily: fonts.semi,
            fontSize: 13,
            color: active ? colors.verdeEscuro : colors.asfalto,
          }}
        >
          {showing}
        </Text>
        <ChevronDown size={14} color={colors.concreto} strokeWidth={2} />
      </Pressable>
      <OptionSheet
        visible={open}
        title={title}
        options={options}
        value={value}
        onSelect={onChange}
        onClose={() => setOpen(false)}
      />
    </View>
  );
}

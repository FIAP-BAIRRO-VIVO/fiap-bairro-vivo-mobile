import type { TabsScreenOptions as BottomTabNavigationOptions } from 'expo-router/tabs';
import { Text } from 'react-native';

import { colors, fonts, sizes } from '@/theme';

import { TabIcon, TabIconName } from './TabIcons';

/** Opções comuns das abas: barra branca de 80 px, verde na aba ativa. */
export const tabScreenOptions: BottomTabNavigationOptions = {
  headerShown: false,
  tabBarActiveTintColor: colors.verde,
  tabBarInactiveTintColor: colors.concreto,
  tabBarStyle: {
    height: sizes.tabBar,
    backgroundColor: colors.superficie,
    borderTopColor: colors.linha,
    borderTopWidth: 1,
    paddingTop: 10,
    paddingBottom: 12,
  },
  tabBarItemStyle: { gap: 4 },
  sceneStyle: { backgroundColor: colors.calcada },
};

export function tabOptions(label: string, icon: TabIconName): BottomTabNavigationOptions {
  return {
    title: label,
    tabBarAccessibilityLabel: label,
    tabBarIcon: ({ focused }) => <TabIcon name={icon} focused={focused} />,
    tabBarLabel: ({ focused }) => (
      <Text
        style={{
          fontFamily: focused ? fonts.negrito : fonts.medio,
          fontSize: 12,
          color: focused ? colors.verde : colors.concreto,
        }}
      >
        {label}
      </Text>
    ),
  };
}

import { Tabs } from 'expo-router';
import { Home, BarChart3, Plus, WalletCards, Settings } from 'lucide-react-native';
import { Platform, View, StyleSheet } from 'react-native';

const UI_COLORS = {
  background: '#F8F9FA', // Light greyish blue background
  card: '#FFFFFF',
  textMain: '#1A1A1A',
  textSecondary: '#A0AEC0',
  primary: '#8B5CF6', // Purple prominent in nav and progress bar
  success: '#10B981', // Green for percentages
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: UI_COLORS.card,
          borderTopWidth: 0,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          height: Platform.OS === 'ios' ? 88 : 80,
          paddingBottom: Platform.OS === 'ios' ? 28 : 20,
          paddingTop: 12,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarActiveTintColor: UI_COLORS.primary,
        tabBarInactiveTintColor: UI_COLORS.textSecondary,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => <Home color={color} size={24} strokeWidth={2.5} />,
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Stats',
          tabBarLabel: 'Stats',
          tabBarIcon: ({ color, size }) => <BarChart3 color={color} size={24} strokeWidth={2.5} />,
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: '',
          tabBarLabel: '',
          tabBarIcon: () => (
            <View style={styles.floatingButtonSpacer}>
              <View style={styles.floatingButton}>
                <Plus color="#FFFFFF" size={32} strokeWidth={2} />
              </View>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="budget"
        options={{
          title: 'Budget',
          tabBarLabel: 'Budget',
          tabBarIcon: ({ color, size }) => <WalletCards color={color} size={24} strokeWidth={2.5} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size }) => <Settings color={color} size={24} strokeWidth={2.5} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  floatingButtonSpacer: {
    top: -20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: UI_COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: UI_COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  }
});

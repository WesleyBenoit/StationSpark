import { MaterialCommunityIcons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { LoadingState } from "@/components/LoadingState";
import { colors } from "@/constants/theme";
import type { AuthStackParamList, MainTabParamList, RootStackParamList } from "@/navigation/types";
import { ChatScreen } from "@/screens/ChatScreen";
import { CheckInScreen } from "@/screens/CheckInScreen";
import { HomeMapScreen } from "@/screens/HomeMapScreen";
import { InviteComposerScreen } from "@/screens/InviteComposerScreen";
import { OnTheWayScreen } from "@/screens/OnTheWayScreen";
import { OnboardingScreen } from "@/screens/OnboardingScreen";
import { ProfileScreen } from "@/screens/ProfileScreen";
import { ReportScreen } from "@/screens/ReportScreen";
import { SafetyCenterScreen } from "@/screens/SafetyCenterScreen";
import { SettingsScreen } from "@/screens/SettingsScreen";
import { SignInScreen } from "@/screens/SignInScreen";
import { SignUpScreen } from "@/screens/SignUpScreen";
import { StationDetailScreen } from "@/screens/StationDetailScreen";
import { WelcomeScreen } from "@/screens/WelcomeScreen";
import { useAuthStore } from "@/stores/authStore";

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
      <AuthStack.Screen name="SignIn" component={SignInScreen} />
      <AuthStack.Screen name="SignUp" component={SignUpScreen} />
    </AuthStack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          height: 84,
          paddingTop: 8,
          paddingBottom: 18
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarIcon: ({ color, size }) => {
          const iconName =
            route.name === "Home"
              ? "map-marker-radius"
              : route.name === "CheckIn"
                ? "ev-plug-type2"
                : route.name === "Safety"
                  ? "shield-check"
                  : "account-circle";
          return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
        }
      })}
    >
      <Tab.Screen name="Home" component={HomeMapScreen} />
      <Tab.Screen name="CheckIn" component={CheckInScreen} />
      <Tab.Screen name="Safety" component={SafetyCenterScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const loading = useAuthStore((state) => state.loading);
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);

  if (loading) return <LoadingState />;

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      {!user ? (
        <RootStack.Screen name="Auth" component={AuthNavigator} />
      ) : !profile ? (
        <RootStack.Screen name="Onboarding" component={OnboardingScreen} />
      ) : (
        <>
          <RootStack.Screen name="MainTabs" component={MainTabs} />
          <RootStack.Screen name="StationDetail" component={StationDetailScreen} />
          <RootStack.Screen name="InviteComposer" component={InviteComposerScreen} />
          <RootStack.Screen name="Chat" component={ChatScreen} />
          <RootStack.Screen name="OnTheWay" component={OnTheWayScreen} />
          <RootStack.Screen name="Settings" component={SettingsScreen} />
          <RootStack.Screen name="Report" component={ReportScreen} />
        </>
      )}
    </RootStack.Navigator>
  );
}

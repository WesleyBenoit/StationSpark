import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import type { AuthStackParamList } from "@/navigation/types";

type Props = NativeStackScreenProps<AuthStackParamList, "Welcome">;

export function WelcomeScreen({ navigation }: Props) {
  return (
    <AppShell scroll={false} className="justify-between pb-8">
      <View className="pt-16">
        <View className="h-16 w-16 items-center justify-center rounded-3xl bg-blue-500/15">
          <MaterialCommunityIcons name="ev-station" size={38} color="#2F80FF" />
        </View>
        <Text className="mt-8 text-5xl font-black tracking-normal text-white">StationSpark</Text>
        <Text className="mt-4 text-2xl font-semibold leading-8 text-white">Meet EV drivers while you charge.</Text>
        <Text className="mt-4 text-base leading-6 text-charge-muted">
          See who is charging, who is on the way, and who is open to safe social connection at the station.
        </Text>
      </View>

      <Card className="gap-3">
        <Button title="Sign Up" onPress={() => navigation.navigate("SignUp")} />
        <Button title="Log In" variant="secondary" onPress={() => navigation.navigate("SignIn")} />
      </Card>
    </AppShell>
  );
}

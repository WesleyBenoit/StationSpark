import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: true
  })
});

export async function requestNotificationPermission() {
  const existing = await Notifications.getPermissionsAsync();
  if (existing.status === "granted") return existing;

  return Notifications.requestPermissionsAsync();
}

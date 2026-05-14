import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestPermission(): Promise<boolean> {
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

export async function scheduleReminders(habitNames: string[]): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (habitNames.length === 0) return;

    const morningBody =
      habitNames.length === 1
        ? `Time to track "${habitNames[0]}" today 🌟`
        : `You have ${habitNames.length} habits to check in on today 💪`;

    await Notifications.scheduleNotificationAsync({
      content: { title: 'Good morning!', body: morningBody },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 9,
        minute: 0,
      },
    });

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Evening check-in 🌙',
        body: "Don't forget to log your habits before the day ends!",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 19,
        minute: 0,
      },
    });
  } catch {
    // Notifications not available in this environment
  }
}

import * as Haptics from 'expo-haptics';

export function hapticTap() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

export function hapticComplete() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

export function hapticUndo() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

export function hapticMilestone() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

export function hapticAllDone() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 120);
}

export function hapticChallengeComplete() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 160);
  setTimeout(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success), 320);
}

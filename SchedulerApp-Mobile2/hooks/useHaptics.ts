// hooks/useHaptics.ts
// Hook för att hantera haptisk feedback (vibrationer) vid interaktioner
// Använder expo-haptics för att ge fysisk återkoppling till användaren
// Tre nivåer: lätt (tryck), medium (spara/bekräfta), tung (radera/varning)

import * as Haptics from 'expo-haptics';

// Exporteras som default för att undvika problem med named exports i Expo Go
const useHaptics = () => {
  // Lätt feedback — används vid enkla tryck t.ex. dagval, månadsnavigering
  const lightTap = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Medium feedback — används vid bekräftelser t.ex. spara händelse
  const mediumTap = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  // Tung feedback — används vid destruktiva åtgärder t.ex. radera händelse
  const heavyTap = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  };

  // Notisfeedback — används vid fel eller varningar
  const errorTap = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  };

  // Framgångsfeedback — används när något lyckas t.ex. händelse sparad
  const successTap = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // Returnerar alla feedbackfunktioner till den anropande komponenten
  return { lightTap, mediumTap, heavyTap, errorTap, successTap };
};

export default useHaptics;
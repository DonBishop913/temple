export const scheduleDailyNotification = (time, message) => {
  try {
    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    const target = new Date(now);
    target.setHours(hours, minutes, 0, 0);
    if (target < now) target.setDate(target.getDate() + 1);
    const delay = target.getTime() - now.getTime();
    setTimeout(() => {
      alert(message);
      setInterval(() => alert(message), 24 * 60 * 60 * 1000);
    }, delay);
  } catch (e) {
    console.warn('[Scheduler] Failed to schedule daily notification:', e);
  }
};
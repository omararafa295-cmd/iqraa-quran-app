// طلب صلاحية الإشعارات
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) return false;
  
  if (Notification.permission === 'granted') {
    return true;
  }
  
  if (Notification.permission !== 'denied') {
    const permission = await Notification.permissionRequest ? Notification.permissionRequest() : Notification.requestPermission();
    return permission === 'granted';
  }
  
  return false;
};

// إرسال إشعار تذكير بالورد اليومي
export const sendKhatmaReminderNotification = async (khatma, isAr = true) => {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const todayStr = new Date().toISOString().split('T')[0];
  const lastNotified = localStorage.getItem('lastKhatmaNotificationDate');

  if (lastNotified === todayStr) return;

  if (khatma && khatma.pagesRead < 604) {
    const title = isAr ? '📖 تذكير بالورد اليومي' : '📖 Daily Quran Reading Reminder';
    const body = isAr
      ? `لا تنسَ قراءة ورد اليوم (${khatma.pagesPerDay} صفحة). قال رسول الله ﷺ: «اقرَؤُوا القُرْآنَ فإنَّه يَأْتي يَومَ القِيامَةِ شَفِيعًا لأَصْحابِهِ».`
      : `Don't forget your daily reading (${khatma.pagesPerDay} pages). Keep up your Khatma plan!`;

    const options = {
      body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'khatma-reminder',
      renotify: true,
      data: { url: '/' }
    };

    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const reg = await navigator.serviceWorker.ready;
      reg.showNotification(title, options);
    } else {
      new Notification(title, options);
    }

    localStorage.setItem('lastKhatmaNotificationDate', todayStr);
  }
};
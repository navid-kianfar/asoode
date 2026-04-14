import { ref } from 'vue';
import { httpService } from '@/services/http.service';

const isSubscribed = ref(false);
const isSupported = ref(false);

// Check support on module load
if (typeof window !== 'undefined') {
  isSupported.value = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function getRegistration(): Promise<ServiceWorkerRegistration | undefined> {
  if (!('serviceWorker' in navigator)) return undefined;
  return navigator.serviceWorker.ready;
}

async function checkExistingSubscription(): Promise<void> {
  const registration = await getRegistration();
  if (!registration) return;
  const subscription = await registration.pushManager.getSubscription();
  isSubscribed.value = !!subscription;
}

async function subscribe(): Promise<boolean> {
  if (!isSupported.value) return false;

  const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  if (!vapidPublicKey) {
    console.warn('[Push] VITE_VAPID_PUBLIC_KEY not configured');
    return false;
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return false;

  const registration = await getRegistration();
  if (!registration) return false;

  try {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey).buffer as ArrayBuffer,
    });

    const json = subscription.toJSON();

    // Send subscription to backend
    await httpService.post('/api/account/push-subscription', {
      endpoint: json.endpoint,
      auth: json.keys?.auth,
      p256dh: json.keys?.p256dh,
      expirationTime: json.expirationTime ?? null,
    });

    isSubscribed.value = true;
    return true;
  } catch (err) {
    console.error('[Push] Subscription failed:', err);
    return false;
  }
}

async function unsubscribe(): Promise<boolean> {
  const registration = await getRegistration();
  if (!registration) return false;

  try {
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      isSubscribed.value = false;
      return true;
    }

    // Notify backend before unsubscribing
    await httpService.post('/api/account/push-subscription/remove', {
      endpoint: subscription.endpoint,
    });

    await subscription.unsubscribe();
    isSubscribed.value = false;
    return true;
  } catch (err) {
    console.error('[Push] Unsubscribe failed:', err);
    return false;
  }
}

export function usePushNotification() {
  // Check existing subscription status
  checkExistingSubscription();

  return {
    isSupported,
    isSubscribed,
    subscribe,
    unsubscribe,
  };
}

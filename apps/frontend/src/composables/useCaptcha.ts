import { ref, onMounted, onUnmounted } from 'vue';
import { httpService } from '@/services/http.service';
import { API, type CaptchaPayload } from '@asoode/shared';

interface ChallengeResponse {
  prefix: string;
  difficulty: number;
  expiresAt: string;
}

export function useCaptcha() {
  const formLoadedAt = ref(0);
  const powPrefix = ref('');
  const powNonce = ref('');
  const isReady = ref(false);
  const isSolving = ref(false);

  let worker: Worker | null = null;

  async function fetchChallenge() {
    try {
      const result = await httpService.post<ChallengeResponse>(API.CAPTCHA_CHALLENGE);
      if (result.data) {
        powPrefix.value = result.data.prefix;
        solveChallenge(result.data.prefix, result.data.difficulty);
      }
    } catch {
      // If captcha challenge fetch fails, still allow form submission
      // The backend will reject if captcha is required
      isReady.value = true;
    }
  }

  function solveChallenge(prefix: string, difficulty: number) {
    isSolving.value = true;

    try {
      worker = new Worker(
        new URL('../workers/pow.worker.ts', import.meta.url),
        { type: 'module' },
      );

      worker.onmessage = (event: MessageEvent<{ nonce: string; hash: string }>) => {
        powNonce.value = event.data.nonce;
        isSolving.value = false;
        isReady.value = true;
        worker?.terminate();
        worker = null;
      };

      worker.onerror = () => {
        isSolving.value = false;
        isReady.value = true; // Allow submission even if PoW fails
        worker?.terminate();
        worker = null;
      };

      worker.postMessage({ prefix, difficulty });
    } catch {
      // Web Worker not supported — solve inline (blocking but fast)
      solveInline(prefix, difficulty);
    }
  }

  async function solveInline(prefix: string, difficulty: number) {
    const target = '0'.repeat(difficulty);
    let nonce = 0;

    while (true) {
      const candidate = prefix + nonce.toString();
      const encoder = new TextEncoder();
      const data = encoder.encode(candidate);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      if (hash.startsWith(target)) {
        powNonce.value = nonce.toString();
        isSolving.value = false;
        isReady.value = true;
        return;
      }

      nonce++;

      if (nonce % 500 === 0) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
  }

  function getCaptchaPayload(): CaptchaPayload {
    return {
      honeypot: '',
      formLoadedAt: formLoadedAt.value,
      powPrefix: powPrefix.value,
      powNonce: powNonce.value,
    };
  }

  async function reset() {
    isReady.value = false;
    isSolving.value = false;
    powPrefix.value = '';
    powNonce.value = '';
    formLoadedAt.value = Date.now();
    await fetchChallenge();
  }

  onMounted(() => {
    formLoadedAt.value = Date.now();
    fetchChallenge();
  });

  onUnmounted(() => {
    worker?.terminate();
    worker = null;
  });

  return {
    isReady,
    isSolving,
    getCaptchaPayload,
    reset,
  };
}

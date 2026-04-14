// Proof-of-Work Web Worker
// Finds a nonce such that SHA-256(prefix + nonce) starts with N leading zeros

async function sha256(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

self.onmessage = async (event: MessageEvent<{ prefix: string; difficulty: number }>) => {
  const { prefix, difficulty } = event.data;
  const target = '0'.repeat(difficulty);
  let nonce = 0;

  while (true) {
    const candidate = prefix + nonce.toString();
    const hash = await sha256(candidate);

    if (hash.startsWith(target)) {
      self.postMessage({ nonce: nonce.toString(), hash });
      return;
    }

    nonce++;

    // Yield control every 1000 iterations to keep worker responsive
    if (nonce % 1000 === 0) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
};

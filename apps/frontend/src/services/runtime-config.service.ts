interface RuntimeConfig {
  apiUrl: string;
  socketUrl: string;
}

const defaults: RuntimeConfig = {
  apiUrl: '/api',
  socketUrl: '',
};

export const runtimeConfig: RuntimeConfig = { ...defaults };

export async function loadRuntimeConfig(): Promise<void> {
  try {
    const response = await fetch('/runtime-config.json');
    if (response.ok) {
      const config = await response.json();
      Object.assign(runtimeConfig, config);
    }
  } catch {
    // Use defaults in development (file won't exist)
  }
}

/**
 * Resolves a backend-relative path (e.g. /storage/file/...) to a full URL
 * using the configured API base. In production this hits the API directly,
 * in dev it goes through the Vite proxy.
 */
export function resolveApiUrl(path: string): string {
  return `${runtimeConfig.apiUrl}${path}`;
}

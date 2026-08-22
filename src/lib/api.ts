export const DEFAULT_SIDECAR_URL = 'http://127.0.0.1:4919';

export interface RuntimeConfig {
  sidecarUrl?: string;
  sidecarToken?: string;
}

declare global {
  interface Window {
    __ACUTE_CONFIG__?: RuntimeConfig;
  }
}

export function resolveConfig(): Required<Pick<RuntimeConfig, 'sidecarUrl'>> & RuntimeConfig {
  const cfg = typeof window !== 'undefined' ? window.__ACUTE_CONFIG__ : undefined;
  return {
    sidecarUrl: cfg?.sidecarUrl ?? DEFAULT_SIDECAR_URL,
    sidecarToken: cfg?.sidecarToken,
  };
}

export class ConnectionError extends Error {
  readonly cause?: unknown;

  constructor(message = 'Sidecar unreachable', cause?: unknown) {
    super(message);
    this.name = 'ConnectionError';
    this.cause = cause;
  }
}

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { sidecarUrl, sidecarToken } = resolveConfig();
  const url = `${sidecarUrl}${path}`;
  let res: Response;

  try {
    res = await fetch(url, {
      method: options.method ?? 'GET',
      headers: {
        Accept: 'application/json',
        ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(sidecarToken ? { Authorization: `Bearer ${sidecarToken}` } : {}),
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: options.signal,
    });
  } catch (err) {
    throw new ConnectionError(`Could not reach sidecar at ${sidecarUrl}`, err);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ApiError(res.status, `Sidecar responded ${res.status}${text ? `: ${text}` : ''}`);
  }

  return (await res.json()) as T;
}

export interface HealthStatus {
  status: string;
  version?: string;
}

export const api = {
  health: (signal?: AbortSignal) => request<HealthStatus>('/health', { signal }),
  listProjects: <T>(signal?: AbortSignal) => request<T[]>('/projects', { signal }),
  listSessions: <T>(signal?: AbortSignal) => request<T[]>('/sessions', { signal }),
  listAgents: <T>(signal?: AbortSignal) => request<T[]>('/agents', { signal }),
  getUsage: <T>(signal?: AbortSignal) => request<T>('/usage/summary', { signal }),
};

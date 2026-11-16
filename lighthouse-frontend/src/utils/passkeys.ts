import {
  browserSupportsWebAuthn,
  startAuthentication,
  startRegistration,
  type StartAuthenticationOpts,
  type StartRegistrationOpts,
} from '@simplewebauthn/browser';
import type { User } from '../types';
import { apiFetch } from './api';

const PASSKEY_SESSION_HEADER = 'X-WebAuthn-Session';

type RegistrationOptionsJSON = StartRegistrationOpts['optionsJSON'];
type AuthenticationOptionsJSON = StartAuthenticationOpts['optionsJSON'];

interface CeremonyOptions<T> {
  flow_id: string;
  public_key: T;
}

interface AuthResponse {
  user: User;
}

interface RegistrationProfile {
  email: string;
  firstName: string;
  lastName: string;
}

export const passkeysAreSupported = browserSupportsWebAuthn();

export const signInWithPasskey = async (): Promise<User> => {
  requirePasskeySupport();

  const options = await requestJSON<CeremonyOptions<AuthenticationOptionsJSON>>(
    '/auth/passkey/login/options',
    { method: 'POST' },
  );

  const authentication = await runPasskeyCeremony(() =>
    startAuthentication({ optionsJSON: options.public_key }),
  );

  const { user } = await requestJSON<AuthResponse>('/auth/passkey/login', {
    method: 'POST',
    headers: { [PASSKEY_SESSION_HEADER]: options.flow_id },
    body: JSON.stringify(authentication),
  });
  return user;
};

export const createPasskeyAccount = async ({
  email,
  firstName,
  lastName,
}: RegistrationProfile): Promise<User> => {
  requirePasskeySupport();

  const options = await requestJSON<CeremonyOptions<RegistrationOptionsJSON>>(
    '/auth/passkey/register/options',
    {
      method: 'POST',
      body: JSON.stringify({
        email,
        first_name: firstName,
        last_name: lastName,
      }),
    },
  );

  const registration = await runPasskeyCeremony(() =>
    startRegistration({ optionsJSON: options.public_key }),
  );

  const { user } = await requestJSON<AuthResponse>('/auth/passkey/register', {
    method: 'POST',
    headers: { [PASSKEY_SESSION_HEADER]: options.flow_id },
    body: JSON.stringify(registration),
  });
  return user;
};

const requirePasskeySupport = () => {
  if (!passkeysAreSupported) {
    throw new Error('This browser does not support passkeys.');
  }
};

const runPasskeyCeremony = async <T>(ceremony: () => Promise<T>): Promise<T> => {
  try {
    return await ceremony();
  } catch (error: unknown) {
    if (isCanceledPasskeyRequest(error)) {
      throw new Error('The passkey prompt was canceled or timed out.');
    }
    throw error;
  }
};

const isCanceledPasskeyRequest = (error: unknown): boolean => {
  if (!(error instanceof Error)) {
    return false;
  }

  const code = 'code' in error ? String(error.code) : '';
  return error.name === 'NotAllowedError' ||
    code === 'ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY' ||
    code === 'ERROR_CEREMONY_ABORTED';
};

const requestJSON = <T>(endpoint: string, options: RequestInit): Promise<T> =>
  apiFetch<T>(endpoint, options);

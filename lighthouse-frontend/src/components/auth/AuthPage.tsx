import { useState } from 'react';
import {
  FingerPrintIcon,
  MapPinIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { passkeysAreSupported } from '../../utils/passkeys';

type AuthMode = 'signin' | 'register';

const AuthPage = () => {
  const [activeTab, setActiveTab] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSignIn = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login();
      navigate('/lighthouse');
    } catch (caughtError: unknown) {
      setError(getErrorMessage(caughtError, 'Passkey sign-in failed. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await register(email, firstName, lastName);
      navigate('/lighthouse');
    } catch (caughtError: unknown) {
      setError(getErrorMessage(caughtError, 'Account creation failed. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchTab = (tab: AuthMode) => {
    setActiveTab(tab);
    setError(null);
  };

  return (
    <main className="app-page">
      <div className="app-shell max-w-5xl">
        <div className="app-card grid overflow-hidden lg:grid-cols-[0.9fr_1.1fr]">
          <section className="relative hidden overflow-hidden bg-faros-navy p-10 text-white lg:flex lg:flex-col lg:justify-between">
            <div
              aria-hidden="true"
              className="absolute -right-24 top-12 h-72 w-72 rounded-full border border-faros-mint/15"
            />
            <div
              aria-hidden="true"
              className="absolute -right-10 -top-4 h-72 w-72 rounded-full border border-faros-mint/10"
            />

            <div className="relative flex items-center gap-3 text-sm font-bold uppercase tracking-[0.22em] text-faros-mint">
              <span className="grid h-10 w-10 place-items-center rounded-full border border-faros-mint/30">
                <MapPinIcon className="h-5 w-5" aria-hidden="true" />
              </span>
              Faros
            </div>

            <div className="relative my-12">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-faros-amber">
                Passwords are off the map
              </p>
              <h1 className="mt-5 font-display text-5xl font-semibold leading-[1.05]">
                Your lighthouse log, unlocked by you.
              </h1>
              <p className="mt-6 leading-7 text-white/70">
                Use your device&apos;s face, fingerprint, or screen lock. Nothing
                to memorize, type, or reuse.
              </p>
            </div>

            <div className="relative flex items-center gap-3 border-t border-white/10 pt-6 text-sm text-white/65">
              <ShieldCheckIcon className="h-5 w-5 text-faros-mint" aria-hidden="true" />
              Passkeys stay encrypted in your device or password manager.
            </div>
          </section>

          <section className="bg-white p-6 sm:p-10 lg:p-12">
            <div className="mb-8 flex items-start justify-between gap-6">
              <div>
                <p className="app-eyebrow">Secure access</p>
                <h2 className="app-heading mt-2">Welcome aboard</h2>
              </div>
              <div className="app-icon-tile">
                <FingerPrintIcon className="h-7 w-7" aria-hidden="true" />
              </div>
            </div>

            <div className="app-segmented mb-7 grid-cols-2">
              <button
                type="button"
                onClick={() => switchTab('signin')}
                aria-pressed={activeTab === 'signin'}
                className={`app-segment ${
                  activeTab === 'signin' ? 'app-segment-active' : ''
                }`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => switchTab('register')}
                aria-pressed={activeTab === 'register'}
                className={`app-segment ${
                  activeTab === 'register' ? 'app-segment-active' : ''
                }`}
              >
                Create account
              </button>
            </div>

            {!passkeysAreSupported ? (
              <div role="alert" className="app-alert-warning mb-5">
                This browser does not support passkeys. Try a current version of
                Safari, Chrome, Edge, or Firefox.
              </div>
            ) : null}

            {error ? (
              <div role="alert" aria-live="polite" className="app-alert-error mb-5">
                {error}
              </div>
            ) : null}

            {activeTab === 'signin' ? (
              <form onSubmit={handleSignIn} className="space-y-6">
                <div className="app-panel p-5">
                  <h3 className="font-bold text-faros-navy">Use your passkey</h3>
                  <p className="app-copy mt-2 text-sm">
                    Your browser will show the passkeys saved for Faros. Choose one
                    and confirm with your device.
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting || !passkeysAreSupported}
                  className="app-button-primary w-full"
                >
                  <FingerPrintIcon className="h-5 w-5" aria-hidden="true" />
                  {isSubmitting ? 'Waiting for your passkey...' : 'Continue with a passkey'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="register-firstname" className="app-label">
                      First name
                    </label>
                    <input
                      id="register-firstname"
                      type="text"
                      autoComplete="given-name"
                      value={firstName}
                      onChange={(event) => setFirstName(event.target.value)}
                      required
                      maxLength={100}
                      className="app-input"
                      placeholder="Grace"
                    />
                  </div>
                  <div>
                    <label htmlFor="register-lastname" className="app-label">
                      Last name
                    </label>
                    <input
                      id="register-lastname"
                      type="text"
                      autoComplete="family-name"
                      value={lastName}
                      onChange={(event) => setLastName(event.target.value)}
                      required
                      maxLength={100}
                      className="app-input"
                      placeholder="Hopper"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="register-email" className="app-label">
                    Email
                  </label>
                  <input
                    id="register-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    maxLength={254}
                    className="app-input"
                    placeholder="you@example.com"
                  />
                </div>

                <p className="app-copy text-sm">
                  Next, your device will ask where to save the passkey. No password
                  will be created.
                </p>

                <button
                  type="submit"
                  disabled={isSubmitting || !passkeysAreSupported}
                  className="app-button-primary w-full"
                >
                  <FingerPrintIcon className="h-5 w-5" aria-hidden="true" />
                  {isSubmitting ? 'Creating your passkey...' : 'Create account with passkey'}
                </button>
              </form>
            )}
          </section>
        </div>
      </div>
    </main>
  );
};

const getErrorMessage = (error: unknown, fallback: string): string => {
  return error instanceof Error ? error.message : fallback;
};

export default AuthPage;

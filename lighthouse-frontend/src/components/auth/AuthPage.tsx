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
    <main className="relative isolate min-h-[calc(100vh-4rem)] overflow-hidden bg-[#061b24] px-4 py-10 text-[#0d2932] sm:px-6 lg:px-8">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_12%_15%,rgba(73,196,173,0.22),transparent_34%),radial-gradient(circle_at_88%_80%,rgba(247,178,77,0.16),transparent_28%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-52 bg-[linear-gradient(175deg,transparent_35%,rgba(123,210,201,0.08)_36%,rgba(123,210,201,0.08)_40%,transparent_41%)]"
      />

      <div className="relative mx-auto grid min-h-[calc(100vh-9rem)] max-w-6xl overflow-hidden rounded-[2rem] border border-white/15 bg-[#f5f1e7] shadow-2xl shadow-black/40 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden overflow-hidden bg-[#0d3440] p-12 text-[#f8f3e8] lg:flex lg:flex-col lg:justify-between">
          <div
            aria-hidden="true"
            className="absolute -right-24 top-16 h-72 w-72 rounded-full border border-[#72cfc0]/25"
          />
          <div
            aria-hidden="true"
            className="absolute -right-10 top-2 h-72 w-72 rounded-full border border-[#72cfc0]/15"
          />

          <div className="relative flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.28em] text-[#8ed7ca]">
            <span className="grid h-10 w-10 place-items-center rounded-full border border-[#8ed7ca]/40">
              <MapPinIcon className="h-5 w-5" aria-hidden="true" />
            </span>
            Faros
          </div>

          <div className="relative max-w-lg">
            <p className="mb-5 font-mono text-xs uppercase tracking-[0.3em] text-[#f7b34c]">
              Passwords are off the map
            </p>
            <h1 className="font-serif text-5xl leading-[1.04] tracking-tight">
              Your lighthouse log,
              <span className="block text-[#8ed7ca]">unlocked by you.</span>
            </h1>
            <p className="mt-6 max-w-md text-base leading-7 text-[#d5e5e2]">
              A passkey uses your device&apos;s face, fingerprint, or screen lock.
              Nothing to memorize, type, or reuse.
            </p>
          </div>

          <div className="relative flex items-center gap-3 border-t border-white/10 pt-6 text-sm text-[#b9d4d0]">
            <ShieldCheckIcon className="h-5 w-5 text-[#8ed7ca]" aria-hidden="true" />
            Passkeys stay encrypted in your device or password manager.
          </div>
        </section>

        <section className="flex items-center px-6 py-10 sm:px-12 lg:px-14">
          <div className="w-full">
            <div className="mb-9 flex items-start justify-between gap-6">
              <div>
                <p className="font-mono text-xs font-semibold uppercase tracking-[0.24em] text-[#287b72]">
                  Secure access
                </p>
                <h2 className="mt-2 font-serif text-4xl tracking-tight text-[#0b2d37]">
                  Welcome aboard
                </h2>
              </div>
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[#d9eee8] text-[#176d64] shadow-sm">
                <FingerPrintIcon className="h-8 w-8" aria-hidden="true" />
              </div>
            </div>

            <div className="mb-8 grid grid-cols-2 rounded-xl bg-[#e5e0d4] p-1">
              <button
                type="button"
                onClick={() => switchTab('signin')}
                aria-pressed={activeTab === 'signin'}
                className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                  activeTab === 'signin'
                    ? 'bg-[#fffdf7] text-[#0b2d37] shadow-sm'
                    : 'text-[#66787c] hover:text-[#0b2d37]'
                }`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => switchTab('register')}
                aria-pressed={activeTab === 'register'}
                className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                  activeTab === 'register'
                    ? 'bg-[#fffdf7] text-[#0b2d37] shadow-sm'
                    : 'text-[#66787c] hover:text-[#0b2d37]'
                }`}
              >
                Create account
              </button>
            </div>

            {!passkeysAreSupported ? (
              <div
                role="alert"
                className="mb-5 rounded-xl border border-[#d18b35]/35 bg-[#fff0d8] px-4 py-3 text-sm text-[#784914]"
              >
                This browser does not support passkeys. Try a current version of
                Safari, Chrome, Edge, or Firefox.
              </div>
            ) : null}

            {error ? (
              <div
                role="alert"
                aria-live="polite"
                className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              >
                {error}
              </div>
            ) : null}

            {activeTab === 'signin' ? (
              <form onSubmit={handleSignIn} className="space-y-6">
                <div className="rounded-2xl border border-[#d7d2c6] bg-[#fffdf7] p-5">
                  <h3 className="font-semibold text-[#163a43]">Use your passkey</h3>
                  <p className="mt-2 text-sm leading-6 text-[#647478]">
                    Your browser will show the passkeys saved for Faros. Choose one
                    and confirm with your device.
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting || !passkeysAreSupported}
                  className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#0e6961] px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#0e6961]/20 transition hover:-translate-y-0.5 hover:bg-[#0a5a54] focus:outline-none focus:ring-2 focus:ring-[#0e6961] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  <FingerPrintIcon className="h-5 w-5" aria-hidden="true" />
                  {isSubmitting ? 'Waiting for your passkey...' : 'Continue with a passkey'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="register-firstname"
                      className="mb-1.5 block text-sm font-semibold text-[#284950]"
                    >
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
                      className="w-full rounded-xl border border-[#cbc7bc] bg-[#fffdf7] px-3.5 py-3 text-[#0b2d37] outline-none transition placeholder:text-[#93a09f] focus:border-[#168176] focus:ring-2 focus:ring-[#168176]/15"
                      placeholder="Grace"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="register-lastname"
                      className="mb-1.5 block text-sm font-semibold text-[#284950]"
                    >
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
                      className="w-full rounded-xl border border-[#cbc7bc] bg-[#fffdf7] px-3.5 py-3 text-[#0b2d37] outline-none transition placeholder:text-[#93a09f] focus:border-[#168176] focus:ring-2 focus:ring-[#168176]/15"
                      placeholder="Hopper"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="register-email"
                    className="mb-1.5 block text-sm font-semibold text-[#284950]"
                  >
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
                    className="w-full rounded-xl border border-[#cbc7bc] bg-[#fffdf7] px-3.5 py-3 text-[#0b2d37] outline-none transition placeholder:text-[#93a09f] focus:border-[#168176] focus:ring-2 focus:ring-[#168176]/15"
                    placeholder="you@example.com"
                  />
                </div>

                <p className="text-sm leading-6 text-[#697a7d]">
                  Next, your device will ask where to save the passkey. No password
                  will be created.
                </p>

                <button
                  type="submit"
                  disabled={isSubmitting || !passkeysAreSupported}
                  className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#0e6961] px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#0e6961]/20 transition hover:-translate-y-0.5 hover:bg-[#0a5a54] focus:outline-none focus:ring-2 focus:ring-[#0e6961] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  <FingerPrintIcon className="h-5 w-5" aria-hidden="true" />
                  {isSubmitting ? 'Creating your passkey...' : 'Create account with passkey'}
                </button>
              </form>
            )}
          </div>
        </section>
      </div>
    </main>
  );
};

const getErrorMessage = (error: unknown, fallback: string): string => {
  return error instanceof Error ? error.message : fallback;
};

export default AuthPage;

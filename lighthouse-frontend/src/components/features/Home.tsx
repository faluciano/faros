import {
  CheckCircleIcon,
  MapIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const features = [
  {
    title: 'Explore the map',
    description: 'Browse lighthouse locations and details from one interactive view.',
    icon: MapIcon,
  },
  {
    title: 'Keep your log',
    description: 'Mark visits and build a wishlist for the journeys still ahead.',
    icon: CheckCircleIcon,
  },
  {
    title: 'Travel together',
    description: 'Connect with friends and compare the places you have explored.',
    icon: UsersIcon,
  },
];

const Home = () => {
  const { isSignedIn } = useAuth();

  return (
    <main className="app-page">
      <div className="app-shell space-y-8">
        <section className="app-card grid overflow-hidden lg:grid-cols-[1.15fr_0.85fr]">
          <div className="p-8 sm:p-12 lg:p-14">
            <p className="app-eyebrow">Your lighthouse journal</p>
            <h1 className="app-title mt-4 max-w-2xl">
              Keep every coastal discovery in view.
            </h1>
            <p className="app-copy mt-6 max-w-xl text-lg">
              Faros brings lighthouse discovery, visited places, wishlists, and
              friends together in one calm, map-first workspace.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/lighthouse" className="app-button-primary">
                <MapIcon className="h-5 w-5" aria-hidden="true" />
                Explore lighthouses
              </Link>
              {!isSignedIn ? (
                <Link to="/login" className="app-button-secondary">
                  Sign in with a passkey
                </Link>
              ) : (
                <Link to="/visited" className="app-button-secondary">
                  View your lighthouse log
                </Link>
              )}
            </div>
          </div>

          <div className="relative overflow-hidden bg-faros-navy p-8 text-white sm:p-12">
            <div
              aria-hidden="true"
              className="absolute -right-20 -top-16 h-64 w-64 rounded-full border border-faros-mint/15"
            />
            <div
              aria-hidden="true"
              className="absolute -right-8 -top-4 h-64 w-64 rounded-full border border-faros-mint/10"
            />
            <div className="relative flex h-full min-h-72 flex-col justify-between">
              <div className="app-icon-tile bg-white/10 text-faros-mint">
                <MapIcon className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-faros-mint/70">
                  Built for wandering
                </p>
                <p className="mt-4 font-display text-4xl font-semibold leading-tight">
                  A clearer way to remember where the light led you.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-3">
          {features.map(({ title, description, icon: Icon }) => (
            <article key={title} className="app-card-interactive p-6">
              <div className="app-icon-tile">
                <Icon className="h-6 w-6" aria-hidden="true" />
              </div>
              <h2 className="mt-5 text-lg font-bold text-faros-navy">{title}</h2>
              <p className="app-copy mt-2 text-sm">{description}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
};

export default Home;

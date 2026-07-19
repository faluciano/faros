import { useState } from "react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import Logo from "../../assets/faros-logo.png";

const publicLinks = [
  { to: "/", label: "Home" },
  { to: "/lighthouse", label: "Lighthouses" },
  { to: "/contact", label: "Contact" },
];

const privateLinks = [
  { to: "/visited", label: "Visited" },
  { to: "/wishlist", label: "Wishlist" },
  { to: "/friends", label: "Friends" },
];

const Navbar = () => {
  const { isSignedIn, user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const links = isSignedIn
    ? [publicLinks[0], publicLinks[1], ...privateLinks, publicLinks[2]]
    : publicLinks;

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-white/10 bg-faros-navy shadow-lg shadow-faros-navy/10">
      <div className="relative mx-auto max-w-7xl px-3 sm:px-5 lg:px-8">
        <div className="relative flex h-16 items-center justify-between">
          <button
            type="button"
            onClick={() => setIsOpen((open) => !open)}
            className="z-10 grid h-10 w-10 place-items-center rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-faros-mint sm:hidden"
            aria-expanded={isOpen}
          >
            <span className="sr-only">Open main menu</span>
            {isOpen ? (
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            ) : (
              <Bars3Icon className="h-6 w-6" aria-hidden="true" />
            )}
          </button>

          <div className="absolute inset-0 flex items-center justify-center sm:static sm:justify-start">
            <Link to="/" className="flex items-center gap-2.5" onClick={() => setIsOpen(false)}>
              <img className="h-9 w-9 rounded-full" src={Logo} alt="Faros Logo" />
              <span className="hidden font-display text-xl font-semibold tracking-wide text-white sm:block">
                Faros
              </span>
            </Link>
          </div>

          <div className="hidden flex-1 items-center justify-between sm:ml-8 sm:flex">
            <div className="flex items-center gap-1">
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === "/"}
                  className={({ isActive }) =>
                    `rounded-lg px-3 py-2 text-sm font-semibold transition ${
                      isActive
                        ? "bg-white/12 text-white"
                        : "text-white/65 hover:bg-white/8 hover:text-white"
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </div>
          </div>

          <div className="z-10 flex items-center gap-3">
            {isSignedIn ? (
              <>
                <span className="hidden text-sm font-semibold text-faros-mint/80 lg:block">
                  {user?.first_name} {user?.last_name}
                </span>
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-lg border border-white/20 px-3.5 py-2 text-sm font-bold text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-faros-mint"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="rounded-lg bg-faros-amber px-3.5 py-2 text-sm font-bold text-faros-navy transition hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-faros-amber focus:ring-offset-2 focus:ring-offset-faros-navy"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>

        {isOpen ? (
          <div className="absolute left-0 right-0 top-16 border-t border-white/10 bg-faros-navy px-3 pb-4 pt-3 shadow-xl sm:hidden">
            <div className="space-y-1">
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === "/"}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) =>
                    `block rounded-lg px-3 py-2.5 text-base font-semibold transition ${
                      isActive
                        ? "bg-white/12 text-white"
                        : "text-white/70 hover:bg-white/8 hover:text-white"
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </nav>
  );
};

export default Navbar;

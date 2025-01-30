import { SignedIn, SignedOut, SignInButton, useAuth, UserButton } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import { useState } from "react";

import Logo from "../../assets/faros-logo.png";

const Navbar = () => {
  const { isSignedIn } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-gray-800 shadow-lg fixed w-full top-0 z-50">
      <div className="relative max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        {/* Main Navbar Content */}
        <div className="relative flex items-center justify-between h-16">
          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden z-10">
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className={`${isOpen ? 'hidden' : 'block'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
              <svg
                className={`${isOpen ? 'block' : 'hidden'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Logo - Centered on mobile, left-aligned on desktop */}
          <div className="absolute inset-0 flex items-center justify-center sm:static sm:justify-start">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="flex items-center">
                <img
                  className="h-8 w-auto rounded-full"
                  src={Logo}
                  alt="Faros Logo"
                />
                <span className="ml-2 text-white text-lg font-semibold hidden sm:block">Faros</span>
              </Link>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden sm:ml-6 sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div className="flex space-x-4">
              <Link
                to="/"
                className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap"
              >
                Home
              </Link>
              <Link
                to="/lighthouse"
                className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap"
              >
                Lighthouses
              </Link>
              {isSignedIn && (
                <>
                  <Link
                    to="/visited"
                    className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap"
                  >
                    Visited
                  </Link>
                  <Link
                    to="/wishlist"
                    className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap"
                  >
                    Wishlist
                  </Link>
                  <Link
                    to="/friends"
                    className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap"
                  >
                    Friends
                  </Link>
                </>
              )}
              <Link
                to="/contact"
                className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap"
              >
                Contact
              </Link>
            </div>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center z-10">
            <SignedOut>
              <div className="bg-gray-900 text-white px-3 py-2 rounded-md text-sm font-medium">
                <SignInButton />
              </div>
            </SignedOut>
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div 
          className={`${isOpen ? 'block' : 'hidden'} sm:hidden absolute left-0 right-0 top-16 bg-gray-800 shadow-lg`}
          onClick={() => setIsOpen(false)}
        >
          <div className="px-2 pt-2 pb-3 space-y-1 border-t border-gray-700">
            <Link
              to="/"
              className="text-gray-300 hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
            >
              Home
            </Link>
            <Link
              to="/lighthouse"
              className="text-gray-300 hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
            >
              Lighthouses
            </Link>
            {isSignedIn && (
              <>
                <Link
                  to="/visited"
                  className="text-gray-300 hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
                >
                  Visited
                </Link>
                <Link
                  to="/wishlist"
                  className="text-gray-300 hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
                >
                  Wishlist
                </Link>
                <Link
                  to="/friends"
                  className="text-gray-300 hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
                >
                  Friends
                </Link>
              </>
            )}
            <Link
              to="/contact"
              className="text-gray-300 hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
            >
              Contact
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

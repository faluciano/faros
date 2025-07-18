import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SignedIn, SignedOut } from "@clerk/clerk-react";

// Layout
import Navbar from "./components/layout/Navbar";

// Features
import Home from './components/features/Home';
import Contact from "./components/features/Contact";
import LighthouseMap from "./components/features/map/LighthouseMap";
import UserMap from "./components/features/map/UserMap";
import VisitedLighthouses from "./components/features/lighthouses/VisitedLighthouses";
import WishlistLighthouses from "./components/features/lighthouses/WishlistLighthouses";
import Friends from './components/features/friends/Friends';

// Context
import { LighthouseProvider } from "./context/LighthouseContextProvider";
import { UserProvider } from "./context/UserContextProvider";

function App() {
  return (
    <Router>
      <UserProvider>
        <LighthouseProvider>
          <div className="min-h-screen bg-gray-100">
            <Navbar />
            <div className="pt-16">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/lighthouse" element={
                  <>
                    <SignedOut>
                      <LighthouseMap />
                    </SignedOut>
                    <SignedIn>
                      <UserMap />
                    </SignedIn>
                  </>
                } />
                <Route path="/visited" element={
                  <SignedIn>
                    <VisitedLighthouses />
                  </SignedIn>
                } />
                <Route path="/wishlist" element={
                  <SignedIn>
                    <WishlistLighthouses />
                  </SignedIn>
                } />
                <Route path="/friends" element={
                  <SignedIn>
                    <Friends />
                  </SignedIn>
                } />
              </Routes>
            </div>
          </div>
        </LighthouseProvider>
      </UserProvider>
    </Router>
  );
}

export default App;

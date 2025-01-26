import Navbar from "./components/navbar";
import LighthouseMap from "./components/lighthousemap";
import { SignedIn, SignedOut } from "@clerk/clerk-react";
import UserMap from "./components/usermap";
import Home from './components/Home';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Contact from "./components/Contact";
import VisitedLighthouses from "./components/VisitedLighthouses";
import WishlistLighthouses from "./components/WishlistLighthouses";
import { LighthouseProvider } from "./context/LighthouseContext";

function App() {
  return (
    <Router>
      <LighthouseProvider>
        <div>
          <Navbar />
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
          </Routes>
        </div>
      </LighthouseProvider>
    </Router>
  );
}

export default App;

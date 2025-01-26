import Navbar from "./components/navbar";
import LighthouseMap from "./components/lighthousemap";
import { SignedIn, SignedOut } from "@clerk/clerk-react";
import UserMap from "./components/usermap";
import Home from './components/Home';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Contact from "./components/Contact";
import VisitedLighthouses from "./components/VisitedLighthouses";

function App() {
  return (
    <Router>
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
        </Routes>
      </div>
    </Router>
  );
}

export default App;

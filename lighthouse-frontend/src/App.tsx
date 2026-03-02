import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

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
import AuthPage from './components/auth/AuthPage';

// Context
import { LighthouseProvider } from "./context/LighthouseContextProvider";
import { UserProvider } from "./context/UserContextProvider";

function App() {
  const { isSignedIn, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-800">Loading...</h2>
        </div>
      </div>
    );
  }

  return (
    <UserProvider>
      <LighthouseProvider>
        <div className="min-h-screen bg-gray-100">
          <Navbar />
          <div className="pt-16">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/login" element={
                isSignedIn ? <Navigate to="/lighthouse" replace /> : <AuthPage />
              } />
              <Route path="/lighthouse" element={
                isSignedIn ? <UserMap /> : <LighthouseMap />
              } />
              <Route path="/visited" element={
                isSignedIn ? <VisitedLighthouses /> : <Navigate to="/login" replace />
              } />
              <Route path="/wishlist" element={
                isSignedIn ? <WishlistLighthouses /> : <Navigate to="/login" replace />
              } />
              <Route path="/friends" element={
                isSignedIn ? <Friends /> : <Navigate to="/login" replace />
              } />
            </Routes>
          </div>
        </div>
      </LighthouseProvider>
    </UserProvider>
  );
}

export default App;

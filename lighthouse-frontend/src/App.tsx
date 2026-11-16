import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

// Layout
import Navbar from "./components/layout/Navbar";

// Features
import Home from './components/features/Home';
import Contact from "./components/features/Contact";
import LighthouseMap from "./components/features/map/LighthouseMap";
import UserMap from "./components/features/map/UserMap";
import SavedLighthouses from "./components/features/lighthouses/SavedLighthouses";
import Friends from './components/features/friends/Friends';
import AuthPage from './components/auth/AuthPage';
import PageState from './components/layout/PageState';

// Context
import { LighthouseProvider } from "./context/LighthouseContextProvider";

function App() {
  const { isSignedIn, isLoading } = useAuth();

  if (isLoading) {
    return <PageState title="Lighting the way..." message="Loading your Faros workspace." />;
  }

  return (
    <div className="min-h-screen bg-faros-canvas">
      <Navbar />
      <div className="pt-16">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={
            isSignedIn ? <Navigate to="/lighthouse" replace /> : <AuthPage />
          } />
          <Route path="/lighthouse" element={
            <LighthouseProvider>
              {isSignedIn ? <UserMap /> : <LighthouseMap />}
            </LighthouseProvider>
          } />
          <Route path="/visited" element={
            isSignedIn ? <SavedLighthouses key="visited" collection="visited" /> : <Navigate to="/login" replace />
          } />
          <Route path="/wishlist" element={
            isSignedIn ? <SavedLighthouses key="wishlist" collection="wishlist" /> : <Navigate to="/login" replace />
          } />
          <Route path="/friends" element={
            isSignedIn ? <Friends /> : <Navigate to="/login" replace />
          } />
        </Routes>
      </div>
    </div>
  );
}

export default App;

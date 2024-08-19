import Navbar from "./components/navbar";
import LighthouseMap from "./components/lighthousemap";
import { SignedIn, SignedOut } from "@clerk/clerk-react";
import UserMap from "./components/usermap";

function App() {
  return (
    <>
      <Navbar />
      <SignedOut>
        <LighthouseMap />
      </SignedOut>
      <SignedIn>
        <UserMap />
      </SignedIn>
    </>
  );
}

export default App;

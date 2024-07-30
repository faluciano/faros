import Navbar from "./components/navbar";
import LighthouseMap from "./components/lighthousemap";
import { useEffect, useState } from "react";

function App() {
  const [lighthouses, setLighthouses] = useState([]);

  useEffect(() => {
    fetch("http://localhost:8000/api/lighthouses")
      .then((response) => response.json())
      .then((data) => setLighthouses(data));
  }, []);

  return (
    <>
      <Navbar />
      <LighthouseMap lighthouses={lighthouses} />
    </>
  );
}

export default App;

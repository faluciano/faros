import Navbar from "./components/navbar";
import LighthouseMap from "./components/lighthousemap";
import { useEffect, useState } from "react";

interface Lighthouse {
  id: string;
  latitude: number;
  longitude: number;
  name: string;
  image: string;
  state: string;
  country: string;
}

const dummyLighthouses = [
  {
    id: "1",
    latitude: 47.7511,
    longitude: -120.7401,
    name: "Dummy Lighthouse",
    image: "https://example.com/lighthouse.jpg",
    state: "Washington",
    country: "United States",
  },
];

function App() {
  const [lighthouses, setLighthouses] = useState<Lighthouse[]>([]);

  useEffect(() => {
    fetch("http://localhost:8000/api/lighthouses")
      .then((response) => response.json())
      .then((data) => setLighthouses(data))
      .catch(() => setLighthouses(dummyLighthouses));
  }, []);

  return (
    <>
      <Navbar />
      <LighthouseMap lighthouses={lighthouses} />
    </>
  );
}

export default App;

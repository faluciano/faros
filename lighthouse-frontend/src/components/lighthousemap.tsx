import { Marker, MapContainer, Popup, TileLayer } from "react-leaflet";

interface Lighthouse {
  id: number;
  latitude: number;
  longitude: number;
  name: string;
  image: string;
}

const LighthouseMap = ({ lighthouses }: { lighthouses: Array<Lighthouse> }) => {
  return (
    <MapContainer
      center={[47.6062, -122.3321]}
      zoom={10}
      style={{ height: "100vh", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">'
      />
      {lighthouses.map((lighthouse) => (
        <Marker
          key={lighthouse.id}
          position={[lighthouse.latitude, lighthouse.longitude]}
        >
          <Popup>
            {lighthouse.name}
            <br />
            <img
              src={lighthouse.image}
              alt={lighthouse.name}
              style={{ width: "100px" }}
            />
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};
export default LighthouseMap;

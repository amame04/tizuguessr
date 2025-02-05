import { MapContainer, TileLayer } from 'react-leaflet'
import { LatLng } from "leaflet"
import './Map.css';
import "leaflet/dist/leaflet.css";

export const Map = () => {
  const position = new LatLng(51.505, -0.09);
  const zoom = 13;

  return (
    <div className="App">
      <MapContainer center={position} zoom={zoom}>
        <TileLayer
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
      </MapContainer>
    </div>
  );
};

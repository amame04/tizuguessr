import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import Leaflet, { LatLng } from "leaflet"
import './Map.css';
import "leaflet/dist/leaflet.css";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

export const Map = ({ lat, lng }: any) => {
  const position = new LatLng(lat, lng);
  const zoom = 16;

  const DefaultIcon = Leaflet.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
  });
  Leaflet.Marker.prototype.options.icon = DefaultIcon;

  return (
    <div className="App">
      <MapContainer
        minZoom={0}
        maxZoom={18}
        center={position}
        zoom={zoom}
        scrollWheelZoom={false}
        dragging={false}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position} />
      </MapContainer>
    </div>
  );
};

import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import Leaflet, { LatLng } from 'leaflet';
import './map.css';
import 'leaflet/dist/leaflet.css';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

export const Map = ({ lat, lng, isAnswered }: any) => {
  const position = new LatLng(lat, lng);
  const zoom = 16;

  const markerIcon = Leaflet.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [24, 36],
    iconAnchor: [12, 36],
  });

  if (isAnswered) {
    return (
      <MapContainer
        center={position}
        zoom={zoom}
      >
        <Marker position={position} icon={markerIcon} />
        <TileLayer
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
      </MapContainer>
    );
  } else {
    return (
      <MapContainer
        minZoom={zoom}
        maxZoom={zoom}
        center={position}
        zoom={zoom}
        dragging={false}
        scrollWheelZoom={false}
        boxZoom={false}
        touchZoom={false}
        zoomControl={false}
        doubleClickZoom={false}
      >
        <Marker position={position} icon={markerIcon}/>
        <TileLayer
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
      </MapContainer>
    );
  } 
};

export const AnswerMap = ({ lat, lng }: any) => {
  const position = new LatLng(lat, lng);
  const zoom = 16;

  const markerIcon = Leaflet.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
  });

  return (
    <MapContainer
      center={position}
      zoom={zoom}
    >
      <Marker position={position} icon={markerIcon} />
      <TileLayer
        attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
    </MapContainer>
  );
};

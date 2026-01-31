import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default icon issue in Leaflet with Webpack/Vite
// We will use custom icons anyway, but good to have a backup or cleaner approach.

interface Device {
  id: string;
  name: string;
  serialNumber: string;
  status: string;
  expiryDate: string;
  location: string;
  latitude?: number;
  longitude?: number;
  organization: {
    name: string;
  };
}

interface DeviceMapProps {
  devices: Device[];
}

const getIcon = (status: string) => {
  let iconUrl = 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'; // Default Red
  if (status === 'ACTIVE') {
    iconUrl = 'http://maps.google.com/mapfiles/ms/icons/green-dot.png';
  } else if (status === 'EXPIRING_SOON') {
    iconUrl = 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png'; // Google uses yellow for warning-ish
  } else if (status === 'EXPIRED' || status === 'SUSPENDED') {
    iconUrl = 'http://maps.google.com/mapfiles/ms/icons/red-dot.png';
  }

  return new L.Icon({
    iconUrl,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

const DeviceMap: React.FC<DeviceMapProps> = ({ devices }) => {
  // Default center (UK)
  const defaultCenter: [number, number] = [52.3555, -1.1743];
  
  // Filter devices that have coordinates
  const validDevices = devices.filter(d => d.latitude && d.longitude);

  const tileLayerUrl = import.meta.env.VITE_MAP_TILE_LAYER_URL || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  return (
    <div className="h-[600px] w-full rounded-lg overflow-hidden border border-gray-200 shadow-md z-0">
      <MapContainer 
        center={defaultCenter} 
        zoom={6} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url={tileLayerUrl}
        />
        {validDevices.map((device) => (
          <Marker
            key={device.id}
            position={[device.latitude!, device.longitude!]}
            icon={getIcon(device.status)}
          >
            <Popup>
              <div className="p-2 min-w-[200px]">
                <h3 className="font-bold text-gray-900 text-lg mb-1">{device.name}</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><span className="font-semibold">Serial:</span> {device.serialNumber}</p>
                  <p><span className="font-semibold">Location:</span> {device.location}</p>
                  <p><span className="font-semibold">Org:</span> {device.organization.name}</p>
                  <p className="mt-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold
                      ${device.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 
                        device.status === 'EXPIRING_SOON' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'}`}>
                      {device.status}
                    </span>
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Expires: {new Date(device.expiryDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default DeviceMap;

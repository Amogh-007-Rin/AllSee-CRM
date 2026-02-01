import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
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
  graceTokenExpiry?: string | null;
  location: string;
  latitude?: number;
  longitude?: number;
  organization: {
    name: string;
  };
  activeRenewalRequest?: boolean;
}

interface DeviceMapProps {
  devices: Device[];
  searchLocation?: string;
  user: any;
  onRenew: (device: Device) => void;
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

const MapController: React.FC<{ center?: [number, number] }> = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 12); // Zoom level 12 for city view
    }
  }, [center, map]);
  return null;
};

const DeviceMap: React.FC<DeviceMapProps> = ({ devices, searchLocation, user, onRenew }) => {
  // Default center (UK)
  const defaultCenter: [number, number] = [52.3555, -1.1743];
  const [mapCenter, setMapCenter] = React.useState<[number, number] | undefined>(undefined);
  
  // Filter devices that have coordinates
  const validDevices = devices.filter(d => d.latitude && d.longitude);

  useEffect(() => {
    const fetchCoordinates = async () => {
      if (!searchLocation) {
        setMapCenter(undefined);
        return;
      }

      // 1. Try to find a matching device first (Priority 1)
      const matchedDevice = validDevices.find(d => 
        d.location.toLowerCase().includes(searchLocation.toLowerCase()) || 
        d.name.toLowerCase().includes(searchLocation.toLowerCase())
      );

      if (matchedDevice && matchedDevice.latitude && matchedDevice.longitude) {
        const lat = matchedDevice.latitude;
        const lon = matchedDevice.longitude;
        setMapCenter(prev => {
          if (prev && prev[0] === lat && prev[1] === lon) return prev;
          return [lat, lon];
        });
        return;
      }

      // 2. If no device match, try global geocoding (Priority 2)
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchLocation)}`);
        const data = await response.json();
        
        if (data && data.length > 0) {
          const { lat, lon } = data[0];
          const newLat = parseFloat(lat);
          const newLon = parseFloat(lon);
          setMapCenter(prev => {
            if (prev && prev[0] === newLat && prev[1] === newLon) return prev;
            return [newLat, newLon];
          });
        }
      } catch (error) {
        console.error("Geocoding failed", error);
      }
    };

    const timeoutId = setTimeout(() => {
      fetchCoordinates();
    }, 500); // Debounce to avoid spamming the API

    return () => clearTimeout(timeoutId);
  }, [searchLocation, validDevices]);

  const tileLayerUrl = import.meta.env.VITE_MAP_TILE_LAYER_URL || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  return (
    <div className="h-[calc(100vh-12rem)] w-full rounded-lg overflow-hidden border border-gray-200 shadow-md z-0">
      <MapContainer 
        center={defaultCenter} 
        zoom={6} 
        style={{ height: '100%', width: '100%' }}
      >
        <MapController center={mapCenter} />
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
              <div className="p-4 min-w-[320px]">
                <div className="flex justify-between items-start mb-3 border-b pb-2">
                   <div>
                      <h3 className="font-bold text-gray-900 text-lg leading-tight">{device.name}</h3>
                      <span className="text-xs text-gray-500 font-mono">{device.serialNumber}</span>
                   </div>
                   <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wide
                      ${device.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 
                        device.status === 'EXPIRING_SOON' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'}`}>
                      {device.status}
                    </span>
                </div>
                
                <div className="space-y-3 text-sm">
                   <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="block text-gray-500 text-xs uppercase font-semibold mb-1">Location</span>
                        <span className="font-medium text-gray-800">{device.location}</span>
                      </div>
                      <div>
                        <span className="block text-gray-500 text-xs uppercase font-semibold mb-1">Organization</span>
                        <span className="font-medium text-gray-800">{device.organization.name}</span>
                      </div>
                   </div>
                   
                   <div className="bg-gray-50 p-2 rounded">
                      <span className="block text-gray-500 text-xs uppercase font-semibold mb-1">License Expiry</span>
                      <span className={`font-bold text-base ${new Date(device.expiryDate) < new Date() ? 'text-red-600' : 'text-gray-800'}`}>
                        {new Date(device.expiryDate).toLocaleDateString()}
                      </span>
                   </div>

                   {/* Grace Period Indicator */}
                   {device.graceTokenExpiry && new Date(device.graceTokenExpiry) > new Date() && (
                      <div className="bg-purple-50 text-purple-700 px-3 py-2 rounded-md text-xs font-semibold border border-purple-100 flex items-center">
                         <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                         Active Grace Period
                      </div>
                   )}

                   {/* Action Button */}
                   {device.status === 'EXPIRED' && (
                      <div className="mt-4 pt-2">
                         {device.activeRenewalRequest ? (
                            <button disabled className="w-full bg-gray-100 text-gray-400 py-2.5 rounded-md text-sm font-medium cursor-not-allowed border border-gray-200">
                               Renewal Requested
                            </button>
                         ) : (
                            <button 
                               onClick={() => onRenew(device)}
                               className="w-full bg-blue-600 text-white py-2.5 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm flex justify-center items-center"
                            >
                               {user?.orgType === 'CHILD' ? 'Request Renewal' : 
                                user?.billingMode === 'RESELLER_ONLY' ? 'Request Quote' : 'Renew License'}
                            </button>
                         )}
                      </div>
                   )}
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

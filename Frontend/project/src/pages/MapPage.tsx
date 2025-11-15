import { useState, useEffect, useRef } from 'react';
import { MapPin, Bus, Navigation, Clock, AlertCircle, Target } from 'lucide-react';
import { apiService } from '../services/api';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
  iconUrl: iconUrl,
  shadowUrl: shadowUrl,
});


const createBusIcon = (color: string) => {
  return L.divIcon({
    html: `
      <div style="
        background-color: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
          <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/>
        </svg>
      </div>
    `,
    className: 'custom-bus-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

interface BusLocationResponse {
  busId: string;
  latitude: number;
  longitude: number;
  timestamp: number;
  stopIndex: number;
  delay_minutes: number;
  status: 'ON_TIME' | 'DELAYED' | 'EARLY' | 'UNKNOWN_SCHEDULE' | 'NO_SCHEDULE_DATA';
}
interface ActiveBus {
  id: string;
  line: string;
  position: string;
  eta: string;
  status: string;
  delay: number;
  latitude: number | null;
  longitude: number | null;
}

interface MapPageProps {
  token: string | null;
}

const INITIAL_BUS_STATE: ActiveBus[] = [
  { id: 'BUS-12', line: 'Ligne 12', position: 'En attente...', eta: '...', status: 'LOADING', delay: 0, latitude: null, longitude: null },
  { id: 'BUS-07', line: 'Ligne 7', position: 'En attente...', eta: '...', status: 'LOADING', delay: 0, latitude: null, longitude: null },
  { id: 'BUS-19', line: 'Ligne 19', position: 'En attente...', eta: '...', status: 'LOADING', delay: 0, latitude: null, longitude: null },
  { id: 'BUS-30', line: 'Ligne 30', position: 'En attente...', eta: '...', status: 'LOADING', delay: 0, latitude: null, longitude: null },
  { id: 'BUS-04', line: 'Ligne 4', position: 'En attente...', eta: '...', status: 'LOADING', delay: 0, latitude: null, longitude: null },
];

function MapController({ center, zoom }: { center: [number, number] | null; zoom?: number }) {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom || 15, {
        duration: 1.5
      });
    }
  }, [center, map, zoom]);
  
  return null;
}

export default function MapPage({ token }: MapPageProps) {
  const [activeBuses, setActiveBuses] = useState<ActiveBus[]>(INITIAL_BUS_STATE);
  const [error, setError] = useState<string | null>(null);
  const [selectedBusId, setSelectedBusId] = useState<string | null>(null);
  const [followMode, setFollowMode] = useState<boolean>(false);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (!token) {
      setError("Vous devez être connecté pour voir la carte en temps réel.");
      setActiveBuses(prev => prev.map(b => ({ ...b, status: 'ERROR', position: 'Non connecté', latitude: null, longitude: null })));
      return;
    }

    const fetchAllBusData = async () => {
      setError(null);

      const busIdsToFetch = INITIAL_BUS_STATE.map(bus => bus.id);
      const promises = busIdsToFetch.map(id => 
        apiService.getBusLocation(id, token)
      );

      try {
        const responses = await Promise.all(promises);

        setActiveBuses(prevBuses => {
          const newDataMap = new Map<string, BusLocationResponse>();
          for (const res of responses) {
            if (res.data) {
              newDataMap.set(res.data.busId, res.data);
            }
          }

          return prevBuses.map(bus => {
            const newData = newDataMap.get(bus.id);
            
            if (newData) {
              const delay = newData.delay_minutes;
              let etaText = '';
              if (delay > 1) etaText = `${delay} min retard`;
              else if (delay < -1) etaText = `${Math.abs(delay)} min avance`;
              else etaText = 'À l\'heure';

              return {
                ...bus,
                position: `Lat: ${newData.latitude.toFixed(4)}, Lng: ${newData.longitude.toFixed(4)}`,
                latitude: newData.latitude,
                longitude: newData.longitude,
                eta: etaText,
                status: newData.status,
                delay: newData.delay_minutes,
              };
            } else {
              return { ...bus, status: 'NO_SIGNAL', position: 'Signal perdu', latitude: null, longitude: null };
            }
          });
        });

      } catch (err: any) {
        
        setError("Erreur de connexion au service de géolocalisation.");
      }
    };

    fetchAllBusData();
    const intervalId = setInterval(fetchAllBusData, 10000);

    return () => {
      clearInterval(intervalId);
    };

  }, [token]);

  useEffect(() => {
    if (followMode && selectedBusId) {
      const selectedBus = activeBuses.find(b => b.id === selectedBusId);
      if (selectedBus && selectedBus.latitude && selectedBus.longitude) {
        setMapCenter([selectedBus.latitude, selectedBus.longitude]);
      }
    }
  }, [activeBuses, selectedBusId, followMode]);

  const handleBusClick = (busId: string) => {
    if (selectedBusId === busId) {
      setSelectedBusId(null);
      setFollowMode(false);
      setMapCenter(null);
    } else {
      setSelectedBusId(busId);
      const bus = activeBuses.find(b => b.id === busId);
      if (bus && bus.latitude && bus.longitude) {
        setMapCenter([bus.latitude, bus.longitude]);
        setFollowMode(true);
      }
    }
  };

  const getMarkerColor = (bus: ActiveBus) => {
    if (bus.id === selectedBusId) return '#F59E0B'; 
    if (bus.status === 'ON_TIME') return '#10B981'; 
    if (bus.status === 'DELAYED') return '#EF4444'; 
    if (bus.status === 'EARLY') return '#3B82F6'; 
    return '#6B7280'; 
  };

  

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-navy-900 mb-4">
            Carte en Temps Réel
          </h1>
          <p className="text-xl text-gray-600">
            Suivez la position de vos bus en direct
          </p>
        </div>

        
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-8 flex items-start space-x-3 max-w-3xl mx-auto">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
            <div>
              <p className="text-red-800 font-semibold">Erreur</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
         
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-navy-900 text-white px-6 py-4 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5 text-mustard-500" />
                  <span className="font-semibold">Carte Interactive</span>
                  {selectedBusId && (
                    <span className="ml-2 text-sm bg-mustard-500 text-navy-900 px-2 py-1 rounded">
                      Suivi: {activeBuses.find(b => b.id === selectedBusId)?.line}
                    </span>
                  )}
                </div>
                <div className="flex space-x-2">
                  {selectedBusId && (
                    <button 
                      onClick={() => setFollowMode(!followMode)}
                      className={`px-4 py-2 rounded-lg font-semibold transition-colors flex items-center space-x-2 ${
                        followMode 
                          ? 'bg-green-500 text-white hover:bg-green-600' 
                          : 'bg-gray-600 text-white hover:bg-gray-700'
                      }`}
                    >
                      <Target className="h-4 w-4" />
                      <span>{followMode ? 'Suivi Actif' : 'Activer Suivi'}</span>
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      setSelectedBusId(null);
                      setFollowMode(false);
                      setMapCenter([34.020882, -6.841650]);
                    }}
                    className="bg-mustard-500 text-navy-900 px-4 py-2 rounded-lg font-semibold hover:bg-mustard-600 transition-colors flex items-center space-x-2"
                  >
                    <Navigation className="h-4 w-4" />
                    <span>Réinitialiser</span>
                  </button>
                </div>
              </div>

              <MapContainer 
                center={[34.020882, -6.841650]}
                zoom={13} 
                style={{ height: '600px', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapController center={mapCenter} zoom={followMode ? 16 : undefined} />

                {activeBuses.map(bus => (
                  (bus.latitude && bus.longitude && bus.status !== 'NO_SIGNAL') && (
                    <Marker 
                      key={bus.id} 
                      position={[bus.latitude, bus.longitude]}
                      icon={createBusIcon(getMarkerColor(bus))}
                      eventHandlers={{
                        click: () => handleBusClick(bus.id)
                      }}
                    >
                      <Popup>
                        <div className="text-center">
                          <b className="text-lg">{bus.line}</b>
                          <p className="text-xs text-gray-500">({bus.id})</p>
                          <p className="mt-2">Statut : <b>{bus.eta}</b></p>
                          <p className="text-xs text-gray-600 mt-1">{bus.position}</p>
                          <button
                            onClick={() => handleBusClick(bus.id)}
                            className="mt-2 bg-mustard-500 text-white px-3 py-1 rounded text-sm hover:bg-mustard-600"
                          >
                            {selectedBusId === bus.id ? 'Arrêter le suivi' : 'Suivre ce bus'}
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  )
                ))}
              </MapContainer>

            </div>
          </div>
          

          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-navy-900 mb-6 flex items-center space-x-2">
                <Bus className="h-6 w-6 text-mustard-500" />
                <span>Bus en Circulation</span>
              </h2>

              <div className="space-y-4">
                {activeBuses.map((bus) => (
                  <div
                    key={bus.id}
                    onClick={() => handleBusClick(bus.id)}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      selectedBusId === bus.id 
                        ? 'border-mustard-500 bg-mustard-50 shadow-md' 
                        : 'border-gray-200 hover:border-mustard-300 hover:shadow'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-navy-900">{bus.line}</h3>
                        
                        {selectedBusId === bus.id && (
                          <p className="text-xs text-mustard-600 font-semibold mt-1 flex items-center">
                            <Target className="h-3 w-3 mr-1" />
                            Bus suivi
                          </p>
                        )}
                      </div>

                      <div 
                        title={`Statut: ${bus.status}`}
                        className={`h-3 w-3 rounded-full ${
                          bus.status === 'ON_TIME' ? 'bg-green-500' :
                          bus.status === 'DELAYED' ? 'bg-red-500' :
                          bus.status === 'LOADING' ? 'bg-gray-400 animate-pulse' :
                          bus.status === 'NO_SIGNAL' ? 'bg-gray-400' :
                          'bg-yellow-500'
                        }`}
                      ></div>
                    </div>

                    <div className="space-y-2">

                      <div className="flex items-start space-x-2">
                        <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-500">Position</p>
                          <p className="text-sm font-semibold text-navy-900 break-all">{bus.position}</p>
                        </div>
                      </div>


                      <div className={`flex items-center space-x-2 px-3 py-1 rounded-lg font-bold text-sm w-fit ${
                        bus.delay > 1 ? 'bg-red-100 text-red-900' :
                        bus.delay < -1 ? 'bg-blue-100 text-blue-900' :
                        'bg-green-100 text-green-900'
                      }`}>
                        <Clock className="h-4 w-4" />
                        <span>{bus.eta}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
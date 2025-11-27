import { useState, useEffect, useRef } from 'react';
import { MapPin, Bus, Navigation, Clock, AlertCircle, Target, Filter, RefreshCw, Info, Users } from 'lucide-react';
import { apiService } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';
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

interface CapacityInfo {
  total: number;
  occupied: number;
  available: number;
  occupancyRate: number;
}

interface BusLocationResponse {
  busId: string;
  latitude: number;
  longitude: number;
  timestamp: number;
  stopIndex: number;
  delay_minutes: number;
  status: 'ON_TIME' | 'DELAYED' | 'EARLY' | 'UNKNOWN_SCHEDULE' | 'NO_SCHEDULE_DATA';
  capacity?: CapacityInfo;
}
interface DriverInfo {
  driverId: number;
  driverName: string;
  driverPhone: string;
  driverLicense: string;
  shift: string;
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
  driver?: DriverInfo | null;
  capacity?: CapacityInfo | null;
}

interface MapPageProps {
  token: string | null;
  userRole?: string | null;
}

const INITIAL_BUS_STATE: ActiveBus[] = [
  { id: 'BUS-12', line: 'Ligne 12', position: 'En attente...', eta: '...', status: 'LOADING', delay: 0, latitude: null, longitude: null, driver: null, capacity: null },
  { id: 'BUS-07', line: 'Ligne 7', position: 'En attente...', eta: '...', status: 'LOADING', delay: 0, latitude: null, longitude: null, driver: null, capacity: null },
  { id: 'BUS-19', line: 'Ligne 19', position: 'En attente...', eta: '...', status: 'LOADING', delay: 0, latitude: null, longitude: null, driver: null, capacity: null },
  { id: 'BUS-30', line: 'Ligne 30', position: 'En attente...', eta: '...', status: 'LOADING', delay: 0, latitude: null, longitude: null, driver: null, capacity: null },
  { id: 'BUS-04', line: 'Ligne 4', position: 'En attente...', eta: '...', status: 'LOADING', delay: 0, latitude: null, longitude: null, driver: null, capacity: null },
];

// Available lines for filtering
const AVAILABLE_LINES = ['Toutes', 'Ligne 4', 'Ligne 7', 'Ligne 12', 'Ligne 19', 'Ligne 30'];

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

export default function MapPage({ token, userRole }: MapPageProps) {
  const { t } = useLanguage();
  const [activeBuses, setActiveBuses] = useState<ActiveBus[]>(INITIAL_BUS_STATE);
  const [error, setError] = useState<string | null>(null);
  const [selectedBusId, setSelectedBusId] = useState<string | null>(null);
  const [followMode, setFollowMode] = useState<boolean>(false);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [selectedLine, setSelectedLine] = useState<string>('Toutes');
  const [showLegend, setShowLegend] = useState<boolean>(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Filter buses by selected line
  const filteredBuses = selectedLine === 'Toutes'
    ? activeBuses
    : activeBuses.filter(bus => bus.line === selectedLine);

  // Stats for the header
  const busStats = {
    total: activeBuses.length,
    onTime: activeBuses.filter(b => b.status === 'ON_TIME').length,
    delayed: activeBuses.filter(b => b.status === 'DELAYED').length,
    early: activeBuses.filter(b => b.status === 'EARLY').length,
  };

  useEffect(() => {
    if (!token) {
      setError("Vous devez être connecté pour voir la carte en temps réel.");
      setActiveBuses(prev => prev.map(b => ({ ...b, status: 'ERROR', position: 'Non connecté', latitude: null, longitude: null })));
      return;
    }

    const fetchAllBusData = async () => {
      setError(null);
      setIsRefreshing(true);

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
                driver: (newData as any).driver || null,
                capacity: newData.capacity || null,
              };
            } else {
              return { ...bus, status: 'NO_SIGNAL', position: 'Signal perdu', latitude: null, longitude: null, driver: null, capacity: null };
            }
          });
        });

        setLastUpdate(new Date());

      } catch (err: any) {

        setError("Erreur de connexion au service de géolocalisation.");
      } finally {
        setIsRefreshing(false);
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
            {t.map.title}
          </h1>
          <p className="text-xl text-gray-600">
            {t.map.subtitle}
          </p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4 flex items-center space-x-3">
            <div className="bg-navy-100 p-2 rounded-lg">
              <Bus className="h-5 w-5 text-navy-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{t.map.totalBuses}</p>
              <p className="text-xl font-bold text-navy-900">{busStats.total}</p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 flex items-center space-x-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <Clock className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{t.map.onTime}</p>
              <p className="text-xl font-bold text-green-600">{busStats.onTime}</p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 flex items-center space-x-3">
            <div className="bg-red-100 p-2 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{t.map.delayed}</p>
              <p className="text-xl font-bold text-red-600">{busStats.delayed}</p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{t.map.early}</p>
              <p className="text-xl font-bold text-blue-600">{busStats.early}</p>
            </div>
          </div>
        </div>

        
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-8 flex items-start space-x-3 max-w-3xl mx-auto">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
            <div>
              <p className="text-red-800 font-semibold">{t.common.error}</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
         
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-navy-900 text-white px-6 py-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-5 w-5 text-mustard-500" />
                    <span className="font-semibold">Carte Interactive</span>
                    {selectedBusId && (
                      <span className="ml-2 text-sm bg-mustard-500 text-navy-900 px-2 py-1 rounded">
                        Suivi: {activeBuses.find(b => b.id === selectedBusId)?.line}
                      </span>
                    )}
                    {lastUpdate && (
                      <span className="text-xs text-gray-400 ml-2">
                        Mis à jour: {lastUpdate.toLocaleTimeString('fr-FR')}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {/* Line Filter */}
                    <div className="relative">
                      <select
                        value={selectedLine}
                        onChange={(e) => setSelectedLine(e.target.value)}
                        className="bg-gray-700 text-white px-3 py-2 rounded-lg text-sm appearance-none pr-8 cursor-pointer hover:bg-gray-600 transition-colors"
                      >
                        {AVAILABLE_LINES.map(line => (
                          <option key={line} value={line}>{line}</option>
                        ))}
                      </select>
                      <Filter className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>

                    {/* Legend Toggle */}
                    <button
                      onClick={() => setShowLegend(!showLegend)}
                      className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center space-x-1 ${
                        showLegend ? 'bg-mustard-500 text-navy-900' : 'bg-gray-600 text-white hover:bg-gray-700'
                      }`}
                    >
                      <Info className="h-4 w-4" />
                      <span>Légende</span>
                    </button>

                    {selectedBusId && (
                      <button
                        onClick={() => setFollowMode(!followMode)}
                        className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center space-x-1 ${
                          followMode
                            ? 'bg-green-500 text-white hover:bg-green-600'
                            : 'bg-gray-600 text-white hover:bg-gray-700'
                        }`}
                      >
                        <Target className="h-4 w-4" />
                        <span>{followMode ? 'Suivi Actif' : 'Suivre'}</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSelectedBusId(null);
                        setFollowMode(false);
                        setMapCenter([34.020882, -6.841650]);
                      }}
                      className="bg-mustard-500 text-navy-900 px-3 py-2 rounded-lg text-sm font-semibold hover:bg-mustard-600 transition-colors flex items-center space-x-1"
                    >
                      <Navigation className="h-4 w-4" />
                      <span>Reset</span>
                    </button>
                  </div>
                </div>

                {/* Legend */}
                {showLegend && (
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 rounded-full bg-green-500"></div>
                        <span>À l'heure</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 rounded-full bg-red-500"></div>
                        <span>En retard</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                        <span>En avance</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                        <span>Sélectionné</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 rounded-full bg-gray-500"></div>
                        <span>Sans signal</span>
                      </div>
                    </div>
                  </div>
                )}
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

                {filteredBuses.map(bus => (
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
                        <div className="text-center min-w-[250px]">
                          <b className="text-lg">{bus.line}</b>
                          <p className="text-xs text-gray-500">({bus.id})</p>
                          <p className="mt-2">Statut : <b>{bus.eta}</b></p>
                          <p className="text-xs text-gray-600 mt-1">{bus.position}</p>

                          {/* Capacité du bus */}
                          {bus.capacity && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <div className="flex items-center justify-center space-x-2 mb-2">
                                <Users className="h-4 w-4 text-navy-900" />
                                <p className="text-sm font-semibold text-navy-900">Capacité</p>
                              </div>
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-gray-600">Occupés:</span>
                                <span className="font-semibold text-navy-900">{bus.capacity.occupied}/{bus.capacity.total}</span>
                              </div>
                              <div className="flex items-center justify-between text-xs mb-2">
                                <span className="text-gray-600">Disponibles:</span>
                                <span className={`font-semibold ${bus.capacity.available < 10 ? 'text-red-600' : 'text-green-600'}`}>
                                  {bus.capacity.available} places
                                </span>
                              </div>
                              {/* Barre de progression */}
                              <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div
                                  className={`h-2.5 rounded-full ${
                                    bus.capacity.occupancyRate > 80 ? 'bg-red-500' :
                                    bus.capacity.occupancyRate > 60 ? 'bg-yellow-500' : 'bg-green-500'
                                  }`}
                                  style={{ width: `${bus.capacity.occupancyRate}%` }}
                                ></div>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">{bus.capacity.occupancyRate}% occupé</p>
                            </div>
                          )}

                          {/* Informations du chauffeur (ADMIN et CONTROLLER uniquement) */}
                          {(userRole === 'ADMIN' || userRole === 'CONTROLLER') && bus.driver && (
                            <div className="mt-3 pt-3 border-t border-gray-200 text-left">
                              <p className="text-sm font-semibold text-navy-900 mb-2">👤 Chauffeur</p>
                              <p className="text-xs"><span className="font-medium">Nom:</span> {bus.driver.driverName}</p>
                              <p className="text-xs"><span className="font-medium">Tél:</span> {bus.driver.driverPhone}</p>
                              <p className="text-xs"><span className="font-medium">Permis:</span> {bus.driver.driverLicense}</p>
                              <p className="text-xs"><span className="font-medium">Shift:</span> {bus.driver.shift}</p>
                            </div>
                          )}

                          <button
                            onClick={() => handleBusClick(bus.id)}
                            className="mt-3 bg-mustard-500 text-white px-3 py-1 rounded text-sm hover:bg-mustard-600 w-full"
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
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-navy-900 flex items-center space-x-2">
                  <Bus className="h-6 w-6 text-mustard-500" />
                  <span>{t.map.busesInCirculation}</span>
                </h2>
                <span className="text-sm text-gray-500">
                  {filteredBuses.length}/{activeBuses.length}
                </span>
              </div>

              {selectedLine !== 'Toutes' && (
                <div className="mb-4 bg-mustard-50 border border-mustard-200 rounded-lg p-3 flex items-center justify-between">
                  <span className="text-sm text-mustard-800">
                    Filtre: <strong>{selectedLine}</strong>
                  </span>
                  <button
                    onClick={() => setSelectedLine('Toutes')}
                    className="text-xs text-mustard-600 hover:text-mustard-800"
                  >
                    Effacer
                  </button>
                </div>
              )}

              <div className="space-y-4 max-h-[500px] overflow-y-auto">
                {filteredBuses.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">Aucun bus trouvé</p>
                ) : (
                  filteredBuses.map((bus) => (
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
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
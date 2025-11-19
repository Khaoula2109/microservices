import { useState, useEffect, useRef } from 'react';
import { Search, Clock, MapPin, Bus, AlertCircle, Plus, Settings, Map, Link, Trash2, Navigation } from 'lucide-react';
import { apiService } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';


interface BusStop {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  order?: number;
}

interface Route {
  id: number;
  name: string;
  description?: string;
  startPoint?: string;
  endPoint?: string;
  stops?: BusStop[];
}

interface Schedule {
  id: number;
  line: string;
  departure: string;
  arrival: string;
  times: string[];
  duration: string;
  stops?: BusStop[];
}

interface ApiResponse {
  success?: boolean;
  data?: any;
  message?: string;
  error?: string;
  count?: number;
}

interface SchedulesPageProps {
  token: string | null;
  userRole?: string | null;
}


declare global {
  interface Window {
    L: any;
  }
}

export default function SchedulesPage({ token, userRole }: SchedulesPageProps) {
  const { t } = useLanguage();
  const [busLine, setBusLine] = useState('');
  const [stop, setStop] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [schedulesLoading, setSchedulesLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState('');
  const [adminSuccess, setAdminSuccess] = useState('');
  const [selectedRouteStops, setSelectedRouteStops] = useState<BusStop[]>([]);
  const [stopsLoading, setStopsLoading] = useState(false);
  const [availableStops, setAvailableStops] = useState<BusStop[]>([]);
  const [stopsLoadingAll, setStopsLoadingAll] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);


  const [newRoute, setNewRoute] = useState({
    name: '',
    description: '',
    startPoint: '',
    endPoint: ''
  });


  const [newStop, setNewStop] = useState({
    name: '',
    latitude: '',
    longitude: ''
  });

  const [selectedRouteForStop, setSelectedRouteForStop] = useState('');
  const [stopOrder, setStopOrder] = useState('');
  const [selectedStopForLink, setSelectedStopForLink] = useState('');

  const isAdmin = userRole === 'ADMIN';

 
  const initializeMap = () => {
    if (!mapRef.current || !window.L) return;


    const defaultLat = 34.020882;
    const defaultLng = -6.841650;


    const map = window.L.map(mapRef.current).setView([defaultLat, defaultLng], 13);
    mapInstanceRef.current = map;

  
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);


    markerRef.current = window.L.marker([defaultLat, defaultLng], {
      draggable: true
    }).addTo(map);

    markerRef.current.on('dragend', function(event: any) {
      const marker = event.target;
      const position = marker.getLatLng();
      setSelectedLocation({
        lat: position.lat,
        lng: position.lng
      });
      setNewStop(prev => ({
        ...prev,
        latitude: position.lat.toString(),
        longitude: position.lng.toString()
      }));
    });


    map.on('click', function(event: any) {
      const { lat, lng } = event.latlng;
      setSelectedLocation({ lat, lng });
      setNewStop(prev => ({
        ...prev,
        latitude: lat.toString(),
        longitude: lng.toString()
      }));


      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      }
    });

    setSelectedLocation({ lat: defaultLat, lng: defaultLng });
    setNewStop(prev => ({
      ...prev,
      latitude: defaultLat.toString(),
      longitude: defaultLng.toString()
    }));
  };


  const cleanupMap = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    }
  };


  const loadStopsForAllRoutes = async (routesData: any[]) => {
    if (!token) return routesData;
    
    
    
    try {
      const routesWithStops = await Promise.all(
        routesData.map(async (route) => {
          try {
            
            const stopsResponse = await apiService.getStopsForRoute(route.id, token);
            
            if (stopsResponse && stopsResponse.success && stopsResponse.data) {
              const stops = Array.isArray(stopsResponse.data) ? stopsResponse.data : [];
              
              return {
                ...route,
                stops: stops
              };
            } else {
              console.warn(`⚠️ Route ${route.name}: Aucun arrêt chargé`, stopsResponse);
              return route;
            }
          } catch (error) {
            console.error(`❌ Erreur chargement arrêts route ${route.id}:`, error);
            return route;
          }
        })
      );
      
      return routesWithStops;
    } catch (error) {
      console.error('❌ Erreur lors du chargement des arrêts:', error);
      return routesData;
    }
  };

 
  useEffect(() => {
    const loadRoutesAndSchedules = async () => {
      if (!token) {
        setError("Vous devez être connecté pour voir les horaires.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');
      
      try {

        const routesResponse = await apiService.getRoutes(token);
        
        
        let routesData: any[] = [];

        if (routesResponse && typeof routesResponse === 'object') {
          const apiResponse = routesResponse as ApiResponse;
          
          if (apiResponse.data && typeof apiResponse.data === 'object' && 'success' in apiResponse.data) {
            const nestedData = apiResponse.data as ApiResponse;
            if (nestedData.success && nestedData.data && Array.isArray(nestedData.data)) {
              routesData = nestedData.data;
            }
          }
          else if (apiResponse.success && apiResponse.data && Array.isArray(apiResponse.data)) {
            routesData = apiResponse.data;
          }
          else if (apiResponse.data && Array.isArray(apiResponse.data)) {
            routesData = apiResponse.data;
          }
          else if (Array.isArray(routesResponse)) {
            routesData = routesResponse;
          }
        }

        
        setRoutes(routesData);


        const routesWithStops = await loadStopsForAllRoutes(routesData);


        const schedulesData: Schedule[] = routesWithStops.map(route => ({
          id: route.id,
          line: route.name,
          departure: route.startPoint || 'Départ',
          arrival: route.endPoint || 'Arrivée',
          times: ['06:00', '07:15', '08:30', '09:45', '11:00', '12:15', '13:30', '14:45', '16:00', '17:15', '18:30', '19:45'],
          duration: '35 min',
          stops: route.stops || [] 
        }));

        setSchedules(schedulesData);
        
        
      } catch (err: any) {
        console.error('❌ Error loading routes:', err);
        setError('Erreur lors du chargement des routes et horaires');
        setRoutes([]);
        setSchedules([]);
      } finally {
        setLoading(false);
      }
    };

    loadRoutesAndSchedules();
  }, [token]);


  const loadRouteStops = async (routeId: number) => {
    if (!token) return;
    
    setStopsLoading(true);
    try {
      const response = await apiService.getStopsForRoute(routeId, token);
      
      
      if (response && response.success && response.data) {
        const stopsData = Array.isArray(response.data) ? response.data : [];
        
        setSelectedRouteStops(stopsData);
      } else {
        console.warn('⚠️ No stops data or API error:', response);
        setSelectedRouteStops([]);
      }
    } catch (err: any) {
      console.error('❌ Error loading stops:', err);
      setSelectedRouteStops([]);
    } finally {
      setStopsLoading(false);
    }
  };

  const loadAllStops = async () => {
    if (!token) {
      console.warn('❌ No token available');
      return;
    }
    
    setStopsLoadingAll(true);
    try {
      
      const response = await apiService.getAllStops(token);
      
      
      if (response && response.success) {
        const stopsData = Array.isArray(response.data) ? response.data : [];
        
        setAvailableStops(stopsData);
      } else {
        console.warn('⚠️ No stops data received or API error:', response);
        setAvailableStops([]);
      }
    } catch (err: any) {
      console.error('❌ Error loading all stops:', err);
      setAvailableStops([]);
    } finally {
      setStopsLoadingAll(false);
    }
  };


  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSchedulesLoading(true);
    
    try {

      const routesResponse = await apiService.getRoutes(token!);
      let routesData: any[] = [];

      if (routesResponse && typeof routesResponse === 'object') {
        const apiResponse = routesResponse as ApiResponse;
        
        if (apiResponse.data && typeof apiResponse.data === 'object' && 'success' in apiResponse.data) {
          const nestedData = apiResponse.data as ApiResponse;
          if (nestedData.success && nestedData.data && Array.isArray(nestedData.data)) {
            routesData = nestedData.data;
          }
        } else if (apiResponse.success && apiResponse.data && Array.isArray(apiResponse.data)) {
          routesData = apiResponse.data;
        } else if (apiResponse.data && Array.isArray(apiResponse.data)) {
          routesData = apiResponse.data;
        } else if (Array.isArray(routesResponse)) {
          routesData = routesResponse;
        }
      }


      const routesWithStops = await loadStopsForAllRoutes(routesData);


      let filteredRoutes = routesWithStops;

      if (busLine) {
        filteredRoutes = filteredRoutes.filter(route => 
          route.name.toLowerCase().includes(busLine.toLowerCase())
        );
      }

      if (stop) {
        filteredRoutes = filteredRoutes.filter(route => 
          route.stops?.some((s: BusStop) => s.name.toLowerCase().includes(stop.toLowerCase()))
        );
      }


      const filteredSchedules: Schedule[] = filteredRoutes.map(route => ({
        id: route.id,
        line: route.name,
        departure: route.startPoint || 'Départ',
        arrival: route.endPoint || 'Arrivée',
        times: ['06:00', '07:15', '08:30', '09:45', '11:00', '12:15', '13:30', '14:45', '16:00', '17:15', '18:30', '19:45'],
        duration: '35 min',
        stops: route.stops || [] 
      }));

      setSchedules(filteredSchedules);
      setShowResults(true);
    } catch (err: any) {
      console.error('Error during search:', err);
      setError('Erreur lors de la recherche');
    } finally {
      setSchedulesLoading(false);
    }
  };


  const handleCreateRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !isAdmin) return;

    setAdminLoading(true);
    setAdminError('');
    setAdminSuccess('');

    try {
      const response = await apiService.createRoute(newRoute, token);
      if (response && typeof response === 'object' && 'success' in response && response.success) {
        setAdminSuccess('Ligne créée avec succès !');
        setNewRoute({ name: '', description: '', startPoint: '', endPoint: '' });
        

        const routesResponse = await apiService.getRoutes(token);
        let routesData: any[] = [];

        if (routesResponse && typeof routesResponse === 'object') {
          const apiResponse = routesResponse as ApiResponse;
          
          if (apiResponse.data && typeof apiResponse.data === 'object' && 'success' in apiResponse.data) {
            const nestedData = apiResponse.data as ApiResponse;
            if (nestedData.success && nestedData.data && Array.isArray(nestedData.data)) {
              routesData = nestedData.data;
            }
          } else if (apiResponse.success && apiResponse.data && Array.isArray(apiResponse.data)) {
            routesData = apiResponse.data;
          } else if (apiResponse.data && Array.isArray(apiResponse.data)) {
            routesData = apiResponse.data;
          } else if (Array.isArray(routesResponse)) {
            routesData = routesResponse;
          }
        }

        setRoutes(routesData);
        

        const routesWithStops = await loadStopsForAllRoutes(routesData);
        

        const updatedSchedules: Schedule[] = routesWithStops.map(route => ({
          id: route.id,
          line: route.name,
          departure: route.startPoint || 'Départ',
          arrival: route.endPoint || 'Arrivée',
          times: ['06:00', '07:15', '08:30', '09:45', '11:00', '12:15', '13:30', '14:45', '16:00', '17:15', '18:30', '19:45'],
          duration: '35 min',
          stops: route.stops || []
        }));
        setSchedules(updatedSchedules);
      } else if (response && typeof response === 'object' && 'error' in response) {
        setAdminError(response.message || response.error || 'Erreur inconnue');
      }
    } catch (err: any) {
      setAdminError(err.message || 'Erreur lors de la création');
    } finally {
      setAdminLoading(false);
    }
  };


  const handleCreateStop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !isAdmin) return;

    if (!newStop.name || !newStop.latitude || !newStop.longitude) {
      setAdminError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setAdminLoading(true);
    setAdminError('');
    setAdminSuccess('');

    try {
      const response = await apiService.createStop(newStop, token);
      if (response && typeof response === 'object' && 'success' in response && response.success) {
        setAdminSuccess('Arrêt créé avec succès !');
        setNewStop({ name: '', latitude: '', longitude: '' });
        setShowMap(false);

        loadAllStops();
      } else if (response && typeof response === 'object' && 'error' in response) {
        setAdminError(response.message || response.error || 'Erreur inconnue');
      }
    } catch (err: any) {
      setAdminError(err.message || 'Erreur lors de la création');
    } finally {
      setAdminLoading(false);
    }
  };


  const handleLinkStopToRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !isAdmin || !selectedRouteForStop || !selectedStopForLink || !stopOrder) return;

    setAdminLoading(true);
    setAdminError('');
    setAdminSuccess('');

    try {
      const response = await apiService.linkStopToRoute(
        parseInt(selectedRouteForStop), 
        { 
          stopId: parseInt(selectedStopForLink), 
          order: parseInt(stopOrder) 
        }, 
        token
      );
      if (response && typeof response === 'object' && 'success' in response && response.success) {
        setAdminSuccess('Arrêt lié à la ligne avec succès !');
        setStopOrder('');
        setSelectedStopForLink('');
        // Recharger les arrêts de la route
        loadRouteStops(parseInt(selectedRouteForStop));
        

        const routesResponse = await apiService.getRoutes(token);
        let routesData: any[] = [];

        if (routesResponse && typeof routesResponse === 'object') {
          const apiResponse = routesResponse as ApiResponse;
          if (apiResponse.success && apiResponse.data && Array.isArray(apiResponse.data)) {
            routesData = apiResponse.data;
          } else if (apiResponse.data && Array.isArray(apiResponse.data)) {
            routesData = apiResponse.data;
          }
        }

        const routesWithStops = await loadStopsForAllRoutes(routesData);
        const updatedSchedules: Schedule[] = routesWithStops.map(route => ({
          id: route.id,
          line: route.name,
          departure: route.startPoint || 'Départ',
          arrival: route.endPoint || 'Arrivée',
          times: ['06:00', '07:15', '08:30', '09:45', '11:00', '12:15', '13:30', '14:45', '16:00', '17:15', '18:30', '19:45'],
          duration: '35 min',
          stops: route.stops || []
        }));
        setSchedules(updatedSchedules);
        
      } else if (response && typeof response === 'object' && 'error' in response) {
        setAdminError(response.message || response.error || 'Erreur inconnue');
      }
    } catch (err: any) {
      setAdminError(err.message || 'Erreur lors de la liaison');
    } finally {
      setAdminLoading(false);
    }
  };


  const resetAdminForm = () => {
    setNewRoute({ name: '', description: '', startPoint: '', endPoint: '' });
    setNewStop({ name: '', latitude: '', longitude: '' });
    setSelectedRouteForStop('');
    setSelectedStopForLink('');
    setStopOrder('');
    setAdminError('');
    setAdminSuccess('');
    setSelectedRouteStops([]);
    setShowMap(false);
    cleanupMap();
  };


  useEffect(() => {
    if (showAdminPanel && isAdmin && token) {
      
      loadAllStops();
    }
  }, [showAdminPanel, isAdmin, token]);


  useEffect(() => {
    if (showMap && !mapInstanceRef.current) {

      const loadLeaflet = () => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css';
        document.head.appendChild(link);

        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.js';
        script.onload = initializeMap;
        document.head.appendChild(script);
      };

      loadLeaflet();
    }

    return () => {
      if (!showMap) {
        cleanupMap();
      }
    };
  }, [showMap]);


  const filteredSchedules = schedules.filter(schedule => {
    const lineMatch = busLine ? schedule.line.toLowerCase().includes(busLine.toLowerCase()) : true;
    const stopMatch = stop ? 
      schedule.stops?.some(s => s.name.toLowerCase().includes(stop.toLowerCase())) : true;
    return lineMatch && stopMatch;
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-navy-900 mb-4">
            {t.schedules.title}
          </h1>
          <p className="text-xl text-gray-600">
            {t.schedules.subtitle}
          </p>
        </div>


        {isAdmin && (
          <div className="flex justify-end mb-6">
            <button
              onClick={() => {
                setShowAdminPanel(!showAdminPanel);
                if (showAdminPanel) resetAdminForm();
              }}
              className="flex items-center space-x-2 bg-mustard-500 text-navy-900 font-semibold px-4 py-2 rounded-lg hover:bg-mustard-600 transition-colors"
            >
              <Settings className="h-4 w-4" />
              <span>{showAdminPanel ? 'Masquer Admin' : 'Panel Admin'}</span>
            </button>
          </div>
        )}


        {isAdmin && showAdminPanel && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-navy-900 mb-4">Panel Administration</h2>
            

            <div className="flex space-x-4 mb-6 border-b border-gray-200">
              <button className="pb-2 px-1 border-b-2 border-mustard-500 text-mustard-600 font-medium">
                Gestion des Lignes et Arrêts
              </button>
            </div>


            {adminError && (
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6 flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                <div>
                  <p className="text-red-800 font-semibold">Erreur</p>
                  <p className="text-red-600 text-sm">{adminError}</p>
                </div>
              </div>
            )}

            {adminSuccess && (
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-6 flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <p className="text-green-800 font-semibold">{adminSuccess}</p>
              </div>
            )}


            <div className="mb-8">
              <h3 className="text-lg font-semibold text-navy-900 mb-4">Créer une nouvelle ligne</h3>
              <form onSubmit={handleCreateRoute} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom de la ligne *
                  </label>
                  <input
                    type="text"
                    value={newRoute.name}
                    onChange={(e) => setNewRoute({ ...newRoute, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mustard-500 focus:border-mustard-500 transition-colors"
                    required
                    placeholder="BUS-12"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    value={newRoute.description}
                    onChange={(e) => setNewRoute({ ...newRoute, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mustard-500 focus:border-mustard-500 transition-colors"
                    placeholder="Tour Hassan ↔ Gare Rabat-Ville ↔ Agdal"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Point de départ
                  </label>
                  <input
                    type="text"
                    value={newRoute.startPoint}
                    onChange={(e) => setNewRoute({ ...newRoute, startPoint: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mustard-500 focus:border-mustard-500 transition-colors"
                    placeholder="Tour Hassan"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Point d'arrivée
                  </label>
                  <input
                    type="text"
                    value={newRoute.endPoint}
                    onChange={(e) => setNewRoute({ ...newRoute, endPoint: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mustard-500 focus:border-mustard-500 transition-colors"
                    placeholder="Agdal"
                  />
                </div>

                <div className="md:col-span-2">
                  <button
                    type="submit"
                    disabled={adminLoading}
                    className="w-full bg-mustard-500 text-navy-900 font-semibold py-3 rounded-lg hover:bg-mustard-600 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>{adminLoading ? 'Création...' : 'Créer la ligne'}</span>
                  </button>
                </div>
              </form>
            </div>


            <div className="mb-8">
              <h3 className="text-lg font-semibold text-navy-900 mb-4">Créer un nouvel arrêt</h3>
              
              <div className="mb-4">
                <button
                  type="button"
                  onClick={() => setShowMap(!showMap)}
                  className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Navigation className="h-4 w-4" />
                  <span>{showMap ? 'Masquer la carte' : 'Utiliser la carte pour sélectionner'}</span>
                </button>
              </div>

              {showMap && (
                <div className="mb-4 bg-gray-100 p-4 rounded-lg">
                  <h4 className="font-semibold text-navy-900 mb-2">Sélection sur la carte</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Cliquez sur la carte pour sélectionner l'emplacement ou déplacez le marqueur
                  </p>
                  <div 
                    ref={mapRef} 
                    className="w-full h-64 rounded-lg border-2 border-gray-300"
                    style={{ minHeight: '256px' }}
                  />
                  {selectedLocation && (
                    <p className="text-sm text-gray-600 mt-2">
                      Position sélectionnée: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                    </p>
                  )}
                </div>
              )}

              <form onSubmit={handleCreateStop} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom de l'arrêt *
                  </label>
                  <input
                    type="text"
                    value={newStop.name}
                    onChange={(e) => setNewStop({ ...newStop, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mustard-500 focus:border-mustard-500 transition-colors"
                    required
                    placeholder="Gare Rabat-Ville"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Latitude *
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={newStop.latitude}
                    onChange={(e) => setNewStop({ ...newStop, latitude: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mustard-500 focus:border-mustard-500 transition-colors"
                    required
                    placeholder="34.020882"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Longitude *
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={newStop.longitude}
                    onChange={(e) => setNewStop({ ...newStop, longitude: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mustard-500 focus:border-mustard-500 transition-colors"
                    required
                    placeholder="-6.841650"
                  />
                </div>

                <div className="md:col-span-3">
                  <button
                    type="submit"
                    disabled={adminLoading}
                    className="w-full bg-blue-500 text-white font-semibold py-3 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>{adminLoading ? 'Création...' : 'Créer l arrêt'}</span>
                  </button>
                </div>
              </form>
            </div>


            <div className="mb-8">
              <h3 className="text-lg font-semibold text-navy-900 mb-4">Gérer les arrêts d'une ligne</h3>
              

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sélectionner une ligne
                  </label>
                  <select
                    value={selectedRouteForStop}
                    onChange={(e) => {
                      setSelectedRouteForStop(e.target.value);
                      if (e.target.value) {
                        
                        loadRouteStops(parseInt(e.target.value));
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mustard-500 focus:border-mustard-500 transition-colors"
                  >
                    <option value="">Choisir une ligne</option>
                    {routes.map(route => (
                      <option key={route.id} value={route.id}>{route.name}</option>
                    ))}
                  </select>
                </div>
              </div>


              {selectedRouteForStop && (
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <h4 className="font-semibold text-navy-900 mb-4">Ajouter un arrêt à la ligne</h4>
                  

                  <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Debug Info:</strong> {availableStops.length} arrêts disponibles, 
                      Chargement: {stopsLoadingAll ? 'Oui' : 'Non'}, 
                      Route sélectionnée: {selectedRouteForStop}
                    </p>
                  </div>
                  
                  <form onSubmit={handleLinkStopToRoute} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Arrêt {stopsLoadingAll && <span className="text-gray-500">(Chargement...)</span>}
                      </label>
                      <select
                        value={selectedStopForLink}
                        onChange={(e) => setSelectedStopForLink(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mustard-500 focus:border-mustard-500 transition-colors"
                        required
                        disabled={stopsLoadingAll}
                      >
                        <option value="">
                          {stopsLoadingAll ? 'Chargement...' : 'Choisir un arrêt'}
                        </option>
                        {availableStops.map(stop => (
                          <option key={stop.id} value={stop.id}>
                            {stop.name} (ID: {stop.id})
                          </option>
                        ))}
                      </select>
                      {availableStops.length === 0 && !stopsLoadingAll && (
                        <p className="text-red-500 text-xs mt-1">
                          Aucun arrêt disponible. Créez d'abord des arrêts.
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ordre dans la ligne *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={stopOrder}
                        onChange={(e) => setStopOrder(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mustard-500 focus:border-mustard-500 transition-colors"
                        required
                        placeholder="1"
                      />
                    </div>

                    <div className="flex items-end">
                      <button
                        type="submit"
                        disabled={adminLoading || availableStops.length === 0}
                        className="w-full bg-green-500 text-white font-semibold py-2 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                      >
                        <Link className="h-4 w-4" />
                        <span>{adminLoading ? 'Liaison...' : 'Lier l arrêt'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}


              {selectedRouteForStop && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-navy-900 mb-3">
                    Arrêts de la ligne {routes.find(r => r.id === parseInt(selectedRouteForStop))?.name}
                    {stopsLoading && <span className="text-sm text-gray-500 ml-2">(Chargement...)</span>}
                  </h4>
                  
                  {selectedRouteStops.length > 0 ? (
                    <div className="space-y-2">
                      {selectedRouteStops.map((stop, index) => (
                        <div key={stop.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                          <div className="flex items-center space-x-3">
                            <div className="w-6 h-6 bg-mustard-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                              {stop.order || index + 1}
                            </div>
                            <div>
                              <span className="font-medium text-navy-900">{stop.name}</span>
                              <div className="text-xs text-gray-500">
                                {stop.latitude.toFixed(6)}, {stop.longitude.toFixed(6)}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4 text-gray-400" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">Aucun arrêt configuré pour cette ligne.</p>
                  )}
                </div>
              )}
            </div>


            <div className="mt-8">
              <h3 className="text-lg font-semibold text-navy-900 mb-4">
                Lignes existantes ({routes.length})
              </h3>
              {routes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {routes.map((route) => (
                    <div key={route.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h4 className="font-semibold text-navy-900">{route.name}</h4>
                      {route.description && (
                        <p className="text-sm text-gray-600 mt-1">{route.description}</p>
                      )}
                      {(route.startPoint || route.endPoint) && (
                        <p className="text-xs text-gray-500 mt-2">
                          {route.startPoint} → {route.endPoint}
                        </p>
                      )}
                      <button
                        onClick={() => {
                          setSelectedRouteForStop(route.id.toString());
                          loadRouteStops(route.id);
                        }}
                        className="text-xs text-mustard-600 hover:text-mustard-700 mt-2 flex items-center space-x-1"
                      >
                        <Map className="h-3 w-3" />
                        <span>Voir les arrêts</span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">Aucune ligne créée pour le moment.</p>
              )}
            </div>
          </div>
        )}


        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 mb-8">
          <form onSubmit={handleSearch} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-navy-900 font-semibold mb-2">
                  {t.schedules.busLine}
                </label>
                <div className="relative">
                  <Bus className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={busLine}
                    onChange={(e) => setBusLine(e.target.value)}
                    placeholder="Ex: BUS-12, BUS-07, BUS-19..."
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-mustard-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-navy-900 font-semibold mb-2">
                  {t.schedules.stop}
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={stop}
                    onChange={(e) => setStop(e.target.value)}
                    placeholder="Ex: Gare Rabat-Ville, ENSIAS, Plage de Rabat..."
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-mustard-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={schedulesLoading}
              className="w-full bg-mustard-500 text-navy-900 font-bold py-4 rounded-lg hover:bg-mustard-600 transition-all duration-200 shadow-md flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Search className="h-5 w-5" />
              <span>{schedulesLoading ? t.schedules.searching : t.schedules.search}</span>
            </button>
          </form>
        </div>


        {loading && (
          <div className="text-center py-12">
            <div className="inline-flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-mustard-500"></div>
              <p className="text-lg font-semibold text-navy-900">
                {t.schedules.loading}
              </p>
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 mb-8 flex items-center space-x-3 max-w-3xl mx-auto">
            <AlertCircle className="h-6 w-6 text-red-500 flex-shrink-0" />
            <div>
              <p className="text-red-800 font-semibold">{t.schedules.loadingError}</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        )}


        {!loading && !error && showResults && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-navy-900">
              {t.schedules.results} ({filteredSchedules.length})
            </h2>

            {filteredSchedules.map((schedule) => {
              
              return (
                <div
                  key={schedule.id}
                  className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-navy-900">{schedule.line}</h3>
                      <span className="bg-mustard-500 text-navy-900 px-3 py-1 rounded-full text-sm font-semibold">
                        {schedule.duration}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-gray-600 mb-4">
                      <span className="font-medium">{schedule.departure}</span>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>→</span>
                      </div>
                      <span className="font-medium">{schedule.arrival}</span>
                    </div>


                    {schedule.stops && schedule.stops.length > 0 ? (
                      <div className="mb-6">
                        <h4 className="text-sm font-semibold text-navy-900 mb-3 flex items-center space-x-2">
                          <MapPin className="h-4 w-4" />
                          <span>Arrêts sur le trajet ({schedule.stops.length}) :</span>
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {schedule.stops
                            .sort((a, b) => (a.order || 0) - (b.order || 0))
                            .map((stop) => (
                              <span
                                key={stop.id}
                                className="bg-blue-50 text-blue-800 px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1"
                              >
                                <span className="w-4 h-4 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs">
                                  {stop.order}
                                </span>
                                <span>{stop.name}</span>
                              </span>
                            ))}
                        </div>
                      </div>
                    ) : (
                      <div className="mb-6">
                        <h4 className="text-sm font-semibold text-navy-900 mb-3 flex items-center space-x-2">
                          <MapPin className="h-4 w-4" />
                          <span>Arrêts sur le trajet:</span>
                        </h4>
                        <p className="text-gray-500 text-sm">Aucun arrêt configuré pour cette ligne.</p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                      {schedule.times.map((time, index) => (
                        <span
                          key={index}
                          className="bg-gray-100 text-gray-800 px-3 py-2 rounded-lg text-center font-medium hover:bg-mustard-100 transition-colors cursor-pointer"
                        >
                          {time}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {filteredSchedules.length === 0 && (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">{t.schedules.noResults}</p>
                <p className="text-gray-400 text-sm mt-2">{t.schedules.tryOther}</p>
              </div>
            )}
          </div>
        )}

       
        {!loading && !error && !showResults && (
          <div className="text-center py-12">
            <Bus className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {t.schedules.welcome}
            </h3>
            <p className="text-gray-500 mb-6">
              {t.schedules.useForm}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {schedules.slice(0, 3).map(schedule => (
                <div key={schedule.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                  <h4 className="font-semibold text-navy-900">{schedule.line}</h4>
                  <p className="text-sm text-gray-600">{schedule.departure} → {schedule.arrival}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {schedule.stops?.length || 0} arrêts • {schedule.times.length} départs par jour
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
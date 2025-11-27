import { useState, useEffect } from 'react';
import { MapPin, Navigation, Clock, TrendingUp, ArrowRight, Bus, AlertCircle } from 'lucide-react';
import { apiService } from '../services/api';

interface RouteSuggestionsPageProps {
  token: string;
}

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

interface RouteSuggestion {
  route: Route;
  startStop: BusStop;
  endStop: BusStop;
  distance: number;
  stopsCount: number;
  estimatedTime: number;
}

export default function RouteSuggestionsPage({ token }: RouteSuggestionsPageProps) {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [allStops, setAllStops] = useState<BusStop[]>([]);
  const [startLocation, setStartLocation] = useState('');
  const [endLocation, setEndLocation] = useState('');
  const [suggestions, setSuggestions] = useState<RouteSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    loadRoutesAndStops();
  }, [token]);

  const loadRoutesAndStops = async () => {
    try {
      const routesResponse = await apiService.getRoutes(token);

      let routesData: any[] = [];
      if (routesResponse && typeof routesResponse === 'object') {
        const apiResponse = routesResponse as any;
        if (apiResponse.data && typeof apiResponse.data === 'object' && 'success' in apiResponse.data) {
          const nestedData = apiResponse.data as any;
          if (nestedData.success && nestedData.data && Array.isArray(nestedData.data)) {
            routesData = nestedData.data;
          }
        } else if (apiResponse.success && apiResponse.data && Array.isArray(apiResponse.data)) {
          routesData = apiResponse.data;
        } else if (apiResponse.data && Array.isArray(apiResponse.data)) {
          routesData = apiResponse.data;
        }
      }

      // Load stops for each route
      const routesWithStops = await Promise.all(
        routesData.map(async (route) => {
          try {
            const stopsResponse = await apiService.getStopsForRoute(route.id, token);
            if (stopsResponse && stopsResponse.success && stopsResponse.data) {
              const stops = Array.isArray(stopsResponse.data) ? stopsResponse.data : [];
              return { ...route, stops: stops };
            }
          } catch (error) {
            console.error(`Error loading stops for route ${route.id}:`, error);
          }
          return route;
        })
      );

      setRoutes(routesWithStops);

      // Collect all unique stops
      const stopsMap = new Map<number, BusStop>();
      routesWithStops.forEach(route => {
        if (route.stops) {
          route.stops.forEach((stop: BusStop) => {
            stopsMap.set(stop.id, stop);
          });
        }
      });
      setAllStops(Array.from(stopsMap.values()));

    } catch (err: any) {
      console.error('Error loading routes:', err);
      setError('Erreur lors du chargement des itinéraires');
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    // Haversine formula
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const findSuggestions = () => {
    if (!startLocation.trim() || !endLocation.trim()) {
      setError('Veuillez saisir les points de départ et d\'arrivée');
      return;
    }

    setLoading(true);
    setError('');
    setSuggestions([]);
    setShowResults(true);

    try {
      const startQuery = startLocation.toLowerCase();
      const endQuery = endLocation.toLowerCase();

      const routeSuggestions: RouteSuggestion[] = [];

      routes.forEach(route => {
        if (!route.stops || route.stops.length < 2) return;

        // Find stops matching start and end
        const startStops = route.stops.filter(stop =>
          stop.name.toLowerCase().includes(startQuery)
        );
        const endStops = route.stops.filter(stop =>
          stop.name.toLowerCase().includes(endQuery)
        );

        // Create suggestions for each combination
        startStops.forEach(startStop => {
          endStops.forEach(endStop => {
            if (startStop.id === endStop.id) return;

            const startOrder = startStop.order || 0;
            const endOrder = endStop.order || 0;

            // Ensure we're going in the right direction
            if (endOrder > startOrder) {
              const stopsCount = endOrder - startOrder;
              const distance = calculateDistance(
                startStop.latitude,
                startStop.longitude,
                endStop.latitude,
                endStop.longitude
              );
              const estimatedTime = stopsCount * 3 + 5; // 3 min per stop + 5 min base

              routeSuggestions.push({
                route,
                startStop,
                endStop,
                distance,
                stopsCount,
                estimatedTime
              });
            }
          });
        });
      });

      // Sort by estimated time (shortest first)
      routeSuggestions.sort((a, b) => a.estimatedTime - b.estimatedTime);

      setSuggestions(routeSuggestions);

      if (routeSuggestions.length === 0) {
        setError('Aucun itinéraire trouvé. Essayez des arrêts différents.');
      }

    } catch (err: any) {
      setError('Erreur lors de la recherche d\'itinéraires');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-blue-500 p-4 rounded-full mb-4">
            <Navigation className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-navy-900 mb-2">Suggestions d'Itinéraires</h1>
          <p className="text-gray-600">Trouvez le meilleur itinéraire pour votre trajet</p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-navy-900 font-semibold mb-2">
                Point de Départ
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500" />
                <input
                  type="text"
                  value={startLocation}
                  onChange={(e) => setStartLocation(e.target.value)}
                  placeholder="Ex: Tour Hassan, ENSIAS..."
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-navy-900 font-semibold mb-2">
                Destination
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-red-500" />
                <input
                  type="text"
                  value={endLocation}
                  onChange={(e) => setEndLocation(e.target.value)}
                  placeholder="Ex: Gare Rabat-Ville, Agdal..."
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          <button
            onClick={findSuggestions}
            disabled={loading}
            className="w-full bg-blue-500 text-white font-bold py-4 rounded-lg hover:bg-blue-600 transition-all duration-200 shadow-md flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <TrendingUp className="h-5 w-5" />
            <span>{loading ? 'Recherche...' : 'Trouver les meilleurs itinéraires'}</span>
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6 flex items-center space-x-3">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Results */}
        {showResults && suggestions.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-navy-900 mb-4">
              Itinéraires Suggérés ({suggestions.length})
            </h2>

            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className={`bg-white rounded-xl shadow-lg overflow-hidden transition-all hover:shadow-xl ${
                  index === 0 ? 'border-2 border-blue-500' : ''
                }`}
              >
                <div className="p-6">
                  {index === 0 && (
                    <div className="inline-flex items-center bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold mb-3">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      Recommandé
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="bg-blue-500 p-2 rounded-lg">
                        <Bus className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-navy-900">{suggestion.route.name}</h3>
                        {suggestion.route.description && (
                          <p className="text-sm text-gray-600">{suggestion.route.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                        ~{suggestion.estimatedTime} min
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <div className="flex-1">
                          <p className="font-semibold text-navy-900">{suggestion.startStop.name}</p>
                          <p className="text-xs text-gray-500">Arrêt #{suggestion.startStop.order}</p>
                        </div>
                      </div>
                    </div>

                    <ArrowRight className="h-5 w-5 text-gray-400" />

                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <div className="flex-1">
                          <p className="font-semibold text-navy-900">{suggestion.endStop.name}</p>
                          <p className="text-xs text-gray-500">Arrêt #{suggestion.endStop.order}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center space-x-4">
                      <span>📍 {suggestion.stopsCount} arrêts</span>
                      <span>🚌 Distance: {suggestion.distance.toFixed(2)} km</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4" />
                      <span>Temps estimé: {suggestion.estimatedTime} min</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info */}
        {!showResults && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">Comment ça marche ?</h3>
            <ul className="space-y-2 text-blue-800">
              <li className="flex items-start space-x-2">
                <span className="text-blue-500 mt-1">→</span>
                <span>Entrez votre point de départ et votre destination</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-500 mt-1">→</span>
                <span>Notre algorithme trouve les meilleurs itinéraires basés sur le nombre d'arrêts et le temps de trajet</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-500 mt-1">→</span>
                <span>Les itinéraires sont classés du plus rapide au plus lent</span>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

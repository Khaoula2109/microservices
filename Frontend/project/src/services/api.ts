const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081';



interface ApiResponse<T> {
  data?: T;
  error?: string;
  timestamp?: string;
  status?: number;
  message?: string;
  success?: boolean
}


interface UserProfile {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: string;
}

interface BusLocationResponse {
  busId: string;
  latitude: number;
  longitude: number;
  timestamp: number;
  stopIndex: number;
  delay_minutes: number;
  status: 'ON_TIME' | 'DELAYED' | 'EARLY' | 'UNKNOWN_SCHEDULE' | 'NO_SCHEDULE_DATA';
}

class ApiService {

  private async fetchWithFallback<T>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });


      const text = await response.text();
      let data: any = null;
      
      if (text) {
        try {
          data = JSON.parse(text);
        } catch (e) {
          console.error(`💥 [API] Réponse non-JSON sur ${url}`, text);
          if (!response.ok) {
            return {
              error: text,
              status: response.status,
            };
          }
        }
      }

      if (!response.ok) {
        console.error(`❌ [API] Erreur ${response.status} sur ${url}`, data);
        return {
          error: data?.error || data?.message || 'Une erreur est survenue',
          status: response.status,
          timestamp: data?.timestamp,
          message: data?.message,
        };
      }
      
     
      return { data };
    } catch (error) {
      console.error(`💥 [API] Erreur réseau ou fetch sur ${url}`, error);
      return {
        error: 'Impossible de se connecter au serveur. Veuillez vérifier votre connexion.',
        status: 503,
      };
    }
  }

  // --- Authentification ---

  async register(userData: { 
    firstName: string; 
    lastName: string; 
    email: string; 
    password: string 
  }) {
    
    return this.fetchWithFallback<{ token: string }>(
      `${API_BASE_URL}/api/auth/register`,
      {
        method: 'POST',
        body: JSON.stringify(userData), 
      }
    );
  }
async registerAdmin(userData: { 
  firstName: string; 
  lastName: string; 
  email: string; 
  password: string;
}, token: string) {
  
  return this.fetchWithFallback<{ token: string }>(
    `${API_BASE_URL}/api/auth/register`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...userData,
        role: 'ADMIN' 
      }), 
    }
  );
}
  async login(credentials: { email: string; password: string }) {
    
    return this.fetchWithFallback<{ token: string }>(
      `${API_BASE_URL}/api/auth/login`,
      {
        method: 'POST',
        body: JSON.stringify(credentials),
      }
    );
  }

 

  async getUserProfile(token: string) {
    const url = `${API_BASE_URL}/api/users/me`;
    
    
    return this.fetchWithFallback<UserProfile>(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  // --- Trajets et Horaires ---

  async getRoutes(token: string) {
    
    return this.fetchWithFallback<any[]>(`${API_BASE_URL}/api/schedules/routes`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async getRouteStops(routeId: string, token: string) {
    
    return this.fetchWithFallback<any[]>(`${API_BASE_URL}/api/schedules/routes/${routeId}/stops`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async createRoute(
    routeData: {
      name: string;
      description?: string;
      startPoint?: string;
      endPoint?: string;
    }, 
    token: string
  ): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/schedules/routes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(routeData)
      });

      const data = await response.json();
      
      if (!response.ok) {
        return {
          error: data.message || data.error || 'Erreur lors de la création de la ligne',
          message: data.message,
          status: response.status
        };
      }

      return {
        data: data.data || data,
        message: data.message,
        success: data.success
      };
    } catch (error: any) {
      return {
        error: error.message || 'Erreur réseau lors de la création de la ligne',
        message: error.message
      };
    }
  }

  async getStopsForRoute(routeId: number, token: string): Promise<ApiResponse<any>> {
 
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/schedules/routes/${routeId}/stops`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    if (!response.ok) {
      return {
        error: data.message || data.error || 'Erreur lors de la récupération des arrêts',
        message: data.message,
        status: response.status
      };
    }

    return {
      data: data.data || data,
      message: data.message,
      success: data.success
    };
  } catch (error: any) {
    return {
      error: error.message || 'Erreur réseau lors de la récupération des arrêts',
      message: error.message
    };
  }
}

  async createStop(
    stopData: {
      name: string;
      latitude: string;
      longitude: string;
    }, 
    token: string
  ): Promise<ApiResponse<any>> {
    
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/schedules/stops`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: stopData.name,
          latitude: parseFloat(stopData.latitude),
          longitude: parseFloat(stopData.longitude)
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        return {
          error: data.message || data.error || 'Erreur lors de la création de l\'arrêt',
          message: data.message,
          status: response.status
        };
      }

      return {
        data: data.data || data,
        message: data.message,
        success: data.success
      };
    } catch (error: any) {
      return {
        error: error.message || 'Erreur réseau lors de la création de l\'arrêt',
        message: error.message
      };
    }
  }


async linkStopToRoute(
  routeId: number, 
  linkData: { 
    stopId: number; 
    order: number;
  }, 
  token: string
): Promise<ApiResponse<any>> {

  
  try {
    const response = await fetch(`${API_BASE_URL}/api/schedules/routes/${routeId}/stops`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`  
      },
      body: JSON.stringify({
        stopId: linkData.stopId,
        order: linkData.order
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      return {
        error: data.message || data.error || 'Erreur lors de la liaison de l\'arrêt',
        message: data.message,
        status: response.status
      };
    }

    return {
      data: data.data || data,
      message: data.message,
      success: data.success
    };
  } catch (error: any) {
    return {
      error: error.message || 'Erreur réseau lors de la liaison de l\'arrêt',
      message: error.message
    };
  }
}

async getAllStops(token: string): Promise<ApiResponse<any>> {
  console.log('🚀 [API] Appel de getAllStops...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/schedules/stops`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    if (!response.ok) {
      return {
        error: data.message || data.error || 'Erreur lors de la récupération des arrêts',
        message: data.message,
        status: response.status
      };
    }

    return {
      data: data.data || data,
      message: data.message,
      success: data.success
    };
  } catch (error: any) {
    return {
      error: error.message || 'Erreur réseau lors de la récupération des arrêts',
      message: error.message
    };
  }
}
  async getStopSchedule(routeId: string, stopId: string, token: string) {
    
    return this.fetchWithFallback<any>(
      `${API_BASE_URL}/api/schedules/routes/${routeId}/stops/${stopId}/schedule`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  }

  // --- Tickets ---

  async purchaseTicket(
    ticketData: { 
      ticketType: string;
      userId: number;
    }, 
    token: string
  ) {
   
    
 
    const url = `${API_BASE_URL}/api/tickets/purchase?userId=${ticketData.userId}`;

    
    return this.fetchWithFallback<any>(url, {
      method: 'POST',
      body: JSON.stringify({
        ticketType: ticketData.ticketType
        // On retire userId du body car il est dans l'URL
      }),
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async getTicketHistory(token: string) {
 
    const userProfile = await this.getUserProfile(token);
    if (!userProfile.data?.id) {
      throw new Error("Impossible de récupérer l'ID utilisateur");
    }
    
    const userId = userProfile.data.id;
    const url = `${API_BASE_URL}/api/tickets/history/${userId}`; // Endpoint direct
    

    
    return this.fetchWithFallback<any[]>(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async validateTicket(ticketId: string, token: string) {

    return this.fetchWithFallback<{ valid: boolean; message: string }>(
      `${API_BASE_URL}/api/tickets/${ticketId}/validate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  }

  async getTicketStats(token: string) {
    return this.fetchWithFallback<{ totalPurchased: number; activeTickets: number; usedTickets: number }>(
      `${API_BASE_URL}/api/tickets/stats/me`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  }

  async validateQrCode(qrCode: string, token: string) {
    return this.fetchWithFallback<{
      valid: boolean;
      message: string;
      ticketType?: string;
      status?: string;
      purchaseDate?: string;
      expirationDate?: string;
      ownerName?: string;
    }>(
      `${API_BASE_URL}/api/tickets/validate-qr/${encodeURIComponent(qrCode)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  }


async createSubscriptionCheckout(priceId: string, token: string, userId: number, userEmail: string) {

  
  return this.fetchWithFallback<{ url: string }>(
    `${API_BASE_URL}/api/subscriptions/create-checkout-session`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        priceId: priceId,
        userId: userId,        
        email: userEmail       
      })
    }
  );
}


async getSubscriptionPlans(token: string) {

  return {
    data: [
      {
        id: 1,
        name: 'Abonnement Mensuel',
        price: 10.00,
        priceId: 'price_1N5y6cKacGVci6pUfI6u3sR5',
        durationInDays: 30,
        features: [
          'Accès illimité à tous les bus',
          'Support prioritaire',
          'Application mobile incluse'
        ]
      },
      {
        id: 2,
        name: 'Abonnement Annuel', 
        price: 100.00,
        priceId: 'price_1HGZ2oKacGVci6pU2pJ2J2J2',
        durationInDays: 365,
        features: [
          'Tous les avantages mensuel',
          'Économisez 2 mois',
          'Support premium 24/7',
          'Carte transport gratuite'
        ]
      }
    ]
  };
}

  // --- Géolocalisation ---

  async getBusLocation(busNumber: string, token: string) {
    console.log(`🚀 [API] Appel de getBusLocation pour ${busNumber}...`);
    return this.fetchWithFallback<BusLocationResponse>(
      `${API_BASE_URL}/api/geolocation/bus/${busNumber}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  }



  async testFallback() {
    return this.fetchWithFallback<any>(`${API_BASE_URL}/fallback/test`);
  }
}

export const apiService = new ApiService();
export default apiService;
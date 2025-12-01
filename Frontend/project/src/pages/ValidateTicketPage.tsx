import { useState, useEffect, useRef } from 'react';
import { Camera, CheckCircle, XCircle, Scan, User, Calendar, Clock, Ticket, AlertTriangle } from 'lucide-react';
import { apiService } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';
import jsQR from 'jsqr';

interface ValidateTicketPageProps {
  token: string;
}

interface ValidationResult {
  valid: boolean;
  message: string;
  ticketType?: string;
  status?: string;
  purchaseDate?: string;
  expirationDate?: string;
  ownerName?: string;
}

export default function ValidateTicketPage({ token }: ValidateTicketPageProps) {
  const { t } = useLanguage();
  const [isScanning, setIsScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [scanHistory, setScanHistory] = useState<ValidationResult[]>([]);
  const [lastScannedCode, setLastScannedCode] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const scanFrame = () => {
    if (!videoRef.current || !canvasRef.current || loading) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) return;

    // Set canvas size to video size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

    // Scan for QR code
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    });

    if (code && code.data && code.data !== lastScannedCode) {
      console.log('🎯 QR Code detected:', code.data);
      setLastScannedCode(code.data);
      validateCode(code.data);
      // Stop scanning temporarily to avoid duplicates
      stopScanning();
      // Reset after 3 seconds to allow new scans
      setTimeout(() => {
        setLastScannedCode('');
        if (isScanning) startScanning();
      }, 3000);
    }
  };

  const startScanning = () => {
    if (scanIntervalRef.current) return;
    // Scan every 300ms
    scanIntervalRef.current = window.setInterval(scanFrame, 300);
  };

  const stopScanning = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
  };

  const startCamera = async () => {
    try {
      console.log('🎥 Starting camera...');

      // Check if mediaDevices API is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError(t.validate.cameraError + ' (API non disponible - HTTPS requis)');
        console.error('❌ Camera error: mediaDevices API not available. HTTPS is required.');
        return;
      }

      console.log('📱 Requesting camera access...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      console.log('✅ Camera stream obtained:', stream.getTracks().map(t => t.label));
      streamRef.current = stream;

      if (videoRef.current) {
        const video = videoRef.current;
        video.srcObject = stream;

        console.log('📹 Video element setup, waiting for play...');

        // Force play and wait for it
        try {
          await video.play();
          console.log('▶️ Video playing');
        } catch (playError) {
          console.error('❌ Play error:', playError);
          // Try playing again after user interaction
          video.muted = true;
          await video.play();
        }

        // Wait for video to be fully loaded
        video.addEventListener('loadedmetadata', () => {
          console.log('📹 Video metadata loaded:', {
            width: video.videoWidth,
            height: video.videoHeight,
            readyState: video.readyState
          });
          startScanning();
        }, { once: true });

        // Also try starting scan when video can play
        video.addEventListener('canplay', () => {
          console.log('▶️ Video can play, dimensions:', video.videoWidth, 'x', video.videoHeight);
          if (video.videoWidth > 0 && video.videoHeight > 0) {
            startScanning();
          }
        }, { once: true });
      }

      setIsScanning(true);
      setError('');
      console.log('✅ Camera started successfully');
    } catch (err: any) {
      setError(t.validate.cameraError + ': ' + err.message);
      console.error('❌ Camera error:', err);
      console.error('Error name:', err.name);
      console.error('Error message:', err.message);
    }
  };

  const stopCamera = () => {
    stopScanning();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
    setLastScannedCode('');
    console.log('🛑 Camera stopped');
  };

  const validateCode = async (code: string) => {
    if (!code.trim()) {
      setError('Veuillez entrer un code QR');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await apiService.validateQrCode(code, token);

      if (response.error) {
        throw new Error(response.error);
      }

      if (response.data) {
        setResult(response.data);
        setScanHistory(prev => [response.data!, ...prev].slice(0, 10));
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la validation');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    validateCode(manualCode);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const getTicketTypeLabel = (type?: string) => {
    switch (type?.toUpperCase()) {
      case 'SIMPLE': return t.validate.ticketSimple;
      case 'JOURNEE': return t.validate.ticketDaily;
      case 'HEBDO': return t.validate.ticketWeekly;
      case 'MENSUEL': return t.validate.ticketMonthly;
      default: return type || '-';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-mustard-500 to-yellow-400 rounded-2xl mb-4 shadow-lg">
            <Scan className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-navy-900 mb-2">
            {t.validate.title}
          </h1>
          <p className="text-gray-600">
            {t.validate.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Scanner Section */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
            <h2 className="text-xl font-bold text-navy-900 mb-4 flex items-center">
              <Camera className="h-5 w-5 mr-2 text-mustard-500" />
              {t.validate.scannerQR}
            </h2>

            {!isScanning ? (
              <div className="text-center py-12">
                <div className="w-32 h-32 mx-auto mb-6 bg-gray-100 rounded-2xl flex items-center justify-center border-2 border-dashed border-gray-300">
                  <Camera className="h-12 w-12 text-gray-400" />
                </div>
                <button
                  onClick={startCamera}
                  className="bg-gradient-to-r from-mustard-500 to-yellow-400 text-gray-900 font-bold py-3 px-8 rounded-xl hover:from-mustard-600 hover:to-yellow-500 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  {t.validate.activateCamera}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    playsInline
                    muted
                  />
                  <div className="absolute inset-0 border-4 border-mustard-500/50 rounded-xl pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-mustard-500 rounded-lg">
                      {!loading && (
                        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-mustard-500 text-navy-900 px-3 py-1 rounded-full text-xs font-semibold animate-pulse">
                          📷 Scan actif
                        </div>
                      )}
                    </div>
                  </div>
                  <canvas ref={canvasRef} className="hidden" />
                </div>
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 text-sm text-blue-400">
                  <p className="font-semibold mb-1">💡 Astuce</p>
                  <p>Placez le code QR du ticket face à la caméra. Le scan est automatique !</p>
                </div>
                <button
                  onClick={stopCamera}
                  className="w-full bg-red-500/20 text-red-400 font-semibold py-2 px-4 rounded-xl hover:bg-red-500/30 transition-colors border border-red-500/30"
                >
                  {t.validate.stopCamera}
                </button>
              </div>
            )}

            {/* Manual Input */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-600 mb-3">
                {t.validate.manualEntry}
              </h3>
              <form onSubmit={handleManualSubmit} className="space-y-3">
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="TICKET-XXXX-XXXX-XXXX"
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-navy-900 placeholder-gray-400 focus:border-mustard-500 focus:outline-none transition-colors"
                />
                <button
                  type="submit"
                  disabled={loading || !manualCode.trim()}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold py-3 px-6 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? t.validate.validating : t.validate.validateCode}
                </button>
              </form>
            </div>
          </div>

          {/* Result Section */}
          <div className="space-y-6">

            {/* Current Result */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
              <h2 className="text-xl font-bold text-navy-900 mb-4 flex items-center">
                <Ticket className="h-5 w-5 mr-2 text-mustard-500" />
                {t.validate.result}
              </h2>

              {error && (
                <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              {loading && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mustard-500 mx-auto"></div>
                  <p className="mt-4 text-gray-600">{t.validate.validationInProgress}</p>
                </div>
              )}

              {result && !loading && (
                <div className={`rounded-xl p-6 ${result.valid ? 'bg-green-500/20 border border-green-500/30' : 'bg-red-500/20 border border-red-500/30'}`}>
                  <div className="flex items-center justify-center mb-4">
                    {result.valid ? (
                      <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                        <CheckCircle className="h-12 w-12 text-white" />
                      </div>
                    ) : (
                      <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center">
                        <XCircle className="h-12 w-12 text-white" />
                      </div>
                    )}
                  </div>

                  <p className={`text-center text-xl font-bold mb-4 ${result.valid ? 'text-green-400' : 'text-red-400'}`}>
                    {result.message}
                  </p>

                  {result.ticketType && (
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center justify-between text-gray-600">
                        <span className="flex items-center">
                          <Ticket className="h-4 w-4 mr-2 text-gray-400" />
                          {t.validate.type}
                        </span>
                        <span className="font-semibold text-navy-900">{getTicketTypeLabel(result.ticketType)}</span>
                      </div>

                      {result.ownerName && (
                        <div className="flex items-center justify-between text-gray-600">
                          <span className="flex items-center">
                            <User className="h-4 w-4 mr-2 text-gray-400" />
                            {t.validate.passenger}
                          </span>
                          <span className="font-semibold text-navy-900">{result.ownerName}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-gray-600">
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                          {t.validate.purchase}
                        </span>
                        <span className="font-semibold text-navy-900">{formatDate(result.purchaseDate)}</span>
                      </div>

                      {result.expirationDate && (
                        <div className="flex items-center justify-between text-gray-600">
                          <span className="flex items-center">
                            <Clock className="h-4 w-4 mr-2 text-gray-400" />
                            {t.validate.expiration}
                          </span>
                          <span className="font-semibold text-navy-900">{formatDate(result.expirationDate)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {!result && !loading && !error && (
                <div className="text-center py-8 text-gray-400">
                  <Scan className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>{t.validate.waitingForQR}</p>
                </div>
              )}
            </div>

            {/* History */}
            {scanHistory.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                <h2 className="text-lg font-bold text-navy-900 mb-4">
                  {t.validate.recentHistory}
                </h2>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {scanHistory.map((item, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-3 rounded-lg ${item.valid ? 'bg-green-50' : 'bg-red-50'}`}
                    >
                      <div className="flex items-center space-x-3">
                        {item.valid ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        <span className="text-sm text-gray-700">{item.ownerName || t.validate.unknown}</span>
                      </div>
                      <span className="text-xs text-gray-500">{getTicketTypeLabel(item.ticketType)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

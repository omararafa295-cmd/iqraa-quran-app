import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { MapPin, Compass } from "lucide-react";
import { AppContext } from "../App";

const KaabaIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 8L12 4L20 8V18C20 19.1046 19.1046 20 18 20H6C4.89543 20 4 19.1046 4 18V8Z" fill="#1A1A1A"/>
    <path d="M4 8L12 12L20 8" stroke="#D4A373" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 12V20" stroke="#D4A373" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M4 11H20" stroke="#D4A373" strokeWidth="1.5"/>
  </svg>
);

export default function Qibla() {
  const { isDarkMode, lang } = useContext(AppContext);
  const isAr = lang === 'ar';

  const [qiblaDirection, setQiblaDirection] = useState(null);
  const [heading, setHeading] = useState(0); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isCompassActive, setIsCompassActive] = useState(false);

  const t = {
    title: isAr ? "اتجاه القبلة" : "Qibla Direction",
    north: isAr ? "ش" : "N",
    south: isAr ? "ج" : "S",
    east: isAr ? "ق" : "E",
    west: isAr ? "غ" : "W",
    angleMsg: isAr ? "زاوية القبلة من موقعك" : "Qibla angle from your location",
    correctMsg: isAr ? "أنت الآن تواجه القبلة 🕋" : "You are facing the Qibla 🕋",
    wrongMsg: isAr ? "لف الهاتف حتى تتطابق الكعبة مع المؤشر العلوي" : "Rotate phone until Kaaba matches top pointer",
    activateBtn: isAr ? "تفعيل بوصلة القبلة" : "Activate Qibla Compass",
    loading: isAr ? "جاري التحديد..." : "Locating...",
    errBrowser: isAr ? "متصفحك لا يدعم تحديد الموقع" : "Browser doesn't support geolocation",
    errDenied: isAr ? "تم رفض صلاحية البوصلة، ستعمل بشكل ثابت فقط." : "Compass permission denied, static mode active.",
    errServer: isAr ? "حدث خطأ أثناء الاتصال بالخادم." : "Error connecting to server.",
    errLocation: isAr ? "يرجى السماح بصلاحية الموقع." : "Please allow location permission."
  };

  const handleOrientation = (event) => {
    let compassHeading = event.webkitCompassHeading || Math.abs(event.alpha - 360);
    if (compassHeading) setHeading(compassHeading);
  };

  const startCompass = async () => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError(t.errBrowser);
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        axios.get(`https://api.aladhan.com/v1/qibla/${latitude}/${longitude}`)
          .then(async (response) => {
            setQiblaDirection(response.data.data.direction);
            
            if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
              try {
                const permission = await DeviceOrientationEvent.requestPermission();
                if (permission === 'granted') {
                  window.addEventListener('deviceorientation', handleOrientation);
                  setIsCompassActive(true);
                } else {
                  setError(t.errDenied);
                }
              } catch (err) {
                console.error(err);
              }
            } else {
              window.addEventListener('deviceorientationabsolute', handleOrientation);
              window.addEventListener('deviceorientation', handleOrientation);
              setIsCompassActive(true);
            }
            setLoading(false);
          })
          .catch(() => {
            setError(t.errServer);
            setLoading(false);
          });
      },
      () => {
        setError(t.errLocation);
        setLoading(false);
      }
    );
  };

  useEffect(() => {
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
      window.removeEventListener('deviceorientationabsolute', handleOrientation);
    };
  }, []);

  const compassRotation = qiblaDirection !== null ? (qiblaDirection - heading) : 0;

  return (
    <div className="max-w-md mx-auto p-4 md:p-6 text-center pt-20" dir={isAr ? "rtl" : "ltr"}>
      {/* توحيد العنوان بنفس الخط واللون */}
      <h2 className={`text-3xl font-bold mb-2 mt-4 ${isAr ? 'font-quran' : 'font-serif tracking-wide'} ${isDarkMode ? 'text-[#E6B981]' : 'text-[#D4A373]'}`}>
        {t.title}
      </h2>
      
      <div className={`p-8 mt-6 rounded-[3rem] flex flex-col items-center justify-center mb-8 relative border shadow-sm ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-[#FFFdf9] border-[#F0EBE1]'}`}>
        
        <div className="absolute top-4 z-20">
          <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[12px] border-[#FF6B00]"></div>
        </div>

        {qiblaDirection !== null && (
          <div 
            className="absolute top-10 z-20 transition-transform duration-700 ease-out origin-[50%_120px]"
            style={{ transform: `rotate(${compassRotation}deg)` }}
          >
            <div className="flex flex-col items-center">
              <KaabaIcon />
            </div>
          </div>
        )}

        <div 
          className={`w-64 h-64 rounded-full border relative flex items-center justify-center shadow-[inset_0_0_50px_rgba(212,163,115,0.15)] transition-transform duration-700 ease-out ${isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-[#F0EBE1] bg-gradient-to-br from-[#fffdfa] to-[#fcf6eb]'}`}
          style={{ transform: `rotate(${-heading}deg)` }}
        >
          <div className={`absolute top-4 font-bold text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>{t.north}</div>
          <div className={`absolute bottom-4 font-bold text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>{t.south}</div>
          <div className={`absolute right-4 font-bold text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>{t.east}</div>
          <div className={`absolute left-4 font-bold text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>{t.west}</div>
          
          <div className="absolute top-10 right-10 w-1.5 h-1.5 bg-[#D4A373] rounded-full"></div>
          <div className="absolute top-10 left-10 w-1.5 h-1.5 bg-[#D4A373] rounded-full"></div>
          <div className="absolute bottom-10 right-10 w-1.5 h-1.5 bg-[#D4A373] rounded-full"></div>
          <div className="absolute bottom-10 left-10 w-1.5 h-1.5 bg-[#D4A373] rounded-full"></div>

          <div className="relative flex flex-col items-center justify-center">
             <div className="w-1.5 h-16 bg-gradient-to-t from-[#FF6B00] to-[#FFA756] rounded-t-full mb-1"></div>
             <div className="w-4 h-4 bg-[#FF6B00] rounded-full shadow-md z-10"></div>
             <div className={`w-1 h-16 rounded-b-full mt-1 ${isDarkMode ? 'bg-gray-500' : 'bg-gray-200'}`}></div>
          </div>
        </div>

        {qiblaDirection !== null && (
          <div className="mt-12 text-center">
            <p className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`} dir="ltr">
              {qiblaDirection.toFixed(0)}°
            </p>
            <p className="text-gray-500 text-sm font-medium">{t.angleMsg}</p>
            
            {isCompassActive && (
              <p className={`mt-4 font-bold py-2 px-4 rounded-xl border ${Math.abs(compassRotation) < 5 ? (isDarkMode ? 'bg-green-900/30 text-green-400 border-green-800' : 'bg-green-50 text-green-600 border-green-200') : (isDarkMode ? 'bg-gray-900 text-[#E6B981] border-gray-700' : 'bg-[#FFFdf9] text-[#D4A373] border-[#F0EBE1]')}`}>
                {Math.abs(compassRotation) < 5 ? t.correctMsg : t.wrongMsg}
              </p>
            )}
          </div>
        )}
      </div>

      {!isCompassActive && (
        <button 
          onClick={startCompass}
          className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold transition-colors shadow-md ${isDarkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-[#D4A373] text-white hover:bg-[#b58555]'}`}
        >
          <Compass size={24} />
          {loading ? t.loading : t.activateBtn}
        </button>
      )}

      {error && (
        <p className="mt-4 text-red-500 font-medium text-sm bg-red-50 p-3 rounded-xl">{error}</p>
      )}
    </div>
  );
}
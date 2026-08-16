import { useState, useEffect, useContext, useRef } from "react";
import axios from "axios";
import { Compass, AlertTriangle, Hand } from "lucide-react";
import { AppContext } from "../App";
import { motion } from "framer-motion";

const KaabaIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 8L12 4L20 8V18C20 19.1046 19.1046 20 18 20H6C4.89543 20 4 19.1046 4 18V8Z" fill="#1A1A1A"/>
    <path d="M4 8L12 12L20 8" stroke="#D4AF37" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 12V20" stroke="#D4AF37" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M4 11H20" stroke="#D4AF37" strokeWidth="1.5"/>
  </svg>
);

export default function Qibla() {
  const { isDarkMode, lang } = useContext(AppContext);
  const isAr = lang === 'ar';

  const [qiblaDirection, setQiblaDirection] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isCompassActive, setIsCompassActive] = useState(false);
  const [isAligned, setIsAligned] = useState(false);
  const compassRingRef = useRef(null);
  const kaabaContainerRef = useRef(null);
  const currentHeadingRef = useRef(0);
  const qiblaDirRef = useRef(null);
  const hasValidSensorDataRef = useRef(false);

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
    errDenied: isAr ? "تم رفض صلاحية البوصلة من الإعدادات." : "Compass permission denied in settings.",
    errServer: isAr ? "حدث خطأ أثناء الاتصال بالخادم." : "Error connecting to server.",
    errLocation: isAr ? "يرجى السماح بصلاحية الموقع." : "Please allow location permission.",
    errNoSensor: isAr ? "جهازك لا يحتوي على مستشعر بوصلة (Magnetometer)" : "Device lacks a magnetometer sensor.",
    calibrationTip: isAr ? "إذا كانت البوصلة غير دقيقة، حرك هاتفك على شكل رقم 8 في الهواء" : "If inaccurate, move phone in a figure 8 motion"
  };

  const handleOrientation = (event) => {
    let compassHeading = null;
    if (event.webkitCompassHeading !== undefined) {
      compassHeading = event.webkitCompassHeading;
    } 
    else if (event.absolute === true && event.alpha !== null) {
      compassHeading = 360 - event.alpha;
    }

    if (compassHeading !== null) {
      hasValidSensorDataRef.current = true;

      let diff = compassHeading - (currentHeadingRef.current % 360);
      diff = ((diff + 540) % 360) - 180; // إيجاد أقصر طريق للدوران
      
      currentHeadingRef.current += diff;
      if (compassRingRef.current) {
        compassRingRef.current.style.transform = `rotate(${-currentHeadingRef.current}deg)`;
      }

      if (kaabaContainerRef.current && qiblaDirRef.current !== null) {
        const kaabaRotation = qiblaDirRef.current - currentHeadingRef.current;
        kaabaContainerRef.current.style.transform = `rotate(${kaabaRotation}deg)`;
        let diffAlign = Math.abs((qiblaDirRef.current - currentHeadingRef.current) % 360);
        if (diffAlign > 180) diffAlign = 360 - diffAlign;
        
        const isNowAligned = diffAlign < 5;
        setIsAligned(prev => {
          if (prev !== isNowAligned) return isNowAligned;
          return prev;
        });
      }
    }
  };

  const startCompass = async () => {
    setLoading(true);
    setError(null);
    hasValidSensorDataRef.current = false;

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
            const qiblaAngle = response.data.data.direction;
            setQiblaDirection(qiblaAngle);
            qiblaDirRef.current = qiblaAngle;
            
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
                setError(t.errDenied);
              }
            } else {
              // الأندرويد
              window.addEventListener('deviceorientationabsolute', handleOrientation);
              window.addEventListener('deviceorientation', handleOrientation);
              setIsCompassActive(true);
            }

            setTimeout(() => {
              if (!hasValidSensorDataRef.current) {
                setError(t.errNoSensor);
                setIsCompassActive(false);
                window.removeEventListener('deviceorientationabsolute', handleOrientation);
                window.removeEventListener('deviceorientation', handleOrientation);
              }
            }, 3000);

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
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
      window.removeEventListener('deviceorientationabsolute', handleOrientation);
    };
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto p-4 md:p-6 text-center pt-20 pb-24" 
      dir={isAr ? "rtl" : "ltr"}
    >
      <h2 className={`text-3xl font-bold mb-8 mt-4 ${isAr ? 'font-quran' : 'font-serif tracking-wide'} ${isDarkMode ? 'text-[#E5C158]' : 'text-[#D4AF37]'}`}>
        {t.title}
      </h2>
      
      <div className={`p-8 mt-6 rounded-[3rem] flex flex-col items-center justify-center mb-8 relative border shadow-sm ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-[#FFFdf9] border-[#F0EBE1]'}`}>
      
        <div className="absolute top-4 z-20">
          <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[12px] border-[#FF6B00]"></div>
        </div>

        {qiblaDirection !== null && (
          <div 
            ref={kaabaContainerRef}
            className="absolute top-10 z-20 origin-[50%_120px] will-change-transform"
            style={{ transition: 'transform 0.05s linear' }}
          >
            <div className="flex flex-col items-center">
              <KaabaIcon />
            </div>
          </div>
        )}

        <div 
          ref={compassRingRef}
          className={`w-64 h-64 rounded-full border relative flex items-center justify-center shadow-[inset_0_0_50px_rgba(212,163,115,0.15)] will-change-transform ${isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-[#F0EBE1] bg-gradient-to-br from-[#fffdfa] to-[#fcf6eb]'}`}
          style={{ transition: 'transform 0.05s linear' }}
        >
          <div className={`absolute top-4 font-bold text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>{t.north}</div>
          <div className={`absolute bottom-4 font-bold text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>{t.south}</div>
          <div className={`absolute right-4 font-bold text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>{t.east}</div>
          <div className={`absolute left-4 font-bold text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>{t.west}</div>
          
          <div className="absolute top-10 right-10 w-1.5 h-1.5 bg-[#D4AF37] rounded-full"></div>
          <div className="absolute top-10 left-10 w-1.5 h-1.5 bg-[#D4AF37] rounded-full"></div>
          <div className="absolute bottom-10 right-10 w-1.5 h-1.5 bg-[#D4AF37] rounded-full"></div>
          <div className="absolute bottom-10 left-10 w-1.5 h-1.5 bg-[#D4AF37] rounded-full"></div>

          <div className="relative flex flex-col items-center justify-center">
             <div className="w-1.5 h-16 bg-gradient-to-t from-[#FF6B00] to-[#FFA756] rounded-t-full mb-1"></div>
             <div className="w-4 h-4 bg-[#FF6B00] rounded-full shadow-md z-10"></div>
             <div className={`w-1 h-16 rounded-b-full mt-1 ${isDarkMode ? 'bg-gray-500' : 'bg-gray-200'}`}></div>
          </div>
        </div>

        {qiblaDirection !== null && (
          <div className="mt-12 text-center w-full">
            <p className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`} dir="ltr">
              {qiblaDirection.toFixed(0)}°
            </p>
            <p className="text-gray-500 text-sm font-medium">{t.angleMsg}</p>
            
            {isCompassActive && (
              <div className="mt-4 flex flex-col items-center gap-2">
                <p className={`w-full font-bold py-2.5 px-4 rounded-xl border transition-colors ${
                  isAligned 
                    ? (isDarkMode ? 'bg-green-900/30 text-green-400 border-green-800' : 'bg-green-50 text-green-600 border-green-200') 
                    : (isDarkMode ? 'bg-gray-900 text-[#E5C158] border-gray-700' : 'bg-[#FFFdf9] text-[#D4AF37] border-[#F0EBE1]')
                }`}>
                  {isAligned ? t.correctMsg : t.wrongMsg}
                </p>
                <p className="text-[11px] opacity-60 flex items-center gap-1 mt-1">
                  <Hand size={13} /> {t.calibrationTip}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {!isCompassActive && !error && (
        <button 
          onClick={startCompass}
          disabled={loading}
          className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold transition-colors shadow-md ${
            isDarkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-[#D4AF37] text-white hover:bg-[#B8942E]'
          }`}
        >
          <Compass size={24} className={loading ? "animate-spin" : ""} />
          {loading ? t.loading : t.activateBtn}
        </button>
      )}

      {error && (
        <div className="mt-4 text-red-500 font-medium text-sm bg-red-50 dark:bg-red-900/20 p-4 rounded-xl flex items-start gap-3 text-right">
          <AlertTriangle size={24} className="shrink-0 mt-0.5" />
          <span className="leading-relaxed">{error}</span>
        </div>
      )}
    </motion.div>
  );
}
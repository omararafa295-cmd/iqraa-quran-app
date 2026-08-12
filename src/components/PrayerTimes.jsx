import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { Search, MapPin, Sunrise, Sun, Sunset, Moon, Star, Clock3, Navigation, WifiOff, RefreshCw, Calendar } from "lucide-react";
import { AppContext } from "../App";

export default function PrayerTimes() {
  const { isDarkMode, lang } = useContext(AppContext);
  const isAr = lang === 'ar';

  const [city, setCity] = useState(() => localStorage.getItem("userCity") || "");
  const [country, setCountry] = useState(() => localStorage.getItem("userCountry") || "");
  const [searchInput, setSearchInput] = useState("");
  
  const [timings, setTimings] = useState(() => {
    const saved = localStorage.getItem("userPrayerTimings");
    return saved ? JSON.parse(saved) : null;
  });

  const [dateInfo, setDateInfo] = useState(() => {
    const saved = localStorage.getItem("userPrayerDate");
    return saved ? JSON.parse(saved) : null;
  });

  const [loading, setLoading] = useState(!timings);
  const [fetchError, setFetchError] = useState(false);

  const t = {
    title: isAr ? "مواقيت الصلاة" : "Prayer Times",
    search: isAr ? "ابحث عن مدينتك (مثال: Alexandria)..." : "Search for your city...",
    loading: isAr ? "جاري تحديد الموقع والمواقيت..." : "Locating & loading timings...",
    offlineErr: isAr ? "أنت أوفلاين ولا توجد مواقيت محفوظة لهذه المدينة" : "You are offline and no cached timings found",
    retry: isAr ? "إعادة المحاولة" : "Retry",
    prayers: {
      Fajr: isAr ? "الفجر" : "Fajr",
      Sunrise: isAr ? "الشروق" : "Sunrise",
      Dhuhr: isAr ? "الظهر" : "Dhuhr",
      Asr: isAr ? "العصر" : "Asr",
      Maghrib: isAr ? "المغرب" : "Maghrib",
      Isha: isAr ? "العشاء" : "Isha",
    }
  };

  const getUserLocation = () => {
    setLoading(true);
    setFetchError(false);

    if (!navigator.onLine) {
      handleOfflineFallback();
      setLoading(false); 
      return;
    }

    if ("geolocation" in navigator) {
      const geoOptions = {
        enableHighAccuracy: true,
        timeout: 10000, 
        maximumAge: 0   
      };

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const res = await axios.get(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`, { timeout: 5000 });
            
            const detectedCity = res.data.city || res.data.locality || "Cairo";
            const detectedCountry = res.data.countryName || "Egypt";
            
            localStorage.setItem("userCity", detectedCity);
            localStorage.setItem("userCountry", detectedCountry);
            
            setCountry(detectedCountry);
            setCity(detectedCity);
          } catch (error) {
            handleOfflineFallback();
          } finally {
            setLoading(false); 
          }
        },
        (error) => {
          handleOfflineFallback();
          setLoading(false); 
        },
        geoOptions 
      );
    } else {
      handleOfflineFallback();
      setLoading(false);
    }
  };

  const handleOfflineFallback = () => {
    const savedCity = localStorage.getItem("userCity") || "Cairo";
    const savedCountry = localStorage.getItem("userCountry") || "Egypt";
    const savedTimings = localStorage.getItem("userPrayerTimings");
    const savedDate = localStorage.getItem("userPrayerDate");

    setCity(savedCity);
    setCountry(savedCountry);

    if (savedTimings) {
      setTimings(JSON.parse(savedTimings));
      if (savedDate) setDateInfo(JSON.parse(savedDate));
      setFetchError(false);
    } else {
      setFetchError(true);
    }
    setLoading(false);
  };

  useEffect(() => {
    const savedCity = localStorage.getItem("userCity");
    const savedCountry = localStorage.getItem("userCountry");
    
    if (savedCity && savedCountry) {
      setCity(savedCity);
      setCountry(savedCountry);
    } else {
      getUserLocation();
    }
  }, []);

  const fetchPrayerTimes = () => {
    if (!city) return;
    
    if (!timings) setLoading(true);
    setFetchError(false);

    axios.get(`https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=5`, { timeout: 7000 })
      .then((response) => {
        const fetchedData = response.data.data;
        const fetchedTimings = fetchedData.timings;
        
        const dateObj = {
          readable: fetchedData.date.readable,
          dayNameAr: fetchedData.date.hijri.weekday.ar,
          dayNameEn: fetchedData.date.gregorian.weekday.en,
          hijri: `${fetchedData.date.hijri.day} ${fetchedData.date.hijri.month.ar} ${fetchedData.date.hijri.year}`,
          gregorian: fetchedData.date.gregorian.date
        };

        setTimings(fetchedTimings);
        setDateInfo(dateObj);

        localStorage.setItem("userPrayerTimings", JSON.stringify(fetchedTimings));
        localStorage.setItem("userPrayerDate", JSON.stringify(dateObj));

        setFetchError(false);
        setLoading(false);
      })
      .catch((error) => {
        const savedTimings = localStorage.getItem("userPrayerTimings");
        const savedDate = localStorage.getItem("userPrayerDate");
        if (savedTimings) {
          setTimings(JSON.parse(savedTimings));
          if (savedDate) setDateInfo(JSON.parse(savedDate));
          setFetchError(false);
        } else {
          setFetchError(true);
        }
        setLoading(false);
      });
  };

  useEffect(() => {
    if (city) {
      fetchPrayerTimes();
    }
  }, [city, country]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setCity(searchInput);
      setCountry("");
      setSearchInput("");
    }
  };

  const getNightPortions = (maghrib, fajr) => {
    if (!maghrib || !fajr) return null;
    let [mH, mM] = maghrib.split(':').map(Number);
    let [fH, fM] = fajr.split(':').map(Number);

    let maghribMins = mH * 60 + mM;
    let fajrMins = fH * 60 + fM;
    if (fajrMins < maghribMins) fajrMins += 24 * 60;

    let duration = fajrMins - maghribMins;
    let midnight = maghribMins + duration / 2;
    let lastThird = maghribMins + (duration * 2) / 3;

    const format = (m) => {
      let hours = Math.floor(m / 60) % 24;
      let mins = Math.round(m % 60);
      let ampm = hours >= 12 ? (isAr ? 'م' : 'PM') : (isAr ? 'ص' : 'AM');
      let h = hours % 12 || 12;
      return `${h}:${mins < 10 ? '0'+mins : mins} ${ampm}`;
    };

    return {
      midnight: format(midnight),
      lastThird: format(lastThird)
    };
  };

  const nightTimes = timings ? getNightPortions(timings.Maghrib, timings.Fajr) : null;

  const prayers = [
    { id: "Fajr", name: t.prayers.Fajr, icon: <Moon size={28} /> },
    { id: "Sunrise", name: t.prayers.Sunrise, icon: <Sunrise size={28} /> },
    { id: "Dhuhr", name: t.prayers.Dhuhr, icon: <Sun size={28} /> },
    { id: "Asr", name: t.prayers.Asr, icon: <Sun size={28} /> },
    { id: "Maghrib", name: t.prayers.Maghrib, icon: <Sunset size={28} /> },
    { id: "Isha", name: t.prayers.Isha, icon: <Moon size={28} /> },
  ];

  return (
    <div className="max-w-md mx-auto p-4 md:p-6 pt-20" dir={isAr ? "rtl" : "ltr"}>
      <div className="mb-6 mt-4">
        <h2 className={`text-3xl font-bold mb-6 text-center ${isAr ? 'font-quran' : 'font-serif tracking-wide'} ${isDarkMode ? 'text-[#E6B981]' : 'text-[#D4A373]'}`}>
          {t.title}
        </h2>
        
        <form onSubmit={handleSearch} className="relative mb-6">
          <input 
            type="text" 
            placeholder={t.search} 
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className={`w-full p-4 ${isAr ? 'pr-12' : 'pl-12'} rounded-2xl border focus:outline-none shadow-sm transition-colors ${!isAr && 'font-sans'} ${isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-200 focus:border-[#E6B981]' : 'bg-white border-[#F0EBE1] text-gray-700 focus:border-[#D4A373]'}`}
            dir="ltr"
          />
          <Search className={`absolute ${isAr ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-gray-400`} size={20} />
        </form>
        
        {city && (
          <div className="flex flex-col items-center gap-2">
            <div className={`flex items-center justify-center gap-2 font-bold ${isDarkMode ? 'text-[#E6B981]' : 'text-[#D4A373]'}`}>
              <MapPin size={20} />
              <span>{city}{country ? `, ${country}` : ''}</span>
              <button 
                onClick={getUserLocation} 
                className={`p-1.5 rounded-full transition-colors ${isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                title={isAr ? "تحديد موقعي الحالي" : "Locate Me"}
              >
                <Navigation size={16} />
              </button>
            </div>

            {dateInfo && (
              <div className={`flex flex-wrap items-center justify-center gap-2 text-xs font-bold mt-1 px-3.5 py-1.5 rounded-full border shadow-sm ${
                isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-white border-[#F0EBE1] text-gray-600'
              }`}>
                <Calendar size={14} className={isDarkMode ? 'text-[#E6B981]' : 'text-[#D4A373]'} />
                <span>{isAr ? dateInfo.dayNameAr : dateInfo.dayNameEn}</span>
                <span>•</span>
                <span>{dateInfo.gregorian}</span>
                <span>({dateInfo.hijri})</span>
              </div>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className={`text-center py-10 font-bold ${isDarkMode ? 'text-[#E6B981]' : 'text-[#D4A373]'}`}>{t.loading}</div>
      ) : fetchError && !timings ? (
        <div className="flex flex-col items-center justify-center py-12 text-center px-4">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isDarkMode ? 'bg-gray-800 text-[#E6B981]' : 'bg-red-50 text-red-500'}`}>
            <WifiOff size={32} />
          </div>
          <p className={`font-bold mb-6 max-w-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {t.offlineErr}
          </p>
          <button 
            onClick={fetchPrayerTimes}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-md ${isDarkMode ? 'bg-[#E6B981] text-gray-900' : 'bg-[#D4A373] text-white'}`}
          >
            <RefreshCw size={18} /> {t.retry}
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {prayers.map((prayer) => (
              <div key={prayer.id} className={`p-5 rounded-2xl shadow-sm border flex flex-col items-center justify-center gap-2 transition-colors ${isDarkMode ? 'bg-gray-800 border-gray-700 hover:border-[#E6B981]' : 'bg-white border-[#F0EBE1] hover:border-[#D4A373]'}`}>
                <div className={isDarkMode ? 'text-[#E6B981]' : 'text-[#D4A373]'}>{prayer.icon}</div>
                <h3 className={`font-bold text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{prayer.name}</h3>
                <p className={`text-xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`} dir="ltr">
                  {timings?.[prayer.id] || "--:--"}
                </p>
              </div>
            ))}
          </div>

          {nightTimes && (
            <div className={`p-6 rounded-3xl shadow-lg border relative overflow-hidden ${
              isDarkMode ? 'bg-gradient-to-br from-gray-900 to-[#1a1c23] border-[#E6B981]/30' : 'bg-gradient-to-br from-[#2a1f18] to-[#1e1510] border-[#D4A373]'
            }`}>
          
              <div className="absolute -top-4 -left-4 opacity-10">
                <Star size={100} className="text-[#E6B981]" />
              </div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <Moon size={22} className="text-[#E6B981]" />
                  <h3 className="text-xl font-bold font-quran text-[#E6B981]">
                    {isAr ? 'حاسبة قيام الليل' : 'Tahajjud Calculator'}
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <span className="text-gray-400 text-xs font-bold mb-1">{isAr ? 'منتصف الليل (نهاية وقت العشاء)' : 'Midnight'}</span>
                    <div className="flex items-center gap-2 text-white font-bold text-lg" dir="ltr">
                      <Clock3 size={16} className="text-[#E6B981]" /> {nightTimes.midnight}
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-400 text-xs font-bold mb-1">{isAr ? 'الثلث الأخير (أفضل وقت للدعاء)' : 'Last Third'}</span>
                    <div className="flex items-center gap-2 text-[#E6B981] font-bold text-lg" dir="ltr">
                      <Star size={16} /> {nightTimes.lastThird}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
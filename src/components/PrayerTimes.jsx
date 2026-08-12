import { useState, useEffect, useContext, useMemo, useRef } from "react";
import axios from "axios";
import { Search, MapPin, Sunrise, Sun, Sunset, Moon, Star, Clock3, Navigation, WifiOff, RefreshCw, Calendar, Sparkles } from "lucide-react";
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

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const t = {
    title: isAr ? "مواقيت الصلاة" : "Prayer Times",
    search: isAr ? "ابحث عن مدينتك (مثال: Alexandria)..." : "Search for your city...",
    loading: isAr ? "جاري تحديد الموقع والمواقيت..." : "Locating & loading timings...",
    offlineErr: isAr ? "أنت أوفلاين ولا توجد مواقيت محفوظة لهذه المدينة" : "You are offline and no cached timings found",
    retry: isAr ? "إعادة المحاولة" : "Retry",
    next: isAr ? "الصلاة القادمة" : "Next Prayer",
    remaining: isAr ? "متبقٍ" : "remaining",
    now: isAr ? "الآن" : "Now",
    hourShort: isAr ? "س" : "h",
    minShort: isAr ? "د" : "m",
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
    { id: "Fajr", name: t.prayers.Fajr, icon: Moon },
    { id: "Sunrise", name: t.prayers.Sunrise, icon: Sunrise },
    { id: "Dhuhr", name: t.prayers.Dhuhr, icon: Sun },
    { id: "Asr", name: t.prayers.Asr, icon: Sun },
    { id: "Maghrib", name: t.prayers.Maghrib, icon: Sunset },
    { id: "Isha", name: t.prayers.Isha, icon: Moon },
  ];

  const toMinutes = (str) => {
    if (!str) return null;
    const match = str.match(/(\d{1,2}):(\d{2})/);
    if (!match) return null;
    return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
  };
  const arcData = useMemo(() => {
    if (!timings) return null;

    const fajrMin = toMinutes(timings.Fajr);
    let ishaMin = toMinutes(timings.Isha);
    if (fajrMin === null || ishaMin === null) return null;
    if (ishaMin <= fajrMin) ishaMin += 24 * 60;

    const span = ishaMin - fajrMin;

    const points = prayers.map((p) => {
      let mins = toMinutes(timings[p.id]);
      if (mins === null) return null;
      if (mins < fajrMin) mins += 24 * 60;
      const progress = Math.min(1, Math.max(0, (mins - fajrMin) / span));
      return { ...p, mins, progress };
    }).filter(Boolean);

    const nowMins0 = now.getHours() * 60 + now.getMinutes();
    let nowMins = nowMins0;
    if (nowMins < fajrMin) nowMins += 24 * 60;
    const nowProgress = Math.min(1, Math.max(0, (nowMins - fajrMin) / span));
    const isNight = nowMins0 >= (ishaMin % (24 * 60)) || nowMins0 < fajrMin;

    let nextIndex = points.findIndex((p) => p.mins > nowMins);
    let currentIndex = nextIndex === -1 ? points.length - 1 : nextIndex - 1;
    if (nextIndex === -1) nextIndex = 0; 

    const nextPrayer = points[nextIndex];
    let minsToNext = nextPrayer.mins - nowMins;
    if (minsToNext < 0) minsToNext += 24 * 60;
    const hoursLeft = Math.floor(minsToNext / 60);
    const minsLeft = Math.round(minsToNext % 60);

    return { points, nowProgress, currentIndex, nextIndex, nextPrayer, hoursLeft, minsLeft, isNight };
  }, [timings, now, isAr]);

  const arcY = (progress) => -Math.sin(progress * Math.PI) * 46;

  const arcPath = useMemo(() => {
    if (!arcData) return "";
    const steps = 40;
    let d = "";
    for (let i = 0; i <= steps; i++) {
      const p = i / steps;
      const x = p * 100;
      const y = 60 + arcY(p);
      d += `${i === 0 ? "M" : "L"} ${x} ${y} `;
    }
    return d;
  }, [arcData]);

  return (
    <div className="max-w-md mx-auto p-4 md:p-6 pt-20" dir={isAr ? "rtl" : "ltr"}>
      <style>{`
        @keyframes riseIn { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes twinkle { 0%, 100% { opacity: 0.25; } 50% { opacity: 1; } }
        @keyframes glowPulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(212,163,115,0.45); } 50% { box-shadow: 0 0 0 8px rgba(212,163,115,0); } }
        @keyframes drawArc { from { stroke-dashoffset: 400; } to { stroke-dashoffset: 0; } }
        .rise-in { animation: riseIn 0.55s cubic-bezier(0.22,1,0.36,1) both; }
      `}</style>

      <div className="mb-6 mt-4 rise-in">
        <h2 className={`text-3xl font-bold mb-6 text-center ${isAr ? 'font-quran' : 'font-serif tracking-wide'} ${isDarkMode ? 'text-[#E6B981]' : 'text-[#D4A373]'}`}>
          {t.title}
        </h2>
        
        <form onSubmit={handleSearch} className="relative mb-6">
          <input 
            type="text" 
            placeholder={t.search} 
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className={`w-full p-4 ${isAr ? 'pr-12' : 'pl-12'} rounded-2xl border focus:outline-none shadow-sm transition-all focus:shadow-md ${!isAr && 'font-sans'} ${isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-200 focus:border-[#E6B981]' : 'bg-white border-[#F0EBE1] text-gray-700 focus:border-[#D4A373]'}`}
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
          {arcData && (
            <div
              className={`relative overflow-hidden rounded-[2rem] p-6 pb-5 mb-5 shadow-lg rise-in ${
                arcData.isNight
                  ? 'bg-gradient-to-br from-[#241a12] to-[#171009] border border-[#3a2b1c]'
                  : (isDarkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700' : 'bg-gradient-to-br from-[#FFF9F0] to-[#FBEFDC] border border-[#F0DFC0]')
              }`}
              style={{ animationDelay: '80ms' }}
            >
              {arcData.isNight && (
                <>
                  {[...Array(14)].map((_, i) => (
                    <span
                      key={i}
                      className="absolute rounded-full bg-[#E6B981]"
                      style={{
                        width: '2px', height: '2px',
                        left: `${(i * 37) % 100}%`,
                        top: `${(i * 53) % 60}%`,
                        animation: `twinkle ${2 + (i % 4)}s ease-in-out infinite`,
                        animationDelay: `${i * 0.2}s`,
                        opacity: 0.5,
                      }}
                    />
                  ))}
                </>
              )}

              <div className="relative z-10 flex items-center justify-between mb-1">
                <span className={`text-xs font-bold uppercase tracking-wide ${arcData.isNight ? 'text-[#c9a879]' : (isDarkMode ? 'text-gray-400' : 'text-gray-500')}`}>
                  {t.next}
                </span>
                <span className={`flex items-center gap-1 text-xs font-bold ${arcData.isNight ? 'text-[#E6B981]' : (isDarkMode ? 'text-[#E6B981]' : 'text-[#B5793A]')}`}>
                  <Sparkles size={12} /> {t.now}
                </span>
              </div>

              <div className="relative z-10 flex items-end justify-between mb-4">
                <h3 className={`text-3xl font-bold ${isAr ? 'font-quran' : 'font-serif'} ${arcData.isNight ? 'text-white' : (isDarkMode ? 'text-white' : 'text-[#3a2a1a]')}`}>
                  {arcData.nextPrayer.name}
                </h3>
                <div className={`text-sm font-bold ${arcData.isNight ? 'text-[#E6B981]' : (isDarkMode ? 'text-[#E6B981]' : 'text-[#B5793A]')}`}>
                  {isAr ? (
                    <div className="inline-flex items-center gap-1" dir="rtl">
                      <span className="opacity-70 font-medium">{t.remaining}</span>
                      {arcData.hoursLeft > 0 && (
                        <span>{arcData.hoursLeft}{t.hourShort}</span>
                      )}
                      <span>{arcData.minsLeft}{t.minShort}</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1" dir="ltr">
                      {arcData.hoursLeft > 0 && (
                        <span>{arcData.hoursLeft}{t.hourShort}</span>
                      )}
                      <span>{arcData.minsLeft}{t.minShort}</span>
                      <span className="opacity-70 font-medium">{t.remaining}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="relative z-10 h-24 mt-2">
                <svg viewBox="0 0 100 60" preserveAspectRatio="none" className="absolute inset-0 w-full h-full overflow-visible">
                  <path
                    d={arcPath}
                    fill="none"
                    stroke={arcData.isNight ? 'rgba(230,185,129,0.35)' : (isDarkMode ? 'rgba(230,185,129,0.35)' : 'rgba(181,121,58,0.3)')}
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeDasharray="400"
                    style={{ animation: 'drawArc 1.2s ease-out both' }}
                  />
                </svg>
                <div
                  className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-1000 ease-linear"
                  style={{
                    left: `${arcData.nowProgress * 100}%`,
                    top: `${((60 + arcY(arcData.nowProgress)) / 60) * 100}%`,
                  }}
                >
                  <div className={`w-3 h-3 rounded-full ${arcData.isNight ? 'bg-[#E6B981]' : 'bg-[#D4A373]'}`} style={{ animation: 'glowPulse 2s ease-in-out infinite' }} />
                </div>

                {arcData.points.map((p, i) => {
                  const Icon = p.icon;
                  const isCurrent = i === arcData.currentIndex;
                  const isNext = i === arcData.nextIndex;
                  return (
                    <div
                      key={p.id}
                      className="absolute -translate-x-1/2 flex flex-col items-center gap-1"
                      style={{ left: `${p.progress * 100}%`, top: `${((60 + arcY(p.progress)) / 60) * 100}%`, transform: 'translate(-50%, -50%)' }}
                    >
                      <div
                        className={`flex items-center justify-center rounded-full transition-all ${
                          isNext
                            ? (arcData.isNight ? 'bg-[#E6B981] text-[#241a12]' : 'bg-[#D4A373] text-white') + ' w-7 h-7 shadow-md'
                            : isCurrent
                              ? (arcData.isNight ? 'bg-[#3a2b1c] text-[#E6B981] border border-[#E6B981]' : (isDarkMode ? 'bg-gray-700 text-[#E6B981] border border-[#E6B981]' : 'bg-white text-[#D4A373] border border-[#D4A373]')) + ' w-6 h-6'
                              : (arcData.isNight ? 'bg-[#2a1f16] text-[#7a6a55]' : (isDarkMode ? 'bg-gray-700 text-gray-500' : 'bg-white text-gray-400')) + ' w-5 h-5 opacity-70'
                        }`}
                      >
                        <Icon size={isNext ? 14 : 11} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {prayers.map((prayer, i) => {
              const Icon = prayer.icon;
              const isCurrent = arcData && i === arcData.currentIndex;
              const isNext = arcData && i === arcData.nextIndex;
              return (
                <div
                  key={prayer.id}
                  className={`relative p-5 rounded-2xl shadow-sm border flex flex-col items-center justify-center gap-2 transition-all duration-300 rise-in ${
                    isNext
                      ? (isDarkMode ? 'bg-gray-800 border-[#E6B981] shadow-[0_0_0_1px_rgba(230,185,129,0.3)]' : 'bg-white border-[#D4A373] shadow-[0_4px_20px_rgba(212,163,115,0.25)]') + ' scale-[1.03]'
                      : (isDarkMode ? 'bg-gray-800 border-gray-700 hover:border-[#E6B981]' : 'bg-white border-[#F0EBE1] hover:border-[#D4A373]')
                  }`}
                  style={{ animationDelay: `${120 + i * 60}ms` }}
                >
                  {isNext && (
                    <span className={`absolute -top-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${isDarkMode ? 'bg-[#E6B981] text-gray-900' : 'bg-[#D4A373] text-white'}`}>
                      {t.next}
                    </span>
                  )}
                  <div className={isCurrent || isNext ? (isDarkMode ? 'text-[#E6B981]' : 'text-[#D4A373]') : (isDarkMode ? 'text-gray-500' : 'text-gray-400')}>
                    <Icon size={26} />
                  </div>
                  <h3 className={`font-bold text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{prayer.name}</h3>
                  <p className={`text-xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`} dir="ltr">
                    {timings?.[prayer.id] || "--:--"}
                  </p>
                </div>
              );
            })}
          </div>

          {nightTimes && (
            <div className={`relative p-6 rounded-3xl shadow-lg border overflow-hidden rise-in ${
              isDarkMode ? 'bg-gradient-to-br from-gray-900 to-[#1a1c23] border-[#E6B981]/30' : 'bg-gradient-to-br from-[#2a1f18] to-[#1e1510] border-[#D4A373]'
            }`} style={{ animationDelay: '340ms' }}>

              {[...Array(10)].map((_, i) => (
                <span
                  key={i}
                  className="absolute rounded-full bg-white"
                  style={{
                    width: '2px', height: '2px',
                    left: `${(i * 41 + 5) % 95}%`,
                    top: `${(i * 29 + 8) % 85}%`,
                    animation: `twinkle ${2.5 + (i % 3)}s ease-in-out infinite`,
                    animationDelay: `${i * 0.3}s`,
                  }}
                />
              ))}

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
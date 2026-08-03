import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { Search, MapPin, Sunrise, Sun, Sunset, Moon, Star, Clock3 } from "lucide-react";
import { AppContext } from "../App";

export default function PrayerTimes() {
  const { isDarkMode, lang } = useContext(AppContext);
  const isAr = lang === 'ar';

  const [city, setCity] = useState("Cairo");
  const [country, setCountry] = useState("Egypt");
  const [searchInput, setSearchInput] = useState("");
  const [timings, setTimings] = useState(null);
  const [loading, setLoading] = useState(true);

  const t = {
    title: isAr ? "مواقيت الصلاة" : "Prayer Times",
    search: isAr ? "ابحث عن مدينتك (مثال: Alexandria)..." : "Search for your city...",
    loading: isAr ? "جاري تحميل المواقيت..." : "Loading timings...",
    prayers: {
      Fajr: isAr ? "الفجر" : "Fajr",
      Sunrise: isAr ? "الشروق" : "Sunrise",
      Dhuhr: isAr ? "الظهر" : "Dhuhr",
      Asr: isAr ? "العصر" : "Asr",
      Maghrib: isAr ? "المغرب" : "Maghrib",
      Isha: isAr ? "العشاء" : "Isha",
    }
  };

  const fetchPrayerTimes = () => {
    setLoading(true);
    axios.get(`https://api.aladhan.com/v1/timingsByCity?city=${city}&country=${country}&method=5`)
      .then((response) => {
        setTimings(response.data.data.timings);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching prayer times:", error);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchPrayerTimes();
  }, [city]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setCity(searchInput);
      setSearchInput("");
    }
  };

  
  const getNightPortions = (maghrib, fajr) => {
    if (!maghrib || !fajr) return null;
    let [mH, mM] = maghrib.split(':').map(Number);
    let [fH, fM] = fajr.split(':').map(Number);

    let maghribMins = mH * 60 + mM;
    let fajrMins = fH * 60 + fM;
    if (fajrMins < maghribMins) fajrMins += 24 * 60; // لو الفجر في اليوم التالي

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
      <div className="mb-8 mt-4">
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
        <div className={`flex items-center justify-center gap-2 font-bold ${isDarkMode ? 'text-[#E6B981]' : 'text-[#D4A373]'}`}>
          <MapPin size={20} />
          <span>{city}, {country}</span>
        </div>
      </div>

      {loading ? (
        <div className={`text-center py-10 font-bold ${isDarkMode ? 'text-[#E6B981]' : 'text-[#D4A373]'}`}>{t.loading}</div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {prayers.map((prayer) => (
              <div key={prayer.id} className={`p-5 rounded-2xl shadow-sm border flex flex-col items-center justify-center gap-2 transition-colors ${isDarkMode ? 'bg-gray-800 border-gray-700 hover:border-[#E6B981]' : 'bg-white border-[#F0EBE1] hover:border-[#D4A373]'}`}>
                <div className={isDarkMode ? 'text-[#E6B981]' : 'text-[#D4A373]'}>{prayer.icon}</div>
                <h3 className={`font-bold text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{prayer.name}</h3>
                <p className={`text-xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`} dir="ltr">
                  {timings[prayer.id]}
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
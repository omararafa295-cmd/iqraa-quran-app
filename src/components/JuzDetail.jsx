import { useState, useEffect, useContext } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, ArrowRight, Loader2, WifiOff, RefreshCw } from "lucide-react"; 
import { AppContext } from "../App";

export default function JuzDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDarkMode, lang } = useContext(AppContext);
  const isAr = lang === 'ar';

  const [surahsInJuz, setSurahsInJuz] = useState([]);
  const [loading, setLoading] = useState(true);
  const [offlineError, setOfflineError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    setLoading(true);
    setOfflineError(false);

    const cachedSurahs = JSON.parse(localStorage.getItem('offline_surahs_list') || "[]");
    const juzUrl = `https://api.alquran.cloud/v1/juz/${id}/quran-uthmani`;

    const processJuzData = (ayahs) => {
      const surahsMap = {};

      ayahs.forEach(ayah => {
        if (!surahsMap[ayah.surah.number]) {
          const cachedSurah = cachedSurahs.find(s => s.number === ayah.surah.number);
          
          surahsMap[ayah.surah.number] = {
            ...ayah.surah,
            englishName: ayah.surah.englishName || cachedSurah?.englishName || `Surah ${ayah.surah.number}`,
            startAyah: ayah.numberInSurah,
            endAyah: ayah.numberInSurah
          };
        } else {
          surahsMap[ayah.surah.number].endAyah = ayah.numberInSurah;
        }
      });

      setSurahsInJuz(Object.values(surahsMap));
      setLoading(false);
    };

    const loadJuzData = async () => {
      try {
        const res = await axios.get(juzUrl);
        const ayahs = res.data?.data?.ayahs || [];

        try {
          if ('caches' in window) {
            const cache = await caches.open('quran-text-cache-v1');
            cache.put(juzUrl, new Response(JSON.stringify(res.data)));
          }
        } catch (e) {}

        processJuzData(ayahs);
      } catch (networkError) {
        try {
          if ('caches' in window) {
            const cache = await caches.open('quran-text-cache-v1');
            const cachedRes = await cache.match(juzUrl);
            if (cachedRes) {
              const cachedData = await cachedRes.json();
              processJuzData(cachedData?.data?.ayahs || []);
              return;
            }
          }
        } catch (cacheError) {}

        setOfflineError(true);
        setLoading(false);
      }
    };

    loadJuzData();
  }, [id, retryCount]);

  const BackIcon = isAr ? ArrowLeft : ArrowRight;

  if (offlineError) {
    return (
      <div className={`flex flex-col justify-center items-center min-h-screen p-6 text-center ${isDarkMode ? "bg-gray-900 text-white" : "bg-[#FDFBF7] text-gray-800"}`} dir={isAr ? "rtl" : "ltr"}>
        <div className={`w-20 h-20 mb-5 rounded-full flex items-center justify-center ${isDarkMode ? "bg-gray-800 text-[#E5C158]" : "bg-white border-[#F0EBE1] border text-[#D4AF37] shadow-md"}`}>
          <WifiOff size={40} />
        </div>
        <h2 className="text-2xl font-bold mb-3">{isAr ? "تعذر جلب بيانات الجزء" : "Connection Error"}</h2>
        <p className="text-gray-500 mb-6 max-w-sm text-sm leading-relaxed">
          {isAr ? "تأكد من اتصالك بالإنترنت ثم حاول مرة أخرى." : "Check your internet connection and try again."}
        </p>
        
        <div className="flex gap-3">
          <button 
            onClick={() => setRetryCount(prev => prev + 1)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm ${isDarkMode ? "bg-gray-800 text-[#E5C158] border border-gray-700 hover:bg-gray-700" : "bg-white text-[#D4AF37] border border-[#F0EBE1] hover:bg-gray-50"}`}
          >
            <RefreshCw size={18} />
            {isAr ? "إعادة المحاولة" : "Retry"}
          </button>
          <button 
            onClick={() => navigate("/")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md ${isDarkMode ? "bg-[#E5C158] text-gray-900 hover:bg-[#d6b047]" : "bg-[#D4AF37] text-white hover:bg-[#bf9b2e]"}`}
          >
            <BackIcon size={18} />
            {isAr ? "الرئيسية" : "Home"}
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`flex justify-center items-center min-h-screen ${isDarkMode ? "bg-gray-900" : "bg-[#FDFBF7]"}`}>
        <Loader2 size={40} className={`animate-spin ${isDarkMode ? 'text-[#E5C158]' : 'text-[#D4AF37]'}`} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 pt-2 md:pt-6 pb-32" dir={isAr ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between mb-8 px-2 mt-4">
        <h2 className={`text-3xl font-bold ${isAr ? 'font-quran' : 'font-serif tracking-wide'} ${isDarkMode ? "text-[#E5C158]" : "text-[#D4AF37]"}`}>
          {isAr ? `فهرس الجزء ${id}` : `Juz ${id} Index`}
        </h2>
        <Link to="/" className={`p-2 rounded-xl shadow-sm border transition-colors ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-300 hover:text-[#E5C158]" : "bg-white border-[#F0EBE1] text-gray-500 hover:text-[#D4AF37]"}`}>
          <BackIcon size={20} />
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {surahsInJuz.map((surah) => (
          <Link
            to={`/surah/${surah.number}`}
            state={{ startAyah: surah.startAyah }} 
            key={surah.number}
            className={`flex items-center justify-between p-4 md:p-5 rounded-2xl shadow-sm border transition-all duration-300 transform hover:-translate-y-1 hover:shadow-md group ${
              isDarkMode ? 'bg-gray-800 border-gray-700 hover:border-[#E5C158]' : 'bg-white border-[#F0EBE1] hover:border-[#D4AF37]'
            }`}
          >
            <div className="flex items-center gap-3 md:gap-4">
              <div className={`relative flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-xl rotate-45 border-2 transition-all shrink-0 ${
                isDarkMode ? 'border-gray-700 group-hover:bg-[#E5C158] group-hover:border-[#E5C158]' : 'border-[#F0EBE1] group-hover:bg-[#D4AF37] group-hover:border-[#D4AF37]'
              }`}>
                <span className={`absolute -rotate-45 font-bold text-sm md:text-base ${
                  isDarkMode ? 'text-gray-400 group-hover:text-gray-900' : 'text-gray-500 group-hover:text-white'
                }`}>
                  {surah.number}
                </span>
              </div>

              <div className={`flex flex-col ${isAr ? 'text-right' : 'text-left'}`}>
                <span className={`font-bold font-sans text-sm md:text-base transition-colors ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  {surah.englishName}
                </span>
                <span className={`text-[10px] md:text-xs font-bold tracking-wider ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  {isAr ? 'من آية' : 'Ayah'} {surah.startAyah} {isAr ? 'إلى' : 'to'} {surah.endAyah}
                </span>
              </div>
            </div>
            <div className={`text-xl md:text-2xl font-bold font-quran transition-colors ${
              isDarkMode ? 'text-[#E5C158]' : 'text-[#D4AF37]'
            }`}>
              {(surah.name || "").replace('سُورَةُ ', '')}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
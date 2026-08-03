import { useState, useEffect, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, Loader2 } from "lucide-react";
import { AppContext } from "../App";

export default function JuzDetail() {
  const { id } = useParams();
  const { isDarkMode, lang } = useContext(AppContext);
  const isAr = lang === 'ar';

  const [surahsInJuz, setSurahsInJuz] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    // هنجيب بيانات الجزء عشان نعرف السور اللي جواه
    axios.get(`https://api.alquran.cloud/v1/juz/${id}`)
      .then(res => {
        const ayahs = res.data.data.ayahs;
        const surahsMap = {};

       
        ayahs.forEach(ayah => {
          if (!surahsMap[ayah.surah.number]) {
            surahsMap[ayah.surah.number] = {
              ...ayah.surah,
              startAyah: ayah.numberInSurah,
              endAyah: ayah.numberInSurah
            };
          } else {
            surahsMap[ayah.surah.number].endAyah = ayah.numberInSurah;
          }
        });

        setSurahsInJuz(Object.values(surahsMap));
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  const BackIcon = isAr ?ArrowLeft  : ArrowRight;

  if (loading) {
    return (
      <div className={`flex justify-center items-center min-h-screen ${isDarkMode ? "bg-gray-900" : "bg-[#FDFBF7]"}`}>
        <Loader2 size={40} className={`animate-spin ${isDarkMode ? 'text-[#E6B981]' : 'text-[#D4A373]'}`} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 pt-20 pb-28" dir={isAr ? "rtl" : "ltr"}>
      
      {/* الهيدر */}
      <div className="flex items-center justify-between mb-8 px-2 mt-4">
        <h2 className={`text-3xl font-bold ${isAr ? 'font-quran' : 'font-serif tracking-wide'} ${isDarkMode ? "text-[#E6B981]" : "text-[#D4A373]"}`}>
          {isAr ? `فهرس الجزء ${id}` : `Juz ${id} Index`}
        </h2>
        <Link to="/" className={`p-2 rounded-xl shadow-sm border transition-colors ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-300 hover:text-[#E6B981]" : "bg-white border-[#F0EBE1] text-gray-500 hover:text-[#D4A373]"}`}>
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
              isDarkMode ? 'bg-gray-800 border-gray-700 hover:border-[#E6B981]' : 'bg-white border-[#F0EBE1] hover:border-[#D4A373]'
            }`}
          >
            <div className="flex items-center gap-3 md:gap-4">
              <div className={`relative flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-xl rotate-45 border-2 transition-all shrink-0 ${
                isDarkMode ? 'border-gray-700 group-hover:bg-[#E6B981] group-hover:border-[#E6B981]' : 'border-[#F0EBE1] group-hover:bg-[#D4A373] group-hover:border-[#D4A373]'
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
              isDarkMode ? 'text-[#E6B981]' : 'text-[#D4A373]'
            }`}>
              {surah.name.replace('سُورَةُ ', '')}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
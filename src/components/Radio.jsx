import { useState, useEffect, useRef, useContext } from "react";
import axios from "axios";
import { Radio as RadioIcon, PlayCircle, PauseCircle, Search, Activity } from "lucide-react";
import { AppContext } from "../App";

export default function Radio() {
  const { isDarkMode, lang } = useContext(AppContext);
  const isAr = lang === 'ar';

  const [radios, setRadios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeRadio, setActiveRadio] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const audioRef = useRef(null);

  const t = {
    title: isAr ? "إذاعات القرآن الكريم" : "Quran Radio",
    search: isAr ? "ابحث عن إذاعة أو قارئ..." : "Search for a radio or reciter...",
    loading: isAr ? "جاري تحميل الإذاعات..." : "Loading radios...",
    nowPlaying: isAr ? "يتم التشغيل الآن" : "Now Playing",
    noResult: isAr ? "لا توجد إذاعة بهذا الاسم" : "No radio found",
  };

  useEffect(() => {
    setLoading(true);
    axios.get(`https://mp3quran.net/api/v3/radios?language=${isAr ? 'ar' : 'eng'}`)
      .then((res) => {
        // ترتيب الإذاعات أبجدياً ليسهل البحث
        const sortedRadios = (res.data.radios || []).sort((a, b) => 
          a.name.localeCompare(b.name, isAr ? 'ar' : 'en')
        );
        setRadios(sortedRadios);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching radios:", err);
        setLoading(false);
      });
  }, [isAr]);

  const togglePlay = (radio) => {
    if (activeRadio?.id === radio.id) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    } else {
      setActiveRadio(radio);
      setIsPlaying(true);
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.src = radio.url;
          audioRef.current.play();
        }
      }, 0);
    }
  };

  const filteredRadios = radios.filter(r => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className={`flex justify-center items-center min-h-screen font-bold text-xl ${!isAr && 'font-sans'} ${isDarkMode ? 'text-[#E6B981]' : 'text-[#D4A373]'}`}>
        {t.loading}
      </div>
    );
  }

  return (
    <div className={`max-w-4xl mx-auto p-4 md:p-6 pt-20 ${activeRadio ? 'pb-36' : 'pb-24'}`} dir={isAr ? "rtl" : "ltr"}>
      <audio ref={audioRef} onEnded={() => setIsPlaying(false)} onError={() => setIsPlaying(false)} />

      <div className="flex items-center justify-center gap-3 mb-8 mt-4">
        <RadioIcon size={32} className={isDarkMode ? 'text-[#E6B981]' : 'text-[#D4A373]'} />
        <h2 className={`text-3xl font-bold ${isAr ? 'font-quran' : 'font-serif tracking-wide'} ${isDarkMode ? 'text-[#E6B981]' : 'text-[#D4A373]'}`}>
          {t.title}
        </h2>
      </div>

      <div className="relative mb-8 max-w-xl mx-auto">
        <input 
          type="text" 
          placeholder={t.search} 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)} 
          className={`w-full p-4 ${isAr ? 'pr-12' : 'pl-12'} rounded-2xl border focus:outline-none shadow-sm transition-colors ${!isAr && 'font-sans'} ${isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-200 focus:border-[#E6B981]' : 'bg-white border-[#F0EBE1] text-gray-700 focus:border-[#D4A373]'}`} 
        />
        <Search className={`absolute ${isAr ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-gray-400`} size={20} />
      </div>

      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredRadios.length > 0 ? (
          filteredRadios.map((radio) => {
            const isActive = activeRadio?.id === radio.id;
            return (
              <div 
                key={radio.id} 
                onClick={() => togglePlay(radio)}
                className={`flex items-center justify-between p-3 rounded-2xl shadow-sm border cursor-pointer transition-all duration-200 transform hover:scale-[1.01] ${
                  isActive 
                    ? (isDarkMode ? 'bg-gray-800 border-[#E6B981] shadow-[#E6B981]/10' : 'bg-[#FDFBF7] border-[#D4A373] shadow-[#D4A373]/10') 
                    : (isDarkMode ? 'bg-gray-800 border-gray-700 hover:border-[#E6B981]' : 'bg-white border-[#F0EBE1] hover:border-[#D4A373]')
                }`}
              >
                <div className={`flex items-center gap-3 w-full truncate ${!isAr && 'flex-row-reverse'}`}>
                  <button className={`w-10 h-10 shrink-0 flex items-center justify-center rounded-full transition-colors ${
                    isActive 
                      ? 'bg-[#D4A373] text-white shadow-md' 
                      : (isDarkMode ? 'bg-gray-900 text-[#E6B981]' : 'bg-[#FDFBF7] text-[#D4A373]')
                  }`}>
                    {isActive && isPlaying ? <PauseCircle size={20} /> : <PlayCircle size={20} />}
                  </button>
                  <h3 className={`font-bold text-sm md:text-base truncate w-full ${isAr ? 'text-right' : 'text-left font-sans'} ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    {radio.name}
                  </h3>
                </div>
                
                {isActive && isPlaying && (
                  <Activity size={18} className={`shrink-0 mx-2 animate-pulse ${isDarkMode ? 'text-[#E6B981]' : 'text-[#D4A373]'}`} />
                )}
              </div>
            );
          })
        ) : (
          <div className={`col-span-full text-center py-10 font-medium ${!isAr && 'font-sans'} text-gray-500`}>
            {t.noResult}
          </div>
        )}
      </div>

      {/* مشغل الراديو العائم */}
      {activeRadio && (
        <div className={`fixed bottom-[65px] left-0 w-full border-t shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-40 transition-colors ${
          isDarkMode ? "bg-gray-900 border-gray-800" : "bg-white border-[#F0EBE1]"
        }`}>
          <div className={`max-w-md mx-auto px-4 py-3 flex items-center justify-between ${!isAr && 'flex-row-reverse'}`}>
            <div className={`flex items-center gap-3 w-3/4 ${!isAr && 'flex-row-reverse'}`}>
              <div className="w-10 h-10 rounded-full bg-[#D4A373] flex items-center justify-center text-white shrink-0 shadow-md">
                <RadioIcon size={20} />
              </div>
              <div className={`overflow-hidden ${isAr ? 'text-right' : 'text-left'}`}>
                <p className={`text-[10px] font-bold uppercase ${isDarkMode ? 'text-[#E6B981]' : 'text-[#D4A373]'}`}>{t.nowPlaying}</p>
                <p className={`text-sm font-bold truncate ${isAr ? '' : 'font-sans'} ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{activeRadio.name}</p>
              </div>
            </div>
            
            <button 
              onClick={() => togglePlay(activeRadio)}
              className={`p-2 rounded-full border-2 transition-all ${
                isDarkMode ? 'border-[#E6B981] text-[#E6B981] hover:bg-[#E6B981] hover:text-gray-900' : 'border-[#D4A373] text-[#D4A373] hover:bg-[#D4A373] hover:text-white'
              }`}
            >
              {isPlaying ? <PauseCircle size={24} /> : <PlayCircle size={24} />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
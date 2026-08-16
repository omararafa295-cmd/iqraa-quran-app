import { createContext, useState, useEffect, useContext, useRef } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";
import { 
  BookOpen, Compass, Clock, Moon, Sun, SunMoon, 
  Radio as RadioIcon, Mic, Download, Info, Bookmark, 
  Trash2, X, ScrollText 
} from "lucide-react";
import SurahList from "./components/SurahList";
import SurahDetail from "./components/SurahDetail";
import JuzDetail from "./components/JuzDetail";
import PrayerTimes from "./components/PrayerTimes";
import Qibla from "./components/Qibla";
import Azkar from "./components/Azkar";
import Radio from "./components/Radio";
import Memorize from "./components/Memorize";
import DeveloperModal from './components/DeveloperModal';
import UpdateBanner from './components/UpdateBanner';
import { sendKhatmaReminderNotification } from './utils/notificationHelper';
import FloatingPlayer from "./components/FloatingPlayer";
import Hadith from "./components/Hadith";

export const AppContext = createContext();

const TopBar = () => {
  const { isDarkMode, setIsDarkMode, lang, setLang, bookmarks, setBookmarks } = useContext(AppContext);
  const isAr = lang === 'ar';
  const navigate = useNavigate();

  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBookmarkDrawerOpen, setIsBookmarkDrawerOpen] = useState(false);
  const dialogPushed = useRef(false);

  useEffect(() => {
    const handlePrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handlePrompt);
    return () => window.removeEventListener('beforeinstallprompt', handlePrompt);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  const deleteBookmark = (e, index) => {
    e.stopPropagation();
    const updated = bookmarks.filter((_, i) => i !== index);
    setBookmarks(updated);
    localStorage.setItem("quran_bookmarks", JSON.stringify(updated));
  };

  const handleNavigateToBookmark = (b) => {
    setIsBookmarkDrawerOpen(false);
    navigate(`/surah/${b.surahNumber}`, {
      state: { 
        targetPage: b.page !== undefined ? b.page : 0, 
        startAyah: b.ayahNumberInSurah 
      }
    });
  };

  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'ltr' : 'rtl';
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    if (window.location.hash === '#dialog') {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }, []);

  useEffect(() => {
    const isAnyModalOpen = isModalOpen || isBookmarkDrawerOpen;
    
    if (isAnyModalOpen) {
      if (window.location.hash !== '#dialog') {
        window.history.pushState(null, '', window.location.pathname + window.location.search + '#dialog');
        dialogPushed.current = true;
      }
    } else {
      if (window.location.hash === '#dialog' && dialogPushed.current) {
        window.history.back();
        dialogPushed.current = false;
      }
    }

    const handlePopState = () => {
      if (window.location.hash !== '#dialog') {
        setIsModalOpen(false);
        setIsBookmarkDrawerOpen(false);
        dialogPushed.current = false;
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isModalOpen, isBookmarkDrawerOpen]);

  return (
    <>
      <div className="w-full pt-2 md:pt-4 pb-2 px-4 md:px-6 relative z-30" dir={isAr ? "ltr" : "rtl"}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          
          <div className="flex items-center gap-2" dir="ltr">
            {deferredPrompt && (
              <button 
                onClick={handleInstall}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-full shadow-sm font-bold text-xs transition-colors ${
                  isDarkMode ? "bg-[#E5C158] text-gray-900 hover:bg-[#d6b047]" : "bg-[#D4AF37] text-white hover:bg-[#bf9b2e]"
                }`}
              >
                <Download size={15} />
                <span className="hidden sm:inline">{isAr ? 'تثبيت' : 'Install'}</span>
              </button>
            )}

            <button 
              onClick={() => setIsModalOpen(true)}
              className={`flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded-full shadow-sm transition-colors ${
                isDarkMode ? "bg-gray-800 text-[#E5C158] border border-gray-700 hover:bg-gray-700" : "bg-white text-[#D4AF37] border border-[#F0EBE1] hover:bg-gray-50"
              }`}
              title={isAr ? "معلومات المطور" : "Developer Info"}
            >
              <Info size={17} />
            </button>

            <button 
              onClick={() => setLang(isAr ? 'en' : 'ar')}
              className={`flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded-full shadow-sm font-bold text-xs transition-colors ${
                isDarkMode ? "bg-gray-800 text-[#E5C158] border border-gray-700 hover:bg-gray-700" : "bg-white text-[#D4AF37] border border-[#F0EBE1] hover:bg-gray-50"
              }`}
            >
              {isAr ? 'EN' : 'ع'}
            </button>
          
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded-full shadow-sm transition-colors ${
                isDarkMode ? "bg-gray-800 text-[#E5C158] border border-gray-700 hover:bg-gray-700" : "bg-white text-[#D4AF37] border border-[#F0EBE1] hover:bg-gray-50"
              }`}
              title={isAr ? "تبديل المظهر" : "Toggle Theme"}
            >
              {isDarkMode ? <Sun size={17} /> : <Moon size={17} />}
            </button>
          </div>

          <button
            onClick={() => setIsBookmarkDrawerOpen(true)}
            className={`relative flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded-full shadow-sm transition-all ${
              isDarkMode 
                ? "bg-gray-800 text-[#E5C158] border border-gray-700 hover:bg-gray-700" 
                : "bg-white text-[#D4AF37] border border-[#F0EBE1] hover:bg-gray-50"
            }`}
            title={isAr ? "العلامات المرجعية" : "Bookmarks"}
          >
            <Bookmark size={17} />
            {bookmarks.length > 0 && (
              <span className={`absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center shadow-sm animate-in zoom-in ${
                isDarkMode ? "bg-[#E5C158] text-gray-900" : "bg-[#D4AF37] text-white"
              }`}>
                {bookmarks.length}
              </span>
            )}
          </button>

        </div>
      </div>

      <DeveloperModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      {isBookmarkDrawerOpen && (
        <div 
          className="fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-sm transition-all duration-300"
          onClick={() => setIsBookmarkDrawerOpen(false)}
        >
          <div 
            className={`w-full max-w-sm h-full shadow-2xl border-l flex flex-col transform transition-all duration-300 animate-in slide-in-from-right ${
              isDarkMode 
                ? "bg-gray-900 border-gray-800 text-gray-100" 
                : "bg-white border-[#F0EBE1] text-gray-800"
            }`}
            onClick={(e) => e.stopPropagation()}
            dir={isAr ? "rtl" : "ltr"}
          >
            <div className={`p-4 flex items-center justify-between border-b ${
              isDarkMode ? "border-gray-800" : "border-gray-100"
            }`}>
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  isDarkMode ? "bg-[#E5C158]/20 text-[#E5C158]" : "bg-[#D4AF37]/20 text-[#D4AF37]"
                }`}>
                  <Bookmark size={18} />
                </div>
                <h3 className={`font-bold text-base md:text-lg ${
                  isDarkMode ? "text-[#E5C158]" : "text-[#D4AF37]"
                }`}>
                  {isAr ? "العلامات المرجعية" : "Bookmarks"} ({bookmarks.length})
                </h3>
              </div>

              <button
                onClick={() => setIsBookmarkDrawerOpen(false)}
                className="p-1.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {bookmarks.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 border border-dashed ${
                    isDarkMode ? "border-gray-700 bg-gray-800/50" : "border-gray-200 bg-gray-50"
                  }`}>
                    <Bookmark size={28} className="opacity-40" />
                  </div>
                  <h4 className="font-bold text-sm mb-1">
                    {isAr ? "لا توجد علامات مرجعية" : "No bookmarks saved"}
                  </h4>
                  <p className="text-xs text-gray-500 leading-relaxed max-w-[220px]">
                    {isAr ? "اضغط على أي آية أثناء القراءة لحفظها والرجوع إليها هنا" : "Tap on any Ayah while reading to save it here"}
                  </p>
                </div>
              ) : (
                bookmarks.map((b, index) => (
                  <div
                    key={index}
                    onClick={() => handleNavigateToBookmark(b)}
                    className={`p-3.5 rounded-2xl border shadow-sm cursor-pointer transition-all duration-200 hover:scale-[1.01] flex items-center justify-between ${
                      isDarkMode 
                        ? "bg-gray-800/80 border-gray-700/80 hover:border-[#E5C158]/60 hover:bg-gray-800" 
                        : "bg-white border-[#F0EBE1] hover:border-[#D4AF37]/60 hover:bg-[#FDFBF7]"
                    }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs font-quran ${
                        isDarkMode ? "bg-gray-900 text-[#E5C158]" : "bg-[#FDFBF7] text-[#D4AF37]"
                      }`}>
                        {b.ayahNumberInSurah}
                      </div>

                      <div className="flex flex-col truncate">
                        <span className={`font-bold text-sm truncate font-quran ${
                          isDarkMode ? "text-gray-100" : "text-gray-800"
                        }`}>
                          {isAr ? b.surahName : b.surahEnglishName}
                        </span>
                        <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-0.5">
                          <span>{isAr ? `الآية ${b.ayahNumberInSurah}` : `Ayah ${b.ayahNumberInSurah}`}</span>
                          <span>•</span>
                          <span>{isAr ? `صفحة ${b.page !== undefined ? b.page + 1 : 1}` : `Page ${b.page !== undefined ? b.page + 1 : 1}`}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={(e) => deleteBookmark(e, index)}
                      className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      title={isAr ? "حذف العلامة" : "Delete"}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>

          </div>
        </div>
      )}
    </>
  );
};

const BottomNav = () => {
  const location = useLocation();
  const { isDarkMode, lang } = useContext(AppContext);
  const isAr = lang === 'ar';
  
  if (location.pathname.includes('/surah/') || location.pathname.includes('/juz/')) return null;

  const activeColorClass = isDarkMode ? 'text-[#E5C158]' : 'text-[#D4AF37]';

  return (
    <div className={`fixed bottom-0 left-0 w-full border-t shadow-[0_-10px_30px_rgba(0,0,0,0.05)] z-50 rounded-t-3xl pb-safe transition-colors ${
      isDarkMode ? "bg-gray-900 border-gray-800" : "bg-white border-[#F0EBE1]"
    }`}>
      <div className="relative max-w-md mx-auto px-3 h-16 flex justify-between items-center" dir={isAr ? "rtl" : "ltr"}>
        
        <div className="flex w-[39%] justify-between items-center">
          <Link to="/hadith" className={`flex flex-col items-center gap-1 p-1 transition-colors ${location.pathname === '/hadith' ? activeColorClass : 'text-gray-400 hover:text-gray-500'}`}>
            <ScrollText size={20} />
            <span className={`text-[9px] font-bold ${!isAr && 'font-sans tracking-wide'}`}>{isAr ? 'الأحاديث' : 'Hadiths'}</span>
          </Link>
          <Link to="/azkar" className={`flex flex-col items-center gap-1 p-1 transition-colors ${location.pathname === '/azkar' ? activeColorClass : 'text-gray-400 hover:text-gray-500'}`}>
            <SunMoon size={20} />
            <span className={`text-[9px] font-bold ${!isAr && 'font-sans tracking-wide'}`}>{isAr ? 'الأذكار' : 'Azkar'}</span>
          </Link>
          <Link to="/radio" className={`flex flex-col items-center gap-1 p-1 transition-colors ${location.pathname === '/radio' ? activeColorClass : 'text-gray-400 hover:text-gray-500'}`}>
            <RadioIcon size={20} />
            <span className={`text-[9px] font-bold ${!isAr && 'font-sans tracking-wide'}`}>{isAr ? 'الراديو' : 'Radio'}</span>
          </Link>
        </div>

        <div className="absolute left-1/2 -translate-x-1/2 -top-8 z-50">
          <Link 
            to="/" 
            className={`flex flex-col items-center justify-center w-[74px] h-[74px] rounded-full border-[6px] shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 ${
              location.pathname === '/' 
                ? (isDarkMode ? 'bg-[#E5C158] border-gray-900 text-gray-900 shadow-[#E5C158]/20' : 'bg-[#D4AF37] border-white text-white shadow-[#D4AF37]/30')
                : (isDarkMode ? 'bg-gray-800 border-gray-900 text-gray-400 hover:text-[#E5C158]' : 'bg-[#FDFBF7] border-white text-gray-400 hover:text-[#D4AF37]')
            }`}
            title={isAr ? 'القرآن الكريم' : 'Quran'}
          >
            <BookOpen 
              size={24} 
              strokeWidth={location.pathname === '/' ? 2.5 : 2} 
              className={location.pathname === '/' ? "animate-pulse" : ""} 
            />
            <span className={`text-[10px] font-bold mt-1 ${!isAr && 'font-sans tracking-wide'}`}>
              {isAr ? 'القرآن' : 'Quran'}
            </span>
          </Link>
        </div>

        <div className="flex w-[39%] justify-between items-center">
          <Link to="/memorize" className={`flex flex-col items-center gap-1 p-1 transition-colors ${location.pathname === '/memorize' ? activeColorClass : 'text-gray-400 hover:text-gray-500'}`}>
            <Mic size={20} />
            <span className={`text-[9px] font-bold ${!isAr && 'font-sans tracking-wide'}`}>{isAr ? 'التسميع' : 'Memorize'}</span>
          </Link>
          <Link to="/prayer" className={`flex flex-col items-center gap-1 p-1 transition-colors ${location.pathname === '/prayer' ? activeColorClass : 'text-gray-400 hover:text-gray-500'}`}>
            <Clock size={20} />
            <span className={`text-[9px] font-bold ${!isAr && 'font-sans tracking-wide'}`}>{isAr ? 'المواقيت' : 'Prayers'}</span>
          </Link>
          <Link to="/qibla" className={`flex flex-col items-center gap-1 p-1 transition-colors ${location.pathname === '/qibla' ? activeColorClass : 'text-gray-400 hover:text-gray-500'}`}>
            <Compass size={20} />
            <span className={`text-[9px] font-bold ${!isAr && 'font-sans tracking-wide'}`}>{isAr ? 'القبلة' : 'Qibla'}</span>
          </Link>
        </div>

      </div>
    </div>
  );
};

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem("darkMode") === "true");
  const [lang, setLang] = useState("ar"); 
  const [currentAudio, setCurrentAudio] = useState(null); 
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRadioPlaying, setIsRadioPlaying] = useState(false);

  const [bookmarks, setBookmarks] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("quran_bookmarks") || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("darkMode", isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    const khatma = JSON.parse(localStorage.getItem('khatmaPlan'));
    if (khatma) {
      sendKhatmaReminderNotification(khatma, lang === 'ar');
    }
  }, [lang]);

  useEffect(() => {
    const handleAppInstalled = () => {
      alert(lang === 'ar' 
        ? 'تم تثبيت التطبيق بنجاح! 🎉\nتقدر تقفل المتصفح وتفتحه دلوقتي من الشاشة الرئيسية.' 
        : 'App installed successfully! 🎉\nYou can now open it from your home screen.');
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [lang]);
  
  return (
    <AppContext.Provider value={{ 
      isDarkMode, setIsDarkMode, 
      lang, setLang, 
      currentAudio, setCurrentAudio, 
      isPlaying, setIsPlaying, 
      isRadioPlaying, setIsRadioPlaying,
      bookmarks, setBookmarks
    }}>
      <div className={`min-h-screen font-sans pb-24 transition-colors duration-300 ${isDarkMode ? "bg-gray-900 text-white" : "bg-[#FFFdf9] text-gray-900"}`}>
        <Router>
          <UpdateBanner />
          <TopBar />
          <FloatingPlayer />
          <Routes>
            <Route path="/" element={<SurahList />} />
            <Route path="/surah/:id" element={<SurahDetail />} />
            <Route path="/juz/:id" element={<JuzDetail />} />
            <Route path="/prayer" element={<PrayerTimes />} />
            <Route path="/qibla" element={<Qibla />} />
            <Route path="/azkar" element={<Azkar />} />
            <Route path="/radio" element={<Radio />} />
            <Route path="/memorize" element={<Memorize />} />
            <Route path="/hadith" element={<Hadith />} />
          </Routes>
          <BottomNav />
        </Router>
      </div>
    </AppContext.Provider>
  );
}
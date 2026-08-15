import { createContext, useState, useEffect, useContext } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";
import { 
  BookOpen, Compass, Clock, Moon, Sun, SunMoon, 
  Radio as RadioIcon, Mic, Download, Info, Bookmark, 
  Trash2, X 
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

export const AppContext = createContext();

const TopBar = () => {
  const { isDarkMode, setIsDarkMode, lang, setLang, bookmarks, setBookmarks } = useContext(AppContext);
  const isAr = lang === 'ar';
  const navigate = useNavigate();

  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBookmarkDrawerOpen, setIsBookmarkDrawerOpen] = useState(false);

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

  return (
    <>
      <div className="w-full pt-4 pb-1 px-4 md:px-6 relative z-30">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          
          {/* الأزرار على اليسار */}
          <div className="flex items-center gap-2" dir="ltr">
            {deferredPrompt && (
              <button 
                onClick={handleInstall}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-full shadow-sm font-bold text-xs transition-colors ${
                  isDarkMode ? "bg-[#E6B981] text-gray-900 hover:bg-[#d6a575]" : "bg-[#D4A373] text-white hover:bg-[#c7915b]"
                }`}
              >
                <Download size={15} />
                <span className="hidden sm:inline">{isAr ? 'تثبيت' : 'Install'}</span>
              </button>
            )}

            <button 
              onClick={() => setIsModalOpen(true)}
              className={`flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded-full shadow-sm transition-colors ${
                isDarkMode ? "bg-gray-800 text-[#E6B981] border border-gray-700 hover:bg-gray-700" : "bg-white text-[#D4A373] border border-[#F0EBE1] hover:bg-gray-50"
              }`}
              title={isAr ? "معلومات المطور" : "Developer Info"}
            >
              <Info size={17} />
            </button>

            <button 
              onClick={() => setLang(isAr ? 'en' : 'ar')}
              className={`flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded-full shadow-sm font-bold text-xs transition-colors ${
                isDarkMode ? "bg-gray-800 text-[#E6B981] border border-gray-700 hover:bg-gray-700" : "bg-white text-[#D4A373] border border-[#F0EBE1] hover:bg-gray-50"
              }`}
            >
              {isAr ? 'EN' : 'ع'}
            </button>
          
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded-full shadow-sm transition-colors ${
                isDarkMode ? "bg-gray-800 text-[#E6B981] border border-gray-700 hover:bg-gray-700" : "bg-white text-[#D4A373] border border-[#F0EBE1] hover:bg-gray-50"
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
                ? "bg-gray-800 text-[#E6B981] border border-gray-700 hover:bg-gray-700" 
                : "bg-white text-[#D4A373] border border-[#F0EBE1] hover:bg-gray-50"
            }`}
            title={isAr ? "العلامات المرجعية" : "Bookmarks"}
          >
            <Bookmark size={17} />
            {bookmarks.length > 0 && (
              <span className={`absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center shadow-sm animate-in zoom-in ${
                isDarkMode ? "bg-[#E6B981] text-gray-900" : "bg-[#D4A373] text-white"
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
                  isDarkMode ? "bg-[#E6B981]/20 text-[#E6B981]" : "bg-[#D4A373]/20 text-[#D4A373]"
                }`}>
                  <Bookmark size={18} />
                </div>
                <h3 className={`font-bold text-base md:text-lg ${
                  isDarkMode ? "text-[#E6B981]" : "text-[#D4A373]"
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
                        ? "bg-gray-800/80 border-gray-700/80 hover:border-[#E6B981]/60 hover:bg-gray-800" 
                        : "bg-white border-[#F0EBE1] hover:border-[#D4A373]/60 hover:bg-[#FDFBF7]"
                    }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs font-quran ${
                        isDarkMode ? "bg-gray-900 text-[#E6B981]" : "bg-[#FDFBF7] text-[#D4A373]"
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

  return (
    <div className={`fixed bottom-0 left-0 w-full border-t shadow-[0_-4px_20px_rgba(0,0,0,0.02)] z-50 rounded-t-3xl pb-safe transition-colors ${
      isDarkMode ? "bg-gray-900 border-gray-800" : "bg-white border-[#F0EBE1]"
    }`}>
      <div className="flex justify-between items-center p-1.5 max-w-md mx-auto px-2" dir={isAr ? "rtl" : "ltr"}>
        <Link to="/" className={`flex flex-col items-center gap-1 p-1 transition-colors ${location.pathname === '/' ? 'text-[#D4A373]' : 'text-gray-400'}`}>
          <BookOpen size={20} />
          <span className={`text-[9px] font-bold ${!isAr && 'font-sans tracking-wide'}`}>{isAr ? 'القرآن' : 'Quran'}</span>
        </Link>
        <Link to="/radio" className={`flex flex-col items-center gap-1 p-1 transition-colors ${location.pathname === '/radio' ? 'text-[#D4A373]' : 'text-gray-400'}`}>
          <RadioIcon size={20} />
          <span className={`text-[9px] font-bold ${!isAr && 'font-sans tracking-wide'}`}>{isAr ? 'الراديو' : 'Radio'}</span>
        </Link>
        <Link to="/memorize" className={`flex flex-col items-center gap-1 p-1 transition-colors ${location.pathname === '/memorize' ? 'text-[#D4A373]' : 'text-gray-400'}`}>
          <Mic size={20} />
          <span className={`text-[9px] font-bold ${!isAr && 'font-sans tracking-wide'}`}>{isAr ? 'التسميع' : 'Memorize'}</span>
        </Link>
        <Link to="/azkar" className={`flex flex-col items-center gap-1 p-1 transition-colors ${location.pathname === '/azkar' ? 'text-[#D4A373]' : 'text-gray-400'}`}>
          <SunMoon size={20} />
          <span className={`text-[9px] font-bold ${!isAr && 'font-sans tracking-wide'}`}>{isAr ? 'الأذكار' : 'Azkar'}</span>
        </Link>
        <Link to="/prayer" className={`flex flex-col items-center gap-1 p-1 transition-colors ${location.pathname === '/prayer' ? 'text-[#D4A373]' : 'text-gray-400'}`}>
          <Clock size={20} />
          <span className={`text-[9px] font-bold ${!isAr && 'font-sans tracking-wide'}`}>{isAr ? 'المواقيت' : 'Prayers'}</span>
        </Link>
        <Link to="/qibla" className={`flex flex-col items-center gap-1 p-1 transition-colors ${location.pathname === '/qibla' ? 'text-[#D4A373]' : 'text-gray-400'}`}>
          <Compass size={20} />
          <span className={`text-[9px] font-bold ${!isAr && 'font-sans tracking-wide'}`}>{isAr ? 'القبلة' : 'Qibla'}</span>
        </Link>
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
          </Routes>
          <BottomNav />
        </Router>
      </div>
    </AppContext.Provider>
  );
}
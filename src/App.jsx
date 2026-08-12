import { createContext, useState, useEffect, useContext } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
import { BookOpen, Compass, Clock, Moon, Sun, SunMoon, Radio as RadioIcon, Mic, Download, Info } from "lucide-react";
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

export function Header() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button 
        onClick={() => setIsModalOpen(true)}
        className="p-2 rounded-full transition-colors bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:text-[#D4A373]"
        title="معلومات المطور"
      >
        <Info size={20} />
      </button>

      <DeveloperModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}

export const AppContext = createContext();

const TopBar = () => {
  const { isDarkMode, setIsDarkMode, lang, setLang } = useContext(AppContext);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isAr = lang === 'ar';

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
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

  return (
    <div className={`absolute top-4 ${isAr ? 'left-4' : 'right-4'} z-50 flex items-center gap-3 transition-all`} dir="ltr">
      
      {deferredPrompt && (
        <button 
          onClick={handleInstall}
          className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-md font-bold text-xs transition-colors ${
            isDarkMode ? "bg-[#E6B981] text-gray-900 hover:bg-[#d6a575]" : "bg-[#D4A373] text-white hover:bg-[#c7915b]"
          }`}
        >
          <Download size={16} />
          <span className="hidden md:inline">{isAr ? 'تثبيت التطبيق' : 'Install App'}</span>
        </button>
      )}

      <button 
        onClick={() => setIsModalOpen(true)}
        className={`flex items-center justify-center w-10 h-10 rounded-full shadow-md transition-colors ${
          isDarkMode ? "bg-gray-800 text-[#E6B981] border border-gray-700 hover:bg-gray-700" : "bg-white text-[#D4A373] border border-[#F0EBE1] hover:bg-gray-50"
        }`}
        title="معلومات المطور"
      >
        <Info size={20} />
      </button>

      <button 
        onClick={() => setLang(isAr ? 'en' : 'ar')}
        className={`flex items-center justify-center w-10 h-10 rounded-full shadow-md font-bold text-sm transition-colors ${
          isDarkMode ? "bg-gray-800 text-[#E6B981] border border-gray-700 hover:bg-gray-700" : "bg-white text-[#D4A373] border border-[#F0EBE1] hover:bg-gray-50"
        }`}
      >
        {isAr ? 'EN' : 'ع'}
      </button>
    
      <button 
        onClick={() => setIsDarkMode(!isDarkMode)}
        className={`flex items-center justify-center w-10 h-10 rounded-full shadow-md transition-colors ${
          isDarkMode ? "bg-gray-800 text-[#E6B981] border border-gray-700 hover:bg-gray-700" : "bg-white text-[#D4A373] border border-[#F0EBE1] hover:bg-gray-50"
        }`}
      >
        {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      <DeveloperModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
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
    <AppContext.Provider value={{ isDarkMode, setIsDarkMode, lang, setLang }}>
      <div className={`min-h-screen font-sans pb-24 transition-colors duration-300 ${isDarkMode ? "bg-gray-900 text-white" : "bg-[#FFFdf9] text-gray-900"}`}>
        <Router>
          <UpdateBanner />
          <TopBar />
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
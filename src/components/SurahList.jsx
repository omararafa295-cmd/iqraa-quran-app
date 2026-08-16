import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { Search, BookOpen, Layers, ArrowLeft, Loader2, Sparkles, Target, CheckCircle, Plus, Trash2, Calendar, AlertTriangle, CloudDownload, RefreshCw } from "lucide-react";
import { AppContext } from "../App";
import { requestNotificationPermission } from '../utils/notificationHelper';

const juzData = Array.from({ length: 30 }, (_, i) => ({
  id: i + 1,
  nameAr: ["الأول", "الثاني", "الثالث", "الرابع", "الخامس", "السادس", "السابع", "الثامن", "التاسع", "العاشر", "الحادي عشر", "الثاني عشر", "الثالث عشر", "الرابع عشر", "الخامس عشر", "السادس عشر", "السابع عشر", "الثامن عشر", "التاسع عشر", "العشرون", "الحادي والعشرون", "الثاني والعشرون", "الثالث والعشرون", "الرابع والعشرون", "الخامس والعشرون", "السادس والعشرون", "السابع والعشرون", "الثامن والعشرون", "التاسع والعشرون", "الثلاثون"][i],
  nameEn: ["First", "Second", "Third", "Fourth", "Fifth", "Sixth", "Seventh", "Eighth", "Ninth", "Tenth", "Eleventh", "Twelfth", "Thirteenth", "Fourteenth", "Fifteenth", "Sixteenth", "Seventeenth", "Eighteenth", "Nineteenth", "Twentieth", "Twenty-First", "Twenty-Second", "Twenty-Third", "Twenty-Fourth", "Twenty-Fifth", "Twenty-Sixth", "Twenty-Seventh", "Twenty-Eighth", "Twenty-Ninth", "Thirtieth"][i],
  hizbStart: (i * 2) + 1,
  hizbEnd: (i * 2) + 2
}));

export default function SurahList() {
  const { isDarkMode, lang } = useContext(AppContext);
  const isAr = lang === 'ar';
  const navigate = useNavigate();

  const [surahs, setSurahs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("surahs");
  const [searchQuery, setSearchQuery] = useState("");
  const [lastRead, setLastRead] = useState(null);

  const [khatma, setKhatma] = useState(() => JSON.parse(localStorage.getItem('khatmaPlan')) || null);
  const [showKhatmaModal, setShowKhatmaModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [khatmaDays, setKhatmaDays] = useState(30);

  const [isDownloadingQuran, setIsDownloadingQuran] = useState(false);
  const [quranProgress, setQuranProgress] = useState(0);
  const [isQuranDownloaded, setIsQuranDownloaded] = useState(false);

  // ✅ روابط الصور لدعم وضع الأوفلاين 100%
  const [heroImgSrc, setHeroImgSrc] = useState("/images/golden-quran.webp");
  const [mosqueBgSrc, setMosqueBgSrc] = useState("/images/mosque-bg.jpg");

  useEffect(() => {
    const cacheAndLoadImage = async (url, setter) => {
      if ('caches' in window) {
        try {
          const cache = await caches.open('quran-assets-cache');
          let res = await cache.match(url);
          
          if (!res && navigator.onLine) {
            await cache.add(url);
            res = await cache.match(url);
          }
          
          if (res) {
            const blob = await res.blob();
            setter(URL.createObjectURL(blob));
          }
        } catch (e) {
          console.log("Image caching error:", e);
        }
      }
    };

    cacheAndLoadImage("/images/golden-quran.webp", setHeroImgSrc);
    cacheAndLoadImage("/images/mosque-bg.jpg", setMosqueBgSrc);
  }, []);

  useEffect(() => {
    const savedLastRead = localStorage.getItem("lastRead");
    if (savedLastRead) setLastRead(JSON.parse(savedLastRead));
    
    setIsQuranDownloaded(localStorage.getItem(`full_quran_text_downloaded_${isAr}`) === 'true');

    setLoading(true);
    setError(null);

    axios.get("https://api.alquran.cloud/v1/surah", { timeout: 10000 })
      .then((response) => {
        setSurahs(response.data.data || []);
        localStorage.setItem('offline_surahs_list', JSON.stringify(response.data.data));
        setLoading(false);
      })
      .catch((err) => {
        const offlineList = localStorage.getItem('offline_surahs_list');
        if (offlineList) {
          setSurahs(JSON.parse(offlineList));
        } else {
          setSurahs([]);
          setError(isAr ? "تعذر تحميل قائمة السور. تأكد من الإنترنت." : "Failed to load Surahs.");
        }
        setLoading(false);
      });
  }, [isAr]);

  const normalizeSearch = (text) => {
    if (!text) return "";
    return String(text)
      .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u06DF-\u06E8\u0640]/g, "") 
      .replace(/[أإآاٱ]/g, "ا") 
      .replace(/ة/g, "ه") 
      .replace(/ى/g, "ي") 
      .replace(/ئ/g, "ي") 
      .replace(/ء/g, "") 
      .replace(/^سوره\s+/, "") 
      .replace(/^سورة\s+/, "")
      .trim()
      .toLowerCase();
  };

  const filteredSurahs = (surahs || []).filter(surah => {
    if (!surah) return false;
    const normalizedQuery = normalizeSearch(searchQuery);
    const normalizedName = normalizeSearch(surah.name || "");
    const engName = surah.englishName || "";
    return normalizedName.includes(normalizedQuery) || 
           engName.toLowerCase().includes((searchQuery || "").toLowerCase());
  });

  const startKhatma = async () => {
    const plan = {
      days: khatmaDays,
      pagesPerDay: Math.ceil(604 / khatmaDays),
      pagesRead: 0,
      startDate: new Date().toISOString()
    };
    setKhatma(plan);
    localStorage.setItem('khatmaPlan', JSON.stringify(plan));
    setShowKhatmaModal(false);
    await requestNotificationPermission();
  };

  const addPages = (num) => {
    setKhatma(prev => {
      if(!prev) return prev;
      const updated = { ...prev, pagesRead: Math.min(604, prev.pagesRead + num) };
      localStorage.setItem('khatmaPlan', JSON.stringify(updated));
      return updated;
    });
  };

  const deleteKhatma = () => setShowDeleteConfirm(true);
  
  const confirmDeleteKhatma = () => {
    setKhatma(null);
    localStorage.removeItem('khatmaPlan');
    setShowDeleteConfirm(false);
  };

  const downloadFullQuranText = async () => {
    setIsDownloadingQuran(true);
    setQuranProgress(0);
    
    await new Promise(resolve => setTimeout(resolve, 50));

    try {
      const mainEd = isAr ? "quran-simple" : "en.sahih";
      const modalEd = isAr ? "ar.muyassar" : "quran-simple";

      const [mainRes, modalRes] = await Promise.all([
        axios.get(`https://api.alquran.cloud/v1/quran/${mainEd}`),
        axios.get(`https://api.alquran.cloud/v1/quran/${modalEd}`)
      ]);

      const mainSurahs = mainRes.data.data.surahs;
      const modalSurahs = modalRes.data.data.surahs;
      const cache = await caches.open('quran-text-cache-v1');

      for(let i = 0; i < 114; i++) {
        const surahId = i + 1;
        const mainUrl = `https://api.alquran.cloud/v1/surah/${surahId}${isAr ? "" : "/en.sahih"}`;
        const modalUrl = `https://api.alquran.cloud/v1/surah/${surahId}${isAr ? "/ar.muyassar" : "/quran-simple"}`;

        const mainResponse = new Response(JSON.stringify({ code: 200, status: "OK", data: mainSurahs[i] }), { headers: { 'Content-Type': 'application/json' } });
        const modalResponse = new Response(JSON.stringify({ code: 200, status: "OK", data: modalSurahs[i] }), { headers: { 'Content-Type': 'application/json' } });

        await cache.put(mainUrl, mainResponse);
        await cache.put(modalUrl, modalResponse);

        if (i % 2 === 0 || i === 113) { 
           setQuranProgress(Math.round(((i + 1) / 114) * 100));
           await new Promise(resolve => setTimeout(resolve, 10)); 
        }
      }
      localStorage.setItem(`full_quran_text_downloaded_${isAr}`, 'true');
      setIsQuranDownloaded(true);
    } catch (e) {
       console.error(e);
       alert(isAr ? "حدث خطأ أثناء تحميل المصحف." : "Error downloading Quran.");
    } finally {
       setIsDownloadingQuran(false);
    }
  };

  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsAppInstalled(true);
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setIsAppInstalled(true);
      }
    }
  };

  const t = {
    search: isAr ? "ابحث عن سورة..." : "Search for a Surah...",
    surahs: isAr ? "السور" : "Surahs",
    ajzaa: isAr ? "الأجزاء" : "Juzs",
    noResult: isAr ? "لا توجد سورة بهذا الاسم..." : "No Surah found...",
    continue: isAr ? "متابعة القراءة" : "Continue Reading",
    khatmaTitle: isAr ? "خطة الختمة" : "Khatma Plan",
    createPlan: isAr ? "ابدأ خطة جديدة" : "Start New Plan",
    dailyGoal: isAr ? "الورد" : "Goal",
    pages: isAr ? "ص" : "Pg",
    quranDownloadTitle: isAr ? "المصحف كاملاً" : "Full Quran",
    quranDownloadDesc: isAr ? "حمل المصحف للقراءة بدون نت (~6MB)" : "Download text for offline (~6MB)",
    downloadNow: isAr ? "تنزيل" : "Download",
    downloading: isAr ? "جاري" : "Loading",
    downloaded: isAr ? "تم التنزيل" : "Saved"
  };

  const safePagesRead = khatma?.pagesRead || 0;
  const percentage = khatma ? Math.round((safePagesRead / 604) * 100) : 0;
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
<div className="max-w-6xl mx-auto p-4 md:p-6 pt-2 md:pt-4 pb-32" dir={isAr ? "rtl" : "ltr"}>
      
      <div className={`relative overflow-hidden rounded-[3rem] mb-8 shadow-2xl transition-all duration-500 ${
        isDarkMode 
          ? 'bg-gradient-to-b from-gray-950 via-[#18120c] to-gray-950 border border-gray-800' 
          : 'bg-gradient-to-b from-[#E8C766] via-[#D4AF37] to-[#B8942E]'
      }`}>

        <div 
          className={`absolute inset-0 bg-center bg-cover bg-no-repeat pointer-events-none transition-all duration-500 ${
            isDarkMode 
              ? 'opacity-35 mix-blend-screen brightness-125 contrast-110' 
              : 'opacity-20 mix-blend-overlay'
          }`}
          style={{ backgroundImage: `url('${mosqueBgSrc}')` }}
        ></div>
        <div className={`absolute top-1/3 left-1/2 -translate-x-1/2 w-48 h-48 md:w-64 md:h-64 rounded-full blur-[90px] pointer-events-none ${
          isDarkMode ? 'bg-[#E5C158]/25' : 'bg-white/40'
        }`}></div>

        <div className="relative z-10 p-6 md:p-10 flex flex-col items-center text-center">
          
          <img 
            src={heroImgSrc} 
            alt="القرآن الكريم" 
            fetchPriority="high" 
            loading="eager"
            className="w-48 sm:w-56 md:w-72 lg:w-80 h-auto max-h-[220px] md:max-h-[300px] object-contain animate-quran-hero cursor-pointer transition-transform duration-300 hover:scale-105 drop-shadow-[0_10px_25px_rgba(230,185,129,0.5)]"
          />

          <h1 className={`text-4xl md:text-5xl font-quran mb-6 leading-normal drop-shadow-xl ${isDarkMode ? 'text-[#E5C158]' : 'text-white'}`}>
            {isAr ? 'القرآن الكريم' : 'The Noble Quran'}
          </h1>

          <div className={`relative px-5 py-3 md:py-4 rounded-3xl backdrop-blur-sm mb-6 border shadow-lg max-w-xl ${
            isDarkMode ? 'bg-black/40 border-[#E5C158]/20' : 'bg-white/15 border-white/30'
          }`}>
            <p className={`text-sm md:text-lg font-medium leading-loose ${isDarkMode ? 'text-[#f4e6d3]' : 'text-white'}`}>
              « كِتَابٌ أَنزَلْنَاهُ إِلَيْكَ مُبَارَكٌ لِّيَدَّبَّرُوا آيَاتِهِ وَلِيَتَذَكَّرَ أُولُو الْأَلْبَابِ »
            </p>
          </div>

          {lastRead && (
            <Link 
              to={`/surah/${lastRead.id || 1}`} 
              state={{ targetPage: lastRead.page !== undefined ? lastRead.page : 0 }}
              className={`group relative overflow-hidden inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-xs md:text-sm transition-all transform hover:scale-105 shadow-xl ${
                isDarkMode ? 'bg-[#E5C158] text-gray-900' : 'bg-white text-[#D4AF37]'
              }`}
            >
              <Sparkles size={16} className="animate-pulse" />
              <span>
                {isAr 
                  ? `متابعة القراءة: سورة ${(lastRead.name || "").replace('سُورَةُ ', '')}` 
                  : `Continue: Surah ${lastRead.englishName || lastRead.name || "..."}`}
              </span>
              {isAr ? <ArrowLeft size={16} /> : <ArrowLeft size={16} className="rotate-180" />}
            </Link>
          )}
        </div>
      </div>

      {!isAppInstalled && deferredPrompt && (
        <div className={`max-w-2xl mx-auto mb-6 p-4 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm border ${
          isDarkMode ? 'bg-gradient-to-r from-gray-800 to-gray-900 border-[#E5C158]/30' : 'bg-gradient-to-r from-[#FDFBF7] to-white border-[#D4AF37]/30'
        }`}>
          <div className="flex items-center gap-4 text-center md:text-start">
            <img src="/icon-192.png" alt="App Icon" className="w-14 h-14 rounded-2xl shadow-sm hidden sm:block" />
            <div className="flex flex-col">
              <h3 className={`font-bold text-base md:text-lg mb-1 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                {isAr ? 'تثبيت تطبيق اقرأ' : 'Install Iqraa App'}
              </h3>
              <p className={`text-[11px] md:text-xs font-medium leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {isAr ? 'قم بتثبيت التطبيق على هاتفك ليعمل بدون إنترنت كبرنامج أساسي.' : 'Install the app on your phone to work offline as a native app.'}
              </p>
            </div>
          </div>
          <button 
            onClick={handleInstallApp}
            className={`w-full md:w-auto shrink-0 px-6 py-3 rounded-xl font-bold text-xs md:text-sm transition-all shadow-md ${
              isDarkMode ? 'bg-[#E5C158] text-gray-900 hover:bg-[#D4AF37]' : 'bg-[#D4AF37] text-white hover:bg-[#B8942E]'
            }`}
          >
            {isAr ? 'تثبيت التطبيق' : 'Install App'}
          </button>
        </div>
      )}

      <div className="max-w-2xl mx-auto mb-8 grid grid-cols-2 gap-3 md:gap-4">
    
        <div className={`flex flex-col p-4 md:p-5 rounded-[2rem] shadow-sm border transition-all h-full relative overflow-hidden ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#F0EBE1]'}`}>
          {!khatma ? (
            <div className="flex flex-col items-center text-center h-full justify-between gap-2">
              <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center shrink-0 mb-1 ${isDarkMode ? 'bg-gray-700 text-[#E5C158]' : 'bg-[#FDFBF7] text-[#D4AF37]'}`}>
                <Target size={22} />
              </div>
              <div>
                <h3 className={`font-bold text-sm md:text-base font-quran mb-1 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{t.khatmaTitle}</h3>
                <p className={`text-[10px] md:text-xs font-medium leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {isAr ? 'نظم قراءتك واختم في مدة محددة' : 'Set a goal to finish the Quran'}
                </p>
              </div>
              <button 
                onClick={() => setShowKhatmaModal(true)}
                className={`w-full py-2.5 mt-2 rounded-xl font-bold text-xs md:text-sm transition-all shadow-md hover:shadow-lg ${isDarkMode ? 'bg-[#E5C158] text-gray-900' : 'bg-[#D4AF37] text-white'}`}
              >
                {t.createPlan}
              </button>
            </div>
          ) : (
            <div className="flex flex-col h-full justify-between">
              <button onClick={deleteKhatma} className={`absolute top-3 ${isAr ? 'left-3' : 'right-3'} z-10 text-gray-400 hover:text-red-500 p-1.5 bg-red-50/0 hover:bg-red-50 rounded-lg transition-colors`}>
                <Trash2 size={16} />
              </button>
              
              <div className="flex items-center gap-2 mb-2">
                <div className="relative w-12 h-12 md:w-14 md:h-14 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90 drop-shadow-sm" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r={radius} stroke="currentColor" strokeWidth="8" fill="none" className={isDarkMode ? "text-gray-700" : "text-gray-100"} />
                    <circle cx="50" cy="50" r={radius} stroke="currentColor" strokeWidth="8" fill="none" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} className={`transition-all duration-1000 ease-out ${isDarkMode ? "text-[#E5C158]" : "text-[#D4AF37]"}`} />
                  </svg>
                  <span className={`absolute inset-0 flex items-center justify-center text-[10px] md:text-xs font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>{percentage}%</span>
                </div>
                <div className={`flex flex-col ${isAr ? 'text-right' : 'text-left'}`}>
                  <h3 className={`font-bold text-xs md:text-sm font-quran mb-1 ${isDarkMode ? 'text-[#E5C158]' : 'text-[#D4AF37]'}`}>{t.khatmaTitle}</h3>
                  <span className={`text-[9px] md:text-[11px] font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t.dailyGoal}: {khatma.pagesPerDay} {t.pages}</span>
                </div>
              </div>

              <div className={`flex justify-between text-[9px] md:text-[11px] font-bold mb-3 pb-2 border-b ${isDarkMode ? 'text-gray-300 border-gray-700' : 'text-gray-600 border-gray-100'}`}>
                <span>{isAr ? 'قرأت:' : 'Read:'} <span className={isDarkMode ? 'text-white' : 'text-black'}>{safePagesRead}</span></span>
                <span>{isAr ? 'متبقي:' : 'Left:'} <span className={isDarkMode ? 'text-white' : 'text-black'}>{604 - safePagesRead}</span></span>
              </div>

              {safePagesRead < 604 ? (
                <div className="flex gap-1.5 w-full mt-auto">
                  <button onClick={() => addPages(khatma.pagesPerDay)} className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl font-bold text-[10px] md:text-xs transition-all shadow-sm ${isDarkMode ? 'bg-[#E5C158] text-gray-900 hover:bg-[#D4AF37]' : 'bg-[#D4AF37] text-white hover:bg-[#B8942E]'}`}>
                    <CheckCircle size={14} /> {isAr ? 'ورد اليوم' : 'Done'}
                  </button>
                  <button onClick={() => addPages(1)} className={`px-2.5 py-2 rounded-xl font-bold text-[10px] md:text-xs transition-colors border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                    +1
                  </button>
                </div>
              ) : (
                <div className={`text-center py-2 text-[10px] md:text-xs font-bold rounded-xl w-full mt-auto ${isDarkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-50 text-green-600'}`}>
                  {isAr ? 'اكتملت الختمة 🎉' : 'Completed 🎉'}
                </div>
              )}
            </div>
          )}
        </div>

        <div className={`flex flex-col p-4 md:p-5 rounded-[2rem] shadow-sm border transition-all h-full justify-between items-center text-center ${isDarkMode ? 'bg-gray-800 border-[#E5C158]/30' : 'bg-[#FDFBF7] border-[#D4AF37]/30'}`}>
          <div className="flex flex-col items-center gap-2 mb-3 mt-1">
            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center shrink-0 mb-1 ${isDarkMode ? 'bg-gray-700 text-[#E5C158]' : 'bg-white text-[#D4AF37] shadow-sm'}`}>
              <CloudDownload size={22} />
            </div>
            <h3 className={`font-bold text-sm md:text-base ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{t.quranDownloadTitle}</h3>
            <p className={`text-[10px] md:text-[11px] font-medium leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {t.quranDownloadDesc}
            </p>
          </div>
          
          <div className="w-full mt-auto">
            {isQuranDownloaded ? (
              <span className={`flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl font-bold text-[11px] md:text-xs bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400`}>
                <CheckCircle size={16} /> {t.downloaded}
              </span>
            ) : isDownloadingQuran ? (
              <span className={`flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl font-bold text-[11px] md:text-xs border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-[#E5C158]' : 'bg-white border-[#F0EBE1] text-[#D4AF37]'}`}>
                <RefreshCw size={14} className="animate-spin" /> {t.downloading} {quranProgress}%
              </span>
            ) : (
              <button 
                onClick={downloadFullQuranText}
                className={`w-full py-2.5 rounded-xl font-bold text-[11px] md:text-xs transition-colors shadow-sm ${isDarkMode ? 'bg-[#E5C158] text-gray-900 hover:bg-[#D4AF37]' : 'bg-[#D4AF37] text-white hover:bg-[#B8942E]'}`}
              >
                {t.downloadNow}
              </button>
            )}
          </div>
        </div>

      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)}>
          <div className={`w-full max-w-sm p-6 rounded-[2rem] shadow-2xl transform transition-all ${isDarkMode ? "bg-gray-800 border border-gray-700" : "bg-white"}`} onClick={e => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isDarkMode ? "bg-red-500/20 text-red-400" : "bg-red-50 text-red-500"}`}>
                <AlertTriangle size={32} />
              </div>
              <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? "text-gray-100" : "text-gray-800"}`}>
                {isAr ? 'إلغاء الخطة' : 'Cancel Plan'}
              </h3>
              <p className={`text-sm font-medium mb-8 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                {isAr ? 'هل أنت متأكد من إلغاء خطة الختمة الحالية؟ سيتم مسح تقدمك الحالي ولن يمكنك التراجع.' : 'Are you sure you want to cancel the current plan? Your progress will be lost.'}
              </p>
              <div className="flex w-full gap-3">
                <button onClick={() => setShowDeleteConfirm(false)} className={`flex-1 py-3 rounded-xl font-bold transition-colors ${isDarkMode ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                  {isAr ? 'تراجع' : 'Cancel'}
                </button>
                <button onClick={confirmDeleteKhatma} className="flex-1 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-colors shadow-md">
                  {isAr ? 'نعم، إلغاء' : 'Yes, Cancel'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showKhatmaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowKhatmaModal(false)}>
          <div 
            className={`w-full max-w-sm p-6 rounded-[2rem] shadow-2xl transform transition-all ${isDarkMode ? "bg-gray-800 border border-gray-700" : "bg-white"}`} 
            onClick={e => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isDarkMode ? 'bg-gray-700 text-[#E5C158]' : 'bg-[#FDFBF7] text-[#D4AF37]'}`}>
                <Calendar size={32} />
              </div>
              <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? "text-gray-100" : "text-gray-800"}`}>
                {isAr ? 'تحديد مدة الختمة' : 'Set Khatma Duration'}
              </h3>
              <p className={`text-sm font-medium mb-6 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                {isAr ? 'في كم يوم تريد أن تختم القرآن؟' : 'In how many days do you want to finish?'}
              </p>
              
              <div className="flex w-full gap-2 mb-6">
                {[15, 30, 60].map(days => (
                  <button 
                    key={days}
                    onClick={() => setKhatmaDays(days)}
                    className={`flex-1 py-2 rounded-xl font-bold text-sm transition-colors border ${
                      khatmaDays === days 
                        ? (isDarkMode ? 'bg-[#E5C158] text-gray-900 border-[#E5C158]' : 'bg-[#D4AF37] text-white border-[#D4AF37]') 
                        : (isDarkMode ? 'bg-gray-700 text-gray-300 border-gray-600' : 'bg-gray-50 text-gray-600 border-gray-200')
                    }`}
                  >
                    {days} {isAr ? 'يوم' : 'Days'}
                  </button>
                ))}
              </div>

              <div className="w-full relative mb-8">
                <input 
                  type="number" 
                  min="1" 
                  max="1000"
                  value={khatmaDays}
                  onChange={(e) => setKhatmaDays(parseInt(e.target.value) || 30)}
                  className={`w-full p-4 text-center rounded-xl font-bold text-xl border focus:outline-none transition-colors ${
                    isDarkMode ? 'bg-gray-900 border-gray-700 text-white focus:border-[#E5C158]' : 'bg-white border-gray-200 text-gray-800 focus:border-[#D4AF37]'
                  }`}
                  dir="ltr"
                />
              </div>
              
              <button 
                onClick={startKhatma}
                className={`w-full py-4 rounded-xl font-bold transition-all shadow-md hover:shadow-lg ${
                  isDarkMode ? 'bg-[#E5C158] text-gray-900' : 'bg-[#D4AF37] text-white'
                }`}
              >
                {isAr ? 'توكلنا على الله' : 'Start Plan'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="relative mb-8 max-w-2xl mx-auto">
        <input 
          type="text" 
          placeholder={t.search} 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)} 
          className={`w-full p-4 ${isAr ? 'pr-14' : 'pl-14'} rounded-2xl border focus:outline-none shadow-sm transition-colors font-medium text-lg ${
            isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-200 focus:border-[#E5C158]' : 'bg-white border-[#F0EBE1] text-gray-700 focus:border-[#D4AF37]'
          }`} 
        />
        <Search className={`absolute ${isAr ? 'right-5' : 'left-5'} top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} size={22} />
      </div>

      <div className={`flex max-w-md mx-auto p-1.5 rounded-2xl mb-10 shadow-sm ${isDarkMode ? 'bg-gray-800' : 'bg-[#F0EBE1]/50'}`}>
        <button 
          onClick={() => setActiveTab("surahs")} 
          className={`flex-1 flex justify-center items-center gap-2 py-3.5 rounded-xl font-bold transition-all text-sm md:text-base ${
            activeTab === "surahs" 
              ? (isDarkMode ? "bg-gray-700 text-[#E5C158] shadow-md" : "bg-white text-[#D4AF37] shadow-md") 
              : "text-gray-500 hover:text-gray-400"
          }`}
        >
          <BookOpen size={20} /> {t.surahs}
        </button>
        <button 
          onClick={() => setActiveTab("ajzaa")} 
          className={`flex-1 flex justify-center items-center gap-2 py-3.5 rounded-xl font-bold transition-all text-sm md:text-base ${
            activeTab === "ajzaa" 
              ? (isDarkMode ? "bg-gray-700 text-[#E5C158] shadow-md" : "bg-white text-[#D4AF37] shadow-md") 
              : "text-gray-500 hover:text-gray-400"
          }`}
        >
          <Layers size={20} /> {t.ajzaa}
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col justify-center items-center py-20">
          <Loader2 size={40} className={`animate-spin mb-4 ${isDarkMode ? 'text-[#E5C158]' : 'text-[#D4AF37]'}`} />
        </div>
      ) : error ? (
        <div className="text-center py-10 font-bold text-red-500 bg-red-50 rounded-2xl max-w-md mx-auto">{error}</div>
      ) : activeTab === "surahs" ? (
        <div className="grid grid-cols-3 min-[500px]:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4">
          {filteredSurahs.length > 0 ? (
            filteredSurahs.map((surah) => (
              <Link 
                to={`/surah/${surah.number}`} 
                key={surah.number} 
                className={`flex flex-col items-center justify-center text-center p-3 md:p-4 rounded-2xl shadow-sm border transition-all duration-300 transform hover:-translate-y-1 hover:shadow-md group ${
                  isDarkMode ? 'bg-gray-800 border-gray-700 hover:border-[#E5C158]' : 'bg-white border-[#F0EBE1] hover:border-[#D4AF37]'
                }`}
              >
                <div className={`relative flex items-center justify-center w-10 h-10 mb-3 rounded-xl rotate-45 border-2 transition-all shrink-0 ${
                  isDarkMode ? 'border-gray-700 group-hover:bg-[#E5C158] group-hover:border-[#E5C158]' : 'border-[#F0EBE1] group-hover:bg-[#D4AF37] group-hover:border-[#D4AF37]'
                }`}>
                  <span className={`absolute -rotate-45 font-bold text-xs md:text-sm ${
                    isDarkMode ? 'text-gray-400 group-hover:text-gray-900' : 'text-gray-500 group-hover:text-white'
                  }`}>
                    {surah.number}
                  </span>
                </div>
                
                <h3 className={`text-xl md:text-2xl font-bold font-quran mb-4 pb-1 leading-relaxed transition-colors ${
                  isDarkMode ? 'text-[#E5C158]' : 'text-[#D4AF37]'
                }`}>
                  {(surah.name || "").replace('سُورَةُ ', '')}
                </h3>
                
                <span className={`text-[10px] md:text-xs font-bold font-sans truncate w-full transition-colors ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {surah.englishName}
                </span>
              </Link>
            ))
          ) : (
            <div className="col-span-full text-center py-10 font-medium text-gray-500">{t.noResult}</div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {juzData.map((juz) => (
            <Link 
              to={`/juz/${juz.id}`} 
              key={juz.id} 
              className={`relative flex flex-col items-center text-center p-4 rounded-2xl border shadow-sm transition-all duration-300 group hover:-translate-y-1 hover:shadow-lg overflow-hidden ${
                isDarkMode ? 'bg-gray-800 border-gray-700 hover:border-[#E5C158]' : 'bg-white border-[#F0EBE1] hover:border-[#D4AF37]'
              }`}
            >
              <div className={`w-12 h-12 flex items-center justify-center rounded-full font-bold text-lg border-[2px] transition-all mb-3 ${
                isDarkMode ? 'border-gray-700 text-[#E5C158] group-hover:bg-[#E5C158] group-hover:text-gray-900' : 'border-[#F0EBE1] text-[#D4AF37] group-hover:bg-[#D4AF37] group-hover:border-[#D4AF37] group-hover:text-white'
              }`}>
                {juz.id}
              </div>
              
              <h3 className={`font-bold text-lg md:text-xl ${isAr ? 'font-quran' : 'font-sans'} mb-1 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                {isAr ? 'الجزء' : 'Juz'} {isAr ? juz.nameAr : (juz.nameEn || juz.id)}
              </h3>
              
              <p className={`text-[10px] md:text-xs font-bold ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                {isAr ? 'الحزب' : 'Hizb'} {juz.hizbStart} - {juz.hizbEnd}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
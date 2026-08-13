import { useState, useEffect, useContext } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Settings, X, PlayCircle, PauseCircle, BookOpen, ChevronDown, Brain, Download, CheckCircle, RefreshCw, WifiOff, AlertTriangle } from "lucide-react";
import { AppContext } from "../App";

export default function SurahDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation(); 
  const { isDarkMode, lang, currentAudio, setCurrentAudio, isPlaying, setIsPlaying } = useContext(AppContext);
  const isAr = lang === 'ar'; 
  
  const [surah, setSurah] = useState(null);
  const [modalText, setModalText] = useState(null); 
  const [surahPages, setSurahPages] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [offlineError, setOfflineError] = useState(false);
  const [retryCount, setRetryCount] = useState(0); 
  
  const [toast, setToast] = useState({ show: false, message: "", type: "error" });
  
  const [currentPage, setCurrentPage] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const [reciter, setReciter] = useState("ar.alafasy"); 
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [isMemorizationMode, setIsMemorizationMode] = useState(false);
  const [revealedAyahs, setRevealedAyahs] = useState([]); 

  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloaded, setIsDownloaded] = useState(false);

  const [touchStartX, setTouchStartX] = useState(null);
  const [touchEndX, setTouchEndX] = useState(null);
  const [touchStartY, setTouchStartY] = useState(null);
  const [touchEndY, setTouchEndY] = useState(null);
  const minSwipeDistance = 50;

  const recitersList = [
    { id: "ar.alafasy", name: isAr ? "مشاري العفاسي" : "Mishary Alafasy" },
    { id: "ar.abdulsamad", name: isAr ? "عبد الباسط عبد الصمد" : "AbdulBaset AbdulSamad" },
    { id: "ar.husary", name: isAr ? "خليل الحصري" : "Al-Husary" },
    { id: "ar.husarymujawwad", name: isAr ? "الحصري (مجود)" : "Al-Husary (Mujawwad)" },
    { id: "ar.abdurrahmaansudais", name: isAr ? "عبد الرحمن السديس" : "As-Sudais" },
    { id: "ar.saoodshuraym", name: isAr ? "سعود الشريم" : "Saud Al-Shuraim" },
    { id: "ar.ahmedajamy", name: isAr ? "أحمد العجمي" : "Ahmed Al-Ajmi" },
    { id: "ar.hudhaify", name: isAr ? "علي الحذيفي" : "Ali Al-Hudhaify" },
    { id: "ar.mahermuaiqly", name: isAr ? "ماهر المعيقلي" : "Maher Al Muaiqly" },
    { id: "ar.abdullahbasfar", name: isAr ? "عبدالله بصفر" : "Abdullah Basfar" },
    { id: "ar.shaatree", name: isAr ? "أبو بكر الشاطري" : "Abu Bakr Ash-Shaatree" },
  ];

  const t = {
    play: isAr ? "تشغيل" : "Play",
    pause: isAr ? "إيقاف" : "Pause",
    settings: isAr ? "إعدادات القراءة" : "Reading Settings",
    fontSize: isAr ? "حجم الخط" : "Font Size",
    prevPage: isAr ? "السابق" : "Prev",
    nextPage: isAr ? "التالي" : "Next",
    prevSurah: isAr ? "السورة السابقة" : "Prev Surah",
    nextSurah: isAr ? "السورة التالية" : "Next Surah",
    page: isAr ? "صفحة" : "Page",
    juz: isAr ? "الجزء" : "Juz",
    tafsirTitle: isAr ? "تفسير الآية" : "Original Arabic",
    tafsirLabel: isAr ? "التفسير الميسر:" : "Arabic Text:",
    loading: isAr ? "جاري تحميل السورة..." : "Loading Surah...",
    memorize: isAr ? "التحفيظ" : "Memorize",
    offlineTitle: isAr ? "تعذر جلب السورة" : "Connection Error",
    offlineDesc: isAr ? "تأكد من اتصالك بالإنترنت. إذا كنت أوفلاين فهذه السورة لم يتم تحميلها مسبقاً." : "Check your connection. If offline, this Surah wasn't saved.",
    goBack: isAr ? "العودة للرئيسية" : "Go Back",
    retry: isAr ? "إعادة المحاولة" : "Try Again"
  };

  const [selectedAyah, setSelectedAyah] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  
  const [fontSize, setFontSize] = useState(() => {
    const savedSize = localStorage.getItem("fontSize");
    return savedSize ? parseInt(savedSize) : (window.innerWidth < 768 ? 20 : (isAr ? 38 : 22));
  });

  const showNotification = (message, type = "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "error" });
    }, 3500); 
  };

  const getAudioUrl = (reciterId, surahNumber, ayahNumberInSurah, globalAyahNumber) => {
    const everyAyahMap = {
      "ar.alafasy": "Alafasy_128kbps",
      "ar.abdulsamad": "Abdul_Basit_Murattal_192kbps",
      "ar.husary": "Husary_128kbps",
      "ar.husarymujawwad": "Husary_Mujawwad_64kbps",
      "ar.abdurrahmaansudais": "Abdurrahmaan_As-Sudais_192kbps",
      "ar.saoodshuraym": "Saood_ash-Shuraym_128kbps",
      "ar.ahmedajamy": "Ahmed_ibn_Ali_al-Ajamy_128kbps_ketaballah.net",
      "ar.hudhaify": "Hudhaify_128kbps",
      "ar.mahermuaiqly": "MaherAlMuaiqly128kbps",
      "ar.abdullahbasfar": "Abdullah_Basfar_192kbps",
      "ar.shaatree": "Abu_Bakr_Ash-Shaatree_128kbps"
    };

    if (everyAyahMap[reciterId]) {
      const sNum = String(surahNumber).padStart(3, '0');
      const aNum = String(ayahNumberInSurah).padStart(3, '0');
      return `https://everyayah.com/data/${everyAyahMap[reciterId]}/${sNum}${aNum}.mp3`;
    }
    
    return `https://cdn.islamic.network/quran/audio/64/${reciterId}/${globalAyahNumber}.mp3`;
  };

  useEffect(() => {
    setLoading(true);
    setOfflineError(false);
    setIsMemorizationMode(false);
    setRevealedAyahs([]);
    
    const mainEdition = isAr ? "" : "/en.sahih"; 
    const modalEdition = isAr ? "/ar.muyassar" : "/quran-simple"; 
    const mainUrl = `https://api.alquran.cloud/v1/surah/${id}${mainEdition}`;
    const modalUrl = `https://api.alquran.cloud/v1/surah/${id}${modalEdition}`;

    const processData = (fetchedSurah, fetchedModal) => {
      const pagesMap = {};
      fetchedSurah.ayahs.forEach(ayah => {
        if (!pagesMap[ayah.page]) pagesMap[ayah.page] = [];
        pagesMap[ayah.page].push(ayah);
      });
      
      const pagesArray = Object.values(pagesMap);
      setSurahPages(pagesArray);
      setSurah(fetchedSurah);
      setModalText(fetchedModal);
      
      let initialPage = 0;
      if (location.state?.targetPage !== undefined) {
        initialPage = location.state.targetPage; 
      } else if (location.state?.startAyah) {
        const targetPageIndex = pagesArray.findIndex(page => page.some(a => a.numberInSurah === location.state.startAyah));
        if (targetPageIndex !== -1) initialPage = targetPageIndex; 
      }
      
      setCurrentPage(initialPage);
      setLoading(false);
    };

    const loadData = async () => {
      try {
        const [surahRes, modalRes] = await Promise.all([
          axios.get(mainUrl),
          axios.get(modalUrl)
        ]);

        const fetchedSurah = surahRes.data.data;
        const fetchedModal = modalRes.data.data;

        try {
          if ('caches' in window) {
            const cache = await caches.open('quran-text-cache-v1');
            cache.put(mainUrl, new Response(JSON.stringify({ data: fetchedSurah })));
            cache.put(modalUrl, new Response(JSON.stringify({ data: fetchedModal })));
          }
        } catch (e) {}

        processData(fetchedSurah, fetchedModal);

      } catch (networkError) {
        try {
          if ('caches' in window) {
            const cache = await caches.open('quran-text-cache-v1');
            const [cachedMain, cachedModal] = await Promise.all([
              cache.match(mainUrl),
              cache.match(modalUrl)
            ]);

            if (cachedMain && cachedModal) {
              const mainData = await cachedMain.json();
              const modalData = await cachedModal.json();
              processData(mainData.data, modalData.data);
              return; 
            }
          }
        } catch (cacheError) {}

        setOfflineError(true);
        setLoading(false);
      }
    };

    loadData();
  }, [id, isAr, location.state, retryCount]);

  useEffect(() => {
    if (surah !== null) {
      localStorage.setItem("lastRead", JSON.stringify({
        id: surah.number,
        name: surah.name,
        englishName: surah.englishName,
        page: currentPage
      }));
    }
  }, [surah, currentPage]);

  useEffect(() => {
    const checkCache = async () => {
      if (!surah) return;
      const isSavedPermanently = localStorage.getItem(`offline_audio_saved_${surah.number}_${reciter}`) === 'true';
      setIsDownloaded(isSavedPermanently);
    };
    checkCache();
  }, [surah, reciter]);

  const downloadSurahAudio = async () => {
    if (!surah || !('caches' in window)) return;
    
    if (!navigator.onLine) {
      showNotification(isAr ? "أنت غير متصل بالإنترنت. لا يمكن التحميل." : "Offline. Cannot start download.", "warning");
      return;
    }
    
    setIsDownloading(true);
    setDownloadProgress(0);
    
    try {
      const cache = await caches.open('quran-audio-cache');
      const totalAyahs = surah.ayahs.length;
      let downloadedCount = 0;
      let failedCount = 0; 

      for (let i = 0; i < totalAyahs; i++) {
        const url = getAudioUrl(reciter, surah.number, surah.ayahs[i].numberInSurah, surah.ayahs[i].number);
        
        let success = false;
        let attempts = 0;

        while (!success && attempts < 2) {
          try {
            const cachedResponse = await cache.match(url);
            if (cachedResponse) {
              success = true;
              break;
            }

            const response = await fetch(url);
            if (response.ok) {
              await cache.put(url, response.clone());
              success = true;
            }
          } catch(netErr) { }
          attempts++;
        }

        if (!success) failedCount++;
        
        downloadedCount++;
        setDownloadProgress(Math.round((downloadedCount / totalAyahs) * 100));
        
        if (i % 5 === 0) {
          await new Promise(r => setTimeout(r, 10));
        }
      }
      
      if (failedCount === totalAyahs) {
        showNotification(isAr ? "فشل التحميل. تأكد من اتصالك بالإنترنت." : "Download failed. Check connection.", "error");
        setIsDownloaded(false);
      } else if (failedCount > 0) {
        showNotification(isAr ? `تم تحميل جزء وفشلت ${failedCount} آية. حاول مجدداً.` : `Partial download. ${failedCount} failed.`, "warning");
        setIsDownloaded(false); 
      } else {
        localStorage.setItem(`offline_audio_saved_${surah.number}_${reciter}`, 'true');
        setIsDownloaded(true);
        const currentReciterObj = recitersList.find(r => r.id === reciter);
        showNotification(isAr ? `تم تحميل السورة بصوت ${currentReciterObj?.name} بنجاح` : `Downloaded successfully`, "success");
      }

    } catch (error) {
      console.error(error);
      showNotification(isAr ? "حدث خطأ غير متوقع أثناء التحميل." : "Unexpected error occurred.", "error");
    } finally {
      setIsDownloading(false);
    }
  };

  useEffect(() => {
    localStorage.setItem("fontSize", fontSize);
  }, [fontSize]);

  const changePage = (newPage) => {
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentPage(newPage);
      setIsAnimating(false);
    }, 300);
  };

  const handleNextPage = () => {
    if (currentPage < surahPages.length - 1) {
      changePage(currentPage + 1);
    } else if (surah.number < 114) {
      navigate(`/surah/${surah.number + 1}`);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      changePage(currentPage - 1);
    } else if (surah.number > 1) {
      navigate(`/surah/${surah.number - 1}`);
    }
  };

  const formatAyahText = (text, ayahNumberInSurah, surahNumber) => {
    if (isAr && ayahNumberInSurah === 1 && surahNumber !== 1 && surahNumber !== 9) {
      const words = text.split(' ');
      if (words.length > 4) return words.slice(4).join(' ');
    }
    return text;
  };
  const handlePlaySurahGlobal = () => {
    if (!surah || !surah.ayahs) return;

    const currentReciterObj = recitersList?.find(r => r.id === reciter);
    const reciterName = currentReciterObj?.name || reciter;

    if (currentAudio?.surahId === surah.number && currentAudio?.reciterId === reciter) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentAudio({
        surahId: surah.number,
        nameAr: surah.name.replace('سُورَةُ ', ''),
        nameEn: surah.englishName,
        reciterName: reciterName, 
        reciterId: reciter, 
        ayahs: surah.ayahs.map(a => ({
          ...a,
          audio: getAudioUrl(reciter, surah.number, a.numberInSurah, a.number)
        })), 
        currentAyahIndex: 0
      });
      setIsPlaying(true);
    }
  };

  const toggleMemorizationMode = () => {
    setIsMemorizationMode(!isMemorizationMode);
    setRevealedAyahs([]);
    if (isPlaying) {
      setIsPlaying(false);
    }
  };

  const handleAyahClick = (ayah) => {
    if (isMemorizationMode) {
      setRevealedAyahs(prev => 
        prev.includes(ayah.number) 
          ? prev.filter(n => n !== ayah.number) 
          : [...prev, ayah.number]
      );
    } else {
      setSelectedAyah(ayah);
    }
  };

  const onTouchStart = (e) => {
    setTouchEndX(null);
    setTouchEndY(null);
    setTouchStartX(e.targetTouches[0].clientX);
    setTouchStartY(e.targetTouches[0].clientY);
  };

  const onTouchMove = (e) => {
    setTouchEndX(e.targetTouches[0].clientX);
    setTouchEndY(e.targetTouches[0].clientY);
  };

  const onTouchEnd = () => {
    if (!touchStartX || !touchEndX) return;
    
    const distanceX = touchStartX - touchEndX;
    const distanceY = touchStartY - touchEndY;
    
    if (Math.abs(distanceX) > Math.abs(distanceY) && Math.abs(distanceX) > minSwipeDistance) {
      const isLeftSwipe = distanceX > minSwipeDistance;
      const isRightSwipe = distanceX < -minSwipeDistance;

      if (isLeftSwipe) {
        isAr ? handlePrevPage() : handleNextPage();
      } else if (isRightSwipe) {
        isAr ? handleNextPage() : handlePrevPage();
      }
    }
  };

  const BackIcon = isAr ? ArrowLeft : ArrowRight;
  const NextPageIcon = isAr ? ChevronLeft : ChevronRight;
  const PrevPageIcon = isAr ? ChevronRight : ChevronLeft;

  const isCurrentAudioSurah = currentAudio?.surahId === surah?.number && currentAudio?.reciterId === reciter;

  if (offlineError) {
    return (
      <div className={`flex flex-col justify-center items-center min-h-screen p-6 text-center ${isDarkMode ? "bg-gray-900 text-white" : "bg-[#FDFBF7] text-gray-800"}`} dir={isAr ? "rtl" : "ltr"}>
        <div className={`w-24 h-24 mb-6 rounded-full flex items-center justify-center ${isDarkMode ? "bg-gray-800 text-[#E6B981]" : "bg-white border-[#F0EBE1] border text-[#D4A373] shadow-md"}`}>
          <WifiOff size={48} />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold mb-4">{t.offlineTitle}</h2>
        <p className="text-gray-500 mb-8 max-w-sm leading-relaxed">{t.offlineDesc}</p>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <button 
            onClick={() => setRetryCount(prev => prev + 1)}
            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-full font-bold transition-all shadow-sm ${isDarkMode ? "bg-gray-800 text-[#E6B981] border border-gray-700 hover:bg-gray-700" : "bg-white text-[#D4A373] border border-[#F0EBE1] hover:bg-gray-50"}`}
          >
            <RefreshCw size={20} />
            {t.retry}
          </button>

          <button 
            onClick={() => navigate("/")}
            className={`flex items-center justify-center gap-2 px-8 py-3 rounded-full font-bold transition-all shadow-md ${isDarkMode ? "bg-[#E6B981] text-gray-900 hover:bg-[#d6a575]" : "bg-[#D4A373] text-white hover:bg-[#b58555]"}`}
          >
            <BackIcon size={20} />
            {t.goBack}
          </button>
        </div>
      </div>
    );
  }

  if (loading || surahPages.length === 0) {
    return (
      <div className={`flex justify-center items-center min-h-screen font-bold text-xl font-sans ${isDarkMode ? "bg-gray-900 text-[#E6B981]" : "bg-[#FDFBF7] text-[#D4A373]"}`}>
        {t.loading}
      </div>
    );
  }

  const totalPages = surahPages.length;
  const currentAyahs = surahPages[currentPage];
  const currentReciterName = recitersList.find(r => r.id === reciter)?.name;
  const realMushafPage = currentAyahs[0]?.page;
  const currentJuz = currentAyahs[0]?.juz;
  const themeColor = isDarkMode ? "#E6B981" : "#D4A373";

  return (
    <div className="max-w-4xl mx-auto p-2 md:p-6 pt-20" dir={isAr ? "rtl" : "ltr"}>

      {toast.show && (
        <div className={`fixed bottom-24 left-1/2 transform -translate-x-1/2 z-[100] flex items-center gap-3 px-6 py-3.5 rounded-full shadow-2xl transition-all duration-300 ${
          toast.type === 'error' ? 'bg-red-500 text-white' : 
          toast.type === 'warning' ? 'bg-yellow-500 text-white' : 
          'bg-green-500 text-white'
        }`} dir={isAr ? 'rtl' : 'ltr'}>
          {toast.type === 'error' ? <WifiOff size={20} /> : 
           toast.type === 'warning' ? <AlertTriangle size={20} /> : 
           <CheckCircle size={20} />}
          <span className={`font-bold text-sm md:text-base whitespace-nowrap ${!isAr && 'font-sans'}`}>{toast.message}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6 px-2 w-full">
        <h2 className={`text-2xl md:text-3xl font-bold w-full ${isAr ? 'text-right font-quran' : 'text-left font-serif tracking-wide'} md:w-auto ${isDarkMode ? "text-[#E6B981]" : "text-[#D4A373]"}`}>
          {isAr ? surah.name : surah.englishName}
        </h2>

        <div className={`flex flex-wrap items-center gap-2 md:gap-3 w-full md:w-auto ${isAr ? 'justify-end' : 'justify-start'}`}>
          <button 
            onClick={handlePlaySurahGlobal}
            className={`flex items-center justify-center gap-2 px-3 md:px-4 py-2 rounded-xl font-bold transition-all shadow-sm ${!isAr && 'font-sans'} ${
              isCurrentAudioSurah && isPlaying 
                ? "bg-red-50 text-red-500 border border-red-200 hover:bg-red-100" 
                : "bg-[#D4A373] text-white hover:bg-[#b58555]"
            }`}
          >
            {isCurrentAudioSurah && isPlaying ? <PauseCircle size={18} /> : <PlayCircle size={18} />}
            <span className="text-xs md:text-sm">{isCurrentAudioSurah && isPlaying ? t.pause : t.play}</span>
          </button>

          <div className="relative">
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`flex items-center justify-center gap-2 px-3 md:px-4 py-2 rounded-xl font-medium text-xs md:text-sm transition-all shadow-sm border ${!isAr && 'font-sans'} ${
                isDarkMode 
                  ? "bg-gray-800 border-gray-700 text-gray-200 hover:border-[#E6B981]" 
                  : "bg-white border-[#F0EBE1] text-gray-700 hover:border-[#D4A373]"
              }`}
            >
              <span className="truncate max-w-[90px] md:max-w-none">{currentReciterName}</span>
              <ChevronDown size={16} className={`transition-transform duration-300 ${isDropdownOpen ? "rotate-180" : ""} ${isDarkMode ? "text-[#E6B981]" : "text-[#D4A373]"}`} />
            </button>

            {isDropdownOpen && (
              <div className={`absolute top-full mt-2 ${isAr ? 'left-0 md:right-0 md:left-auto' : 'right-0 md:left-0 md:right-auto'} w-48 rounded-2xl shadow-xl overflow-hidden z-50 border ${!isAr && 'font-sans'} ${
                isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-[#F0EBE1]"
              }`}>
                {recitersList.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => {
                      setReciter(r.id);
                      setIsDropdownOpen(false);
                      if (isPlaying) setIsPlaying(false); 
                    }}
                    className={`w-full ${isAr ? 'text-right' : 'text-left'} px-4 py-3 text-sm transition-colors ${
                      reciter === r.id 
                        ? (isDarkMode ? `bg-gray-900 text-[#E6B981] font-bold ${isAr ? 'border-r-4' : 'border-l-4'} border-[#E6B981]` : `bg-[#FDFBF7] text-[#D4A373] font-bold ${isAr ? 'border-r-4' : 'border-l-4'} border-[#D4A373]`) 
                        : (isDarkMode ? "text-gray-300 hover:bg-gray-700 hover:text-[#E6B981]" : "text-gray-600 hover:bg-gray-50 hover:text-[#D4A373]")
                    }`}
                  >
                    {r.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {isDownloaded ? (
            <button 
              className={`flex items-center gap-1 p-2 rounded-xl shadow-sm border transition-colors cursor-default ${isDarkMode ? "bg-green-900/30 border-green-800 text-green-400" : "bg-green-50 border-green-200 text-green-600"}`}
              title={isAr ? `محملة بصوت ${currentReciterName}` : `Downloaded (${currentReciterName})`}
            >
              <CheckCircle size={20} />
            </button>
          ) : (
            <button 
              onClick={downloadSurahAudio}
              disabled={isDownloading}
              className={`flex items-center gap-1 p-2 rounded-xl shadow-sm border transition-colors ${
                isDownloading 
                  ? (isDarkMode ? "bg-gray-800 border-gray-700 text-[#E6B981]" : "bg-gray-50 border-gray-200 text-[#D4A373]") 
                  : (isDarkMode ? "bg-gray-800 border-gray-700 text-gray-300 hover:text-[#E6B981]" : "bg-white border-[#F0EBE1] text-gray-500 hover:text-[#D4A373]")
              }`}
              title={isAr ? "تحميل للاستماع أوفلاين" : "Download for offline"}
            >
              {isDownloading ? (
                <>
                  <RefreshCw size={20} className="animate-spin" />
                  <span className="text-[10px] font-bold px-1">{downloadProgress}%</span>
                </>
              ) : (
                <Download size={20} />
              )}
            </button>
          )}

          <button 
            onClick={toggleMemorizationMode}
            className={`p-2 rounded-xl shadow-sm border transition-colors ${
              isMemorizationMode 
                ? "bg-[#D4A373] text-white border-[#D4A373]" 
                : (isDarkMode ? "bg-gray-800 border-gray-700 text-gray-300 hover:text-[#E6B981]" : "bg-white border-[#F0EBE1] text-gray-500 hover:text-[#D4A373]")
            }`}
            title={t.memorize}
          >
            <Brain size={20} />
          </button>

          <button 
            onClick={() => setShowSettings(true)}
            className={`p-2 rounded-xl shadow-sm border transition-colors ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-300 hover:text-[#E6B981]" : "bg-white border-[#F0EBE1] text-gray-500 hover:text-[#D4A373]"}`}
          >
            <Settings size={20} />
          </button>

          <button 
            onClick={() => navigate("/")}
            className={`p-2 rounded-xl shadow-sm border transition-colors ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-300 hover:text-[#E6B981]" : "bg-white border-[#F0EBE1] text-gray-500 hover:text-[#D4A373]"}`}
          >
            <BackIcon size={20} />
          </button>
        </div>
      </div>

      <div 
        className={`px-4 md:px-12 py-8 rounded-xl shadow-md border-x border-b transition-colors duration-300 min-h-[75vh] flex flex-col justify-between ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-[#FDFBF7] border-[#F0EBE1]"}`}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        
        <div className={`flex justify-between items-center w-full pb-2 mb-4 border-b-2 ${!isAr && 'font-sans'} ${isDarkMode ? "border-gray-700 text-gray-400" : "border-[#D4A373]/30 text-gray-400"} font-bold text-sm md:text-base`}>
          <span>{isAr ? surah.name : surah.englishName}</span>
          <span>{t.juz} {currentJuz}</span>
        </div>

        <div className={`transition-opacity duration-300 ease-in-out text-center flex-1 ${isAnimating ? "opacity-0" : "opacity-100"}`}>
          
          {currentAyahs.some(a => a.numberInSurah === 1) && (
            <>
              <div className="relative flex items-center justify-center mb-8 mt-4 mx-auto w-[260px] h-[60px] md:w-[380px] md:h-[80px]">
                <svg viewBox="0 0 400 80" className="absolute inset-0 w-full h-full drop-shadow-sm" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="2" y="2" width="396" height="76" stroke={themeColor} strokeWidth="2" />
                  <rect x="8" y="8" width="384" height="64" stroke={themeColor} strokeWidth="1" />
                  <path d="M 8 20 L 20 8 M 392 20 L 380 8 M 8 60 L 20 72 M 392 60 L 380 72" stroke={themeColor} strokeWidth="1.5" />
                  <circle cx="200" cy="8" r="3" fill={themeColor} />
                  <circle cx="200" cy="72" r="3" fill={themeColor} />
                  <circle cx="8" cy="40" r="3" fill={themeColor} />
                  <circle cx="392" cy="40" r="3" fill={themeColor} />
                  <rect x="10" y="10" width="380" height="60" fill={isDarkMode ? "#1f2937" : "#Fdfbf7"} className="opacity-50" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center pb-2 md:pb-3">
                  <h2 className={`text-2xl md:text-3xl font-bold ${isAr ? 'font-quran' : 'font-serif tracking-wide'} pt-1 ${isDarkMode ? "text-[#E6B981]" : "text-[#D4A373]"}`}>
                    {isAr ? surah.name : surah.englishName}
                  </h2>
                </div>
              </div>

              {surah.number !== 1 && surah.number !== 9 && (
                <div className={`text-center ${isAr ? 'text-2xl md:text-4xl' : 'text-xl md:text-2xl'} mb-6 md:mb-8 ${isAr ? 'font-quran' : 'font-serif font-medium tracking-wide'} ${isDarkMode ? "text-[#E6B981]" : "text-[#D4A373]"}`}>
                  {isAr ? "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ" : "In the name of Allah..."}
                </div>
              )}
            </>
          )}
          
          <div 
            className={isAr ? "font-quran" : "font-sans"} 
            style={{ 
              textAlign: isAr ? 'justify' : 'left',
              textAlignLast: isAr ? 'center' : 'left', 
              direction: isAr ? 'rtl' : 'ltr',
              lineHeight: `${fontSize * (isAr ? 2 : 1.6)}px` 
            }}
          >
            {currentAyahs.map((ayah) => {
              const globalAyahIndex = surah.ayahs.findIndex(a => a.number === ayah.number);
              const isAyahPlaying = isCurrentAudioSurah && isPlaying && currentAudio?.currentAyahIndex === globalAyahIndex;
              
              const isRevealed = revealedAyahs.includes(ayah.number);
              const isHidden = isMemorizationMode && !isRevealed; 
              const cleanAyahText = formatAyahText(ayah.text, ayah.numberInSurah, surah.number);
              const isTargetAyah = location.state?.startAyah === ayah.numberInSurah;
              
              return (
                <span 
                  key={ayah.numberInSurah}
                  onClick={() => isMemorizationMode ? handleAyahClick(ayah) : handleAyahClick(ayah)} 
                  className={`transition-colors duration-300 cursor-pointer inline ${
                    isAyahPlaying 
                      ? (isDarkMode ? "text-[#E6B981]" : "text-[#D4A373]") 
                      : (isDarkMode ? "text-gray-200 hover:text-gray-400" : "text-gray-800 hover:text-[#D4A373]")
                  } ${isHidden ? "blur-[6px] opacity-40 select-none" : ""} ${isTargetAyah && !isMemorizationMode ? (isDarkMode ? "bg-[#E6B981]/20 rounded-lg px-1" : "bg-[#D4A373]/20 rounded-lg px-1") : ""}`}
                  style={{ fontSize: `${fontSize}px` }}
                >
                  {cleanAyahText}
                  
                  <span 
                    className={`inline-flex items-center justify-center mx-1.5 md:mx-2 rounded-full font-sans border-[3px] border-double transition-all ${
                      isAyahPlaying 
                        ? "bg-[#D4A373] text-white border-[#D4A373]" 
                        : (isDarkMode ? "text-[#E6B981] border-[#E6B981]" : "text-[#D4A373] border-[#D4A373]")
                    } ${isHidden ? "opacity-0" : "opacity-100"}`}
                    style={{ 
                      width: `${fontSize * (isAr ? 1.3 : 1.1)}px`, 
                      height: `${fontSize * (isAr ? 1.3 : 1.1)}px`, 
                      fontSize: `${fontSize * 0.45}px`,
                      transform: isAr ? 'translateY(-2px)' : 'translateY(-1px)'
                    }}
                  >
                    {ayah.numberInSurah}
                  </span>
                </span>
              );
            })}
          </div>
        </div>

        <div className={`flex items-center justify-between mt-8 md:mt-10 pt-4 border-t ${isDarkMode ? "border-gray-700" : "border-[#F0EBE1]/60"}`}>
          <button
            onClick={handlePrevPage}
            disabled={surah.number === 1 && currentPage === 0}
            className={`flex items-center gap-1 md:gap-2 px-3 py-2 rounded-xl font-bold text-xs md:text-sm transition-all ${!isAr && 'font-sans'} ${
              surah.number === 1 && currentPage === 0
                ? "opacity-50 cursor-not-allowed text-gray-400" 
                : (isDarkMode ? "text-[#E6B981] hover:bg-gray-700" : "text-[#D4A373] hover:bg-[#f4efe6]")
            }`}
          >
            <PrevPageIcon size={18} />
            <span>{currentPage === 0 ? t.prevSurah : t.prevPage}</span>
          </button>
          
          <span className={`font-medium text-xs md:text-sm ${!isAr && 'font-sans'} ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
            {t.page} {realMushafPage}
          </span>
          
          <button
            onClick={handleNextPage}
            disabled={surah.number === 114 && currentPage === totalPages - 1}
            className={`flex items-center gap-1 md:gap-2 px-3 py-2 rounded-xl font-bold text-xs md:text-sm transition-all ${!isAr && 'font-sans'} ${
              surah.number === 114 && currentPage === totalPages - 1
                ? "opacity-50 cursor-not-allowed text-gray-400" 
                : (isDarkMode ? "text-[#E6B981] hover:bg-gray-700" : "text-[#D4A373] hover:bg-[#f4efe6]")
            }`}
          >
            <span>{currentPage === totalPages - 1 ? t.nextSurah : t.nextPage}</span>
            <NextPageIcon size={18} />
          </button>
        </div>
      </div>

      {selectedAyah && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedAyah(null)}>
          <div className={`w-full max-w-lg p-5 md:p-6 rounded-3xl shadow-xl transform transition-all ${isDarkMode ? "bg-gray-800 text-gray-200" : "bg-white text-gray-800"}`} onClick={e => e.stopPropagation()} dir={isAr ? 'rtl' : 'ltr'}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`font-bold text-lg md:text-xl ${!isAr && 'font-sans'} ${isDarkMode ? "text-[#E6B981]" : "text-[#D4A373]"}`}>
                {t.tafsirTitle} ({selectedAyah.numberInSurah})
              </h3>
              <button onClick={() => setSelectedAyah(null)} className="text-gray-400 hover:text-red-500"><X size={20} /></button>
            </div>
            
            <p className={`${isAr ? 'font-quran text-center' : 'font-sans font-medium text-left'} text-xl md:text-2xl leading-loose mb-5 text-gray-500`}>
              {formatAyahText(selectedAyah.text, selectedAyah.numberInSurah, surah.number)}
            </p>
            
            <div className={`p-5 rounded-2xl shadow-inner border max-h-[40vh] overflow-y-auto ${isDarkMode ? "bg-[#161b22] border-gray-700" : "bg-[#FDFBF7] border-[#F0EBE1]"}`}>
              <div className={`flex items-center gap-2 mb-3 text-sm font-bold ${isDarkMode ? 'text-[#E6B981]' : 'text-[#D4A373]'}`}>
                <BookOpen size={18} /> {t.tafsirLabel}
              </div>
              <p className={`text-lg md:text-[22px] font-medium leading-[2.2] ${isAr ? 'font-sans text-justify' : 'font-serif text-left'} ${isDarkMode ? 'text-gray-300' : 'text-[#5a4a3e]'}`} dir={isAr ? "rtl" : "ltr"}>
                {modalText?.ayahs.find(a => a.numberInSurah === selectedAyah.numberInSurah)?.text || "..."}
              </p>
            </div>
          </div>
        </div>
      )}

      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowSettings(false)}>
          <div className={`w-full max-w-sm p-5 md:p-6 rounded-3xl shadow-xl ${isDarkMode ? "bg-gray-800 text-gray-200" : "bg-white text-gray-800"}`} onClick={e => e.stopPropagation()} dir={isAr ? "rtl" : "ltr"}>
            <div className="flex justify-between items-center mb-6">
              <h3 className={`font-bold text-lg md:text-xl ${!isAr && 'font-sans'}`}>{t.settings}</h3>
              <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-red-500"><X size={20} /></button>
            </div>
            <div className={`mb-4 ${!isAr && 'font-sans'}`}>
              <div className="flex justify-between font-bold mb-2 text-sm md:text-base">
                <span>{t.fontSize}</span>
                <span className="text-[#D4A373]">{fontSize}px</span>
              </div>
              <input 
                type="range" min="16" max="60" value={fontSize} 
                onChange={(e) => setFontSize(parseInt(e.target.value))}
                className="w-full accent-[#D4A373]" style={{ direction: 'ltr' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
import { useState, useEffect, useContext, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { 
  ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Settings, X, 
  PlayCircle, PauseCircle, BookOpen, ChevronDown, Brain, Download, 
  CheckCircle, RefreshCw, WifiOff, AlertTriangle, Bookmark, BookmarkCheck, 
  Volume2, Sparkles, Share2, Copy, Check, Image as ImageIcon
} from "lucide-react";
import { AppContext } from "../App";

export default function SurahDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation(); 
  const dialogPushed = useRef(false);
  const { isDarkMode, lang, currentAudio, setCurrentAudio, isPlaying, setIsPlaying, setIsRadioPlaying, bookmarks, setBookmarks } = useContext(AppContext);
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
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const reciterBtnRef = useRef(null);

  const [isMemorizationMode, setIsMemorizationMode] = useState(false);
  const [revealedAyahs, setRevealedAyahs] = useState([]); 

  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloaded, setIsDownloaded] = useState(false);

  const [activeAyahMenu, setActiveAyahMenu] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [selectedAyahForTafsir, setSelectedAyahForTafsir] = useState(null);
  const [selectedTafsirEdition, setSelectedTafsirEdition] = useState("ar.muyassar");
  const [dynamicTafsirText, setDynamicTafsirText] = useState("");
  const [isTafsirLoading, setIsTafsirLoading] = useState(false);

  const [selectedAyahForCard, setSelectedAyahForCard] = useState(null);
  const [isCardCopied, setIsCardCopied] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const [cardShareMode, setCardShareMode] = useState("ayah");
  const [cardRangeStart, setCardRangeStart] = useState(1);
  const [cardRangeEnd, setCardRangeEnd] = useState(1);
  const [cardRangeDropdown, setCardRangeDropdown] = useState(null);
  const [showCardTafsir, setShowCardTafsir] = useState(false);
  const [cardTafsirMap, setCardTafsirMap] = useState({});
  const [isCardTafsirLoading, setIsCardTafsirLoading] = useState(false);

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
  { id: "ar.saadalghamdi", name: isAr ? "سعد الغامدي" : "Saad Al-Ghamdi" },
  { id: "ar.mahermuaiqly", name: isAr ? "ماهر المعيقلي" : "Maher Al Muaiqly" },
  { id: "ar.yasseraldossari", name: isAr ? "ياسر الدوسري" : "Yasser Al-Dossari" },
  { id: "ar.minshawimujawwad", name: isAr ? "محمد صديق المنشاوي (مجود)" : "Mohamed Siddiq Al-Minshawi (Mujawwad)"},
  { id: "ar.abdurrahmaansudais", name: isAr ? "عبد الرحمن السديس" : "As-Sudais" },
  { id: "ar.saoodshuraym", name: isAr ? "سعود الشريم" : "Saud Al-Shuraim" },
  { id: "ar.ahmedajamy", name: isAr ? "أحمد العجمي" : "Ahmed Al-Ajmi" },
  { id: "ar.hudhaify", name: isAr ? "علي الحذيفي" : "Ali Al-Hudhaify" },
  { id: "ar.abdullahbasfar", name: isAr ? "عبدالله بصفر" : "Abdullah Basfar" },
  { id: "ar.shaatree", name: isAr ? "أبو بكر الشاطري" : "Abu Bakr Ash-Shaatree" },
  ];

  const tafsirEditionsList = [
    { id: "ar.muyassar", name: isAr ? "التفسير الميسر" : "Al-Muyassar" },
    { id: "ar.jalalayn", name: isAr ? "تفسير الجلالين" : "Tafsir Al-Jalalayn" },
    { id: "ar.qurtubi", name: isAr ? "تفسير القرطبي" : "Tafsir Al-Qurtubi" },
    { id: "ar.waseet", name: isAr ? "التفسير الوسيط" : "Tafsir Al-Waseet" },
    { id: "ar.baghawi", name: isAr ? "تفسير البغوي" : "Tafsir Al-Baghawi" },
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
    tafsirTitle: isAr ? "تفسير الآية" : "Tafsir of Ayah",
    loading: isAr ? "جاري تحميل السورة..." : "Loading Surah...",
    memorize: isAr ? "التحفيظ" : "Memorize",
    offlineTitle: isAr ? "تعذر جلب السورة" : "Connection Error",
    offlineDesc: isAr ? "تأكد من اتصالك بالإنترنت. إذا كنت أوفلاين فهذه السورة لم يتم تحميلها مسبقاً." : "Check your connection. If offline, this Surah wasn't saved.",
    goBack: isAr ? "العودة للرئيسية" : "Go Back",
    retry: isAr ? "إعادة المحاولة" : "Try Again",
    listenAyah: isAr ? "الاستماع للآية" : "Listen to Ayah",
    showTafsir: isAr ? "التفسير" : "Tafsir",
    addBookmark: isAr ? "إضافة علامة مرجعية" : "Add Bookmark",
    removeBookmark: isAr ? "إزالة العلامة المرجعية" : "Remove Bookmark",
    shareCard: isAr ? "كارت الآية" : "Ayah Card",
    downloadCard: isAr ? "تحميل كصورة " : "Download Image",
    copyCardText: isAr ? "نسخ النص" : "Copy Text",
    shareAction: isAr ? "مشاركة" : "Share",
    copied: isAr ? "تم النسخ" : "Copied!",
    singleAyah: isAr ? "آية واحدة" : "Single Ayah",
    multipleAyahs: isAr ? "عدة آيات" : "Multiple Ayahs",
    fullPage: isAr ? "صفحة كاملة" : "Full Page",
    fromAyah: isAr ? "من الآية" : "From",
    toAyah: isAr ? "إلى الآية" : "To",
    showCardTafsir: isAr ? "إظهار التفسير في الكارت" : "Show Tafsir in Card",
    tafsirSource: isAr ? "مصدر التفسير" : "Tafsir Source",
    shareImage: isAr ? "مشاركة الكارت كصورة" : "Share Card as Image",
    pageAyahs: isAr ? "آيات الصفحة" : "Page Ayahs",
  };

  const [showSettings, setShowSettings] = useState(false);
  const [fontSize, setFontSize] = useState(() => {
    const savedSize = localStorage.getItem("fontSize");
    return savedSize ? parseInt(savedSize) : (window.innerWidth < 768 ? 20 : 27);
  });

  const showNotification = (message, type = "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "error" });
    }, 3500); 
  };

  useEffect(() => {
    if (window.location.hash === '#dialog') {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }, []);

  useEffect(() => {
    const isAnyModalOpen = !!(selectedAyahForCard || selectedAyahForTafsir || activeAyahMenu || showSettings || isDropdownOpen);
    
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
        setSelectedAyahForCard(null);
        setSelectedAyahForTafsir(null);
        setActiveAyahMenu(null);
        setShowSettings(false);
        setIsDropdownOpen(false);
        dialogPushed.current = false;
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [selectedAyahForCard, selectedAyahForTafsir, activeAyahMenu, showSettings, isDropdownOpen]);

  const getAudioUrl = (
  reciterId,
  surahNumber,
  ayahNumberInSurah,
  globalAyahNumber
) => {
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
    "ar.shaatree": "Abu_Bakr_Ash-Shaatree_128kbps",
  };

  if (reciterId === "ar.saadalghamdi") {
  return `https://alfurqan.online/api/v1/audio/ghamadi/surah/${surahNumber}/ayah/${ayahNumberInSurah}`;
}

  if (reciterId === "ar.yasseraldossari") {
    return `https://the-quran-project.github.io/Quran-Audio/Data/4/${surahNumber}_${ayahNumberInSurah}.mp3`;
  }

  if (everyAyahMap[reciterId]) {
    const sNum = String(surahNumber).padStart(3, "0");
    const aNum = String(ayahNumberInSurah).padStart(3, "0");

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
        const targetPageIndex = pagesArray.findIndex(page => 
          page.some(a => a.numberInSurah === location.state.startAyah)
        );
        if (targetPageIndex !== -1) initialPage = targetPageIndex; 
      }
      if (initialPage >= pagesArray.length) {
        initialPage = Math.max(0, pagesArray.length - 1);
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
      const isSavedPermanently = localStorage.getItem(`offline_audio_saved_${surah.number}_${reciter}`) === 'true' || localStorage.getItem(`offline_audio_full_${reciter}`) === 'true';
      setIsDownloaded(isSavedPermanently);
    };
    checkCache();
  }, [surah, reciter]);

  useEffect(() => {
    if (!selectedAyahForTafsir) return;

    if (selectedTafsirEdition === "ar.muyassar" && modalText) {
      const found = modalText.ayahs.find(a => a.numberInSurah === selectedAyahForTafsir.numberInSurah)?.text;
      if (found) {
        setDynamicTafsirText(found);
        return;
      }
    }

    setIsTafsirLoading(true);
    const tafsirUrl = `https://api.alquran.cloud/v1/ayah/${selectedAyahForTafsir.number}/${selectedTafsirEdition}`;

    axios.get(tafsirUrl, { timeout: 10000 })
      .then(res => {
        let raw = res.data?.data?.text || "";
        const cleanAyah = selectedAyahForTafsir.text.trim();
        if (raw.startsWith(cleanAyah)) {
          raw = raw.replace(cleanAyah, "").trim();
        }
        setDynamicTafsirText(raw || "لا يتوفر نص تفسير إضافي لهذه الآية في هذه الطبعة.");
      })
      .catch(() => {
        setDynamicTafsirText("تعذر جلب التفسير حالياً. يرجى التأكد من اتصال الإنترنت.");
      })
      .finally(() => {
        setIsTafsirLoading(false);
      });
  }, [selectedAyahForTafsir, selectedTafsirEdition, modalText]);

  const downloadSurahAudio = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (!surah || !('caches' in window)) return;
    
    if (!navigator.onLine) {
      showNotification(isAr ? "أنت غير متصل بالإنترنت. لا يمكن التحميل." : "Offline. Cannot start download.", "warning");
      return;
    }
    
    setIsDownloading(true);
    setDownloadProgress(0);
    
    (async () => {
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
        showNotification(isAr ? "حدث خطأ غير متوقع أثناء التحميل." : "Unexpected error occurred.", "error");
      } finally {
        setIsDownloading(false);
      }
    })();
  };

  useEffect(() => {
    localStorage.setItem("fontSize", fontSize);
  }, [fontSize]);

  const changePage = (newPage) => {
    setIsAnimating(true);
    setActiveAyahMenu(null);
    setTimeout(() => {
      setCurrentPage(newPage);
      setIsAnimating(false);
    }, 300);
  };

  useEffect(() => {
    if (!currentAudio || currentAudio.playSingle) return;
    if (currentAudio.surahId !== surah?.number) return;
    if (!surahPages.length) return;

    const playingAyah = currentAudio.ayahs?.[currentAudio.currentAyahIndex];
    if (!playingAyah) return;

    const targetPageIndex = surahPages.findIndex(
      (pageAyahs) => pageAyahs[0]?.page === playingAyah.page
    );

    if (targetPageIndex !== -1 && targetPageIndex !== currentPage && !isAnimating) {
      changePage(targetPageIndex);
    }
  }, [currentAudio?.currentAyahIndex, currentAudio?.surahId, surahPages]);

  const handleNextPage = () => {
    if (currentPage < surahPages.length - 1) {
      changePage(currentPage + 1);
    } else if (surah?.number < 114) {
      navigate(`/surah/${surah.number + 1}`);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      changePage(currentPage - 1);
    } else if (surah?.number > 1) {
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

  const handlePlaySurahGlobal = (e, startIndex = 0) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (!surah || !surah.ayahs) return;

    const isOffline = !navigator.onLine;
    const isSurahSaved = localStorage.getItem(`offline_audio_saved_${surah.number}_${reciter}`) === 'true' || localStorage.getItem(`offline_audio_full_${reciter}`) === 'true';

    if (isOffline && !isSurahSaved) {
      showNotification(isAr ? "أنت غير متصل بالإنترنت وهذه السورة غير محملة مسبقاً." : "You are offline and this surah is not downloaded.", "error");
      return;
    }

    setIsRadioPlaying(false);

    const currentReciterObj = recitersList?.find(r => r.id === reciter);
    const reciterName = currentReciterObj?.name || reciter;

    if (currentAudio?.surahId === surah.number && currentAudio?.reciterId === reciter && startIndex === 0 && !currentAudio?.playSingle) {
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
        currentAyahIndex: startIndex,
        playSingle: false
      });
      setIsPlaying(true);
    }
  };

  const handlePlaySingleAyah = (ayah) => {
    if (!surah || !ayah) return;

    const isOffline = !navigator.onLine;
    const isSurahSaved = localStorage.getItem(`offline_audio_saved_${surah.number}_${reciter}`) === 'true' || localStorage.getItem(`offline_audio_full_${reciter}`) === 'true';

    if (isOffline && !isSurahSaved) {
      showNotification(isAr ? "أنت غير متصل بالإنترنت وهذه السورة غير محملة مسبقاً." : "You are offline and this surah is not downloaded.", "error");
      return;
    }

    setIsRadioPlaying(false);

    const currentReciterObj = recitersList?.find(r => r.id === reciter);
    const reciterName = currentReciterObj?.name || reciter;
    const targetIndex = surah.ayahs.findIndex(a => a.number === ayah.number);
    const startIndex = targetIndex !== -1 ? targetIndex : 0;

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
      currentAyahIndex: startIndex,
      playSingle: false
    });
    setIsPlaying(true);
    setActiveAyahMenu(null);
  };

  const toggleMemorizationMode = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    setIsMemorizationMode(!isMemorizationMode);
    setRevealedAyahs([]);
    if (isPlaying) {
      setIsPlaying(false);
    }
  };

  const handleAyahClick = (e, ayah) => {
    if (e && e.stopPropagation) e.stopPropagation();

    if (isMemorizationMode) {
      setRevealedAyahs(prev => 
        prev.includes(ayah.number) 
          ? prev.filter(n => n !== ayah.number) 
          : [...prev, ayah.number]
      );
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX || (rect.left + rect.width / 2);
    const clickY = e.clientY || rect.bottom;

    const menuWidth = 190;
    const menuHeight = 175;

    let left = isAr ? (clickX - menuWidth + 20) : (clickX - 20);
    
    if (left < 12) left = 12;
    if (left + menuWidth > window.innerWidth - 12) {
      left = window.innerWidth - menuWidth - 12;
    }

    let top = clickY + 8;
    if (top + menuHeight > window.innerHeight - 20) {
      top = (e.clientY ? clickY - menuHeight - 8 : rect.top - menuHeight - 8);
    }
    if (top < 12) top = 12;

    setMenuPosition({ top, left });
    setActiveAyahMenu(ayah);
  };

  const toggleBookmark = (ayah) => {
    const isBookmarked = bookmarks.some(b => b.surahNumber === surah.number && b.ayahNumberInSurah === ayah.numberInSurah);
    let updated;
    if (isBookmarked) {
      updated = bookmarks.filter(b => !(b.surahNumber === surah.number && b.ayahNumberInSurah === ayah.numberInSurah));
      showNotification(isAr ? "تمت إزالة العلامة المرجعية" : "Bookmark removed", "warning");
    } else {
      const newBookmark = {
        surahNumber: surah.number,
        surahName: surah.name,
        surahEnglishName: surah.englishName,
        ayahNumber: ayah.number,
        ayahNumberInSurah: ayah.numberInSurah,
        page: currentPage,
        date: new Date().toISOString()
      };
      updated = [...bookmarks, newBookmark];
      showNotification(isAr ? "تمت إضافة العلامة المرجعية بنجاح" : "Bookmark saved successfully", "success");
    }
    setBookmarks(updated);
    localStorage.setItem("quran_bookmarks", JSON.stringify(updated));
    setActiveAyahMenu(null);
  };

  const getCardAyahs = () => {
    if (!surah?.ayahs?.length) return [];

    if (cardShareMode === "page") return currentAyahs;

    if (cardShareMode === "range") {
      const start = Math.max(1, Number(cardRangeStart) || 1);
      const maxEnd = Math.min(surah.ayahs.length, start + 9);
      const end = Math.min(maxEnd, Math.max(start, Number(cardRangeEnd) || start));
      return surah.ayahs.filter(
        ayah => ayah.numberInSurah >= start && ayah.numberInSurah <= end
      );
    }

    return selectedAyahForCard ? [selectedAyahForCard] : [];
  };

  const getRangeEndOptions = () => {
    if (!surah?.ayahs?.length) return [];
    const start = Math.max(1, Number(cardRangeStart) || 1);
    const maxEnd = Math.min(surah.ayahs.length, start + 9);
    return surah.ayahs.filter(ayah => ayah.numberInSurah >= start && ayah.numberInSurah <= maxEnd);
  };

  const getRangeStartOptions = () => {
    if (!surah?.ayahs?.length) return [];
    return surah.ayahs;
  };

  const getCardAyahText = (ayah) => {
    if (!ayah || !surah) return "";
    return formatAyahText(ayah.text, ayah.numberInSurah, surah.number);
  };

  const getCardTafsirText = (ayah) => cardTafsirMap[ayah?.number] || "";

  const loadCardTafsir = async () => {
    if (!selectedAyahForCard || !showCardTafsir || !surah) return;

    const ayahs = getCardAyahs();
    if (!ayahs.length) return;

    setIsCardTafsirLoading(true);
    try {
      const nextMap = { ...cardTafsirMap };
      const missing = ayahs.filter(a => !nextMap[a.number]);

      if (selectedTafsirEdition === "ar.muyassar" && modalText) {
        missing.forEach(ayah => {
          const found = modalText.ayahs.find(
            item => item.numberInSurah === ayah.numberInSurah
          )?.text;
          if (found) nextMap[ayah.number] = found;
        });
      } else if (missing.length) {
        const results = await Promise.all(
          missing.map(async ayah => {
            try {
              const res = await axios.get(
                `https://api.alquran.cloud/v1/ayah/${ayah.number}/${selectedTafsirEdition}`,
                { timeout: 10000 }
              );
              let raw = res.data?.data?.text || "";
              const cleanAyah = ayah.text.trim();
              if (raw.startsWith(cleanAyah)) raw = raw.replace(cleanAyah, "").trim();
              return [ayah.number, raw || "لا يتوفر نص تفسير إضافي لهذه الآية في هذه الطبعة."];
            } catch {
              return [ayah.number, "تعذر جلب التفسير حالياً."];
            }
          })
        );
        results.forEach(([number, text]) => { nextMap[number] = text; });
      }

      setCardTafsirMap(nextMap);
    } finally {
      setIsCardTafsirLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedAyahForCard || !showCardTafsir) return;
    loadCardTafsir();
  }, [
    selectedAyahForCard,
    cardShareMode,
    cardRangeStart,
    cardRangeEnd,
    showCardTafsir,
    selectedTafsirEdition,
    modalText
  ]);

  const openAyahCard = (ayah) => {
    setSelectedAyahForCard(ayah);
    setCardShareMode("ayah");
    setCardRangeStart(ayah.numberInSurah);
    setCardRangeEnd(ayah.numberInSurah);
    setShowCardTafsir(false);
    setCardTafsirMap({});
    setIsCardCopied(false);
    setCardRangeDropdown(null);
  };

  const ensureFontsReadyForCard = async () => {
    try {
      await Promise.all([
        document.fonts.load('bold 54px "Amiri"'),
        document.fonts.load('bold 38px "Amiri"'),
        document.fonts.load('bold 32px "Amiri"'),
        document.fonts.load('600 30px "Amiri"'),
      ]);
      await document.fonts.ready;
    } catch (e) {}
  };

  const createCardCanvas = async () => {
    if (!selectedAyahForCard || !surah) return null;
    await ensureFontsReadyForCard();

    const ayahs = getCardAyahs();
    if (!ayahs.length) return null;

    const W = 1080;
    const PAD = 92;
    const maxWidth = W - PAD * 2;
    const GOLD_LIGHT = '#F3D9A4';
    const GOLD = '#D4AF37';
    const GOLD_SOFT = '#E5C158';
    const CREAM = '#FBF3E7';
    const BG_DARK = '#0d0b08';

    const measureCanvas = document.createElement('canvas');
    measureCanvas.width = W;
    measureCanvas.height = 1000;
    const mctx = measureCanvas.getContext('2d');

    const wrapWords = (text, font, width) => {
      mctx.font = font;
      const words = String(text || '').trim().split(/\s+/).filter(Boolean);
      const lines = [];
      let line = '';
      words.forEach(word => {
        const candidate = line ? `${line} ${word}` : word;
        if (line && mctx.measureText(candidate).width > width) {
          lines.push(line);
          line = word;
        } else {
          line = candidate;
        }
      });
      if (line) lines.push(line);
      return lines;
    };

    const markerToken = '¤¤AYAH_MARKER¤¤';
    const combinedQuranText = ayahs
      .map(ayah => `${getCardAyahText(ayah)} ${markerToken}${ayah.numberInSurah}`)
      .join(' ');

    const count = ayahs.length;
    const chars = combinedQuranText.length;
    let quranSize = 54;
    if (count >= 2 || chars > 240) quranSize = 38;
    if (count >= 4 || chars > 900) quranSize = 32;
    if (count >= 7 || chars > 1500) quranSize = 29;
    if (count >= 10 || chars > 2200) quranSize = 27;

    const quranFont = `bold ${quranSize}px "Amiri", "Traditional Arabic", serif`;
    const quranLineHeight = Math.round(quranSize * 2.05);
    const quranLines = wrapWords(combinedQuranText, quranFont, maxWidth);

    const tafsirFontSize = count >= 6 ? 25 : 30;
    const tafsirBlocks = showCardTafsir
      ? ayahs.map(ayah => {
          const text = getCardTafsirText(ayah);
          const font = `600 ${tafsirFontSize}px "Amiri", "Traditional Arabic", serif`;
          return { ayah, text, lines: text ? wrapWords(text, font, maxWidth - 40) : [] };
        })
      : [];

    let contentHeight = quranLines.length * quranLineHeight + 80;
    if (tafsirBlocks.length) {
      contentHeight += 80;
      tafsirBlocks.forEach((block, i) => {
        contentHeight += 44;
        contentHeight += Math.max(1, block.lines.length) * (tafsirFontSize + 25);
        if (i < tafsirBlocks.length - 1) contentHeight += 36;
      });
    }

    const headerHeight = 400;
    const footerHeight = 180;
    const H = headerHeight + contentHeight + footerHeight;

    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, BG_DARK);
    bg.addColorStop(0.45, '#171310');
    bg.addColorStop(1, '#0a0806');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    const glow = ctx.createRadialGradient(W / 2, 160, 10, W / 2, 160, 500);
    glow.addColorStop(0, 'rgba(230,185,129,.22)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, 650);

    ctx.save();
    ctx.globalAlpha = 0.045;
    ctx.strokeStyle = GOLD_SOFT;
    ctx.lineWidth = 1;
    for (let y = 0; y < H + 150; y += 150) {
      for (let x = 0; x < W + 150; x += 150) {
        ctx.beginPath();
        ctx.arc(x + (y / 150 % 2 ? 75 : 0), y, 42, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.restore();

    const emblemBuf = 110;
    const emblemCenter = 55;
    const emblemCanvas = document.createElement('canvas');
    emblemCanvas.width = emblemBuf;
    emblemCanvas.height = emblemBuf;
    const emblemCtx = emblemCanvas.getContext('2d');
    const halfSquare = 22;
    emblemCtx.save();
    emblemCtx.translate(emblemCenter, emblemCenter);
    emblemCtx.fillStyle = GOLD;
    emblemCtx.shadowColor = 'rgba(230,185,129,.8)';
    emblemCtx.shadowBlur = 16;
    emblemCtx.fillRect(-halfSquare, -halfSquare, halfSquare * 2, halfSquare * 2);
    emblemCtx.rotate(Math.PI / 4);
    emblemCtx.fillRect(-halfSquare, -halfSquare, halfSquare * 2, halfSquare * 2);
    emblemCtx.restore();
    emblemCtx.fillStyle = BG_DARK;
    emblemCtx.beginPath();
    emblemCtx.arc(emblemCenter, emblemCenter, 6, 0, Math.PI * 2);
    emblemCtx.fill();

    ctx.drawImage(emblemCanvas, W / 2 - emblemCenter, 80 - emblemCenter);


    const frameX = 72;
    const frameY = 205;
    const frameBottom = H - 125;

    ctx.save();
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(frameX, frameBottom);
    ctx.lineTo(frameX, frameY + 100);
    ctx.quadraticCurveTo(frameX, frameY - 35, W / 2, frameY - 70);
    ctx.quadraticCurveTo(W - frameX, frameY - 35, W - frameX, frameY + 100);
    ctx.lineTo(W - frameX, frameBottom);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(230,185,129,.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(frameX + 20, frameBottom);
    ctx.lineTo(frameX + 20, frameY + 105);
    ctx.quadraticCurveTo(frameX + 20, frameY - 15, W / 2, frameY - 45);
    ctx.quadraticCurveTo(W - frameX - 20, frameY - 15, W - frameX - 20, frameY + 105);
    ctx.lineTo(W - frameX - 20, frameBottom);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.fillStyle = GOLD_LIGHT;
    ctx.font = 'bold 44px "Amiri", "Traditional Arabic", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', W / 2, 315);
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = 'rgba(212,163,115,.55)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(frameX + 90, 360);
    ctx.lineTo(W / 2 - 20, 360);
    ctx.moveTo(W / 2 + 20, 360);
    ctx.lineTo(W - frameX - 90, 360);
    ctx.stroke();
    ctx.fillStyle = GOLD_SOFT;
    ctx.translate(W / 2, 360);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-5, -5, 10, 10);
    ctx.restore();

    const markerRegex = new RegExp(`${markerToken}(\\d+)`, 'g');
    let y = 455;
    ctx.save();
    ctx.font = quranFont;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.direction = 'rtl';
    ctx.fillStyle = CREAM;
    ctx.shadowColor = 'rgba(0,0,0,.5)';
    ctx.shadowBlur = 10;

    quranLines.forEach(line => {
      const parts = [];
      let last = 0;
      let match;
      markerRegex.lastIndex = 0;
      while ((match = markerRegex.exec(line)) !== null) {
        if (match.index > last) parts.push({ type: 'text', value: line.slice(last, match.index) });
        parts.push({ type: 'marker', value: match[1] });
        last = match.index + match[0].length;
      }
      if (last < line.length) parts.push({ type: 'text', value: line.slice(last) });

      if (parts.length === 1 && parts[0].type === 'text') {
        ctx.fillText(parts[0].value.trim(), W / 2, y);
      } else {
        const gap = 10;
        const widths = parts.map(part => {
          if (part.type === 'text') return ctx.measureText(part.value).width;
          return 48;
        });
        const totalWidth = widths.reduce((a, b) => a + b, 0) + gap * Math.max(0, parts.length - 1);
        let cursor = (W + totalWidth) / 2;

        parts.forEach((part, index) => {
          const partWidth = widths[index];
          const center = cursor - partWidth / 2;
          if (part.type === 'text') {
            ctx.fillText(part.value, center, y);
          } else {
            ctx.save();
            ctx.shadowBlur = 0;
            ctx.strokeStyle = GOLD_LIGHT;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(center, y - quranSize * 0.34, 22, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = GOLD_LIGHT;
            ctx.font = `600 ${Math.max(16, Math.round(quranSize * 0.42))}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(part.value, center, y - quranSize * 0.34);
            ctx.restore();
            ctx.font = quranFont;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'alphabetic';
            ctx.direction = 'rtl';
            ctx.fillStyle = CREAM;
          }
          cursor -= partWidth + gap;
        });
      }
      y += quranLineHeight;
    });
    ctx.restore();

    y += 25;
    ctx.save();
    ctx.fillStyle = GOLD_LIGHT;
    ctx.font = '600 28px "Amiri", "Traditional Arabic", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const cleanSurah = surah.name.replace('سُورَةُ ', '');
    const refText = cardShareMode === 'page'
      ? `سورة ${cleanSurah} · صفحة ${realMushafPage || currentPage + 1}`
      : cardShareMode === 'range'
        ? `سورة ${cleanSurah} · آيات ${cardRangeStart} - ${Math.min(cardRangeEnd, Number(cardRangeStart) + 9)}`
        : `سورة ${cleanSurah} · آية ${selectedAyahForCard.numberInSurah}`;
    ctx.fillText(refText, W / 2, y);
    ctx.restore();
    y += 70;

    if (tafsirBlocks.length) {
      ctx.save();
      ctx.strokeStyle = 'rgba(230,185,129,.3)';
      ctx.beginPath();
      ctx.moveTo(W / 2 - 70, y);
      ctx.lineTo(W / 2 + 70, y);
      ctx.stroke();
      ctx.restore();
      y += 50;

      ctx.save();
      ctx.fillStyle = GOLD_LIGHT;
      ctx.font = 'bold 30px "Amiri", "Traditional Arabic", serif';
      ctx.textAlign = 'center';
      ctx.fillText(tafsirEditionsList.find(e => e.id === selectedTafsirEdition)?.name || 'التفسير', W / 2, y);
      ctx.restore();
      y += 55;

      tafsirBlocks.forEach((block, index) => {
        if (!block.lines.length) return;
        ctx.save();
        ctx.fillStyle = 'rgba(243,217,164,.72)';
        ctx.font = '600 24px "Amiri", "Traditional Arabic", serif';
        ctx.textAlign = 'right';
        ctx.direction = 'rtl';
        ctx.fillText(`آية ${block.ayah.numberInSurah}`, W - PAD - 10, y);
        y += 38;
        ctx.fillStyle = 'rgba(251,243,231,.88)';
        ctx.font = `600 ${tafsirFontSize}px "Amiri", "Traditional Arabic", serif`;
        block.lines.forEach(line => {
          ctx.fillText(line, W - PAD, y);
          y += tafsirFontSize + 25;
        });
        ctx.restore();
        if (index < tafsirBlocks.length - 1) y += 35;
      });
    }

    ctx.save();
    ctx.fillStyle = 'rgba(243,217,164,.65)';
    ctx.font = '600 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.direction = 'ltr';
    ctx.fillText('اقرأ  •  Iqraa', W / 2, H - 70);
    ctx.restore();

    return canvas;
  };

  const getCardFileName = () => {
    const cleanSurahName = surah?.name?.replace('سُورَةُ ', '') || 'Quran';
    if (cardShareMode === 'page') return `Iqraa-${cleanSurahName}-page-${realMushafPage || currentPage + 1}.png`;
    if (cardShareMode === 'range') return `Iqraa-${cleanSurahName}-ayah-${cardRangeStart}-${cardRangeEnd}.png`;
    return `Iqraa-${cleanSurahName}-ayah-${selectedAyahForCard?.numberInSurah}.png`;
  };

  const handleDownloadCardImage = async () => {
    if (!selectedAyahForCard || !surah) return;
    setIsGeneratingImage(true);
    try {
      const canvas = await createCardCanvas();
      if (!canvas) return;
      const link = document.createElement('a');
      link.download = getCardFileName();
      link.href = canvas.toDataURL('image/png', 1);
      link.click();
      showNotification(isAr ? 'تم تحميل الكارت كصورة بنجاح!' : 'Card image downloaded!', 'success');
    } catch (e) {
      showNotification(isAr ? 'حدث خطأ أثناء تحميل الصورة' : 'Error generating image', 'error');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleCopyCardText = () => {
    if (!selectedAyahForCard || !surah) return;
    const ayahs = getCardAyahs();
    const text = ayahs
      .map(ayah => `﴿ ${getCardAyahText(ayah)} ۝${ayah.numberInSurah}`)
      .join(' ');
    navigator.clipboard.writeText(text);
    setIsCardCopied(true);
    setTimeout(() => setIsCardCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    if (!selectedAyahForCard || !surah) return;
    setIsGeneratingImage(true);
    try {
      const canvas = await createCardCanvas();
      if (!canvas) return;
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 1));
      if (!blob) throw new Error('Could not create image');
      const file = new File([blob], getCardFileName(), { type: 'image/png' });

      if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
        await navigator.share({
          title: `كارت من سورة ${surah.name.replace('سُورَةُ ', '')}`,
          files: [file]
        });
      } else {
        const link = document.createElement('a');
        link.download = getCardFileName();
        link.href = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(link.href);
        showNotification(isAr ? 'المشاركة كصورة غير مدعومة هنا، تم تحميل الصورة.' : 'Image sharing is not supported here; the image was downloaded.', 'warning');
      }
    } catch (err) {
      if (err?.name !== 'AbortError') {
        showNotification(isAr ? 'تعذر مشاركة الكارت كصورة.' : 'Could not share the card image.', 'error');
      }
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const renderFormattedTafsir = (text) => {
    if (!text) return null;

    const paragraphs = text
      .split(/(?:\r?\n)+|(?<=[.؛])\s+(?=[«"(A-Za-z\u0600-\u06FF])/)
      .map(p => p.trim())
      .filter(p => p.length > 0);

    return paragraphs.map((para, idx) => (
      <p 
        key={idx} 
        className={`mb-4 leading-[2.4] text-justify text-base md:text-lg font-medium transition-colors ${
          isDarkMode ? "text-gray-100" : "text-[#2b241d]"
        }`}
      >
        {para}
      </p>
    ));
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
        <div className={`w-24 h-24 mb-6 rounded-full flex items-center justify-center ${isDarkMode ? "bg-gray-800 text-[#E5C158]" : "bg-white border-[#F0EBE1] border text-[#D4AF37] shadow-md"}`}>
          <WifiOff size={48} />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold mb-4">{t.offlineTitle}</h2>
        <p className="text-gray-500 mb-8 max-w-sm leading-relaxed">{t.offlineDesc}</p>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <button 
            onClick={() => setRetryCount(prev => prev + 1)}
            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-full font-bold transition-all shadow-sm ${isDarkMode ? "bg-gray-800 text-[#E5C158] border border-gray-700 hover:bg-gray-700" : "bg-white text-[#D4AF37] border border-[#F0EBE1] hover:bg-gray-50"}`}
          >
            <RefreshCw size={20} />
            {t.retry}
          </button>

          <button 
            onClick={() => navigate("/")}
            className={`flex items-center justify-center gap-2 px-8 py-3 rounded-full font-bold transition-all shadow-md ${isDarkMode ? "bg-[#E5C158] text-gray-900 hover:bg-[#D4AF37]" : "bg-[#D4AF37] text-white hover:bg-[#B8942E]"}`}
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
      <div className={`flex justify-center items-center min-h-screen font-bold text-xl font-sans ${isDarkMode ? "bg-gray-900 text-[#E5C158]" : "bg-[#FDFBF7] text-[#D4AF37]"}`}>
        {t.loading}
      </div>
    );
  }

  const totalPages = surahPages.length;
  const currentAyahs = surahPages[currentPage] || [];
  const currentReciterName = recitersList.find(r => r.id === reciter)?.name;
  const realMushafPage = currentAyahs[0]?.page;
  const currentJuz = currentAyahs[0]?.juz;
  const themeColor = isDarkMode ? "#E5C158" : "#D4AF37";

  return (
    <div className="max-w-4xl mx-auto p-2 md:p-6 pt-2 md:pt-6 pb-32" dir={isAr ? "rtl" : "ltr"}>

      {toast.show && (
        <div className={`fixed bottom-24 left-1/2 transform -translate-x-1/2 z-[120] flex items-center gap-3 px-6 py-3.5 rounded-full shadow-2xl transition-all duration-300 ${
          toast.type === 'error' ? 'bg-red-500 text-white' : 
          toast.type === 'warning' ? 'bg-amber-600 text-white' : 
          'bg-green-600 text-white'
        }`} dir={isAr ? 'rtl' : 'ltr'}>
          {toast.type === 'error' ? <WifiOff size={20} /> : 
           toast.type === 'warning' ? <AlertTriangle size={20} /> : 
           <CheckCircle size={20} />}
          <span className={`font-bold text-sm md:text-base whitespace-nowrap ${!isAr && 'font-sans'}`}>{toast.message}</span>
        </div>
      )}

      <div className="relative z-30 flex flex-col md:flex-row gap-3 md:gap-4 items-center justify-between mb-6 px-2 w-full">
        <h2 className={`text-xl md:text-3xl font-bold w-full ${isAr ? 'text-right font-quran' : 'text-left font-serif tracking-wide'} md:w-auto ${isDarkMode ? "text-[#E5C158]" : "text-[#D4AF37]"}`}>
          {isAr ? surah?.name : surah?.englishName}
        </h2>

        <div className="flex flex-nowrap items-center justify-between gap-1 md:gap-3 overflow-x-auto scrollbar-none w-full md:w-auto py-0.5 px-0.5">
          
          <button 
            onClick={(e) => handlePlaySurahGlobal(e, 0)}
            className={`flex flex-shrink-0 items-center justify-center gap-1 md:gap-2 px-2 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl font-bold transition-all shadow-sm whitespace-nowrap ${!isAr && 'font-sans'} ${
              isCurrentAudioSurah && isPlaying && !currentAudio?.playSingle
                ? "bg-red-50 text-red-500 border border-red-200 hover:bg-red-100" 
                : "bg-[#D4AF37] text-white hover:bg-[#B8942E]"
            }`}
          >
            {isCurrentAudioSurah && isPlaying && !currentAudio?.playSingle ? <PauseCircle size={15} className="md:w-[18px] md:h-[18px]" /> : <PlayCircle size={15} className="md:w-[18px] md:h-[18px]" />}
            <span className="text-[10px] md:text-sm">{isCurrentAudioSurah && isPlaying && !currentAudio?.playSingle ? t.pause : t.play}</span>
          </button>

          <div className="relative flex-shrink-0">
            <button 
              ref={reciterBtnRef}
              onClick={(e) => {
                e.stopPropagation();
                if (!isDropdownOpen && reciterBtnRef.current) {
                  const rect = reciterBtnRef.current.getBoundingClientRect();
                  const dropdownWidth = 192;
                  const margin = 10;
                  let left = rect.left + rect.width / 2 - dropdownWidth / 2;
                  left = Math.max(margin, Math.min(left, window.innerWidth - dropdownWidth - margin));
                  setDropdownPos({ top: rect.bottom + 8, left });
                }
                setIsDropdownOpen(!isDropdownOpen);
              }}
              className={`flex items-center justify-center gap-1 md:gap-2 px-2 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl font-medium text-[10px] md:text-sm transition-all shadow-sm border whitespace-nowrap ${!isAr && 'font-sans'} ${
                isDarkMode 
                  ? "bg-gray-800 border-gray-700 text-gray-200 hover:border-[#E5C158]" 
                  : "bg-white border-[#F0EBE1] text-gray-700 hover:border-[#D4AF37]"
              }`}
            >
              <span className="truncate max-w-[46px] md:max-w-none">{currentReciterName}</span>
              <ChevronDown size={13} className={`transition-transform duration-300 flex-shrink-0 md:w-4 md:h-4 ${isDropdownOpen ? "rotate-180" : ""} ${isDarkMode ? "text-[#E5C158]" : "text-[#D4AF37]"}`} />
            </button>

            {isDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
                <div
                  className={`fixed w-52 max-h-[384px] overflow-y-auto overscroll-contain scrollbar-thin rounded-2xl shadow-2xl z-50 border ${!isAr && 'font-sans'} ${
                    isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-[#F0EBE1]"
                  }`}
                  style={{ top: dropdownPos.top, left: dropdownPos.left }}
                >
                  {recitersList.map((r) => {
                    const isFullDownloaded = localStorage.getItem(`offline_audio_full_${r.id}`) === 'true';
                    return (
                      <button
                        key={r.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setReciter(r.id);
                          setIsDropdownOpen(false);
                          if (isPlaying) setIsPlaying(false);
                        }}
                        className={`w-full ${isAr ? 'text-right' : 'text-left'} px-4 py-3 text-sm transition-colors min-h-[48px] flex items-center justify-between gap-3 ${
                          reciter === r.id 
                            ? (isDarkMode ? `bg-gray-900 text-[#E5C158] font-bold ${isAr ? 'border-r-4' : 'border-l-4'} border-[#E5C158]` : `bg-[#FDFBF7] text-[#D4AF37] font-bold ${isAr ? 'border-r-4' : 'border-l-4'} border-[#D4AF37]`) 
                            : (isDarkMode ? "text-gray-300 hover:bg-gray-700 hover:text-[#E5C158]" : "text-gray-600 hover:bg-gray-50 hover:text-[#D4AF37]")
                        }`}
                      >
                        <span>{r.name}</span>
                        {isFullDownloaded && <CheckCircle size={17} className="text-green-500 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {isDownloaded ? (
            <button 
              className={`flex flex-shrink-0 items-center gap-1 p-1.5 md:p-2 rounded-lg md:rounded-xl shadow-sm border transition-colors cursor-default ${isDarkMode ? "bg-green-900/30 border-green-800 text-green-400" : "bg-green-50 border-green-200 text-green-600"}`}
              title={isAr ? `محملة بصوت ${currentReciterName}` : `Downloaded (${currentReciterName})`}
            >
              <CheckCircle size={16} className="md:w-5 md:h-5" />
            </button>
          ) : (
            <button 
              onClick={downloadSurahAudio}
              disabled={isDownloading}
              className={`flex flex-shrink-0 items-center gap-1 p-1.5 md:p-2 rounded-lg md:rounded-xl shadow-sm border transition-colors ${
                isDownloading 
                  ? (isDarkMode ? "bg-gray-800 border-gray-700 text-[#E5C158]" : "bg-gray-50 border-gray-200 text-[#D4AF37]") 
                  : (isDarkMode ? "bg-gray-800 border-gray-700 text-gray-300 hover:text-[#E5C158]" : "bg-white border-[#F0EBE1] text-gray-500 hover:text-[#D4AF37]")
              }`}
              title={isAr ? "تحميل للاستماع أوفلاين" : "Download for offline"}
            >
              {isDownloading ? (
                <>
                  <RefreshCw size={16} className="animate-spin md:w-5 md:h-5" />
                  <span className="text-[9px] md:text-[10px] font-bold px-1">{downloadProgress}%</span>
                </>
              ) : (
                <Download size={16} className="md:w-5 md:h-5" />
              )}
            </button>
          )}

          <button 
            onClick={toggleMemorizationMode}
            className={`flex-shrink-0 p-1.5 md:p-2 rounded-lg md:rounded-xl shadow-sm border transition-colors ${
              isMemorizationMode 
                ? "bg-[#D4AF37] text-white border-[#D4AF37]" 
                : (isDarkMode ? "bg-gray-800 border-gray-700 text-gray-300 hover:text-[#E5C158]" : "bg-white border-[#F0EBE1] text-gray-500 hover:text-[#D4AF37]")
            }`}
            title={t.memorize}
          >
            <Brain size={16} className="md:w-5 md:h-5" />
          </button>

          <button 
            onClick={(e) => {
              e.stopPropagation();
              setShowSettings(true);
            }}
            className={`flex-shrink-0 p-1.5 md:p-2 rounded-lg md:rounded-xl shadow-sm border transition-colors ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-300 hover:text-[#E5C158]" : "bg-white border-[#F0EBE1] text-gray-500 hover:text-[#D4AF37]"}`}
          >
            <Settings size={16} className="md:w-5 md:h-5" />
          </button>

          <button 
            onClick={() => navigate("/")}
            className={`flex-shrink-0 p-1.5 md:p-2 rounded-lg md:rounded-xl shadow-sm border transition-colors ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-300 hover:text-[#E5C158]" : "bg-white border-[#F0EBE1] text-gray-500 hover:text-[#D4AF37]"}`}
          >
            <BackIcon size={16} className="md:w-5 md:h-5" />
          </button>
        </div>
      </div>

      <div 
        className={`px-4 md:px-12 py-8 rounded-2xl md:rounded-3xl shadow-lg border transition-colors duration-300 min-h-[75vh] flex flex-col justify-between ${
          isDarkMode ? "bg-gray-800 border-gray-700" : "bg-[#FDFBF7] border-[#F0EBE1]"
        }`}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        
        <div className={`flex justify-between items-center w-full pb-2 mb-4 border-b-2 ${!isAr && 'font-sans'} ${
          isDarkMode ? "border-gray-700 text-gray-400" : "border-[#D4AF37]/30 text-gray-400"
        } font-bold text-sm md:text-base`}>
          <span>{isAr ? surah?.name : surah?.englishName}</span>
          <span>{t.juz} {currentJuz}</span>
        </div>

        <div className={`transition-opacity duration-300 ease-in-out text-center flex-1 ${isAnimating ? "opacity-0" : "opacity-100"}`}>
          {currentAyahs.some(a => a.numberInSurah === 1) && (
            <>
              <div className="relative flex items-center justify-center mb-8 mt-2 mx-auto w-[260px] h-[60px] md:w-[380px] md:h-[80px]">
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
                  <h2 className={`text-2xl md:text-3xl font-bold ${isAr ? 'font-quran' : 'font-serif tracking-wide'} pt-1 ${isDarkMode ? "text-[#E5C158]" : "text-[#D4AF37]"}`}>
                    {isAr ? surah?.name : surah?.englishName}
                  </h2>
                </div>
              </div>

              {surah?.number !== 1 && surah?.number !== 9 && (
                <div className={`text-center ${isAr ? 'text-2xl md:text-3xl' : 'text-xl md:text-2xl'} mb-6 md:mb-8 ${isAr ? 'font-quran' : 'font-serif font-medium tracking-wide'} ${isDarkMode ? "text-[#E5C158]" : "text-[#D4AF37]"}`}>
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
              lineHeight: isAr ? '2.4' : '1.8'
            }}
          >
            {currentAyahs.map((ayah) => {
              const globalAyahIndex = surah?.ayahs.findIndex(a => a.number === ayah.number);
              const isAyahPlaying = isCurrentAudioSurah && isPlaying && (
                currentAudio?.playSingle 
                  ? currentAudio?.ayahs?.[0]?.number === ayah.number 
                  : currentAudio?.currentAyahIndex === globalAyahIndex
              );
              
              const isRevealed = revealedAyahs.includes(ayah.number);
              const isHidden = isMemorizationMode && !isRevealed; 
              const cleanAyahText = formatAyahText(ayah.text, ayah.numberInSurah, surah?.number);
              const isTargetAyah = location.state?.startAyah === ayah.numberInSurah;
              const isBookmarked = bookmarks.some(b => b.surahNumber === surah?.number && b.ayahNumberInSurah === ayah.numberInSurah);
              const isMenuActive = activeAyahMenu?.numberInSurah === ayah.numberInSurah;

              return (
                <span 
                  key={ayah.numberInSurah}
                  onClick={(e) => handleAyahClick(e, ayah)} 
                  className={`transition-all duration-300 cursor-pointer inline rounded px-1 py-0.5 ${
                    isAyahPlaying 
                      ? (isDarkMode ? "text-[#E5C158] bg-[#E5C158]/15 font-bold rounded-lg" : "text-[#D4AF37] bg-[#D4AF37]/15 font-bold rounded-lg") 
                      : isMenuActive
                        ? (isDarkMode ? "text-[#E5C158] bg-[#E5C158]/25 font-bold rounded-lg shadow-sm" : "text-[#D4AF37] bg-[#D4AF37]/25 font-bold rounded-lg shadow-sm")
                        : (isDarkMode ? "text-gray-200 hover:text-[#E5C158]" : "text-gray-800 hover:text-[#D4AF37]")
                  } ${isHidden ? "blur-[6px] opacity-40 select-none" : ""} ${isTargetAyah && !isMemorizationMode ? (isDarkMode ? "bg-[#E5C158]/20 rounded-lg" : "bg-[#D4AF37]/20 rounded-lg") : ""}`}
                  style={{ fontSize: `${fontSize}px` }}
                >
                  {cleanAyahText}
                  
                  <span 
                    className={`inline-flex items-center justify-center mx-1.5 md:mx-2 rounded-full font-sans border-[2.5px] border-double transition-all relative ${
                      isAyahPlaying || isMenuActive
                        ? "bg-[#D4AF37] text-white border-[#D4AF37] scale-105 shadow-sm" 
                        : isBookmarked
                          ? (isDarkMode ? "bg-amber-950/60 text-[#E5C158] border-[#E5C158]" : "bg-amber-100 text-[#D4AF37] border-[#D4AF37]")
                          : (isDarkMode ? "text-[#E5C158] border-[#E5C158]" : "text-[#D4AF37] border-[#D4AF37]")
                    } ${isHidden ? "opacity-0" : "opacity-100"}`}
                    style={{ 
                      width: `${fontSize * (isAr ? 1.3 : 1.1)}px`, 
                      height: `${fontSize * (isAr ? 1.3 : 1.1)}px`, 
                      fontSize: `${fontSize * 0.45}px`,
                      transform: isAr ? 'translateY(-2px)' : 'translateY(-1px)'
                    }}
                  >
                    {ayah.numberInSurah}
                    {isBookmarked && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border border-white dark:border-gray-900 animate-pulse" />
                    )}
                  </span>
                </span>
              );
            })}
          </div>
        </div>

        <div className={`flex items-center justify-between mt-8 md:mt-10 pt-4 border-t ${isDarkMode ? "border-gray-700" : "border-[#F0EBE1]/60"}`}>
          <button
            onClick={handlePrevPage}
            disabled={surah?.number === 1 && currentPage === 0}
            className={`flex items-center gap-1 md:gap-2 px-3 py-2 rounded-xl font-bold text-xs md:text-sm transition-all ${!isAr && 'font-sans'} ${
              surah?.number === 1 && currentPage === 0
                ? "opacity-50 cursor-not-allowed text-gray-400" 
                : (isDarkMode ? "text-[#E5C158] hover:bg-gray-700" : "text-[#D4AF37] hover:bg-[#f4efe6]")
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
            disabled={surah?.number === 114 && currentPage === totalPages - 1}
            className={`flex items-center gap-1 md:gap-2 px-3 py-2 rounded-xl font-bold text-xs md:text-sm transition-all ${!isAr && 'font-sans'} ${
              surah?.number === 114 && currentPage === totalPages - 1
                ? "opacity-50 cursor-not-allowed text-gray-400" 
                : (isDarkMode ? "text-[#E5C158] hover:bg-gray-700" : "text-[#D4AF37] hover:bg-[#f4efe6]")
            }`}
          >
            <span>{currentPage === totalPages - 1 ? t.nextSurah : t.nextPage}</span>
            <NextPageIcon size={18} />
          </button>
        </div>
      </div>

      {activeAyahMenu && (
        <>
          <div 
            className="fixed inset-0 z-[9998] bg-transparent"
            onClick={() => setActiveAyahMenu(null)}
          />

          <div 
            style={{ top: `${menuPosition.top}px`, left: `${menuPosition.left}px` }}
            onClick={(e) => e.stopPropagation()}
            className={`fixed z-[9999] w-48 rounded-2xl shadow-[0_10px_35px_rgba(212,163,115,0.25)] dark:shadow-[0_15px_40px_rgba(0,0,0,0.7)] border backdrop-blur-xl transform transition-all animate-in fade-in zoom-in-95 duration-150 overflow-hidden ${
              isDarkMode 
                ? "bg-gray-900/95 border-[#E5C158]/40 text-gray-100 divide-y divide-gray-800" 
                : "bg-white/95 border-[#D4AF37]/40 text-gray-800 divide-y divide-[#F0EBE1]"
            }`}
            dir={isAr ? "rtl" : "ltr"}
          >
            <button
              onClick={() => {
                openAyahCard(activeAyahMenu);
                setActiveAyahMenu(null);
              }}
              className={`w-full flex items-center justify-between px-4 py-3 font-bold text-xs md:text-sm transition-colors ${
                isDarkMode ? 'hover:bg-gray-800 text-gray-200 hover:text-[#E5C158]' : 'hover:bg-[#FDFBF7] text-gray-700 hover:text-[#D4AF37]'
              }`}
            >
              <span>{t.shareCard}</span>
              <Sparkles size={16} className={isDarkMode ? 'text-[#E5C158]' : 'text-[#D4AF37]'} />
            </button>

            <button
              onClick={() => {
                setSelectedAyahForTafsir(activeAyahMenu);
                setActiveAyahMenu(null);
              }}
              className={`w-full flex items-center justify-between px-4 py-3 font-bold text-xs md:text-sm transition-colors ${
                isDarkMode ? 'hover:bg-gray-800 text-gray-200 hover:text-[#E5C158]' : 'hover:bg-[#FDFBF7] text-gray-700 hover:text-[#D4AF37]'
              }`}
            >
              <span>{t.showTafsir}</span>
              <BookOpen size={16} className={isDarkMode ? 'text-[#E5C158]' : 'text-[#D4AF37]'} />
            </button>

            <button
              onClick={() => handlePlaySingleAyah(activeAyahMenu)}
              className={`w-full flex items-center justify-between px-4 py-3 font-bold text-xs md:text-sm transition-colors ${
                isDarkMode ? 'hover:bg-gray-800 text-gray-200 hover:text-[#E5C158]' : 'hover:bg-[#FDFBF7] text-gray-700 hover:text-[#D4AF37]'
              }`}
            >
              <span>{t.listenAyah}</span>
              <Volume2 size={16} className={isDarkMode ? 'text-[#E5C158]' : 'text-[#D4AF37]'} />
            </button>

            <button
              onClick={() => toggleBookmark(activeAyahMenu)}
              className={`w-full flex items-center justify-between px-4 py-3 font-bold text-xs md:text-sm transition-colors ${
                isDarkMode ? 'hover:bg-gray-800 text-gray-200 hover:text-[#E5C158]' : 'hover:bg-[#FDFBF7] text-gray-700 hover:text-[#D4AF37]'
              }`}
            >
              <span>
                {bookmarks.some(b => b.surahNumber === surah?.number && b.ayahNumberInSurah === activeAyahMenu.numberInSurah)
                  ? t.removeBookmark
                  : t.addBookmark}
              </span>
              {bookmarks.some(b => b.surahNumber === surah?.number && b.ayahNumberInSurah === activeAyahMenu.numberInSurah) ? (
                <BookmarkCheck size={16} className="text-amber-500" />
              ) : (
                <Bookmark size={16} className={isDarkMode ? 'text-[#E5C158]' : 'text-[#D4AF37]'} />
              )}
            </button>
          </div>
        </>
      )}

      {selectedAyahForCard && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center p-3 md:p-4 bg-black/80 backdrop-blur-md"
          onClick={() => setSelectedAyahForCard(null)}
        >
          <div
            className="w-full max-w-lg max-h-[95vh] overflow-y-auto flex flex-col gap-3.5 scrollbar-none"
            onClick={e => e.stopPropagation()}
            dir={isAr ? "rtl" : "ltr"}
          >
            <div className="w-full flex items-center justify-between px-1">
              <h3 className="text-white font-bold text-lg font-quran">{t.shareCard}</h3>
              <button
                onClick={() => { setSelectedAyahForCard(null); setCardRangeDropdown(null); }}
                className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="w-full p-3 rounded-3xl bg-[#11110f]/95 border border-[#D4A373]/30 shadow-2xl">
              <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-white/5 border border-white/10">
                {[
                  { id: 'ayah', label: t.singleAyah },
                  { id: 'range', label: t.multipleAyahs },
                  { id: 'page', label: t.fullPage }
                ].map(option => (
                  <button
                    key={option.id}
                    onClick={() => {
                      setCardShareMode(option.id);
                      setCardRangeDropdown(null);
                      if (option.id === 'range') {
                        setCardRangeStart(selectedAyahForCard.numberInSurah);
                        setCardRangeEnd(selectedAyahForCard.numberInSurah);
                      }
                      setCardTafsirMap({});
                    }}
                    className={`px-2 py-2.5 rounded-xl text-[11px] md:text-xs font-bold transition-all ${
                      cardShareMode === option.id ? 'bg-[#D4A373] text-white shadow-md' : 'text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {cardShareMode === 'range' && (
                <div className="mt-3 rounded-2xl bg-white/[0.035] border border-white/10 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-300">{isAr ? 'نطاق الآيات' : 'Ayah range'}</span>
                  </div>

                  <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
                    <div className="relative">
                      <span className="block text-[10px] font-bold text-gray-500 mb-1.5">{t.fromAyah}</span>
                      <button
                        type="button"
                        onClick={() => setCardRangeDropdown(prev => prev === 'start' ? null : 'start')}
                        className="w-full h-11 flex items-center justify-between gap-2 px-3 rounded-xl bg-[#181714] border border-white/10 text-[#F3D9A4] font-bold text-sm hover:border-[#D4A373]/60 transition-all"
                      >
                        <span>{cardRangeStart}</span>
                        <ChevronDown size={16} className={`text-[#E5C158] transition-transform ${cardRangeDropdown === 'start' ? 'rotate-180' : ''}`} />
                      </button>
                      {cardRangeDropdown === 'start' && (
                        <div className="absolute top-[68px] inset-x-0 z-[80] max-h-52 overflow-y-auto rounded-2xl bg-[#171613] border border-[#D4A373]/40 shadow-2xl p-1.5">
                          {getRangeStartOptions().map(ayah => (
                            <button
                              key={ayah.number}
                              type="button"
                              onClick={() => {
                                const value = ayah.numberInSurah;
                                const nextEnd = Math.min(Math.max(cardRangeEnd, value), value + 9, surah.ayahs.length);
                                setCardRangeStart(value);
                                setCardRangeEnd(nextEnd);
                                setCardRangeDropdown(null);
                                setCardTafsirMap({});
                              }}
                              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold transition-colors ${cardRangeStart === ayah.numberInSurah ? 'bg-[#D4A373]/20 text-[#F3D9A4]' : 'text-gray-300 hover:bg-white/5 hover:text-[#F3D9A4]'}`}
                            >
                              <span>آية {ayah.numberInSurah}</span>
                              {cardRangeStart === ayah.numberInSurah && <Check size={15} className="text-[#E5C158]" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pb-2 text-[#D4A373]">←</div>

                    <div className="relative">
                      <span className="block text-[10px] font-bold text-gray-500 mb-1.5">{t.toAyah}</span>
                      <button
                        type="button"
                        onClick={() => setCardRangeDropdown(prev => prev === 'end' ? null : 'end')}
                        className="w-full h-11 flex items-center justify-between gap-2 px-3 rounded-xl bg-[#181714] border border-white/10 text-[#F3D9A4] font-bold text-sm hover:border-[#D4A373]/60 transition-all"
                      >
                        <span>{cardRangeEnd}</span>
                        <ChevronDown size={16} className={`text-[#E5C158] transition-transform ${cardRangeDropdown === 'end' ? 'rotate-180' : ''}`} />
                      </button>
                      {cardRangeDropdown === 'end' && (
                        <div className="absolute top-[68px] inset-x-0 z-[80] max-h-52 overflow-y-auto rounded-2xl bg-[#171613] border border-[#D4A373]/40 shadow-2xl p-1.5">
                          {getRangeEndOptions().map(ayah => (
                            <button
                              key={ayah.number}
                              type="button"
                              onClick={() => {
                                setCardRangeEnd(ayah.numberInSurah);
                                setCardRangeDropdown(null);
                                setCardTafsirMap({});
                              }}
                              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold transition-colors ${cardRangeEnd === ayah.numberInSurah ? 'bg-[#D4A373]/20 text-[#F3D9A4]' : 'text-gray-300 hover:bg-white/5 hover:text-[#F3D9A4]'}`}
                            >
                              <span>آية {ayah.numberInSurah}</span>
                              {cardRangeEnd === ayah.numberInSurah && <Check size={15} className="text-[#E5C158]" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 text-center text-[11px] text-gray-500">
                    {isAr ? `تم اختيار ${Math.min(10, Math.max(1, cardRangeEnd - cardRangeStart + 1))} من 10 آيات كحد أقصى` : `${Math.min(10, Math.max(1, cardRangeEnd - cardRangeStart + 1))} of 10 maximum ayahs selected`}
                  </div>
                </div>
              )}

              {cardShareMode === 'page' && (
                <div className="mt-3 px-3 py-2.5 rounded-2xl bg-[#D4A373]/10 border border-[#D4A373]/20 text-center text-xs font-bold text-[#F3D9A4]">
                  {t.pageAyahs}: {currentAyahs[0]?.numberInSurah} → {currentAyahs[currentAyahs.length - 1]?.numberInSurah}
                </div>
              )}

              <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-white/5 border border-white/10 px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <BookOpen size={17} className="text-[#E5C158]" />
                  <span className="text-xs md:text-sm font-bold text-gray-200">{t.showCardTafsir}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCardTafsir(prev => !prev)}
                  className={`relative w-12 h-7 rounded-full border transition-all ${showCardTafsir ? 'bg-[#D4A373] border-[#D4A373]' : 'bg-gray-700 border-gray-600'}`}
                  aria-pressed={showCardTafsir}
                >
                  <span className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-all ${showCardTafsir ? 'right-1' : 'left-1'}`} />
                </button>
              </div>

              {showCardTafsir && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[11px] text-gray-500 whitespace-nowrap">{t.tafsirSource}</span>
                  <div className="flex-1 flex gap-1 overflow-x-auto scrollbar-none">
                    {tafsirEditionsList.map(ed => (
                      <button
                        key={ed.id}
                        onClick={() => {
                          setSelectedTafsirEdition(ed.id);
                          setCardTafsirMap({});
                        }}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-bold whitespace-nowrap transition-all ${
                          selectedTafsirEdition === ed.id ? 'bg-[#E5C158] text-gray-900' : 'bg-white/5 text-gray-300 border border-white/10'
                        }`}
                      >
                        {ed.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="w-full shrink-0 rounded-[2rem] shadow-[0_25px_60px_-15px_rgba(212,163,115,0.35)] border border-[#D4A373]/50 bg-gradient-to-b from-[#171310] via-[#0d0b08] to-[#0a0806] overflow-hidden">
              <div className="p-7 text-center relative">
                <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{
                  backgroundImage: 'repeating-linear-gradient(45deg, #E6B981 0, #E6B981 1px, transparent 1px, transparent 26px), repeating-linear-gradient(-45deg, #E6B981 0, #E6B981 1px, transparent 1px, transparent 26px)'
                }} />
                <div className="relative z-10">
                  <div className="flex justify-center mb-3">
                    <div className="relative w-10 h-10 flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full bg-[#E6B981]/15 blur-md" />
                      <svg viewBox="0 0 24 24" width="22" height="22" className="relative z-10 drop-shadow-[0_0_8px_rgba(230,185,129,0.6)]">
                        <rect x="3" y="3" width="18" height="18" fill="#F3D9A4" />
                        <rect x="3" y="3" width="18" height="18" fill="#F3D9A4" transform="rotate(45 12 12)" />
                        <circle cx="12" cy="12" r="2.6" fill="#171310" />
                      </svg>
                    </div>
                  </div>
                  <div className="text-lg font-bold text-[#F3D9A4] font-quran mb-3">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
                  <div className="flex items-center gap-2 max-w-[78%] mx-auto mb-6">
                    <div className="flex-1 h-px bg-[#D4A373]/60" />
                    <div className="w-1.5 h-1.5 rotate-45 bg-[#E6B981]" />
                    <div className="flex-1 h-px bg-[#D4A373]/60" />
                  </div>

                  {}
                  <p
                    className="font-quran font-bold text-[#FBF3E7] text-justify px-1"
                    style={{
                      direction: 'rtl',
                      textAlignLast: 'center',
                      lineHeight: getCardAyahs().length >= 7 ? 2 : 2.15,
                      fontSize: getCardAyahs().length === 1 ? '30px' : getCardAyahs().length <= 3 ? '27px' : getCardAyahs().length <= 6 ? '23px' : '19px'
                    }}
                  >
                    {getCardAyahs().map((ayah, index) => (
                      <span key={ayah.number}>
                        {getCardAyahText(ayah)}
                        {'\u00A0'}
                        <span className="relative inline-flex items-center justify-center align-middle mx-0.5 w-[1.3em] h-[1.3em] rounded-full border-[0.09em] border-[#F3D9A4] bg-[#F3D9A4]/10 whitespace-nowrap">
                          <span className="text-[#F3D9A4] font-sans font-bold text-[0.46em] leading-none">{ayah.numberInSurah}</span>
                        </span>{index < getCardAyahs().length - 1 ? ' ' : ''}
                      </span>
                    ))}
                  </p>

                  <div className="mt-6 flex justify-center">
                    <span className="inline-flex items-center px-5 py-2 rounded-full border border-[#E6B981]/40 bg-[#D4A373]/10 text-xs md:text-sm font-bold text-[#F3D9A4] font-quran">
                      {cardShareMode === 'page'
                        ? `سورة ${surah.name.replace('سُورَةُ ', '')} · صفحة ${realMushafPage || currentPage + 1}`
                        : cardShareMode === 'range'
                          ? `سورة ${surah.name.replace('سُورَةُ ', '')} · آيات ${cardRangeStart} - ${cardRangeEnd}`
                          : `سورة ${surah.name.replace('سُورَةُ ', '')} · آية ${selectedAyahForCard.numberInSurah}`}
                    </span>
                  </div>

                  {showCardTafsir && (
                    <div className="mt-6 pt-5 border-t border-[#E6B981]/20 text-right">
                      <div className="text-[#F3D9A4] font-bold text-sm mb-3 text-center font-quran">
                        {tafsirEditionsList.find(ed => ed.id === selectedTafsirEdition)?.name || 'التفسير'}
                      </div>
                      {isCardTafsirLoading && !getCardTafsirText(getCardAyahs()[0]) ? (
                        <div className="flex justify-center py-4"><RefreshCw size={18} className="animate-spin text-[#E5C158]" /></div>
                      ) : (
                        <div className="space-y-4">
                          {getCardAyahs().map(ayah => (
                            <div key={ayah.number}>
                              <div className="text-[11px] text-[#E6B981]/70 mb-1">آية {ayah.numberInSurah}</div>
                              <p className="font-quran text-[13px] leading-[2] text-[#FBF3E7]/80">{getCardTafsirText(ayah)}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-6 pt-3 border-t border-[#E6B981]/20 text-[11px] font-semibold text-[#F3D9A4]/65 tracking-widest">
                    اقرأ • Iqraa
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full flex items-center gap-2 pt-1">
              <button
                onClick={handleDownloadCardImage}
                disabled={isGeneratingImage}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-xs md:text-sm bg-gradient-to-r from-[#D4A373] to-[#c28e5c] text-white shadow-lg transition-all active:scale-95 disabled:opacity-50"
                title={t.downloadCard}
              >
                {isGeneratingImage ? <RefreshCw size={16} className="animate-spin" /> : <ImageIcon size={16} />}
                <span>{t.downloadCard}</span>
              </button>

              <button
                onClick={handleNativeShare}
                disabled={isGeneratingImage}
                className="p-3 rounded-2xl font-bold text-sm bg-white/10 hover:bg-white/20 text-[#E6B981] border border-[#E6B981]/30 transition-all active:scale-95 disabled:opacity-50"
                title={t.shareImage}
              >
                {isGeneratingImage ? <RefreshCw size={18} className="animate-spin" /> : <Share2 size={18} />}
              </button>

              <button
                onClick={handleCopyCardText}
                className="p-3 rounded-2xl font-bold text-sm bg-white/10 hover:bg-white/20 text-[#E6B981] border border-[#E6B981]/30 transition-all active:scale-95"
                title={t.copyCardText}
              >
                {isCardCopied ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedAyahForTafsir && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-3 md:p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedAyahForTafsir(null)}>
          <div className={`w-full max-w-xl p-5 md:p-6 rounded-[2.5rem] shadow-2xl border transform transition-all ${
            isDarkMode ? "bg-gray-900 border-gray-700 text-gray-100" : "bg-white border-[#F0EBE1] text-[#2b241d]"
          }`} onClick={e => e.stopPropagation()} dir={isAr ? 'rtl' : 'ltr'}>
            
            <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <BookOpen size={20} className={isDarkMode ? 'text-[#E5C158]' : 'text-[#D4AF37]'} />
                <h3 className={`font-bold text-base md:text-lg ${!isAr && 'font-sans'} ${isDarkMode ? "text-[#E5C158]" : "text-[#D4AF37]"}`}>
                  {t.tafsirTitle} ({selectedAyahForTafsir.numberInSurah})
                </h3>
              </div>
              <button onClick={() => setSelectedAyahForTafsir(null)} className="text-gray-400 hover:text-red-500 p-1 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <p className={`${isAr ? 'font-quran text-center' : 'font-sans font-medium text-left'} text-lg md:text-xl leading-loose mb-3 p-3 rounded-2xl border ${
              isDarkMode ? 'bg-gray-800/60 border-gray-700 text-gray-100' : 'bg-[#FDFBF7] border-[#F0EBE1] text-[#2b241d]'
            }`}>
              {formatAyahText(selectedAyahForTafsir.text, selectedAyahForTafsir.numberInSurah, surah?.number)}
            </p>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-none">
              {tafsirEditionsList.map(ed => (
                <button
                  key={ed.id}
                  onClick={() => setSelectedTafsirEdition(ed.id)}
                  className={`px-3.5 py-1.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
                    selectedTafsirEdition === ed.id
                      ? (isDarkMode ? 'bg-[#E5C158] text-gray-900 shadow-md' : 'bg-[#D4AF37] text-white shadow-md')
                      : (isDarkMode ? 'bg-gray-800 text-gray-300 hover:text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')
                  }`}
                >
                  {ed.name}
                </button>
              ))}
            </div>
            
            <div className={`p-4 md:p-5 rounded-2xl shadow-inner border max-h-[44vh] overflow-y-auto ${
              isDarkMode ? "bg-[#161b22] border-gray-700" : "bg-[#FDFBF7] border-[#F0EBE1]"
            }`}>
              {isTafsirLoading ? (
                <div className="flex items-center justify-center py-10 gap-2 text-sm font-bold text-gray-400">
                  <RefreshCw size={18} className="animate-spin" />
                  <span>جاري جلب التفسير...</span>
                </div>
              ) : (
                <div className={isAr ? 'font-sans' : 'font-serif'}>
                  {renderFormattedTafsir(dynamicTafsirText)}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showSettings && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowSettings(false)}>
          <div className={`w-full max-w-sm p-5 md:p-6 rounded-3xl shadow-xl ${isDarkMode ? "bg-gray-800 text-gray-200" : "bg-white text-gray-800"}`} onClick={e => e.stopPropagation()} dir={isAr ? "rtl" : "ltr"}>
            <div className="flex justify-between items-center mb-6">
              <h3 className={`font-bold text-lg md:text-xl ${!isAr && 'font-sans'}`}>{t.settings}</h3>
              <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-red-500"><X size={20} /></button>
            </div>
            <div className={`mb-4 ${!isAr && 'font-sans'}`}>
              <div className="flex justify-between font-bold mb-2 text-sm md:text-base">
                <span>{t.fontSize}</span>
                <span className="text-[#D4AF37]">{fontSize}px</span>
              </div>
              <input 
                type="range" min="16" max="60" value={fontSize} 
                onChange={(e) => setFontSize(parseInt(e.target.value))}
                className="w-full accent-[#D4AF37]" style={{ direction: 'ltr' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
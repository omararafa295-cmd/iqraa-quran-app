import { useState, useEffect, useContext, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { 
  ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Settings, X, 
  PlayCircle, PauseCircle, BookOpen, ChevronDown, Brain, Download, 
  CheckCircle, RefreshCw, WifiOff, AlertTriangle, Bookmark, BookmarkCheck, 
  Volume2, Sparkles, Share2, Copy, Check, Image as ImageIcon, Moon
} from "lucide-react";
import { AppContext } from "../App";

export default function SurahDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation(); 
  
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

  // كارت الآية للمشاركة
  const [selectedAyahForCard, setSelectedAyahForCard] = useState(null);
  const [isCardCopied, setIsCardCopied] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

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

  const tafsirEditionsList = [
    { id: "ar.muyassar", name: isAr ? "التفسير الميسر" : "Al-Muyassar" },
    { id: "ar.jalalayn", name: isAr ? "تفسير الجلالين" : "Tafsir Al-Jalalayn" },
    { id: "ar.qurtubi", name: isAr ? "تفسير القرطبي" : "Tafsir Al-Qurtubi" },
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
    shareCard: isAr ? "كارت الآية (ستوري)" : "Ayah Card (Story)",
    downloadCard: isAr ? "تحميل كصورة ستوري" : "Download Story Image",
    copyCardText: isAr ? "نسخ النص" : "Copy Text",
    shareAction: isAr ? "مشاركة" : "Share",
    copied: isAr ? "تم النسخ" : "Copied!",
  };

  const [showSettings, setShowSettings] = useState(false);
  const [fontSize, setFontSize] = useState(() => {
    const savedSize = localStorage.getItem("fontSize");
    return savedSize ? parseInt(savedSize) : (window.innerWidth < 768 ? 20 : 28);
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
      const isSavedPermanently = localStorage.getItem(`offline_audio_saved_${surah.number}_${reciter}`) === 'true';
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
      .catch(err => {
        console.error("Tafsir fetch error:", err);
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
        console.error(error);
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

  // تتبّع الآية اللي بتتشغل وتقليب الصفحة تلقائيًا لما القارئ يوصل لصفحة جديدة
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

    setIsRadioPlaying(false);

    const currentReciterObj = recitersList?.find(r => r.id === reciter);
    const reciterName = currentReciterObj?.name || reciter;
    const audioUrl = getAudioUrl(reciter, surah.number, ayah.numberInSurah, ayah.number);

    setCurrentAudio({
      surahId: surah.number,
      nameAr: surah.name.replace('سُورَةُ ', ''),
      nameEn: surah.englishName,
      reciterName: reciterName, 
      reciterId: reciter, 
      ayahs: [{
        ...ayah,
        audio: audioUrl
      }], 
      currentAyahIndex: 0,
      playSingle: true
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

  // 🎨 رسم وتصدير كارت الآية بخلفية إسلامية فنية واقعية (محراب، فوانيس متدلية، هلال، إطارات ذهبية)
  // تحميل الخط العربي فعليًا قبل الرسم على الـ canvas
  // (من غير الخطوة دي، الكانفاس بيرسم بخط افتراضي فورًا قبل ما يجهز الخط المخصص،
  // فالصورة اللي بتتنزل بتطلع بخط عادي مش أنيق حتى لو الشكل في المعاينة تمام)
  const ensureFontsReady = async () => {
    try {
      await Promise.all([
        document.fonts.load('bold 64px "Amiri"'),
        document.fonts.load('bold 40px "Amiri"'),
        document.fonts.load('600 34px "Amiri"'),
      ]);
      await document.fonts.ready;
    } catch (e) {}
  };

  const handleDownloadCardImage = async () => {
    if (!selectedAyahForCard || !surah) return;
    setIsGeneratingImage(true);

    try {
      await ensureFontsReady();

      const W = 1080, H = 1920;
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d');

      const GOLD_LIGHT = '#F3D9A4';
      const GOLD = '#D4AF37';
      const GOLD_SOFT = '#E5C158';
      const CREAM = '#FBF3E7';

      // ===== 1. خلفية "أونيكس وذهب" فاخرة (عمق أسود دافئ بدل الأزرق الليلي) =====
      const bg = ctx.createLinearGradient(0, 0, W, H);
      bg.addColorStop(0, '#0d0b08');
      bg.addColorStop(0.45, '#171310');
      bg.addColorStop(1, '#0a0806');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // توهج ذهبي دافئ في المنتصف العلوي (خلف الهلال والبسملة)
      const glow = ctx.createRadialGradient(W / 2, 300, 20, W / 2, 300, 560);
      glow.addColorStop(0, 'rgba(230, 185, 129, 0.22)');
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, 900);

      // توهج خفيف تاني حول النص
      const midGlow = ctx.createRadialGradient(W / 2, H * 0.52, 30, W / 2, H * 0.52, 620);
      midGlow.addColorStop(0, 'rgba(212, 163, 115, 0.10)');
      midGlow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = midGlow;
      ctx.fillRect(0, 0, W, H);

      // فينيت خفيف على الحواف يركّز النظر في النص
      const vignette = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.72);
      vignette.addColorStop(0, 'rgba(0,0,0,0)');
      vignette.addColorStop(1, 'rgba(0,0,0,0.55)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, W, H);

      // ===== 2. زخرفة هندسية إسلامية خفيفة جدًا (نجمة ثمانية متكررة) في الخلفية =====
      ctx.save();
      ctx.globalAlpha = 0.05;
      ctx.strokeStyle = GOLD_SOFT;
      ctx.lineWidth = 1.2;
      const drawStar8 = (cx, cy, r) => {
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const a1 = (Math.PI / 4) * i;
          const a2 = a1 + Math.PI / 4;
          const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
          const x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2);
          if (i === 0) ctx.moveTo(x1, y1);
          ctx.lineTo(cx + (r * 0.42) * Math.cos(a1 + Math.PI / 8), cy + (r * 0.42) * Math.sin(a1 + Math.PI / 8));
          ctx.lineTo(x2, y2);
        }
        ctx.closePath();
        ctx.stroke();
      };
      const step = 150;
      for (let gy = -step; gy < H + step; gy += step) {
        for (let gx = -step; gx < W + step; gx += step) {
          drawStar8(gx + (Math.round(gy / step) % 2 === 0 ? 0 : step / 2), gy, 46);
        }
      }
      ctx.restore();

      // ===== 3. هلال ونجمة أعلى الكارت (نفس روح شعار التطبيق) =====
      ctx.save();
      const moonGlow = ctx.createRadialGradient(W / 2, 165, 5, W / 2, 165, 100);
      moonGlow.addColorStop(0, 'rgba(243, 217, 164, 0.55)');
      moonGlow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = moonGlow;
      ctx.beginPath();
      ctx.arc(W / 2, 165, 100, 0, Math.PI * 2);
      ctx.fill();

      // نرسم القرص الذهبي، وبعدين "نقطع" منه هلال حقيقي بشفافية فعلية
      // (destination-out) بدل ما نغطي بلون غامق تقيل بيبان كنقطة سودا فوق التوهج
      const moonCx = W / 2, moonCy = 168, moonR = 26;
      ctx.beginPath();
      const moonGrad = ctx.createLinearGradient(moonCx - moonR, moonCy - moonR, moonCx + moonR, moonCy + moonR);
      moonGrad.addColorStop(0, GOLD_LIGHT);
      moonGrad.addColorStop(1, GOLD);
      ctx.fillStyle = moonGrad;
      ctx.arc(moonCx, moonCy, moonR, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(moonCx + 13, moonCy - 7, moonR - 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';

      // نجمة صغيرة أربعة أطراف بجانب الهلال
      ctx.fillStyle = GOLD_LIGHT;
      const drawSparkle = (x, y, s) => {
        ctx.beginPath();
        ctx.moveTo(x, y - s); ctx.lineTo(x + s * 0.28, y - s * 0.28);
        ctx.lineTo(x + s, y); ctx.lineTo(x + s * 0.28, y + s * 0.28);
        ctx.lineTo(x, y + s); ctx.lineTo(x - s * 0.28, y + s * 0.28);
        ctx.lineTo(x - s, y); ctx.lineTo(x - s * 0.28, y - s * 0.28);
        ctx.closePath();
        ctx.fill();
      };
      drawSparkle(W / 2 + 60, 138, 10);
      ctx.restore();

      // ===== 4. إطار مزدوج بزاوية علوية على شكل قوس محراب (يتماشى مع شعار التطبيق) =====
      const frameX = 84, frameY = 250, frameW = W - frameX * 2, frameH = 1330;
      const archH = 90; // ارتفاع قوس المحراب أعلى الإطار

      const drawMihrabFrame = (x, y, w, h, arch, color, lw) => {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = lw;
        ctx.beginPath();
        ctx.moveTo(x, y + h);
        ctx.lineTo(x, y + arch);
        // القوس المدبب أعلى الإطار
        ctx.quadraticCurveTo(x, y - arch * 0.15, x + w / 2, y - arch * 0.55);
        ctx.quadraticCurveTo(x + w, y - arch * 0.15, x + w, y + arch);
        ctx.lineTo(x + w, y + h);
        ctx.lineTo(x, y + h);
        ctx.stroke();
        ctx.restore();
      };
      drawMihrabFrame(frameX, frameY, frameW, frameH, archH, GOLD, 2.5);
      drawMihrabFrame(frameX + 20, frameY + 18, frameW - 40, frameH - 36, archH - 14, 'rgba(230, 185, 129, 0.45)', 1.2);

      // زوايا أندلسية مزخرفة سفلية
      const drawCorner = (x, y, dx, dy) => {
        ctx.save();
        ctx.strokeStyle = GOLD_SOFT;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x, y + dy * 50);
        ctx.lineTo(x, y);
        ctx.lineTo(x + dx * 50, y);
        ctx.stroke();
        ctx.fillStyle = GOLD_SOFT;
        ctx.beginPath();
        ctx.arc(x + dx * 14, y + dy * 14, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      };
      drawCorner(frameX, frameY + frameH, 1, -1);
      drawCorner(frameX + frameW, frameY + frameH, -1, -1);

      // ===== 5. البسملة =====
      ctx.fillStyle = GOLD_SOFT;
      ctx.font = '600 34px "Amiri", "Traditional Arabic", serif';
      ctx.textAlign = 'center';
      ctx.direction = 'rtl';
      ctx.fillText('بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', W / 2, 340);

      // فاصل زخرفي مع معينة مركزية
      ctx.strokeStyle = 'rgba(212, 163, 115, 0.55)';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(frameX + 90, 380);
      ctx.lineTo(W / 2 - 16, 380);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(W / 2 + 16, 380);
      ctx.lineTo(frameX + frameW - 90, 380);
      ctx.stroke();
      ctx.save();
      ctx.translate(W / 2, 380);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = GOLD_SOFT;
      ctx.fillRect(-5, -5, 10, 10);
      ctx.restore();

      // ===== 6. نص الآية بتدرج "ذهب مطلي" مع ظل خفيف للعمق =====
      const cleanAyah = formatAyahText(selectedAyahForCard.text, selectedAyahForCard.numberInSurah, surah.number);
      const fullText = `﴿ ${cleanAyah} ﴾`;

      ctx.font = 'bold 46px "Amiri", "Traditional Arabic", serif';
      ctx.textAlign = 'center';
      ctx.direction = 'rtl';

      const maxTextWidth = frameW - 160;
      const words = fullText.split(' ');
      const lines = [];
      let currentLine = '';
      for (let word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        if (ctx.measureText(testLine).width > maxTextWidth) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) lines.push(currentLine);

      const lineHeight = 92;
      const totalTextHeight = lines.length * lineHeight;
      const textAreaTop = 430, textAreaBottom = frameY + frameH - 220;
      let startY = textAreaTop + (textAreaBottom - textAreaTop - totalTextHeight) / 2 + 30;
      if (startY < textAreaTop + 30) startY = textAreaTop + 30;

      const textGrad = ctx.createLinearGradient(0, startY - 50, 0, startY + totalTextHeight);
      textGrad.addColorStop(0, CREAM);
      textGrad.addColorStop(0.5, GOLD_LIGHT);
      textGrad.addColorStop(1, CREAM);

      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.45)';
      ctx.shadowBlur = 14;
      ctx.shadowOffsetY = 3;
      ctx.fillStyle = textGrad;
      lines.forEach((line, idx) => {
        ctx.fillText(line, W / 2, startY + idx * lineHeight);
      });
      ctx.restore();

      // ===== 7. شارة اسم السورة ورقم الآية =====
      const cleanSurahName = surah.name.replace('سُورَةُ ', '');
      const refText = `سورة ${cleanSurahName}  ·  آية ${selectedAyahForCard.numberInSurah}`;

      ctx.font = '600 32px "Amiri", "Traditional Arabic", sans-serif';
      const badgeY = frameY + frameH - 150;
      const badgeWidth = ctx.measureText(refText).width + 96;
      const badgeX = (W - badgeWidth) / 2;

      ctx.save();
      const badgeGrad = ctx.createLinearGradient(badgeX, 0, badgeX + badgeWidth, 0);
      badgeGrad.addColorStop(0, 'rgba(212, 163, 115, 0.06)');
      badgeGrad.addColorStop(0.5, 'rgba(212, 163, 115, 0.18)');
      badgeGrad.addColorStop(1, 'rgba(212, 163, 115, 0.06)');
      ctx.fillStyle = badgeGrad;
      ctx.strokeStyle = 'rgba(230, 185, 129, 0.5)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeWidth, 64, 32);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = GOLD_LIGHT;
      ctx.fillText(refText, W / 2, badgeY + 42);

      // خط فاصل رفيع + اسم التطبيق
      ctx.strokeStyle = 'rgba(230, 185, 129, 0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(W / 2 - 60, badgeY + 96);
      ctx.lineTo(W / 2 + 60, badgeY + 96);
      ctx.stroke();

      ctx.fillStyle = 'rgba(243, 217, 164, 0.65)';
      ctx.font = '600 24px sans-serif';
      ctx.fillText('اقرأ  •  Iqraa', W / 2, badgeY + 138);

      // ===== تنزيل الصورة =====
      const link = document.createElement('a');
      link.download = `Iqraa-${cleanSurahName}-ayah-${selectedAyahForCard.numberInSurah}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      showNotification(isAr ? "تم تحميل كارت الآية بنجاح!" : "Story Image downloaded!", "success");
    } catch (e) {
      console.error(e);
      showNotification(isAr ? "حدث خطأ أثناء تحميل الصورة" : "Error generating image", "error");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleCopyCardText = () => {
    if (!selectedAyahForCard || !surah) return;
    const cleanAyah = formatAyahText(selectedAyahForCard.text, selectedAyahForCard.numberInSurah, surah.number);
    const cleanSurahName = surah.name.replace('سُورَةُ ', '');
    const textToCopy = `﴿ ${cleanAyah} ﴾\n\n[ سورة ${cleanSurahName} : ${selectedAyahForCard.numberInSurah} ]\n- عبر تطبيق اقرأ`;
    
    navigator.clipboard.writeText(textToCopy);
    setIsCardCopied(true);
    setTimeout(() => setIsCardCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    if (!selectedAyahForCard || !surah) return;
    const cleanAyah = formatAyahText(selectedAyahForCard.text, selectedAyahForCard.numberInSurah, surah.number);
    const cleanSurahName = surah.name.replace('سُورَةُ ', '');
    const shareText = `﴿ ${cleanAyah} ﴾\n\n[ سورة ${cleanSurahName} : ${selectedAyahForCard.numberInSurah} ]`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `آية من سورة ${cleanSurahName}`,
          text: shareText,
        });
      } catch (err) {}
    } else {
      handleCopyCardText();
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

      {/* الهيدر العلوي */}
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
                  const dropdownWidth = 192; // w-48
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
                  className={`fixed w-48 rounded-2xl shadow-xl overflow-hidden z-50 border ${!isAr && 'font-sans'} ${
                    isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-[#F0EBE1]"
                  }`}
                  style={{ top: dropdownPos.top, left: dropdownPos.left }}
                >
                  {recitersList.map((r) => (
                    <button
                      key={r.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setReciter(r.id);
                        setIsDropdownOpen(false);
                        if (isPlaying) setIsPlaying(false); 
                      }}
                      className={`w-full ${isAr ? 'text-right' : 'text-left'} px-4 py-3 text-sm transition-colors ${
                        reciter === r.id 
                          ? (isDarkMode ? `bg-gray-900 text-[#E5C158] font-bold ${isAr ? 'border-r-4' : 'border-l-4'} border-[#E5C158]` : `bg-[#FDFBF7] text-[#D4AF37] font-bold ${isAr ? 'border-r-4' : 'border-l-4'} border-[#D4AF37]`) 
                          : (isDarkMode ? "text-gray-300 hover:bg-gray-700 hover:text-[#E5C158]" : "text-gray-600 hover:bg-gray-50 hover:text-[#D4AF37]")
                      }`}
                    >
                      {r.name}
                    </button>
                  ))}
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

      {/* 🌟 القائمة المنبثقة للآية 🌟 */}
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
                setSelectedAyahForCard(activeAyahMenu);
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

      {/* 🌟 نافذة كارت الآية للمشاركة (Ayah Story Card Modal) 🌟 */}
      {selectedAyahForCard && (
        <div 
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in"
          onClick={() => setSelectedAyahForCard(null)}
        >
          <div 
            className="w-full max-w-sm flex flex-col items-center gap-3.5"
            onClick={e => e.stopPropagation()}
            dir={isAr ? "rtl" : "ltr"}
          >
            {/* زر الإغلاق العلوي */}
            <div className="w-full flex justify-end">
              <button 
                onClick={() => setSelectedAyahForCard(null)}
                className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* 🌟 كارت "أونيكس وذهب" الفاخر — بقوس محراب علوي بروح شعار التطبيق 🌟 */}
            <div className="w-full relative aspect-[9/16] rounded-[2rem] shadow-[0_25px_60px_-15px_rgba(212,163,115,0.35)] border border-[#D4AF37]/50 bg-gradient-to-b from-[#171310] via-[#0d0b08] to-[#0a0806] text-[#FBF3E7] overflow-hidden">

              {/* نسيج هندسي إسلامي خفيف جدًا في الخلفية */}
              <div
                className="absolute inset-0 opacity-[0.05] pointer-events-none"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(45deg, #E5C158 0, #E5C158 1px, transparent 1px, transparent 26px), repeating-linear-gradient(-45deg, #E5C158 0, #E5C158 1px, transparent 1px, transparent 26px)',
                }}
              />

              {/* توهجات ذهبية */}
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-[#E5C158]/20 blur-3xl pointer-events-none" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-[#D4AF37]/10 blur-3xl pointer-events-none" />
              <div className="absolute inset-0 [background:radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.55)_100%)] pointer-events-none" />

              {/* قوس محراب علوي بروح شعار التطبيق + إطار داخلي رفيع */}
              <div className="absolute inset-x-5 top-6 bottom-24 pointer-events-none">
                <svg viewBox="0 0 100 170" preserveAspectRatio="none" className="w-full h-full">
                  <path
                    d="M 2 170 L 2 18 Q 2 4 50 -6 Q 98 4 98 18 L 98 170"
                    fill="none" stroke="#D4AF37" strokeWidth="0.6"
                  />
                  <path
                    d="M 6 170 L 6 20 Q 6 9 50 0 Q 94 9 94 20 L 94 170"
                    fill="none" stroke="#E5C158" strokeWidth="0.3" opacity="0.5"
                  />
                </svg>
              </div>
              {/* زوايا سفلية مزخرفة */}
              <div className="absolute bottom-24 left-5 w-8 h-8 border-b border-l border-[#E5C158]/60 rounded-bl-lg pointer-events-none" />
              <div className="absolute bottom-24 right-5 w-8 h-8 border-b border-r border-[#E5C158]/60 rounded-br-lg pointer-events-none" />

              {/* المحتوى */}
              <div className="relative z-10 h-full flex flex-col items-center text-center px-7 pt-10 pb-6">

                {/* هلال ونجمة أعلى الكارت */}
                <div className="relative mb-3 flex items-center justify-center w-14 h-14">
                  <div className="absolute inset-0 rounded-full bg-[#E5C158]/25 blur-xl" />
                  <Moon size={26} className="relative text-[#F3D9A4] fill-[#D4AF37] drop-shadow-[0_0_6px_rgba(230,185,129,0.6)]" />
                  <Sparkles size={13} className="absolute -top-0.5 -right-0.5 text-[#F3D9A4]" />
                </div>

                <span className="text-sm md:text-base font-bold text-[#E5C158] tracking-wide block mb-2" style={{ fontFamily: '"Amiri", serif' }}>
                  بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                </span>

                {/* فاصل بمعينة مركزية */}
                <div className="flex items-center gap-2 w-full max-w-[70%] mb-auto">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent to-[#D4AF37]/70" />
                  <div className="w-1.5 h-1.5 rotate-45 bg-[#E5C158]" />
                  <div className="flex-1 h-px bg-gradient-to-l from-transparent to-[#D4AF37]/70" />
                </div>

                {/* متن الآية الكريمة بتدرج ذهبي */}
                <div className="flex-1 flex items-center justify-center px-1 overflow-y-auto scrollbar-none">
                  <p
                    className="text-xl md:text-2xl font-bold font-quran leading-[2.4] bg-clip-text text-transparent bg-gradient-to-b from-[#FBF3E7] via-[#F3D9A4] to-[#FBF3E7] drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]"
                  >
                    ﴿ {formatAyahText(selectedAyahForCard.text, selectedAyahForCard.numberInSurah, surah?.number)} ﴾
                  </p>
                </div>

                {/* أسفل الكارت: شارة اسم السورة ورقم الآية + اسم التطبيق */}
                <div className="mt-auto w-full flex flex-col items-center gap-3 pt-3">
                  <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-[#E5C158]/50 bg-gradient-to-r from-[#D4AF37]/5 via-[#D4AF37]/20 to-[#D4AF37]/5 shadow-sm">
                    <span className="text-xs md:text-sm font-bold text-[#F3D9A4]" style={{ fontFamily: '"Amiri", serif' }}>
                      سورة {surah?.name.replace('سُورَةُ ', '')} · آية {selectedAyahForCard.numberInSurah}
                    </span>
                  </div>
                  <div className="w-14 h-px bg-[#E5C158]/40" />
                  <p className="text-[11px] font-semibold text-[#F3D9A4]/65 tracking-widest">
                    اقرأ  •  Iqraa
                  </p>
                </div>
              </div>
            </div>

            {/* 🌟 أزرار التفاعل والإجراءات 🌟 */}
            <div className="w-full flex items-center justify-between gap-2 pt-1">
              <button
                onClick={handleDownloadCardImage}
                disabled={isGeneratingImage}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-xs md:text-sm bg-gradient-to-r from-[#D4AF37] to-[#B8942E] hover:from-[#B8942E] hover:to-[#B8942E] text-white shadow-lg transition-all active:scale-95 disabled:opacity-50"
              >
                {isGeneratingImage ? <RefreshCw size={16} className="animate-spin" /> : <ImageIcon size={16} />}
                <span>{t.downloadCard}</span>
              </button>

              <button
                onClick={handleNativeShare}
                className="p-3 rounded-2xl font-bold text-sm bg-white/10 hover:bg-white/20 text-[#E5C158] border border-[#E5C158]/30 transition-all active:scale-95"
                title={t.shareAction}
              >
                <Share2 size={18} />
              </button>

              <button
                onClick={handleCopyCardText}
                className="p-3 rounded-2xl font-bold text-sm bg-white/10 hover:bg-white/20 text-[#E5C158] border border-[#E5C158]/30 transition-all active:scale-95"
                title={t.copyCardText}
              >
                {isCardCopied ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* نافذة التفسير */}
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

      {/* نافذة الإعدادات */}
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
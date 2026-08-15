import { useState, useEffect, useRef, useContext } from "react";
import axios from "axios";
import { Mic, MicOff, AlertCircle, HelpCircle, CheckCircle, ChevronDown, ChevronRight, ChevronLeft, BookOpen, AlertTriangle } from "lucide-react";
import { AppContext } from "../App";

const normalizeArabic = (text) => {
  if (!text) return "";
  return text
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u06DF-\u06E8\u0640\uFD3E\uFD3F]/g, "") // إزالة التشكيل وعلامات الوقف
    .replace(/[أإآاٱ]/g, "ا") 
    .replace(/ة/g, "ه") 
    .replace(/[ىيئ]/g, "ي") 
    .replace(/ؤ/g, "و") 
    .replace(/ء/g, "") 
    .trim();
};

const isMatchFast = (spoken, target) => {
  if (!spoken || !target) return false;
  if (spoken === target) return true;

  const sPhon = spoken.replace(/[ذزظ]/g, 'ز').replace(/[ثست]/g, 'س').replace(/[ضد]/g, 'د').replace(/[طت]/g, 'ت').replace(/[كق]/g, 'ك');
  const tPhon = target.replace(/[ذزظ]/g, 'ز').replace(/[ثست]/g, 'س').replace(/[ضد]/g, 'د').replace(/[طت]/g, 'ت').replace(/[كق]/g, 'ك');
  if (sPhon === tPhon) return true;

  const sLen = spoken.length;
  const tLen = target.length;
  if (sLen >= 3 && tLen >= 3) {
    if (spoken.startsWith(target) || target.startsWith(spoken)) return true;
    if (sPhon.startsWith(tPhon) || tPhon.startsWith(sPhon)) return true;
    if (spoken.endsWith(target) || target.endsWith(spoken)) return true;
  }

  if (Math.abs(sLen - tLen) <= 1 && sLen >= 4 && tLen >= 4) {
    let diff = 0;
    let i = 0, j = 0;
    while (i < sLen && j < tLen) {
      if (sPhon[i] !== tPhon[j]) {
        diff++;
        if (diff > 1) return false;
        if (sLen > tLen) i++;
        else if (tLen > sLen) j++;
        else { i++; j++; }
      } else {
        i++; j++;
      }
    }
    return true;
  }

  return false;
};

export default function Memorize() {
  const { isDarkMode, lang } = useContext(AppContext);
  const isAr = lang === 'ar';

  const [surahs, setSurahs] = useState([]);
  const [selectedSurah, setSelectedSurah] = useState(null);
  
  const [surahPages, setSurahPages] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0); 
  const [wordStatuses, setWordStatuses] = useState({}); 
  
  const [isAnimating, setIsAnimating] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState(""); 
  const [supportError, setSupportError] = useState(null);
  const [micError, setMicError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [fontSize, setFontSize] = useState(() => {
    const savedSize = localStorage.getItem("fontSize");
    return savedSize ? parseInt(savedSize) : (window.innerWidth < 768 ? 24 : 34);
  });

  const recognitionRef = useRef(null);
  const wordsRef = useRef([]);
  const wordStatusesRef = useRef({});
  const isManualStopRef = useRef(false);
  const currentIndexRef = useRef(0);
  const chunkBaseRef = useRef(-1);       
  const consumedInChunkRef = useRef(0);  
  const consecutiveErrorsRef = useRef(0); 
  const lastErrorTypeRef = useRef(null);

  useEffect(() => {
    if (surahPages.length > 0) {
      wordsRef.current = surahPages[currentPage];
    }
  }, [surahPages, currentPage]);

  useEffect(() => {
    axios.get("https://api.alquran.cloud/v1/surah")
      .then((res) => {
        setSurahs(res.data.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupportError(isAr ? "متصفحك لا يدعم الميكروفون." : "Browser doesn't support mic.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'ar-EG'; 
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
      setLiveTranscript("");
      setMicError(null);
      consecutiveErrorsRef.current = 0;
    };
    
    recognition.onend = () => {
      if (isManualStopRef.current || !wordsRef.current || currentIndexRef.current >= wordsRef.current.length) {
        setIsListening(false);
        return;
      }

      if (consecutiveErrorsRef.current >= 4) {
        setIsListening(false);
        setMicError(isAr ? "الاستماع اتوقف بسبب مشكلة متكررة. اضغط ابدأ التسميع تاني." : "Listening stopped after repeated issues. Tap Start again.");
        return;
      }

      const delay = lastErrorTypeRef.current === 'network' ? 1500 : 0;
      setTimeout(() => {
        if (!isManualStopRef.current) {
          try { recognition.start(); } catch (e) {}
        }
      }, delay);
    };
    
    recognition.onerror = (event) => {
      lastErrorTypeRef.current = event.error;

      if (event.error === 'no-speech' || event.error === 'aborted') return;

      consecutiveErrorsRef.current += 1;

      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        isManualStopRef.current = true;
        setIsListening(false);
        setMicError(isAr ? "المتصفح مش ادّيك إذن استخدام المايك. فعّل الإذن من إعدادات المتصفح وحاول تاني." : "Microphone access is blocked. Enable it in your browser settings and try again.");
        return;
      }

      if (event.error === 'network') {
        setMicError(isAr ? "في مشكلة في الاتصال بالإنترنت - بنحاول نرجع نوصل..." : "Network issue - trying to reconnect...");
        return;
      }

      if (isManualStopRef.current) setIsListening(false);
    };

    recognition.onresult = (event) => {
      let latestTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        latestTranscript += event.results[i][0].transcript + " ";
      }
      if (chunkBaseRef.current !== event.resultIndex) {
        chunkBaseRef.current = event.resultIndex;
        consumedInChunkRef.current = 0;
      }

      let fixedTranscript = latestTranscript
        .replace(/(الف|ألف|اف|ايف)\s*(لام|لا|لم|لآم)\s*(ميم|مي|م)/g, "الم")
        .replace(/ألم/g, "الم")
        .replace(/علم/g, "الم") 
        .replace(/(الف|ألف)\s*(لام|لا)\s*(ميم|مي)\s*(صاد|ص)/g, "المص")
        .replace(/(الف|ألف)\s*(لام|لا)\s*(را|ر)/g, "الر")
        .replace(/(كاف|ك)\s*(ها|ه)\s*(يا|ي)\s*(عين|ع)\s*(صاد|ص)/g, "كهيعص")
        .replace(/(طا|ط)\s*(ها|ه)/g, "طه")
        .replace(/(طا|ط)\s*(سين|س)\s*(ميم|م)/g, "طسم")
        .replace(/(طا|ط)\s*(سين|س)/g, "طس")
        .replace(/(يا|ي)\s*(سين|س)/g, "يس")
        .replace(/(حا|ح)\s*(ميم|م)/g, "حم")
        .replace(/عسق/g, "عسق")
        .replace(/قاف/g, "ق")
        .replace(/نون/g, "ن");

      setLiveTranscript(fixedTranscript.trim());

      const spokenWords = fixedTranscript.split(/\s+/).map(normalizeArabic).filter(Boolean);
      if (spokenWords.length === 0) return;
      const unconsumedSpoken = spokenWords.slice(consumedInChunkRef.current);

      let tIndex = currentIndexRef.current;
      const targetWords = wordsRef.current;
      const newStatuses = { ...wordStatusesRef.current };
      let hasAdvanced = false;
      let consumedUpTo = 0;
      for (let s = 0; s < unconsumedSpoken.length && tIndex < targetWords.length; s++) {
        const spoken = unconsumedSpoken[s];

        if (isMatchFast(spoken, targetWords[tIndex].normalized)) {
          newStatuses[tIndex] = 'correct';
          tIndex++;
          hasAdvanced = true;
          consumedUpTo = s + 1;
          continue;
        }
        if (tIndex + 1 < targetWords.length && isMatchFast(spoken, targetWords[tIndex + 1].normalized)) {
          newStatuses[tIndex] = 'missed'; // الكلمة المنسية تصبح حمراء
          newStatuses[tIndex + 1] = 'correct';
          tIndex += 2;
          hasAdvanced = true;
          consumedUpTo = s + 1;
          continue;
        }

        if (tIndex + 2 < targetWords.length && isMatchFast(spoken, targetWords[tIndex + 2].normalized)) {
          newStatuses[tIndex] = 'missed';
          newStatuses[tIndex + 1] = 'missed';
          newStatuses[tIndex + 2] = 'correct';
          tIndex += 3;
          hasAdvanced = true;
          consumedUpTo = s + 1;
          continue;
        }
      }

      if (consumedUpTo > 0) {
        consumedInChunkRef.current += consumedUpTo;
      }

      if (hasAdvanced) {
        currentIndexRef.current = tIndex;
        wordStatusesRef.current = newStatuses;
        setWordStatuses(newStatuses);
        setCurrentIndex(tIndex);
        consecutiveErrorsRef.current = 0;
        setMicError(null);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, [isAr]);

  const loadSurahForMemorization = (surahNumber) => {
    setLoading(true);
    isManualStopRef.current = true;
    if (isListening && recognitionRef.current) recognitionRef.current.stop();
    setLiveTranscript("");
    chunkBaseRef.current = -1;
    consumedInChunkRef.current = 0;
    
    axios.get(`https://api.alquran.cloud/v1/surah/${surahNumber}/quran-simple`)
      .then((res) => {
        const fetchedSurah = res.data.data;
        setSelectedSurah(fetchedSurah);
        setIsDropdownOpen(false);
        
        const pagesMap = {};
        
        fetchedSurah.ayahs.forEach(ayah => {
          if (!pagesMap[ayah.page]) pagesMap[ayah.page] = [];
          
          let cleanText = ayah.text;
          if (ayah.numberInSurah === 1 && surahNumber !== 1 && surahNumber !== 9) {
            cleanText = cleanText.replace("بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ", "").trim();
          }
          
          const ayahWords = cleanText.split(/\s+/);
          ayahWords.forEach((w) => {
            const norm = normalizeArabic(w);
            if (norm && norm.length > 0 && /[ا-ي]/.test(norm)) {
              const cleanOriginal = w.replace(/[\u06D6-\u06ED\uFD3E\uFD3F]/g, '').trim() || w;
              pagesMap[ayah.page].push({
                original: cleanOriginal,
                normalized: norm,
                ayahNumber: ayah.numberInSurah,
                juz: ayah.juz
              });
            }
          });
        });
        
        const pagesArray = Object.values(pagesMap);
        pagesArray.forEach(page => {
          page.forEach((w, i) => w.id = i); 
        });
        
        setSurahPages(pagesArray);
        setCurrentPage(0);
        setCurrentIndex(0);
        currentIndexRef.current = 0;
        setWordStatuses({});
        wordStatusesRef.current = {};
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  const toggleListening = () => {
    if (supportError) return alert(supportError);
    if (isListening) {
      isManualStopRef.current = true;
      recognitionRef.current.stop();
      setIsListening(false);
      setLiveTranscript("");
    } else {
      isManualStopRef.current = false;
      chunkBaseRef.current = -1;
      consumedInChunkRef.current = 0;
      consecutiveErrorsRef.current = 0;
      setMicError(null);
      setLiveTranscript("");
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const changePage = (newPage) => {
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentPage(newPage);
      setCurrentIndex(0);
      currentIndexRef.current = 0;
      chunkBaseRef.current = -1;
      consumedInChunkRef.current = 0;
      setWordStatuses({});
      wordStatusesRef.current = {};
      setLiveTranscript("");
      setIsAnimating(false);
    }, 300);
  };

  const handleNextPage = () => {
    if (currentPage < surahPages.length - 1) {
      changePage(currentPage + 1);
    } else if (selectedSurah.number < 114) {
      loadSurahForMemorization(selectedSurah.number + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      changePage(currentPage - 1);
    } else if (selectedSurah.number > 1) {
      loadSurahForMemorization(selectedSurah.number - 1);
    }
  };

  const handleHintClick = () => {
    if (currentIndexRef.current < wordsRef.current.length) {
      const idx = currentIndexRef.current;
      const newStatuses = { ...wordStatusesRef.current, [idx]: 'missed' };
      const nextIdx = idx + 1;

      wordStatusesRef.current = newStatuses;
      setWordStatuses(newStatuses);
      currentIndexRef.current = nextIdx;
      setCurrentIndex(nextIdx);
      setLiveTranscript("");
      chunkBaseRef.current = -1;
      consumedInChunkRef.current = 0;
    }
  };

  const handleWordClick = (index) => {
    if (index >= currentIndexRef.current) {
      const newStatuses = { ...wordStatusesRef.current };
      for (let i = currentIndexRef.current; i < index; i++) {
        newStatuses[i] = 'missed';
      }
      newStatuses[index] = 'missed';
      const nextIdx = index + 1;
      
      currentIndexRef.current = nextIdx;
      wordStatusesRef.current = newStatuses;
      setWordStatuses(newStatuses);
      setCurrentIndex(nextIdx);
      setLiveTranscript("");
      chunkBaseRef.current = -1;
      consumedInChunkRef.current = 0;
    }
  };

  const t = {
    title: isAr ? "التسميع بالصوت" : "Voice Memorization",
    subtitle: isAr ? "اقرأ بصوتك ، والكلمات المنسية أو التلميحات ستظهر باللون الأحمر" : "Recite freely, missed words or hints will appear in red",
    select: isAr ? "اختر سورة للتسميع" : "Select a Surah",
    start: isAr ? "ابدأ التسميع" : "Start Reciting",
    stop: isAr ? "إيقاف المايك" : "Stop Mic",
    hint: isAr ? "تلميح" : "Hint",
    page: isAr ? "صفحة" : "Page",
    prevSurah: isAr ? "السورة السابقة" : "Prev Surah",
    nextSurah: isAr ? "السورة التالية" : "Next Surah",
    prevPage: isAr ? "السابق" : "Prev",
    nextPage: isAr ? "التالي" : "Next",
    missedWords: isAr ? "كلمات لم تُنطق / مساعدة:" : "Missed / Hinted Words:",
    perfect: isAr ? "ممتاز! تسميع متقن بدون أي مساعدة " : "Perfect recitation without help! ",
  };

  const currentWords = surahPages[currentPage] || [];
  const totalPages = surahPages.length;
  const currentJuz = currentWords[0]?.juz || "";
  
  const missedCount = Object.values(wordStatuses).filter(s => s === 'missed').length;

  const PrevPageIcon = isAr ? ChevronRight : ChevronLeft;
  const NextPageIcon = isAr ? ChevronLeft : ChevronRight;

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 pt-2 md:pt-6 pb-32" dir={isAr ? "rtl" : "ltr"}>
      
      <div className="text-center mb-6 mt-4 px-2">
        <h2 className={`text-3xl font-bold ${isAr ? 'font-quran' : 'font-serif tracking-wide'} mb-7 ${isDarkMode ? 'text-[#E6B981]' : 'text-[#D4A373]'}`}>
          {t.title}
        </h2>
        <p className="text-gray-500 text-xs md:text-sm">{t.subtitle}</p>
      </div>

      {supportError && (
        <div className="bg-red-50 text-red-500 p-4 rounded-2xl mb-6 flex items-center gap-2 font-medium mx-2">
          <AlertCircle size={20} /> {supportError}
        </div>
      )}

      {micError && (
        <div className={`p-4 rounded-2xl mb-6 flex items-center gap-2 font-medium mx-2 text-sm ${
          isDarkMode ? 'bg-amber-950/40 text-amber-300 border border-amber-900/50' : 'bg-amber-50 text-amber-700 border border-amber-200'
        }`}>
          <AlertTriangle size={18} className="shrink-0" /> {micError}
        </div>
      )}
      <div className="relative mb-6 max-w-sm mx-auto z-40 px-2 flex justify-center">
        <div className="relative w-full">
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`flex items-center justify-between w-full px-5 py-3.5 rounded-xl font-bold text-sm md:text-base transition-all shadow-sm border ${
              isDarkMode 
                ? "bg-gray-800 border-gray-700 text-[#E6B981] hover:border-[#E6B981]" 
                : "bg-white border-[#F0EBE1] text-[#D4A373] hover:border-[#D4A373]"
            }`}
          >
            <div className="flex items-center gap-3 truncate">
              <BookOpen size={18} />
              <span className="truncate">{selectedSurah ? (isAr ? selectedSurah.name : selectedSurah.englishName) : t.select}</span>
            </div>
            <ChevronDown size={18} className={`transition-transform duration-300 ${isDropdownOpen ? "rotate-180" : ""}`} />
          </button>

          {isDropdownOpen && (
            <div className={`absolute top-full mt-2 w-full max-h-64 overflow-y-auto rounded-2xl shadow-2xl z-50 border ${
              isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-[#F0EBE1]"
            }`}>
              {surahs.map((s) => (
                <button
                  key={s.number}
                  onClick={() => loadSurahForMemorization(s.number)}
                  className={`w-full ${isAr ? 'text-right' : 'text-left'} px-5 py-3.5 text-sm font-medium transition-colors border-b last:border-0 ${
                    isDarkMode ? "border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-[#E6B981]" : "border-gray-50 text-gray-700 hover:bg-[#FDFBF7] hover:text-[#D4A373]"
                  }`}
                >
                  <span className={`inline-block ${isAr ? 'ml-3' : 'mr-3'} font-bold ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>{s.number}.</span> 
                  {isAr ? s.name : s.englishName}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className={`text-center py-10 font-bold ${isDarkMode ? 'text-[#E6B981]' : 'text-[#D4A373]'}`}>جاري التحميل...</div>
      ) : selectedSurah && currentWords.length > 0 ? (
        <div className={`px-4 md:px-12 py-8 rounded-2xl shadow-lg border transition-colors duration-300 min-h-[60vh] flex flex-col justify-between ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-[#FFFdf9] border-[#E8E1D3]'
        }`}>
          
          <div className={`flex justify-between items-center w-full pb-2 mb-4 border-b-2 ${!isAr && 'font-sans'} ${
            isDarkMode ? "border-gray-700 text-gray-400" : "border-[#D4A373]/30 text-gray-400"
          } font-bold text-sm md:text-base`}>
            <span>{isAr ? selectedSurah.name : selectedSurah.englishName}</span>
            <span>{t.juz} {currentJuz}</span>
          </div>

          <div className={`transition-opacity duration-300 ease-in-out text-center flex-1 ${isAnimating ? "opacity-0" : "opacity-100"}`}>
            
            {currentPage === 0 && selectedSurah.number !== 1 && selectedSurah.number !== 9 && (
              <div className={`text-center ${isAr ? 'text-2xl md:text-3xl' : 'text-xl md:text-2xl'} mb-6 md:mb-8 ${isAr ? 'font-quran' : 'font-serif font-medium tracking-wide'} ${isDarkMode ? "text-[#E6B981]" : "text-[#D4A373]"}`}>
                {isAr ? "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ" : "In the name of Allah..."}
              </div>
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
              {currentWords.map((word, index) => {
                const isRevealed = index < currentIndex;
                const isLastWordInAyah = index === currentWords.length - 1 || word.ayahNumber !== currentWords[index + 1].ayahNumber;
                const status = wordStatuses[index];

                return (
                  <span key={word.id} className="inline">
                    <span 
                      onClick={() => handleWordClick(index)}
                      title={status === 'missed' ? (isAr ? "كلمة تم تخطيها أو المساعدة فيها" : "Missed word / Hinted") : ""}
                      className={`inline-block mx-0.5 px-1 py-0.5 cursor-pointer rounded-lg transition-all duration-200 ${
                        isRevealed 
                          ? status === 'missed'
                            ? (isDarkMode ? 'text-red-400 bg-red-950/50 border border-red-500/60 font-bold shadow-sm' : 'text-red-600 bg-red-50 border border-red-300 font-bold shadow-sm')
                            : (isDarkMode ? 'text-[#E6B981]' : 'text-[#D4A373]') 
                          : 'opacity-15 blur-[4px] select-none text-gray-500'
                      }`}
                      style={{ fontSize: `${fontSize}px` }}
                    >
                      {word.original}
                    </span>
                    
                    {isLastWordInAyah && (
                      <span 
                        className={`inline-flex items-center justify-center mx-1.5 md:mx-2 rounded-full font-sans border-[2.5px] border-double transition-all ${
                          isRevealed
                            ? (isDarkMode ? "text-[#E6B981] border-[#E6B981]" : "text-[#D4A373] border-[#D4A373]") 
                            : "opacity-15 blur-[2px] text-gray-500 border-gray-500"
                        }`}
                        style={{ 
                          width: `${fontSize * (isAr ? 1.3 : 1.1)}px`, 
                          height: `${fontSize * (isAr ? 1.3 : 1.1)}px`, 
                          fontSize: `${fontSize * 0.45}px`,
                          transform: isAr ? 'translateY(-2px)' : 'translateY(-1px)'
                        }}
                      >
                        {word.ayahNumber}
                      </span>
                    )}
                  </span>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col items-center gap-3 mt-8">
            {currentIndex < currentWords.length ? (
              <>
                <div className={`h-6 w-full max-w-md text-center text-xs md:text-sm truncate px-4 font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {isListening && liveTranscript ? `جاري السماع: "${liveTranscript}"` : ''}
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={toggleListening}
                    className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm md:text-base transition-all transform hover:scale-105 shadow-md ${
                      isListening 
                        ? 'bg-red-500 text-white animate-pulse' 
                        : 'bg-[#D4A373] text-white hover:bg-[#b58555]'
                    }`}
                  >
                    {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                    {isListening ? t.stop : t.start}
                  </button>

                  <button 
                    onClick={handleHintClick}
                    className={`p-3 rounded-full font-bold transition-all border shadow-sm ${
                      isDarkMode ? 'border-gray-700 text-[#E6B981] hover:bg-gray-700' : 'border-[#F0EBE1] text-[#D4A373] hover:bg-[#FDFBF7]'
                    }`}
                    title={t.hint}
                  >
                    <HelpCircle size={20} />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2 text-green-500 font-bold bg-green-50 dark:bg-green-950/40 px-6 py-3 rounded-full border border-green-200 dark:border-green-800">
                  <CheckCircle size={20} />
                  <span>{missedCount === 0 ? t.perfect : "اكتملت الصفحة بنجاح!"}</span>
                </div>
                {missedCount > 0 && (
                  <div className="flex items-center gap-2 text-xs md:text-sm font-bold text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-4 py-1.5 rounded-xl border border-red-200 dark:border-red-900/50">
                    <AlertTriangle size={16} />
                    <span>{t.missedWords} {missedCount}</span>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className={`flex items-center justify-between mt-8 pt-4 border-t ${isDarkMode ? "border-gray-700" : "border-[#F0EBE1]/60"}`}>
            <button
              onClick={handlePrevPage}
              disabled={selectedSurah.number === 1 && currentPage === 0}
              className={`flex items-center gap-1 md:gap-2 px-3 py-2 rounded-xl font-bold text-xs md:text-sm transition-all ${!isAr && 'font-sans'} ${
                selectedSurah.number === 1 && currentPage === 0
                  ? "opacity-50 cursor-not-allowed text-gray-400" 
                  : (isDarkMode ? "text-[#E6B981] hover:bg-gray-700" : "text-[#D4A373] hover:bg-[#f4efe6]")
              }`}
            >
              <PrevPageIcon size={18} />
              <span>{currentPage === 0 ? t.prevSurah : t.prevPage}</span>
            </button>
            
            <span className={`font-medium text-xs md:text-sm ${!isAr && 'font-sans'} ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              {t.page} {currentPage + 1}
            </span>
            
            <button
              onClick={handleNextPage}
              disabled={selectedSurah.number === 114 && currentPage === totalPages - 1}
              className={`flex items-center gap-1 md:gap-2 px-3 py-2 rounded-xl font-bold text-xs md:text-sm transition-all ${!isAr && 'font-sans'} ${
                selectedSurah.number === 114 && currentPage === totalPages - 1
                  ? "opacity-50 cursor-not-allowed text-gray-400" 
                  : (isDarkMode ? "text-[#E6B981] hover:bg-gray-700" : "text-[#D4A373] hover:bg-[#f4efe6]")
              }`}
            >
              <span>{currentPage === totalPages - 1 ? t.nextSurah : t.nextPage}</span>
              <NextPageIcon size={18} />
            </button>
          </div>

        </div>
      ) : null}
      
    </div>
  );
}
import { useState, useEffect, useRef, useContext } from "react";
import axios from "axios";
import { Mic, MicOff, AlertCircle, HelpCircle, CheckCircle, ChevronDown, ChevronRight, ChevronLeft, BookOpen } from "lucide-react";
import { AppContext } from "../App";

const normalizeArabic = (text) => {
  if (!text) return "";
  return text
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u06DF-\u06E8\u0640]/g, "") 
    .replace(/[أإآاٱ]/g, "ا") 
    .replace(/ة/g, "ه") 
    .replace(/ى/g, "ي") 
    .replace(/ؤ/g, "و") 
    .replace(/ئ/g, "ي") 
    .replace(/ء/g, "") 
    .replace(/الرحمان/g, "الرحمن") 
    .replace(/سموت/g, "سماوات") 
    .trim();
};

const isMatch = (spoken, target) => {
  if (!spoken || !target) return false;
  if (spoken === target) return true;
  if (spoken.length >= 3 && target.length >= 3) {
    if (spoken.includes(target) || target.includes(spoken)) return true;
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
  const [isAnimating, setIsAnimating] = useState(false);
  
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState(""); 
  const [supportError, setSupportError] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [fontSize, setFontSize] = useState(() => {
    const savedSize = localStorage.getItem("fontSize");
    return savedSize ? parseInt(savedSize) : (window.innerWidth < 768 ? 26 : 38);
  });

  const recognitionRef = useRef(null);
  const wordsRef = useRef([]);
  const isManualStopRef = useRef(false);

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
        console.error("Error fetching surahs:", err);
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
    };
    
    recognition.onend = () => {
      if (!isManualStopRef.current && wordsRef.current && currentIndex < wordsRef.current.length) {
        try { recognition.start(); } catch(e) { console.error(e); }
      } else {
        setIsListening(false);
      }
    };
    
    recognition.onerror = () => {
      if(isManualStopRef.current) setIsListening(false);
    };

    recognition.onresult = (event) => {
      let latestTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        latestTranscript += event.results[i][0].transcript + " ";
      }
      
      setLiveTranscript(latestTranscript.trim());

      let fixedTranscript = latestTranscript
        .replace(/(الف|ألف|اف|ايف)\s*(لام|لا|لم)\s*(ميم|مي)/g, "الم")
        .replace(/ألم/g, "الم")
        .replace(/علم/g, "الم") 
        .replace(/(الف|ألف)\s*(لام|لا)\s*(ميم|مي)\s*(صاد|ص)/g, "المص")
        .replace(/(الف|ألف)\s*(لام|لا)\s*(را|ر)/g, "الر")
        .replace(/(كاف|ك)\s*(ها|ه)\s*(يا|ي)\s*(عين|ع)\s*(صاد|ص)/g, "كهيعص")
        .replace(/(طا|ط)\s*(ها|ه)/g, "طه")
        .replace(/(يا|ي)\s*(سين|س)/g, "يس")
        .replace(/(حا|ح)\s*(ميم|م)/g, "حم")
        .replace(/قاف/g, "ق")
        .replace(/نون/g, "ن");

      const spokenWords = fixedTranscript.split(' ').map(normalizeArabic).filter(w => w);

      setCurrentIndex(prevIndex => {
        let newIndex = prevIndex;
        
        for (let word of spokenWords) {
          if (newIndex < wordsRef.current.length && isMatch(word, wordsRef.current[newIndex].normalized)) {
            newIndex++; 
          } else if (newIndex + 1 < wordsRef.current.length && isMatch(word, wordsRef.current[newIndex + 1].normalized)) {
            newIndex += 2; 
          } else if (newIndex + 2 < wordsRef.current.length && isMatch(word, wordsRef.current[newIndex + 2].normalized)) {
            newIndex += 3; 
          } else if (newIndex + 3 < wordsRef.current.length && isMatch(word, wordsRef.current[newIndex + 3].normalized)) {
            newIndex += 4; 
          }
        }
        
        if (newIndex > prevIndex) {
          setShowHint(false);
          setLiveTranscript(""); 
        }
        return newIndex;
      });
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, [isAr, currentIndex]);

  const loadSurahForMemorization = (surahNumber) => {
    setLoading(true);
    isManualStopRef.current = true;
    if (isListening && recognitionRef.current) recognitionRef.current.stop();
    setLiveTranscript("");
    
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
            cleanText = cleanText.replace("بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ", "").trim();
          }
          
          const ayahWords = cleanText.split(' ');
          ayahWords.forEach((w) => {
            if(w.trim()) {
              pagesMap[ayah.page].push({
                original: w,
                normalized: normalizeArabic(w),
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
        setShowHint(false);
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
      setShowHint(false);
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

  const handleWordClick = (index) => {
    if (index === currentIndex) {
      setCurrentIndex(prev => prev + 1);
      setShowHint(false);
      setLiveTranscript("");
    }
  };

  const t = {
    title: isAr ? "التسميع بالصوت" : "Voice Memorization",
    subtitle: isAr ? "اقرأ بصوتك أو اضغط على الكلمة المتعثرة لفتحها" : "Recite or tap the word to reveal",
    select: isAr ? "اختر سورة للتسميع" : "Select a Surah",
    start: isAr ? "ابدأ التسميع" : "Start Reciting",
    stop: isAr ? "إيقاف المايك" : "Stop Mic",
    hint: isAr ? "تلميح" : "Hint",
    page: isAr ? "صفحة" : "Page",
    prevSurah: isAr ? "السورة السابقة" : "Prev Surah",
    nextSurah: isAr ? "السورة التالية" : "Next Surah",
    prevPage: isAr ? "السابق" : "Prev",
    nextPage: isAr ? "التالي" : "Next",
  };

  const currentWords = surahPages[currentPage] || [];
  const totalPages = surahPages.length;
  const currentJuz = currentWords[0]?.juz || "";
  
  const PrevPageIcon = isAr ? ChevronRight : ChevronLeft;
  const NextPageIcon = isAr ? ChevronLeft : ChevronRight;

  return (
    <div className="max-w-4xl mx-auto p-2 md:p-6 pt-20 pb-28" dir={isAr ? "rtl" : "ltr"}>
      
      <div className="text-center mb-8 mt-4 px-2">
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

      
      <div className="relative mb-8 max-w-sm mx-auto z-40 px-2 flex justify-center">
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
        <div className={`px-4 md:px-12 py-8 rounded-xl shadow-md border-x border-b transition-colors duration-300 min-h-[60vh] flex flex-col justify-between ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-[#FFFdf9] border-[#E8E1D3]'}`}>
          
          <div className={`flex justify-between items-center w-full pb-2 mb-4 border-b-2 ${!isAr && 'font-sans'} ${isDarkMode ? "border-gray-700 text-gray-400" : "border-[#D4A373]/30 text-gray-400"} font-bold text-sm md:text-base`}>
            <span>{isAr ? selectedSurah.name : selectedSurah.englishName}</span>
            <span>{t.juz} {currentJuz}</span>
          </div>

          <div className={`transition-opacity duration-300 ease-in-out text-center flex-1 ${isAnimating ? "opacity-0" : "opacity-100"}`}>
            
            {currentPage === 0 && selectedSurah.number !== 1 && selectedSurah.number !== 9 && (
              <div className={`text-center ${isAr ? 'text-2xl md:text-4xl' : 'text-xl md:text-2xl'} mb-6 md:mb-8 ${isAr ? 'font-quran' : 'font-serif font-medium tracking-wide'} ${isDarkMode ? "text-[#E6B981]" : "text-[#D4A373]"}`}>
                {isAr ? "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ" : "In the name of Allah..."}
              </div>
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
              {currentWords.map((word, index) => {
                const isRevealed = index < currentIndex;
                const isCurrent = index === currentIndex;
                const showAsHint = isCurrent && showHint;
                const isLastWordInAyah = index === currentWords.length - 1 || word.ayahNumber !== currentWords[index + 1].ayahNumber;

                return (
                  <span key={word.id} className="inline">
                    <span 
                      onClick={() => handleWordClick(index)}
                      className={`inline-block mx-0.5 cursor-pointer transition-all duration-300 ${
                        isRevealed 
                          ? (isDarkMode ? 'text-[#E6B981]' : 'text-[#D4A373]') 
                          : showAsHint 
                            ? (isDarkMode ? 'text-red-400 border-b-2 border-red-400' : 'text-red-500 border-b-2 border-red-500') 
                            : 'opacity-15 blur-[4px] select-none text-gray-500'
                      }`}
                      style={{ fontSize: `${fontSize}px` }}
                    >
                      {word.original}
                    </span>
                    
                    {isLastWordInAyah && (
                      <span 
                        className={`inline-flex items-center justify-center mx-1.5 md:mx-2 rounded-full font-sans border-[3px] border-double transition-all ${
                          isRevealed || (isCurrent && showHint)
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

          <div className="flex flex-col items-center gap-4 mt-10">
            {currentIndex < currentWords.length ? (
              <>
                <div className={`h-8 w-full max-w-sm text-center text-sm truncate px-4 font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {isListening && liveTranscript ? `سمعتك تقول: "${liveTranscript}"` : ''}
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
                    onClick={() => setShowHint(true)}
                    className={`p-3 rounded-full font-bold transition-colors border ${
                      isDarkMode ? 'border-gray-700 text-[#E6B981] hover:bg-gray-700' : 'border-[#F0EBE1] text-[#D4A373] hover:bg-[#FDFBF7]'
                    }`}
                    title={t.hint}
                  >
                    <HelpCircle size={20} />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 text-green-500 font-bold bg-green-50 px-6 py-3 rounded-full">
                <CheckCircle size={24} /> اكتملت الصفحة
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
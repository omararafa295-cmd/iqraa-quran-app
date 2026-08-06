import { useState, useEffect, useRef, useContext } from "react";
import axios from "axios";
import { Mic, MicOff, ChevronDown, ChevronLeft, Eye, EyeOff, BookOpen } from "lucide-react";
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
    .replace(/صلوه/g, "صلاه")
    .replace(/زكوه/g, "زكاه")
    .trim();
};

const formatAyahText = (text, ayahNumberInSurah, surahNumber) => {
  if (ayahNumberInSurah === 1 && surahNumber !== 1 && surahNumber !== 9) {
    const words = text.split(' ');
    if (words.length > 4) return words.slice(4).join(' ');
  }
  return text;
};

export default function Memorize() {
  const { isDarkMode, lang } = useContext(AppContext);
  const isAr = lang === 'ar';

  const [surahs, setSurahs] = useState([]);
  const [selectedSurah, setSelectedSurah] = useState(null);
  const [ayahs, setAyahs] = useState([]);
  const [currentAyahIndex, setCurrentAyahIndex] = useState(0);
  
  const [isListening, setIsListening] = useState(false);
  const [spokenText, setSpokenText] = useState("");
  const [showHint, setShowHint] = useState(false);

  const recognitionRef = useRef(null);
  const isListeningRef = useRef(false);
  const carryOverTextRef = useRef("");
  const consumedWordsCountRef = useRef(0);

  useEffect(() => {
    const cached = localStorage.getItem('offline_surahs_list');
    if (cached) {
      setSurahs(JSON.parse(cached));
    } else {
      axios.get("https://api.alquran.cloud/v1/surah").then(res => setSurahs(res.data.data));
    }

    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  const loadSurah = (surahNumber) => {
    if (!surahNumber) return;
    
    setIsListening(false);
    isListeningRef.current = false;
    if (recognitionRef.current) recognitionRef.current.stop();

    axios.get(`https://api.alquran.cloud/v1/surah/${surahNumber}`).then(res => {
      setSelectedSurah(res.data.data);
      setAyahs(res.data.data.ayahs);
      setCurrentAyahIndex(0);
      setSpokenText("");
      carryOverTextRef.current = "";
      consumedWordsCountRef.current = 0;
      setShowHint(false);
    });
  };

  const skipAyah = () => {
    carryOverTextRef.current = "";
    consumedWordsCountRef.current = 0;
    setSpokenText("");
    setShowHint(false);
    
    if (currentAyahIndex < ayahs.length - 1) {
      setCurrentAyahIndex(prev => prev + 1);
    } else {
      setIsListening(false);
      isListeningRef.current = false;
      if (recognitionRef.current) recognitionRef.current.stop();
      alert(isAr ? "ما شاء الله! أتممت السورة." : "Mashallah! Surah completed.");
    }
  };

  useEffect(() => {
    if (!spokenText || !ayahs[currentAyahIndex]) return;

    const currentTarget = formatAyahText(ayahs[currentAyahIndex].text, ayahs[currentAyahIndex].numberInSurah, selectedSurah.number);
    const normTarget = normalizeArabic(currentTarget);

    let tWords = normTarget.split(' ').filter(w => w.length > 0);
    let uWords = spokenText.split(' ').filter(w => w.length > 0);

    if (tWords.length === 0 || uWords.length === 0) return;

    let isMatch = false;
    let consumeWordCount = 0;

    let sNoSpace = spokenText.replace(/\s+/g, '');
    let tNoSpace = normTarget.replace(/\s+/g, '');

    if (tWords.length <= 2) {
      if (sNoSpace.includes(tNoSpace)) {
        let tempStr = "";
        for(let i=0; i<uWords.length; i++) {
          tempStr += uWords[i];
          if (tempStr.includes(tNoSpace)) {
            consumeWordCount = i + 1;
            isMatch = true;
            break;
          }
        }
      }
    } else {
      let matchCount = 0;
      for(let i = 0; i < uWords.length; i++) {
        if (tWords.some(tw => uWords[i].includes(tw) || tw.includes(uWords[i]))) {
          matchCount++;
        }
        if (matchCount / tWords.length >= 0.70) {
          isMatch = true;
          consumeWordCount = i + 1;
          break;
        }
      }
      if (!isMatch && sNoSpace.includes(tNoSpace)) {
        let tempStr = "";
        for(let i=0; i<uWords.length; i++) {
          tempStr += uWords[i];
          if (tempStr.includes(tNoSpace)) {
            consumeWordCount = i + 1;
            isMatch = true;
            break;
          }
        }
      }
    }

    if (isMatch) {
      consumedWordsCountRef.current += consumeWordCount;
      setSpokenText(uWords.slice(consumeWordCount).join(' '));
      setShowHint(false);

      if (currentAyahIndex < ayahs.length - 1) {
        setCurrentAyahIndex(prev => prev + 1);
      } else {
        setIsListening(false);
        isListeningRef.current = false;
        if (recognitionRef.current) recognitionRef.current.stop();
        alert(isAr ? "ما شاء الله! أتممت السورة بنجاح." : "Mashallah! Surah completed.");
      }
    }
  }, [spokenText, currentAyahIndex, ayahs, selectedSurah, isAr]);

  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
      isListeningRef.current = false;
      if (recognitionRef.current) recognitionRef.current.stop();
    } else {
      carryOverTextRef.current = "";
      consumedWordsCountRef.current = 0;
      setSpokenText("");
      startRecognition();
    }
  };

  const startRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(isAr ? "متصفحك لا يدعم هذه الخاصية. يرجى استخدام جوجل كروم." : "Browser not supported. Try Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'ar-SA';

    recognition.onresult = (event) => {
      let rawFull = "";
      for(let i = 0; i < event.results.length; i++) {
        rawFull += event.results[i][0].transcript + " ";
      }
      let normFull = normalizeArabic(rawFull);
      let activeText = (carryOverTextRef.current + " " + normFull).trim();
      let allWords = activeText.split(' ').filter(x=>x);
      
      let unconsumedWords = allWords.slice(consumedWordsCountRef.current);
      setSpokenText(unconsumedWords.join(' '));
    };

    recognition.onend = () => {
      if (isListeningRef.current) {
        carryOverTextRef.current = spokenText;
        consumedWordsCountRef.current = 0;
        try { recognition.start(); } catch (e) {}
      }
    };

    recognition.onerror = (e) => {
      if (e.error === 'not-allowed') {
        setIsListening(false);
        isListeningRef.current = false;
      }
    };

    recognitionRef.current = recognition;
    setIsListening(true);
    isListeningRef.current = true;
    recognition.start();
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 pt-20" dir={isAr ? "rtl" : "ltr"}>
      
      <div className="flex flex-col items-center mb-8">
        <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${isDarkMode ? 'bg-gray-800 text-[#E6B981]' : 'bg-[#FDFBF7] text-[#D4A373]'}`}>
          <BookOpen size={28} />
        </div>
        <h2 className={`text-3xl font-bold font-quran ${isDarkMode ? 'text-[#E6B981]' : 'text-[#D4A373]'}`}>
          {isAr ? "التسميع الذكي" : "Smart Memorization"}
        </h2>
        <p className="text-gray-500 text-sm md:text-base mt-3 text-center max-w-md leading-relaxed">
          {isAr ? "اختر السورة وابدأ التسميع. النظام سيتعرف على صوتك ويطابق الآيات تلقائياً." : "Select a Surah and start reciting. The system will auto-match your voice."}
        </p>
      </div>

      <div className="relative mb-8 z-20 max-w-sm mx-auto">
        <select
          onChange={(e) => loadSurah(e.target.value)}
          className={`w-full p-4 rounded-2xl border shadow-sm outline-none appearance-none font-bold text-center transition-colors ${
            isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-200 focus:border-[#E6B981]' : 'bg-white border-[#F0EBE1] text-gray-800 focus:border-[#D4A373]'
          }`}
        >
          <option value="">{isAr ? "اختر السورة لتسميعها..." : "Select Surah..."}</option>
          {surahs.map(s => (
            <option key={s.number} value={s.number}>
              {s.number}. {s.name}
            </option>
          ))}
        </select>
        <ChevronDown className={`absolute ${isAr ? 'left-5' : 'right-5'} top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none`} />
      </div>

      {selectedSurah && ayahs.length > 0 && (
        <div className={`flex flex-col items-center justify-center p-5 md:p-8 rounded-[2rem] border shadow-lg transition-colors ${
          isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-[#F0EBE1]'
        }`}>
          
          <div className="flex justify-between w-full mb-8 text-sm font-bold text-[#D4A373] dark:text-[#E6B981]">
            <span>{selectedSurah.name}</span>
            <span>{isAr ? 'الآية' : 'Ayah'} {currentAyahIndex + 1} / {ayahs.length}</span>
          </div>

          {currentAyahIndex > 0 && (
            <div className="mb-6 opacity-40 text-lg md:text-xl font-quran text-gray-800 dark:text-gray-200 leading-loose text-center">
              {formatAyahText(ayahs[currentAyahIndex - 1].text, ayahs[currentAyahIndex - 1].numberInSurah, selectedSurah.number)}
            </div>
          )}

          <div className="relative mb-10 w-full text-center">
            <div className={`text-2xl md:text-4xl font-quran leading-[2.2] transition-all duration-500 ${
              !showHint ? "blur-md opacity-30 select-none" : "blur-0 opacity-100 text-gray-900 dark:text-white"
            }`}>
              {formatAyahText(ayahs[currentAyahIndex].text, ayahs[currentAyahIndex].numberInSurah, selectedSurah.number)}
            </div>

            {!showHint && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className={`font-bold text-xs md:text-sm px-5 py-2 rounded-full border shadow-sm ${
                  isDarkMode ? 'bg-gray-900 text-gray-400 border-gray-700' : 'bg-gray-50 text-gray-500 border-gray-200'
                }`}>
                  {isAr ? 'الآية مخفية للتسميع' : 'Ayah Hidden for Memorization'}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-4 mb-8">
            <button
              onClick={() => setShowHint(!showHint)}
              className={`p-3.5 rounded-full transition-colors ${
                isDarkMode ? 'bg-gray-700 text-gray-300 hover:text-[#E6B981]' : 'bg-gray-50 text-gray-600 hover:text-[#D4A373]'
              }`}
            >
              {showHint ? <EyeOff size={22} /> : <Eye size={22} />}
            </button>
            <button
              onClick={skipAyah}
              className={`p-3.5 rounded-full transition-colors ${
                isDarkMode ? 'bg-gray-700 text-gray-300 hover:text-[#E6B981]' : 'bg-gray-50 text-gray-600 hover:text-[#D4A373]'
              }`}
            >
              <ChevronLeft size={22} className={!isAr ? 'rotate-180' : ''} />
            </button>
          </div>

          <div className={`w-full rounded-3xl p-6 border text-center transition-colors ${
            isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-[#FDFBF7] border-[#F0EBE1]'
          }`}>
            <button
              onClick={toggleListening}
              className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 shadow-xl transition-all duration-300 ${
                isListening
                  ? 'bg-red-500 text-white animate-pulse shadow-red-500/30'
                  : 'bg-[#D4A373] dark:bg-[#E6B981] text-white dark:text-gray-900'
              }`}
            >
              {isListening ? <MicOff size={32} /> : <Mic size={32} />}
            </button>

            <div className={`min-h-[60px] text-lg font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {isListening ? (
                spokenText ? (
                  <span className="text-gray-800 dark:text-gray-200">{spokenText}</span>
                ) : (
                  <span className="opacity-50 animate-pulse">{isAr ? "تحدث الآن..." : "Listening..."}</span>
                )
              ) : (
                <span className="opacity-50">{isAr ? "اضغط على المايك للبدء" : "Tap mic to start"}</span>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
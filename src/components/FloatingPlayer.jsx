import { useEffect, useRef, useState, useContext } from 'react';
import { Play, Pause, X, Volume2, Loader2, SkipForward, SkipBack } from 'lucide-react';
import { AppContext } from '../App';

export default function FloatingPlayer() {
  const { isDarkMode, lang, currentAudio, setCurrentAudio, isPlaying, setIsPlaying, isRadioPlaying } = useContext(AppContext);
  const isAr = lang === 'ar';
  
  const audioRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const currentAyah = currentAudio?.ayahs?.[currentAudio?.currentAyahIndex || 0];
  useEffect(() => {
    if (isRadioPlaying && isPlaying) {
      setIsPlaying(false);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }
  }, [isRadioPlaying, isPlaying, setIsPlaying]);

  useEffect(() => {
    if (currentAudio && currentAyah?.audio) {
      setIsLoading(true);
      audioRef.current.src = currentAyah.audio;
      
      if (isPlaying) {
        audioRef.current.play()
          .then(() => setIsLoading(false))
          .catch(err => {
            console.error("Audio play error:", err);
            setIsLoading(false);
          });
      } else {
        setIsLoading(false);
      }
    } else if (!currentAudio) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
      setIsPlaying(false);
    }
  }, [currentAudio?.surahId, currentAudio?.reciterId, currentAudio?.currentAyahIndex]);

  useEffect(() => {
    if (!audioRef.current || !audioRef.current.src) return;
    if (isPlaying) {
      audioRef.current.play().catch(e => console.log(e));
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  const handleTimeUpdate = () => {
    const { currentTime, duration } = audioRef.current;
    if (duration) {
      setProgress((currentTime / duration) * 100);
    }
  };

  const handleEnded = () => {
    if (currentAudio?.ayahs && currentAudio.currentAyahIndex < currentAudio.ayahs.length - 1) {
      setCurrentAudio(prev => ({
        ...prev,
        currentAyahIndex: prev.currentAyahIndex + 1
      }));
    } else {
      setIsPlaying(false);
      setProgress(0);
    }
  };

  const handleNextAyah = () => {
    if (currentAudio?.ayahs && currentAudio.currentAyahIndex < currentAudio.ayahs.length - 1) {
      setCurrentAudio(prev => ({
        ...prev,
        currentAyahIndex: prev.currentAyahIndex + 1
      }));
    }
  };

  const handlePrevAyah = () => {
    if (currentAudio?.ayahs && currentAudio.currentAyahIndex > 0) {
      setCurrentAudio(prev => ({
        ...prev,
        currentAyahIndex: prev.currentAyahIndex - 1
      }));
    }
  };

  const closePlayer = () => {
    setCurrentAudio(null);
    setIsPlaying(false);
  };

  if (!currentAudio) return null;

  return (
    <div 
      className={`fixed bottom-20 left-3 right-3 md:bottom-6 md:left-auto md:right-8 md:w-96 z-[100] rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.3)] border overflow-hidden transition-all duration-300 ${
        isDarkMode ? 'bg-gray-900/95 border-gray-700 text-gray-100 backdrop-blur-md' : 'bg-white/95 border-[#F0EBE1] text-gray-800 backdrop-blur-md'
      }`} 
      dir={isAr ? "rtl" : "ltr"}
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-gray-200 dark:bg-gray-800">
        <div 
          className={`h-full transition-all duration-300 ${isDarkMode ? 'bg-[#E6B981]' : 'bg-[#D4A373]'}`}
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      <div className="p-3 md:p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center ${
            isDarkMode ? 'bg-gray-800 text-[#E6B981]' : 'bg-[#F0EBE1] text-[#D4A373]'
          }`}>
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Volume2 size={18} />}
          </div>
          <div className="flex flex-col truncate">
            <span className={`font-bold font-quran text-base md:text-lg truncate ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
              سورة {currentAudio.nameAr}
              {currentAyah && (
                <span className="text-xs font-sans opacity-75 mx-1">
                  ({isAr ? 'آية' : 'Ayah'} {currentAyah.numberInSurah})
                </span>
              )}
            </span>
            <span className={`text-[10px] md:text-xs font-bold truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {currentAudio.reciterName || (isAr ? 'القارئ المحدد' : 'Selected Reciter')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button 
            onClick={handlePrevAyah}
            disabled={!currentAudio?.currentAyahIndex}
            className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-30"
            title={isAr ? "الآية السابقة" : "Previous Ayah"}
          >
            {isAr ? <SkipForward size={16} /> : <SkipBack size={16} />}
          </button>

          <button 
            onClick={() => {
              // لو هنشغل القرآن نقفل الراديو الأول
              if (!isPlaying) setIsPlaying(true);
              else setIsPlaying(false);
            }}
            className={`w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center shadow-md active:scale-95 transition-all ${
              isDarkMode ? 'bg-[#E6B981] text-gray-900' : 'bg-[#D4A373] text-white'
            }`}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} className={isAr ? "mr-0.5" : "ml-0.5"} />}
          </button>

          <button 
            onClick={handleNextAyah}
            disabled={currentAudio?.currentAyahIndex >= (currentAudio?.ayahs?.length || 1) - 1}
            className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-30"
            title={isAr ? "الآية التالية" : "Next Ayah"}
          >
            {isAr ? <SkipBack size={16} /> : <SkipForward size={16} />}
          </button>

          <button 
            onClick={closePlayer}
            className={`p-1.5 rounded-full transition-colors ${
              isDarkMode ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-400 hover:bg-gray-100'
            }`}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <audio 
        ref={audioRef} 
        onTimeUpdate={handleTimeUpdate} 
        onEnded={handleEnded}
        onCanPlay={() => setIsLoading(false)}
        onWaiting={() => setIsLoading(true)}
      />
    </div>
  );
}
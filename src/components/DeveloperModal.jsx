import { useContext } from "react";
import { X, Mail, Code2 } from "lucide-react";
import { AppContext } from "../App";
import { motion, AnimatePresence } from "framer-motion";

export default function DeveloperModal({ isOpen, onClose }) {
  const { isDarkMode, lang } = useContext(AppContext);
  const isAr = lang === 'ar';

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className={`relative w-full max-w-md p-6 rounded-[2.5rem] shadow-2xl border ${
            isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-[#FFFdf9] border-[#F0EBE1] text-gray-800'
          }`}
          dir={isAr ? "rtl" : "ltr"}
        >
          <button 
            onClick={onClose}
            className={`absolute top-5 ${isAr ? 'left-5' : 'right-5'} p-2 rounded-full transition-colors ${
              isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
            }`}
          >
            <X size={20} />
          </button>

          <div className="flex flex-col items-center text-center mt-2">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-md ${
              isDarkMode ? 'bg-gray-700 text-[#E5C158]' : 'bg-[#FDFBF7] text-[#D4AF37] border border-[#E8DCC4]'
            }`}>
              <Code2 size={32} />
            </div>

            <h3 className={`text-2xl font-bold mb-1 ${isAr ? 'font-quran' : 'font-serif'}`}>
              Omar Mounir Arafa
            </h3>
            <p className="text-xs text-[#D4AF37] font-bold mb-4">
              {isAr ? "مطور التطبيق & Software Developer" : "Lead Developer"}
            </p>

            <p className="text-sm opacity-80 leading-relaxed mb-6 px-2">
              {isAr 
                ? "نسأل الله أن يجعله صدقة جارية. إذا واجهتك أي مشكلة أو كان لديك اقتراح لميزة جديدة، يسعدني تواصلك معي مباشرة!" 
                : "We hope this app serves as continuous charity. Feel free to reach out if you found any bug or have a feature request!"}
            </p>

            <div className="flex flex-col gap-3 w-full">
              <a 
                href="mailto:omararafa294@gmail.com" 
                className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-2xl font-bold text-sm transition-all shadow-sm ${
                  isDarkMode 
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
                    : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'
                }`}
              >
                <Mail size={18} className="text-red-500" />
                <span>omararafa294@gmail.com</span>
              </a>

              <a 
                href="https://github.com/omararafa295-cmd" 
                target="_blank" 
                rel="noopener noreferrer" 
                className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-2xl font-bold text-sm transition-all shadow-sm ${
                  isDarkMode 
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
                    : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'
                }`}
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                <span>GitHub Profile</span>
              </a>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 w-full text-[11px] opacity-60 flex items-center justify-center gap-1">
              <span>Omar Mounir Arafa © 2026 all rights reserved</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
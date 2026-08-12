import { useState, useEffect, useContext } from "react";
import { Sun, Moon, RotateCcw, Heart, AlertTriangle, ChevronDown, Bed } from "lucide-react";
import { AppContext } from "../App";

const initialMorningAzkar = [
  { id: 1, text: "اللَّهُ لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَّهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَن ذَا الَّذِي يَشْفَعُ عِندَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِّنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ. (آية الكرسي)", count: 1, originalCount: 1 },
  { id: 2, text: "قُلْ هُوَ اللَّهُ أَحَدٌ ﴿١﴾ اللَّهُ الصَّمَدُ ﴿٢﴾ لَمْ يَلِدْ وَلَمْ يُولَدْ ﴿٣﴾ وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ ﴿٤﴾ (سورة الإخلاص)", count: 3, originalCount: 3 },
  { id: 3, text: "قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ ﴿١﴾ مِن شَرِّ مَا خَلَقَ ﴿٢﴾ وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ ﴿٣﴾ وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ ﴿٤﴾ وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ ﴿٥﴾ (سورة الفلق)", count: 3, originalCount: 3 },
  { id: 4, text: "قُلْ أَعُوذُ بِرَبِّ النَّاسِ ﴿١﴾ مَلِكِ النَّاسِ ﴿٢﴾ إِلَهِ النَّاسِ ﴿٣﴾ مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ ﴿٤﴾ الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ ﴿٥﴾ مِنَ الْجِنَّةِ وَالنَّاسِ ﴿٦﴾ (سورة الناس)", count: 3, originalCount: 3 },
  { id: 5, text: "أَصْبَحْنا وَأَصْبَحَ المُلْكُ لله وَالحَمدُ لله ، لا إلهَ إلاّ اللّهُ وَحدَهُ لا شَريكَ لهُ، لهُ المُلكُ ولهُ الحَمْد، وهُوَ على كلّ شَيءٍ قدير ، رَبِّ أسْأَلُكَ خَيرَ ما في هذا اليوم وَخَيرَ ما بَعْدَه ، وَأَعوذُ بِكَ مِنْ شَرِّ ما في هذا اليوم وَشَرِّ ما بَعْدَه، رَبِّ أَعوذُبِكَ مِنَ الْكَسَلِ وَسوءِ الْكِبَر ، رَبِّ أَعوذُ بِكَ مِنْ عَذابٍ في النّارِ وَعَذابٍ في القَبْر.", count: 1, originalCount: 1 },
  { id: 6, text: "اللّهمَّ أَنْتَ رَبِّي لا إلهَ إلاّ أَنْتَ ، خَلَقْتَني وَأَنا عَبْدُك ، وَأَنا عَلى عَهْدِكَ وَوَعْدِكَ ما اسْتَطَعْت ، أَعوذُبِكَ مِنْ شَرِّ ما صَنَعْت ، أَبوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ وَأَبوءُ بِذَنْبي فَاغْفِرْ لي فَإِنَّهُ لا يَغْفِرُ الذُّنوبَ إِلاّ أَنْتَ. (سيد الاستغفار)", count: 1, originalCount: 1 },
  { id: 7, text: "اللّهُمَّ إِنِّي أَصْبَحْتُ أُشْهِدُك ، وَأُشْهِدُ حَمَلَةَ عَرْشِك ، وَمَلَائِكَتَكَ ، وَجَميعَ خَلْقِك ، أَنَّكَ أَنْتَ اللهُ لا إلهَ إلاّ أَنْتَ وَحْدَكَ لا شَريكَ لَك ، وَأَنَّ مُحَمّداً عَبْدُكَ وَرَسولُك.", count: 4, originalCount: 4 },
  { id: 8, text: "اللّهُمَّ ما أَصْبَحَ بي مِنْ نِعْمَةٍ أَو بِأَحَدٍ مِنْ خَلْقِك ، فَمِنْكَ وَحْدَكَ لا شريكَ لَك ، فَلَكَ الْحَمْدُ وَلَكَ الشُّكْر.", count: 1, originalCount: 1 },
  { id: 9, text: "حَسْبِيَ اللّهُ لا إلهَ إلاّ هُوَ عَلَيهِ تَوَكَّلتُ وَهُوَ رَبُّ العَرْشِ العَظيم.", count: 7, originalCount: 7 },
  { id: 10, text: "بِسمِ اللهِ الذي لا يَضُرُّ مَعَ اسمِهِ شَيءٌ في الأرْضِ وَلا في السّماءِ وَهوَ السّميعُ العَليم.", count: 3, originalCount: 3 },
  { id: 11, text: "اللّهُمَّ بِكَ أَصْبَحْنا وَبِكَ أَمْسَينا ، وَبِكَ نَحْيا وَبِكَ نَمُوتُ وَإِلَيْكَ النُّشُور.", count: 1, originalCount: 1 },
  { id: 12, text: "أَصْبَحْنا عَلَى فِطْرَةِ الإسْلاَمِ، وَعَلَى كَلِمَةِ الإِخْلاَصِ، وَعَلَى دِينِ نَبِيِّنَا مُحَمَّدٍ صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ، وَعَلَى مِلَّةِ أَبِينَا إبْرَاهِيمَ حَنِيفاً مُسْلِماً وَمَا كَانَ مِنَ المُشْرِكِينَ.", count: 1, originalCount: 1 },
  { id: 13, text: "سُبْحانَ اللهِ وَبِحَمْدِهِ عَدَدَ خَلْقِه ، وَرِضا نَفْسِه ، وَزِنَةَ عَرْشِه ، وَمِدادَ كَلِماتِه.", count: 3, originalCount: 3 },
  { id: 14, text: "اللّهُمَّ عافِني في بَدَني ، اللّهُمَّ عافِني في سَمْعي ، اللّهُمَّ عافِني في بَصَري ، لا إلهَ إلاّ أَنْتَ.", count: 3, originalCount: 3 },
  { id: 15, text: "اللّهُمَّ إِنّي أَعوذُ بِكَ مِنَ الْكُفر ، وَالفَقْر ، وَأَعوذُ بِكَ مِنْ عَذابِ القَبْر ، لا إلهَ إلاّ أَنْتَ.", count: 3, originalCount: 3 },
  { id: 16, text: "اللّهُمَّ إِنِّي أسْأَلُكَ العَفْوَ وَالعافِيةَ في الدُّنْيا وَالآخِرَة ، اللّهُمَّ إِنِّي أسْأَلُكَ العَفْوَ وَالعافِيةَ في ديني وَدُنْيايَ وَأهْلي وَمالي ، اللّهُمَّ اسْتُرْ عوْراتي وَآمِنْ رَوْعاتي ، اللّهُمَّ احْفَظْني مِن بَينِ يَدَيَّ وَمِن خَلْفي وَعَن يَميني وَعَن شِمالي ، وَمِن فَوْقي ، وَأَعوذُ بِعَظَمَتِكَ أَن أُغْتالَ مِن تَحْتي.", count: 1, originalCount: 1 },
  { id: 17, text: "يَا حَيُّ يَا قيُّومُ بِرَحْمَتِكَ أسْتَغِيثُ أصْلِحْ لِي شَأنِي كُلَّهُ وَلاَ تَكِلْنِي إلَى نَفْسِي طَرْفَةَ عَيْنٍ.", count: 3, originalCount: 3 },
  { id: 18, text: "أَصْبَحْنا وَأَصْبَحْ المُلكُ للهِ رَبِّ العالَمين ، اللّهُمَّ إِنِّي أسْأَلُكَ خَيْرَ هذا اليَوْم ، فَتْحَهُ ، وَنَصْرَهُ ، وَنورَهُ وَبَرَكَتَهُ ، وَهُداهُ ، وَأَعوذُ بِكَ مِنْ شَرِّ ما فيهِ وَشَرِّ ما بَعْدَه.", count: 1, originalCount: 1 },
  { id: 19, text: "اللّهُمَّ عالِمَ الغَيْبِ وَالشّهادَةِ فاطِرَ السّماواتِ وَالأرْضِ رَبَّ كلِّ شَيءٍ وَمَليكَه ، أَشْهَدُ أَنْ لا إِلهَ إِلاّ أَنْت ، أَعوذُ بِكَ مِن شَرِّ نَفْسي وَمِن شَرِّ الشَّيْطانِ وَشِرْكِهِ ، وَأَنْ أَقْتَرِفَ عَلى نَفْسي سوءاً أَوْ أَجُرَّهُ إِلى مُسْلِم.", count: 1, originalCount: 1 },
  { id: 20, text: "أَعوذُ بِكَلِماتِ اللّهِ التّامّاتِ مِنْ شَرِّ ما خَلَق.", count: 3, originalCount: 3 },
  { id: 21, text: "اللَّهُمَّ صَلِّ وَسَلِّمْ وَبَارِكْ على نَبِيِّنَا مُحمَّد.", count: 10, originalCount: 10 },
  { id: 22, text: "اللَّهُمَّ إِنَّا نَعُوذُ بِكَ مِنْ أَنْ نُشْرِكَ بِكَ شَيْئًا نَعْلَمُهُ ، وَنَسْتَغْفِرُكَ لِمَا لَا نَعْلَمُهُ.", count: 3, originalCount: 3 },
  { id: 23, text: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنْ الْهَمِّ وَالْحَزَنِ، وَأَعُوذُ بِكَ مِنْ الْعَجْزِ وَالْكَسَلِ، وَأَعُوذُ بِكَ مِنْ الْجُبْنِ وَالْبُخْلِ، وَأَعُوذُ بِكَ مِنْ غَلَبَةِ الدَّيْنِ، وَقَهْرِ الرِّجَالِ.", count: 3, originalCount: 3 },
  { id: 24, text: "أسْتَغْفِرُ اللهَ العَظِيمَ الَّذِي لاَ إلَهَ إلاَّ هُوَ، الحَيُّ القَيُّومُ، وَأتُوبُ إلَيهِ.", count: 3, originalCount: 3 },
  { id: 25, text: "يَا رَبِّ , لَكَ الْحَمْدُ كَمَا يَنْبَغِي لِجَلَالِ وَجْهِكَ , وَلِعَظِيمِ سُلْطَانِكَ.", count: 3, originalCount: 3 },
  { id: 26, text: "اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا، وَرِزْقًا طَيِّبًا، وَعَمَلًا مُتَقَبَّلًا.", count: 1, originalCount: 1 },
  { id: 27, text: "اللَّهُمَّ أَنْتَ رَبِّي لا إِلَهَ إِلا أَنْتَ ، عَلَيْكَ تَوَكَّلْتُ ، وَأَنْتَ رَبُّ الْعَرْشِ الْعَظِيمِ , مَا شَاءَ اللَّهُ كَانَ ، وَمَا لَمْ يَشَأْ لَمْ يَكُنْ ، وَلا حَوْلَ وَلا قُوَّةَ إِلا بِاللَّهِ الْعَلِيِّ الْعَظِيمِ , أَعْلَمُ أَنَّ اللَّهَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ ، وَأَنَّ اللَّهَ قَدْ أَحَاطَ بِكُلِّ شَيْءٍ عِلْمًا , اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنْ شَرِّ نَفْسِي ، وَمِنْ شَرِّ كُلِّ دَابَّةٍ أَنْتَ آخِذٌ بِنَاصِيَتِهَا ، إِنَّ رَبِّي عَلَى صِرَاطٍ مُسْتَقِيمٍ.", count: 1, originalCount: 1 },
  { id: 28, text: "لَا إلَه إلّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءِ قَدِيرِ.", count: 100, originalCount: 100 },
  { id: 29, text: "سُبْحانَ اللهِ وَبِحَمْدِهِ.", count: 100, originalCount: 100 },
  { id: 30, text: "أسْتَغْفِرُ اللهَ وَأتُوبُ إلَيْهِ.", count: 100, originalCount: 100 }
];

const initialEveningAzkar = [
  { id: 1, text: "اللَّهُ لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَّهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَن ذَا الَّذِي يَشْفَعُ عِندَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِّنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ. (آية الكرسي)", count: 1, originalCount: 1 },
  { id: 2, text: "قُلْ هُوَ اللَّهُ أَحَدٌ ﴿١﴾ اللَّهُ الصَّمَدُ ﴿٢﴾ لَمْ يَلِدْ وَلَمْ يُولَدْ ﴿٣﴾ وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ ﴿٤﴾ (سورة الإخلاص)", count: 3, originalCount: 3 },
  { id: 3, text: "قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ ﴿١﴾ مِن شَرِّ مَا خَلَقَ ﴿٢﴾ وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ ﴿٣﴾ وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ ﴿٤﴾ وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ ﴿٥﴾ (سورة الفلق)", count: 3, originalCount: 3 },
  { id: 4, text: "قُلْ أَعُوذُ بِرَبِّ النَّاسِ ﴿١﴾ مَلِكِ النَّاسِ ﴿٢﴾ إِلَهِ النَّاسِ ﴿٣﴾ مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ ﴿٤﴾ الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ ﴿٥﴾ مِنَ الْجِنَّةِ وَالنَّاسِ ﴿٦﴾ (سورة الناس)", count: 3, originalCount: 3 },
  { id: 5, text: "أَمْسَيْنا وَأَمْسى الملكُ لله وَالحَمدُ لله ، لا إلهَ إلاّ اللّهُ وَحدَهُ لا شَريكَ لهُ، لهُ المُلكُ ولهُ الحَمْد، وهُوَ على كلّ شَيءٍ قدير ، رَبِّ أسْأَلُكَ خَيرَ ما في هذهِ اللَّيْلَةِ وَخَيرَ ما بَعْدَها ، وَأَعوذُ بِكَ مِنْ شَرِّ ما في هذهِ اللَّيْلةِ وَشَرِّ ما بَعْدَها ، رَبِّ أَعوذُبِكَ مِنَ الْكَسَلِ وَسوءِ الْكِبَر ، رَبِّ أَعوذُ بِكَ مِنْ عَذابٍ في النّارِ وَعَذابٍ في القَبْر.", count: 1, originalCount: 1 },
  { id: 6, text: "اللّهمَّ أَنْتَ رَبِّي لا إلهَ إلاّ أَنْتَ ، خَلَقْتَني وَأَنا عَبْدُك ، وَأَنا عَلى عَهْدِكَ وَوَعْدِكَ ما اسْتَطَعْت ، أَعوذُبِكَ مِنْ شَرِّ ما صَنَعْت ، أَبوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ وَأَبوءُ بِذَنْبي فَاغْفِرْ لي فَإِنَّهُ لا يَغْفِرُ الذُّنوبَ إِلاّ أَنْتَ. (سيد الاستغفار)", count: 1, originalCount: 1 },
  { id: 7, text: "اللّهُمَّ إِنِّي أَمسيتُ أُشْهِدُك ، وَأُشْهِدُ حَمَلَةَ عَرْشِك ، وَمَلَائِكَتَكَ ، وَجَميعَ خَلْقِك ، أَنَّكَ أَنْتَ اللهُ لا إلهَ إلاّ أَنْتَ وَحْدَكَ لا شَريكَ لَك ، وَأَنَّ مُحَمّداً عَبْدُكَ وَرَسولُك.", count: 4, originalCount: 4 },
  { id: 8, text: "اللّهُمَّ ما أَمسى بي مِنْ نِعْمَةٍ أَو بِأَحَدٍ مِنْ خَلْقِك ، فَمِنْكَ وَحْدَكَ لا شريكَ لَك ، فَلَكَ الْحَمْدُ وَلَكَ الشُّكْر.", count: 1, originalCount: 1 },
  { id: 9, text: "حَسْبِيَ اللّهُ لا إلهَ إلاّ هُوَ عَلَيهِ تَوَكَّلتُ وَهُوَ رَبُّ العَرْشِ العَظيم.", count: 7, originalCount: 7 },
  { id: 10, text: "بِسمِ اللهِ الذي لا يَضُرُّ مَعَ اسمِهِ شَيءٌ في الأرْضِ وَلا في السّماءِ وَهوَ السّميعُ العَليم.", count: 3, originalCount: 3 },
  { id: 11, text: "اللّهُمَّ بِكَ أَمْسَينا وَبِكَ أَصْبَحْنا، وَبِكَ نَحْيا وَبِكَ نَمُوتُ وَإِلَيْكَ الْمَصِيرُ.", count: 1, originalCount: 1 },
  { id: 12, text: "أَمْسَيْنَا عَلَى فِطْرَةِ الإسْلاَمِ، وَعَلَى كَلِمَةِ الإِخْلاَصِ، وَعَلَى دِينِ نَبِيِّنَا مُحَمَّدٍ صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ، وَعَلَى مِلَّةِ أَبِينَا إبْرَاهِيمَ حَنِيفاً مُسْلِماً وَمَا كَانَ مِنَ المُشْرِكِينَ.", count: 1, originalCount: 1 },
  { id: 13, text: "سُبْحانَ اللهِ وَبِحَمْدِهِ عَدَدَ خَلْقِه ، وَرِضا نَفْسِه ، وَزِنَةَ عَرْشِه ، وَمِدادَ كَلِماتِه.", count: 3, originalCount: 3 },
  { id: 14, text: "اللّهُمَّ عافِني في بَدَني ، اللّهُمَّ عافِني في سَمْعي ، اللّهُمَّ عافِني في بَصَري ، لا إلهَ إلاّ أَنْتَ.", count: 3, originalCount: 3 },
  { id: 15, text: "اللّهُمَّ إِنّي أَعوذُ بِكَ مِنَ الْكُفر ، وَالفَقْر ، وَأَعوذُ بِكَ مِنْ عَذابِ القَبْر ، لا إلهَ إلاّ أَنْتَ.", count: 3, originalCount: 3 },
  { id: 16, text: "اللّهُمَّ إِنِّي أسْأَلُكَ العَفْوَ وَالعافِيةَ في الدُّنْيا وَالآخِرَة ، اللّهُمَّ إِنِّي أسْأَلُكَ العَفْوَ وَالعافِيةَ في ديني وَدُنْيايَ وَأهْلي وَمالي ، اللّهُمَّ اسْتُرْ عوْراتي وَآمِنْ رَوْعاتي ، اللّهُمَّ احْفَظْني مِن بَينِ يَدَيَّ وَمِن خَلْفي وَعَن يَميني وَعَن شِمالي ، وَمِن فَوْقي ، وَأَعوذُ بِعَظَمَتِكَ أَن أُغْتالَ مِن تَحْتي.", count: 1, originalCount: 1 },
  { id: 17, text: "يَا حَيُّ يَا قيُّومُ بِرَحْمَتِكَ أسْتَغِيثُ أصْلِحْ لِي شَأنِي كُلَّهُ وَلاَ تَكِلْنِي إلَى نَفْسِي طَرْفَةَ عَيْنٍ.", count: 3, originalCount: 3 },
  { id: 18, text: "اللّهُمَّ عالِمَ الغَيْبِ وَالشّهادَةِ فاطِرَ السّماواتِ وَالأرْضِ رَبَّ كلِّ شَيءٍ وَمَليكَه ، أَشْهَدُ أَنْ لا إِلهَ إِلاّ أَنْت ، أَعوذُ بِكَ مِن شَرِّ نَفْسي وَمِن شَرِّ الشَّيْطانِ وَشِرْكِهِ ، وَأَنْ أَقْتَرِفَ عَلى نَفْسي سوءاً أَوْ أَجُرَّهُ إِلى مُسْلِم.", count: 1, originalCount: 1 },
  { id: 19, text: "أَعوذُ بِكَلِماتِ اللّهِ التّامّاتِ مِنْ شَرِّ ما خَلَق.", count: 3, originalCount: 3 },
  { id: 20, text: "اللَّهُمَّ صَلِّ وَسَلِّمْ وَبَارِكْ على نَبِيِّنَا مُحمَّد.", count: 10, originalCount: 10 },
  { id: 21, text: "اللَّهُمَّ إِنَّا نَعُوذُ بِكَ مِنْ أَنْ نُشْرِكَ بِكَ شَيْئًا نَعْلَمُهُ ، وَنَسْتَغْفِرُكَ لِمَا لَا نَعْلَمُهُ.", count: 3, originalCount: 3 },
  { id: 22, text: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنْ الْهَمِّ وَالْحَزَنِ، وَأَعُوذُ بِكَ مِنْ الْعَجْزِ وَالْكَسَلِ، وَأَعُوذُ بِكَ مِنْ الْجُبْنِ وَالْبُخْلِ، وَأَعُوذُ بِكَ مِنْ غَلَبَةِ الدَّيْنِ، وَقَهْرِ الرِّجَالِ.", count: 3, originalCount: 3 },
  { id: 23, text: "أسْتَغْفِرُ اللهَ العَظِيمَ الَّذِي لاَ إلَهَ إلاَّ هُوَ، الحَيُّ القَيُّومُ، وَأتُوبُ إلَيهِ.", count: 3, originalCount: 3 },
  { id: 24, text: "يَا رَبِّ , لَكَ الْحَمْدُ كَمَا يَنْبَغِي لِجَلَالِ وَجْهِكَ , وَلِعَظِيمِ سُلْطَانِكَ.", count: 3, originalCount: 3 },
  { id: 25, text: "لَا إلَه إلّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءِ قَدِيرِ.", count: 100, originalCount: 100 },
  { id: 26, text: "اللَّهُمَّ أَنْتَ رَبِّي لا إِلَهَ إِلا أَنْتَ ، عَلَيْكَ تَوَكَّلْتُ ، وَأَنْتَ رَبُّ الْعَرْشِ الْعَظِيمِ , مَا شَاءَ اللَّهُ كَانَ ، وَمَا لَمْ يَشَأْ لَمْ يَكُنْ ، وَلا حَوْلَ وَلا قُوَّةَ إِلا بِاللَّهِ الْعَلِيِّ الْعَظِيمِ , أَعْلَمُ أَنَّ اللَّهَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ ، وَأَنَّ اللَّهَ قَدْ أَحَاطَ بِكُلِّ شَيْءٍ عِلْمًا , اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنْ شَرِّ نَفْسِي ، وَمِنْ شَرِّ كُلِّ دَابَّةٍ أَنْتَ آخِذٌ بِنَاصِيَتِهَا ، إِنَّ رَبِّي عَلَى صِرَاطٍ مُسْتَقِيمٍ.", count: 1, originalCount: 1 },
  { id: 27, text: "سُبْحانَ اللهِ وَبِحَمْدِهِ.", count: 100, originalCount: 100 }
];

const initialSleepAzkar = [
  { id: 1, text: "اللَّهُ لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَّهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَن ذَا الَّذِي يَشْفَعُ عِندَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِّنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ. (آية الكرسي)", count: 1, originalCount: 1 },
  { id: 2, text: "آمَنَ الرَّسُولُ بِمَا أُنزِلَ إِلَيْهِ مِن رَّبِّهِ وَالْمُؤْمِنُونَ كُلٌّ آمَنَ بِاللَّهِ وَمَلآئِكَتِهِ وَكُتُبِهِ وَرُسُلِهِ لاَ نُفَرِّقُ بَيْنَ أَحَدٍ مِّن رُّسُلِهِ وَقَالُواْ سَمِعْنَا وَأَطَعْنَا غُفْرَانَكَ رَبَّنَا وَإِلَيْكَ الْمَصِيرُ * لاَ يُكَلِّفُ اللَّهُ نَفْساً إِلاَّ وُسْعَهَا لَهَا مَا كَسَبَتْ وَعَلَيْهَا مَا اكْتَسَبَتْ رَبَّنَا لاَ تُؤَاخِذْنَا إِن نَّسِينَا أَوْ أَخْطَأْنَا رَبَّنَا وَلاَ تَحْمِلْ عَلَيْنَا إِصْراً كَمَا حَمَلْتَهُ عَلَى الَّذِينَ مِن قَبْلِنَا رَبَّنَا وَلاَ تُحَمِّلْنَا مَا لاَ طَاقَةَ لَنَا بِهِ وَاعْفُ عَنَّا وَاغْفِرْ لَنَا وَارْحَمْنَآ أَنتَ مَوْلاَنَا فَانصُرْنَا عَلَى الْقَوْمِ الْكَافِرِينَ. (خواتيم سورة البقرة)", count: 1, originalCount: 1 },
  { id: 3, text: "قُلْ هُوَ اللَّهُ أَحَدٌ ﴿١﴾ اللَّهُ الصَّمَدُ ﴿٢﴾ لَمْ يَلِدْ وَلَمْ يُولَدْ ﴿٣﴾ وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ ﴿٤﴾ (سورة الإخلاص)", count: 3, originalCount: 3 },
  { id: 4, text: "قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ ﴿١﴾ مِن شَرِّ مَا خَلَقَ ﴿٢﴾ وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ ﴿٣﴾ وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ ﴿٤﴾ وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ ﴿٥﴾ (سورة الفلق)", count: 3, originalCount: 3 },
  { id: 5, text: "قُلْ أَعُوذُ بِرَبِّ النَّاسِ ﴿١﴾ مَلِكِ النَّاسِ ﴿٢﴾ إِلَهِ النَّاسِ ﴿٣﴾ مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ ﴿٤﴾ الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ ﴿٥﴾ مِنَ الْجِنَّةِ وَالنَّاسِ ﴿٦﴾ (سورة الناس)", count: 3, originalCount: 3 },
  { id: 6, text: "قُلْ يَا أَيُّهَا الْكَافِرُونَ ﴿١﴾ لَا أَعْبُدُ مَا تَعْبُدُونَ ﴿٢﴾ وَلَا أَنتُمْ عَابِدُونَ مَا أَعْبُدُ ﴿٣﴾ وَلَا أَنَا عَابِدٌ مَّا عَبَدتُّمْ ﴿٤﴾ وَلَا أَنتُمْ عَابِدُونَ مَا أَعْبُدُ ﴿٥﴾ لَكُمْ دِينُكُمْ وَلِيَ دِينِ ﴿٦﴾ (سورة الكافرون)", count: 1, originalCount: 1 },
  { id: 7, text: "بِاسْمِكَ رَبِّي وَضَعْتُ جَنْبِي، وَبِكَ أَرْفَعُهُ، فَإِن أَمْسَكْتَ نَفْسِي فارْحَمْهَا، وَإِنْ أَرْسَلْتَهَا فَاحْفَظْهَا، بِمَا تَحْفَظُ بِهِ عِبَادَكَ الصَّالِحِينَ.", count: 1, originalCount: 1 },
  { id: 8, text: "اللَّهُمَّ إِنَّكَ خَلَقْتَ نَفْسِي وَأَنْتَ تَوَفَّاهَا، لَكَ مَمَاتُهَا وَمَحْياهَا، إِنْ أَحْيَيْتَهَا فَاحْفَظْهَا، وَإِنْ أَمَتَّهَا فَاغْفِرْ لَهَا. اللَّهُمَّ إِنِّي أَسْأَلُكَ العَافِيَةَ.", count: 1, originalCount: 1 },
  { id: 9, text: "اللَّهُمَّ قِنِي عَذَابَكَ يَوْمَ تَبْعَثُ عِبَادَكَ.", count: 1, originalCount: 1 },
  { id: 10, text: "بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا.", count: 1, originalCount: 1 },
  { id: 11, text: "سُبْحَانَ اللَّهِ  وَالْحَمْدُ لِلَّهِ  وَاللَّهُ أَكْبَرُ.", count: 33, originalCount: 33 },
  { id: 12, text: "اللَّهُمَّ رَبَّ السَّمَاوَاتِ السَّبْعِ وَرَبَّ الْأَرْضِ، وَرَبَّ الْعَرْشِ الْعَظِيمِ، رَبَّنَا وَرَبَّ كُلِّ شَيْءٍ، فَالِقَ الْحَبِّ وَالنَّوَى، وَمُنْزِلَ التَّوْرَاةِ وَالْإِنْجِيلِ، وَالْفُرْقَانِ، أَعُوذُ بِكَ مِنْ شَرِّ كُلِّ شَيْءٍ أَنْتَ آخِذٌ بِنَاصِيَتِهِ. اللَّهُمَّ أَنْتَ الْأَوَّلُ فَلَيْسَ قَبْلَكَ شَيْءٌ، وَأَنْتَ الْآخِرُ فَلَيْسَ بَعْدَكَ شَيْءٌ، وَأَنْتَ الظَّاهِرُ فَلَيْسَ فَوْقَكَ شَيْءٌ، وَأَنْتَ الْبَاطِنُ فَلَيْسَ دُونَكَ شَيْءٌ، اقْضِ عَنَّا الدَّيْنَ وَأَغْنِنَا مِنَ الْفَقْرِ.", count: 1, originalCount: 1 },
  { id: 13, text: "الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنَا وَسَقَانَا، وَكَفَانَا، وَآوَانَا، فَكَمْ مِمَّنْ لاَ كَافِيَ لَهُ وَلاَ مُؤْوِيَ.", count: 1, originalCount: 1 },
  { id: 14, text: "اللَّهُمَّ عَالِمَ الغَيْبِ وَالشَّهَادَةِ فَاطِرَ السَّمَاوَاتِ وَالْأَرْضِ، رَبَّ كُلِّ شَيْءٍ وَمَلِيكَهُ، أَشْهَدُ أَنْ لاَ إِلَهَ إِلاَّ أَنْتَ، أَعُوذُ بِكَ مِنْ شَرِّ نَفْسِي، وَمِنْ شَرِّ الشَّيْطانِ وَشِرْكِهِ، وَأَنْ أَقْتَرِفَ عَلَى نَفْسِي سُوءاً، أَوْ أَجُرَّهُ إِلَى مُسْلِمٍ.", count: 1, originalCount: 1 },
  { id: 15, text: "اللَّهُمَّ أَسْلَمْتُ نَفْسِي إِلَيْكَ، وَفَوَّضْتُ أَمْرِي إِلَيْكَ، وَوَجَّهْتُ وَجْهِي إِلَيْكَ، وَأَلْجَأْتُ ظَهْرِي إِلَيْكَ، رَغْبَةً وَرَهْبَةً إِلَيْكَ، لاَ مَلْجَأَ وَلاَ مَنْجَا مِنْكَ إِلاَّ إِلَيْكَ، آمَنْتُ بِكِتَابِكَ الَّذِي أَنْزَلْتَ، وَبِنَبِيِّكَ الَّذِي أَرْسَلْتَ.", count: 1, originalCount: 1 },
  { id: 16, text: "اللَّهمَّ إِنِّي أَعُوُذُ بِكَ مِنَ الْبرَصِ، وَالجُنُونِ، والجُذَامِ، وسّيءِ الأَسْقامِ.", count: 1, originalCount: 1 }
];

const BEADS_PER_LAP = 33;

export default function Azkar() {
  const { isDarkMode, lang } = useContext(AppContext);
  const isAr = lang === 'ar';
  
  const [activeTab, setActiveTab] = useState("tasbih");
  const [tasbihCount, setTasbihCount] = useState(() => parseInt(localStorage.getItem("tasbihCount")) || 0);
  const [morningAzkar, setMorningAzkar] = useState(initialMorningAzkar);
  const [eveningAzkar, setEveningAzkar] = useState(initialEveningAzkar);
  const [sleepAzkar, setSleepAzkar] = useState(initialSleepAzkar);

  const [showResetModal, setShowResetModal] = useState(false);
  const [resetTarget, setResetTarget] = useState(null);

  useEffect(() => {
    localStorage.setItem("tasbihCount", tasbihCount);
  }, [tasbihCount]);

  const triggerVibration = () => {
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  const handleTasbihClick = () => {
    triggerVibration();
    setTasbihCount(prev => prev + 1);
  };

  const requestReset = (target) => {
    setResetTarget(target);
    setShowResetModal(true);
  };

  const confirmReset = () => {
    if (resetTarget === 'tasbih') setTasbihCount(0);
    else if (resetTarget === 'morning') setMorningAzkar(initialMorningAzkar);
    else if (resetTarget === 'evening') setEveningAzkar(initialEveningAzkar);
    else if (resetTarget === 'sleep') setSleepAzkar(initialSleepAzkar);
    setShowResetModal(false);
  };

  const handleZikrClick = (id, type) => {
    triggerVibration();
    const updateFn = prev => prev.map(zikr => 
      zikr.id === id && zikr.count > 0 ? { ...zikr, count: zikr.count - 1 } : zikr
    );

    if (type === 'morning') setMorningAzkar(updateFn);
    else if (type === 'evening') setEveningAzkar(updateFn);
    else if (type === 'sleep') setSleepAzkar(updateFn);
  };

  const t = {
    title: isAr ? "الأذكار والسبحة" : "Azkar & Tasbih",
    tasbih: isAr ? "السبحة" : "Tasbih",
    morning: isAr ? "الصباح" : "Morning",
    evening: isAr ? "المساء" : "Evening",
    sleep: isAr ? "قبل النوم" : "Sleep",
    clickToCount: isAr ? "اضغط للتسبيح" : "Tap to count",
    reset: isAr ? "تصفير" : "Reset",
    done: isAr ? "تم الانتهاء بفضل الله ✨" : "Completed successfully ✨",
    confirmTitle: isAr ? "تأكيد التصفير" : "Confirm Reset",
    confirmMsg: isAr ? "هل أنت متأكد أنك تريد تصفير العداد والبدء من جديد؟" : "Are you sure you want to reset the counter?",
    cancelBtn: isAr ? "إلغاء" : "Cancel",
    confirmBtn: isAr ? "نعم، صفر العداد" : "Yes, Reset",
    lap: isAr ? "الخرزة" : "Bead",
    of: isAr ? "من" : "of",
    laps: isAr ? "دورات مكتملة" : "Completed rounds",
  };

  const posInLap = tasbihCount % BEADS_PER_LAP;
  const filledBeads = tasbihCount > 0 && posInLap === 0 ? BEADS_PER_LAP : posInLap;
  const completedLaps = Math.floor(tasbihCount / BEADS_PER_LAP);
  const ringRotation = -(filledBeads * (360 / BEADS_PER_LAP));

  const renderAzkarList = (azkarList, type) => {
    const remainingAzkar = azkarList.filter(z => z.count > 0);

    if (remainingAzkar.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Heart size={64} className="text-[#D4A373] mb-4 opacity-50" />
          <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-[#E6B981]' : 'text-[#D4A373]'}`}>{t.done}</h3>
          <button onClick={() => requestReset(type)} className="mt-6 flex items-center gap-2 text-gray-500 hover:text-[#D4A373] transition-colors">
            <RotateCcw size={18} /> {t.reset}
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-4 pb-10">
        <div className="flex justify-end mb-2">
          <button onClick={() => requestReset(type)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#D4A373] transition-colors">
            <RotateCcw size={16} /> {t.reset}
          </button>
        </div>
        {remainingAzkar.map(zikr => (
          <div 
            key={zikr.id} 
            onClick={() => handleZikrClick(zikr.id, type)}
            className={`p-6 rounded-2xl cursor-pointer transition-all duration-300 transform hover:scale-[1.02] border shadow-sm relative overflow-hidden ${
              isDarkMode ? 'bg-gray-800 border-gray-700 hover:border-[#E6B981]' : 'bg-white border-[#F0EBE1] hover:border-[#D4A373]'
            }`}
          >
            <div 
              className="absolute top-0 left-0 h-full bg-[#D4A373]/10 transition-all duration-300"
              style={{ width: `${((zikr.originalCount - zikr.count) / zikr.originalCount) * 100}%` }}
            ></div>
            
            <p className={`relative z-10 text-xl leading-loose ${isAr ? 'font-quran' : 'font-sans'} ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
              {zikr.text}
            </p>
            <div className="relative z-10 flex justify-between items-center mt-6 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
              <span className={`text-sm font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {isAr ? 'المتبقي:' : 'Remaining:'} <span className={`text-xl mx-1 ${isDarkMode ? 'text-[#E6B981]' : 'text-[#D4A373]'}`}>{zikr.count}</span>
              </span>
              <div className={`w-10 h-10 flex items-center justify-center rounded-full font-bold bg-[#D4A373] text-white shadow-md`}>
                {zikr.originalCount}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-xl mx-auto p-4 md:p-6 pt-20" dir={isAr ? "rtl" : "ltr"}>
      <h2 className={`text-3xl font-bold mb-8 text-center ${isAr ? 'font-quran' : 'font-serif'} ${isDarkMode ? 'text-[#E6B981]' : 'text-[#D4A373]'}`}>
        {t.title}
      </h2>

      {/* التعديل السحري هنا للـ 4 تابات جمب بعض */}
      <div className={`grid grid-cols-4 gap-1 p-1 sm:gap-2 sm:p-2 rounded-2xl mb-8 ${isDarkMode ? 'bg-gray-800' : 'bg-[#F0EBE1]/50'}`}>
        <button onClick={() => setActiveTab("tasbih")} className={`flex flex-col sm:flex-row justify-center items-center gap-1 sm:gap-2 py-2 sm:py-3 rounded-xl font-bold text-[10px] sm:text-xs md:text-sm transition-all ${activeTab === "tasbih" ? (isDarkMode ? "bg-gray-700 text-[#E6B981]" : "bg-white text-[#D4A373] shadow-sm") : "text-gray-500 hover:text-gray-400"}`}>
          <Heart size={18} className="shrink-0" /> <span className="text-center">{t.tasbih}</span>
        </button>
        <button onClick={() => setActiveTab("morning")} className={`flex flex-col sm:flex-row justify-center items-center gap-1 sm:gap-2 py-2 sm:py-3 rounded-xl font-bold text-[10px] sm:text-xs md:text-sm transition-all ${activeTab === "morning" ? (isDarkMode ? "bg-gray-700 text-[#E6B981]" : "bg-white text-[#D4A373] shadow-sm") : "text-gray-500 hover:text-gray-400"}`}>
          <Sun size={18} className="shrink-0" /> <span className="text-center">{t.morning}</span>
        </button>
        <button onClick={() => setActiveTab("evening")} className={`flex flex-col sm:flex-row justify-center items-center gap-1 sm:gap-2 py-2 sm:py-3 rounded-xl font-bold text-[10px] sm:text-xs md:text-sm transition-all ${activeTab === "evening" ? (isDarkMode ? "bg-gray-700 text-[#E6B981]" : "bg-white text-[#D4A373] shadow-sm") : "text-gray-500 hover:text-gray-400"}`}>
          <Moon size={18} className="shrink-0" /> <span className="text-center">{t.evening}</span>
        </button>
        <button onClick={() => setActiveTab("sleep")} className={`flex flex-col sm:flex-row justify-center items-center gap-1 sm:gap-2 py-2 sm:py-3 rounded-xl font-bold text-[10px] sm:text-xs md:text-sm transition-all ${activeTab === "sleep" ? (isDarkMode ? "bg-gray-700 text-[#E6B981]" : "bg-white text-[#D4A373] shadow-sm") : "text-gray-500 hover:text-gray-400"}`}>
          <Bed size={18} className="shrink-0" /> <span className="text-center">{t.sleep}</span>
        </button>
      </div>

      {activeTab === "tasbih" && (
        <div className="flex flex-col items-center justify-center py-6">

          <div className={`mb-1 ${isDarkMode ? 'text-[#E6B981]' : 'text-[#D4A373]'}`}>
            <ChevronDown size={22} strokeWidth={3} />
          </div>

          <div className="relative w-80 h-80 mb-4 select-none flex items-center justify-center">
            
            <div className="absolute inset-0 rounded-full overflow-hidden">
              <div
                className="absolute inset-0 transition-transform duration-300 ease-out"
                style={{ transform: `rotate(${ringRotation}deg)` }}
              >
                {Array.from({ length: BEADS_PER_LAP }).map((_, i) => {
                  const angle = (i / BEADS_PER_LAP) * 2 * Math.PI - Math.PI / 2;
                  const radius = 148;
                  const x = Math.cos(angle) * radius;
                  const y = Math.sin(angle) * radius;
                  const isFilled = i < filledBeads;
                  const isNext = i === filledBeads;
                  const size = isNext ? 20 : 15;

                  return (
                    <div
                      key={i}
                      className={`absolute rounded-full transition-colors duration-200 ${
                        isFilled
                          ? (isDarkMode ? 'bg-[#E6B981] shadow-[0_0_10px_rgba(230,185,129,0.55)]' : 'bg-[#D4A373] shadow-[0_0_10px_rgba(212,163,115,0.45)]')
                          : isNext
                            ? (isDarkMode ? 'bg-gray-800 border-2 border-[#E6B981] animate-pulse' : 'bg-white border-2 border-[#D4A373] animate-pulse')
                            : (isDarkMode ? 'bg-gray-700 border border-gray-600' : 'bg-[#F0EBE1] border border-[#E2D8C3]')
                      }`}
                      style={{
                        width: `${size}px`,
                        height: `${size}px`,
                        left: `calc(50% + ${x}px - ${size / 2}px)`,
                        top: `calc(50% + ${y}px - ${size / 2}px)`,
                      }}
                    />
                  );
                })}

                <div
                  className={`absolute rounded-full shadow-md ${isDarkMode ? 'bg-[#b58555]' : 'bg-[#9c6b3f]'}`}
                  style={{ width: '24px', height: '24px', left: 'calc(50% - 12px)', top: 'calc(50% - 148px - 4px)' }}
                />
              </div>
            </div>

            <button 
              onClick={handleTasbihClick}
              className={`relative z-10 w-52 h-52 rounded-full flex flex-col items-center justify-center shadow-[0_10px_40px_rgba(212,163,115,0.3)] border-8 active:scale-95 transition-transform duration-100 ${
                isDarkMode ? 'bg-gray-800 border-[#E6B981] text-[#E6B981]' : 'bg-white border-[#D4A373] text-[#D4A373]'
              }`}
            >
              <span className="text-6xl font-bold font-sans">{tasbihCount}</span>
              <span className={`mt-2 text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t.clickToCount}</span>
            </button>
          </div>

          <div className={`text-sm font-bold mb-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {t.lap} {filledBeads} {t.of} {BEADS_PER_LAP}
            {completedLaps > 0 && (
              <span className={isDarkMode ? 'text-[#E6B981]' : 'text-[#D4A373]'}> · {completedLaps} {t.laps}</span>
            )}
          </div>
          
          <button 
            onClick={() => requestReset('tasbih')}
            className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-colors ${
              isDarkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-gray-600 hover:bg-gray-50 shadow-sm border border-[#F0EBE1]'
            }`}
          >
            <RotateCcw size={18} /> {t.reset}
          </button>
        </div>
      )}

      {activeTab === "morning" && renderAzkarList(morningAzkar, 'morning')}
      {activeTab === "evening" && renderAzkarList(eveningAzkar, 'evening')}
      {activeTab === "sleep" && renderAzkarList(sleepAzkar, 'sleep')}
      
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowResetModal(false)}>
          <div 
            className={`w-full max-w-sm p-6 rounded-[2rem] shadow-2xl transform transition-all ${isDarkMode ? "bg-gray-800 border border-gray-700" : "bg-white"}`} 
            onClick={e => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isDarkMode ? "bg-red-500/20 text-red-400" : "bg-red-50 text-red-500"}`}>
                <AlertTriangle size={32} />
              </div>
              <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? "text-gray-100" : "text-gray-800"}`}>{t.confirmTitle}</h3>
              <p className={`text-sm font-medium mb-8 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{t.confirmMsg}</p>
              
              <div className="flex w-full gap-3">
                <button 
                  onClick={() => setShowResetModal(false)}
                  className={`flex-1 py-3 rounded-xl font-bold transition-colors ${isDarkMode ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                >
                  {t.cancelBtn}
                </button>
                <button 
                  onClick={confirmReset}
                  className="flex-1 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-colors shadow-md"
                >
                  {t.confirmBtn}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
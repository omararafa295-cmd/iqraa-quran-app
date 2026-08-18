import { useState, useEffect, useContext, useRef, useCallback } from "react";
import axios from "axios";
import { Compass, AlertTriangle, Hand } from "lucide-react";
import { AppContext } from "../App";
import { motion } from "framer-motion";

const KaabaIcon = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M4 8L12 4L20 8V18C20 19.1046 19.1046 20 18 20H6C4.89543 20 4 19.1046 4 18V8Z"
      fill="#1A1A1A"
    />
    <path
      d="M4 8L12 12L20 8"
      stroke="#D4AF37"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 12V20"
      stroke="#D4AF37"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M4 11H20"
      stroke="#D4AF37"
      strokeWidth="1.5"
    />
  </svg>
);

export default function Qibla() {
  const { isDarkMode, lang } = useContext(AppContext);
  const isAr = lang === "ar";

  const [qiblaDirection, setQiblaDirection] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isCompassActive, setIsCompassActive] = useState(false);
  const [isAligned, setIsAligned] = useState(false);

  const compassRingRef = useRef(null);
  const kaabaContainerRef = useRef(null);

  const currentHeadingRef = useRef(null);
  const qiblaDirRef = useRef(null);
  const hasValidSensorDataRef = useRef(false);

  const orientationListenerRef = useRef(null);
  const sensorTimeoutRef = useRef(null);

  const t = {
    title: isAr ? "اتجاه القبلة" : "Qibla Direction",

    north: isAr ? "ش" : "N",
    south: isAr ? "ج" : "S",
    east: isAr ? "ق" : "E",
    west: isAr ? "غ" : "W",

    angleMsg: isAr
      ? "زاوية القبلة من موقعك"
      : "Qibla angle from your location",

    correctMsg: isAr
      ? "أنت الآن تواجه القبلة 🕋"
      : "You are facing the Qibla 🕋",

    wrongMsg: isAr
      ? "لف الهاتف حتى تتطابق الكعبة مع المؤشر العلوي"
      : "Rotate phone until Kaaba matches top pointer",

    activateBtn: isAr
      ? "تفعيل بوصلة القبلة"
      : "Activate Qibla Compass",

    loading: isAr
      ? "جاري التحديد..."
      : "Locating...",

    errBrowser: isAr
      ? "متصفحك لا يدعم تحديد الموقع."
      : "Your browser does not support geolocation.",

    errDenied: isAr
      ? "تم رفض صلاحية البوصلة. اسمح بالوصول إلى مستشعر الحركة والاتجاه من إعدادات المتصفح."
      : "Compass permission was denied. Allow motion and orientation access in your browser settings.",

    errLocation: isAr
      ? "يرجى السماح بصلاحية الموقع."
      : "Please allow location permission.",

    errLocationUnavailable: isAr
      ? "تعذر الحصول على موقعك الحالي."
      : "Unable to determine your current location.",

    errLocationTimeout: isAr
      ? "انتهى وقت تحديد الموقع. حاول مرة أخرى."
      : "Location request timed out. Please try again.",

    errServer: isAr
      ? "حدث خطأ أثناء تحديد اتجاه القبلة. تحقق من اتصال الإنترنت وحاول مرة أخرى."
      : "Could not determine the Qibla direction. Check your internet connection and try again.",

    errNoSensor: isAr
      ? "لم يتم الحصول على بيانات البوصلة. تأكد من أن جهازك يدعم مستشعر الاتجاه وحاول مرة أخرى."
      : "No compass data was received. Make sure your device supports orientation sensors and try again.",

    calibrationTip: isAr
      ? "إذا كانت البوصلة غير دقيقة، حرك هاتفك على شكل رقم 8 في الهواء"
      : "If inaccurate, move your phone in a figure 8 motion",
  };

  const normalizeAngle = useCallback((angle) => {
    return ((angle % 360) + 360) % 360;
  }, []);

  const getAngleDifference = useCallback(
    (target, current) => {
      const diff = normalizeAngle(target) - normalizeAngle(current);
      return ((diff + 540) % 360) - 180;
    },
    [normalizeAngle]
  );

  const updateCompassUI = useCallback(
    (heading) => {
      const normalizedHeading = normalizeAngle(heading);

      currentHeadingRef.current = normalizedHeading;

      if (compassRingRef.current) {
        compassRingRef.current.style.transform =
          `rotate(${-normalizedHeading}deg)`;
      }

      if (
        kaabaContainerRef.current &&
        qiblaDirRef.current !== null
      ) {
        const qiblaAngle = qiblaDirRef.current;

        const kaabaRotation =
          getAngleDifference(qiblaAngle, normalizedHeading);

        kaabaContainerRef.current.style.transform =
          `rotate(${kaabaRotation}deg)`;

        const diffAlign = Math.abs(
          getAngleDifference(qiblaAngle, normalizedHeading)
        );

        const aligned = diffAlign < 5;

        setIsAligned((previous) =>
          previous !== aligned ? aligned : previous
        );
      }
    },
    [getAngleDifference, normalizeAngle]
  );

  const handleOrientation = useCallback(
    (event) => {
      let heading = null;

      if (
        typeof event.webkitCompassHeading === "number" &&
        Number.isFinite(event.webkitCompassHeading) &&
        event.webkitCompassHeading >= 0
      ) {
        heading = event.webkitCompassHeading;
      } else if (
        typeof event.alpha === "number" &&
        Number.isFinite(event.alpha)
      ) {
        if (event.absolute === true || typeof event.webkitCompassHeading === "undefined") {
          heading = (360 - event.alpha) % 360;
        }
      }

      if (heading === null || isNaN(heading)) {
        return;
      }

      hasValidSensorDataRef.current = true;

      if (sensorTimeoutRef.current) {
        clearTimeout(sensorTimeoutRef.current);
        sensorTimeoutRef.current = null;
      }

      updateCompassUI(heading);
    },
    [updateCompassUI]
  );

  const stopCompassListeners = useCallback(() => {
    if (orientationListenerRef.current) {
      const { type, handler } = orientationListenerRef.current;
      window.removeEventListener(type, handler);
      orientationListenerRef.current = null;
    }

    window.removeEventListener("deviceorientation", handleOrientation, true);
    window.removeEventListener("deviceorientationabsolute", handleOrientation, true);
    window.removeEventListener("deviceorientation", handleOrientation, false);
    window.removeEventListener("deviceorientationabsolute", handleOrientation, false);

    if (sensorTimeoutRef.current) {
      clearTimeout(sensorTimeoutRef.current);
      sensorTimeoutRef.current = null;
    }
  }, [handleOrientation]);

  const startOrientationListener = useCallback(() => {
    hasValidSensorDataRef.current = false;

    window.addEventListener("deviceorientation", handleOrientation, true);
    window.addEventListener("deviceorientationabsolute", handleOrientation, true);

    orientationListenerRef.current = {
      type: "deviceorientation",
      handler: handleOrientation,
    };

    if (sensorTimeoutRef.current) {
      clearTimeout(sensorTimeoutRef.current);
    }

    sensorTimeoutRef.current = setTimeout(() => {
      if (!hasValidSensorDataRef.current) {
        setIsCompassActive(false);
        setError(t.errNoSensor);
        stopCompassListeners();
      }
    }, 6000);

    setIsCompassActive(true);
  }, [handleOrientation, stopCompassListeners, t.errNoSensor]);

  const requestCompassPermission = async () => {
    try {
      if (
        typeof DeviceOrientationEvent !== "undefined" &&
        typeof DeviceOrientationEvent.requestPermission === "function"
      ) {
        const permission = await DeviceOrientationEvent.requestPermission();

        if (permission !== "granted") {
          setError(t.errDenied);
          setLoading(false);
          return false;
        }
      }

      return true;
    } catch (err) {
      console.error("Device orientation permission error:", err);
      setError(t.errDenied);
      setLoading(false);
      return false;
    }
  };

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      const saved = localStorage.getItem("userLocation");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.lat && parsed.lon) {
            return { coords: { latitude: parsed.lat, longitude: parsed.lon } };
          }
        } catch {}
      }
      throw { code: 1 };
    }

    const getPos = (opts) =>
      new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, opts);
      });

    try {
      return await getPos({
        enableHighAccuracy: true,
        timeout: 7000,
        maximumAge: 60000,
      });
    } catch (err1) {
      try {
        return await getPos({
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000,
        });
      } catch (err2) {
        const saved = localStorage.getItem("userLocation");
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed.lat && parsed.lon) {
              return { coords: { latitude: parsed.lat, longitude: parsed.lon } };
            }
          } catch {}
        }
        throw err2;
      }
    }
  };

  const startCompass = async () => {
    if (loading) return;

    setLoading(true);
    setError(null);
    setIsAligned(false);
    hasValidSensorDataRef.current = false;

    const permissionGranted = await requestCompassPermission();

    if (!permissionGranted) {
      return;
    }

    try {
      const position = await getCurrentLocation();

      const { latitude, longitude } = position.coords;

      const response = await axios.get(
        `https://api.aladhan.com/v1/qibla/${latitude}/${longitude}`,
        {
          timeout: 12000,
        }
      );

      const qiblaAngle = response?.data?.data?.direction;

      if (
        typeof qiblaAngle !== "number" ||
        !Number.isFinite(qiblaAngle)
      ) {
        throw new Error("Invalid Qibla response");
      }

      const normalizedQibla = normalizeAngle(qiblaAngle);

      setQiblaDirection(normalizedQibla);
      qiblaDirRef.current = normalizedQibla;

      startOrientationListener();

      setLoading(false);
    } catch (err) {
      console.error("Qibla error:", err);
      setLoading(false);

      if (err && typeof err.code === "number") {
        switch (err.code) {
          case 1:
            setError(t.errLocation);
            break;
          case 2:
            setError(t.errLocationUnavailable);
            break;
          case 3:
            setError(t.errLocationTimeout);
            break;
          default:
            setError(t.errLocation);
        }
        return;
      }

      setError(t.errServer);
    }
  };

  useEffect(() => {
    return () => {
      stopCompassListeners();
    };
  }, [stopCompassListeners]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto p-4 md:p-6 text-center pt-20 pb-24"
      dir={isAr ? "rtl" : "ltr"}
    >
      <h2
        className={`text-3xl font-bold mb-8 mt-4 ${
          isAr
            ? "font-quran"
            : "font-serif tracking-wide"
        } ${
          isDarkMode
            ? "text-[#E5C158]"
            : "text-[#D4AF37]"
        }`}
      >
        {t.title}
      </h2>

      <div
        className={`p-8 mt-6 rounded-[3rem] flex flex-col items-center justify-center mb-8 relative border shadow-sm ${
          isDarkMode
            ? "bg-gray-800 border-gray-700"
            : "bg-[#FFFdf9] border-[#F0EBE1]"
        }`}
      >
        {/* Top pointer */}
        <div className="absolute top-4 z-20">
          <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[12px] border-[#FF6B00]" />
        </div>

        {/* Kaaba */}
        {qiblaDirection !== null && (
          <div
            ref={kaabaContainerRef}
            className="absolute top-10 z-20 origin-[50%_120px] will-change-transform"
            style={{
              transition:
                "transform 0.05s linear",
            }}
          >
            <div className="flex flex-col items-center">
              <KaabaIcon />
            </div>
          </div>
        )}

        {/* Compass */}
        <div
          ref={compassRingRef}
          className={`w-64 h-64 rounded-full border relative flex items-center justify-center shadow-[inset_0_0_50px_rgba(212,163,115,0.15)] will-change-transform ${
            isDarkMode
              ? "border-gray-600 bg-gray-700"
              : "border-[#F0EBE1] bg-gradient-to-br from-[#fffdfa] to-[#fcf6eb]"
          }`}
          style={{
            transition:
              "transform 0.05s linear",
          }}
        >
          {/* North */}
          <div
            className={`absolute top-4 font-bold text-lg ${
              isDarkMode
                ? "text-gray-300"
                : "text-gray-800"
            }`}
          >
            {t.north}
          </div>

          {/* South */}
          <div
            className={`absolute bottom-4 font-bold text-lg ${
              isDarkMode
                ? "text-gray-300"
                : "text-gray-800"
            }`}
          >
            {t.south}
          </div>

          {/* East */}
          <div
            className={`absolute right-4 font-bold text-lg ${
              isDarkMode
                ? "text-gray-300"
                : "text-gray-800"
            }`}
          >
            {t.east}
          </div>

          {/* West */}
          <div
            className={`absolute left-4 font-bold text-lg ${
              isDarkMode
                ? "text-gray-300"
                : "text-gray-800"
            }`}
          >
            {t.west}
          </div>

          {/* Decorative dots */}
          <div className="absolute top-10 right-10 w-1.5 h-1.5 bg-[#D4AF37] rounded-full" />
          <div className="absolute top-10 left-10 w-1.5 h-1.5 bg-[#D4AF37] rounded-full" />
          <div className="absolute bottom-10 right-10 w-1.5 h-1.5 bg-[#D4AF37] rounded-full" />
          <div className="absolute bottom-10 left-10 w-1.5 h-1.5 bg-[#D4AF37] rounded-full" />

          {/* Center needle */}
          <div className="relative flex flex-col items-center justify-center">
            <div className="w-1.5 h-16 bg-gradient-to-t from-[#FF6B00] to-[#FFA756] rounded-t-full mb-1" />

            <div className="w-4 h-4 bg-[#FF6B00] rounded-full shadow-md z-10" />

            <div
              className={`w-1 h-16 rounded-b-full mt-1 ${
                isDarkMode
                  ? "bg-gray-500"
                  : "bg-gray-200"
              }`}
            />
          </div>
        </div>

        {/* Qibla information */}
        {qiblaDirection !== null && (
          <div className="mt-12 text-center w-full">
            <p
              className={`text-3xl font-bold mb-2 ${
                isDarkMode
                  ? "text-gray-100"
                  : "text-gray-800"
              }`}
              dir="ltr"
            >
              {qiblaDirection.toFixed(0)}°
            </p>

            <p className="text-gray-500 text-sm font-medium">
              {t.angleMsg}
            </p>

            {isCompassActive && (
              <div className="mt-4 flex flex-col items-center gap-2">
                <p
                  className={`w-full font-bold py-2.5 px-4 rounded-xl border transition-colors ${
                    isAligned
                      ? isDarkMode
                        ? "bg-green-900/30 text-green-400 border-green-800"
                        : "bg-green-50 text-green-600 border-green-200"
                      : isDarkMode
                      ? "bg-gray-900 text-[#E5C158] border-gray-700"
                      : "bg-[#FFFdf9] text-[#D4AF37] border-[#F0EBE1]"
                  }`}
                >
                  {isAligned
                    ? t.correctMsg
                    : t.wrongMsg}
                </p>

                <p className="text-[11px] opacity-60 flex items-center gap-1 mt-1">
                  <Hand size={13} />
                  {t.calibrationTip}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Activate button */}
      {!isCompassActive && !error && (
        <button
          onClick={startCompass}
          disabled={loading}
          className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold transition-colors shadow-md ${
            isDarkMode
              ? "bg-gray-700 text-white hover:bg-gray-600"
              : "bg-[#D4AF37] text-white hover:bg-[#B8942E]"
          }`}
        >
          <Compass
            size={24}
            className={
              loading
                ? "animate-spin"
                : ""
            }
          />

          {loading
            ? t.loading
            : t.activateBtn}
        </button>
      )}

      {/* Error */}
      {error && (
        <div
          className="mt-4 text-red-500 font-medium text-sm bg-red-50 dark:bg-red-900/20 p-4 rounded-xl flex items-start gap-3 text-right"
        >
          <AlertTriangle
            size={24}
            className="shrink-0 mt-0.5"
          />

          <span className="leading-relaxed">
            {error}
          </span>
        </div>
      )}

      {/* Retry */}
      {error && (
        <button
          onClick={() => {
            setError(null);
            setQiblaDirection(null);
            qiblaDirRef.current = null;
            setIsCompassActive(false);
            setIsAligned(false);
            startCompass();
          }}
          disabled={loading}
          className={`mt-3 w-full py-3 rounded-2xl font-bold transition-colors ${
            isDarkMode
              ? "bg-gray-800 text-[#E5C158] border border-gray-700 hover:bg-gray-700"
              : "bg-white text-[#D4AF37] border border-[#F0EBE1] hover:bg-[#FDFBF7]"
          }`}
        >
          {isAr ? "حاول مرة أخرى" : "Try Again"}
        </button>
      )}
    </motion.div>
  );
}
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

export const TRANSLATIONS = {
  fr: {
    dashboard: "Dashboard",
    alertes: "Alertes",
    historique: "Historique",
    profil: "Profil",
    informations_compte: "Informations du compte",
    modifier_nom: "Modifier le nom",
    changer_mdp: "Changer le mot de passe",
    sauvegarder: "Sauvegarder",
    mettre_a_jour: "Mettre a jour",
    deconnecter: "Se deconnecter",
    parametres: "Parametres",
    gerer_users: "Gerer les utilisateurs",
    appuyer_photo: "Appuyer pour changer la photo",
    notifications: "Notifications",
    alertes_critiques: "Alertes critiques",
    alertes_critiques_sub: "Recevoir les alertes urgentes",
    temperature: "Temperature",
    temperature_sub: "Alertes de temperature anormale",
    presence: "Presence",
    presence_sub: "Detection de mouvement",
    son: "Son",
    son_sub: "Activer le son des notifications",
    seuils: "Seuils d'alerte",
    temp_max: "Temperature max",
    humidite_max: "Humidite max",
    affichage: "Affichage",
    mode_nuit: "Mode nuit",
    mode_nuit_sub: "Theme sombre active",
    mode_jour_sub: "Theme clair active",
    actualisation: "Actualisation auto",
    actualisation_sub: "Mise a jour en temps reel",
    langue: "Langue",
    informations: "Informations",
    reinitialiser: "Reinitialiser",
    sauvegarde_ok: "Sauvegarde",
    sauvegarde_msg: "Parametres enregistres !",
    reinit_titre: "Reinitialiser",
    reinit_msg: "Voulez-vous reinitialiser tous les parametres ?",
    annuler: "Annuler",
    retour: "Retour",
    chargement: "Chargement...",
  },
  en: {
    dashboard: "Dashboard",
    alertes: "Alerts",
    historique: "History",
    profil: "Profile",
    informations_compte: "Account Information",
    modifier_nom: "Edit Name",
    changer_mdp: "Change Password",
    sauvegarder: "Save",
    mettre_a_jour: "Update",
    deconnecter: "Sign Out",
    parametres: "Settings",
    gerer_users: "Manage Users",
    appuyer_photo: "Tap to change photo",
    notifications: "Notifications",
    alertes_critiques: "Critical Alerts",
    alertes_critiques_sub: "Receive urgent alerts",
    temperature: "Temperature",
    temperature_sub: "Abnormal temperature alerts",
    presence: "Presence",
    presence_sub: "Motion detection",
    son: "Sound",
    son_sub: "Enable notification sounds",
    seuils: "Alert Thresholds",
    temp_max: "Max Temperature",
    humidite_max: "Max Humidity",
    affichage: "Display",
    mode_nuit: "Night Mode",
    mode_nuit_sub: "Dark theme enabled",
    mode_jour_sub: "Light theme enabled",
    actualisation: "Auto Refresh",
    actualisation_sub: "Real-time updates",
    langue: "Language",
    informations: "Information",
    reinitialiser: "Reset",
    sauvegarde_ok: "Saved",
    sauvegarde_msg: "Settings saved!",
    reinit_titre: "Reset",
    reinit_msg: "Do you want to reset all settings?",
    annuler: "Cancel",
    retour: "Back",
    chargement: "Loading...",
  },
  ar: {
    dashboard: "لوحة التحكم",
    alertes: "التنبيهات",
    historique: "السجل",
    profil: "الملف الشخصي",
    informations_compte: "معلومات الحساب",
    modifier_nom: "تعديل الاسم",
    changer_mdp: "تغيير كلمة المرور",
    sauvegarder: "حفظ",
    mettre_a_jour: "تحديث",
    deconnecter: "تسجيل الخروج",
    parametres: "الاعدادات",
    gerer_users: "ادارة المستخدمين",
    appuyer_photo: "اضغط لتغيير الصورة",
    notifications: "الاشعارات",
    alertes_critiques: "التنبيهات الحرجة",
    alertes_critiques_sub: "استقبال التنبيهات العاجلة",
    temperature: "درجة الحرارة",
    temperature_sub: "تنبيهات درجة الحرارة",
    presence: "الحضور",
    presence_sub: "كشف الحركة",
    son: "الصوت",
    son_sub: "تفعيل صوت الاشعارات",
    seuils: "عتبات التنبيه",
    temp_max: "الحرارة القصوى",
    humidite_max: "الرطوبة القصوى",
    affichage: "العرض",
    mode_nuit: "الوضع الليلي",
    mode_nuit_sub: "السمة الداكنة مفعلة",
    mode_jour_sub: "السمة الفاتحة مفعلة",
    actualisation: "التحديث التلقائي",
    actualisation_sub: "تحديث في الوقت الفعلي",
    langue: "اللغة",
    informations: "معلومات",
    reinitialiser: "اعادة تعيين",
    sauvegarde_ok: "تم الحفظ",
    sauvegarde_msg: "تم حفظ الاعدادات!",
    reinit_titre: "اعادة تعيين",
    reinit_msg: "هل تريد اعادة تعيين جميع الاعدادات؟",
    annuler: "الغاء",
    retour: "رجوع",
    chargement: "جاري التحميل...",
  },
};

export const THEMES = {
  dark: {
    bg: "#0A1628",
    bg2: "#1E2D45",
    bg3: "#2A3F5F",
    text: "#F5F2ED",
    textSub: "#888",
    accent: "#64B5F6",
    border: "#2A3F5F",
    card: "#1E2D45",
    inputBg: "#0A1628",
  },
  light: {
    bg: "#F0F4F8",
    bg2: "#FFFFFF",
    bg3: "#E2EAF4",
    text: "#0A1628",
    textSub: "#555",
    accent: "#1565C0",
    border: "#D0DCF0",
    card: "#FFFFFF",
    inputBg: "#F7F9FC",
  },
};

type Lang = "fr" | "en" | "ar";
type ThemeMode = "dark" | "light";

interface AppContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
  themeMode: ThemeMode;
  setThemeMode: (m: ThemeMode) => void;
  theme: typeof THEMES.dark;
  isRTL: boolean;
  // ✅ Photo globale — mise à jour instantanée sur tout l'app
  globalPhotoURL: string | null;
  setGlobalPhotoURL: (url: string | null) => void;
}

const AppContext = createContext<AppContextType>({
  lang: "fr",
  setLang: () => {},
  t: (k) => k,
  themeMode: "dark",
  setThemeMode: () => {},
  theme: THEMES.dark,
  isRTL: false,
  globalPhotoURL: null,
  setGlobalPhotoURL: () => {},
});

export const useApp = () => useContext(AppContext);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("fr");
  const [themeMode, setThemeModeState] = useState<ThemeMode>("dark");
  const [globalPhotoURL, setGlobalPhotoURL] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const saved = await AsyncStorage.getItem("hotel360_settings");
        if (saved) {
          const s = JSON.parse(saved);
          if (s.langue) setLangState(s.langue as Lang);
          if (s.modeNuit !== undefined)
            setThemeModeState(s.modeNuit ? "dark" : "light");
        }
      } catch (e) {}
    };
    load();
  }, []);

  const setLang = async (l: Lang) => {
    setLangState(l);
    try {
      const saved = await AsyncStorage.getItem("hotel360_settings");
      const s = saved ? JSON.parse(saved) : {};
      await AsyncStorage.setItem(
        "hotel360_settings",
        JSON.stringify({ ...s, langue: l }),
      );
    } catch (e) {}
  };

  const setThemeMode = async (m: ThemeMode) => {
    setThemeModeState(m);
    try {
      const saved = await AsyncStorage.getItem("hotel360_settings");
      const s = saved ? JSON.parse(saved) : {};
      await AsyncStorage.setItem(
        "hotel360_settings",
        JSON.stringify({ ...s, modeNuit: m === "dark" }),
      );
    } catch (e) {}
  };

  const t = (key: string): string => {
    const tr = TRANSLATIONS[lang] as Record<string, string>;
    return tr[key] ?? key;
  };

  return (
    <AppContext.Provider
      value={{
        lang,
        setLang,
        t,
        themeMode,
        setThemeMode,
        theme: THEMES[themeMode],
        isRTL: lang === "ar",
        globalPhotoURL,
        setGlobalPhotoURL,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

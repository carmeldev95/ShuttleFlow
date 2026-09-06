import { driver } from "driver.js";
import "driver.js/dist/driver.css";

const commonConfig = {
  showProgress: true,
  progressText: "{{current}} מתוך {{total}}",
  nextBtnText: "הבא",
  prevBtnText: "הקודם",
  doneBtnText: "סיום",
  allowClose: true,
  overlayOpacity: 0.6,
};

const employeeSteps = [
  {
    popover: {
      title: "ברוך הבא ל-ShuttleFlow 🚌",
      description:
        "מערכת ההרשמה להסעות. נעבור יחד על המסכים העיקריים כדי שתדע איך להשתמש בה. אפשר לצאת בכל שלב.",
    },
  },
  {
    element: '[data-tour="nav-dashboard"]',
    popover: {
      title: "דשבורד",
      description: "מסך הבית — כאן רואים סיכום מהיר של ההרשמות האחרונות שלך והודעות מההנהלה.",
    },
  },
  {
    element: '[data-tour="nav-register"]',
    popover: {
      title: "הרשמה להסעה",
      description:
        "כאן נרשמים להסעה: בוחרים תאריך, משמרת, איסוף/פיזור ומיקום. שים לב לחוקי הזמן — לכל משמרת יש מועד אחרון להרשמה.",
    },
  },
  {
    element: '[data-tour="nav-my"]',
    popover: {
      title: "ההרשמות שלי",
      description: "רשימת כל ההרשמות שלך. אפשר לערוך או לבטל הרשמה כל עוד לא עבר מועד הנעילה.",
    },
  },
  {
    element: '[data-tour="help-btn"]',
    popover: {
      title: "צריך עזרה שוב?",
      description: "תמיד אפשר ללחוץ כאן כדי להריץ את ההדרכה מחדש.",
    },
  },
  {
    element: '[data-tour="logout-btn"]',
    popover: {
      title: "יציאה",
      description: "לחיצה כאן מנתקת אותך מהמערכת בבטחה.",
    },
  },
];

const adminSteps = [
  {
    popover: {
      title: "ברוך הבא לממשק הניהול 🛠️",
      description:
        "כמנהל יש לך גישה מלאה לניהול ההרשמות, העובדים וההגדרות. נעבור יחד על הכלים העיקריים. אפשר לצאת בכל שלב.",
    },
  },
  {
    element: '[data-tour="nav-dashboard"]',
    popover: {
      title: "דשבורד",
      description: "מסך הבית — סיכום מהיר של הרישומים האחרונים שהוספת.",
    },
  },
  {
    element: '[data-tour="nav-register"]',
    popover: {
      title: "הרשמה להסעה",
      description: "כאן אפשר להוסיף הרשמה עבור עובד — בוחרים את העובד ואז ממלאים את פרטי ההסעה. כמנהל אינך כפוף לחוקי הזמן.",
    },
  },
  {
    element: '[data-tour="nav-admin"]',
    popover: {
      title: "ניהול רישומים",
      description:
        "הלב של הניהול: צפייה, עריכה וביטול של כל רישומי העובדים. מכאן גם מגדירים <b>ימי רישום</b> (נעילת/פתיחת היומן) ו<b>מיקומים ומשמרות</b>.",
    },
  },
  {
    element: '[data-tour="nav-employees"]',
    popover: {
      title: "ניהול עובדים",
      description: "צפייה ועריכה של פרטי העובדים במערכת.",
    },
  },
  {
    element: '[data-tour="nav-announcements"]',
    popover: {
      title: "הודעות לעובדים",
      description: "כאן מפרסמים הודעות שיוצגו לעובדים בכניסה לדשבורד.",
    },
  },
  {
    element: '[data-tour="nav-reports"]',
    popover: {
      title: "דוחות",
      description: "הפקת דוחות וסיכומים על ההרשמות במערכת.",
    },
  },
  {
    element: '[data-tour="help-btn"]',
    popover: {
      title: "צריך עזרה שוב?",
      description: "תמיד אפשר ללחוץ כאן כדי להריץ את ההדרכה מחדש.",
    },
  },
  {
    element: '[data-tour="logout-btn"]',
    popover: {
      title: "יציאה",
      description: "לחיצה כאן מנתקת אותך מהמערכת בבטחה.",
    },
  },
];

export function startTour(role) {
  const steps = role === "admin" ? adminSteps : employeeSteps;
  // Filter out steps whose target element is not currently in the DOM
  const visibleSteps = steps.filter(
    (s) => !s.element || document.querySelector(s.element)
  );

  const driverObj = driver({ ...commonConfig, steps: visibleSteps });
  driverObj.drive();
  return driverObj;
}

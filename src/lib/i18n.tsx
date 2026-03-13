import { createContext, useContext, useState, type ReactNode } from "react";

export type Lang = "bg" | "en";

const translations = {
  // Navbar
  "nav.howItWorks": { bg: "Как работи", en: "How It Works" },
  "nav.offers": { bg: "Оферти", en: "Offers" },
  "nav.forMerchants": { bg: "За търговци", en: "For Merchants" },
  "nav.login": { bg: "Влез / Регистрация", en: "Login / Sign Up" },
  "nav.logout": { bg: "Изход", en: "Logout" },
  "nav.dashboard": { bg: "Табло", en: "Dashboard" },
  "nav.map": { bg: "Карта", en: "Map" },

  // Hero
  "hero.badge": { bg: "Дигитален хипермаркет в Стара Загора", en: "Digital hypermarket in Stara Zagora" },
  "hero.title1": { bg: "Спаси вкусна храна.", en: "Save delicious food." },
  "hero.title2": { bg: "Спести до 70%.", en: "Save up to 70%." },
  "hero.desc": { bg: "Купувай качествени продукти от местни супермаркети и пекарни с наближаващ срок на годност.", en: "Buy quality products from local supermarkets and bakeries with approaching expiry dates." },
  "hero.browse": { bg: "Разгледай офертите", en: "Browse Offers" },
  "hero.partner": { bg: "Стани партньор", en: "Become a Partner" },

  // Why section
  "why.title": { bg: "Защо го правим?", en: "Why we do it?" },
  "why.business.title": { bg: "Загуби за бизнеса", en: "Business Losses" },
  "why.business.desc": { bg: "Локални търговци изхвърлят тонове годна храна поради липса на канал за бърза разпродажба.", en: "Local merchants throw away tons of edible food due to lack of a quick sales channel." },
  "why.eco.title": { bg: "Екологична криза", en: "Ecological Crisis" },
  "why.eco.desc": { bg: "Органичният отпадък в депото отделя метан – основен фактор за климатичните промени.", en: "Organic waste emits methane – a major factor in climate change." },
  "why.economy.title": { bg: "Икономически натиск", en: "Economic Pressure" },
  "why.economy.desc": { bg: "Потребителите търсят начини да оптимизират разходите си за храна без компромис в качеството.", en: "Consumers seek ways to optimize food expenses without compromising quality." },

  // Offers
  "offers.title": { bg: "Актуални спасявания", en: "Current Savings" },
  "offers.desc": { bg: "Резервирай surprise box или индивидуален продукт.", en: "Reserve a surprise box or individual product." },
  "offers.viewAll": { bg: "Виж всички", en: "View All" },
  "offers.viewAllOffers": { bg: "Виж всички оферти", en: "View All Offers" },

  // Merchants section
  "merchants.badge": { bg: "За Търговци", en: "For Merchants" },
  "merchants.title": { bg: "Продавайте излишъка, вместо да го изхвърляте.", en: "Sell the surplus instead of throwing it away." },
  "merchants.desc": { bg: "Управлението на продукти с наближаващ срок никога не е било толкова лесно.", en: "Managing products with approaching expiry has never been easier." },
  "merchants.scan.title": { bg: "Сканиране на баркод", en: "Barcode Scanning" },
  "merchants.scan.desc": { bg: "Сканирате баркода с телефона. Системата автоматично извлича информацията.", en: "Scan the barcode with your phone. The system automatically extracts the information." },
  "merchants.control.title": { bg: "Пълен контрол на цените", en: "Full Price Control" },
  "merchants.control.desc": { bg: "Вие решавате каква отстъпка да предложите.", en: "You decide what discount to offer." },
  "merchants.pickup.title": { bg: "Лесно предаване", en: "Easy Handover" },
  "merchants.pickup.desc": { bg: "Купувачът показва кода за взимане. Вие потвърждавате и предавате.", en: "The buyer shows the pickup code. You confirm and hand over." },
  "merchants.register": { bg: "Регистрирай своя магазин", en: "Register Your Shop" },

  // Footer
  "footer.desc": { bg: "Първият дигитален хипермаркет за спасена храна в Стара Загора.", en: "The first digital hypermarket for rescued food in Stara Zagora." },
  "footer.forUsers": { bg: "За Потребители", en: "For Users" },
  "footer.forBusiness": { bg: "За Бизнеса", en: "For Business" },
  "footer.contacts": { bg: "Контакти", en: "Contacts" },
  "footer.products": { bg: "Разгледай продукти", en: "Browse Products" },
  "footer.delivery": { bg: "Доставка и плащане", en: "Delivery & Payment" },
  "footer.faq": { bg: "ЧЗВ", en: "FAQ" },
  "footer.partner": { bg: "Стани партньор", en: "Become a Partner" },
  "footer.sellerLogin": { bg: "Вход за търговци", en: "Seller Login" },
  "footer.terms": { bg: "Условия за ползване", en: "Terms of Use" },
  "footer.privacy": { bg: "Поверителност", en: "Privacy" },
  "footer.rights": { bg: "Всички права запазени.", en: "All rights reserved." },

  // Auth
  "auth.login": { bg: "Вход", en: "Login" },
  "auth.register": { bg: "Регистрация", en: "Sign Up" },
  "auth.loginDesc": { bg: "Влезте в своя акаунт", en: "Sign in to your account" },
  "auth.registerDesc": { bg: "Създайте нов акаунт", en: "Create a new account" },
  "auth.name": { bg: "Име", en: "Name" },
  "auth.namePlaceholder": { bg: "Вашето име", en: "Your name" },
  "auth.email": { bg: "Имейл", en: "Email" },
  "auth.password": { bg: "Парола", en: "Password" },
  "auth.loading": { bg: "Зареждане...", en: "Loading..." },
  "auth.noAccount": { bg: "Нямате акаунт? Регистрирайте се", en: "Don't have an account? Sign up" },
  "auth.hasAccount": { bg: "Вече имате акаунт? Влезте", en: "Already have an account? Sign in" },
  "auth.googleLogin": { bg: "Продължи с Google", en: "Continue with Google" },
  "auth.orEmail": { bg: "или с имейл", en: "or with email" },
  "auth.backHome": { bg: "Обратно към началната страница", en: "Back to home page" },
  "auth.subtitle": { bg: "Спаси храна, спести пари", en: "Save food, save money" },
  "auth.successLogin": { bg: "Успешен вход!", en: "Logged in!" },
  "auth.welcomeBack": { bg: "Добре дошли обратно.", en: "Welcome back." },
  "auth.successRegister": { bg: "Регистрацията е успешна!", en: "Registration successful!" },
  "auth.checkEmail": { bg: "Проверете имейла си за потвърждение.", en: "Check your email for confirmation." },
  "auth.error": { bg: "Грешка", en: "Error" },

  // Role picker
  "role.title": { bg: "Какъв тип акаунт искате?", en: "What type of account do you want?" },
  "role.buyerTitle": { bg: "Купувач", en: "Buyer" },
  "role.buyerDesc": { bg: "Разглеждайте и купувайте surprise boxes и продукти с отстъпка.", en: "Browse and buy surprise boxes and discounted products." },
  "role.sellerTitle": { bg: "Търговец", en: "Seller" },
  "role.sellerDesc": { bg: "Публикувайте продукти и surprise boxes от вашия магазин.", en: "Publish products and surprise boxes from your shop." },
  "role.shopName": { bg: "Име на магазина", en: "Shop Name" },
  "role.shopAddress": { bg: "Адрес на магазина", en: "Shop Address" },
  "role.pickLocation": { bg: "Посочете местоположението на картата", en: "Pick location on map" },
  "role.clickMap": { bg: "Кликнете или плъзнете маркера до вашия магазин", en: "Click or drag the marker to your shop location" },
  "role.continue": { bg: "Продължи", en: "Continue" },

  // Seller dashboard
  "seller.title": { bg: "Панел на търговеца", en: "Seller Dashboard" },
  "seller.products": { bg: "Моите продукти", en: "My Products" },
  "seller.boxes": { bg: "Surprise Boxes", en: "Surprise Boxes" },
  "seller.orders": { bg: "Поръчки", en: "Orders" },
  "seller.addProduct": { bg: "Добави продукт", en: "Add Product" },
  "seller.scanBarcode": { bg: "Сканирай баркод", en: "Scan Barcode" },
  "seller.addBox": { bg: "Създай Surprise Box", en: "Create Surprise Box" },
  "seller.noProducts": { bg: "Нямате добавени продукти.", en: "No products added yet." },
  "seller.noBoxes": { bg: "Нямате създадени surprise boxes.", en: "No surprise boxes created yet." },
  "seller.noOrders": { bg: "Нямате поръчки.", en: "No orders yet." },
  "seller.markReady": { bg: "Готова за взимане", en: "Ready for Pickup" },
  "seller.markPickedUp": { bg: "Предадена", en: "Picked Up" },

  // Buyer
  "buyer.title": { bg: "Магазини наблизо", en: "Shops Nearby" },
  "buyer.surpriseBoxes": { bg: "Surprise Boxes", en: "Surprise Boxes" },
  "buyer.products": { bg: "Индивидуални продукти", en: "Individual Products" },
  "buyer.myOrders": { bg: "Моите поръчки", en: "My Orders" },
  "buyer.reserve": { bg: "Резервирай", en: "Reserve" },
  "buyer.pickupCode": { bg: "Код за взимане", en: "Pickup Code" },
  "buyer.left": { bg: "остават", en: "left" },
  "buyer.pickupWindow": { bg: "Вземи между", en: "Pick up between" },
  "buyer.mySelection": { bg: "Моят избор", en: "My Selection" },
  "buyer.emptySelection": { bg: "Не сте избрали нищо все още.", en: "No items selected yet." },
  "buyer.alreadyAdded": { bg: "Вече добавено", en: "Already added" },
  "buyer.alreadyAddedDesc": { bg: "Този артикул вече е в избора ви.", en: "This item is already in your selection." },
  "buyer.addedToCart": { bg: "добавено към избора", en: "added to selection" },
  "buyer.noBoxes": { bg: "Няма налични surprise boxes в момента.", en: "No surprise boxes available right now." },
  "buyer.noProducts": { bg: "Няма налични продукти в момента.", en: "No products available right now." },
  "buyer.noOrders": { bg: "Нямате поръчки.", en: "No orders yet." },

  // Checkout
  "checkout.title": { bg: "Плащане", en: "Checkout" },
  "checkout.payCard": { bg: "Плати с карта", en: "Pay with Card" },
  "checkout.payCash": { bg: "Плати в брой", en: "Pay with Cash" },
  "checkout.payBalance": { bg: "Плати от баланс", en: "Pay from Balance" },
  "checkout.total": { bg: "Обща сума", en: "Total" },
  "checkout.confirm": { bg: "Потвърди поръчката", en: "Confirm Order" },
  "checkout.success": { bg: "Поръчката е потвърдена!", en: "Order confirmed!" },
  "checkout.pickupInfo": { bg: "Покажете кода при вземане на поръчката.", en: "Show the code when picking up your order." },

  // Map
  "map.title": { bg: "Карта на магазините", en: "Store Map" },
  "map.desc": { bg: "Намерете партньорски магазини в Стара Загора", en: "Find partner stores in Stara Zagora" },

  // Cart
  "cart.title": { bg: "Количка", en: "Cart" },
  "cart.empty": { bg: "Количката е празна", en: "Cart is empty" },
  "cart.emptyDesc": { bg: "Добавете продукти от офертите", en: "Add products from offers" },
  "cart.total": { bg: "Общо:", en: "Total:" },
  "cart.checkout": { bg: "Към плащане", en: "Checkout" },
  "cart.loginRequired": { bg: "Моля, влезте в акаунта си", en: "Please log in" },
  "cart.loginRequiredDesc": { bg: "Трябва да сте логнати, за да добавяте продукти.", en: "You need to be logged in to add products." },
  "cart.added": { bg: "Добавено! 🛒", en: "Added! 🛒" },
  "cart.addedDesc": { bg: "е добавен в количката.", en: "has been added to cart." },
  "cart.removed": { bg: "Премахнато", en: "Removed" },
  "cart.removedDesc": { bg: "Продуктът е премахнат от количката.", en: "Product removed from cart." },

  // Account
  "account.delete": { bg: "Изтрий акаунта", en: "Delete Account" },
  "account.deleted": { bg: "Акаунтът е изтрит", en: "Account deleted" },
  "account.deletedDesc": { bg: "Вашият акаунт беше успешно изтрит.", en: "Your account has been successfully deleted." },
  "account.deleteConfirmTitle": { bg: "Сигурни ли сте?", en: "Are you sure?" },
  "account.deleteConfirmDesc": { bg: "Това действие е необратимо. Всички ваши данни, поръчки и продукти ще бъдат изтрити завинаги.", en: "This action cannot be undone. All your data, orders, and products will be permanently deleted." },

  // Buyer market view
  "buyer.allMarkets": { bg: "Магазини и маркети", en: "Markets & Shops" },
  "buyer.viewProducts": { bg: "Виж продукти", en: "View Products" },
  "buyer.allProducts": { bg: "Всички продукти", en: "All Products" },
  "buyer.fromShop": { bg: "от", en: "from" },

  // Forgot / Reset password
  "forgotPw.link": { bg: "Забравена парола?", en: "Forgot password?" },
  "forgotPw.enterEmail": { bg: "Въведете имейл адрес първо.", en: "Enter your email address first." },
  "forgotPw.sent": { bg: "Изпратено!", en: "Sent!" },
  "forgotPw.sentDesc": { bg: "Проверете имейла си за линк за нулиране на паролата.", en: "Check your email for a password reset link." },
  "resetPw.title": { bg: "Нова парола", en: "New Password" },
  "resetPw.enterNew": { bg: "Въведете новата си парола.", en: "Enter your new password." },
  "resetPw.waiting": { bg: "Изчакване на верификация...", en: "Waiting for verification..." },
  "resetPw.newPassword": { bg: "Нова парола", en: "New Password" },
  "resetPw.confirmPassword": { bg: "Потвърдете паролата", en: "Confirm Password" },
  "resetPw.submit": { bg: "Задай нова парола", en: "Set New Password" },
  "resetPw.minLength": { bg: "Паролата трябва да е поне 6 символа.", en: "Password must be at least 6 characters." },
  "resetPw.mismatch": { bg: "Паролите не съвпадат.", en: "Passwords do not match." },
  "resetPw.success": { bg: "Паролата е сменена!", en: "Password changed!" },
  "resetPw.successDesc": { bg: "Можете да влезете с новата си парола.", en: "You can now log in with your new password." },

  // Seller product codes
  "seller.productCodes": { bg: "Кодове на продукти", en: "Product Codes" },
  "seller.addCode": { bg: "Добави код", en: "Add Code" },
  "seller.noCodes": { bg: "Нямате запазени продуктови кодове.", en: "No product codes saved yet." },
  "seller.barcode": { bg: "Баркод", en: "Barcode" },
  "seller.codeAdded": { bg: "Кодът е добавен!", en: "Code added!" },
  "seller.codeFound": { bg: "Продуктът е разпознат!", en: "Product recognized!" },

  // Common
  "common.save": { bg: "Запази", en: "Save" },
  "common.cancel": { bg: "Отказ", en: "Cancel" },
  "common.delete": { bg: "Изтрий", en: "Delete" },
  "common.edit": { bg: "Редактирай", en: "Edit" },
  "common.close": { bg: "Затвори", en: "Close" },
  "common.lv": { bg: "€", en: "€" },
  "common.pieces": { bg: "бр.", en: "pcs" },
} as const;

export type TranslationKey = keyof typeof translations;

interface I18nContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be inside I18nProvider");
  return ctx;
};

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLang] = useState<Lang>(() => {
    const saved = localStorage.getItem("smartbite-lang");
    return (saved === "en" || saved === "bg") ? saved : "bg";
  });

  const changeLang = (l: Lang) => {
    setLang(l);
    localStorage.setItem("smartbite-lang", l);
  };

  const t = (key: TranslationKey): string => {
    return translations[key]?.[lang] ?? key;
  };

  return (
    <I18nContext.Provider value={{ lang, setLang: changeLang, t }}>
      {children}
    </I18nContext.Provider>
  );
};

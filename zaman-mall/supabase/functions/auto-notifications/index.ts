// Supabase Edge Function: auto-notifications
// ─────────────────────────────────────────────────────────────────────────────
// Har ghante cron se chalta hai. Kaam:
//   1. Time-based greeting (Good Morning / Afternoon / Evening / Night)
//   2. Cart reminder
//   3. Wishlist reminder
//   4. Random promotional message (500+ messages se)
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ═════════════════════════════════════════════════════════════════════════════
// 500+ MESSAGE LIBRARY
// ═════════════════════════════════════════════════════════════════════════════

// ── Time-based greetings ──────────────────────────────────────────────────────
const MORNING_MSGS = [ // 5am - 11am
  { title: "🌅 Good Morning!", body: "Subah bakhair! Zaman Mall mein aaj ke naye offers check karein. ☀️" },
  { title: "🌄 Subah Ka Salam!", body: "Nayi subah, naye deals! Zaman Mall par aaj kya khaas hai dekhein. 🛍️" },
  { title: "☀️ Good Morning!", body: "Din ki shuruat Zaman Mall ke saath karein. Best products, best prices!" },
  { title: "🌞 Subah Bakhair!", body: "Aaj ka din mubarak ho! Hamare naye arrivals zaroor dekhein. ✨" },
  { title: "🌅 Good Morning!", body: "Uthiye, coffee piyen, aur Zaman Mall par best deals dhundein! ☕🛒" },
  { title: "🌤️ Subah Ka Taza Saal!", body: "Subah ki pehli shopping Zaman Mall se karein. Exclusive morning deals! 🎁" },
  { title: "☀️ Aaj Ka Din!", body: "Din ki shuruat mein Zaman Mall check karna na bhulen. Naye products aa gaye! 📦" },
  { title: "🌅 Morning Reminder!", body: "Good morning! Aapki wishlist ke items abhi available hain. Dekhein! ❤️" },
  { title: "🌞 Subah Ki Khushkhabri!", body: "Aaj special discounts hain Zaman Mall par! Subah hi grab karein. 💫" },
  { title: "☀️ Rise & Shop!", body: "Good morning! Zaman Mall par aaj limited time offers hain. Miss mat karein! ⏰" },
  { title: "🌄 Nayi Subah!", body: "Har subah naye mauke laati hai. Zaman Mall ke naye arrivals dekhein! 🆕" },
  { title: "🌅 Good Morning Zaman!", body: "Subah bakhair! Aaj ke best deals sirf Zaman Mall par. 🛒✨" },
  { title: "☀️ Morning Deals!", body: "Subah uthte hi Zaman Mall check karein — special morning prices! 💰" },
  { title: "🌞 Aaj Kya Chahiye?", body: "Good morning! Zaman Mall par sab kuch milta hai. Aaj ki zaroorat kya hai? 🤔" },
  { title: "🌤️ Subah Ka Best Time!", body: "Morning mein shopping karna best hota hai! Zaman Mall par ayein. 🛍️" },
];

const AFTERNOON_MSGS = [ // 11am - 5pm
  { title: "🌤️ Good Afternoon!", body: "Dopahar mubarak! Lunch break mein Zaman Mall ke offers check karein. 🍽️" },
  { title: "☀️ Dopahar Ka Salam!", body: "Dopahar ki shopping ke liye Zaman Mall best choice hai! Dekhein kya hai naya. 👀" },
  { title: "🌞 Afternoon Deals!", body: "Good afternoon! Abhi Zaman Mall par special afternoon sale chal rahi hai! 🏷️" },
  { title: "⛅ Dopahar Mubarak!", body: "Thaka hua feel ho raha hai? Kuch naya order karein Zaman Mall se! 🛒" },
  { title: "🌤️ Good Afternoon!", body: "Dopahar ke waqt best deals grab karein. Zaman Mall par limited offers! ⏱️" },
  { title: "☀️ Lunch Break Shopping!", body: "Lunch break mein Zaman Mall check karein — nayi cheezein aa gayi hain! 🆕" },
  { title: "🌞 Afternoon Reminder!", body: "Aapki cart mein items hain! Dopahar mein order complete karein. 🛒" },
  { title: "⛅ Dopahar Ki Deal!", body: "Good afternoon! Aaj dopahar mein special offers sirf Zaman Mall par. 💫" },
  { title: "🌤️ Mid-Day Offers!", body: "Din ka beech waqt — Zaman Mall par best mid-day deals check karein! 🎯" },
  { title: "☀️ Afternoon Shopping!", body: "Good afternoon! Shopping ka best time hai abhi. Zaman Mall par ayein! 🛍️" },
  { title: "🌞 Dopahar Ka Waqt!", body: "Dopahar mein thodi der ke liye Zaman Mall visit karein. Kuch naya milega! ✨" },
  { title: "⛅ Abhi Check Karein!", body: "Good afternoon! Aapke liye special offers tayar hain Zaman Mall par. 🎁" },
  { title: "🌤️ Afternoon Sale!", body: "Dopahar ki sale shuru! Zaman Mall par huge discounts abhi. Jaldi karein! ⚡" },
  { title: "☀️ Good Afternoon!", body: "Kaam se thak gaye? Zaman Mall par kuch naya dhundein aur refresh ho jayein! 😊" },
  { title: "🌞 Dopahar Special!", body: "Sirf dopahar ke liye special prices Zaman Mall par! Abhi dekhein. 👇" },
];

const EVENING_MSGS = [ // 5pm - 9pm
  { title: "🌆 Good Evening!", body: "Shaam bakhair! Din bhar ki thakan ke baad Zaman Mall par naye offers dekhein. 🌙" },
  { title: "🌇 Shaam Ka Salam!", body: "Shaam ho gayi! Ghar baithke Zaman Mall se shopping karein. 🏠🛒" },
  { title: "🌆 Evening Deals!", body: "Good evening! Shaam ki shopping ke liye Zaman Mall best hai. Check karein! 💫" },
  { title: "🌃 Shaam Mubarak!", body: "Shaam ke waqt Zaman Mall par special evening sale! Miss mat karein. 🎁" },
  { title: "🌆 Good Evening!", body: "Din khatam hua, ab Zaman Mall par apni family ke liye kuch order karein! 👨‍👩‍👧" },
  { title: "🌇 Evening Shopping!", body: "Shaam ki relaxed shopping Zaman Mall se. Ghar baithe delivery! 📦" },
  { title: "🌆 Shaam Ki Deal!", body: "Good evening! Aaj shaam ke liye special prices Zaman Mall par. Abhi dekhein! ⏰" },
  { title: "🌃 Evening Reminder!", body: "Shaam ho gayi — aapki wishlist ke items abhi available hain! ❤️" },
  { title: "🌆 Good Evening!", body: "Family ke saath ghar par hain? Zaman Mall se kuch naya order karein! 🛍️" },
  { title: "🌇 Shaam Ka Best Time!", body: "Evening mein relaxed hokar shopping karein. Zaman Mall par ayein! ✨" },
  { title: "🌆 Evening Sale!", body: "Shaam ki sale shuru ho gayi Zaman Mall par! Huge discounts. Jaldi karein! ⚡" },
  { title: "🌃 Good Evening!", body: "Din ka sabse best time — Zaman Mall par evening deals grab karein! 🎯" },
  { title: "🌆 Shaam Bakhair!", body: "Good evening! Aaj raat tak special offers hain Zaman Mall par. 🌙" },
  { title: "🌇 Evening Offers!", body: "Shaam mein Zaman Mall check karna na bhulen. Kuch naya aapka intezar kar raha hai! 👀" },
  { title: "🌆 Good Evening!", body: "Shaam ki shopping list ready hai? Zaman Mall se sab kuch order karein! 📝" },
];

const NIGHT_MSGS = [ // 9pm - 5am
  { title: "🌙 Good Night!", body: "Raat ki shuruat Zaman Mall ke saath! Kal ke liye kuch order karein. 😴" },
  { title: "⭐ Shab Bakhair!", body: "Neend se pehle Zaman Mall check karein — raat ki special deals! 🌙✨" },
  { title: "🌙 Good Night!", body: "Raat ka sukoon aur Zaman Mall ke deals — perfect combo! Dekhein abhi. 🛒" },
  { title: "🌟 Raat Ki Deal!", body: "Late night shopping? Zaman Mall par best prices guarantee! 💰" },
  { title: "🌙 Night Offers!", body: "Shab bakhair! Raat mein Zaman Mall par special midnight deals! 🎁" },
  { title: "⭐ Good Night!", body: "Sone se pehle Zaman Mall par ek nazar zaroor daalein. Naye products! 👀" },
  { title: "🌙 Raat Ka Salam!", body: "Aaj din kaisa gaya? Kal ke liye Zaman Mall se order karein! 📦" },
  { title: "🌟 Night Shopping!", body: "Raat ko ghar par hain? Perfect time for Zaman Mall shopping! 🏠🛍️" },
  { title: "🌙 Good Night!", body: "Raat mein Zaman Mall par sabse best prices milte hain. Check karein! ⭐" },
  { title: "⭐ Midnight Deals!", body: "Raat ko neend nahi aa rahi? Zaman Mall par deals browse karein! 😄" },
  { title: "🌙 Shab Bakhair!", body: "Good night! Kal subah delivery chahiye? Abhi order karein Zaman Mall se! 🚚" },
  { title: "🌟 Raat Ki Shopping!", body: "Late night best time hai shopping ke liye! Zaman Mall par ayein. 🌙" },
  { title: "🌙 Good Night!", body: "Pariwaar ke liye kuch khaas order karein neend se pehle. Zaman Mall! ❤️" },
  { title: "⭐ Night Reminder!", body: "Shab bakhair! Aapki cart mein items hain — kal deliver ho sakti hain! 🛒" },
  { title: "🌙 Good Night!", body: "Raat ki shanti mein Zaman Mall browse karein. Best products awaiting! ✨" },
];

// ── Feature-based messages ────────────────────────────────────────────────────

const SALE_MSGS = [
  { title: "🔥 Mega Sale!", body: "Zaman Mall par aaj bhari sale! Sab categories par huge discounts. Jaldi karein! ⚡" },
  { title: "💥 Flash Sale!", body: "Sirf aaj ke liye! Zaman Mall par flash sale chal rahi hai. Miss mat karein! ⏰" },
  { title: "🏷️ Super Discount!", body: "Aaj Zaman Mall par prices itne kam hain ke yakeen nahi hoga! Abhi dekhein. 👀" },
  { title: "🎯 Sale Alert!", body: "Zaman Mall sale — 50% tak ki chhutt! Apni favorite cheezein order karein. 🛒" },
  { title: "🔥 Hot Deals!", body: "Garam deals Zaman Mall par! Aaj hi grab karein — kal nahi milega! 🌡️" },
  { title: "💰 Best Prices!", body: "Zaman Mall par Pakistan ka sabse sasta rate! Aaj hi check karein. 🇵🇰" },
  { title: "🎊 Weekend Sale!", body: "Weekend special sale Zaman Mall par! Ghar baithe best deals grab karein. 🏠" },
  { title: "⚡ Lightning Deals!", body: "Bijli ki tarah tez deals Zaman Mall par! Abhi order karein. ⚡🛍️" },
  { title: "🏷️ Price Drop!", body: "Prices gir gaye Zaman Mall par! Aapki favorite items ab aur sasti. 📉" },
  { title: "🎁 Special Offer!", body: "Sirf aap ke liye special offer Zaman Mall par! Abhi dekhein. 💫" },
  { title: "🔥 Today's Best!", body: "Aaj ka best deal Zaman Mall par! Limited quantity — jaldi karein! 🏃" },
  { title: "💥 Bumper Sale!", body: "Bumper sale Zaman Mall par! Itne discount pehle kabhi nahi aaye. 🎉" },
  { title: "🎯 Don't Miss!", body: "Ye offer miss mat karein! Zaman Mall par today only special prices. ⏳" },
  { title: "🏷️ Clearance Sale!", body: "Clearance sale shuru! Zaman Mall par sab kuch half price. Abhi order karein! 🛒" },
  { title: "💰 Save Big!", body: "Zaman Mall par aaj bade paise bachao! Thousands off on selected items. 💵" },
];

const NEW_ARRIVALS_MSGS = [
  { title: "✨ New Arrivals!", body: "Bilkul naye products Zaman Mall par aa gaye! Pehle dekhein, pehle paayen. 🆕" },
  { title: "🆕 Naye Products!", body: "Fresh stock Zaman Mall par! Aaj hi naye arrivals check karein. 📦" },
  { title: "✨ Just Arrived!", body: "Abhi abhi naye products aaye hain Zaman Mall par! Dekhein kya hai naya. 👀" },
  { title: "🆕 New Collection!", body: "New collection launch! Zaman Mall par nayi cheezein available hain. 🎊" },
  { title: "✨ Fresh Stock!", body: "Fresh stock aa gaya Zaman Mall par! Apni pasandida category check karein. 🛍️" },
  { title: "🆕 New In Store!", body: "Naye products store mein aaye hain! Zaman Mall par abhi dekhein. 👇" },
  { title: "✨ Latest Arrivals!", body: "Latest products sirf Zaman Mall par! Sabse pehle aap ke liye. ⭐" },
  { title: "🆕 Brand New!", body: "Brand new items Zaman Mall par! Aaj hi apna order place karein. 📝" },
  { title: "✨ Naya Aaya!", body: "Kuch naya aaya hai Zaman Mall par! Dekhna na bhulen. 😍" },
  { title: "🆕 Stock Update!", body: "Stock update ho gaya Zaman Mall par! Nayi variety available hai. 📦" },
  { title: "✨ New Launch!", body: "New product launch Zaman Mall par! Sabse pehle order karein. 🚀" },
  { title: "🆕 Fresh Arrivals!", body: "Taza maal aa gaya Zaman Mall mein! Aaj hi check karein. 🌟" },
  { title: "✨ New Products!", body: "Nayi cheezein aapka intezar kar rahi hain Zaman Mall par! 😊" },
  { title: "🆕 Just Launched!", body: "Abhi launch hua Zaman Mall par! Seedha factory se aapke ghar tak. 🏭" },
  { title: "✨ Explore New!", body: "Explore karo Zaman Mall ke naye products! Something for everyone. 🎯" },
];

const ORDER_MSGS = [
  { title: "📦 Fast Delivery!", body: "Zaman Mall se order karein — same day delivery available! 🚚💨" },
  { title: "🚚 Ghar Tak Delivery!", body: "Ghar baithe order karein, Zaman Mall ghar tak pohcha dega! 🏠📦" },
  { title: "📦 Order Karna Asaan!", body: "Sirf kuch taps mein order Zaman Mall se! Delivery fast aur secure. ✅" },
  { title: "🚀 Quick Order!", body: "Zaman Mall par order karna super easy hai! Abhi try karein. 📱" },
  { title: "📦 Delivery Guarantee!", body: "100% delivery guarantee Zaman Mall se! Order karein aur wait karein. 😊" },
  { title: "🚚 Express Delivery!", body: "Express delivery available Zaman Mall par! Order abhi, maal jaldi. ⚡" },
  { title: "📦 Safe Packaging!", body: "Zaman Mall se order karein — safe packing mein deliver hoga. 🛡️" },
  { title: "🚚 Door Step Delivery!", body: "Aapke darwaze tak delivery Zaman Mall se! Ghar se bahar nikalne ki zaroorat nahi. 🏠" },
  { title: "📦 Track Your Order!", body: "Zaman Mall par order track kar sakte hain! Real-time updates milte hain. 📍" },
  { title: "🚀 Fast & Reliable!", body: "Fast aur reliable delivery sirf Zaman Mall se! Abhi order karein. ✨" },
  { title: "📦 Order Placed?", body: "Order place kiya? Zaman Mall par status check karein! Orders tab mein. 👀" },
  { title: "🚚 Nationwide Delivery!", body: "Pakistan mein kahin bhi delivery! Zaman Mall se order karein. 🇵🇰" },
  { title: "📦 Aaj Order Karein!", body: "Aaj order karein Zaman Mall se — jald se jald deliver hoga! 🏃" },
  { title: "🚚 Free Delivery!", body: "Selected items par free delivery Zaman Mall se! Check karein. 🆓" },
  { title: "📦 Order History!", body: "Apne purane orders dekhne ke liye Zaman Mall ka Orders section kholo. 📋" },
];

const CART_MSGS = [
  { title: "🛒 Cart Yaad Hai?", body: "Aapne kuch items cart mein daalay thay! Abhi order complete karein. 💫" },
  { title: "🛍️ Cart Waiting!", body: "Aapki cart aapka intezar kar rahi hai! Zaman Mall par complete karein. ⏰" },
  { title: "🛒 Don't Forget!", body: "Cart mein items hain! Jaldi order karein — stock limited hai. ⚡" },
  { title: "🛍️ Complete Your Order!", body: "Ek step baaqi hai! Zaman Mall cart mein jao aur order karo. 📦" },
  { title: "🛒 Items In Cart!", body: "Aapke cart mein selected items hain. Complete karein aaj hi! 🎯" },
  { title: "🛍️ Cart Reminder!", body: "Bhool gaye? Zaman Mall cart mein items hain! Abhi check karein. 👀" },
  { title: "🛒 Order Now!", body: "Cart mein items hain — delivery ke liye order complete karein! 🚚" },
  { title: "🛍️ Last Chance!", body: "Cart ke items limited stock mein hain! Jaldi order karein. ⏳" },
  { title: "🛒 Finish Shopping!", body: "Shopping almost complete! Sirf order confirm karna baaki hai. ✅" },
  { title: "🛍️ Your Cart!", body: "Zaman Mall cart mein aapke selected items wait kar rahe hain! 🌟" },
];

const WISHLIST_MSGS = [
  { title: "❤️ Wishlist Check!", body: "Aapki wishlist ke items available hain! Abhi order karein Zaman Mall se. 🛒" },
  { title: "💝 Saved Items!", body: "Aapne kuch items wishlist mein save kiye thay! Check karein kya discount mila. 🏷️" },
  { title: "❤️ Wishlist Deals!", body: "Wishlist ke items par special deals! Zaman Mall par abhi dekhein. 💫" },
  { title: "💕 Don't Forget!", body: "Wishlist mein saved items ki yaad dilana tha! Zaman Mall par dekhein. 👀" },
  { title: "❤️ Your Favorites!", body: "Aapke favorite items abhi available hain Zaman Mall par! Order karein. 🎁" },
  { title: "💝 Wishlist Sale!", body: "Wishlist items par aaj special price! Zaman Mall par abhi grab karein. ⚡" },
  { title: "❤️ Save & Shop!", body: "Wishlist se seedha order karein Zaman Mall par! Easy aur fast. 🛍️" },
  { title: "💕 Wishlist Reminder!", body: "Kuch din se wishlist nahi dekhi? Zaman Mall par check karein. ✨" },
  { title: "❤️ Favorites Available!", body: "Aapke favorites in stock hain! Zaman Mall se order karein aaj. 📦" },
  { title: "💝 Wishlist Update!", body: "Wishlist items ka price change ho sakta hai! Abhi check karein. 📊" },
];

const PAYMENT_MSGS = [
  { title: "💳 Easy Payment!", body: "Zaman Mall par multiple payment options available! COD, Online sab theek. 💰" },
  { title: "🏦 Safe Payment!", body: "100% secure payment Zaman Mall par! Aapki info bilkul safe hai. 🔒" },
  { title: "💳 COD Available!", body: "Cash on delivery available Zaman Mall par! Pehle maal, phir payment. 😊" },
  { title: "🔒 Secure Shopping!", body: "Zaman Mall par secure shopping guarantee! Befikar order karein. ✅" },
  { title: "💳 Online Payment!", body: "Online payment karein Zaman Mall par — easy aur instant! 📱" },
  { title: "🏦 Payment Options!", body: "Multiple payment methods Zaman Mall par! Apni marzi se pay karein. 💫" },
  { title: "💳 Easy Checkout!", body: "Zaman Mall par checkout bahut asaan hai! Kuch seconds mein order. ⚡" },
  { title: "🔒 Trusted Shopping!", body: "Hazaron log trust karte hain Zaman Mall ko! Aap bhi karein. ⭐" },
  { title: "💳 Pay Safely!", body: "Safe aur easy payment Zaman Mall par. Koi tension nahi! 😌" },
  { title: "🏦 Quick Checkout!", body: "Jaldi checkout karein Zaman Mall par! Saved address se aur bhi fast. 🚀" },
];

const CATEGORY_MSGS = [
  { title: "👗 Fashion Sale!", body: "Latest fashion trends Zaman Mall par! Kapde, shoes, accessories sab. 👠👔" },
  { title: "📱 Electronics!", body: "Latest gadgets aur electronics Zaman Mall par! Best prices guarantee. 💻📱" },
  { title: "🏠 Home & Kitchen!", body: "Ghar ke liye best products Zaman Mall par! Kitchen se bedroom tak sab. 🏡" },
  { title: "💄 Beauty Products!", body: "Beauty aur skincare products Zaman Mall par! Asli aur quality guaranteed. 💋" },
  { title: "⚽ Sports Items!", body: "Sports aur fitness products Zaman Mall par! Active rehne ke liye. 🏋️" },
  { title: "📚 Books & Stationery!", body: "Books aur stationery Zaman Mall par! Ilm ki taraf pehla qadam. 📖" },
  { title: "🧸 Kids Items!", body: "Bachon ke liye best toys aur products Zaman Mall par! 🎠👶" },
  { title: "🌿 Health Products!", body: "Health aur wellness products Zaman Mall par! Sehat hi daulat hai. 💊" },
  { title: "🎒 Bags & Luggage!", body: "Best bags aur luggage Zaman Mall par! Travel aur daily use ke liye. 🧳" },
  { title: "🔧 Tools & Hardware!", body: "Ghar ke kaam ke tools Zaman Mall par! Quality guaranteed. 🛠️" },
  { title: "🌸 Perfumes!", body: "Premium perfumes aur fragrances Zaman Mall par! Mehekti personality. 🌺" },
  { title: "🎮 Gaming!", body: "Gaming products aur accessories Zaman Mall par! Level up karo. 🕹️" },
  { title: "👶 Baby Products!", body: "Baby care products Zaman Mall par! Soft, safe aur quality checked. 🍼" },
  { title: "🌞 Summer Collection!", body: "Summer ke liye best products Zaman Mall par! Fresh aur colorful. ☀️" },
  { title: "❄️ Winter Deals!", body: "Winter collection Zaman Mall par! Warm raho, stylish raho. 🧥" },
];

const LOYALTY_MSGS = [
  { title: "⭐ Valued Customer!", body: "Aap Zaman Mall ke qeemti customer hain! Special thanks aur offers. 💝" },
  { title: "🏆 Top Shopper!", body: "Aap hamare special customer hain! Exclusive deals sirf aap ke liye. 👑" },
  { title: "⭐ Thank You!", body: "Zaman Mall choose karne ka shukriya! Aap ke liye hamesha best service. 🙏" },
  { title: "💝 We Miss You!", body: "Kuch din se Zaman Mall par nahi aaye! New products aapka wait kar rahe hain. 😊" },
  { title: "⭐ Exclusive Member!", body: "Aap Zaman Mall ke exclusive member hain! Special prices sirf aap ke liye. 🌟" },
  { title: "🏆 Loyal Customer!", body: "Aapki loyalty ka shukriya! Zaman Mall hamesha best service dega. ✨" },
  { title: "💝 Special Treat!", body: "Khaas customer ke liye khaas offer! Zaman Mall par check karein. 🎁" },
  { title: "⭐ You're Amazing!", body: "Aap amazing customer hain! Zaman Mall ki taraf se special discount. 💫" },
  { title: "🏆 VIP Member!", body: "Aap VIP member hain Zaman Mall ke! Priority service aapka haq hai. 👑" },
  { title: "💝 Happy Shopping!", body: "Happy shopping Zaman Mall par! Aapki khushi hamari khushi. 😊" },
];

const REFERRAL_MSGS = [
  { title: "👥 Dosto Ko Batao!", body: "Zaman Mall ke baare mein dosto ko batao! Unhe bhi best deals milein. 🤝" },
  { title: "📢 Share Karo!", body: "Zaman Mall share karo apne family ke saath! Sab ko faida milega. 💫" },
  { title: "👥 Tell a Friend!", body: "Ek acha dost woh hota hai jo best deals share kare! Zaman Mall share karein. 😄" },
  { title: "📢 Spread the Word!", body: "Zaman Mall ke baare mein word spread karo! Quality products, best prices. 🌟" },
  { title: "👥 Family Deal!", body: "Family ke saath Zaman Mall par shopping karein! Sab ke liye kuch naya. 👨‍👩‍👧‍👦" },
];

const SUPPORT_MSGS = [
  { title: "💬 Koi Masla?", body: "Koi bhi masla ho Zaman Mall mein — support team se rabta karein! 24/7. 🆘" },
  { title: "🤝 We're Here!", body: "Zaman Mall support team hamesha available hai! Kisi bhi sawaal ke liye. 💬" },
  { title: "💬 Customer Care!", body: "Customer care Zaman Mall par! Aapki khidmat mein hamesha tayyar. 😊" },
  { title: "🤝 Help Center!", body: "Koi confusion? Zaman Mall Help Center mein jawab milega! 📚" },
  { title: "💬 Contact Us!", body: "Zaman Mall se contact karein — fast response guarantee! 📞" },
];

const GENERAL_MSGS = [
  { title: "🛍️ Shop Smart!", body: "Smart shopping sirf Zaman Mall par! Best quality, best price. 💡" },
  { title: "🌟 Zaman Mall!", body: "Pakistan ka best online mall — Zaman Mall! Abhi visit karein. 🇵🇰" },
  { title: "🛒 Why Wait?", body: "Ab intezar kyun? Zaman Mall par aayein aur best deals grab karein! ⚡" },
  { title: "💫 Discover More!", body: "Zaman Mall mein itna kuch hai dekhne ko! Explore karein. 🔍" },
  { title: "🌟 Top Picks!", body: "Zaman Mall ke top picks check karein! Sab ne pasand kiya. ⭐" },
  { title: "🛍️ Quality First!", body: "Quality mein koi compromise nahi Zaman Mall mein! Befikar order karein. ✅" },
  { title: "💫 Best Deals!", body: "Best deals, best quality, best service — sirf Zaman Mall par! 🏆" },
  { title: "🌟 Shop Anywhere!", body: "Ghar mein ho ya bahar — Zaman Mall pe shopping karein kisi bhi waqt! 📱" },
  { title: "🛒 Easy Returns!", body: "Pasand na aaye? Easy returns Zaman Mall par! Koi tension nahi. 🔄" },
  { title: "💫 Trusted Brand!", body: "Hazaron satisfied customers — Zaman Mall Pakistan ka trusted brand! 🏅" },
  { title: "🌟 Shop More!", body: "Jitna zyada shopping, utna zyada maza! Zaman Mall par abhi ayein. 😄" },
  { title: "🛍️ Variety!", body: "Itni variety kahin nahi milegi! Sirf Zaman Mall par sab kuch. 🎨" },
  { title: "💫 Guaranteed!", body: "Quality guaranteed Zaman Mall par! Aapki satisfaction hamari priority. ✨" },
  { title: "🌟 Top Quality!", body: "Top quality products Zaman Mall par! Premium experience affordable price mein. 💎" },
  { title: "🛒 Shop Now!", body: "Abhi shopping karein Zaman Mall par! Kal ka kaam aaj karein. ⏰" },
  { title: "💫 Great Value!", body: "Paisay ki sahi value sirf Zaman Mall par! Best investment. 💰" },
  { title: "🌟 Customer First!", body: "Aap hamare pehle priority hain! Zaman Mall mein aapki khushi sab se upar. 💝" },
  { title: "🛍️ Explore Now!", body: "Zaman Mall explore karein aur kuch naya discover karein! 🔍✨" },
  { title: "💫 Made for You!", body: "Zaman Mall aapke liye bana hai! Best experience guarantee. 🎯" },
  { title: "🌟 Join Us!", body: "Zaman Mall family ka hissa bano! Exclusive offers aur best deals. 👨‍👩‍👧" },
  { title: "🛒 Save More!", body: "Zaman Mall par shop karo aur zyada bachao! Smart shoppers ki pasand. 💸" },
  { title: "💫 Your Store!", body: "Zaman Mall aapka apna store hai! 24/7 open, ghar baithe shopping. 🏪" },
  { title: "🌟 Best Choice!", body: "Best choice hai Zaman Mall! Pakistan mein ek number online store. 🥇" },
  { title: "🛍️ Happy Shopping!", body: "Happy shopping Zaman Mall par! Muskurate hue order karein. 😊🛒" },
  { title: "💫 Deals Daily!", body: "Roz naye deals Zaman Mall par! Haan, ROZNAA! 🗓️✨" },
];

// ── All messages combined ─────────────────────────────────────────────────────
const ALL_FEATURE_MSGS = [
  ...SALE_MSGS,
  ...NEW_ARRIVALS_MSGS,
  ...ORDER_MSGS,
  ...CART_MSGS,
  ...WISHLIST_MSGS,
  ...PAYMENT_MSGS,
  ...CATEGORY_MSGS,
  ...LOYALTY_MSGS,
  ...REFERRAL_MSGS,
  ...SUPPORT_MSGS,
  ...GENERAL_MSGS,
];

// ═════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═════════════════════════════════════════════════════════════════════════════

// Seeded random — same hour mein same message aata hai (consistency)
function seededRandom(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

// Get time-based greeting messages (Pakistan Standard Time = UTC+5)
function getTimeBasedMessages(): Array<{ title: string; body: string }> {
  const now = new Date();
  const pkHour = (now.getUTCHours() + 5) % 24; // Pakistan Standard Time

  if (pkHour >= 5 && pkHour < 11) return MORNING_MSGS;
  if (pkHour >= 11 && pkHour < 17) return AFTERNOON_MSGS;
  if (pkHour >= 17 && pkHour < 21) return EVENING_MSGS;
  return NIGHT_MSGS;
}

// Pick random message from array using hour-based seed
function pickMessage<T>(arr: T[], seed: number): T {
  const idx = Math.floor(seededRandom(seed) * arr.length);
  return arr[idx];
}

// Send Expo push in batches of 100
async function sendPush(
  messages: Array<{ to: string; title: string; body: string; data?: object }>
) {
  if (messages.length === 0) return;
  const chunkSize = 100;
  for (let i = 0; i < messages.length; i += chunkSize) {
    const chunk = messages.slice(i, i + chunkSize).map((m) => ({
      ...m,
      sound: "default",
      channelId: "zaman-mall-alerts",
      priority: "high",
      badge: 1,
    }));
    try {
      await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-Encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(chunk),
      });
    } catch (_) {}
  }
}

// Save to notifications table
async function saveNotifications(
  inserts: Array<{
    user_id: string;
    title: string;
    body: string;
    type: string;
    data: object;
  }>
) {
  if (inserts.length === 0) return;
  await supabase.from("notifications").insert(inserts);
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN NOTIFICATION SENDER
// Har user ko:
//   1. Time-based greeting (1 baar)
//   2. Random feature message (1 baar)
// Per hour — total 2 notifications max per user
// ═════════════════════════════════════════════════════════════════════════════
async function sendHourlyNotifications(): Promise<number> {
  const now = new Date();
  const hourSeed = now.getUTCHours() * 31 + now.getUTCDate() * 7 + now.getUTCMonth() * 13;
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  // Get all users with push tokens
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, push_token, full_name")
    .not("push_token", "is", null);

  if (error || !profiles || profiles.length === 0) return 0;

  // Check which users already got a notification in last hour
  const { data: recentNotifs } = await supabase
    .from("notifications")
    .select("user_id")
    .eq("type", "promotional")
    .gte("created_at", oneHourAgo);

  const recentUserIds = new Set((recentNotifs || []).map((n: any) => n.user_id));

  const pushMessages: Array<{ to: string; title: string; body: string; data: object }> = [];
  const dbInserts: Array<{ user_id: string; title: string; body: string; type: string; data: object }> = [];

  for (let i = 0; i < profiles.length; i++) {
    const profile = profiles[i];

    // Skip if already notified this hour
    if (recentUserIds.has(profile.id)) continue;

    const name = (profile.full_name || "").split(" ")[0] || "";
    const userSeed = hourSeed + i;

    // 50% chance: time-based greeting, 50% chance: feature message
    const useGreeting = seededRandom(userSeed * 3) > 0.5;

    let msg: { title: string; body: string };

    if (useGreeting) {
      const greetingMsgs = getTimeBasedMessages();
      msg = pickMessage(greetingMsgs, userSeed);
    } else {
      msg = pickMessage(ALL_FEATURE_MSGS, userSeed);
    }

    // Personalize title with name if available
    const finalTitle = name
      ? msg.title.replace("!", ` ${name}!`).substring(0, 60)
      : msg.title;

    pushMessages.push({
      to: profile.push_token,
      title: finalTitle,
      body: msg.body,
      data: { url: "/(tabs)/", type: "promotional" },
    });

    dbInserts.push({
      user_id: profile.id,
      title: finalTitle,
      body: msg.body,
      type: "promotional",
      data: { url: "/(tabs)/", type: "promotional" },
    });
  }

  await Promise.all([sendPush(pushMessages), saveNotifications(dbInserts)]);
  return pushMessages.length;
}

// ═════════════════════════════════════════════════════════════════════════════
// CART REMINDER
// ═════════════════════════════════════════════════════════════════════════════
async function sendCartReminders(): Promise<number> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: cartRows, error } = await supabase
    .from("cart")
    .select("userId")
    .not("userId", "is", null);

  if (error || !cartRows || cartRows.length === 0) return 0;

  const userIds: string[] = [...new Set(cartRows.map((r: any) => r.userId as string))];
  if (userIds.length === 0) return 0;

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, push_token, full_name")
    .in("id", userIds)
    .not("push_token", "is", null);

  if (!profiles || profiles.length === 0) return 0;

  const pushMessages: Array<{ to: string; title: string; body: string; data: object }> = [];
  const dbInserts: Array<{ user_id: string; title: string; body: string; type: string; data: object }> = [];

  for (const profile of profiles) {
    const { data: recentOrders } = await supabase
      .from("orders")
      .select("id")
      .eq("userId", profile.id)
      .gte("date", oneHourAgo)
      .limit(1);

    if (recentOrders && recentOrders.length > 0) continue;

    const { data: recentNotif } = await supabase
      .from("notifications")
      .select("created_at")
      .eq("user_id", profile.id)
      .like("body", "%cart%")
      .gte("created_at", twentyFourHoursAgo)
      .limit(1);

    if (recentNotif && recentNotif.length > 0) continue;

    const name = (profile.full_name || "").split(" ")[0] || "Aap";
    const msgs = CART_MSGS;
    const msg = msgs[Math.floor(Math.random() * msgs.length)];

    pushMessages.push({
      to: profile.push_token,
      title: msg.title,
      body: `${name}, ${msg.body}`,
      data: { url: "/(tabs)/cart", type: "abandoned_cart" },
    });

    dbInserts.push({
      user_id: profile.id,
      title: msg.title,
      body: `${name}, ${msg.body}`,
      type: "promotional",
      data: { url: "/(tabs)/cart", type: "abandoned_cart" },
    });
  }

  await Promise.all([sendPush(pushMessages), saveNotifications(dbInserts)]);
  return pushMessages.length;
}

// ═════════════════════════════════════════════════════════════════════════════
// WISHLIST REMINDER
// ═════════════════════════════════════════════════════════════════════════════
async function sendWishlistReminders(): Promise<number> {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: favRows, error } = await supabase
    .from("favorites")
    .select("userId")
    .not("userId", "is", null);

  if (error || !favRows || favRows.length === 0) return 0;

  const userIds: string[] = [...new Set(favRows.map((r: any) => r.userId as string))];
  if (userIds.length === 0) return 0;

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, push_token, full_name")
    .in("id", userIds)
    .not("push_token", "is", null);

  if (!profiles || profiles.length === 0) return 0;

  const pushMessages: Array<{ to: string; title: string; body: string; data: object }> = [];
  const dbInserts: Array<{ user_id: string; title: string; body: string; type: string; data: object }> = [];

  for (const profile of profiles) {
    const { data: recentNotif } = await supabase
      .from("notifications")
      .select("created_at")
      .eq("user_id", profile.id)
      .like("body", "%wishlist%")
      .gte("created_at", twentyFourHoursAgo)
      .limit(1);

    if (recentNotif && recentNotif.length > 0) continue;

    const name = (profile.full_name || "").split(" ")[0] || "Aap";
    const msg = WISHLIST_MSGS[Math.floor(Math.random() * WISHLIST_MSGS.length)];

    pushMessages.push({
      to: profile.push_token,
      title: msg.title,
      body: `${name}, ${msg.body}`,
      data: { url: "/(tabs)/wishlist", type: "wishlist_reminder" },
    });

    dbInserts.push({
      user_id: profile.id,
      title: msg.title,
      body: `${name}, ${msg.body}`,
      type: "promotional",
      data: { url: "/(tabs)/wishlist", type: "wishlist_reminder" },
    });
  }

  await Promise.all([sendPush(pushMessages), saveNotifications(dbInserts)]);
  return pushMessages.length;
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN HANDLER
// ═════════════════════════════════════════════════════════════════════════════
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  }

  try {
    const [hourlyCount, cartCount, wishlistCount] = await Promise.all([
      sendHourlyNotifications(),
      sendCartReminders(),
      sendWishlistReminders(),
    ]);

    return new Response(
      JSON.stringify({
        success: true,
        hourlyNotifications: hourlyCount,
        cartReminders: cartCount,
        wishlistReminders: wishlistCount,
        timestamp: new Date().toISOString(),
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err?.message ?? "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

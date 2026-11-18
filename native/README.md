# Maalot เวอร์ชันแอปมือถือ (Capacitor)

โฟลเดอร์นี้ห่อเว็บแอป Maalot เป็นแอปมือถือจริง เพื่อให้ **นับก้าวเบื้องหลัง** (ปิดจอหรือสลับแอปได้) และ **อ่านก้าวจาก Health Connect (Android) / Apple Health (iPhone)** เว็บเวอร์ชันปกติยังทำงานเหมือนเดิม โค้ดฝั่งเว็บตรวจเองว่าเปิดในแอปหรือไม่ (`native.js`)

## เอา APK ไปลองบน Android (ไม่ต้องมี Android Studio)
1. เปิดหน้า Actions ของรีโพ แล้วเลือก **Build Android app** → **Run workflow**
2. รอ 5–10 นาที ดาวน์โหลดไฟล์ `maalot-debug-apk` ที่ท้ายหน้า (ได้ไฟล์ `app-debug.apk`)
3. ส่งไฟล์เข้ามือถือ เปิดติดตั้ง (ต้องอนุญาตติดตั้งแอปจากแหล่งอื่นหนึ่งครั้ง)
4. เปิดแอป เข้าหน้า "เดินวันนี้" กดเริ่มนับก้าว จะมีแจ้งเตือนค้างขณะนับ และเปิดสวิตช์ "ก้าวจากแอปสุขภาพ" เพื่ออ่านจาก Health Connect

> สร้างเฉพาะ debug APK สำหรับทดสอบ ใช้ลงร้าน Play Store ไม่ได้ (ต้องเซ็นไฟล์และใช้ AAB ดูด้านล่าง)

## สร้างเองในเครื่อง
```bash
cd native
npm install
npm run prepare-www          # คัดลอกเว็บแอปไป native/www
npx cap add android
node scripts/patch-android.js
npx cap sync android
cd android && ./gradlew assembleDebug
```
ต้องมี Node 20+, Java 21 และ Android SDK (หรือเปิดโฟลเดอร์ `android` ด้วย Android Studio)

## ก่อนใช้งานจริงต้องทำ
- **deploy เซิร์ฟเวอร์ (worker) ใหม่** เพราะเพิ่ม origin ของแอป (`https://localhost`, `capacitor://localhost`) ใน CORS ไม่เช่นนั้นล็อกอินและซิงก์ในแอปจะใช้ไม่ได้ (`npx wrangler deploy` ในโฟลเดอร์ `worker`)
- ทุกครั้งที่แก้เว็บแอป ต้องสร้าง APK ใหม่ (แอปมีสำเนาไฟล์เว็บอยู่ข้างใน)

## ข้อจำกัดที่ควรรู้
- **แจ้งเตือน/พุช:** ใน WebView ของแอปไม่มี Notification API ของเว็บ การเตือนกินอาหารและพักยืดเส้นจะเด้งได้เฉพาะตอนเปิดแอปอยู่ ถ้าต้องการเตือนตอนปิดแอปต้องเพิ่มปลั๊กอิน `@capacitor/local-notifications` (ยังไม่ได้ทำ)
- **ยังไม่ได้ทดสอบ build จริง** ผู้เขียนไม่มี Android SDK ในเครื่องทดสอบ ขั้นตอนใน GitHub Actions เขียนตามเอกสารของ Capacitor 7 หากล้มเหลวให้ส่งล็อกมาแก้
- **Health Connect:** Android 14 ขึ้นไปมีในเครื่อง รุ่นก่อนหน้าต้องติดตั้ง "Health Connect by Android" จาก Play Store นโยบายความเป็นส่วนตัวอยู่ที่ `privacypolicy.html` (แอปแสดงเมื่อกดดูในหน้าขออนุญาต)
- **ก้าวจากสุขภาพ** ใช้ค่าที่มากกว่าระหว่างก้าวจากแอปสุขภาพกับก้าวที่นับด้วย GPS จึงไม่นับซ้ำ

## ขึ้น Google Play (ทำภายหลัง)
1. สร้างบัญชี Google Play Console (ค่าสมัครครั้งเดียวประมาณ 25 ดอลลาร์)
2. สร้าง keystore เซ็นแอป แล้วเพิ่มขั้นตอนสร้าง AAB (`./gradlew bundleRelease`) พร้อมเซ็นใน workflow (เก็บรหัสเป็น GitHub Secrets)
3. กรอกแบบฟอร์ม Health Connect และการใช้ตำแหน่งเบื้องหลังใน Play Console ซึ่งต้องผ่านการตรวจ และเตรียม URL นโยบายความเป็นส่วนตัวที่เปิดได้จริง
4. เปลี่ยน `appId` ใน `capacitor.config.json` ถ้าต้องการชื่อแพ็กเกจของตัวเอง (ตั้งแล้วเปลี่ยนไม่ได้หลังอัปโหลดครั้งแรก)

## iPhone (ต้องใช้ Mac)
ต้องมี Mac + Xcode และบัญชี Apple Developer (99 ดอลลาร์ต่อปี)
```bash
cd native && npm install && npm run prepare-www
npx cap add ios && npx cap sync ios && npx cap open ios
```
ใน Xcode: เปิด capability **HealthKit** และ **Background Modes → Location updates** และเพิ่มคำอธิบายใน Info.plist: `NSLocationWhenInUseUsageDescription`, `NSLocationAlwaysAndWhenInUseUsageDescription`, `NSHealthShareUsageDescription`

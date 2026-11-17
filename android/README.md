# แอป Android (.apk) ของ Maalot

เป็นแอปแบบ Trusted Web Activity: เปิดหน้าเว็บ https://maalot-2jx.pages.dev/ เต็มจอ ใช้ Chrome เบื้องหลัง
ข้อมูลและฟีเจอร์เหมือนเว็บ อัปเดตตามเว็บโดยไม่ต้องสร้าง .apk ใหม่ (สร้างใหม่เฉพาะเมื่อเปลี่ยนไอคอน ชื่อ หรือโดเมน)

## สร้างไฟล์ใหม่
ต้องมี JDK 17+, Gradle 8.7+, Android SDK (platforms;android-34, build-tools;34.0.0) และกุญแจเซ็นเดิม

    echo "sdk.dir=/path/to/android-sdk" > local.properties
    MAALOT_KEYSTORE=/path/to/maalot.keystore MAALOT_STOREPASS=รหัสผ่าน gradle assembleRelease
    cp app/build/outputs/apk/release/app-release.apk ../maalot.apk

กุญแจเซ็น (alias `maalot`) ห้ามหายและห้ามเอาขึ้น git ถ้าเปลี่ยนกุญแจ ต้องแก้ SHA-256 ใน `/.well-known/assetlinks.json`
และผู้ใช้ต้องถอนการติดตั้งแอปเดิมก่อนติดตั้งไฟล์ใหม่

# مصدر السيرفرات (S1, S2) وبيانات الـ Dashboard

## 1. من وين جاية السيرفرات (S1 و S2)؟

السيرفرات **تعريفها** يكون في الـ **Controller** (التطبيق اللي يشتغل على البورت 5000).

### في الـ Controller (`apps/controller/src/index.ts`)

- **عناوين السيرفرات (URLs)** تأتي من متغير البيئة:
  - `SERVER_URLS` — لو موجود يقسمه على الفاصلة وياخذ قائمة عناوين.
  - لو **ما موجود**: يستخدم القيمة الافتراضية  
    `http://localhost:5001,http://localhost:5002`

- **أسماء السيرفرات (S1, S2)** تأتي من:
  - `SERVER_IDS` — لو موجود يقسمه على الفاصلة (مثلاً `S1,S2`).
  - لو **ما موجود**: يستخدم `S1, S2` بالترتيب.

يعني:
- السيرفر الأول في القائمة = عنوان من `SERVER_URLS` + اسم من `SERVER_IDS` (أو S1 افتراضي).
- السيرفر الثاني = نفس الفكرة (غالباً S2).

بعدين الـ Controller يستدعي `initServers(...)` ويخزن هالقائمة في الـ **state** (في الذاكرة). كل فترة (كل 2 ثانية) يسوي **health check** على كل عنوان (`/health`) ويحدّث حالة السيرفر UP أو DOWN.

### في الواجهة (Frontend)

عنوان الـ Controller والـ Nodes يحددون من:

- **Controller (مصدر بيانات الـ Dashboard):**
  - `VITE_CONTROLLER_URL` — لو موجود الواجهة تستخدمه.
  - لو ما موجود: `http://localhost:5000`

- **عناوين السيرفرات للاتصال المباشر (مثلاً من الـ Desktop):**
  - `VITE_NODE_S1_URL` — افتراضي `http://localhost:5001`
  - `VITE_NODE_S2_URL` — افتراضي `http://localhost:5002`

**ملخص:** السيرفرات "جاية" من إعدادات الـ Controller (متغيرات البيئة أو القيم الافتراضية)، والواجهة تتصل بالـ Controller عشان تحصل على **قائمة السيرفرات وحالتهم**، وتتصل مباشرة بـ S1/S2 عشان الملفات والـ FS حسب الـ URLs أعلاه.

---

## 2. من وين بيانات الـ Dashboard؟

كل الأرقام والحالات اللي تظهر على الـ Dashboard **تجي من الـ Controller** عبر الـ API.

### الـ Dashboard يعمل استدعاءات كل 3 ثواني:

| الاستدعاء | المسار | المعنى |
|-----------|--------|--------|
| `api.getState()` | `GET /api/state` | حالة النظام الكاملة |
| `api.getMetrics()` | `GET /api/metrics/history` | تاريخ الـ latency والـ throughput |
| `api.getEvents()` | `GET /api/events` | سجل الأحداث (فيلوفير، باك أب، إلخ) |

عنوان الـ API هو نفسه عنوان الـ Controller (مثلاً `http://localhost:5000` أو قيمة `VITE_CONTROLLER_URL`).

### من وين الـ Controller يملأ هالبيانات؟

كلها من **الذاكرة (state)** داخل تطبيق الـ Controller، في الملف `apps/controller/src/stateStore.ts`:

1. **قائمة السيرفرات (S1, S2) وحالتهم (UP/DOWN):**
   - من `initServers` (اللي يملأها من `SERVER_URLS` و `SERVER_IDS` كما فوق).
   - يتم تحديث الحالة كل 2 ثانية عبر **health check**: الطلب يروح على كل `url/health`؛ لو يرد OK = UP، لو خطأ أو لا يرد = DOWN.
   - لو تضغط "Kill Server" من الـ Dashboard، الـ Controller يضع السيرفر **forced DOWN** بدون ما يعتمد على الـ health (يستخدم `setServerForcedDown`).

2. **CPU و RAM و Latency لكل سيرفر:**
   - **ما تجي من السيرفرات الحقيقية.** الـ Controller يحدّثها داخلياً كل 2 ثانية بقيم **محاكاة (simulated)** في `stateStore`:
     - لو "Simulate High Load" مفعّل: قيم عالية (CPU ~70–95, RAM ~75–95, latency أعلى).
     - لو غير مفعّل: قيم عشوائية عادية.
   - يعني الأرقام على الـ Dashboard **للعرض والتجربة فقط** وليست قراءات حقيقية من السيرفرات.

3. **الـ Mode (baseline / optimized):**
   - مخزن في الـ Controller ويتم تغييره من واجهة الإعدادات أو الـ API.

4. **Traffic share (نسبة التوزيع على السيرفرات):**
   - يجي من نافذة زمنية (آخر دقيقة) من الطلبات اللي الـ Controller سجّلها عند توجيه الطلبات إلى السيرفرات (`recordTraffic`). يعني يعكس **طلبات مرت من الـ Controller** فقط.

5. **الـ Latency و Throughput في الـ Charts:**
   - يتم إضافة نقاط كل 2 ثانية داخل الـ Controller (قيم محاكاة مرتبطة بـ traffic و high-load).
   - الـ Dashboard يطلب `getMetrics()` ويحصل على `latency` و `throughput` history من الذاكرة.

6. **الـ Backup (الحالة والأحداث):**
   - حالة الـ backup (idle / running / done) والأحداث (BACKUP_STARTED, ENCRYPTED, …) كلها تُنشأ وتُخزّن في الـ Controller عند استدعاء "Trigger Backup" أو عند حدوث فيلوفير. **ما فيه اتصال بخدمة باك أب خارجية** في الكود الحالي؛ كل شيء محاكى في الذاكرة.

7. **الأحداث (Events):**
   - أي حدث (فيلوفير، استعادة سيرفر، بداية باك أب، إلخ) يُسجّل في مصفوفة أحداث داخل الـ Controller عبر `addEvent`. الـ Dashboard يقرأها من `getEvents(since)`.

**ملخص:**  
كل بيانات الـ Dashboard **مصدرها الـ Controller (البورت 5000)**، والـ Controller يبنيها من:
- قائمة السيرفرات (من متغيرات البيئة)،
- فحص الـ health الحقيقي لكل سيرفر (UP/DOWN)،
- وباقي الأرقام والـ charts والأحداث **محاكاة أو محسوبة داخل الـ Controller** وليست سحب مباشر من قواعد بيانات أو خدمات خارجية أخرى.

---

## 3. ملخص سريع

| المطلوب | المصدر |
|---------|--------|
| **تعريف السيرفرات (S1, S2)** | متغيرات البيئة في الـ Controller: `SERVER_URLS`, `SERVER_IDS` (أو القيم الافتراضية localhost:5001, 5002 و S1, S2) |
| **حالة السيرفر UP/DOWN** | الـ Controller يفحص كل سيرفر عبر `GET <url>/health` كل 2 ثانية + تأثير أزرار Kill/Restore |
| **بيانات الـ Dashboard (أرقام، رسوم، أحداث)** | كلها من الـ Controller عبر `/api/state`, `/api/metrics/history`, `/api/events` — والبيانات نفسها من الذاكرة (stateStore) مع محاكاة لـ CPU/RAM/latency/throughput |

إذا حاب نربط الـ Dashboard ببيانات حقيقية من السيرفرات (مثلاً CPU فعلي)، نحتاج نضيف endpoints في الـ server nodes ونعدّل الـ Controller يقرأ منهم ويجمّع في الـ state.

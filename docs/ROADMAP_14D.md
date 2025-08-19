# แผนงาน 14 วันสำหรับโ1. **ฝึกและนำเข้าโมเดลท่ามือจริง** – | **4** | ✅ **เสร็จแ### เกณษ์ความสำเร็จที่เหลือ

- ⚠️ **Hand Gesture Models**: สร้างโมเดลจาก Teachable Machine สำหรับท่าทาง *hello*, *thank_you*, *goodbye*, *yes*, *no* และ export เป็น TensorFlow Lite
- ⚠️ **Frontend Integration**: เชื่อมต่อ face-api.js และ API calls แบบ real-time
- ⚠️ **OpenAI API Key**: ตั้งค่า environment variable เพื่อใช้ OpenAI จริง
- ⚠️ **End-to-End Testing**: ทดสอบ workflow จาก camera → detection → LLM generation
- ⚠️ **Production Deployment**: Build และ deploy ระบบสำหรับ production

**สถานะปัจจุบัน**: Backend infrastructure พร้อม 100%, Face models พร้อม 100%, LLM integration พร้อม 100% (รอ API key), Hand models 0%, Frontend integration 30%Models พร้อมใน `frontend/public/models/` (ขนาด 15MB+), รอการเชื่อมต่อ Frontend React code | Frontend |
| **5** | ✅ **เสร็จแล้ว** – OpenAI integration ใน `/api/compose` พร้อมแล้ว, รอตั้งค่า `OPENAI_API_KEY` environment variable | Backend |
| **6** | ⚠️ **กำลังดำเนินการ** – Backend APIs พร้อม, ต้องอัปเดต Frontend React components ให้เรียก APIs จริง | Frontend |
| **7** | ⚠️ **รอดำเนินการ** – เมื่อ hand models และ frontend integration เสร็จ จึงจะทดสอบ end-to-end ได้ | QA & ทุกทีม |รองรับ TensorFlow Lite model แล้ว แต่ยังไม่มีไฟล์ `model.tflite` และ `metadata.json` ใน `backend/models/hand/` ต้องใช้ **Teachable Machine** สร้างโมเดลสำหรับท่าทาง เช่น *hello*, *thank_you*, *goodbye*, *yes*, *no*

2. **เชื่อมต่อ Face-api.js กับ Frontend** – Models พร้อมแล้วใน `frontend/public/models/` แต่ยังไม่ได้เชื่อมต่อกับ Frontend React code ปัจจุบันใช้ mock response

3. **ตั้งค่า OpenAI API Key** – ระบบ LLM พร้อมแล้วแต่ต้องตั้งค่า `OPENAI_API_KEY` environment variable เพื่อใช้ OpenAI จริง (ปัจจุบันใช้ template fallback)

4. **Frontend Integration** – อัพเดต React components ให้เรียก APIs จริงและแสดงผลแบบ real-time

5. **End-to-End Testing** – ทดสอบการทำงานจาก camera → hand detection → face emotion → LLM sentence generation

6. **Production Deployment** – Build frontend และ deploy ระบบไปยัง production serverรงการ HandMat (อัพเดท สิงหาคม 2025)

เอกสารนี้สรุป **สิ่งที่ต้องทำและสิ่งที่ยังขาด** พร้อม **แผนการทำงานภายใน 14 วัน** เพื่อให้ทีมสามารถพัฒนาโครงการ HandMat ให้พร้อมใช้งานจริงได้อย่างเป็นระบบและทันเวลา

## 📊 สถานะปัจจุบัน (19 สิงหาคม 2025)

### ✅ **ส่วนที่เสร็จสมบูรณ์แล้ว**

1. **Backend Infrastructure** - Flask API พร้อม 13 endpoints ทำงานได้สมบูรณ์
2. **OpenAI LLM Integration** - ระบบ LLM composition ใช้ OpenAI GPT-3.5 แทน mock templates
3. **Face Detection Models** - face-api.js models ดาวน์โหลดครบ 5 ไฟล์ใน `frontend/public/models/`
4. **Dependencies** - TensorFlow 2.20.0, OpenAI client, และ packages จำเป็นติดตั้งแล้ว
5. **API Testing Tools** - มี API Tester (HTML) และ Python test scripts พร้อมใช้งาน
6. **Error Handling** - ระบบ fallback และ error handling ครบถ้วน
7. **Documentation** - มีเอกสารคู่มือและ integration guides ครบถ้วน

### ⚠️ **ส่วนที่ยังต้องทำ**งาน 14 วันสำหรับโครงการ HandMat

เอกสารนี้สรุป **สิ่งที่ต้องทำและสิ่งที่ยังขาด** พร้อม **แผนการทำงานภายใน 14 วัน** เพื่อให้ทีมสามารถอมาพัฒนาโครงการ HandMat ให้พร้องใช้งานจริงได้อย่างเป็นระบบและทันเวลา

## สิ่งที่ต้องทำและสิ่งที่ยังขาด

1. **ฝึกและนำเข้าโมเดลท่ามือจริง** – ปัจจุบันโค๊ดรองรับ fallback แต่ยังไม่มีโมเดลจริง ดังนั้นต้องถ่ายและรวบรวบรูปท่ามือที่ต้องการ ( เช่น *hello*, *thank_you*, *yes*, *no* ฌ์ล้ำ) แล้วใช้ **Teachable Machine** ฝึกโมเดลภาพ จากนั้น export เป็น **TensorFlow Lite** (`model.tflite` และ `metadata.json`) และวางไว้ใน `backend/models/hand/` พร้อมอัปเดตรายชื่อคลาสใน `RealHandModel` ให้ตรงกับโมเดลที่ฝึกไว้【68539690146976†L35-L41】【480537953922372†L27-L59】.

2. **เตรียมโมเดลสำหรับการวิเคราะใบหน้า** – ดาวน์โลดไฟ์ weight ของ **face -api.js** (`tiny_face_detector_*` และ `face_expression_*`) แล้ววางไว้ใน `frontend/public/models/` หรือตั้งค่าให้โหลดจาก CDN เพื่อให้อุปกรณ์ฝั่งผู้ใช้สามารถสามารถได้ หากต้องการใช้โมเดล TensorFlow Lite ฝั่งเซิร์เวอร์ ต้องเตรียม `model.tflite` กับ `labels.pkl` ใน `backend/models/face/` และแก้ไข `RealFaceModel` ให้โหลดได้ถูกต้อง【577597998107028†L53-L85】【65641200883693†L42-L80】.

3. **เชื่อมต่อ LLM จริง** – ปัจจุบัน endpoint `/api/compose` ใช้ LLM แบบ mock จึงต้องเลือกบริการเลีอ LLM ที่เหมะสม ( เช่น OpenAI, Google Gemini หรือโมเดลภายในองคร), ตั้งค่า API key และปรับโค๊ดใน backend ให้เรียก LLM ดังกล่าวอ้างเอกสารประกอบ【577597998107028†L88-L109】.

4. **อัปเดตและทดสอบ Frontend** – แก้โคด React ให้เรียก API จริง (`/api/recognize`, `/api/face/analyze`, `/api/compose`) และแสดงผลลัพธ์แบบเรียลไทม์ ตรวจสองการขอสิทธิ์กล้อง, การแสดงผล top‑N gesture และ fallback หากโมเดลไม่พร้อม【987034680662314†L86-L115】.

5. **ทดสอบระบบและจัดการข้อผิดพลาด** – ใช้สคริปทดสอบในโฟลเดอร `tests/` เพื่อตรวจการทำงานของแต่ละ endpoint ตรวจสอง fallback เมื่อไม่มีโมเดลหรือเมื่อ input ผิดประเภท รวมทั้งวัด latency ให้แน่ใจว่าประสิทธิภพอดูเค้นในเกณษ【987034680662314†L60-L82】.

6. **เตรียมการ deploy** – เมื่อโมเดลและ API พร้อมแล้ว ต้อง build Frontend (`npm run build`) และ deploy Backend/Frontend ไปยังเซิร์เวอร์ที่เลือก พร้อมตั้งค่าตัวแปรสภาพแวดล้อม (`.env.local` หรือ `.env.production`) ให้ถูกต้องและจัดการความปลอดภัยของ API key【501428318685052†L83-L93】.

7. **จัดทำเอกสารประกอบ** – สร้างเอกสารจำเป็น เช่น Model Card (บอกรายละเอียดชุดข้อมูลและค่า threshold), API Contract (รูปแบบ request/response), User Guide (วิธีใช้งานระบบ), Deploy Runbook (ขั้นตอน deploy), และ Test Checklist (รายการทดสอบที่ต้องผ่าน) เพื่อให้ทุกคนทำงานได้สอดคล้องกัน.

8. **แผนพัฒนาระยะยาว** – วางแผนฟังชันเพิ่มเติมสำหรับบอนาคต เช่น การรู้จำชุดท่ามือเป็นลำดับ (gesture sequence), การวิเคราะสเส้นทางอารมณ์ (emotion trajectory), การปรับโมเดลให้เหมาะกับผู้ใช้แต่ละคน และการมอนิเตอร์ประสิทธิภของระบบอต่อป【73175495273850†L246-L263】.

## แผนการทำงานภายใน 14 วัน

เพื่อให้ทีมสามารถส่งมอบระบบต้นแบบที่พร้อมใช้งาน (MVP) ได้ภายในเวลาสองสัปดาห์ แนะนำให้แบงงานออกเป็นสองสปรินต์สัปดาห์ละ 7 วัน โดยกำหนดภารกิจแต่ละวัน ดังนี้:

### สัปดาห์ที 1 (วัน 1–7)

| วัน | ภารกิจหลัก | ผู้รับผิดชอบ (ตัวอย่าง) |
|---|---|---|
| **1** | รวบรวบและจัดเตรียมชุดข้อมูลท่ามือ 5‑7 ท่าที่ต้องการ ใช้กล้องมือถือถี้โทร้ภาพภาพประบอบ | Data lead |
| **2** | สร้างโปรเจกต์ใน Teachable Machine, อัปโหลดข้อมูลท่ามือ และเริ่มฝึกโมเดลเบื้้งต้น | Data lead |
| **3** | Export โมเดลจาก Teachable Machine เป็น `model.tflite` และ `metadata.json`; วางไฟล์ใน `backend/models/hand/`; อัปเดตรายชื่อคลาสใน `RealHandModel`; ทดสอบการโหลดโมเดล | Data lead, Backend |
| **4** | ดาวน์โลด weight ของ face‑api.js และวางใน `frontend/public/models/`; ทดสอบการตรวจจับใบหน้าฝั่ง Frontend และ fallback เมื่อไม่มีใบหน้า | Frontend |
| **5** | เลือกและตั้งค่า LLM ที่จะใช้ (เช่น OpenAI); สร้าง API key; ปรับโคดใน `/api/compose` ให้เรียก LLM จริง; ขี้นเทมเพลต prompt ภาษาไทยเพื่อสร้างประโยคที่เหมะสม | Backend |
| **6** | อัปเดต Frontend ให้เรียก API จริง (`/api/recognize`, `/api/face/analyze`, `/api/compose`); จัดการ UI ให้แสดงผลท่ามือและอารมณ์พร้อมกันและมีปุ่ม capture/retry | Frontend |
| **7** | ทดสอบ flow เต็มระบบครั้งแรก ( กล้อง → ท่ามือ → อารมณ์ → LLM ); ปรับ threshold ของโมเดลท่ามือเพื่อควบคุมค่า Unknown; รวบรวบ feedback และบันทึกปัญหาที่พบ | QA & ทุกทีม |

### สัปดาห์ที 2 (วัน 8‑14)

| วัน | ภารกิจหลัก | ผู้รับผิดชอบ (ตัวอย่าง) |
|---|---|---|
| **8** | เพิ่มข้อมือท่ามือ (augmentation) และฝึกโมเดลรอบสองเพื่อเพิ่มความแม่นยำ; ปรับค่า threshold ใหม่และวัดผลอีกครั้ง | Data lead |
| **9** | ทดสอบประสิทธิภการวิเคราะใบหน้า; หากจำเป็นใหมีให้เตรียมทางเลือกใช้โมเดล TensorFlow Lite ฝั่งเซิร์เวอร์; วัด latency และปรับประปรุง | Backend, Frontend |
| **10** | ปรับปรุง UI/UX: เพิ่มแสดงผล gesture top‑3 พร้อมความ แม่นยำ, ปุ่มแก้ไข label, สลับโปรม dark/light, และปรับความเร็วความแสดงผล | Frontend |
| **11** | เขียนและรันชุดทดสอบ end‑to‑end; ตรวจสองเคสผิดพลาด; แก้บั๊กและปรับปรุง code ตาม feedback | QA, Backend, Frontend |
| **12** | Build และ deploy ระบบในสภาพแวดล้อม staging (`npm run build`), ตั้งค่า `.env.production`, ทดสอบ health check และ fallback บนเซิร์เวอร์จริง | Ops |
| **13** | จัดทำเอกสารประกอบ: Model Card, API Contract, User Guide, Deploy Runbook และ Test Checklist; ตรวจสองว่าข้อมูลครบถู่และเข้าใจง่าย | ทุกทีม |
| **14** | ประชุมสรุปผลงาน, ทำ code review ครั้งสุดท้าย, แก้ไขตามข้อเสนอะนะ, แล้ว merge/commit changes ไปยัง repository; วางแผนงานระยะยาวต่อไป | ทุกทีม |

### เกณษ์ความสำเร็จ

- **ความแม่นยำของโมเดลท่ามือ**: ความแม่นยำ (Top‑1) บนชุดทดสอบ ≥ 85% และสามารถาคืนค่า Unknown ได้ถูกต้องเมื่อมั่นใจต่ำ
- **เวลาแสดงผล**: เวลาจากการ capture ภาพถึงการได้ประโยค LLM ต้องไมเกิน 2‑3 วินาทีใหนเครือข่ายทั่วไป
- **เสถีรภาพระบบ**: ทั้ง Frontend และ Backend ต้องทำงานต่อเนื่องได้เป็นเวลาอย่างน้อย 30 นาทีโดยไม่ล่ม และ endpoint ทั้งหมดภายการทดสอบ
- **เอกสารครบถู้**: มี Model Card, API Contract, User Guide, Deploy Runbook, Test Checklist และสรุปการทดสอบ เพื่อรองรับการส่งต่องานและการใช้งานในอนาคต

เมื่อดำเนินการตามแผนนี้และบรรุเกณษ์ดังกล่าว ทีมจะมีระบบต้นแบบ HandMat ที่พร้อมใช้งานและสามารถีพัฒนาต่อในระยะยาวได้

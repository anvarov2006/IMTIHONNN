#  Event Platform Backend

Toshkent shahrida bo‘lib o‘tadigan konsertlar, IT-meetuplar, stand-up shoular, master-klasslar va boshqa tadbirlar uchun backend API.

Ushbu loyiha orqali foydalanuvchilar ro‘yxatdan o‘tishi, emailini tasdiqlashi, tizimga kirishi, tadbirlarni qidirishi va joy bron qilishi mumkin.

Frontend qismi mavjud emas. Barcha API endpointlar **Postman** yoki **Thunder Client** orqali test qilinadi.

Ma'lumotlar bazasi o‘rniga ma'lumotlar **JSON fayllarda** saqlanadi.

---

##  Texnologiyalar

Loyiha quyidagi texnologiyalar yordamida ishlab chiqilgan:

* **Node.js** — JavaScript runtime
* **Express.js** — REST API yaratish
* **bcrypt** — parollarni hash qilish
* **jsonwebtoken (JWT)** — authentication
* **Nodemailer** — email yuborish
* **dotenv** — environment variables
* **JSON files** — ma'lumotlarni saqlash
* **Postman / Thunder Client** — API test qilish

---

##  Loyiha strukturasi

```text
event-platform/
│
├── data/
│   ├── users.json
│   ├── events.json
│   └── bookings.json
│
├── controllers/
│   ├── auth.controller.js
│   ├── event.controller.js
│   └── booking.controller.js
│
├── routes/
│   ├── auth.routes.js
│   ├── event.routes.js
│   └── booking.routes.js
│
├── middleware/
│   └── auth.middleware.js
│
├── utils/
│   ├── jsonDB.js
│   ├── email.js
│   └── generateCode.js
│
├── .env
├── .gitignore
├── package.json
└── server.js
```

---

#  Asosiy imkoniyatlar

##  Foydalanuvchi

Foydalanuvchi quyidagi imkoniyatlarga ega:

1. Ro‘yxatdan o‘tish
2. Emailni tasdiqlash
3. Login qilish
4. JWT token olish
5. Tadbirlarni ko‘rish
6. Tadbirlarni qidirish va filterlash
7. Tadbirga joy bron qilish
8. O‘z bronlarini ko‘rish
9. Bronni bekor qilish

---

##  Email tasdiqlash

Ro‘yxatdan o‘tish vaqtida foydalanuvchining paroli `bcrypt` yordamida hash qilinadi.

Foydalanuvchiga email orqali 6 xonali tasdiqlash kodi yuboriladi.

Masalan:

```text
Verification code: 483921
```

Foydalanuvchi ushbu kodni yuborib emailini tasdiqlaydi.

Email tasdiqlanmagan foydalanuvchi:

* login qila olmaydi;
* tadbirga bron qila olmaydi.

---

#  Authentication

Login vaqtida foydalanuvchi:

```text
email
password
```

yuboradi.

Server parolni `bcrypt.compare()` orqali tekshiradi.

Agar ma'lumotlar to‘g‘ri bo‘lsa, JWT token qaytariladi.

Misol:

```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

Himoyalangan endpointlarga murojaat qilishda token yuboriladi:

```http
Authorization: Bearer TOKEN
```

---

#  Events

Platformada tadbirlar saqlanadi.

Har bir event quyidagi ma'lumotlarga ega bo‘lishi mumkin:

```json
{
  "id": 1,
  "title": "IT Meetup Tashkent",
  "description": "Dasturchilar uchun meetup",
  "category": "IT",
  "date": "2026-10-15",
  "time": "18:00",
  "location": "IT Park",
  "totalSeats": 100,
  "availableSeats": 75
}
```

### Tadbir kategoriyalari

Masalan:

```text
Concert
IT
Stand-up
Masterclass
Sport
Other
```

---

#  Event qidirish va filterlash

Foydalanuvchi tadbirlarni qidirishi va filterlashi mumkin.

Masalan:

```http
GET /api/events?search=IT
```

Kategoriya bo‘yicha:

```http
GET /api/events?category=IT
```

Sana bo‘yicha:

```http
GET /api/events?date=2026-10-15
```

Bir nechta filter:

```http
GET /api/events?search=meetup&category=IT&date=2026-10-15
```

---

#  Pagination

Tadbirlar ko‘p bo‘lsa, pagination ishlatiladi.

Masalan:

```http
GET /api/events?page=1&limit=10
```

Javob:

```json
{
  "page": 1,
  "limit": 10,
  "total": 25,
  "totalPages": 3,
  "events": []
}
```

---

#  Booking

Tasdiqlangan foydalanuvchi tadbirga **1–5 ta joy** bron qilishi mumkin.

Request:

```http
POST /api/bookings
```

Body:

```json
{
  "eventId": 1,
  "seats": 2
}
```

Server:

1. Userni tekshiradi.
2. Event mavjudligini tekshiradi.
3. `seats` 1–5 oralig‘ida ekanligini tekshiradi.
4. Yetarli joy mavjudligini tekshiradi.
5. Eventdagi `availableSeats` ni kamaytiradi.
6. Booking yaratadi.
7. Ticket code yaratadi.
8. Foydalanuvchiga email yuboradi.

---

#  Ticket Code

Har bir booking uchun unique ticket code yaratiladi.

Misol:

```text
EVH-7K2Q9X
```

Ticket code email orqali foydalanuvchiga yuboriladi.

Masalan:

```text
Booking successful!

Event: IT Meetup Tashkent
Seats: 2
Ticket Code: EVH-7K2Q9X
```

---

#  Bookingni bekor qilish

Foydalanuvchi o‘z bookingini bekor qilishi mumkin.

```http
DELETE /api/bookings/:id
```

Booking bekor qilinganda:

1. Booking o‘chiriladi yoki cancelled holatiga o'tkaziladi.
2. Bron qilingan joylar eventga qaytariladi.
3. Foydalanuvchiga email yuboriladi.

Masalan:

```text
Your booking has been cancelled.

Event: IT Meetup Tashkent
Seats returned: 2
```

---

#  Eventni o‘chirish

Event o‘chirilganda unga booking qilgan barcha foydalanuvchilar aniqlanadi.

Ularga email orqali:

```text
Tadbir bekor qilindi
```

mazmunidagi xabar yuboriladi.

Misol:

```text
Hello!

Unfortunately, the event "IT Meetup Tashkent"
has been cancelled.

We apologize for the inconvenience.
```

---

#  API Endpoints

## Authentication

| Method | Endpoint                 | Auth | Description        |
| ------ | ------------------------ | ---- | ------------------ |
| POST   | `/api/auth/register`     | ❌    | Ro‘yxatdan o‘tish  |
| POST   | `/api/auth/verify-email` | ❌    | Emailni tasdiqlash |
| POST   | `/api/auth/login`        | ❌    | Login qilish       |

---

## Events

| Method | Endpoint          | Auth | Description        |
| ------ | ----------------- | ---- | ------------------ |
| GET    | `/api/events`     | ❌    | Barcha tadbirlar   |
| GET    | `/api/events/:id` | ❌    | Bitta tadbir       |
| POST   | `/api/events`     | ✅    | Tadbir yaratish    |
| PUT    | `/api/events/:id` | ✅    | Tadbirni yangilash |
| DELETE | `/api/events/:id` | ✅    | Tadbirni o‘chirish |

---

## Bookings

| Method | Endpoint            | Auth | Description               |
| ------ | ------------------- | ---- | ------------------------- |
| POST   | `/api/bookings`     | ✅    | Joy bron qilish           |
| GET    | `/api/bookings/my`  | ✅    | O‘z bookinglarini ko‘rish |
| DELETE | `/api/bookings/:id` | ✅    | Bookingni bekor qilish    |

---

#  Register

### Request

```http
POST /api/auth/register
```

Body:

```json
{
  "name": "Ali",
  "email": "ali@gmail.com",
  "password": "12345678"
}
```

### Response

```json
{
  "message": "Registration successful. Verification code sent to email."
}
```

Parol JSON faylga ochiq ko‘rinishda yozilmaydi.

Masalan:

```json
{
  "id": 1,
  "name": "Ali",
  "email": "ali@gmail.com",
  "password": "$2b$10$...",
  "isVerified": false
}
```

---

#  Verify Email

### Request

```http
POST /api/auth/verify-email
```

Body:

```json
{
  "email": "ali@gmail.com",
  "code": "483921"
}
```

### Response

```json
{
  "message": "Email successfully verified."
}
```

---

#  Login

### Request

```http
POST /api/auth/login
```

Body:

```json
{
  "email": "ali@gmail.com",
  "password": "12345678"
}
```

### Response

```json
{
  "message": "Login successful",
  "token": "JWT_TOKEN",
  "user": {
    "id": 1,
    "name": "Ali",
    "email": "ali@gmail.com"
  }
}
```

---

#  O‘rnatish

Repositoryni clone qiling:

```bash
git clone https://github.com/username/event-platform.git
```

Loyiha papkasiga kiring:

```bash
cd event-platform
```

Dependencylarni o‘rnating:

```bash
npm install
```

---

#  Environment Variables

Root papkada `.env` fayl yarating:

```env
PORT=3000

JWT_SECRET=your_secret_key

EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password
```

> `EMAIL_PASS` sifatida oddiy email parolidan foydalanish o‘rniga email provider tomonidan berilgan **App Password** ishlatilishi tavsiya etiladi.

---

#  Loyihani ishga tushirish

Development rejimida:

```bash
npm run dev
```

yoki:

```bash
node server.js
```

Server:

```text
http://localhost:3000
```

---

#  Postman orqali test qilish

API'larni Postman yoki Thunder Client orqali tekshirish mumkin.

Masalan:

```text
POST http://localhost:3000/api/auth/register
```

Body → `raw` → `JSON`:

```json
{
  "name": "Ali",
  "email": "ali@gmail.com",
  "password": "12345678"
}
```

Login qilgandan keyin olingan JWT tokenni protected endpointlarda:

```text
Authorization
Bearer Token
```

orqali yuborish kerak.

---

#  JSON Database

Loyihada database server ishlatilmaydi.

Ma'lumotlar quyidagi fayllarda saqlanadi:

```text
data/users.json
data/events.json
data/bookings.json
```

### users.json

Foydalanuvchilar:

```json
[
  {
    "id": 1,
    "name": "Ali",
    "email": "ali@gmail.com",
    "password": "$2b$10$...",
    "isVerified": true
  }
]
```

### events.json

Tadbirlar:

```json
[
  {
    "id": 1,
    "title": "IT Meetup",
    "category": "IT",
    "date": "2026-10-15",
    "totalSeats": 100,
    "availableSeats": 80
  }
]
```

### bookings.json

Bronlar:

```json
[
  {
    "id": 1,
    "userId": 1,
    "eventId": 1,
    "seats": 2,
    "ticketCode": "EVH-7K2Q9X",
    "status": "confirmed"
  }
]
```

---

#  User Flow

Platformaning asosiy ishlash jarayoni:

```text
Register
   ↓
Password → bcrypt hash
   ↓
users.json
   ↓
Verification Code → Email
   ↓
Verify Email
   ↓
Login
   ↓
JWT Token
   ↓
View Events
   ↓
Search / Filter / Pagination
   ↓
Select Event
   ↓
Book 1–5 Seats
   ↓
Generate Ticket Code
   ↓
Ticket → Email
```

Bookingni bekor qilish:

```text
User
 ↓
Cancel Booking
 ↓
Booking cancelled
 ↓
Seats returned to Event
 ↓
Cancellation Email
```

Event o‘chirilishi:

```text
Delete Event
 ↓
Find all bookings
 ↓
Find participants
 ↓
Cancel Event
 ↓
Send email to all participants
```

---

#  Security

Loyihada quyidagi xavfsizlik mexanizmlaridan foydalaniladi:

 Password hashing — `bcrypt`
 Authentication — `JWT`
 Environment variables — `.env`
 Protected routes — authentication middleware
 Email verification
 User passwordlari plain text holatda saqlanmaydi
 Booking faqat verified user uchun mavjud

---

#  Muhim cheklovlar

Ushbu loyiha o‘quv maqsadidagi backend loyiha bo‘lib, ma'lumotlar JSON fayllarda saqlanadi.

Production muhitida quyidagilarni qo‘shish tavsiya etiladi:

# PostgreSQL / MongoDB
# Redis
# Rate limiting
# Input validation
# Admin role
# Refresh token
# Logging
# Error monitoring
# Docker
# Automated tests
# Real payment system

---

#  Author

**Event Platform Backend**

Node.js + Express.js asosida ishlab chiqilgan REST API loyiha.

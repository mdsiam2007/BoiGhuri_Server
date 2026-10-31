# 📚 BoiGhuri Server — বইঘুরি ব্যাকএন্ড এপিআই

বইঘুরি (BoiGhuri) অনলাইন লাইব্রেরি প্ল্যাটফর্মের অফিসিয়াল ব্যাকএন্ড সার্ভিস। এটি Node.js, Express.js এবং Mongoose (MongoDB ODM) দিয়ে নির্মিত একটি সম্পূর্ণ RESTful API সার্ভিস।

---

## 🌟 মূল ফিচারসমূহ (Key Features)

- **সম্পূর্ণ Mongoose স্কিমা ভ্যালিডেশন:** বই, ধার নেওয়ার রেকর্ড এবং বইয়ের রিভিউ এর জন্য অপ্টিমাইজড স্কিমা ও ইনডেক্সিং।
- **JWT অথেন্টিকেশন মিডলওয়্যার:** প্রতিটি প্রাইভেট রিকোয়েস্ট এবং ডেটা মডিফিকেশনের জন্য JSON Web Token নিরাপত্তা।
- **স্বয়ংক্রিয় স্টক ট্র্যাকিং ($inc):** বই ধার নিলে স্টক ১ হ্রাস পায় এবং ফেরত দিলে স্টক ১ বৃদ্ধি পায়।
- **ডাবল-বরো রোধ (Double Borrow Prevention):** একই ইউজার একটি বই একাধিকবার একই সময়ে ধার নিতে পারে না।
- **বই রিভিউ ও রেটিং সিস্টেম:** প্রতি বইয়ে একজন ইউজার একটিই রিভিউ দিতে পারে এবং এডিট করলে `(edited)` ব্যাজ ও টাইমস্ট্যাম্প সেট হয়।
- **CORS & সিকিউরিটি প্রোটেকশন:** নির্দিষ্ট ক্লায়েন্ট অরিজিন ও কুকি সাপোর্ট।

---

## 🛠 টেক স্ট্যাক (Tech Stack)

- **রানটাইম:** Node.js
- **ফ্রেমওয়ার্ক:** Express.js
- **ডাটাবেস ও ওডিএম:** MongoDB Atlas + Mongoose
- **অথেনটিকেশন:** JSON Web Token (jsonwebtoken)
- **মিডলওয়্যার:** CORS, Cookie-Parser, Morgan (Logging)

---

## 📡 এপিআই এন্ডপয়েন্টসমূহ (API Endpoints)

### ১. বই সংক্রান্ত এপিআই (`/books`)
- `GET /books` — সকল বই প্রদর্শন (ফিল্টার: `limit`, `sort`, `category`, `search`, `userEmail`)
- `GET /books/:id` — নির্দিষ্ট বইয়ের বিস্তারিত বিবরণ
- `POST /books` — নতুন বই যোগ করা *(Private / JWT)*
- `PATCH /books/:id` — নিজের যুক্ত করা বইয়ের তথ্য আপডেট *(Private / JWT)*
- `DELETE /books/:id` — বই মুছে ফেলা *(Private / JWT)*

### ২. ধার নেওয়া ও ফেরত সংক্রান্ত এপিআই (`/borrows`)
- `POST /borrows` — বই ধার নেওয়া *(Private / JWT)*
- `GET /borrows` — বর্তমান ইউজারের ধার করা বইয়ের তালিকা *(Private / JWT)*
- `DELETE /borrows/:id` — বই ফেরত দেওয়া *(Private / JWT)*

### ৩. রিভিউ ও রেটিং এপিআই (`/reviews`)
- `GET /reviews?bookId=:id` বা `GET /reviews/:bookId` — বইয়ের সকল রিভিউ ও গড় রেটিং দেখা
- `POST /reviews` — রিভিউ জমা দেওয়া *(Private / JWT)*
- `PATCH /reviews/:id` — নিজের রিভিউ এডিট করা *(Private / JWT)*
- `DELETE /reviews/:id` — নিজের রিভিউ মুছে ফেলা *(Private / JWT)*

### ৪. অথেনটিকেশন টোকেন এপিআই (`/auth`)
- `POST /auth/jwt` — ক্লায়েন্টের সেশনের জন্য JWT টোকেন ইস্যু করা
- `POST /auth/logout` — টোকেন কুকি ক্লিয়ার করা

---

## 🚀 লোকাল সেটআপ ও রান করার নিয়ম

১. রিপোজিটরি ক্লোন করুন এবং ডিরেক্টরিতে যান:
```bash
cd boi-ghuri-server
```

২. ডিপেন্ডেন্সি ইনস্টল করুন:
```bash
npm install
```

৩. `.env` ফাইলে আপনার ক্রেডেনশিয়াল কনফিগার করুন:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=your_mongodb_connection_uri
JWT_SECRET=your_jwt_secret_key
CLIENT_URL=http://localhost:3000
```

৪. ডাটাবেসে প্রাথমিক বই সিড করুন (ঐচ্ছিক):
```bash
npm run seed
```

৫. ডেভেলপমেন্ট সার্ভার চালু করুন:
```bash
npm run dev
```
সার্ভার `http://localhost:5000` এ রান হবে।


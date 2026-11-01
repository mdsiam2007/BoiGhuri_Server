<div align="center">

# ⚙️ BoiGhuri Server — Express.js & Native MongoDB API

[![Node.js](https://img.shields.io/badge/Node.js-v20+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-v4.21+-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Native_Driver-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![JWT](https://img.shields.io/badge/JWT-Protected-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)](https://jwt.io/)
[![ES Modules](https://img.shields.io/badge/ES_Modules-Enabled-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://nodejs.org/api/esm.html)

<p align="center">
  <b>High-performance, secure backend RESTful API powering the BoiGhuri online library system.</b>
  <br />
  Built with pure <b>ES Modules</b>, official <b>Native MongoDB Driver</b> (Zero Mongoose), atomic <code>$inc</code> stock operations, and stateless <b>JWT</b> authentication.
</p>

---

🔗 **Frontend Client Repository:** [https://github.com/mdsiam2007/BoiGhuri_Client](https://github.com/mdsiam2007/BoiGhuri_Client)  
🌐 **Live Client Application:** [https://boighuri-client.vercel.app](https://boighuri-client.vercel.app)

---

</div>

## 🌟 Key Features & Architectural Highlights

- 🍃 **Native MongoDB Driver (No Mongoose):** Direct high-throughput collection-level queries utilizing connection pooling (`minPoolSize: 2`, `maxPoolSize: 10`) and atomic document manipulation.
- 🛡️ **JWT Security Middleware:** Secure token generation and verification via `httpOnly` cookies and standard `Authorization: Bearer <token>` headers.
- ⚡ **Atomic Inventory Tracking (Challenge 1):** Book stock increments and decrements are performed atomically using MongoDB's `$inc` operator (`findOneAndUpdate` with `totalCopies: { $gt: 0 }`), eliminating race conditions during concurrent borrows.
- 🚫 **Double-Borrow Prevention Engine (Challenge 2):** Real-time verification ensuring a user cannot borrow the same book concurrently without returning it first.
- ⭐ **Reader Review & Rating Engine:** Authenticated reader review management with a strict **borrow-before-review** policy, single review per user constraint, and real-time average rating calculation.
- 📚 **Comprehensive Seed System:** Automated seeding utility generating 40 authentic books with authentic Open Library covers, authors, and summaries.
- 🌐 **Clean ES Modules & Pure English Codebase:** Modern `"type": "module"` architecture with standardized English logs, comments, and consistent JSON responses.

---

## 📡 Complete RESTful API Endpoints

### 🔐 Authentication & Profile (`/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/jwt` | Public | Generate JWT token and set `httpOnly` cookie |
| `PATCH` | `/auth/profile` | Private (JWT) | Update user display name and profile image across books & reviews |
| `POST` | `/auth/logout` | Public | Clear JWT authentication cookie |

### 📚 Books Management (`/books`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/books` | Public | Fetch all books with optional filters (`category`, `search`, `sort`, `limit`, `userEmail`) |
| `GET` | `/books/:id` | Public | Fetch a single book's complete details by ID |
| `POST` | `/books` | Private (JWT) | Add a new book to the library catalog |
| `PATCH` | `/books/:id` | Private (Owner) | Update an existing book (owner only) |
| `DELETE` | `/books/:id` | Private (Owner) | Delete a book from catalog (owner only) |

### 📖 Borrow System (`/borrows`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/borrows` | Private (JWT) | Borrow a book, atomically decrement available copies (`$inc: -1`), and prevent double borrows |
| `GET` | `/borrows` | Private (JWT) | Retrieve all active borrowed books of the authenticated user |
| `DELETE` | `/borrows/:id` | Private (Owner) | Return a borrowed book, atomically increment available copies (`$inc: +1`), and remove borrow record |

### ⭐ Reviews & Ratings (`/reviews`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/reviews?bookId=:id` | Public | Fetch all reader reviews and calculated average rating for a book |
| `POST` | `/reviews` | Private (JWT) | Submit a review (enforces borrow check & 1 review per user) |
| `PATCH` | `/reviews/:id` | Private (Owner) | Update an existing review with automatic `(edited)` flag |
| `DELETE` | `/reviews/:id` | Private (Owner) | Delete a review (owner only) |

---

## 🛠️ Environment Configuration

Create a `.env` file in the root directory:

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# MongoDB Connection URI (Native Driver)
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/?retryWrites=true&w=majority
DB_NAME=boighuri

# JWT Authentication Secret
JWT_SECRET=your_super_secret_jwt_key_here
```

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/mdsiam2007/BoiGhuri_Server.git
cd BoiGhuri_Server
```

### 2. Install dependencies
```bash
npm install
```

### 3. Seed the database with 40 real books
```bash
npm run seed
```

### 4. Start the server
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

Server will start on `http://localhost:5000`.

---

## 📂 Project Structure

```
boi-ghuri-server/
├── src/
│   ├── config/
│   │   ├── collections.js     # Native MongoDB collection accessors
│   │   └── db.js              # MongoClient connection & pooling setup
│   ├── controllers/
│   │   ├── authController.js   # JWT generation, profile sync & logout
│   │   ├── bookController.js   # Full CRUD operations with query filters
│   │   ├── borrowController.js # Atomic stock tracking & borrow/return
│   │   └── reviewController.js # Borrow-verified review management
│   ├── middlewares/
│   │   ├── errorHandler.js    # Global centralized error handler
│   │   └── verifyToken.js     # JWT bearer & cookie verification
│   ├── routes/
│   │   ├── authRoutes.js      # Auth route mappings
│   │   ├── bookRoutes.js      # Book route mappings
│   │   ├── borrowRoutes.js    # Borrow route mappings
│   │   └── reviewRoutes.js    # Review route mappings
│   ├── scripts/
│   │   └── seed.js            # 40 authentic books database seeder
│   └── index.js               # Express server entry point & CORS
├── .env.example
├── package.json
└── README.md
```

---

<div align="center">
  <p>Developed with ❤️ for <b>BoiGhuri (বইঘুরি)</b></p>
</div>

import express from "express";
import cors from "cors";
import session from "express-session";
import MongoStore from "connect-mongo";
import "dotenv/config";
import mongoose from "mongoose";
import Hello from "./Hello.js";
import Lab5 from "./Lab5/index.js";
import UserRoutes from "./Kambaz/Users/routes.js";
import CourseRoutes from "./Kambaz/Courses/routes.js";
import ModuleRoutes from "./Kambaz/Modules/routes.js";
import AssignmentRoutes from "./Kambaz/Assignments/routes.js";
import EnrollmentRoutes from "./Kambaz/Enrollments/routes.js";

const CONNECTION_STRING = process.env.MONGO_CONNECTION_STRING || "mongodb://127.0.0.1:27017/kambaz";

mongoose.connect(CONNECTION_STRING)
  .then(() => console.log("Connected to MongoDB:", CONNECTION_STRING.substring(0, 20) + "..."))
  .catch(err => console.error("MongoDB connection error:", err));

const app = express();

// 在生产环境中信任代理
if (process.env.NODE_ENV === "production") {
  app.set('trust proxy', 1);
  console.log("Running in production mode - trust proxy enabled");
}

// 配置CORS
const allowedOrigins = [
  process.env.NETLIFY_URL,
  "https://a6--kambaz-react-web-app-zixin-lin.netlify.app",
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:5174"
].filter(Boolean);

console.log("Allowed CORS origins:", allowedOrigins);

app.use(cors({
  credentials: true,
  origin: function(origin, callback) {
    console.log("Request origin:", origin);
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log("Origin not allowed by CORS:", origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["set-cookie"]
}));


const mongoStore = MongoStore.create({
  mongoUrl: CONNECTION_STRING,
  collectionName: "sessions",
  ttl: 24 * 60 * 60,
  autoRemove: 'native',
  touchAfter: 24 * 3600 
});

mongoStore.on('create', (sessionId) => {
  console.log('Session created:', sessionId);
});

mongoStore.on('touch', (sessionId) => {
  console.log('Session touched:', sessionId);
});

mongoStore.on('destroy', (sessionId) => {
  console.log('Session destroyed:', sessionId);
});

const sessionOptions = {
  secret: process.env.SESSION_SECRET || "kambaz",
  resave: false,
  saveUninitialized: false,
  store: mongoStore,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
  }
};

if (process.env.NODE_ENV === "production") {
  sessionOptions.cookie.secure = true;
  sessionOptions.cookie.sameSite = "none";
  console.log("Production cookie settings applied:", {
    secure: sessionOptions.cookie.secure,
    sameSite: sessionOptions.cookie.sameSite
  });
}

app.use(session(sessionOptions));
app.use(express.json());

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - IP: ${req.ip}`);
  
  if (req.method === 'POST' && req.path === '/api/users/signin') {
    console.log('Signin attempt for username:', req.body.username);
  }
  
  console.log('Session ID:', req.sessionID);
  console.log('Session exists:', !!req.session);
  console.log('Current user in session:', req.session?.currentUser?.username || 'None');
  
  // 记录Cookie信息
  console.log('Cookies received:', req.headers.cookie || 'No cookies');
  
  next();
});

// 测试路由，用于检查会话是否正常工作
app.get('/api/test-session', (req, res) => {
  if (!req.session.views) {
    req.session.views = 1;
  } else {
    req.session.views++;
  }
  
  res.json({
    sessionId: req.sessionID,
    views: req.session.views,
    currentUser: req.session.currentUser || null
  });
});

// 注册所有路由
Hello(app);
Lab5(app);
UserRoutes(app);
CourseRoutes(app);
ModuleRoutes(app);
AssignmentRoutes(app);
EnrollmentRoutes(app);

app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).send('Something broke!');
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log('Environment:', process.env.NODE_ENV || 'development');
  console.log('MongoDB:', CONNECTION_STRING.substring(0, 20) + '...');
  console.log('Allowed origins:', allowedOrigins);
  console.log('Session secret:', process.env.SESSION_SECRET ? '****' : 'Using default (not secure)');
});

// const express = require('express');
// const cookieParser = require('cookie-parser')
// const cors= require('cors');
// const connectDb = require('./config/db');
// require('dotenv').config()
// const authRoute= require('./routes/authRoute')
// const postRoute= require('./routes/postRoute')
// const userRoute = require('./routes/userRoute');
// const localIssueRoute = require('./routes/localIssueRoute');
// const passport = require('./controllers/googleController');
// const adminRoutes = require('./routes/adminRoute');

// const app = express()
// app.use(express.json())
// app.use(cookieParser())


// const corsOptions = {
//     origin:process.env.FRONTEND_URL,
//     credentials:true,
// }
// app.use(cors(corsOptions))


// connectDb()
// app.use(passport.initialize())

// //api route
// app.use('/auth',authRoute)
// app.use('/users',postRoute)
// app.use('/users',userRoute)
// app.use('/api/local-issues', localIssueRoute)
// // app.use('/admin', adminRoutes);
// app.use('/api/admin', adminRoutes);


// app.get('/', (req, res) => {
//     res.send('API is running...');
// });

// const PORT = process.env.PORT || 8000;
// app.listen(PORT, () => console.log(`server listening on ${PORT}`))


const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const connectDb = require('./config/db');
require('dotenv').config();
const authRoute = require('./routes/authRoute');
const postRoute = require('./routes/postRoute');
const userRoute = require('./routes/userRoute');
const localIssueRoute = require('./routes/localIssueRoute');
const passport = require('./controllers/googleController');
const adminRoutes = require('./routes/adminRoute');
const notificationRoute = require('./routes/notificationRoute');

const app = express();
app.use(express.json());
app.use(cookieParser());

// ✅ Updated CORS configuration
const allowedOrigins = [
  "https://civicsense.in",
  "https://www.civicsense.in",
  "http://localhost:3000"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log("Blocked by CORS:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));

// DB connection
connectDb();
app.use(passport.initialize());

// API routes
app.use('/auth', authRoute);
app.use('/users', postRoute);
app.use('/users', userRoute);
app.use('/api/local-issues', localIssueRoute);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoute);

// Health check
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Start server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`server listening on ${PORT}`));

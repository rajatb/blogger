let express = require('express')
let morgan = require('morgan')
let bodyParser = require('body-parser')
let cookieParser = require('cookie-parser')
let session = require('express-session')
let passport = require('passport')
let LocalStrategy = require('passport-local').Strategy

// const NODE_ENV = process.env.NODE_ENV
const PORT = process.env.PORT || 8000

let app = express()

// log every request to the console
app.use(morgan('dev'))

// Read cookies, required for sessions
app.use(cookieParser('ilovethenodejs'))

// Get POST/PUT body information (e.g., from html forms)
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// Use ejs for templating
app.set('view engine', 'ejs')

// In-memory session support, required by passport.session()
app.use(session({
  secret: 'ilovethenodejs',
  resave: true,
  saveUninitialized: true
}))

// Use the passport middleware to enable passport
app.use(passport.initialize())

// Enable passport persistent sessions
app.use(passport.session())

// Add before app.listen()
let user = {
  email: 'foo@foo.com',
  password: 'asdf'
}

passport.use(new LocalStrategy({
  // Use "email" field instead of "username"
  usernameField: 'email'
}, (email, password, callback) => {
  // Don't bother with async/await since our code here is simple
  if (email !== user.email) {
    return callback(null, false, {message: 'Invalid username'})
  } else if (password !== user.password) {
    return callback(null, false, {message: 'Invalid password'})
  }
  callback(user)
}))

// start server
app.listen(PORT, ()=> console.log(`Listening @ http://127.0.0.1:${PORT}`))

app.get('/', (req, res) => res.render('index.ejs', {}))

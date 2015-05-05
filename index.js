let express = require('express')
let morgan = require('morgan')
let bodyParser = require('body-parser')
let cookieParser = require('cookie-parser')
let session = require('express-session')
let passport = require('passport')
let LocalStrategy = require('passport-local').Strategy
let bcrypt = require('bcrypt')
let nodeify = require('bluebird-nodeify')
let flash = require('connect-flash')
require('songbird')

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
app.use(flash())

const SALT = bcrypt.genSaltSync(10)

// Add in-memory user before app.listen()
let user = {
  email: 'foo@foo.com',
  password: bcrypt.hashSync('asdf', SALT)
}

passport.use(new LocalStrategy({
  // Use "email" field instead of "username"
  usernameField: 'email',
  // We'll need this later
  failureFlash: true
}, (email, password, callback) => {
  let promise = (async ()=>{
    if (email !== user.email) {
      return [false, {message: 'Invalid username'}]
    }

    if (!await bcrypt.promise.compare(password, user.password)) {
      return [false, {message: 'Invalid password'}]
    }
    return user
  // Use spread option when returning multiple values
  }())
  nodeify(promise, callback, {spread: true})
}))

passport.serializeUser(function(user, callback) {
  callback(null, user.email)
})

passport.deserializeUser(function(id, callback) {
  console.log('deserializeUser: ', user)
  callback(null, user)
})

// start server
app.listen(PORT, ()=> console.log(`Listening @ http://127.0.0.1:${PORT}`))

app.get('/', (req, res) => {
  res.render('index.ejs', {message: req.flash('error')})
})

app.post('/login', passport.authenticate('local', {
  successRedirect: '/profile',
  failureRedirect: '/',
  failureFlash: true
}))


function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next()
  res.redirect('/')
}

app.get('/profile', isLoggedIn, (req, res) => {
  console.log('req.user: ', req.user)
  res.render('profile.ejs', {
    user: req.user,
    message: req.flash('error')
  })
})
// app.get('/profile', isLoggedIn, (req, res) => res.render('profile.ejs', {user: req.user}))

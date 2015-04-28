let mongoose = require('mongoose'),
  bcrypt = require('bcrypt'),
  _ = require('lodash')

require('songbird')

let userSchema = mongoose.Schema({
  local: {
    email: String,
    password: String
  },
  facebook: {
    id: String,
    token: String,
    email: String,
    name: String
  },
  twitter: {
    id: String,
    token: String,
    username: String,
    name: String
  },
  google: {
    id: String,
    token: String,
    email: String,
    name: String
  },
  linkedin: {
    id: String,
    token: String,
    email: String,
    name: String
  }
})

userSchema.methods.generateHash = function(password) {
  return bcrypt.promise.hash(password, 8)
}

userSchema.methods.validatePassword = function(password) {
  return bcrypt.promise.compare(password, this.local.password)
}

userSchema.methods.linkAccount = function(type, values) {
  // linkAccount('facebook', ...) => linkFacebookAccount(values)
  return this['link'+_.capitalize(type)+'Account'](values)
}

userSchema.methods.linkLocalAccount = function({email, password}) {
  return (async ()=> {
    this.local.email = email
    this.local.password = await this.generateHash(password)
    return await this.save()
  })()
}

userSchema.methods.linkFacebookAccount = function({account, token}) {
  this.facebook.id = account.id
  this.facebook.token = token
  this.facebook.name = account.name.givenName + ' ' + account.name.familyName
  this.facebook.email = (account.emails[0].value || '').toLowerCase()
  return this.save()
}

userSchema.methods.linkTwitterAccount = function({account, token}) {
  this.twitter.id = account.id
  this.twitter.token = token
  this.twitter.username = account.username
  this.twitter.name = account.displayName
  return this.save()
}

userSchema.methods.linkGoogleAccount = function({account, token}) {
  this.google.id = account.id
  this.google.token = token
  this.google.name = account.displayName
  this.google.email = (account.emails[0].value || '').toLowerCase()
  return this.save()
}

userSchema.methods.linkLinkedinAccount = function({account, token}) {
  this.linkedin.id = account.id
  this.linkedin.token = token
  this.linkedin.name = account.displayName
  this.email = (account.emails[0].value || '').toLowerCase()
  return this.save()
}

userSchema.methods.unlinkAccount = function(type) {
  let d = Promise.defer()
  this[type] = undefined
  this.save((err) => err ? d.reject(err) : d.resolve(this))
  console.log(d.promise)
  return d.promise
}

module.exports = mongoose.model('User', userSchema)

let mongoose = require('mongoose'),
  bcrypt = require('bcrypt')

require('songbird')

let userSchema = mongoose.Schema({
  email: String,
  password: String
})

userSchema.methods.generateHash = async function(password) {
  return await bcrypt.promise.hash(password, 8)
}

userSchema.methods.validatePassword = async function(password) {
  return await bcrypt.promise.compare(password, this.local.password)
}

userSchema.methods.linkLocalAccount = async function({email, password}) {
  this.local.email = email
  this.local.password = await this.generateHash(password)
  return await this.save()
}

userSchema.methods.unlinkAccount = async function(type) {
  this[type] = undefined
  return await this.save()
}

module.exports = mongoose.model('User', userSchema)

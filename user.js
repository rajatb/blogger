let mongoose = require('mongoose')
let crypto = require('crypto')
let nodeify = require('bluebird-nodeify')
let Post = require('./models/post')

require('songbird')

let userSchema = mongoose.Schema({
	username: {
		type: String,
		required: true
	},

  email: {
  	type: String,
  	required: true
  },
  password: { 
  	type: String, 
  	required: true
  },
  blogTitle : String,
  blogDescription: String, 
  Posts: [Post]
 
})

userSchema.methods.generateHash = async function(password) {
	let hash = await crypto.promise.pbkdf2(password, 'salt', 4096, 512, 'sha256')
	return hash.toString('hex')
  // return await bcrypt.promise.hash(password, 8)
}

userSchema.methods.validatePassword = async function(password) {
	let hash = await crypto.promise.pbkdf2(password, 'salt', 4096, 512, 'sha256')
	var newHashPassword = hash.toString('hex')
	return (newHashPassword === this.password)
  //return await bcrypt.promise.compare(password, this.password)
}

userSchema.path('password').validate((pw)=> {
	console.log("password:"+ pw)
	return pw.length >=4 && /[A-Z]/.test(pw) && /[a-z]/.test(pw) && /[0-9]/.test(pw)
})

userSchema.pre('save', function(callback){
	console.log('I am here!')
	nodeify(async()=>{
		if(!this.isModified('password')) return callback()
		this.password = await this.generateHash(this.password)

	}(),callback)

})



module.exports = mongoose.model('User', userSchema)

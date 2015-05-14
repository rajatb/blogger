let isLoggedIn = require('./middleware/isLoggedIn')
let multiparty = require('multiparty')
let DataUri = require('datauri')
let then = require('express-then')
let Post = require('./models/post')
let Comment = require('./models/comment')
let fs = require('fs')

module.exports = (app) => {
  let passport = app.passport

  app.get('/', (req, res) => {
    res.render('index.ejs')
  })

  app.get('/login', (req, res) => {
    res.render('login.ejs', {message: req.flash('error')})
  })

  app.post('/login', passport.authenticate('local', {
    successRedirect: '/profile',
    failureRedirect: '/login',
    failureFlash: true
  }))

   app.get('/signup', (req, res) => {
    res.render('signup.ejs', {message: req.flash('error')})
  })

  // process the signup form
  app.post('/signup', passport.authenticate('local-signup', {
    successRedirect: '/profile',
    failureRedirect: '/signup',
    failureFlash: true
  }))

  app.get('/profile', isLoggedIn, then(async(req, res) => {
    
    let posts = await Post.promise.find()
    console.log(posts)
    res.render('profile.ejs', {
      user: req.user,
      message: req.flash('error'),
      posts:posts
    })

    
  }))

  app.get('/logout', (req, res) => {
    req.logout()
    res.redirect('/')
  })

  app.get('/post/:postId?', then(async (req, res) =>{
    let postId = req.params.postId
    if(!postId) {
      res.render('post.ejs', {
      post: {}, 
      verb: 'Create Post'
    })
      return
    }

     let post = await Post.promise.findById(postId)
    if(!post) res.send(404, 'Not found')

     let dataUri = new DataUri
     let image = dataUri.format('.'+post.image.contentType.split('/').pop(),post.image.data) 
      
    res.render('post.ejs', {
      post: post, 
      verb: 'Edit Post',
      image: `data:${post.image.contentType};base64,${image.base64}`
    })
    
  }))

   app.post('/post/:postId?', then(async (req, res) =>{
    let postId = req.params.postId
    if(!postId) {
      try{
          let post = new Post()
          
          let [{title: [title], content: [content]},{image: [file]}] = await new multiparty.Form().promise.parse(req)
          post.title = title
          post.content = content
          post.image.data = await fs.promise.readFile(file.path)
          post.image.contentType = file.headers['content-type']
           // await post.save()
           // console.log("User Post:"+req.user.post)
           let user = req.user
           user.posts.push(post)
           await req.user.save()
           res.redirect('/blog/')
           // res.redirect('/blog/'+ encodeURI(req.user.blogTitle))
           return
      }catch(e){
        console.log(e.stack)
      }
      
    }
    
    let post = await Post.promise.findById(postId)
    let [{title: [title], content: [content]},{image: [file]}] = await new multiparty.Form().promise.parse(req)
    if(!post) res.send(404, 'Not found')

      post.title = title
      post.content = content
      post.updateDate = new Date()

      await post.save()
      res.redirect('/blog/'+ encodeURI(req.user.blogTitle))

    console.log('TODO')
  }))

app.get('/blog/:blogTitle?', then(async (req, res) =>{
    let blogTitle = req.params.blogTitle
    
     let posts = await Post.promise.find()
    if(!posts) res.send(404, 'Not found')

     // let dataUri = new DataUri
     // let image = dataUri.format('.'+post.image.contentType.split('/').pop(),post.image.data) 
      
    res.render('blogs.ejs', {
      posts: posts
      // image: `data:${post.image.contentType};base64,${image.base64}`
    })
    
  }))



 app.post('/comment/:postId?', then(async (req, res) =>{
    let postId = req.params.postId
    
    let post = await Post.promise.findById(postId)
    if(!post) res.send(404, 'Not found')

    let comment = new Comment  

      comment.comment = req.body.comment
      post.comments.push(comment)

      await post.save()
      res.redirect('/blog/'+ encodeURI(req.user.blogTitle))

    
  }))
}

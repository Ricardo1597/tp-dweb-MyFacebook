var express = require('express');
var router = express.Router();
var passport = require('passport')
var querystring = require('querystring')
var axios = require('axios')
var formidable = require('formidable')
var path = require('path');
var randomstring = require('randomstring')
var hash = require('crypto').createHash;
let fs = require('fs');
var flash = require('connect-flash');


var jwt = require('jsonwebtoken')



router.get('/', passport.authenticate('jwt', {session : false, failureRedirect : "/publicas", failureFlash : "Não tem acesso a esta página, por favor autentique-se!"}), (req,res) => {
  res.render("userHomepage")
})

//Login

router.get('/login', (req,res) => {
  console.log('Na cb do GET /login ...')
  var str = req.flash('info')
  console.log(str)
  if (str.length > 0){
    console.log("Tem mensagens!")
    res.render('login' , {msg : str})
  }
  else{
    console.log("Vazio")
    res.render('login')
  }

})

router.get("/publicas", (req,res) => {
  res.render('homepage')
  //res.send(req.flash('error'))
})


router.get('/logout', passport.authenticate('jwt', {session : false, failureRedirect : "/publicas", failureFlash : "Não tem acesso a esta página, por favor autentique-se!"}),(req,res) => {
  console.log('Na cb do GET /logout ...')
  req.session.token = null
  res.redirect('/publicas')

})

router.get('/registo', (req,res) => {
  console.log('Na cb do GET /login ...')
  var srt = req.flash("inforeg")
  if(srt.length > 0)
    res.render('registo', {msg: srt})
  else
    res.render('registo')


})


router.post("/login", (req,res) => {
  console.log("No login da pagina")
  var username = req.body.username
  var password = req.body.password
  axios.post("http://localhost:3000/api/users/login", {username, password})
    .then(dados => {
      console.log("Token: "+ JSON.stringify(dados.data.token))

      teste(req, dados.data.token)
      .then(copia =>{
        if(copia === dados.data.token)
          console.log("NICEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE2222222222222222222222222")
        else
          console.log("NOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO2222222222222222222222222")
        res.redirect("/")
      })
      .catch(erro => console.log("ERRO " + erro))
      // Guardar o token
      console.log(req.session.token)
    })
    .catch(e => {
      console.log("Erro no /login" + e)
      req.flash('info', 'Erro no login, por favor tente novamente!')
      res.redirect('/login')
    })
})

async function teste(req, token){
  return new Promise((copia, erro) =>{
    req.session.token = token
    req.session.save(err =>{
      console.log(err)
      if(!err){
        console.log("NIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIICE")
        copia(req.session.token)
      }
      else{
        console.log("NOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO")
        erro(req.session.token)
      }
    })})
    
}

router.post("/registo", (req,res) => {
  console.log("No registo da pagina")
  var username = req.body.username
  var password = req.body.password
  var nome = req.body.nome

  axios.post("http://localhost:3000/api/users", {nome, username, password}, { withCredentials: true })
    .then(dados => {
      if(dados.data.msg == "Repetido"){
        req.flash("inforeg","Username já está a ser utilizado, por favor escolha outro")
        res.redirect("/registo")
      }
      else{
        console.log("Registo com sucesso, user criado : " + JSON.stringify(dados.data))
        res.redirect("/login")
      }
    })
    .catch(e => {
      console.log("Erro no /registo " + JSON.stringify(e) )
      res.jsonp(e)
    })
})

router.get('/atualizarFotoPerfil', passport.authenticate('jwt', {session : false, failureRedirect : "/publicas", failureFlash : "Não tem acesso a esta página, por favor autentique-se!"}), (req, res)=>{
  console.log("Entrou no get de /atualizarFotoPerfil " + req.user._id)
  
  axios({
    method: 'get', 
    url: "http://localhost:3000/api/users/FotosPerfil",
    headers: {
      Authorization: 'Bearer ' + req.session.token
    }
  })
  .then(info =>{
    res.render('alterarFotoPerfil', {fotos: info.data, userid: req.user._id})
  })
  .catch(error =>{
    console.log("ERRO AXIOS GET: " + error)
    res.status(500).send("ERRO AO PEDIR AS FOTOS DE PERFIL PARA ATUALIZAR" + error)
  })

})

router.get('/FotosPerfil', passport.authenticate('jwt', {session : false, failureRedirect : "/publicas", failureFlash : "Não tem acesso a esta página, por favor autentique-se!"}), (req, res)=>{
  console.log("Entrou no get de /FotosPerfil " + req.user._id)
  
  axios({
    method: 'get', 
    url: "http://localhost:3000/api/users/FotosPerfil",
    headers: {
      Authorization: 'Bearer ' + req.session.token
    }
  })
  .then(info =>{

    info.data.uid = req.user._id
    res.render('fotosPerfil', {fotos: info.data})
  })
  .catch(error =>{
    console.log("ERRO AXIOS GET: " + error)
    res.status(500).send("ERRO AO PEDIR AS FOTOS DE DO UTILIZADOR" + error)
  })
})

router.post('/Seguir',passport.authenticate('jwt', {session : false, failureRedirect : "/publicas", failureFlash : "Não tem acesso a esta página, por favor autentique-se!"}), (req, res)=>{
  console.log("HERE")
  console.log("CHEGUEI AO SEGUIR!!" + req.user._id + "para seguir " + req.body.userParaSeguir)
  console.log("bodyYYYYYYYYYYYY " + JSON.stringify(req.body))

  if(req.body.userParaSeguir){
    
    axios({
      method: 'post', 
      url: "http://localhost:3000/api/users/Seguir",
      data:{
        userParaSeguir: req.body.userParaSeguir
      },
      headers: {
        Authorization: 'Bearer ' + req.session.token
      }
    })
    .then(info =>{
  
      res.send({target: info.data})
    })
    .catch(error =>{
      console.log("ERRO AXIOS POST DO SEGUIR: " + error)
      res.status(500).send("ERRO AO TENTAR SEGUIR O UTILIZADOR: " + req.body.userParaSeguir + error)
    })
  }
  else{
    console("ESTAVA VAZIO")
    res.end()
  }
})

router.post('/Ignorar', passport.authenticate('jwt', {session : false, failureRedirect : "/publicas", failureFlash : "Não tem acesso a esta página, por favor autentique-se!"}), (req, res)=>{
  if(req.body.userAIgnorar){
    console.log("CHEGUEI AO SEGUIR!!" + req.user._id + "para seguir " + req.body.userAIgnorar)
    
    axios({
      method: 'post', 
      url: "http://localhost:3000/api/users/Ignorar",
      data:{
        userAIgnorar: req.body.userAIgnorar
      },
      headers: {
        Authorization: 'Bearer ' + req.session.token
      }
    })
    .then(info =>{
  
      res.send({target: info.data})
    })
    .catch(error =>{
      console.log("ERRO AXIOS POST DO IGNORAR: " + error)
      res.status(500).send("ERRO AO TENTAR IGNORAR O UTILIZADOR: " + req.body.userAIgnorar + error)
    })
  }
  else{
    console.log("ESTAVA VAZIO")
    res.end()
  }
})

router.post("/login", (req,res) => {
  console.log("No login da pagina")
  var username = req.body.username
  var password = req.body.password
  axios.post("http://localhost:3000/api/users/login", {username, password})
    .then(dados => {
      console.log("Token: "+ JSON.stringify(dados.data.token))
      // Guardar o token
      req.session.token = dados.data.token
      res.redirect("/")
    })
    .catch(e => {
      console.log("Erro no /login" + e)
      res.status(500).send()
    })
})


router.post("/registo", (req,res) => {
  console.log("No registo da pagina")
  var username = req.body.username
  var password = req.body.password
  var nome = req.body.nome

  axios.post("http://localhost:3000/api/users", {nome, username, password}, { withCredentials: true })
    .then(dados => {
      console.log("Registo com sucesso, user criado : " + JSON.stringify(dados.data))
      res.redirect("/login")
    })
    .catch(e => {
      console.log("Erro no /registo " + JSON.stringify(e) )
      res.jsonp(e)
    })
})

  // Facebook


router.get('/auth/facebook', passport.authenticate('facebook'))

router.get('/auth/facebook/callback', (req,res) => {

  axios.get('http://localhost:3000/api/auth/facebook/callback?code=' + req.query.code)
    .then(dados => {
      teste(req, dados.data.token)
      .then(copia =>{
        if(copia === dados.data.token)
          console.log("NICEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE2222222222222222222222222")
        else
          console.log("NOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO2222222222222222222222222")
        res.redirect("/")
      })
      .catch(erro => console.log("ERRO " + erro))
      // Guardar o token
      console.log(req.session.token)
    })
})


router.post('/novaFotoPerfil', passport.authenticate('jwt', {session : false, failureRedirect : "/publicas", failureFlash : "Não tem acesso a esta página, por favor autentique-se!"}), (req, res) => {
  var form = new formidable.IncomingForm()
  console.log("CHEGUEI AO /novaFotoPerfil")
  form.parse(req, (erro, fields, files)=>{
      if(!erro){

          if(Object.keys(files).length){
              
            parseFicheiros(req, files)
            .then(objFoto => {
            
              axios({
                method: 'post', 
                url: 'http://localhost:3000/api/users/novaFotoPerfil',
                data:{
                  foto: objFoto
                },
                headers: {
                  Authorization: 'Bearer ' + req.session.token
                }
                })
                .then(dados =>{
                  res.render('renderImageToDiv', {foto: dados.data.fotoPerfil.fotos[dados.data.fotoPerfil.fotos.length - 1], uid: req.user._id})
                })
                .catch(error =>{
                  console.log("ERRO AXIOS POST: " + error)
                })
            })
            .catch(erro =>{
              console.log("ERRO NO PARSE DO FICHEIRO (INDEX.JS) " + erro)
              res.status(500).send("ERRO NO PARSE DO FICHEIRO (INDEX.JS) "+ erro)
            })
          }
      }
  })
})

router.get('/Perfil', passport.authenticate('jwt', {session : false, failureRedirect : "/publicas", failureFlash : "Não tem acesso a esta página, por favor autentique-se!"}), (req, res) => {
  console.log("ENTREI NO /PERFIL " + req.user._id + req.query.idUser)

  if(req.query.idUser != undefined ){
    console.log("AXIOS DO PERFIL DE OUTRO USER")
    axios({
      method: 'get', 
      url: 'http://localhost:3000/api/users/Perfil',
      data:{
        idUser: req.query.idUser
      },
      headers: {
        Authorization: 'Bearer ' + req.session.token
      }
      })
    .then(dados =>{
      console.log("INFO PARA O PERFIL")
      console.log(dados.data)

      res.render('perfil', {perfil: dados.data})
    })
    .catch(error =>{
      console.log("ERRO AXIOS POST: " + error)
    })
  }
  else{
    console.log("AXIOS DO PERFIL DO USER")
    axios({
      method: 'get', 
      url: 'http://localhost:3000/api/users/Perfil',
      headers: {
        Authorization: 'Bearer ' + req.session.token
      }
      })
    .then(dados =>{
      console.log("INFO PARA O PERFIL")
      console.log(dados.data)
      res.render('perfil', {perfil: dados.data})
    })
    .catch(error =>{
      console.log("ERRO AXIOS POST: " + error)
    })
  }

})

router.get('/aSeguir', passport.authenticate('jwt', {session : false}), (req, res) => {
  console.log("CHEGEUI AO /ASEGUIR " + req.query.uid)

  axios({
    method: 'get', 
    url: 'http://localhost:3000/api/users/aSeguir',
    data:{
      idUser: req.query.uid
    },
    headers: {
      Authorization: 'Bearer ' + req.session.token
    }
    })
  .then(dados =>{
    res.render('renderPerfis', {users: dados.data})
  })
  .catch(error =>{
    console.log("ERRO AXIOS POST: " + error)
  })

})

router.get('/Seguidores', passport.authenticate('jwt', {session : false}), (req, res) => {
  console.log("CHEGEUI AO /SEGUIDORES " + req.query.uid)

  axios({
    method: 'get', 
    url: 'http://localhost:3000/api/users/Seguidores',
    data:{
      idUser: req.query.uid
    },
    headers: {
      Authorization: 'Bearer ' + req.session.token
    }
    })
  .then(dados =>{
    console.log("DADOS DOS SEGUIDORES")
    console.log(dados.data)
    res.render('renderPerfis', {users: dados.data})
  })
  .catch(error =>{
    console.log("ERRO AXIOS POST: " + error)
  })

})
////////////////////////////////////////////////////////////
//////////////////////FUNÇÕES///////////////////////////////
////////////////////////////////////////////////////////////

async function parseFicheiros(req, files){
    
  return new Promise((objFoto, erro) =>{

    var nome = files.file1.name
    var parts = nome.split('.')
    var extention = "." + parts[parts.length - 1]
    console.log("HERE")
    
    
    var pasta = path.resolve(__dirname + '/../uploaded/' + req.user.username +'/fotos/')
    
    salt = randomstring.generate(64)
    console.log("HERE")

    var foto = {}
    foto.nomeGuardado = hash('sha1').update(req.user._id + nome + salt).digest('hex')
    foto.nome = nome
    
    var fnovo =  pasta + '/' + foto.nomeGuardado + extention
    var fenviado = files.file1.path
    console.log("HERE")

    if(!fs.existsSync(pasta)){
        fs.mkdirSync(pasta)
    }
    console.log("HERE")

    fs.rename(fenviado, fnovo, error => {
        if(error){
            console.log('errou no rename: ' + error) 
            erro(error)
        }
        else{
            objFoto(foto)
        }
    })
  })
}


module.exports = router;

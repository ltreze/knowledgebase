// server.js
// set up ========================
var express = require('express');
var app = express();                               // create our app w/ express
var mongoose = require('mongoose');                     // mongoose for mongodb
var jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
var morgan = require('morgan');             // log requests to the console (express4)
var bodyParser = require('body-parser');    // pull information from HTML POST (express4)
var methodOverride = require('method-override'); // simulate DELETE and PUT (express4)
// configuration =================
mongoose.connect('mongodb://localhost');
app.use(express.static(__dirname + '/public'));                 // set the static files location /public/img will be /img for users
app.use(morgan('dev'));                                         // log every request to the console
app.use(bodyParser.urlencoded({ 'extended': 'true' }));            // parse application/x-www-form-urlencoded
app.use(bodyParser.json());                                     // parse application/json
app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json
app.use(methodOverride());
app.set('superSecret', 'ilovescotchyscotch'); // secret variable

// define model =================
var Sistema = mongoose.model('Sistema', {
    nome: String
});
var ObjectId = mongoose.Schema.Types.ObjectId;
var Artigo = mongoose.model('Artigo', {
    sistema: String,
    titulo: String,
    corpo: String,
    data_criacao: Date,
    data_atualizacao: Date, id: ObjectId
});
var Parametro = mongoose.model('Parametro', {
    chave: String, valor: String
});
var ParametroSistema = mongoose.model('ParametroSistema', {
    chave: String, valor: String
});

function generateUUID() {
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
    return uuid;
};

function createToken(pUser) {
    return jwt.sign(pUser, app.get('superSecret'), { expiresIn: 86400 /* expires in 24 hours*/ });
}

// routes ======================================================================
// api -----------------------------------------------------

/*
	sistema
*/
app.post('/api/criarsistema', function (req, res) {
    Sistema.create({
        nome: req.body.nome
    }, function (err, data) {
        if (err) res.send(err);

        res.json({ sucesso: true, mensagem: "Sistema criado!", objeto: { sistema: data } });
    });
});

app.get('/api/obtersistemas', function (req, res) {
	//console.log('************* obtersistemas');
    Sistema.find(function (err, data) {
        if (err) res.send(err);
		//console.log(' - - - SISTEMAS - - - ');
		//console.log(data);
        res.json({ sucesso: true, mensagem: "Sistemas obtidos!", objeto: { sistemas: data } });
    });
});



/*
	artigo
*/
app.post('/api/gravarouatualizarartigo', function (req, res) {
    var condicao = { _id: req.body._id }, options = { multi: true };

    Artigo.findOne(condicao, '_id', function (err, doc) {
        if (err) return res.send(err);

        if (doc != null && doc._id != null) {

            Artigo.update(condicao, {
                sistema: req.body.sistema,
                titulo: req.body.titulo,
                corpo: req.body.corpo,
                data_atualizacao: new Date()
            }, function (err, numAffected) {
                if (err) console.log(err);

                res.json({ sucesso: true, mensagem: "Artigo atualizado!", objeto: { foiInsert: false, numeroRegistrosAfetados: numAffected } });
            });

        } else {

            Artigo.create({
                sistema: req.body.sistema,
                titulo: req.body.titulo,
                corpo: req.body.corpo,
                data_criacao: new Date()
            }, function (err, data) {
                if (err) res.send(err);

                console.log('Novo artigo CRIADO! Titulo: ' + req.body.titulo);
                res.json({ sucesso: true, mensagem: "Artigo criado!", objeto: { foiInsert: true, artigo: data } });
            });

        }
    })
});
app.post('/api/apagarartigo', function (req, res) {
    Artigo.remove({ _id: req.body._id }, function (err) {
        if (err) res.send(err);

        res.json({ sucesso: true, mensagem: "Artigo apagado!", objeto: {} });
    });
});
app.get('/api/obterultimosartigos', function (req, res) {
    Artigo.find(function (err, data) {
        if (err) res.send(err);

        res.json({ sucesso: true, mensagem: "Artigos obtidos!", objeto: { artigos: data } });
    }).limit(50).sort({ 'data_criacao': 'desc' });
});



/*
	parametro de sistema
*/
app.get('/api/obterParametrosDeSistema', function (req, res) {
    ParametroSistema.find(function (err, parametros) {
        if (err) res.send(err);
		
		var msg = "\r\nParametros de sistema obtidos!\r\n";
		console.log(msg);
		
		console.log(parametros);

        res.json({ sucesso: true, mensagem: msg, objeto: { parametros: parametros } });
    })
});
app.post('/api/obterParametroDeSistema', function (req, res) {
	
	console.log('req.body.chave');
	console.log(req.body.chave);

    ParametroSistema.findOne({ 'chave': req.body.chave }, 'valor', function (err, data) {
        if (err) res.send(err);
		
		console.log('data');
		console.log(data);

        res.json({ sucesso: true, mensagem: "Parametro de sistema obtido!", objeto: { valor: data.valor } });
    })
});
app.post('/api/adicionarparametrodesistema', function (req, res) {

    ParametroSistema.create({
        chave: req.body.chave,
        valor: req.body.valor
    }, function (err, data) {
        if (err) res.send(err);
		
        res.json({ sucesso: true, mensagem: "Parâmetro de sistema criado!", objeto: { parametro: data } });
    });
});



/*
	parametro
*/
app.get('/api/obterparametros', function (req, res) {
    Parametro.find(function (err, data) {
        if (err) res.send(err);

        res.json({ sucesso: true, mensagem: "Parametros obtidos!", objeto: { valor: data.valor } });
    })
});
app.post('/api/gravarouatualizarparametro', function (req, res) {
    console.log(req.body);
    console.log('Novo parametro a ser criado. Titulo: ' + req.body.chave);
    var condicao = { _id: req.body._id }, options = { multi: true };

    ParametroSistema.findOne(condicao, '_id', function (err, doc) {
        if (err) return res.send(err);

        if (doc != null && doc._id != null) {

            ParametroSistema.update(condicao, {
                chave: req.body.chave,
                valor: req.body.valor
            }, function (err, numAffected) {
                if (err) console.log(err);
                console.log('-----------ATUALIZACAO DE PARAMETRO de SISTEMA----------');
                console.log('parametro de sistema atualizado! Titulo: ' + req.body.chave);
                res.json({ sucesso: true, mensagem: "Parametro de sistema atualizado!", objeto: { foiInsert: false, numeroRegistrosAfetados: numAffected } });
            });

        } else {

            Parametro.create({
                chave: req.body.chave,
                valor: req.body.valor
            }, function (err, data) {
                if (err) res.send(err);
                console.log('-----------CRIACAO DE PARAMETRO----------');
                console.log('Novo parametro CRIADO! Titulo: ' + req.body.chave);
                res.json({ sucesso: true, mensagem: "Parametro criado!", objeto: { foiInsert: true, artigo: data } });
            });

        }
    })
});





// application -------------------------------------------------------------
app.get('/admin', function (req, res) {
    res.sendFile(__dirname + '/public/admin.html');
});
app.get('*', function (req, res) {
    res.sendFile(__dirname + '/public/index.html'); // load the single view file (angular will handle the page changes on the front-end)
});






// listen (start app with node server.js) ======================================
app.listen(8080);
console.log("Base de Conhecimento escutando na porta 8080");
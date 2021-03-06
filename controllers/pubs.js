var Pub = require('../models/pubs')
var mongoose = require('mongoose')

var pop_config = {
	path: 'utilizador',
	select:'nome username fotoPerfil.idAtual'
}

var pop_config2 = {
	path: 'comentarios.utilizador',
	select: 'nome username fotoPerfil.idAtual'
}

//Lista de publicações
module.exports.listar = () => {
    return Pub
            .find()
			.populate(pop_config)
			.populate(pop_config2)
			.sort({data : -1})
            .exec()
}

// Devolve a informacao de uma publicação
module.exports.consultar = pid => {
    return Pub
            .findOne({_id: pid})
			.populate(pop_config)
			.populate(pop_config2)
			.exec()
}




module.exports.listarPorUserPrivacidade = (uid, priv) => {
	return Pub
			.find({utilizador: uid, privacidade: priv})
			.populate(pop_config)
			.populate(pop_config2)
			.sort({data:-1})
			.exec()
}

module.exports.listarPorPrivacidade = (priv) => {
	return Pub
			.find({privacidade: priv})
			.populate(pop_config)
			.populate(pop_config2)
			.sort({data:-1})
			.exec()
}

module.exports.listarPubsCompleta = (uid, aSeguir) => {
	var id = mongoose.Types.ObjectId(uid)
	console.log("ISTO É O ARRAY DE ASEGUIR: " + aSeguir)
	return Pub
			.find({$or: [
						{$and:[
							{utilizador:{$in: aSeguir}},
							{privacidade: 'seguidores'}
						]},
						{privacidade: 'publica'},
						{utilizador: id}
					]})
			.populate(pop_config)
			.populate(pop_config2)
			.sort({data:-1})
			.exec()

}

module.exports.listarPubsPerfilSeguidores = uid => {
	var id = mongoose.Types.ObjectId(uid)
	return Pub
			.find({$or: [
						{$and:[
							{utilizador: id},
							{privacidade: 'seguidores'}
						]},
						{$and: [
							{utilizador: id},
							{privacidade: 'publica'}
						]},
					]})
			.populate(pop_config)
			.populate(pop_config2)
			.sort({data:-1})
			.exec()

}


module.exports.listarPorUser = (id) => {
	return Pub
			.find({utilizador: id})
			.populate(pop_config)
			.populate(pop_config2)
			.sort({data:-1})
			.exec()
}

module.exports.listarPorHashtag = (hashtag, id, aSeguir)  => {
	return Pub
			.find({$or: [
					{$and:[
						{utilizador:{$in: aSeguir}},
						{privacidade: 'seguidores'},
						{hashtags : {$all : [hashtag]}}
					]},
					{$and:[
						{privacidade: 'publica'},
						{hashtags : {$all : [hashtag]}}
					]},
					{$and:[
						{utilizador: id},
						{hashtags : {$all : [hashtag]}}
					]}
			]})
			.populate(pop_config)
			.populate(pop_config2)
			.sort({data:-1})
			.exec()
}

module.exports.listarTipo = tipo => {
	return Pub
			.find({tipo: tipo})
			.populate(pop_config)
			.populate(pop_config2)
			.sort({data:-1})
			.exec()
}

module.exports.listarPorData = (data, id, aSeguir) => {
	return Pub
			// .find({data: {$gte: data}})
			.find({$or: [
				{$and:[
					{utilizador:{$in: aSeguir}},
					{privacidade: 'seguidores'},
					{data: {$gte: data}}
				]},
				{$and :[
					{privacidade: 'publica'},
					{data: {$gte: data}}
				]},
				{$and : [
					{utilizador: id},
					{data: {$gte: data}}
				]}
			]})
			.populate(pop_config)
			.populate(pop_config2)
			.sort({data:-1})
			.exec()
}

module.exports.inserir = publicacao => {
	return Pub
			.create(publicacao)
}

module.exports.remover = pid => {
    return Pub
			.deleteOne({_id: pid})
			.exec()
}

module.exports.inserirComentario = (pub_id, comentario) => {
	console.log("Pub : " + pub_id)
    console.log("Comentario : " + comentario)
	return Pub
			.findOneAndUpdate(
				{_id : pub_id}, 
				{"$push": { comentarios: comentario } },
				{"fields": { "comentarios":1}, new : true})
			.populate(pop_config2)			
}

module.exports.alteraPrivacidade = (pub_id, priv) => {

	return Pub
			.findOneAndUpdate(
				{_id : pub_id}, 
				{privacidade: priv},
				{new : true})
			.exec()
}

module.exports.contaPubGostos = (pub_id) => {
	var pID = mongoose.Types.ObjectId(pub_id)
    console.log("Pub : " + pID)
	return Pub
		.aggregate([
			{ $match: {_id: pID}},
			{ $project: {gostos: {$size: '$gostos'}}}])
		.exec()
}

module.exports.contaComentGostos = (coment_id) => {
	var cID = mongoose.Types.ObjectId(coment_id)
    console.log("Coment : " + cID)
	return Pub
		.aggregate([
			{ $match: {"comentarios._id": cID}},
			{ $unwind: '$comentarios'},
			{ $match: {"comentarios._id": cID}},
			{ $project: {gostos: {$size: '$comentarios.gostos'}}}])
			.exec()
}

module.exports.consultarUserPubGosto = (pub_id, user_id) => {
	var pID = mongoose.Types.ObjectId(pub_id)
	var uID = mongoose.Types.ObjectId(user_id)
	console.log("Pub : " + pID)
    console.log("User : " + uID)
    return Pub
		.aggregate([
			{ $match: {_id: pID}},
			{ $match: {"gostos": { "$in" : [uID]}}}])
		.exec()
}

module.exports.consultarUserComentGosto = (coment_id, user_id) => {
	var cID = mongoose.Types.ObjectId(coment_id)
	var uID = mongoose.Types.ObjectId(user_id)
	console.log("Coment : " + cID)
	console.log("User : " + uID)
	return Pub
		.aggregate([
			{ $match: {"comentarios._id": cID}},
			{ $unwind: '$comentarios'},
			{ $match: {"comentarios._id": cID}},
			{ $match: {"comentarios.gostos": { "$in" : [uID]}}}])
		.exec()
}

module.exports.pubIncGostos = (pub_id, user_id) => {
	console.log("Pub : " + pub_id)
    console.log("User : " + user_id)
    return Pub.findOneAndUpdate(
		{_id : pub_id}, 
        {"$push": { gostos: user_id } }, 
        {new : true})
}

module.exports.pubDecGostos = (pub_id, user_id) => {
	console.log("Pub : " + pub_id)
    console.log("User : " + user_id)
	return Pub
		.findOneAndUpdate(
			{_id : pub_id}, 
			{"$pull": { gostos: { $in: [user_id] } } },
			{new: true})
}

module.exports.comentIncGostos = (coment_id, user_id) => {
	console.log("No controller comentInc : " + coment_id)
	return Pub
		.findOneAndUpdate(
			{"comentarios._id": coment_id}, 
			{"$push": { "comentarios.$.gostos": user_id } }, 
			{new : true})
}

module.exports.comentDecGostos = (coment_id, user_id) => {
	console.log("No controller comentDec : " + coment_id)
    return Pub.findOneAndUpdate(
		{"comentarios._id": coment_id}, 
		{"$pull": { "comentarios.$.gostos": { $in: [user_id] } }},
		{new: true})
}

module.exports.consultarFicheiro = (idPub, idFich) => {
	var pub = mongoose.Types.ObjectId(idPub)
	var fich = mongoose.Types.ObjectId(idFich)
	return Pub
		.aggregate([{$match: {_id: pub}}, 
		{$unwind: "$elems"}, 
		{$match: {'elems.tipo': "ficheiros"}}, 
		{$unwind: "$elems.ficheiros.ficheiros"}, 
		{$match: {"elems.ficheiros.ficheiros._id": fich}}, 
		{$project:{"elems.ficheiros.ficheiros": 1}}])
		.exec()
}
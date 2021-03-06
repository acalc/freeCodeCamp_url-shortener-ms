const APP_URL = "https://furly.herokuapp.com/"
const CHAR_SET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_"
const KEY_LEN = 6
const MAX_INSERTION_ATTEMPTS = 10

var MongoDb = require("mongodb")
var DbUri = require("./private.js").getDbUri()


// NOTE: from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
function GetRandomInt(min, max) {
	min = Math.ceil(min)
	max = Math.floor(max)
	return Math.floor(Math.random() * (max - min + 1)) + min
}

function GenerateKey(charset, keylen) {
	var radix = charset.length
	var key = ""
	for (var i = 0; i < keylen; i++) {
		key += charset[GetRandomInt(0, radix-1)]
	}
	return key
}

exports.shortenUrl = function(url, res) {
	MongoDb.MongoClient.connect(DbUri, function(err, db) {
		if (err) {
			res.json({error: "error connecting to the database at this time"})
			return
		}

		var urls = db.collection("urls")
		var attempt = 1
		var key = null
		var insertFn = function() {
			key = GenerateKey(CHAR_SET, KEY_LEN)
			urls.insertOne({ _id: key, url: url}, function(err, r) {
				if (err && attempt < MAX_INSERTION_ATTEMPTS) {
					attempt++
					insertFn()
				} else {
					var json
					if (err) {
						json = {error: "could not create a new entry in the database"}
					} else {
						json = {originalUrl: url, shortUrl: APP_URL + key}
					}
					db.close()
					res.json(json)
				}
			})
		}
		insertFn()
	})
}

exports.gotoUrl = function(key, res) {
	MongoDb.MongoClient.connect(DbUri, function(err, db) {
		if (err) {
			res.json({error: "error connecting to the database at this time"})
			return
		}

		var urls = db.collection("urls")
		urls.findOne({_id: key}, function(err, doc) {
			if (doc && doc.url) {
				console.log("doc url", doc.url)
				var url = doc.url
				if (url.match(/^https?:\/\//) === null) {
					url = "http://"+url;
				}
				res.redirect(301, url)
			} else if (err) {
				res.json({error: "An unspecified error that may be unrelated to the validity of the key occurred", key: key})
			} else {
				res.json({error: "No URL mapped to provided key", key: key})
			}
			db.close()
		})
	})
}

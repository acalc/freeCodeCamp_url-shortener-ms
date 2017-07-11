const APP_URL = "https://furly.herokuapp.com/"

const express = require("express")
const app = express()

app.set("port", (process.env.PORT || 8080))

app.get("/", function(req, res) {
	delete require.cache[require.resolve("./script.js")]
	res.send(`
<!DOCTYPE html>
<html>
 <head><title>furly</title></head>
 <body style="font-size: 1.25rem;">
  <p><b>Shorten URL:</b> <pre>${APP_URL}shorten/your-url-here</pre></p>
  <p><b>Goto URL:</b> <pre>${APP_URL}shortened-url-key</pre></p>
 </body>
</html>
`)
})

// NOTE: url regexp from here: https://stackoverflow.com/questions/3809401/what-is-a-good-regular-expression-to-match-a-url/3809435#3809435
// NOTE: adding workaround to '*' character, which is an issue in Express, 
// referenced here: https://github.com/expressjs/express/issues/2495
// NOTE: instead of naming a parameter the usual way by prepending a colon,
// this is like a pure regexp way of getting params, but enclosing the
// relevant portion within parens. it is captured & written to req.params
app.get(/^\/shorten\/([-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,8}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]{0,})?)/, function(req, res) {
	delete require.cache[require.resolve("./script.js")]
	require("./script.js").shortenUrl(req.params[0], res)
})

app.get("/:key", function(req, res) {
	if (req.params.key === "favicon.ico") {
		return
	}

	delete require.cache[require.resolve("./script.js")]
	require("./script.js").gotoUrl(req.params.key, res)
})

app.listen(app.get("port"), function () {
	console.log("app started; listening on port", app.get("port"))
})

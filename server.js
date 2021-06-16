var app = require("./index");

//require("greenlock-express")
require("greenlock-express")
	.init({
		packageRoot: __dirname,
		configDir: "./greenlock.d",

		maintainerEmail: "ankjat066@gmail.com",

		cluster: false
	})

	// Serves on 80 and 443
	// Get's SSL certificates magically!
	.serve(app)
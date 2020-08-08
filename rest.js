var padsCreatedCache = [];
var express = require("express");
var router = express.Router();
var bodyParser = require("body-parser");
var padService = require("./pad_cache");
var jsonParser = bodyParser.json();

var node_rest_client = require("node-rest-client").Client;
var rest_client = new node_rest_client();

EXECUTOR_SERVER_URL = "https://devpad-executor.azurewebsites.net/build_and_run";
// EXECUTOR_SERVER_URL = "https://docker-executor.herokuapp.com/build_and_run";
rest_client.registerMethod("build_and_run", EXECUTOR_SERVER_URL, "POST");

router.post("/build_and_run", jsonParser, function (req, res) {
  const userCode = req.body.user_code;
  const lang = req.body.lang;

  console.log(lang + "; " + userCode);
  rest_client.methods.build_and_run(
    {
      data: { code: userCode, lang: lang },
      headers: { "Content-Type": "application/json" },
    },
    (data, response) => {
      console.log("Received response from execution server: " + response);
      const text = `Build output: ${data["build"]}
    Execute output: ${data["run"]}`;

      data["text"] = text;
      res.json(data);
    }
  );
});

router.post("/save_and_fetch_pads", jsonParser, function (req, res) {
  const pad = req.body.pad;
  if (!padsCreatedCache.includes(pad) && pad != null) {
    padsCreatedCache.push(pad);
  }
  res.json(padsCreatedCache);
});

router.get("/pad_status", function (req, res) {
  res.json(padService.get_pad_status());
});

router.post("/authenticate", jsonParser, function (req, res) {
  var userExists = false;
  const password = req.body.password;
  if (password == "Albatross@2020") {
    userExists = true;
    res.json({
      id: 2,
      username: "admin",
      firstName: "Arif",
      lastName: "Malik",
      token: "17291430",
      userFlag: userExists,
    });
  } else {
    res.status(400).send("Incorrect username or password");
  }
});

module.exports = router;

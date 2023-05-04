require("dotenv").config();
const express = require("express");
const request = require("request");
const bodyParser = require("body-parser");
const https = require("https");
const app = express();

const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const account_id = process.env.ACCOUNT_ID;

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
const redirect_uri = "http://localhost:3000/callback";

app.get("/", function (req, res) {
  res.render("index");
});

app.get("/login", (req, res) => {
  const uri = `https://account-d.docusign.com/oauth/auth?
   response_type=code
   &scope=signature
   &client_id=${client_id}
   &redirect_uri=${redirect_uri}`;
  res.redirect(uri);
});

app.get("/post", (req, res) => {
  console.log("Connected to react");
  res.json({ message: "Hello from the backend!" });
});

let access_token = ``;

app.get("/callback", function (req, res) {
  res.render("callback");
  const code = req.query.code;
  const token_uri = "https://account-d.docusign.com/oauth/token";
  console.log(code);
  const headers = {
    Authorization: `Basic ${Buffer.from(
      `${client_id}:${client_secret}`
    ).toString("base64")}`,
    "Content-Type": "application/x-www-form-urlencoded",
  };

  const data = {
    code: code,
    grant_type: "authorization_code",
    redirect_uri: redirect_uri,
  };
  request.post(
    { url: token_uri, headers: headers, form: data },
    (err, response, body) => {
      access_token = JSON.parse(body).access_token;
      //Get Template Details
      const template_id = `5b780aa4-7833-47ff-9b86-7dda1edda72e`;
      const template_uri = `https://demo.docusign.net/restapi/v2.1/accounts/${account_id}/templates/${template_id}`;

      request.get(
        {
          url: template_uri,
          headers: { Authorization: `Bearer ${access_token}` },
        },
        (err, response, body) => {
          const get_template = JSON.parse(body);
          console.log(JSON.stringify(get_template));
        }
      );
    }
  );
});

app.post("/callback", (req, res) => {
  const email = req.body.email;
  const name = req.body.nameR;
  const role = req.body.role;

  const emailSubject = req.body.emailSubject;

  console.log(email, name, role);
  const template_id = `5b780aa4-7833-47ff-9b86-7dda1edda72e`;
  const envelope_uri = `https://demo.docusign.net/restapi/v2.1/accounts/${account_id}/envelopes`;
  const envelope_data = {
    templateId: template_id,
    emailSubject: emailSubject,
    templateRoles: [
      {
        email: email,
        name: name,
        roleName: role,
      },
    ],
    status: "sent",
  };
  request.post(
    {
      url: envelope_uri,
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
      json: envelope_data,
    },
    (err, response, body) => {
      console.log(`Envelope sent. ` + body.envelopeID);
      res.render("sucess");
    }
  );
});

app.get("/calls", function (req, res) {
  const api = `https://account-d.docusign.com/oauth/userinfo`;
  console.log(access_token);
  const options = {
    hostname: api,
    method: "GET",
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  };
  https.request(options, (res) => {
    console.log(res.statusCode);
  });
  res.send("Hello");
});

app.listen(3000, () => {
  console.log("Server started on 3000");
});

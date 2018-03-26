const restify = require("restify");
const corsMw = require("restify-cors-middleware");

// Create the server
const server = restify.createServer({
  name: "carl-persistence-server"
});

// Mock DB Setup
let NEXT_ID = 0;
const getNextId = () => `${++NEXT_ID}`;
const db = {
  champions: [
    {
      id: getNextId(),
      name: "Alistar",
      roles: ["Support", "Fighter"]
    }
  ]
};

const cors = corsMw({})
server.pre(cors.preflight)
server.use(cors.actual)
server.use(restify.plugins.bodyParser());
server.use(restify.plugins.queryParser());

// Example with query params
server.get("/champion", (req, res, next) => {
  let champs = [];
  if (req.query.name) {
    champs = db.champions.filter(el => el.name.match(req.query.name));
  } else {
    // TODO: deep copy
    champs = db.champions.map(el => Object.assign({}, el));
  }
  // TODO: not going to worry about error handling for this tutorial.
  res.send(200, champs);
  next();
});

// Standard rest verbs
server.post("/champion", (req, res, next) => {
  let id
  if (req.body) {
    id = getNextId();
    db.champions.push({
      id: id,
      name: req.body.name,
      roles: req.body.roles
    });
  }
  res.send(200, db.champions[db.champions.length - 1]);
  next();
});
// Example with route params
server.get("/champion/:id", (req, res, next) => {
  let champ = {};
  if (req.params && req.params.id) {
    let index = db.champions.findIndex(el => el.id === req.params.id);
    if (index !== -1) {
      champ = db.champions[index];
    }
  }
  res.send(200, champ);
  next();
});
server.put("/champion/:id", (req, res, next) => {
  if (req.params && req.params.id && req.body) {
    let index = db.champions.findIndex(el => el.id === req.params.id);
    if (index !== -1) {
      db.champions.splice(index, 1, {
        name: req.body.name,
        roles: req.body.roles
      });
    }
  }
  res.send(200);
  next();
});
server.del("/champion/:id", (req, res, next) => {
  if (req.params && req.params.id) {
    let index = db.champions.findIndex(el => el.id === req.params.id);
    if (index !== -1) {
      db.champions.splice(index, 1);
    }
  }
  res.send(200);
  next();
});

server.on("error", function(err) {
  console.error("Server error: ", err);
});

// Serve the swagger-ui pages.
server.get(/\/doc\/.*/, restify.plugins.serveStatic({
  directory: './api',
  default: 'index.html',
}))
// Helper to reroute people who don't type exaclty the write URL.
server.get(/(^\/$|^\/doc$)/, (req, res, next) => {
  res.redirect('/doc/', next)
})
// Serves just the Swagger spec for various consumption, like
// the Swagger-UI, and the online Swagger-Editor.
server.get(/^\/swagger$/, restify.plugins.serveStatic({
  directory: './api',
  file: 'swagger/swagger.yaml',
}))

const port = 9005;
server.listen(port, function() {
  console.log(`App listening at http://localhost:${port}`);
});

const express = require('express');
const app = express();

app.set("views", "./src/views");
app.set("view engine", "ejs"); 

app.use(express.static('public'));

const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true}));

const route = require('./src/route/route.js')
app.use("/", route);

const PORT = 3000;

app.listen(PORT, () => {
    console.log("서버 가동");
});
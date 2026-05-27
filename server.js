const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

const menus = require("./routes/menus");
const nutrition = require("./routes/nutrition");
const stores = require("./routes/stores");

app.use('/api/menus', menus);
app.use('/api/nutritions', nutrition);
app.use('/api/stores', stores);

app.get(['/', '/map'],(req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'map.html'));
});

app.get('/menu', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'menu.html'));
})

app.get('/store',(req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'store.html'));
});

app.use(express.static('public'));

app.listen(port);

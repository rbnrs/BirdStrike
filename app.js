const express = require('express');
const app = express();
const path = require('path');
const port = 3000;


app.use('/static', express.static(path.join(__dirname, '/static')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

var server = app.listen(port, function() {
    var host = server.address().address;
    var port = server.address().port;
    console.log("Birdstrike Webapp listening at http://%s:%s", host, port)
});
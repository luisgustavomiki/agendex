const express = require('express');
const bodyParser = require('body-parser');

module.exports = class {
  constructor (port) {
    this.port = port;
    this.app = express();
    this.app.use(bodyParser.urlencoded({ extended: false }))
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.text());
    this.app.get('/', (request, response) => {
      response.send('This is agendex by Luis Gustavo Miki :)');
    });

    this.app.listen(this.port, (err) => {
      if (err) {
        return console.log('something bad happened', err);
      }

      console.log(`server is listening on ${port}`);
    });
  }

  handle (path, callback) {
    this.app.use(path, callback);
  }
}

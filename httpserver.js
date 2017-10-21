const express = require('express');

module.exports = class {
  constructor (port) {
    this.port = port;
    this.app = express();
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

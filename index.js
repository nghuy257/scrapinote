const express = require('express');
const ews = require('express-ws');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const count_req_path = `${__dirname}/count_req.json`;
let count_req_data = {};

const count_req_save = () => fs.writeFileSync(count_req_path, JSON.stringify(count_req_data), 'utf8');
const api = [];

if (!fs.existsSync(count_req_path)) count_req_save();
else count_req_data = require(count_req_path);

ews(app);
app.set('json spaces', 4);
app.use(cors());
app.use(express.json());


fs.readdirSync('./api').forEach(file => {
  try {
    let file_import = require(`./api/${file}`);
    if (!count_req_data[file_import.info.path]) count_req_data[file_import.info.path] = 0;
    if (!/^\/$/.test(file_import.info.path)) api.push(file_import.info);

    Object.keys(file_import.methods).forEach(method => {
      app[method](file_import.info.path, (req, res, next) => {
        ++count_req_data[file_import.info.path];
        file_import.methods[method](req, res, next);
        count_req_save();
      });
    });
  } catch (e) {
    console.log('Load fail: ' + file);
    console.log(e);
  }
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, "index.html")))

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});

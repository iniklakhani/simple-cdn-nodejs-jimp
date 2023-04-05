require('dotenv').config();

const fs = require('fs');
const path = require('path');
const url = require('url');
const Jimp = require('jimp');
const express = require('express');

const app = express();

const cors = require('cors');
const corsOptions = {
  origin:
    process.env.APP_ORIGIN && process.env.APP_ORIGIN != '*'
      ? process.env.APP_ORIGIN.split(',')
      : '*',
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

app.use(function (err, req, res, next) {
  filePath = path.join(__dirname, process.env.DEFAULT_IMAGE);
  res.sendFile(filePath);
});

app.get('*', async function (req, res) {
  res.removeHeader('Transfer-Encoding');
  res.removeHeader('X-Powered-By');

  const query = url.parse(req.url, true).query;
  let file = url.parse(req.url).pathname;
  let filePath = path.join(__dirname, `assets/images/${file}`);

  // Check if file exist or not.
  if (!fs.existsSync(filePath)) {
    file = process.env.DEFAULT_IMAGE;
    filePath = path.join(__dirname, `assets/images/${file}`);
  }

  const height = parseInt(query.h) || 0; // Get height from query string
  const width = parseInt(query.w) || 0; // Get width from query string
  const quality = parseInt(query.q) < 100 ? parseInt(query.q) : 99; // Get quality from query string

  const folder = `q${quality}_h${height}_w${width}`;
  const out_file = `assets/thumbnails/${folder}${file}`;

  // Check if image is already generated
  if (fs.existsSync(path.resolve(out_file))) {
    res.sendFile(path.resolve(out_file));
    return;
  }

  // If no height or no width display original image
  if (!height || !width) {
    res.sendFile(path.resolve(`assets/images/${file}`));
    return;
  }

  // If image is not generated, Use jimp to resize & generate new image
  Jimp.read(path.resolve(`assets/images/${file}`))
    .then((lenna) => {
      lenna.cover(width, height, Jimp.HORIZONTAL_ALIGN_CENTER);
      lenna.quality(quality); // set JPEG quality

      lenna.write(path.resolve(out_file), () => {
        fs.createReadStream(path.resolve(out_file)).pipe(res);

        // display image
        res.sendFile(path.resolve(out_file));
      });
    })
    .catch((err) => {
      // If error display original image
      res.sendFile(path.resolve(`assets/images/${file}`));
    });
});

app.listen(process.env.PORT);

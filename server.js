const express = require('express');
const mongoose = require('mongoose');
const app = express();
const querystring = require('querystring');
require('dotenv').config()

// Custom shortened URL model
const ShortUrl = require('./models/shortUrl');

// Server Port and Mongo Database URL
const PORT = process.env.PORT
const DB_URL = process.env.MONGO_DB_URL

// Open connection to the MongoDB
mongoose.connect(DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Set ViewEngine and Querystring library
app.set('view engine', 'ejs');
app.use(express.urlencoded({extended: false}));

// Make asset files available
app.use(express.static(__dirname + '/public/assets'));

// Index page
app.get('/', async (request, response) => {
    const shortUrls = await ShortUrl.find();
    response.render('index', { shortUrls: shortUrls, shortenedUrl: request.query.shortenedUrl});
});

// URL Shortening process
app.post('/shorten', async (request, response) => {
    const fullUrl = (request.query.fullUrl == null ? request.body.fullUrl : request.query.fullUrl);
    var shortenedUrl = await ShortUrl.findOne({ full: fullUrl });

    if (shortenedUrl == null)
        await ShortUrl.create({ full: fullUrl });
        shortenedUrl = await ShortUrl.findOne({ full: fullUrl });
    
    const query = querystring.stringify({
        "shortenedUrl": shortenedUrl.short
    });

    if (request.accepts('html'))
        response.redirect('/?' + query);
    else
        response.json({ "shortenedURL" : shortenedUrl.short });
});

// Redirection engine
app.get('/:shortUrl', async (request, response) => {
    const shortUrl = await ShortUrl.findOne({ short: request.params.shortUrl });

    if (shortUrl == null)
        return response.sendStatus(404);

    shortUrl.clicks++;
    shortUrl.save();

    response.redirect(shortUrl.full)
});

// Start listening
var server = app.listen(PORT, function () {
    console.log("URL Shortener server listening at: " + PORT)
});
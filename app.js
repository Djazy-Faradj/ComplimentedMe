import * as tf from '@tensorflow/tfjs';
import * as toxicity from '@tensorflow-models/toxicity';

const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 5000;

app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

let enabled = true;

// Render the pages' contents with the templates replaced inside
function formatPage(pagePath, req) {
    let textarea = (enabled ? fs.readFileSync(path.join(__dirname, 'views', 'templates', 'enabled_text_area.html'), 'utf-8') : fs.readFileSync(path.join(__dirname, 'views', 'templates', 'disabled_text_area.html'), 'utf-8'));
    let content = fs.readFileSync(pagePath, 'utf-8');

    content = content.replace('<!--TEXTAREA-->', textarea);
    return content;
}

app.get("/", (req, res) => {
    // Check if a compliment cookie already matches today's date
    if (req.cookies.compliments) {
        const compliments = JSON.parse(req.cookies.compliments);
        compliments.forEach(v => {
            if (v.timestamp == new Date().toLocaleDateString()) {
                // Trigger false - Come back tomorrow!
                enabled = false;
            } else enabled = true;
        });
    } else enabled = true;

    res.send(formatPage(path.join(__dirname, 'views', 'home.html'), req));
});

app.post("/submit", (req, res) => {
    // Process the compliment into a cookie
    const now = new Date();
    const oneYearLater = new Date();
    oneYearLater.setFullYear(now.getFullYear() + 1);

    const compliment = req.body.compliment;
    const timestamp = now.toLocaleDateString();

    // Create new object of compliment
    const complimentCookie = {'compliment': compliment, 'timestamp': timestamp};
     // Get existing cookie value
    const existing = req.cookies.compliments;

    let list = [];
    if (existing) {
        try {
        list = JSON.parse(decodeURIComponent(existing));
        } catch {
        list = [];
        }
    }

    // Add new compliment with timestamp
    list.push(complimentCookie);

    // Update client cookie with newly updated array
    res.cookie('compliments', JSON.stringify(list), {
        expires: oneYearLater,
        httpOnly: false,
        secure: true,
    });
    enabled = false;
    res.redirect('/')
});

app.get('/deleteCookies', (req, res) => {
    res.clearCookie('compliments', {path: '/'});
    res.redirect('/');
});

app.listen(PORT, err => {
    if (err) {
        console.log("Error trying to listen on given port");
        exit(-1);
    }
    console.log(`Listening on port ${PORT}...`);
});


// Local Sentiment Model 
const threshold = 0.9;
toxicity.load(threshold).then(model => {
  model.classify(['you suck']).then(predictions => {
    console.log(predictions);
  });
});
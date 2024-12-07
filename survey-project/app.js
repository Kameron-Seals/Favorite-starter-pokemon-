const express = require('express');
const { Storage } = require('@google-cloud/storage');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 8080;

// Initialize Google Cloud Storage
const storage = new Storage();
const bucket = storage.bucket('my-project-1-443823.appspot.com');  // Replace with your bucket name
const DATA_FILE = 'data.json';

// Middleware
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Serve sprites folder as static
app.use('/sprites', express.static(path.join(__dirname, 'sprites')));

// Set the view engine
app.set('view engine', 'ejs');

// Routes
app.get('/', (req, res) => {
    res.render('index');
});

app.post('/results', async (req, res) => {
    const { favorite, leastFavorite } = req.body;

    if (!favorite || !leastFavorite) {
        return res.status(400).send('Both fields are required!');
    }

    try {
        // Read the existing data from Google Cloud Storage
        const file = bucket.file(DATA_FILE);
        const [fileExists] = await file.exists();

        let data = [];
        if (fileExists) {
            const [content] = await file.download();
            data = JSON.parse(content.toString());
        }

        // Add new entry
        data.push({ favorite, leastFavorite });

        // Save back to Cloud Storage
        await file.save(JSON.stringify(data, null, 2));

        res.redirect('/results');
    } catch (err) {
        console.error('Error while handling data:', err);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/results', async (req, res) => {
    try {
        // Read the data from Cloud Storage
        const file = bucket.file(DATA_FILE);
        const [fileExists] = await file.exists();

        if (!fileExists) {
            return res.render('results', { favoriteCounts: {}, leastFavoriteCounts: {} });
        }

        const [content] = await file.download();
        const data = JSON.parse(content.toString());

        // Create frequency count for favorites and least favorites
        const favoriteCounts = {};
        const leastFavoriteCounts = {};

        data.forEach(({ favorite, leastFavorite }) => {
            favoriteCounts[favorite] = (favoriteCounts[favorite] || 0) + 1;
            leastFavoriteCounts[leastFavorite] = (leastFavoriteCounts[leastFavorite] || 0) + 1;
        });

        res.render('results', { favoriteCounts, leastFavoriteCounts });
    } catch (err) {
        console.error('Error reading results:', err);
        res.status(500).send('Internal Server Error');
    }
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

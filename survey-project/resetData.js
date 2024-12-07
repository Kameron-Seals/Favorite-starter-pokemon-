const fs = require('fs');
const path = './data.json';

const defaultData = '[ { "favorite": "", "leastFavorite": "" } ]';

fs.writeFile(path, defaultData, (err) => {
  if (err) {
    console.error('Error resetting data.json:', err);
  } else {
    console.log('data.json has been reset!');
  }
});

const { port } = require('./config');
const { app } = require('./app');

app.listen(port, () => {
    console.log(`Translation server running at http://localhost:${port}`);
});

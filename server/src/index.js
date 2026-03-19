const { port } = require('./config');
const { app } = require('./app');

app.listen(port, () => {
    console.log(`PDF translation server running at http://localhost:${port}`);
});

import app from './app.js'
import cfg from './config/env.js'


app.listen(cfg.PORT, () => {
    console.log(`App listening on port ${cfg.PORT}`);
});
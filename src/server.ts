import app from './app.js'
import cfg from './config/env.js'


app.listen(cfg.PORT, () => {
    console.log(`Example app listening on port ${cfg.PORT}`);
});
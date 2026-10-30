import { createApp } from './app.js';
import { config } from './config.js';
import { migrate } from './migrate.js';

migrate().then(() => {
  createApp().listen(config.port, () => {
    console.log(`aadat-api listening on :${config.port}`);
  });
});

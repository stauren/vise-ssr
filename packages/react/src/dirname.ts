import { dirname } from 'path';
import { fileURLToPath } from 'url';

const DIR_NAME = dirname(fileURLToPath(import.meta.url));
export default DIR_NAME;

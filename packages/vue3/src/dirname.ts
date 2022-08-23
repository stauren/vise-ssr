import { dirname } from 'path';
import { fileURLToPath } from 'url';

export const DIR_NAME = dirname(fileURLToPath(import.meta.url));

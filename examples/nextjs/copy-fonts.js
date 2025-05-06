/**
 * This script copies the font files from the widget's dist/assets directory
 * to your Next.js public/assets directory to ensure they're available at runtime.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create the public/assets directory if it doesn't exist
const publicAssetsDir = path.resolve(__dirname, './public/assets');
if (!fs.existsSync(publicAssetsDir)) {
  fs.mkdirSync(publicAssetsDir, { recursive: true });
}

// Path to the widget's font files
const widgetAssetsDir = path.resolve(__dirname, '../../lib/node_modules/@use-glyph/sdk-react/dist/assets');

try {
  // Check if the widget's assets directory exists
  if (fs.existsSync(widgetAssetsDir)) {
    const fontFiles = fs.readdirSync(widgetAssetsDir).filter(file => file.endsWith('.woff2'));
    
    fontFiles.forEach(file => {
      const sourcePath = path.join(widgetAssetsDir, file);
      const targetPath = path.join(publicAssetsDir, file);
      
      fs.copyFileSync(sourcePath, targetPath);
      console.log(`Copied ${file} to ${targetPath}`);
    });
    
    console.log('Font copying complete!');
  } else {
    console.error(`Widget assets directory not found at: ${widgetAssetsDir}`);
    console.error('Make sure @use-glyph/sdk-react is installed correctly.');
  }
} catch (error) {
  console.error('Error copying font files:', error);
}

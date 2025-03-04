import fs from 'fs';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create textures directory if it doesn't exist
const texturesDir = path.join(__dirname, '../public/textures');
if (!fs.existsSync(texturesDir)) {
  fs.mkdirSync(texturesDir, { recursive: true });
}

// Planet texture URLs from Solar System Scope
const textures = {
  sun: {
    base: 'https://www.solarsystemscope.com/textures/2k_sun.jpg'
  },
  mercury: {
    base: 'https://www.solarsystemscope.com/textures/2k_mercury.jpg'
  },
  venus: {
    base: 'https://www.solarsystemscope.com/textures/2k_venus_atmosphere.jpg'
  },
  earth: {
    base: 'https://www.solarsystemscope.com/textures/2k_earth_daymap.jpg'
  },
  mars: {
    base: 'https://www.solarsystemscope.com/textures/2k_mars.jpg'
  },
  jupiter: {
    base: 'https://www.solarsystemscope.com/textures/2k_jupiter.jpg'
  },
  saturn: {
    base: 'https://www.solarsystemscope.com/textures/2k_saturn.jpg',
    rings: 'https://www.solarsystemscope.com/textures/2k_saturn_ring_alpha.png'
  },
  uranus: {
    base: 'https://www.solarsystemscope.com/textures/2k_uranus.jpg'
  },
  neptune: {
    base: 'https://www.solarsystemscope.com/textures/2k_neptune.jpg'
  }
};

// Moon texture URLs
const moonTextures = {
  moon: {
    base: 'https://www.solarsystemscope.com/textures/2k_moon.jpg'
  },
  phobos: {
    base: 'https://www.solarsystemscope.com/textures/2k_phobos.jpg'
  },
  deimos: {
    base: 'https://www.solarsystemscope.com/textures/2k_deimos.jpg'
  },
  io: {
    base: 'https://www.solarsystemscope.com/textures/2k_io.jpg'
  },
  europa: {
    base: 'https://www.solarsystemscope.com/textures/2k_europa.jpg'
  },
  ganymede: {
    base: 'https://www.solarsystemscope.com/textures/2k_ganymede.jpg'
  },
  callisto: {
    base: 'https://www.solarsystemscope.com/textures/2k_callisto.jpg'
  },
  titan: {
    base: 'https://www.solarsystemscope.com/textures/2k_titan.jpg'
  },
  enceladus: {
    base: 'https://www.solarsystemscope.com/textures/2k_enceladus.jpg'
  },
  mimas: {
    base: 'https://www.solarsystemscope.com/textures/2k_mimas.jpg'
  }
};

function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(fs.createWriteStream(filepath))
          .on('error', reject)
          .once('close', () => resolve(filepath));
      } else {
        response.resume();
        reject(new Error(`Request Failed With a Status Code: ${response.statusCode}`));
      }
    });
  });
}

async function downloadTextures() {
  console.log('Downloading planet textures...');
  
  // Download planet textures
  for (const [planet, urls] of Object.entries(textures)) {
    console.log(`Downloading ${planet} textures...`);
    for (const [type, url] of Object.entries(urls)) {
      const filename = type === 'rings' ? `${planet}_rings.jpg` : `${planet}_${type}.jpg`;
      const filepath = path.join(texturesDir, filename);
      try {
        await downloadFile(url, filepath);
        console.log(`Downloaded ${filename}`);
      } catch (error) {
        console.error(`Failed to download ${filename}:`, error.message);
      }
    }
  }

  console.log('Downloading moon textures...');
  
  // Download moon textures
  for (const [moon, urls] of Object.entries(moonTextures)) {
    console.log(`Downloading ${moon} textures...`);
    for (const [type, url] of Object.entries(urls)) {
      const filename = `${moon}_${type}.jpg`;
      const filepath = path.join(texturesDir, filename);
      try {
        await downloadFile(url, filepath);
        console.log(`Downloaded ${filename}`);
      } catch (error) {
        console.error(`Failed to download ${filename}:`, error.message);
      }
    }
  }

  console.log('Texture download complete!');
}

downloadTextures().catch(console.error); 
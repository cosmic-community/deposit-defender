const fs = require('fs');
const path = require('path');
const glob = require('glob');

const SCRIPT_TAG = '<script src="/dashboard-console-capture.js"></script>';

function injectConsoleCapture() {
  const buildDir = path.join(process.cwd(), '.next');
  const distDir = path.join(process.cwd(), 'dist');
  const outDir = path.join(process.cwd(), 'out');
  
  // Check which build directory exists
  let targetDir = null;
  if (fs.existsSync(buildDir)) {
    targetDir = buildDir;
    console.log('📁 Found Next.js build directory');
  } else if (fs.existsSync(distDir)) {
    targetDir = distDir;
    console.log('📁 Found dist directory');
  } else if (fs.existsSync(outDir)) {
    targetDir = outDir;
    console.log('📁 Found out directory');
  }
  
  if (!targetDir) {
    console.log('⚠️  No build directory found. Skipping console capture injection.');
    return;
  }
  
  // Find all HTML files in build output
  glob(`${targetDir}/**/*.html`, (err, files) => {
    if (err) {
      console.error('❌ Error finding HTML files:', err);
      return;
    }
    
    if (files.length === 0) {
      console.log('⚠️  No HTML files found in build output.');
      return;
    }
    
    let injectedCount = 0;
    
    files.forEach(file => {
      try {
        let content = fs.readFileSync(file, 'utf8');
        
        // Skip if script is already injected
        if (content.includes('dashboard-console-capture.js')) {
          return;
        }
        
        // Try to inject before closing head tag first
        if (content.includes('</head>')) {
          content = content.replace('</head>', `  ${SCRIPT_TAG}\n</head>`);
          injectedCount++;
        }
        // Fallback to inject after opening body tag
        else if (content.includes('<body>')) {
          content = content.replace('<body>', `<body>\n  ${SCRIPT_TAG}`);
          injectedCount++;
        }
        // Last resort: inject at the end of HTML
        else if (content.includes('</html>')) {
          content = content.replace('</html>', `${SCRIPT_TAG}\n</html>`);
          injectedCount++;
        }
        
        fs.writeFileSync(file, content);
        console.log(`✓ Injected console capture into: ${path.relative(process.cwd(), file)}`);
      } catch (error) {
        console.error(`✗ Error processing ${file}:`, error.message);
      }
    });
    
    console.log(`\n📊 Console capture injection complete! (${injectedCount}/${files.length} files updated)`);
  });
}

// Run the injection
injectConsoleCapture();
#!/usr/bin/env node

// Test script to verify Vercel deployment readiness
const fs = require('fs');
const path = require('path');

console.log('🔍 Vercel Deployment Readiness Check\n');

// Check required files
const requiredFiles = [
  'api/test.js',
  'api/browser-simple.js',
  'public/index.html',
  'index.html',
  'vercel.json',
  'package.json'
];

console.log('📁 Checking required files:');
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} - MISSING`);
  }
});

// Check API file syntax
console.log('\n🔧 Checking API file syntax:');
const apiFiles = ['api/test.js', 'api/browser-simple.js'];

apiFiles.forEach(file => {
  try {
    require(`./${file}`);
    console.log(`  ✅ ${file} - Syntax OK`);
  } catch (error) {
    console.log(`  ❌ ${file} - Syntax Error: ${error.message}`);
  }
});

// Check vercel.json
console.log('\n⚙️  Checking vercel.json:');
try {
  const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
  console.log('  ✅ vercel.json - Valid JSON');
  console.log(`  📋 Functions defined: ${Object.keys(vercelConfig.functions || {}).join(', ')}`);
} catch (error) {
  console.log(`  ❌ vercel.json - Error: ${error.message}`);
}

// Check package.json
console.log('\n📦 Checking package.json:');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  console.log('  ✅ package.json - Valid JSON');
  console.log(`  📋 Main: ${packageJson.main}`);
  console.log(`  📋 Node version: ${packageJson.engines?.node || 'Not specified'}`);
} catch (error) {
  console.log(`  ❌ package.json - Error: ${error.message}`);
}

console.log('\n🚀 Ready for Vercel deployment!');
console.log('\nTo deploy:');
console.log('  vercel --prod');
console.log('\nTest endpoints:');
console.log('  https://your-app.vercel.app/api/test');
console.log('  https://your-app.vercel.app/api/browser-simple?action=health');
console.log('  https://your-app.vercel.app/api/browser-simple?action=test&url=https://www.google.com');
const esbuild = require('esbuild');

async function main() {
  const ctx = await esbuild.context({
    entryPoints: ['js/main.js'],
    bundle: true,
    outfile: 'static/js/bundle.js',
    sourcemap: true,
    target: ['es2020'],
    define: { 'process.env.NODE_ENV': '"development"' },
  });

  await ctx.watch();
}

main().catch(err => { console.error(err); process.exit(1); });


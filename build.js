const esbuild = require('esbuild');

const isWatch = process.argv.includes('--watch');
const isProd = process.env.NODE_ENV === 'production';

async function main() {
  const options = {
    entryPoints: ['js/main.js'],
    bundle: true,
    outfile: 'static/js/bundle.js',
    sourcemap: !isProd,
    minify: isProd,
    target: ['es2020'],
    define: {
      'process.env.NODE_ENV': JSON.stringify(isProd ? 'production' : 'development'),
    },
  };

  console.log("isProd: ", isProd)

  if (isWatch) {
    const ctx = await esbuild.context(options);
    await ctx.watch();
    console.log('ESBuild watching for changes...');
  } else {
    await esbuild.build(options);
    console.log('JS build complete!');
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

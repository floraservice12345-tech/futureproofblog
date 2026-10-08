const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('C:/Users/HP/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const dir = __dirname;
const html = path.join(dir, 'futureproof-services-promo.html');
const out = path.join(dir, 'futureproof-services-promo.webm');
const framesDir = path.join(dir, '_frames');
fs.mkdirSync(framesDir, { recursive: true });

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe'
  });
  const stillContext = await browser.newContext({ viewport: { width: 720, height: 1280 } });
  const stillPage = await stillContext.newPage();
  await stillPage.goto(pathToFileURL(html).href);
  for (let i = 0; i < 5; i++) {
    await stillPage.evaluate((index) => {
      const scenes = [...document.querySelectorAll('.scene')];
      scenes.forEach((scene, n) => scene.classList.toggle('active', n === index));
    }, i);
    await stillPage.waitForTimeout(500);
    await stillPage.screenshot({ path: path.join(framesDir, `scene-${i + 1}.png`) });
  }
  await stillContext.close();

  const context = await browser.newContext({ viewport: { width: 720, height: 1280 } });
  const page = await context.newPage();
  await page.goto('about:blank');
  const frameData = Array.from({ length: 5 }, (_, i) =>
    `data:image/png;base64,${fs.readFileSync(path.join(framesDir, `scene-${i + 1}.png`)).toString('base64')}`
  );
  const webmBase64 = await page.evaluate(async (sources) => {
    const width = 720, height = 1280, fps = 24;
    const canvas = document.createElement('canvas');
    canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext('2d');
    const images = await Promise.all(sources.map(src => new Promise((resolve, reject) => {
      const image = new Image(); image.onload = () => resolve(image); image.onerror = reject; image.src = src;
    })));
    const mime = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].find(type => MediaRecorder.isTypeSupported(type));
    if (!mime) throw new Error('This browser has no supported WebM recording codec.');
    const recorder = new MediaRecorder(canvas.captureStream(fps), { mimeType: mime, videoBitsPerSecond: 4500000 });
    const chunks = [];
    recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
    const stopped = new Promise(resolve => { recorder.onstop = resolve; });
    recorder.start(250);
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    const hold = async image => { ctx.drawImage(image, 0, 0, width, height); await wait(3200); };
    for (let i = 0; i < images.length; i++) {
      await hold(images[i]);
      if (i < images.length - 1) {
        for (let step = 1; step <= 4; step++) {
          ctx.globalAlpha = 1; ctx.drawImage(images[i], 0, 0, width, height);
          ctx.globalAlpha = step / 5; ctx.drawImage(images[i + 1], 0, 0, width, height);
          ctx.globalAlpha = 1; await wait(100);
        }
      }
    }
    recorder.stop(); await stopped;
    const blob = new Blob(chunks, { type: mime });
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let binary = ''; for (let start = 0; start < bytes.length; start += 0x8000) binary += String.fromCharCode(...bytes.subarray(start, start + 0x8000));
    return btoa(binary);
  }, frameData);
  fs.writeFileSync(out, Buffer.from(webmBase64, 'base64'));
  await context.close();
  await browser.close();
  console.log(JSON.stringify({ video: out, frames: framesDir }));
})().catch(error => { console.error(error); process.exit(1); });

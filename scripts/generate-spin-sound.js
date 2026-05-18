/**
 * Generates picker-wheel SFX for JustDecide:
 *   assets/sounds/spin-click.wav — short segment tick
 *   assets/sounds/spin-bed.wav   — loopable spin whoosh/hum
 *
 * CC0 — procedural, no external assets.
 */
const fs = require("fs");
const path = require("path");

function writeWav(filePath, samples, sampleRate = 22050) {
    const numChannels = 1;
    const bitsPerSample = 16;
    const blockAlign = (numChannels * bitsPerSample) / 8;
    const byteRate = sampleRate * blockAlign;
    const dataSize = samples.length * 2;
    const buffer = Buffer.alloc(44 + dataSize);

    buffer.write("RIFF", 0);
    buffer.writeUInt32LE(36 + dataSize, 4);
    buffer.write("WAVE", 8);
    buffer.write("fmt ", 12);
    buffer.writeUInt32LE(16, 16);
    buffer.writeUInt16LE(1, 20);
    buffer.writeUInt16LE(numChannels, 22);
    buffer.writeUInt32LE(sampleRate, 24);
    buffer.writeUInt32LE(byteRate, 28);
    buffer.writeUInt16LE(blockAlign, 32);
    buffer.writeUInt16LE(bitsPerSample, 34);
    buffer.write("data", 36);
    buffer.writeUInt32LE(dataSize, 40);

    for (let i = 0; i < samples.length; i++) {
        const v = Math.max(-1, Math.min(1, samples[i]));
        buffer.writeInt16LE(Math.round(v * 32767), 44 + i * 2);
    }

    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, buffer);
}

function generateClick(sampleRate) {
    const durationSec = 0.045;
    const length = Math.floor(sampleRate * durationSec);
    const samples = new Float32Array(length);

    for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const env = Math.exp(-t * 95);
        const tone =
            Math.sin(2 * Math.PI * 2100 * t) * 0.42 +
            Math.sin(2 * Math.PI * 4200 * t) * 0.12;
        const noise = (Math.random() * 2 - 1) * 0.28;
        const thump = Math.sin(2 * Math.PI * 180 * t) * Math.exp(-t * 60) * 0.35;
        samples[i] = (tone + noise + thump) * env;
    }

    return samples;
}

function generateBed(sampleRate) {
    const durationSec = 1.8;
    const length = Math.floor(sampleRate * durationSec);
    const samples = new Float32Array(length);

    let noiseState = 0;
    for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const loopT = t / durationSec;

        // Seamless-ish loop: fade ends to match start energy
        const loopEnv =
            Math.sin(Math.PI * loopT) *
            (0.55 + 0.45 * Math.cos(2 * Math.PI * loopT));

        noiseState = noiseState * 0.92 + (Math.random() * 2 - 1) * 0.08;
        const hum =
            Math.sin(2 * Math.PI * 92 * t) * 0.22 +
            Math.sin(2 * Math.PI * 184 * t) * 0.1;
        const whoosh = noiseState * 0.55;
        const flutter = Math.sin(2 * Math.PI * (6 + loopT * 4) * t) * 0.06;

        samples[i] = (hum + whoosh + flutter) * loopEnv * 0.55;
    }

    return samples;
}

const sampleRate = 22050;
const outDir = path.join(__dirname, "..", "assets", "sounds");

writeWav(path.join(outDir, "spin-click.wav"), generateClick(sampleRate), sampleRate);
writeWav(path.join(outDir, "spin-bed.wav"), generateBed(sampleRate), sampleRate);

console.log("Wrote", path.join(outDir, "spin-click.wav"));
console.log("Wrote", path.join(outDir, "spin-bed.wav"));

const chai = require('chai');
const expect = chai.expect;
const {
  hex2rgb,
  rgb2hex,

  rgb2hsl,
  hsl2rgb,

  hex2hsl,
  hsl2hex,

  lightenHex,
  darkenHex,
  lightenRgb,
  darkenRgb,
  lightenHsl,
  darkenHsl,

  lerp3,
  linearGradient,
  gradient
} = require('../dist/kandisky.module');

// This function corrects rounding errors like 0.69999999999 to 0.70
const errorCorrect = n => parseFloat(parseFloat(n).toPrecision(2));

// There is a rounding error because of the floating point math.
// Tests allow for a maximum 1% error margin.
const errorMargin = 255 / 100;

/* eslint-disable func-names */
describe('Kandisky JS Colour Library', function() {
  it('convert a hex code to a rgb array', () => {
    const hex = '#FF0000';
    const hexNoHash = 'FF0000';
    const expected = [0xFF, 0, 0];

    expect(hex2rgb(hex)).to.deep.equal(expected);
    expect(hex2rgb(hexNoHash)).to.deep.equal(expected);
  });

  it('convert an rgb array to a hex code', () => {
    const expected = '#ff0000';
    const rgb = [0xFF, 0, 0];

    expect(rgb2hex(rgb)).to.equal(expected);
  });

  it('convert a rgb array to a hsl array', () => {
    const rgb = [175, 103, 31];
    const expected = [30 / 360, 70 / 100, 40 / 100].map(errorCorrect);

    expect(rgb2hsl(rgb).map(errorCorrect)).to.deep.equal(expected);
  });

  it('convert a hsl array to a rgb array', () => {
    const hsl = [30 / 360, 70 / 100, 40 / 100];
    const expected = [175, 103, 31];

    const converted = hsl2rgb(hsl);
    const diff = [
      Math.max(converted[0], expected[0]) - Math.min(converted[0], expected[0]),
      Math.max(converted[1], expected[1]) - Math.min(converted[1], expected[1]),
      Math.max(converted[2], expected[2]) - Math.min(converted[2], expected[2]),
    ];

    diff.forEach(d => expect(d < errorMargin).to.be.true);
  });

  it('convert a hex code to a hsl array', () => {
    const hex = '#af671f';
    const expected = [30 / 360, 70 / 100, 40 / 100].map(errorCorrect);

    expect(hex2hsl(hex).map(errorCorrect)).to.deep.equal(expected);
  });

  it('convert a hsl array to a hex code', () => {
    const expected = hex2rgb('#af671f');
    const hsl = [30 / 360, 70 / 100, 40 / 100];
    const converted = hex2rgb(hsl2hex(hsl));

    const diff = [
      Math.max(converted[0], expected[0]) - Math.min(converted[0], expected[0]),
      Math.max(converted[1], expected[1]) - Math.min(converted[1], expected[1]),
      Math.max(converted[2], expected[2]) - Math.min(converted[2], expected[2]),
    ];

    diff.forEach(d => expect(d < errorMargin).to.be.true);
  });

  it('lighten a hex code', () => {
    const hex = '#6699CC';
    const expected = '#7ab8f5';
    const converted = lightenHex(0.2, hex);

    expect(converted).to.equal(expected);
  });

  it('darken a hex code', () => {
    const hex = '#6699CC';
    const expected = '#527aa3';
    const converted = darkenHex(0.2, hex);

    expect(converted).to.equal(expected);
  });

  it('lighten an rgb color', () => {
    const rgb = [0x66, 0x99, 0xCC];
    const expected = [0x7a, 0xb8, 0xf5];
    const converted = lightenRgb(0.2, rgb);

    expect(converted).to.deep.equal(expected);
  });

  it('darken an rgb color', () => {
    const rgb = [0x66, 0x99, 0xCC];
    const expected = [0x52, 0x7a, 0xa3];
    const converted = darkenRgb(0.2, rgb);

    expect(converted).to.deep.equal(expected);
  });

  it('lighten a hsl color', () => {
    const hsl = [210/360, 0.5, 0.6].map(errorCorrect);
    const expected = [210/360, 0.5, 0.6 + (0.6 * 0.2)].map(errorCorrect);
    const converted = lightenHsl(0.2, hsl);

    expect(converted).to.deep.equal(expected);
  });

  it('darken a hsl color', () => {
    const hsl = [210/360, 0.5, 0.6].map(errorCorrect);
    const expected = [210/360, 0.5, 0.6 - (0.6 * 0.2)].map(errorCorrect);
    const converted = darkenHsl(0.2, hsl);

    expect(converted).to.deep.equal(expected);
  });

  it('linear interpolate a vector3', () => {
    const a = [0, 0, 0];
    const b = [255, 255, 255];

    const expected1 = a;
    const expected2 = [127.5, 127.5, 127.5];
    const expected3 = b;


    const converted1 = lerp3(0, a, b);
    const converted2 = lerp3(0.5, a, b);
    const converted3 = lerp3(1, a, b);

    expect(converted1).to.deep.equal(expected1);
    expect(converted2).to.deep.equal(expected2);
    expect(converted3).to.deep.equal(expected3);
  });

  it('create a linear gradient between two vector3 colors', () => {
    const a = [0, 0, 0];
    const b = [255, 255, 255];
    const n = 10;

    const out = linearGradient(10, a, b);

    const expected = Array.from(Array(n), (_, i) => lerp3(i / (n-1), a, b));
    expect(out).to.deep.equal(expected)
  });

  it('create a nonlinear gradient between two vector3 colors', () => {
    const a = [0, 0, 0];
    const b = [255, 255, 255];
    const n = 10;

    const easeFn = t => t ** 2;

    const out = gradient(easeFn, 10, a, b);

    const expected = Array.from(Array(n), (_, i) => lerp3(easeFn(i / (n-1)), a, b));
    expect(out).to.deep.equal(expected)
  });
});
/* eslint-enable func-names */
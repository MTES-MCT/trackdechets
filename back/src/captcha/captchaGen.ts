import { genCaptchaString, getUid } from "../utils";
import { createCanvas } from "canvas";
import * as fs from "fs";
import {
  setCaptchaToken,
  getCaptchaToken,
  clearCaptchaToken
} from "../common/redis/captcha";
import path from "path";
import { deduplicate } from "../common/arrays";

const CAPTCHA_LENGTH = 5;

function randomInt(max) {
  return Math.floor(Math.random() * max);
}

// CAPTCHA
// IOT to provide captcha features we follow the following steps:
// Captcha generation: captchaGen generates an image (data url) and a redis stored token associated to the captcha string
// redis entries are short-lived (a few minutes) and deleted each time a checkCaptcha is performed (either success or failure)
// Frontend displays the generated image, an input field, and stores the token value in an hidden field or react state entry
// The input value and the token are sent back on form submit to be verified
// Captcha verification: checkCaptcha verifies a given captcha input against the stored redis entry

/**
 * Store in redis a random uid:captchastring to be queried and verified
 
 * @param captchaString
 * @returns string
 */

export const captchaAsToken = async (
  captchaString: string
): Promise<string> => {
  const token = getUid(10);

  await setCaptchaToken(token, captchaString);
  return token;
};

/**
 * Check given input matches captcha string associated to a gievn captcha token
 * @param inputCaptcha
 * @param captchaToken
 * @returns
 */
export async function checkCaptcha(captchaInput, captchaToken) {
  if (!captchaInput || !captchaToken) {
    return false;
  }
  // if token is expired, we get an empty string and the next equality fails
  const captchaString = await getCaptchaToken(captchaToken);

  const valid = !!captchaString && captchaString === captchaInput.toUpperCase(); // captcha string is upper case
  // success or failure, delete the redis entry, token are not meant to be reused
  await clearCaptchaToken(captchaToken);

  return valid;
}

/**
 * As the name says.
 * @returns "rgb(200, 100, 120)"
 */
function randomColor(): `rgb(${number}, ${number}, ${number})` {
  const colorRange = 200; // avoid low contracts colors
  const r = randomInt(colorRange);
  const g = randomInt(colorRange);
  const b = randomInt(colorRange);
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Generate an image (as data url) from a given string
 * We print capctha letter with some offset and rotation
 * Then we add somme random lines, splines and small rectangles to make hackerz tools life harder
 * @param captchaString
 * @returns
 */
function textToCaptcha(captchaString: string): string {
  const width = 412;
  const height = 80;
  const canvas = createCanvas(width, height);
  const context = canvas.getContext("2d");
  const fontSize = 30;
  const canvasMiddleX = Math.floor(width / 2);
  const canvasMiddleY = Math.floor(height / 2);
  const canvasBaseline = Math.floor(height + fontSize) / 2;
  const xPadding = 50;

  // compute sensible letter spacing
  const xSpacing =
    Math.floor((width - 2 * xPadding) / captchaString.length) - fontSize;
  context.font = `bold ${fontSize}px Impact, sans-serif`;

  // print string chars in différent colors, offsetted and rotated
  for (const [index, char] of captchaString.split("").entries()) {
    const orientation = ((0.5 - Math.random()) * Math.PI) / 4;

    context.fillStyle = randomColor();

    const x = xPadding + index * (fontSize + xSpacing);
    const y = canvasBaseline - (10 - randomInt(10));

    // transform char
    context.translate(x, y);
    context.rotate(orientation);
    context.fillText(char, 0, 0);
    //reset transformations
    context.rotate(-orientation);
    context.translate(-x, -y);
  }
  // a few straight lines
  for (let i = 0; i <= 4; i++) {
    context.strokeStyle = randomColor();
    context.lineWidth = randomInt(3);
    context.beginPath();
    context.moveTo(randomInt(width), randomInt(height));
    context.lineTo(randomInt(width), randomInt(height));
    context.stroke();
  }
  // some bezier curves
  for (let i = 0; i <= 3; i++) {
    context.strokeStyle = randomColor();
    context.beginPath();
    const start: [number, number] = [randomInt(width), randomInt(height)];
    context.moveTo(...start);
    context.lineWidth = randomInt(3);
    context.bezierCurveTo(
      ...start,
      canvasMiddleX + (25 - randomInt(50)),
      canvasMiddleY + (25 - randomInt(50)),
      randomInt(width),
      randomInt(height)
    );
    context.stroke();
  }
  // somme small rectangles
  for (let i = 0; i < 10; i++) {
    context.strokeStyle = randomColor();
    context.beginPath();
    const x = randomInt(width);
    const y = randomInt(height);

    context.strokeRect(x, y, randomInt(10), randomInt(10));
  }
  return canvas.toDataURL();
}

/**
 * Generate a random string, return this string as a data-url img and token referencing a redis entry
 * @param res
 */
export async function captchaGen(res) {
  const captchaString = genCaptchaString(CAPTCHA_LENGTH);
  const token = await captchaAsToken(captchaString);

  res.send({ img: textToCaptcha(captchaString), token });
}

/**
 * Given a captchaToken, retrieve the captcha text and generate a base64 encoded audio alternative
 * @param res
 */
export async function captchaSound(captchaToken, res) {
  // recorded message asking to refresh the captcha
  const refreshAudio = fs.readFileSync(
    path.join(__dirname, `sounds/refresh.mp3`),
    { encoding: "base64" }
  );
  if (!captchaToken) {
    return res.send({ audio: [refreshAudio], playList: [0] });
  }

  const captchaString = await getCaptchaToken(captchaToken);

  if (!captchaString) {
    return res.send({ audio: [refreshAudio], playList: [0] });
  }

  const captchaArray = captchaString.toLowerCase().split("");
  const letters = deduplicate(captchaArray);

  const audio: string[] = [];
  const playList: number[] = [];

  for (const letter of letters) {
    const contents = fs.readFileSync(
      path.join(__dirname, `sounds/letter_${letter}.mp3`),
      { encoding: "base64" }
    );

    audio.push(contents);
  }
  for (const letter of captchaArray) {
    playList.push(letters.indexOf(letter));
  }
  // to spare some bandwidth when glyphs are duplicated, we return 2 items in the json response
  // `audio` is an array of base64 encoded audios
  // `playList` is an array referencing `audio` by each position
  res.send({ audio, playList });
}

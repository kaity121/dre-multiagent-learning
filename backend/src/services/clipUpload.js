import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { CLIPS_DIR, CLIP_EXTENSIONS } from './clipExtractor.js';

/**
 * Lecture video upload: the browser streams the raw file as the request body, so no multipart
 * parser is needed. The file lands in a hidden temp file first and only gets a public clip name
 * once it is complete, under the cap, and starts with a real video container signature.
 */
export const MAX_UPLOAD_BYTES = 200 * 1024 * 1024;
const MAX_STEM_LENGTH = 80;
const MAX_NAME_ATTEMPTS = 500;

export class UploadError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/**
 * Turns a browser file name into a safe clip name: `[a-z0-9-]` stem plus a supported extension.
 * Vietnamese diacritics are folded ("Bài giảng.mp4" -> "bai-giang.mp4"). Any path separator is
 * rejected outright instead of being stripped, so a traversal attempt never becomes a valid upload.
 */
export function sanitizeClipName(raw) {
  if (typeof raw !== 'string' || !raw.trim()) throw new UploadError(400, 'Thiếu tên tệp video');
  const name = raw.trim();
  if (name.length > 255) throw new UploadError(400, 'Tên tệp quá dài');
  // eslint-disable-next-line no-control-regex
  if (/[/\\\u0000-\u001f]/.test(name)) throw new UploadError(400, 'Tên tệp không được chứa đường dẫn');

  const ext = path.extname(name).toLowerCase();
  if (!CLIP_EXTENSIONS.includes(ext)) {
    throw new UploadError(415, `Chỉ nhận video ${CLIP_EXTENSIONS.join(', ')}`);
  }
  const stem = name
    .slice(0, -ext.length)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_STEM_LENGTH)
    .replace(/-+$/g, '');
  if (!stem) throw new UploadError(400, 'Tên tệp phải có chữ hoặc số');
  return `${stem}${ext}`;
}

/** Original file name without extension, kept readable for the clip list (diacritics included). */
function displayTitle(raw) {
  const base = raw.trim();
  return base.slice(0, base.length - path.extname(base).length).replace(/\s+/g, ' ').trim().slice(0, 160);
}

/** True when the first bytes look like the container the extension promises. */
export function hasVideoSignature(header, ext) {
  if (!Buffer.isBuffer(header) || header.length < 8) return false;
  if (ext === '.webm') return header.readUInt32BE(0) === 0x1a45dfa3;
  const box = header.toString('latin1', 4, 8);
  if (ext === '.mp4') return box === 'ftyp';
  if (ext === '.mov') return ['ftyp', 'moov', 'wide', 'mdat', 'free', 'skip'].includes(box);
  return false;
}

function readHeader(file, bytes = 12) {
  const fd = fs.openSync(file, 'r');
  try {
    const buf = Buffer.alloc(bytes);
    const read = fs.readSync(fd, buf, 0, bytes, 0);
    return buf.subarray(0, read);
  } finally {
    fs.closeSync(fd);
  }
}

/** A stem is free when no clip of any supported container and no sidecar already use it. */
function stemTaken(dir, stem) {
  return [...CLIP_EXTENSIONS, '.json'].some((ext) => fs.existsSync(path.join(dir, `${stem}${ext}`)));
}

/**
 * Publishes the temp file under `name`, or `name-2`, `name-3`, ... when taken. Existing clips are
 * never replaced: the hard link (or exclusive copy) fails with EEXIST if another upload won the race.
 */
function claimClipName(dir, name, tempFile) {
  const ext = path.extname(name);
  const stem = name.slice(0, -ext.length);
  for (let i = 1; i <= MAX_NAME_ATTEMPTS; i++) {
    const candidateStem = i === 1 ? stem : `${stem}-${i}`;
    if (stemTaken(dir, candidateStem)) continue;
    const target = path.join(dir, `${candidateStem}${ext}`);
    try {
      fs.linkSync(tempFile, target);
      return `${candidateStem}${ext}`;
    } catch (err) {
      if (err.code === 'EEXIST') continue;
      // Some filesystems refuse hard links; an exclusive copy keeps the no-overwrite guarantee.
      try {
        fs.copyFileSync(tempFile, target, fs.constants.COPYFILE_EXCL);
        return `${candidateStem}${ext}`;
      } catch (copyErr) {
        if (copyErr.code === 'EEXIST') continue;
        throw copyErr;
      }
    }
  }
  throw new UploadError(409, 'Đã có quá nhiều video cùng tên, hãy đổi tên tệp');
}

function byteLimiter(maxBytes, counter) {
  return new Transform({
    transform(chunk, _enc, done) {
      counter.bytes += chunk.length;
      if (counter.bytes > maxBytes) {
        done(new UploadError(413, `Video vượt quá ${Math.round(maxBytes / 1024 / 1024)} MB`));
        return;
      }
      done(null, chunk);
    },
  });
}

/**
 * @param {import('node:stream').Readable} body raw request body (the video bytes)
 * @param {object} options
 * @param {unknown} options.rawName file name from the client
 * @param {string} [options.contentType]
 * @param {string} [options.contentLength]
 * @param {number} [options.maxBytes]
 * @param {string} [options.dir] target folder; defaults to the clips folder
 * @returns {Promise<{ clip: string, title: string, sizeBytes: number }>}
 */
export async function saveUploadedClip(body, options) {
  const { rawName, contentType = '', contentLength, maxBytes = MAX_UPLOAD_BYTES, dir = CLIPS_DIR } = options;
  const name = sanitizeClipName(rawName);
  const mime = String(contentType).split(';')[0].trim().toLowerCase();
  if (!mime.startsWith('video/') && mime !== 'application/octet-stream') {
    throw new UploadError(415, 'Nội dung gửi lên không phải video');
  }
  if (contentLength !== undefined && contentLength !== '') {
    const declared = Number(contentLength);
    if (!Number.isFinite(declared) || declared < 0) throw new UploadError(400, 'Content-Length không hợp lệ');
    if (declared > maxBytes) throw new UploadError(413, `Video vượt quá ${Math.round(maxBytes / 1024 / 1024)} MB`);
    if (declared === 0) throw new UploadError(400, 'Tệp video rỗng');
  }

  fs.mkdirSync(dir, { recursive: true });
  // Hidden `.part` name: never listed as a clip and never matched by resolveClip.
  const tempFile = path.join(dir, `.upload-${crypto.randomBytes(8).toString('hex')}.part`);
  const counter = { bytes: 0 };
  try {
    try {
      await pipeline(body, byteLimiter(maxBytes, counter), fs.createWriteStream(tempFile, { flags: 'wx' }));
    } catch (err) {
      if (err instanceof UploadError) throw err;
      if (err.code === 'ERR_STREAM_PREMATURE_CLOSE' || err.code === 'ECONNRESET' || err.message === 'aborted') {
        throw new UploadError(400, 'Tải lên bị ngắt giữa chừng');
      }
      throw err;
    }
    if (counter.bytes === 0) throw new UploadError(400, 'Tệp video rỗng');
    const ext = path.extname(name);
    if (!hasVideoSignature(readHeader(tempFile), ext)) {
      throw new UploadError(415, `Tệp không phải video ${ext} hợp lệ`);
    }

    const clip = claimClipName(dir, name, tempFile);
    const title = displayTitle(rawName) || clip;
    const sidecar = path.join(dir, `${clip.slice(0, -ext.length)}.json`);
    try {
      fs.writeFileSync(sidecar, `${JSON.stringify({ videoTitle: title, uploadedAt: new Date().toISOString() }, null, 2)}\n`, {
        flag: 'wx',
      });
    } catch (err) {
      // The clip itself is saved; without a sidecar it is listed under its file name.
      console.warn(`[clipUpload] no sidecar for ${clip}: ${err.message}`);
    }
    return { clip, title, sizeBytes: counter.bytes };
  } finally {
    fs.rmSync(tempFile, { force: true });
  }
}

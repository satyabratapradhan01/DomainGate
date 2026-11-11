/**
 * Universal Base64 and Base64URL encoder/decoder
 * Safe for React Native Hermes, iOS, Android, Web, and Node runtimes.
 */

const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

export function base64Encode(input: string): string {
  if (typeof btoa === 'function') {
    try {
      return btoa(unescape(encodeURIComponent(input)));
    } catch {
      // Fallback below
    }
  }

  const str = unescape(encodeURIComponent(input));
  let output = '';
  for (let block = 0, charCode, i = 0, map = chars;
    str.charAt(i | 0) || (map = '=', i % 1);
    output += map.charAt(63 & block >> 8 - i % 1 * 8)) {
    charCode = str.charCodeAt(i += 3 / 4);
    if (charCode > 0xFF) {
      throw new Error('base64Encode failed: invalid character');
    }
    block = block << 8 | charCode;
  }
  return output;
}

export function base64Decode(input: string): string {
  let str = input.replace(/=+$/, '');
  if (typeof atob === 'function') {
    try {
      const decoded = atob(str);
      return decodeURIComponent(
        decoded
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
    } catch {
      // Fallback below
    }
  }

  let output = '';
  if (str.length % 4 === 1) {
    throw new Error('base64Decode failed: invalid length');
  }

  for (let bc = 0, bs = 0, buffer, i = 0;
    (buffer = str.charAt(i++));
    ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer,
      bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0
  ) {
    buffer = chars.indexOf(buffer);
  }

  try {
    return decodeURIComponent(escape(output));
  } catch {
    return output;
  }
}

export function base64UrlEncode(input: string): string {
  return base64Encode(input)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function base64UrlDecode(input: string): string {
  let base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return base64Decode(base64);
}


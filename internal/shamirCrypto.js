const { split: shamirSplit, join: shamirJoin } = require('shamir');
import { encryptData, decryptData } from './internal/symmetricCrypto'

const encoder = new TextEncoder();
const decoder = new TextDecoder()

// adapted from: https://gist.github.com/alexdiliberto/39a4ad0453310d0a69ce
const getRandomBytes = function(n) {
  const QUOTA = 65536
  var a = new Uint8Array(n);
  for (var i = 0; i < n; i += QUOTA) {
    crypto.getRandomValues(a.subarray(i, i + Math.min(n - i, QUOTA)));
  }
  return a;
};

export function split(secret, num_parts, quorum) {
    const secretBytes = encoder.encode(JSON.stringify(secret));
    return shamirSplit(getRandomBytes, num_parts, quorum, secretBytes);
}

export function join(parts) {
  return decoder.decode(shamirJoin(parts))
}

/* encode shamir parts into format that easier to works with:
 * array of object {
 *    index: int, // to recostruct the parts
 *    data: array, // parts data in regular array format
*/ 
export function encodeParts(parts) {
  return Object.entries(parts).map(
    ([k,v]) => ({
      index: Number(k),
      data: Array.from(v),
    })
  )
}

/* decode parts back into format understood by shamir library.
 * parts is in this format:
 *
 * Object {
 *  1: Uint8Array[length] number 1,
 *  2: Uint8Array[length] number 2,
 *  3: Uint8Array[length] number 3,
 *  }
 *
 * to reconstruct, the parts object must be in the correct key order. example:
 *
 * CORRECT:
 * Object {
 *  3: Uint8Array[length] number 3,
 *  2: Uint8Array[length] number 2,
 * }
 *
 * ERROR:
 * Object {
 *  1: Uint8Array[length] number 2,
 *  2: Uint8Array[length] number 3,
 * }
 */  
export function decodeParts(parts) {
  return Object.fromEntries(parts.map(item => [
    item.index,
    Uint8Array.from(item.data)
  ]))
}

/* Encrypt parts using symmetric decryption */
export async encryptParts(encodeParts, passwords) {
    const encryptedParts = await Promise.all(encodedParts.map(async(item) => {
      const enc = await encryptData(JSON.stringify(item.data), passwords[item.index-1])
      return {
        index: item.index,
        encryptedData: enc,
      }
    }))
    return encryptedParts
}

/* Decrypt parts using symmetric decryption */
export async function decryptParts(encryptedParts, passwords) {
    let decryptedParts = []

    for (let ii = 0; ii < encryptedParts.length; ii++) {
      const encPart = encryptedParts[ii]

      for (let ij = 0; ij < passwords.length; ij++) {
        try {
          const res = await decryptData(encPart.encryptedData, passwords[ij])
          if (res) {
            decryptedParts.push({
              index: encPart.index,
              data: JSON.parse(res),
            })
            //delete splittedDecryptPasswords[ij]
            continue
          }
        } catch (e) {
          console.log({ ii, ij, e })
        }
      }
    }
}

export default {
  split,
  join,
  encodeParts,
  decodeParts,
  encryptParts,
}

import CryptoJS from 'crypto-js';

export class CryptoService {
  static encrypt(text: string): string {
    return CryptoJS.SHA256(text).toString();
  }

  static verify(text: string, hash: string): boolean {
    let encryptedText = CryptoService.encrypt(text);
    console.log('encryptedText', encryptedText)
    return encryptedText === hash;
  }
}

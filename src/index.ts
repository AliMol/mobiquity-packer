import { packaging } from './packaging';

export class Packer {
  /**
   *
   * @param {String} filePath relative or absolute file path
   * @throws {PackingError} if unable to pack
   * @returns {Promise<String>} solution
   */
  async pack(filePath: string): Promise<string> {
    console.log(`Start to read and analyze : ${filePath}`);

    return await packaging(filePath);
  }
}
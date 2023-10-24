const { expect } = require('chai');
import { IPackage } from 'src/model/package';
import { extractPackage, packItems, packaging, processLine, validatepackagingConstraints } from '../src/packaging';
import constrains from '../src/constrains';
import { PackingError } from '../src/PackingError';

describe('packing items', () => {
  it('returns the correct items in a package', async() => {
    const receivedResponse = await packaging('./resources/example_input');
    expect(receivedResponse).to.equal('4\n-\n2,7\n8,9');
  });
});

describe('validate packaging Constraints', () => {
  it('is valid when all constraints are met', () => {
    const testpackage: IPackage = {
      maximumWeight: 10,
      items: [
        { index: 1, price: 80, weight: 7 },
        { index: 2, price: 99, weight: 9 },
        { index: 3, price: 1, weight: 1 }
      ]
    };
    const result = validatepackagingConstraints(testpackage);
    expect(result.isValid).to.equal(true);
    expect(result.maxPriceItemIsValid).to.equal(true);
    expect(result.maxWeightPerItemIsValid).to.equal(true);
    expect(result.maxWeightPerPackageIsValid).to.equal(true);
  });
  it('is invalid when an item exceed max price', () => {
    const testpackage: IPackage = {
      maximumWeight: 20,
      items: [
        { index: 1, price: 70, weight: 18 },
        { index: 2, price: constrains.maxPriceItem + 2, weight: 18 },
        { index: 3, price: 90, weight: 18 }
      ]
    };
    const result = validatepackagingConstraints(testpackage);
    expect(result.isValid).to.equal(false);
    expect(result.maxPriceItemIsValid).to.equal(false);
  });
  it('is invalid when an item exceed max weight', () => {
    const testpackage: IPackage = {
      maximumWeight: 30,
      items: [
        { index: 1, price: 99, weight: 16 },
        { index: 2, price: 72, weight: constrains.maxWeightItem + 7 },
        { index: 3, price: 1, weight: 29 }
      ]
    };
    const result = validatepackagingConstraints(testpackage);
    expect(result.isValid).to.equal(false);
    expect(result.maxWeightPerItemIsValid).to.equal(false);
  });
  it('is invalid when a package can take more than max weight', () => {
    const testpackage: IPackage = {
      maximumWeight: constrains.maxWeightTotal + 1,
      items: [
        { index: 1, price: 99, weight: 90 },
        { index: 2, price: 98, weight: 91 },
        { index: 3, price: 97, weight: 92 }
      ]
    };
    const result = validatepackagingConstraints(testpackage);
    expect(result.isValid).to.equal(false);
    expect(result.maxWeightPerPackageIsValid).to.equal(false);
  });
  it('is invalid when items count exceed the maximum', () => {
    const testpackage: IPackage = {
      maximumWeight: 40,
      items: []
    };

    for (let i = 0; i < constrains.maxItemCount + 1; i++) {
      testpackage.items.push({ index: i + 1, price: 5, weight: 3 });
    }
    const result = validatepackagingConstraints(testpackage);
    expect(result.isValid).to.equal(false);
    expect(result.itemsCountIsValid).to.equal(false);
  });
  it('throws an error on invalid lines', () => {
    const line = 'wrong format';
    expect(() => processLine(line)).to.throw(PackingError);
  });
});

describe('processLine(...)', () => {
  const example_input = [
    {
      rawLine: '81 : (1,53.38,€45) (2,88.62,€98) (3,78.48,€3) (4,72.30,€76) (5,30.18,€9) (6,46.34,€48)',
      expectedResult: '4'
    },
    {
      rawLine: '8 : (1,15.3,€34)',
      expectedResult: '-'
    },
    {
      rawLine: '75 : (1,85.31,€29) (2,14.55,€74) (3,3.98,€16) (4,26.24,€55) (5,63.69,€52) (6,76.25,€75) (7,60.02,€74) (8,93.18,€35) (9,89.95,€78)',
      expectedResult: '2,7'
    },
    {
      rawLine: '56 : (1,90.72,€13) (2,33.80,€40) (3,43.15,€10) (4,37.97,€16) (5,46.81,€36) (6,48.77,€79) (7,81.80,€45) (8,19.36,€79) (9,6.76,€64)',
      expectedResult: '8,9'
    }
  ];

  for (const line of example_input) {
    it('process lines correctly', () => {
      const { rawLine } = line;
      const result = processLine(rawLine);
      expect(result).to.equal(line.expectedResult);
    });
  }

  it('throws a packagingeroor when invalid format', () => {
    const lineTest = '8 : (1,2000,€763';
    expect(() => processLine(lineTest)).to.throw(PackingError);
  });
});

describe('extractPackage(...)', () => {
  it('extract package correctly', () => {
    const items = extractPackage('81 : (1,53.38,€45) (2,88.62,€98) (3,78.48,€3) (4,72.30,€76) (5,30.18,€9) (6,46.34,€48)');
    const expectedResult = {
      maximumWeight: 81,
      items: [
        { index: 1, weight: 53.38, price: 45 },
        { index: 2, weight: 88.62, price: 98 },
        { index: 3, weight: 78.48, price: 3 },
        { index: 4, weight: 72.30, price: 76 },
        { index: 5, weight: 30.18, price: 9 },
        { index: 6, weight: 46.34, price: 48 }
      ]
    };
    expect(items).to.deep.equal(expectedResult);
  });
  it('throws a PackingError when package is invalid', () => {
    const invalidPackageLine = '8 : (1.15  3,€34)';
    expect(() => extractPackage(invalidPackageLine)).to.throw(PackingError);
  });
});

describe('Pack Items', () => {
  it('Pack Items correctly', () => {
    const testpackage: IPackage = {
      maximumWeight: 81,
      items: [
        { index: 1, price: 45, weight: 53.38 },
        { index: 2, price: 98, weight: 88.62 },
        { index: 3, price: 3, weight: 78.48 },
        { index: 4, price: 76, weight: 72.30 },
        { index: 5, price: 9, weight: 30.18 },
        { index: 6, price: 48, weight: 46.34 }
      ]
    };
    const expectedresult = [
      { index: 4, price: 76, weight: 72.30 }
    ];
    const result = packItems(testpackage);
    expect(result).to.deep.equal(expectedresult);

  });

  it('If 2 Items has same price, then the one with less weight must picked', () => {
    const testpackage: IPackage = {
      maximumWeight: 75,
      items: [
        { index: 1, price: 45, weight: 53.38 },
        { index: 2, price: 74, weight: 60.02 },
        { index: 3, price: 3, weight: 78.48 },
        { index: 4, price: 26, weight: 72.30 },
        { index: 5, price: 9, weight: 30.18 },
        { index: 6, price: 74, weight: 14.55 }
      ]
    };
    const expectedresult = [
      { index: 6, price: 74, weight: 14.55 },
      { index: 2, price: 74, weight: 60.02 }
    ];
    const result = packItems(testpackage);
    expect(result).to.deep.equal(expectedresult);

  });

  it('If 2 Items has same price, then the one which has less weight should come first', () => {
    const testpackage: IPackage = {
      maximumWeight: 75,
      items: [
        { index: 1, price: 45, weight: 53.38 },
        { index: 2, price: 74, weight: 60.02 },
        { index: 3, price: 3, weight: 78.48 },
        { index: 4, price: 26, weight: 72.30 },
        { index: 5, price: 9, weight: 30.18 },
        { index: 6, price: 74, weight: 14.55 }
      ]
    };
    const expectedResult = { index: 6, price: 74, weight: 14.55 };
    const result = packItems(testpackage);
    expect(result[0]).to.deep.equal(expectedResult);

  });

  it('If an item has more weight than maximumWeight, it must not appear in the result', () => {
    const testpackage: IPackage = {
      maximumWeight: 75,
      items: [
        { index: 1, price: 45, weight: 53.38 },
        { index: 2, price: 74, weight: 60.02 },
        { index: 3, price: 3, weight: 88.48 },
        { index: 4, price: 26, weight: 72.30 },
        { index: 5, price: 9, weight: 30.18 },
        { index: 6, price: 74, weight: 14.55 }
      ]
    };
    const expectedResult = { index: 3, price: 3, weight: 88.48 };
    const result = packItems(testpackage);
    expect(result).not.to.include(expectedResult);

  });
});
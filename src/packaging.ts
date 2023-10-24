import { promises as fs } from 'fs';
import { IItem, IPackage } from './model/package';
import constrains from './constrains';
import { PackingError } from './PackingError';

export async function packaging(filePath: string): Promise<string> {

  console.log('Start Packaging at : ', Date.now());

  // read text file
  const inputFile = await fs.readFile(filePath, { encoding: 'utf-8' });
  const inputText = Buffer.from(inputFile).toString();

  // print text file content
  console.log('Text file is -->', inputText);

  // make an array of all lines
  const inputLines = inputText.replace(/\r/g, '')
    .trim()
    .split('\n')
    .filter(line => line.length > 0);

  // process each line
  const results = inputLines.map(processLine);

  console.log('Finish at : ', Date.now());

  return results.join('\n');
}

export function processLine(line: string): string {
  console.log('Line To Process : ', line);

  // Create IPackage Interface out of each line
  const items = extractPackage(line);

  // Validate The Items based on constraint rules
  const validate = validatepackagingConstraints(items);
  if (validate.isValid === false) {
    throw new PackingError(`Invalid package line: ${line}`);
  } else {
    // Start to pick best items to pack
    const itemsToPack = packItems(items);

    return itemsToPack.map(item => item.index).join(',') || '-';
  }
}

export function extractPackage(rawLine: string): IPackage {
  try {
    // If Line has error, catch them and throws an error
    if (validateRawLine(rawLine) === false) {
      throw new PackingError(`Invalid package line \`${rawLine}\``);
    }

    const [maximumWeightStr, rawItems] = rawLine.split(' : ');

    const maximumWeight = Number(maximumWeightStr);

    // Fetch Items for each rawLine
    const items = extractItems(rawItems);

    return { maximumWeight, items };
  } catch (err) {
    throw new PackingError(`Invalid package line \`${rawLine}\``);
  }
}

export function validateRawLine(line: string) {

  // sample for regex (1,53.38,€45)
  const template = '\\d+(\\.\\d+)?';

  // should fetch 1 - 53.38 - 45
  const part = template;
  const pacakgeReg = `\\(${part},${part},€${part}\\)`;

  const lineRegex = new RegExp(`^${part} : (${pacakgeReg})( (${pacakgeReg})){0,}$`);

  // returns true if format is correct
  return lineRegex.test(line);
}

export function extractItems(items: string): IItem[] {

  return items.split(' ').map((item) => {
    // create Items array like -->
    // items: [
    //     { index: 1, price: 45, weight: 53.38 },
    //     { index: 2, price: 74, weight: 60.02 },
    //     { index: 3, price: 3, weight: 88.48 },
    //     { index: 4, price: 26, weight: 72.30 },
    //     { index: 5, price: 9, weight: 30.18 },
    //     { index: 6, price: 74, weight: 14.55 }
    //   ]
    const [index, weight, price] = item.replace(/[()€]/g, '').split(',');
    return {
      index: Number(index),
      weight: Number(weight),
      price: Number(price)
    };
  });
}

export function validatepackagingConstraints(packageToValidate: IPackage) {

  // price should not be over 100
  const maxPriceItemIsValid = packageToValidate.items.every(item => {
    return item.price <= constrains.maxPriceItem;
  });

  // weight per item should not be be over 100
  const maxWeightPerItemIsValid = packageToValidate.items.every(item => {
    return item.weight <= constrains.maxWeightItem;
  });

  // weight per package should not be be over 100
  const maxWeightPerPackageIsValid = packageToValidate.maximumWeight <= constrains.maxWeightTotal;

  // item count should not be be over 15
  const itemsCountIsValid = packageToValidate.items.length <= constrains.maxItemCount;

  // all must be true to evaluate a package as valid
  const isValid = itemsCountIsValid && maxPriceItemIsValid && maxWeightPerItemIsValid && maxWeightPerPackageIsValid;

  return {
    isValid,
    maxPriceItemIsValid,
    maxWeightPerItemIsValid,
    maxWeightPerPackageIsValid,
    itemsCountIsValid
  };
}

export function packItems(packageToPack: IPackage): IItem[] {
  const finalPack = []; let sumWeight = 0;

  // Filter out any items which has weight over maximumWeight
  packageToPack.items.filter(item => item.weight <= packageToPack.maximumWeight)

    // Sort Items Descending based on Price
    .sort(function(a, b) {
      if (a.price === b.price) {
        // Weight is only important when prices are the same
        // So For 2 same price, the one which has less weight will be selected
        return a.weight - b.weight;
      }
      return a.price > b.price ? -1 : 1;
    })
    .map(item => {
      // add items to pack upto less than or equal maximumWeight
      if (finalPack.length === 0) {
        finalPack.push(item);
        sumWeight = item.weight;
      } else if (sumWeight < packageToPack.maximumWeight && sumWeight + item.weight <= packageToPack.maximumWeight) {
        finalPack.push(item);
        sumWeight += item.weight;
      }
    });
  return finalPack;
}
export interface IItem {
    index: number,
    weight: number,
    price: number
}

export interface IPackage{
    maximumWeight: number,
    items: IItem[]
  }
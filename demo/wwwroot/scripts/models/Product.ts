class Product extends app.mvp.Model implements spaMVP.Equatable<Product> {
    id: number;
    name: string;
    price: number;
    imgSource: string;

    constructor(id, name, imgSource) {
        super();

        this.id = id;
        this.name = name;
        this.price = id;
        this.imgSource = imgSource;
    }

    equals(other: Product): boolean {
        return other && this.id === other.id;
    }

    hash(): number {
        return this.id;
    }
}
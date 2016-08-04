class Product extends spaMVP.Model {
    constructor(id, name, imgSource) {
        super()

        this.id = id;
        this.name = name;
        this.price = id;
        this.imgSource = imgSource;
    }
}
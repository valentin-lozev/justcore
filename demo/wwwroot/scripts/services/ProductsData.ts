class ProductsData {
    constructor() {
    }

    getAll(onSuccess: (data: Product[]) => void) {
        let result = [
            new Product(1, 'Red', 'http://www.technopolis.bg/medias/sys_master/hff/he8/9594025213982.jpg'),
            new Product(2, 'Blue', 'http://www.technopolis.bg/medias/sys_master/h50/h6e/9575018463262.jpg'),
            new Product(3, 'Mobile', 'http://www.technopolis.bg/medias/sys_master/h8e/h79/9480002502686.jpg'),
            new Product(4, 'Accessory', 'http://www.technopolis.bg/medias/sys_master/h04/h70/9360957112350.jpg'),
            new Product(5, 'Red Mobile', 'http://www.technopolis.bg/medias/sys_master/h3f/hcb/9462608330782.jpg'),
            new Product(6, 'Blue Mobile', 'http://www.technopolis.bg/medias/sys_master/hcb/he1/9133450461214.jpg'),
            new Product(7, 'Red Accessory', 'http://www.technopolis.bg/medias/sys_master/h29/h71/9602758967326.jpg'),
            new Product(8, 'Blue Accessory', 'http://www.technopolis.bg/medias/sys_master/ha3/h98/8815351463966.jpg'),
            new Product(9, 'Red Blue', 'http://www.technopolis.bg/medias/sys_master/hb3/ha5/9603644751902.jpg'),
            new Product(10, 'Mobile Accessory', 'http://www.technopolis.bg/medias/sys_master/he1/he1/9525280571422.jpg')
        ];
        onSuccess(result);
    }
}
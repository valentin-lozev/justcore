namespace templates {
    export function productItem(product): string {
        return '<li id="' + product.id + '" data-click="addToCart" data-keyword="' + product.name + '">' +
            '<img src="' + product.imgSource + '" class="disableClick">' +
            '<p class="disableClick">' + product.name + '</p>' +
            '</li>';
    };
}
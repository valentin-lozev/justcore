namespace templates {
    export function productItem(product: Product): string {
        let html = `<div id="${product.id}" data-keyword="${product.name}" class="product w3-third w3-container w3-margin-bottom">
                        <img src="${product.imgSource}" data-click="addToCart" class="w3-hover-opacity">
                        <p data-click="addToCart" >${product.name}</p>
                    </div>`;
        return html;
    };
}
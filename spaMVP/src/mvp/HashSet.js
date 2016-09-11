var spaMVP;
(function (spaMVP) {
    var Hidden;
    (function (Hidden) {
        "use strict";
        /**
         *  Creates a collection of unique items.
         *  @class spaMVP.HashSet
         *  @property {Number} size
         */
        var HashSet = (function () {
            function HashSet() {
                this.items = {};
                this.size = 0;
            }
            /**
             *  Determines whether an item is in the set.
             *  @returns {Boolean}
             */
            HashSet.prototype.contains = function (item) {
                var hashCode = item.hash();
                if (!Object.prototype.hasOwnProperty.call(this.items, hashCode)) {
                    return false;
                }
                var hashedItems = this.items[hashCode];
                if (!Array.isArray(hashedItems)) {
                    return hashedItems.equals(item);
                }
                for (var i = 0, len = hashedItems.length; i < len; i++) {
                    if (hashedItems[i].equals(item)) {
                        return true;
                    }
                }
                return false;
            };
            /**
             *  Adds a new item to the set.
             *  @returns {Boolean}
             */
            HashSet.prototype.add = function (item) {
                if (this.contains(item)) {
                    return false;
                }
                var hashCode = item.hash();
                // the first item with this hash
                if (!Object.prototype.hasOwnProperty.call(this.items, hashCode)) {
                    this.items[hashCode] = item;
                }
                else if (!Array.isArray(this.items[hashCode])) {
                    // the second item with this hash
                    this.items[hashCode] = [this.items[hashCode], item];
                }
                else {
                    // there are already two or more items with this hash
                    this.items[hashCode].push(item);
                }
                this.size++;
                return true;
            };
            /**
             *  Removes an item from the set.
             *  @returns {Boolean}
             */
            HashSet.prototype.remove = function (item) {
                if (!this.contains(item)) {
                    return false;
                }
                var hashCode = item.hash();
                if (Array.isArray(this.items[hashCode])) {
                    var hashCodeItems = this.items[hashCode];
                    for (var i = 0, len = hashCodeItems.length; i < len; i++) {
                        if (hashCodeItems[i].equals(item)) {
                            hashCodeItems[i] = hashCodeItems[len - 1];
                            hashCodeItems.length--;
                            break;
                        }
                    }
                }
                else {
                    delete this.items[hashCode];
                }
                this.size--;
                return true;
            };
            /**
             *  Removes all items from the set.
             *  @returns {Boolean}
             */
            HashSet.prototype.clear = function () {
                if (this.size <= 0) {
                    return false;
                }
                this.items = {};
                this.size = 0;
                return true;
            };
            /**
             *  Performs a an action on each item in the set.
             *  @param {Function} action
             *  @param {Object} [context] The action's context.
             */
            HashSet.prototype.forEach = function (action, context) {
                var index = 0;
                var hashes = Object.keys(this.items);
                for (var i = 0, len = hashes.length; i < len; i++) {
                    var hashIndexItem = this.items[hashes[i]];
                    if (!Array.isArray(hashIndexItem)) {
                        action.call(context, hashIndexItem, index);
                        index++;
                        continue;
                    }
                    for (var j = 0, hashLength = hashIndexItem.length; j < hashLength; j++) {
                        action.call(context, hashIndexItem[j], index);
                        index++;
                    }
                }
            };
            /**
             *  Converts the set to Array.
             *  @returns {Array}
             */
            HashSet.prototype.toArray = function () {
                var result = new Array(this.size);
                var index = 0;
                var hashes = Object.keys(this.items);
                for (var i = 0, hashesLen = hashes.length; i < hashesLen; i++) {
                    var hashIndexItem = this.items[hashes[i]];
                    if (!Array.isArray(hashIndexItem)) {
                        result[index] = hashIndexItem;
                        index++;
                        continue;
                    }
                    for (var j = 0, len = hashIndexItem.length; j < len; j++) {
                        result[index] = hashIndexItem[j];
                        index++;
                    }
                }
                return result;
            };
            return HashSet;
        }());
        Hidden.HashSet = HashSet;
    })(Hidden = spaMVP.Hidden || (spaMVP.Hidden = {}));
})(spaMVP || (spaMVP = {}));
//# sourceMappingURL=HashSet.js.map
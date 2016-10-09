namespace spaMVP.plugins.mvp {
    "use strict";

    export interface Equatable<T> {
        equals(other: T): boolean;
        hash(): number;
    }

    /**
     *  Creates a collection of unique items.
     *  @class spaMVP.HashSet
     *  @property {Number} size  
     */
    export class HashSet<T extends Equatable<T>> {
        private items: Object = {};
        public size: number = 0;

        /**
         *  Determines whether an item is in the set.
         *  @returns {Boolean}
         */
        contains(item: T): boolean {
            let hashCode = item.hash();
            if (!Object.prototype.hasOwnProperty.call(this.items, hashCode)) {
                return false;
            }

            let hashedItems = this.items[hashCode];
            if (!Array.isArray(hashedItems)) {
                return hashedItems.equals(item);
            }

            for (let i = 0, len = hashedItems.length; i < len; i++) {
                if (hashedItems[i].equals(item)) {
                    return true;
                }
            }

            return false;
        }

        /**
         *  Adds a new item to the set.
         *  @returns {Boolean}
         */
        add(item: T): boolean {
            if (item === null ||
                typeof item === "undefined" ||
                this.contains(item)) {
                return false;
            }

            let hashCode = item.hash();

            // the first item with this hash
            if (!Object.prototype.hasOwnProperty.call(this.items, hashCode)) {
                this.items[hashCode] = item;
            } else if (!Array.isArray(this.items[hashCode])) {
                // the second item with this hash
                this.items[hashCode] = [this.items[hashCode], item];
            } else {
                // there are already two or more items with this hash
                this.items[hashCode].push(item);
            }

            this.size++;
            return true;
        }

        /**
         *  Removes an item from the set.
         *  @returns {Boolean}
         */
        remove(item: T): boolean {
            if (!this.contains(item)) {
                return false;
            }

            let hashCode = item.hash();

            if (Array.isArray(this.items[hashCode])) {
                let hashCodeItems = this.items[hashCode];
                for (let i = 0, len = hashCodeItems.length; i < len; i++) {
                    if (hashCodeItems[i].equals(item)) {
                        hashCodeItems[i] = hashCodeItems[len - 1];
                        hashCodeItems.length--;
                        break;
                    }
                }
            } else {
                delete this.items[hashCode];
            }

            this.size--;
            return true;
        }

        /**
         *  Removes all items from the set.
         *  @returns {Boolean}
         */
        clear(): boolean {
            if (this.size <= 0) {
                return false;
            }

            this.items = {};
            this.size = 0;
            return true;
        }

        /**
         *  Performs a an action on each item in the set.
         *  @param {Function} action
         *  @param {Object} [context] The action's context.
         */
        forEach(action: (item: T, index: number) => void, context?: Object): void {
            let index = 0;
            let hashes = Object.keys(this.items);
            for (let i = 0, len = hashes.length; i < len; i++) {
                let hashIndexItem = this.items[hashes[i]];
                if (!Array.isArray(hashIndexItem)) {
                    action.call(context, hashIndexItem, index);
                    index++;
                    continue;
                }

                for (let j = 0, hashLength = hashIndexItem.length; j < hashLength; j++) {
                    action.call(context, hashIndexItem[j], index);
                    index++;
                }
            }
        }

        /**
         *  Converts the set to Array.
         *  @returns {Array}
         */
        toArray(): T[] {
            let result = new Array(this.size);
            let index = 0;
            let hashes = Object.keys(this.items);
            for (let i = 0, hashesLen = hashes.length; i < hashesLen; i++) {
                let hashIndexItem = this.items[hashes[i]];
                if (!Array.isArray(hashIndexItem)) {
                    result[index] = hashIndexItem;
                    index++;
                    continue;
                }

                for (let j = 0, len = hashIndexItem.length; j < len; j++) {
                    result[index] = hashIndexItem[j];
                    index++;
                }
            }

            return result;
        }
    }

}
var spaMVP = (function (spaMVP)
{
    function defaultHashingFunc(item)
    {
        if (typeof item.hashCode === 'function')
        {
            return item.hashCode();
        }

        return item.toString();
    }

    function defaultEqualityFunc(item, other)
    {
        if (typeof item.equals === 'function')
        {
            return item.equals(other);
        }

        return item === other;
    }

    /**
     *  Creates a collection of unique values.
     *  @class spaMVP.HashSet
     *  @property {Object} items
     *  @property {Number} size
     *  @param {Function} [hashingFunc] - Provides hash codes for objects placed in the set.
     *          If not provided, the set checks whether the object has a hashCode() method, 
     *          and if not, calls its toString() method.
     *  @param {Function} [equalityFunc] - Checks for equality between two objects with the same hash code.
     *          If not provided, the set checks whether object being compared has an equals(other) method, 
     *          and if not, compares the objects by using the === operator.  
     */
    function HashSet(hashingFunc, equalityFunc)
    {
        this.items = {};
        this.size = 0;
        this._hashingFunc = hashingFunc || defaultHashingFunc;
        this._equalityFunc = equalityFunc || defaultEqualityFunc;
    }

    /**
     *  Adds a new item to the set.
     *  @returns {Boolean}
     */
    HashSet.prototype.add = function (item)
    {
        if (this.contains(item))
        {
            return false;
        }

        var hashCode = this._hashingFunc(item);

        // the first item with this hash
        if (!Object.prototype.hasOwnProperty.call(this.items, hashCode))
        {
            this.items[hashCode] = item;
        }
        // the second item with this hash
        else if (!(this.items[hashCode] instanceof Array))
        {
            this.items[hashCode] = [this.items[hashCode], item];
        }
        // there are already two or more items with this hash
        else
        {
            this.items[hashCode].push(item);
        }

        this.size++;

        return true;
    };

    /**
     *  Removes an item from the set.
     *  @returns {Boolean}
     */
    HashSet.prototype.remove = function (item)
    {
        if (!this.contains(item))
        {
            return false;
        }

        var hashCode = this._hashingFunc(item);

        if (this.items[hashCode] instanceof Array)
        {
            var hashCodeItems = this.items[hashCode];
            for (var i = 0, len = hashCodeItems.length; i < len; i++)
            {
                if (this._equalityFunc(hashCodeItems[i], item))
                {
                    hashCodeItems[i] = hashCodeItems[len - 1];
                    hashCodeItems.length--;
                    break;
                }
            }
        }
        else
        {
            delete this.items[hashCode];
        }

        this.size--;

        return true;
    };

    /**
     *  Determines whether an item is in the set.
     *  @returns {Boolean}
     */
    HashSet.prototype.contains = function (item)
    {
        var hashCode = this._hashingFunc(item);
        if (!Object.prototype.hasOwnProperty.call(this.items, hashCode))
        {
            return false;
        }

        var hashedItems = this.items[hashCode];
        if (!(hashedItems instanceof Array))
        {
            return this._equalityFunc(hashedItems, item);
        }

        for (var i = 0, len = hashedItems.length; i < len; i++)
        {
            if (this._equalityFunc(hashedItems[i], item))
            {
                return true;
            }
        }

        return false;
    };

    /**
     *  Removes all items from the set.
     *  @returns {Boolean}
     */
    HashSet.prototype.clear = function ()
    {
        if (this.size <= 0)
        {
            return false;
        }

        this.items = {};
        this.size = 0;

        return true;
    };

    /**
     *  Performs a specified action on each item in the set.
     *  @param {Function} action
     *  @param {Object} [context] - Value to use as this when executing the action.
     */
    HashSet.prototype.forEach = function (action /*, context */)
    {
        var context = arguments[1],
            index = 0,
            hashes = Object.keys(this.items);

        for (var i = 0, len = hashes.length; i < len; i++)
        {
            var hashIndexItem = this.items[hashes[i]];
            if (!(hashIndexItem instanceof Array))
            {
                action.call(context, hashIndexItem, index);
                index++;
                continue;
            }

            for (var j = 0, hashLength = hashIndexItem.length; j < hashLength; j++)
            {
                action.call(context, hashIndexItem[j], index);
                index++;
            }
        }
    };

    /**
     *  Converts the set to Array without copying the items.
     *  @returns {Array}
     */
    HashSet.prototype.toArray = function ()
    {
        var result = new Array(this.size),
            index = 0,
            hashes = Object.keys(this.items);
        for (var i = 0, hashesLen = hashes.length; i < hashesLen; i++)
        {
            var hashIndexItem = this.items[hashes[i]];
            if (!(hashIndexItem instanceof Array))
            {
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

    spaMVP.HashSet = HashSet;
    return spaMVP;

}(spaMVP || {}));
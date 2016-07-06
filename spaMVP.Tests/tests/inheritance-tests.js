/// <reference path="/scripts/jasmine.js" />
/// <reference path="../../spaMVP/src/helpers.js" />

describe('Inheritance helper', function ()
{
    var Vehicle, Car, RaceCar;

    beforeAll(function () {
        Vehicle = function (speed) {
            this.speed = speed;
        };
        Vehicle.prototype = {
            getGearSystemType: function () {
                return 'Automatic';
            },
            getSpeed: function () {
                return this.speed;
            },
            getWheels: function () {
                return 4;
            }
        };
        Vehicle.subclass = spaMVP._private.subclassFactoryMethod;

        Car = Vehicle.subclass(function () {
            function Car(speed) {
                Car.BaseClass.call(this, speed);
            }
            return Car;
        });

        RaceCar = Car.subclass(function () {
            function RaceCar(speed, turbo) {
                RaceCar.BaseClass.call(this, speed);
                this.turbo = turbo;
            }
            RaceCar.prototype = {
                getSpeed: function () {
                    var baseSpeed = RaceCar.BaseClass.prototype.getSpeed.call(this);
                    return baseSpeed + this.turbo;
                },
                getGearSystemType: function () {
                    return 'Manual';
                }
            };
            return RaceCar;
        });
    });

    afterAll(function () {
        Vehicle = Car = RaceCar = null;
    });

    it('should create proper inheritance', function ()
    {
        var carSpeed = 100;
        var turbo = 180;
        var car = new Car(carSpeed);
        var raceCar = new RaceCar(carSpeed, turbo);

        expect(car.getSpeed()).toEqual(carSpeed);
        expect(car.turbo).toBeUndefined();
        expect(raceCar.getSpeed()).toEqual(carSpeed + turbo);

        expect(car.getGearSystemType()).toEqual('Automatic');
        expect(raceCar.getGearSystemType()).toEqual('Manual');

        expect(car.getWheels()).toEqual(4);
        expect(raceCar.getWheels()).toEqual(4);

        expect(car instanceof Vehicle).toBeTruthy();
        expect(car instanceof Car).toBeTruthy();
        expect(car instanceof RaceCar).toBeFalsy();

        expect(raceCar instanceof Vehicle).toBeTruthy();
        expect(raceCar instanceof Car).toBeTruthy();
        expect(raceCar instanceof RaceCar).toBeTruthy();

        expect(car.constructor === Car).toBeTruthy();
        expect(raceCar.constructor === RaceCar).toBeTruthy();
    });

    it('should throw an error if inheritor is not supplied', function () {
        var inheritorFunc = function () { return null; };
        expect(function () { Car.subclass(inheritorFunc); }).toThrow();
    });

    it('should throw an error if inheritorFunc is not a function', function () {
        expect(function () {
            Car.subclass(-1);
        }).toThrow();
    });
});
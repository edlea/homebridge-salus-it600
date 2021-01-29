"use strict";

const PLUGIN_NAME = "homebridge-salus-it600";
const PLATFORM_NAME = "Salus-iT600";

const Salus = require("salus-it600");
let Accessory, Service, SalusThermostatAccessory, uuid;

class SalusPlatform {
  constructor(log, config, api) {
    log.debug("Starting Salus iT600");
    this.log = log;
    this.api = api;
    this.salus = new Salus(config);
    this.accessories = new Map();

    api.on("didFinishLaunching", async () => {
      const devices = await this.salus.devices();

      // Create new accessories
      devices.forEach((device) => {
        this.log("Found [%s] %s", device.id, device.name);
        let accessory = this.accessories.get(device.id);
        if (accessory === undefined) {
          const platformAccessory = new Accessory(
            device.name,
            uuid.generate(device.id)
          );
          platformAccessory.addService(Service.Thermostat, device.name, 1);
          platformAccessory.context.device = device;
          accessory = new SalusThermostatAccessory(
            this.log,
            platformAccessory,
            this.salus,
            device
          );
          this.accessories.set(device.id, accessory);
          this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [
            platformAccessory,
          ]);
        } else {
          this.log(
            `Configuring cached thermostat [${device.id}] ${device.name}`
          );
          this.accessories.set(
            device.id,
            new SalusThermostatAccessory(
              this.log,
              accessory,
              this.salus,
              device
            )
          );
        }
      });
    });
  }

  configureAccessory(accessory) {
    this.accessories.set(accessory.context.device.id, accessory);
  }
}

module.exports = function (homebridge) {
  const exportedTypes = {
    Service: homebridge.hap.Service,
    Characteristic: homebridge.hap.Characteristic,
  };

  SalusThermostatAccessory = require("./thermostat")(exportedTypes);
  Accessory = homebridge.platformAccessory;
  Service = homebridge.hap.Service;
  uuid = homebridge.hap.uuid;

  homebridge.registerPlatform(PLATFORM_NAME, SalusPlatform);
};

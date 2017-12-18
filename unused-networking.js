#!/usr/bin/env node

var google = require('googleapis');
var process = require('process');

class UnusedResources {

  constructor(projectId) {
    this.projectId = projectId;
  }

  getComputeClient() {
    return new Promise((resolve, reject) => {
      google.auth.getApplicationDefault((err, authClient) => {
        if (err) callback(err, null);

        if (authClient.createScopedRequired && authClient.createScopedRequired()) {
          authClient = authClient.createScoped([
            'https://www.googleapis.com/auth/compute'
          ]);
        }

        var compute = google.compute({
          version: 'v1',
          auth: authClient
        });
        resolve(compute);
      });
    })
  }

  getAllRegions(compute) {
    return new Promise((resolve, reject) => {
      compute.regions.list({project:this.projectId}, (err, regions) => {
        if (err) callback(err, null);
        var regionNames = regions.items.map((r) => r.name);
        resolve({compute:compute, regions:regionNames})
      });
    });
  }
}

class UnusedNetworking extends UnusedResources {

  async getUnusedNetworking(compute, regions) {
    var unused_target_pools = await this._getUnusedTargetPools(compute, regions);
    var unused_forwarders = await this._getUnusedForwarders(compute, regions, unused_target_pools);
    return unused_target_pools;
  }

  async _getUnusedForwarders(compute, regions, unused_target_pools) {
    // TODO
  }

  async _getUnusedTargetPools(compute, regions) {
    var unused_target_pools = []

    //iterate over all regions
    for (let region of regions) {
      var pools = await this._listTargetPools(compute, region);
      if (pools) {
        for (let pool of pools) {
          var active_instances = [];
          if (pool.instances) {
            for (let instance of pool.instances) {
              var is_active = await this._isInstanceActive(compute, instance);
              if (is_active) {
                active_instances.push(instance);
              }
            }
          }
          //console.log(pool, active_instances);
          if (active_instances.length == 0) {
            unused_target_pools.push(pool.name);
          }
        }
      }
    }
    return unused_target_pools;
  }

  _isInstanceActive(compute, uri) {
    return new Promise((resolve, reject) => {
      var components = uri.split('/');
      compute.instances.get({
          project:this.projectId,
          zone:components[8],
          instance:components[10]
      }, (err, instance) => {
        if (err) {
          resolve(false);
        }
        resolve(true);
      });
    })
  }

  _listTargetPools(compute, region) {
    return new Promise((resolve, reject) => {
      compute.targetPools.list({
        project:this.projectId,
        region:region
      }, (err, pools) => {
        resolve(pools.items)
      })
    });
  }
}

if (!module.parent) {
  var networking = new UnusedNetworking(process.argv[2])

  networking.getComputeClient()
    .then((compute) => {
      return networking.getAllRegions(compute);
    }).then((args) => {
      return networking.getUnusedNetworking(args.compute, args.regions);
    }).then((results) => {
      // TODO: Deal with unused networking
      console.log("Unused Target Pools:", results);
    });
}

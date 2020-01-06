<template>
  <div id="all">
    
    <MglMap 
    
      :accessToken="accessToken" 
      :mapStyle="mapStyle"
      :center.sync="MapCenter"
      :zoom="MapZoom"
      :speed="MapSpeed" 
      :pitch="MapPitch"
      :bearing="MapBearing"
      :antialias="MapAntialias"
      @load="onMapLoaded"
    >

      <!--MglMarker 
        :coordinates="MapCenter" 
        color="blue" 
      /-->
      <div 
        class="data-layer"
        v-for="(ds, i) in datasets"
        :key="ds.id"
      >
        <div v-if="ds.marker.enable">
          <MglMarker 
            v-for="item in currentData[i]" 
            :key="item[0]" 
            :coordinates="item.coor" 
            color="blue" 
          >

            <template slot="marker">
              <div v-if="ds.marker.type == 2">
                <img
                  :src="ds.marker.src"
                  :ref="item[0]"
                  :style="ds.marker.rotate ? 'transform: rotate(' + item[ds.marker.rotateSrc] + 'deg)' : ''"
                  :width="ds.marker.size"
                  />
              </div>
            </template>

            <div v-if="ds.popup.enable">
              <MglPopup
                :closeButton="true"
                :offset="[0, -20]">
                <div>
                  <ul>
                    <li 
                      v-for="(ps, index) in ds.popup.display" 
                      :key="index">
                      
                      {{ ds.struct.data[ps].displayName + ': ' + ds.struct.data[ps].front + item[ps] + ds.struct.data[ps].end}}

                    </li>
                  </ul>
                </div>
              </MglPopup>
            </div>
          
          </MglMarker>
        </div>
      
      </div>
      

      

    </MglMap>

    


    <div id="panel">
      <button v-on:click="enable3D()">3D</button>
    </div>

    <div id="loading" v-if="isLoading">
      <img src="../assets/loading.svg" alt="loading">
    </div>
  </div>
  

</template>

<script>
import Mapbox from "mapbox-gl";
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { MglMap, MglMarker, MglPopup } from "vue-mapbox";
import { genGet } from '../request'
//import { timeConverter } from '../utils'

import { CONF } from "../Conf"

export default {
  components: {
    MglMap,
    MglMarker,
    MglPopup
  },
  data() {
    return {

      // Data Sets
      datasets: Array,
      
      // Save For Global Access
      updateIntervals: Array,
      currentData: [],
      isLoading: true,
      buildingLayerID: 0,

      // Mapbox Basic Global Conf
      accessToken: CONF.MAPBOX.token, 
      mapStyle: CONF.MAPBOX.style,

      // Panel Config
      view3D: false,

      // Map 2D
      Def_MapPitch: 0,
      Def_Bearing: 0,

      // Map 3D
      MapPitch3D: 45,
      MapBearing3D: -17.6,

      // Map Default Config
      MapCenter: {lat: 51.5287718, lon: -0.2416819},
      MapZoom: 7,
      MapSpeed: 1,
      MapPitch: this.Def_MapPitch,
      MapBearing: this.Def_Bearing,
      MapAntialias: false,

      coor: [55.952, -3.188]
      
    };
  },

  created() {

    this.mapbox = Mapbox;
    this.map = null

    this.retrieveDataSets((datasets)=>{
      this.parseDatasets(datasets)
    })

    
  },
  methods:{
    onMapLoaded(event) {

      // in component
      this.map = event.map;
      this.building3D()
      //this.addModel()
      //this.$store.map = event.map;

    },

    // Retrieve Datasets Config
    retrieveDataSets(callback){
      const that = this
      const ds = []
      genGet("./datasets.json", "", (res)=>{
        if(res.status){
          for(var i=0;i<res.data.length;i++){
            if(res.data[i].enable){
              ds.push(res.data[i])
            }
          }
          that.datasets = ds
          callback(ds)
        }
        
      })
    },

    // Read Datasets
    parseDatasets(datasets){
      
      var that = this

      datasets.forEach((dataset, index) => {
        
        if(dataset.config.mode === "live"){
          
          if(dataset.source.type === "restful"){
            
            if(dataset.source.api.length > 0){
              
              if(dataset.source.keepUpdate){
                setInterval(()=>{
                  that.retrieveData({
                    api: dataset.source.api,
                    parms: dataset.source.parms,
                    dataHead: dataset.source.dataHead
                  }, index)
                  
                }, dataset.source.every * 1000)

                //that.updateIntervals.$set(index, updating)
              }
              
            } else {
              console.log("Invaild API Request Format")
            }
          }
        }
      });
    },

    // Retrieve Live Data Feed
    retrieveData(config, index) {

      /*config = {
        api: null,
        parms: [],
        dataHead: null
      }*/

      this.isLoading = true

      if(config.api){

        var res

        genGet(config.api, config.parms, (result)=>{

          if(result.status){
            if(config.dataHead){
              res = result.data[config.dataHead]
            } else {
              res = result
            }

            for(var i=0;i<res.length;i++){
              res[i].coor = [res[i][5], res[i][6]]
            }
            
            if(this.currentData[index]){
              this.$set(this.currentData,index, res)
            } else {
              this.currentData.push(res)
            }
            
            //this.addToCData(res)
            
          } else {
            console.log("Data Retrieve Fail: " + result.error)
          }
          
        })

        this.isLoading = false
      }
    },

    enable3D(){
      if(!this.view3D){
        this.MapPitch = this.MapPitch3D
        this.MapBearing = this.MapBearing3D
      } else {
        this.MapPitch = this.Def_MapPitch
        this.MapBearing = this.Def_Bearing
      }
      this.view3D = !this.view3D
    },

    // Experimental function adding a 3D model into the map
    building3D() {

      // Insert the layer beneath any symbol layer.
      var layers = this.map.getStyle().layers;
      
      for (var i = 0; i < layers.length; i++) {
        if (layers[i].type === 'symbol' && layers[i].layout['text-field']) {
          this.buildingLayerID = layers[i].id;
          break;
        }
      }

      this.map.addLayer(
        {
          'id': '3d-buildings',
          'source': 'composite',
          'source-layer': 'building',
          'filter': ['==', 'extrude', 'true'],
          'type': 'fill-extrusion',
          'minzoom': 15,
          'paint': {
            'fill-extrusion-color': '#aaa',
            
            // use an 'interpolate' expression to add a smooth transition effect to the
            // buildings as the user zooms in
            'fill-extrusion-height': [
              'interpolate',
              ['linear'],
              ['zoom'],
              15,
              0,
              15.05,
              ['get', 'height']
            ],
            'fill-extrusion-base': [
              'interpolate',
              ['linear'],
              ['zoom'],
              15,
              0,
              15.05,
              ['get', 'min_height']
            ],
            'fill-extrusion-opacity': 0.6
          }
        },
        this.buildingLayerID
      )
    },

    addModel(){

      // parameters to ensure the model is georeferenced correctly on the map
      var modelOrigin = [-1.2532284, 51.7484376];
      var modelAltitude = 3;
      var modelRotate = [Math.PI / 2, 0, 0];
      
      var modelAsMercatorCoordinate = this.mapbox.MercatorCoordinate.fromLngLat(
        modelOrigin,
        modelAltitude
      );
      
      // transformation parameters to position, rotate and scale the 3D model onto the map
      var modelTransform = {
        translateX: modelAsMercatorCoordinate.x,
        translateY: modelAsMercatorCoordinate.y,
        translateZ: modelAsMercatorCoordinate.z,
        rotateX: modelRotate[0],
        rotateY: modelRotate[1],
        rotateZ: modelRotate[2],
        scale: modelAsMercatorCoordinate.meterInMercatorCoordinateUnits()
      }

      var customLayer = {
        id: '3d-model',
        type: 'custom',
        renderingMode: '3d',

        onAdd: function(map, gl) {
          
          this.camera = new THREE.Camera();
          this.scene = new THREE.Scene();
          
          // create two three.js lights to illuminate the model
          var directionalLight = new THREE.DirectionalLight(0xffffff);
          directionalLight.position.set(0, -70, 100).normalize();
          this.scene.add(directionalLight);
          
          var directionalLight2 = new THREE.DirectionalLight(0xffffff);
          directionalLight2.position.set(0, 70, 100).normalize();
          this.scene.add(directionalLight2);
          
          // use the three.js FBX loader to add the 3D model to the three.js scene
          var loader = new FBXLoader();
            loader.load(
              './assets/models/plane.fbx',
              function(obj) {
                this.scene.add(obj);
              }.bind(this)
            );
          
          // use the Mapbox GL JS map canvas for three.js
          this.renderer = new THREE.WebGLRenderer({
            canvas: map.getCanvas(),
            context: gl,
            antialias: true
          });
          
          this.renderer.autoClear = false;
        },
        render: function(gl, matrix) {
          var rotationX = new THREE.Matrix4().makeRotationAxis(
            new THREE.Vector3(1, 0, 0),
            modelTransform.rotateX
          );
          var rotationY = new THREE.Matrix4().makeRotationAxis(
            new THREE.Vector3(0, 1, 0),
            modelTransform.rotateY
          );
          var rotationZ = new THREE.Matrix4().makeRotationAxis(
            new THREE.Vector3(0, 0, 1),
            modelTransform.rotateZ
          );
        
          var m = new THREE.Matrix4().fromArray(matrix);
          var l = new THREE.Matrix4()

          .makeTranslation(
            modelTransform.translateX,
            modelTransform.translateY,
            modelTransform.translateZ
          )
          .scale(
            new THREE.Vector3(
              modelTransform.scale,
              -modelTransform.scale,
              modelTransform.scale
            )
          )
          .multiply(rotationX)
          .multiply(rotationY)
          .multiply(rotationZ);
          
          this.camera.projectionMatrix = m.multiply(l);
          this.renderer.state.reset();
          this.renderer.render(this.scene, this.camera);
          //this.map.triggerRepaint();
        }
      }
      this.map.addLayer(customLayer, 'waterway-label');
    },

    // Not working and cannot be async
    replaceWording (source, val) {
      var res = val
      if(val == null || val == "" || !val){
        return val
      } else {
        val = val.toString()
      }

      for(var i=0;i<source.length;i++){
        if(val == source[i].from){
          res = source[i].to
        }
      }
      return res
    }
  }
};
</script>

<style scoped>

@keyframes spin {
    from {transform:rotate(0deg);}
    to {transform:rotate(360deg);}
}

#all{
  width: 100%;
  height: 100%;
}

#panel{
  top: 10px;
  right: 20px;
  position: fixed;
}

#loading{
  top: 10px;
  left: 20px;
  position: fixed;
  z-index: 9999;
}

#loading img{
  width: 20px;
  animation: spin 1s infinite;
}
</style>
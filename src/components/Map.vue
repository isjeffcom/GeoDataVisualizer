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
      />


      <div id="panel">
        <button v-on:click="enable3D()">Enable 3D</button>
      </div>
  </div>
  

</template>

<script>
import Mapbox from "mapbox-gl";
import { MglMap } from "vue-mapbox";

import {CONF} from "../Conf"

export default {
  components: {
    MglMap
  },
  data() {
    return {
      // Save Map For Global Access
      map: Object,
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
      MapCenter: {lat: 55.952, lon: -3.188},
      MapZoom: 15,
      MapSpeed: 1,
      MapPitch: this.Def_MapPitch,
      MapBearing: this.Def_Bearing,
      MapAntialias: false,

      
    };
  },

  created() {
    // We need to set mapbox-gl library here in order to use it in template
    this.mapbox = Mapbox;
    //console.log(this.mapbox.getCenter())
    
  },
  methods:{
    onMapLoaded(event) {
      
      // in component
      this.map = event.map;

    },
    enable3D() {

      if(!this.view3D){
        this.MapPitch = this.MapPitch3D
        this.MapBearing = this.MapBearing3D

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
        

        

      } else {
        this.MapPitch = this.Def_MapPitch
        this.MapBearing = this.Def_Bearing
        this.map.removeLayer(this.buildingLayerID)
      }

      this.view3D = !this.view3D
    }
  }
};
</script>

<style scoped>
#all{
  width: 100%;
  height: 100%;
}

#panel{
  top: 10px;
  right: 10px;
  position: fixed;
}
</style>
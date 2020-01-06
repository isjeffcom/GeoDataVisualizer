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

      <MglMarker 
        v-for="item in tempData" 
        :key="item[0]" 
        :coordinates="item.coor" 
        color="blue" 
      >

        <template slot="marker">
          <div>
            <img
              src="../assets/plane.svg"
              :ref="item[0]"
              :style="'transform: rotate(' + item[10] + 'deg)'"
              width="20"
              height="20"
              />
          </div>
        </template>

        <MglPopup
          :closeButton="true"
          :offset="[0, -20]">
          <div>
            <ul>
              <li>ICAO Address: {{ item[0] }} </li>
              <li>Callsign: {{ item[1] }} </li>
              <li>On Ground: {{ item[8] ? "Yes" : "No" }} </li>
              <li>Longitude: {{ item[5] }} </li>
              <li>Latitude: {{ item[6] }} </li>
              <li>Direction: {{ item[9] }} </li>
              <li>Baro Altitude: {{ item[7] }} </li>
              <li>Geo Altitude: {{ item[13] }} </li>
              <li>Velocity: {{item[9]}} </li>
              <li>Vertical Rate: {{ item[11] }} </li>
              <li>Transponder Code: {{ item[14] }} </li>
              <!--li>Position Update: {{ this.timeConverter(item[3]) }} </li>
              <li>Last Contact: {{ this.timeConverter(item[4]) }} </li-->
            </ul>
          </div>
        </MglPopup>
      
      </MglMarker>

      

    </MglMap>

    


    <div id="panel">
      <button v-on:click="enable3D()">Enable 3D</button>
    </div>
  </div>
  

</template>

<script>
import Mapbox from "mapbox-gl";
import { MglMap, MglMarker, MglPopup } from "vue-mapbox";
import { genGet } from '../request'
import { timeConverter } from '../utils'

import { CONF } from "../Conf"

export default {
  components: {
    MglMap,
    MglMarker,
    MglPopup
  },
  data() {
    return {
      // Save For Global Access
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

      tempData:[],
      coor: [55.952, -3.188]
      
    };
  },

  watch: {
    /*tempData: function () {
      //this.map.resize();
      this.tempData.forEach(el => {
        const $ref = this.$refs[el[0]]
        if($ref && $ref.length > 0){
          $ref[0].style.transform = `rotate(${el[10]}deg)`
        }
        
      });
    },*/
  },

  created() {

    this.map = null

    setInterval(()=>{
      this.retrieveData({
        api: "https://opensky-network.org/api/states/all",
        parms:[
          {
            name: "lamin",
            val: "49.458362"
          },
          {
            name: "lamax",
            val: "59.831400"
          },
          {
            name: "lomin",
            val: "-11.14"
          },
          {
            name: "lomax",
            val: "1.58"
          }
        ],
        dataHead: "states"
      })
    }, 4000)

    
    //console.log(this.mapbox.getCenter())
    
  },
  methods:{
    onMapLoaded(event) {

      // in component
      this.map = event.map;
      //this.$store.map = event.map;

    },

    retrieveData(config) {

      /*config = {
        api: null,
        parms: [],
        dataHead: null
      }*/
      if(config.api){
        
        genGet(config.api, config.parms, (result)=>{

          var res

          if(result.status){
            if(config.dataHead){
              res = result.data[config.dataHead]
            } else {
              res = result
            }

            for(var i=0;i<res.length;i++){
              res[i].coor = [res[i][5], res[i][6]]
            }
            

            this.tempData = res

            console.log("Data Retrieved")
          }
          
        })
      }
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
<template>
  <div id="app">
    <div id="map-cont">
      <Map></Map>
    </div>
    
  </div>
</template>

<script>
import Map from './components/Map.vue'

export default {
  name: 'app',
  components: {
    Map
  }
}
</script>

<style>
body{
  padding: 0;
  margin: 0;
}

#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: #222;
  height: 100%;
  width: 100%;
  overflow: hidden;
  position: fixed;
}

#map-cont{
  width: 100%;
  height: 100%;
}

#map-cont canvas{
  width: 100%;
}


</style>

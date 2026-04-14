<template>
  <div ref="mapRef" class="app-map" :style="{ height: height || '300px' }" />
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import type { MapMarker } from '@asoode/shared';

const props = defineProps<{
  markers?: MapMarker[];
  center?: MapMarker;
  height?: string;
}>();

const mapRef = ref<HTMLElement>();
let mapInstance: any = null;

onMounted(async () => {
  try {
    const { Map, View } = await import('ol');
    const { Tile: TileLayer } = await import('ol/layer');
    const { OSM } = await import('ol/source');
    const { fromLonLat } = await import('ol/proj');

    const centerCoord = props.center?.location
      ? fromLonLat([props.center.location.longitude, props.center.location.latitude])
      : fromLonLat([51.389, 35.6892]); // Tehran default

    mapInstance = new Map({
      target: mapRef.value!,
      layers: [new TileLayer({ source: new OSM() })],
      view: new View({ center: centerCoord, zoom: 13 }),
    });
  } catch (e) {
    console.warn('OpenLayers not available', e);
  }
});

onBeforeUnmount(() => {
  mapInstance?.setTarget(undefined);
});
</script>

<style scoped>
.app-map {
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
}
</style>

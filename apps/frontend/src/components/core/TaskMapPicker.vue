<template>
  <div class="tmp">
    <div ref="mapRef" class="tmp__map" :style="{ height: height || '200px' }"></div>
    <div v-if="currentLat !== null && currentLng !== null" class="tmp__coords">
      <i class="mdi mdi-map-marker"></i>
      <span>{{ currentLat.toFixed(5) }}, {{ currentLng.toFixed(5) }}</span>
    </div>
    <div v-else class="tmp__hint">
      <i class="mdi mdi-cursor-default-click-outline"></i>
      <span>{{ $t('CLICK_TO_SELECT') }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';

const props = withDefaults(defineProps<{
  latitude?: number;
  longitude?: number;
  height?: string;
  readonly?: boolean;
}>(), {
  readonly: false,
});

const emit = defineEmits<{
  'update:location': [value: { latitude: number; longitude: number }];
}>();

const mapRef = ref<HTMLElement>();
const currentLat = ref<number | null>(props.latitude ?? null);
const currentLng = ref<number | null>(props.longitude ?? null);

let mapInstance: any = null;
let markerLayer: any = null;
let markerSource: any = null;

onMounted(async () => {
  try {
    const { Map, View, Feature } = await import('ol');
    const { Tile: TileLayer } = await import('ol/layer');
    const VectorLayerModule = await import('ol/layer/Vector');
    const { OSM } = await import('ol/source');
    const VectorSourceModule = await import('ol/source/Vector');
    const { Point } = await import('ol/geom');
    const { fromLonLat, toLonLat } = await import('ol/proj');
    const { Style, Circle: CircleStyle, Fill, Stroke } = await import('ol/style');

    const VectorLayer = VectorLayerModule.default;
    const VectorSource = VectorSourceModule.default;

    const centerLon = props.longitude ?? 51.389;
    const centerLat = props.latitude ?? 35.6892;
    const centerCoord = fromLonLat([centerLon, centerLat]);

    markerSource = new VectorSource();
    markerLayer = new VectorLayer({
      source: markerSource,
      style: new Style({
        image: new CircleStyle({
          radius: 8,
          fill: new Fill({ color: '#673AB7' }),
          stroke: new Stroke({ color: '#fff', width: 2 }),
        }),
      }),
    });

    mapInstance = new Map({
      target: mapRef.value!,
      layers: [
        new TileLayer({ source: new OSM() }),
        markerLayer,
      ],
      view: new View({
        center: centerCoord,
        zoom: props.latitude ? 15 : 12,
      }),
    });

    // Place initial marker if coords provided
    if (props.latitude != null && props.longitude != null) {
      placeMarker(props.longitude, props.latitude, fromLonLat, Feature, Point);
    }

    // Click handler
    if (!props.readonly) {
      mapInstance.on('click', (evt: any) => {
        const [lon, lat] = toLonLat(evt.coordinate);
        currentLat.value = lat;
        currentLng.value = lon;
        placeMarker(lon, lat, fromLonLat, Feature, Point);
        emit('update:location', { latitude: lat, longitude: lon });
      });
    }

    // Store refs for dynamic marker placement
    (mapInstance as any).__olRefs = { fromLonLat, Feature, Point };
  } catch (e) {
    console.warn('OpenLayers not available', e);
  }
});

function placeMarker(lon: number, lat: number, fromLonLat: any, Feature: any, Point: any) {
  if (!markerSource) return;
  markerSource.clear();
  const feature = new Feature({ geometry: new Point(fromLonLat([lon, lat])) });
  markerSource.addFeature(feature);
}

// Watch for prop changes
watch([() => props.latitude, () => props.longitude], ([newLat, newLng]) => {
  if (newLat != null && newLng != null && mapInstance) {
    currentLat.value = newLat;
    currentLng.value = newLng;
    const refs = (mapInstance as any).__olRefs;
    if (refs) {
      placeMarker(newLng, newLat, refs.fromLonLat, refs.Feature, refs.Point);
      const { fromLonLat } = refs;
      mapInstance.getView().animate({ center: fromLonLat([newLng, newLat]), duration: 300 });
    }
  }
});

onBeforeUnmount(() => {
  mapInstance?.setTarget(undefined);
});
</script>

<style scoped lang="scss">
@import '@/styles/variables';

.tmp {
  display: flex;
  flex-direction: column;
  gap: 6px;

  &__map {
    width: 100%;
    border-radius: $border-radius-md;
    overflow: hidden;
    border: 1px solid $divider;
    cursor: crosshair;
  }

  &__coords {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.72rem;
    color: $text-secondary;
    font-variant-numeric: tabular-nums;
    padding: 2px 0;

    i { font-size: 0.85rem; color: $primary; }
  }

  &__hint {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.7rem;
    color: $text-disabled;
    font-style: italic;
    padding: 2px 0;

    i { font-size: 0.85rem; }
  }
}
</style>

<!-- Dark mode -->
<style lang="scss">
body.dark-mode {
  .tmp__map { border-color: #555; }
  .tmp__coords { color: #999; i { color: #9575CD; } }
  .tmp__hint { color: #666; }
}
</style>

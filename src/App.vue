<template>
  <div id="app">
    <call-component></call-component>
  </div>
</template>

<script lang="ts">
import { mixins } from "vue-class-component";
import { Component, Vue } from "vue-property-decorator";
import ChimeComponent from "./mixins/chime";
import CallComponent from "./CallComponent.vue";

@Component({
  components: {
    CallComponent,
  },
})
export default class App extends mixins(ChimeComponent) {
  localVideoPoster = require("@/assets/poster.webp");
  mounted() {
    this.onCameraOrSoundDisabled();
    this.createMeeting();
  }
  connect() {
    this.$store.dispatch("joinMeetingAction", {
      callback: () => {
        //do nothing
      },
    });
  }
  async onCameraOrSoundDisabled() {
    const videoDevices = [];
    const audioDevices = [];
    const deviceList = await navigator.mediaDevices
      .enumerateDevices()
      .then((devices) => devices);
    const mediaDevicesList = JSON.parse(JSON.stringify(deviceList));
    mediaDevicesList.forEach((dev: any) => {
      if (dev.kind === "videoinput") videoDevices.push(dev);
      if (dev.kind === "audioinput") audioDevices.push(dev);
    });
    // Busca el estado de los permisos
    const cam = "camera";
    const cameraPermission = await navigator.permissions.query({
      name: cam,
    });
    const mic = "microphone";
    const microphonePermission = await navigator.permissions.query({
      name: mic,
    });
  }
}
</script>

<style></style>
